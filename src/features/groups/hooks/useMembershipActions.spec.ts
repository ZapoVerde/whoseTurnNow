/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useMembershipActions.spec.ts
 * @stamp {"ts":"2025-10-25T14:55:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useMembershipActions.ts
 *
 * @description
 * Verifies the orchestration logic of the `useMembershipActions` hook. This suite
 * ensures that all participant and membership management actions correctly trigger
 * optimistic updates where applicable and invoke the appropriate repository
 * functions with the correct parameters.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('../repository');
vi.mock('../useGroupStore');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// --- Imports ---
import { useMembershipActions } from './useMembershipActions';
import { groupsRepository } from '../repository';
import { useGroupStore } from '../useGroupStore';
import { useNavigate } from 'react-router-dom';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

// --- Test Setup ---
const mockAddParticipant = vi.mocked(groupsRepository.addManagedParticipant);
const mockUpdateRole = vi.mocked(groupsRepository.updateParticipantRole);
const mockRemoveParticipant = vi.mocked(groupsRepository.removeParticipant);
const mockLeaveGroup = vi.mocked(groupsRepository.leaveGroup);
const mockAdminCompleteTurn = vi.mocked(groupsRepository.completeTurnTransaction);
const mockSetGroup = vi.fn();
const mockNavigate = vi.fn();

const mockUser: AppUser = { uid: 'user-admin', displayName: 'Admin User', isAnonymous: false };
const mockGroup: Group = {
  gid: 'group-1', name: 'Test Group', icon: '🧪', ownerUid: 'owner',
  participants: [
    { id: 'p-alice', uid: 'user-alice', role: 'member', turnCount: 5, nickname: 'Alice' },
  ],
  turnOrder: ['p-alice'],
  participantUids: { 'user-alice': true },
  adminUids: {},
};

describe('useMembershipActions', () => {
  let mockSetIsSubmitting: ReturnType<typeof vi.fn>;
  let mockSetFeedback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetIsSubmitting = vi.fn();
    mockSetFeedback = vi.fn();
    vi.mocked(useGroupStore.getState).mockReturnValue({ setGroup: mockSetGroup } as any);
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const renderTestHook = () => {
    const props = {
      groupId: mockGroup.gid,
      group: mockGroup,
      user: mockUser,
      setIsSubmitting: mockSetIsSubmitting,
      setFeedback: mockSetFeedback,
    };
    return renderHook(() => useMembershipActions(props));
  };

  it('should handle adding a participant optimistically', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockAddParticipant.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleAddParticipant('New Member');
    });

    // ASSERT
    expect(mockSetGroup).toHaveBeenCalledTimes(1); // Optimistic update
    expect(mockAddParticipant).toHaveBeenCalledWith(mockGroup.gid, 'New Member');
  });

  it('should call updateParticipantRole', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockUpdateRole.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleRoleChange('p-alice', 'admin');
    });

    // ASSERT
    expect(mockUpdateRole).toHaveBeenCalledWith(mockGroup.gid, 'p-alice', 'admin');
  });

  it('should call removeParticipant and manage submitting state', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockRemoveParticipant.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleRemoveParticipant('p-alice');
    });

    // ASSERT
    expect(mockRemoveParticipant).toHaveBeenCalledWith(mockGroup.gid, 'p-alice');
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
  });

  it('should call leaveGroup, manage submitting state, and navigate on success', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockLeaveGroup.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleLeaveGroup();
    });

    // ASSERT
    expect(mockLeaveGroup).toHaveBeenCalledWith(mockGroup.gid, mockUser.uid);
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalledWith('/');
    // setIsSubmitting(false) is not called on success because we navigate away
  });

  it('should handle an admin completing a turn for another participant', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockAdminCompleteTurn.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleAdminCompleteTurn('p-alice');
    });
    
    // ASSERT
    expect(mockSetGroup).toHaveBeenCalledTimes(1); // Optimistic update
    expect(mockAdminCompleteTurn).toHaveBeenCalledWith(mockGroup.gid, mockUser, 'p-alice');
  });
});