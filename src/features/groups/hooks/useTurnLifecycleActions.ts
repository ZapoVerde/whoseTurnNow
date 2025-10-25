/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useTurnLifecycleActions.ts
 * @stamp {"ts":"2025-10-25T15:00:00Z"}
 * @architectural-role Hook
 * @description
 * A specialized action hook responsible for the core turn-taking lifecycle.
 * It provides functions for optimistically completing a turn, skipping a turn,
 * and undoing a completed turn.
 * @core-principles
 * 1. OWNS the command logic for the primary user interaction loop.
 * 2. MUST be stateless, receiving state setters from its parent orchestrator.
 * 3. DELEGATES all I/O to the `groupsRepository`.
 */
import { useCallback } from 'react';
import { groupsRepository } from '../repository';
import { useGroupStore } from '../useGroupStore';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnCompletedLog, TurnParticipant } from '../../../types/group';

interface TurnLifecycleActionsProps {
  groupId: string | undefined;
  group: Group | null;
  user: AppUser | null;
  currentUserParticipant: TurnParticipant | null;
  isUserTurn: boolean;
  orderedParticipants: TurnParticipant[];
  undoableAction: (TurnCompletedLog & { id: string }) | null;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setFeedback: (feedback: { message: string; severity: 'success' | 'error' } | null) => void;
}

export function useTurnLifecycleActions({
  groupId,
  group,
  user,
  currentUserParticipant,
  isUserTurn,
  orderedParticipants,
  undoableAction,
  setIsSubmitting,
  setFeedback,
}: TurnLifecycleActionsProps) {
  const handleTurnAction = useCallback(async () => {
    if (!groupId || !user || !currentUserParticipant || !group) return;

    const participantToMoveId = isUserTurn ? orderedParticipants[0].id : currentUserParticipant.id;
    if (!participantToMoveId) return;

    const originalGroup = group;
    const newTurnOrder = [
      ...originalGroup.turnOrder.filter((id) => id !== participantToMoveId),
      participantToMoveId,
    ];
    const newParticipants = originalGroup.participants.map((p) =>
      p.id === participantToMoveId ? { ...p, turnCount: p.turnCount + 1 } : p,
    );

    useGroupStore.getState().setGroup({
      ...originalGroup,
      turnOrder: newTurnOrder,
      participants: newParticipants,
    });

    try {
      await groupsRepository.completeTurnTransaction(groupId, user, participantToMoveId);
    } catch (error) {
      console.error('Failed to complete turn:', error);
      setFeedback({ message: 'Failed to complete turn.', severity: 'error' });
      useGroupStore.getState().setGroup(originalGroup);
    }
  }, [groupId, user, currentUserParticipant, group, isUserTurn, orderedParticipants, setFeedback]);

  const handleSkipTurn = useCallback(async () => {
    if (!groupId || !user || orderedParticipants.length === 0) return;
    const participantToSkipId = orderedParticipants[0].id;
    setIsSubmitting(true);
    try {
      await groupsRepository.skipTurnTransaction(groupId, user, participantToSkipId);
    } catch (error) {
      console.error('User failed to skip turn:', error);
      setFeedback({ message: 'Failed to skip the turn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, user, orderedParticipants, setIsSubmitting, setFeedback]);

  const handleConfirmUndo = useCallback(async () => {
    if (!groupId || !user || !undoableAction) return;
    setIsSubmitting(true);
    try {
      await groupsRepository.undoTurnTransaction(groupId, user, undoableAction);
      setFeedback({ message: 'Last turn successfully undone.', severity: 'success' });
    } catch (error) {
      console.error('Failed to undo turn:', error);
      setFeedback({ message: 'Failed to undo turn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, user, undoableAction, setIsSubmitting, setFeedback]);

  return {
    handleTurnAction,
    handleSkipTurn,
    handleConfirmUndo,
  };
}