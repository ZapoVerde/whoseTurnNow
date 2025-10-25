/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useTurnLifecycleActions.spec.ts
 * @stamp {"ts":"2025-10-25T14:50:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useTurnLifecycleActions.ts
 *
 * @description
 * Verifies the orchestration logic of the `useTurnLifecycleActions` hook. This
 * suite ensures that user actions correctly trigger optimistic state updates
 * and invoke the appropriate repository functions with the correct parameters
 * for completing, skipping, and undoing turns.
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

// --- Imports ---
import { useTurnLifecycleActions } from './useTurnLifecycleActions';
import { groupsRepository } from '../repository';
import { useGroupStore } from '../useGroupStore';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnCompletedLog, TurnParticipant } from '../../../types/group';

// --- Test Setup ---
const mockCompleteTurn = vi.mocked(groupsRepository.completeTurnTransaction);
const mockSkipTurn = vi.mocked(groupsRepository.skipTurnTransaction);
const mockUndoTurn = vi.mocked(groupsRepository.undoTurnTransaction);
const mockSetGroup = vi.fn();

const mockUser: AppUser = { uid: 'user-bob', displayName: 'Bob', isAnonymous: false };
const mockGroup: Group = {
  gid: 'group-1', name: 'Test Group', icon: '🧪', ownerUid: 'owner',
  participants: [
    { id: 'p-alice', uid: 'user-alice', role: 'member', turnCount: 5, nickname: 'Alice' },
    { id: 'p-bob', uid: 'user-bob', role: 'member', turnCount: 4, nickname: 'Bob' },
  ],
  turnOrder: ['p-alice', 'p-bob'],
  participantUids: { 'user-alice': true, 'user-bob': true },
  adminUids: {},
};
const mockUndoableAction: TurnCompletedLog & { id: string } = {
  id: 'log-1', type: 'TURN_COMPLETED', participantId: 'p-alice'
} as any;

describe('useTurnLifecycleActions', () => {
  let mockSetIsSubmitting: ReturnType<typeof vi.fn>;
  let mockSetFeedback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetIsSubmitting = vi.fn();
    mockSetFeedback = vi.fn();
    vi.mocked(useGroupStore.getState).mockReturnValue({ setGroup: mockSetGroup } as any);
  });

  const renderTestHook = (isUserTurn: boolean) => {
    const orderedParticipants = isUserTurn
      ? mockGroup.participants.slice().reverse() // Bob is first
      : mockGroup.participants; // Alice is first

    const props = {
      groupId: mockGroup.gid,
      group: mockGroup,
      user: mockUser,
      currentUserParticipant: mockGroup.participants[1] as TurnParticipant, // Bob's record
      isUserTurn,
      orderedParticipants,
      undoableAction: mockUndoableAction,
      setIsSubmitting: mockSetIsSubmitting,
      setFeedback: mockSetFeedback,
    };
    return renderHook(() => useTurnLifecycleActions(props));
  };

  describe('handleTurnAction', () => {
    it('should complete turn for the current user when it is NOT their turn (Take My Turn)', async () => {
      // ARRANGE
      const { result } = renderTestHook(false); // It's Alice's turn
      mockCompleteTurn.mockResolvedValue(undefined);

      // ACT
      await act(async () => {
        result.current.handleTurnAction();
      });

      // ASSERT
      expect(mockSetGroup).toHaveBeenCalledTimes(1); // Optimistic update
      expect(mockCompleteTurn).toHaveBeenCalledWith(mockGroup.gid, mockUser, 'p-bob');
    });

    it('should complete turn for the next participant when it IS the user`s turn', async () => {
      // ARRANGE
      const { result } = renderTestHook(true); // It's Bob's turn
      mockCompleteTurn.mockResolvedValue(undefined);
      
      // ACT
      await act(async () => {
        result.current.handleTurnAction();
      });

      // ASSERT
      expect(mockSetGroup).toHaveBeenCalledTimes(1); // Optimistic update
      expect(mockCompleteTurn).toHaveBeenCalledWith(mockGroup.gid, mockUser, 'p-bob');
    });

    it('should revert the optimistic update on repository failure', async () => {
      // ARRANGE
      const { result } = renderTestHook(true);
      mockCompleteTurn.mockRejectedValue(new Error('DB Error'));

      // ACT
      await act(async () => {
        result.current.handleTurnAction();
      });

      // ASSERT
      expect(mockSetGroup).toHaveBeenCalledTimes(2); // Optimistic update, then revert
      expect(mockSetGroup).toHaveBeenLastCalledWith(mockGroup); // Reverted to original
      expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'Failed to complete turn.', severity: 'error' });
    });
  });

  describe('handleSkipTurn', () => {
    it('should call skipTurnTransaction and manage submitting state', async () => {
      // ARRANGE
      const { result } = renderTestHook(true); // It's Bob's turn, so orderedParticipants[0] is Bob
      mockSkipTurn.mockResolvedValue(undefined);

      // ACT
      await act(async () => {
        result.current.handleSkipTurn();
      });

      // ASSERT
      expect(mockSkipTurn).toHaveBeenCalledWith(mockGroup.gid, mockUser, 'p-bob');
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
    });
  });

  describe('handleConfirmUndo', () => {
    it('should call undoTurnTransaction and manage submitting state', async () => {
      // ARRANGE
      const { result } = renderTestHook(false);
      mockUndoTurn.mockResolvedValue(undefined);

      // ACT
      await act(async () => {
        result.current.handleConfirmUndo();
      });

      // ASSERT
      expect(mockUndoTurn).toHaveBeenCalledWith(mockGroup.gid, mockUser, mockUndoableAction);
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
      expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'Last turn successfully undone.', severity: 'success' });
    });
  });
});