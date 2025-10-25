/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useMembershipActions.ts
 * @stamp {"ts":"2025-10-25T15:05:00Z"}
 * @architectural-role Hook
 *
 * @description
 * A specialized action hook responsible for all participant and membership
 * management. This includes adding, removing, and changing the roles of
 * participants, optimistically completing turns on their behalf, and handling
 * the "leave group" action.
 *
 * @core-principles
 * 1. OWNS the command logic for all roster and membership changes.
 * 2. MUST be stateless, receiving state setters from its parent orchestrator.
 * 3. DELEGATES all I/O to the `groupsRepository`.
 *
 * @api-declaration
 *   - `useMembershipActions`: The exported hook function.
 *   - `returns.handleAddParticipant`: Adds a new placeholder participant.
 *   - `returns.handleRoleChange`: Changes a participant's role.
 *   - `returns.handleRemoveParticipant`: Removes a participant from the group.
 *   - `returns.handleLeaveGroup`: Allows the current user to leave the group.
 *   - `returns.handleAdminCompleteTurn`: Optimistically completes a turn for another user.
 *
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: firestore
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { groupsRepository } from '../repository';
import { useGroupStore } from '../useGroupStore';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnParticipant } from '../../../types/group';
import { logger } from '../../../shared/utils/debug';

interface MembershipActionsProps {
  groupId: string | undefined;
  group: Group | null;
  user: AppUser | null;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setFeedback: (feedback: { message: string; severity: 'success' | 'error' } | null) => void;
}

export function useMembershipActions({
  groupId,
  group,
  user,
  setIsSubmitting,
  setFeedback,
}: MembershipActionsProps) {
  const navigate = useNavigate();

  const handleAddParticipant = useCallback(
    async (name: string) => {
      if (!groupId || !group) return;

      const originalGroup = group;
      const optimisticParticipant: TurnParticipant = {
        id: uuidv4(),
        uid: null,
        nickname: name,
        role: 'member',
        turnCount: 0,
      };

      const newParticipants = [...originalGroup.participants, optimisticParticipant];
      const newTurnOrder = [...originalGroup.turnOrder, optimisticParticipant.id];

      useGroupStore.getState().setGroup({
        ...originalGroup,
        participants: newParticipants,
        turnOrder: newTurnOrder,
      });

      try {
        await groupsRepository.addManagedParticipant(groupId, name);
      } catch (error) {
        logger.error('Failed to add participant:', { error });
        setFeedback({ message: 'Failed to add participant.', severity: 'error' });
        useGroupStore.getState().setGroup(originalGroup);
      }
    },
    [groupId, group, setFeedback],
  );

  const handleRoleChange = useCallback(
    async (participantId: string, newRole: 'admin' | 'member') => {
      if (!groupId) return;
      try {
        await groupsRepository.updateParticipantRole(groupId, participantId, newRole);
      } catch (error) {
        logger.error('Failed to change role:', { error });
        setFeedback({ message: 'Failed to change role.', severity: 'error' });
      }
    },
    [groupId, setFeedback],
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!groupId) return;
      // --- FIX: Implement loading state for this destructive action ---
      setIsSubmitting(true);
      try {
        await groupsRepository.removeParticipant(groupId, participantId);
      } catch (error) {
        logger.error('Failed to remove participant:', { error });
        setFeedback({ message: 'Failed to remove participant.', severity: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [groupId, setFeedback, setIsSubmitting],
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!groupId || !user) return;

    setIsSubmitting(true); // Set loading state to true
    try {
      await groupsRepository.leaveGroup(groupId, user.uid);
      // On success, we navigate away, so we don't need to set submitting to false.
      navigate('/');
    } catch (error) {
      logger.error('Failed to leave group:', { error });
      setFeedback({ message: 'Failed to leave group.', severity: 'error' });
      setIsSubmitting(false); // On failure, reset the loading state.
    }
  }, [groupId, user, navigate, setFeedback, setIsSubmitting]);

  const handleAdminCompleteTurn = useCallback(
    async (participantId: string) => {
      if (!groupId || !user || !group) return;

      const originalGroup = group;
      const newTurnOrder = [
        ...originalGroup.turnOrder.filter((id) => id !== participantId),
        participantId,
      ];
      const newParticipants = originalGroup.participants.map((p) =>
        p.id === participantId ? { ...p, turnCount: p.turnCount + 1 } : p,
      );

      useGroupStore.getState().setGroup({
        ...originalGroup,
        turnOrder: newTurnOrder,
        participants: newParticipants,
      });

      try {
        await groupsRepository.completeTurnTransaction(groupId, user, participantId);
      } catch (error) {
        logger.error('Admin failed to complete turn for participant:', { error });
        setFeedback({ message: 'Failed to complete the turn.', severity: 'error' });
        useGroupStore.getState().setGroup(originalGroup);
      }
    },
    [groupId, user, group, setFeedback],
  );

  return {
    handleAddParticipant,
    handleRoleChange,
    handleRemoveParticipant,
    handleLeaveGroup,
    handleAdminCompleteTurn,
  };
}