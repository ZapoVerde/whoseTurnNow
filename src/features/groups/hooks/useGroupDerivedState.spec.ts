/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDerivedState.spec.ts
 * @stamp {"ts":"2025-10-25T13:35:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useGroupDerivedState.ts
 *
 * @description
 * Unit tests for the core business logic derivations in the `useGroupDerivedState`
 * hook. This suite verifies that all calculated properties (e.g., isAdmin,
 * isUserTurn, undoableAction) are correct for a variety of input states.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: none
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGroupDerivedState } from './useGroupDerivedState';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnCompletedLog } from '../../../types/group';

// --- Test Data ---
const adminUser: AppUser = { uid: 'user-admin', displayName: 'Admin Global', isAnonymous: false };
const memberUser: AppUser = { uid: 'user-member', displayName: 'Member Global', isAnonymous: false };

const mockGroup: Group = {
  gid: 'group-1',
  name: 'Test Group',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [
    { id: 'p-admin', uid: 'user-admin', role: 'admin', turnCount: 5, nickname: 'Admin Local' },
    { id: 'p-member', uid: 'user-member', role: 'member', turnCount: 4, nickname: 'Member Local' },
    { id: 'p-other', uid: 'user-other', role: 'member', turnCount: 3, nickname: 'Other' },
  ],
  turnOrder: ['p-member', 'p-admin', 'p-other'],
  participantUids: { 'user-admin': true, 'user-member': true, 'user-other': true },
  adminUids: { 'user-admin': true },
};

// Add the missing properties to satisfy the complete TurnCompletedLog type.
const mockCompletedLog: TurnCompletedLog & { id: string } = {
  id: 'log-1',
  type: 'TURN_COMPLETED',
  completedAt: {} as any,
  participantId: 'p-other',
  participantName: 'Other',
  actorUid: 'user-other',
  actorName: 'Other',
  _participantUids: mockGroup.participantUids, // Use realistic data.
  _adminUids: mockGroup.adminUids,           // Use realistic data.
};

describe('useGroupDerivedState', () => {
  describe('Permission & Role Derivations', () => {
    it('should correctly identify the current user as an admin', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, []));
      expect(result.current.isAdmin).toBe(true);
    });

    it('should correctly identify a non-admin user', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, memberUser, []));
      expect(result.current.isAdmin).toBe(false);
    });

    it('should identify when a user is the last admin', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, []));
      expect(result.current.isLastAdmin).toBe(true);
    });
  });

  describe('Turn & Order Derivations', () => {
    it('should correctly determine when it is the user`s turn', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, memberUser, []));
      expect(result.current.isUserTurn).toBe(true);
    });

    it('should correctly determine when it is NOT the user`s turn', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, []));
      expect(result.current.isUserTurn).toBe(false);
    });

    it('should correctly order participants based on `turnOrder`', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, []));
      const orderedIds = result.current.orderedParticipants.map(p => p.id);
      expect(orderedIds).toEqual(['p-member', 'p-admin', 'p-other']);
    });

    it('should hydrate the current user`s nickname with their global displayName', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, []));
      const currentUserInList = result.current.orderedParticipants.find(p => p.uid === adminUser.uid);
      expect(currentUserInList?.nickname).toBe('Admin Global');
    });
  });

  describe('Undoable Action Derivations', () => {
    it('should return the most recent completable log for an admin', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, [mockCompletedLog]));
      expect(result.current.undoableAction).toEqual(mockCompletedLog);
    });

    it('should return null for undoableAction if the user is not an admin', () => {
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, memberUser, [mockCompletedLog]));
      expect(result.current.undoableAction).toBeNull();
    });

    it('should return null if the most recent log has already been undone', () => {
      const undoneLog = { ...mockCompletedLog, isUndone: true };
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, [undoneLog]));
      expect(result.current.undoableAction).toBeNull();
    });

    it('should return null if there are no completable logs in the history', () => {
      const nonCompletableLog = { id: 'log-2', type: 'COUNTS_RESET' } as any;
      const { result } = renderHook(() => useGroupDerivedState(mockGroup, adminUser, [nonCompletableLog]));
      expect(result.current.undoableAction).toBeNull();
    });
  });
});