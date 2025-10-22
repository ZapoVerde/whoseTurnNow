/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.spec.ts
 * @stamp {"ts":"2025-10-21T19:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 *
 * @description
 * Unit tests for the `useGroupDetail` hook. This suite verifies all derived
 * state logic (e.g., permissions, undoable actions) and ensures that action
 * handlers correctly invoke their corresponding repository functions.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, High Fan-Out)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the hook's output and mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../useGroupStore');
vi.mock('../../auth/useAuthStore');
vi.mock('../groupsRepository');

// --- Imports ---
import { useGroupDetail } from './useGroupDetail';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import * as groupsRepository from '../groupsRepository';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnCompletedLog } from '../../../types/group';

// --- Test Setup ---
const mockUseGroupStore = useGroupStore as unknown as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;
const mockUndoTurnTransaction = vi.mocked(groupsRepository.undoTurnTransaction);

// --- Mock Data ---
const mockAdminUser: AppUser = { uid: 'user-admin', displayName: 'Admin', isAnonymous: false };
const mockMemberUser: AppUser = { uid: 'user-member', displayName: 'Member', isAnonymous: false };
const mockOtherUser: AppUser = { uid: 'user-other', displayName: 'Other', isAnonymous: false };

const mockBaseGroup: Group = {
  gid: 'group-1',
  name: 'Test Group',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [
    { id: 'p-admin', uid: 'user-admin', role: 'admin', turnCount: 5, nickname: 'Admin' },
    { id: 'p-member', uid: 'user-member', role: 'member', turnCount: 3, nickname: 'Member' },
  ],
  turnOrder: ['p-member', 'p-admin'], // Member's turn
  participantUids: ['user-admin', 'user-member'],
};

describe('useGroupDetail', () => {
  // Helper to set up the mock stores for a given test scenario
  const setupMocks = (
    user: AppUser | null,
    group: Group | null,
    turnLog: (TurnCompletedLog & { id: string })[] = [],
  ) => {
    mockUseAuthStore.mockReturnValue(user);
    mockUseGroupStore.mockReturnValue({
      group,
      turnLog,
      isLoading: false,
      loadGroupAndLog: vi.fn(),
      cleanup: vi.fn(),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call loadGroupAndLog on mount and cleanup on unmount', () => {
    setupMocks(mockAdminUser, mockBaseGroup);
    const { unmount } = renderHook(() => useGroupDetail('group-1'));

    expect(mockUseGroupStore().loadGroupAndLog).toHaveBeenCalledWith('group-1');
    unmount();
    expect(mockUseGroupStore().cleanup).toHaveBeenCalledTimes(1);
  });

  describe('Derived State Calculation', () => {
    it('should correctly identify when the current user is an admin', () => {
      setupMocks(mockAdminUser, mockBaseGroup);
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.isAdmin).toBe(true);
    });

    it('should correctly identify when the current user is not an admin', () => {
      setupMocks(mockMemberUser, mockBaseGroup);
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.isAdmin).toBe(false);
    });

    it('should correctly identify when it is the current user\'s turn', () => {
      setupMocks(mockMemberUser, mockBaseGroup); // It's the member's turn in mock data
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.isUserTurn).toBe(true);
    });

    it('should correctly identify when it is NOT the current user\'s turn', () => {
      setupMocks(mockAdminUser, mockBaseGroup); // It's the member's turn
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.isUserTurn).toBe(false);
    });
  });

  describe('undoableAction Logic', () => {
    const mockLogEntry: TurnCompletedLog & { id: string } = {
      id: 'log-1',
      type: 'TURN_COMPLETED',
      participantId: 'p-member', // member's turn was completed
      actorUid: 'user-member',   // member was the actor
      isUndone: false,
      completedAt: {} as any,
      participantName: 'Member',
      actorName: 'Member',
    };

    it('should return null if there are no completed, non-undone logs', () => {
      setupMocks(mockAdminUser, mockBaseGroup, [{ ...mockLogEntry, isUndone: true }]);
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.undoableAction).toBeNull();
    });

    it('should identify an action as undoable if the user is an admin', () => {
      setupMocks(mockAdminUser, mockBaseGroup, [mockLogEntry]);
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.undoableAction).toEqual(mockLogEntry);
    });

    it('should identify an action as undoable if the user was the actor', () => {
      setupMocks(mockMemberUser, mockBaseGroup, [mockLogEntry]); // User is the actor
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.undoableAction).toEqual(mockLogEntry);
    });

    it('should identify an action as undoable if the user was the subject of the turn', () => {
      // Scenario: Admin completes a turn FOR a member. Member should be able to undo.
      const logByAdmin: TurnCompletedLog & { id: string } = {
        ...mockLogEntry,
        actorUid: 'user-admin', // Admin was the actor
      };
      setupMocks(mockMemberUser, mockBaseGroup, [logByAdmin]); // Current user is the subject
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.undoableAction).toEqual(logByAdmin);
    });

    it('should return null if a non-involved user tries to undo', () => {
      setupMocks(mockOtherUser, mockBaseGroup, [mockLogEntry]); // "Other" user has no permissions
      const { result } = renderHook(() => useGroupDetail('group-1'));
      expect(result.current.undoableAction).toBeNull();
    });
  });

  describe('Action Handlers', () => {
    it('should call undoTurnTransaction when handleConfirm is triggered from undoDialog', async () => {
        const mockLogEntry: TurnCompletedLog & { id: string } = {
            id: 'log-1', type: 'TURN_COMPLETED', participantId: 'p-member',
            actorUid: 'user-member', isUndone: false, completedAt: {} as any,
            participantName: 'Member', actorName: 'Member',
        };
        setupMocks(mockAdminUser, mockBaseGroup, [mockLogEntry]);
        const { result } = renderHook(() => useGroupDetail('group-1'));

        // Ensure the hook has identified an action to undo
        expect(result.current.undoableAction).not.toBeNull();

        // ACT: Call the confirm handler from the dialog state object
        await act(async () => {
            // Note: handleConfirm also closes the dialog, which is the correct behavior.
            result.current.undoDialog.handleConfirm();
        });

        // ASSERT
        expect(mockUndoTurnTransaction).toHaveBeenCalledTimes(1);
        expect(mockUndoTurnTransaction).toHaveBeenCalledWith('group-1', mockAdminUser, mockLogEntry);
    });
  });
});