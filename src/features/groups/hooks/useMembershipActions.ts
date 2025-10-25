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
import { groupsRepository } from '../repository';
import { useGroupStore } from '../useGroupStore';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

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
      if (!groupId) return;
      setIsSubmitting(true);
      try {
        await groupsRepository.addManagedParticipant(groupId, name);
      } catch (error) {
        console.error('Failed to add participant:', error);
        setFeedback({ message: 'Failed to add participant.', severity: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [groupId, setIsSubmitting, setFeedback],
  );

  const handleRoleChange = useCallback(
    async (participantId: string, newRole: 'admin' | 'member') => {
      if (!groupId) return;
      // Note: This is a fast operation, so we don't set isSubmitting for a better UX.
      try {
        await groupsRepository.updateParticipantRole(groupId, participantId, newRole);
      } catch (error) {
        console.error('Failed to change role:', error);
        setFeedback({ message: 'Failed to change role.', severity: 'error' });
      }
    },
    [groupId, setFeedback],
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!groupId) return;
      try {
        await groupsRepository.removeParticipant(groupId, participantId);
      } catch (error) {
        console.error('Failed to remove participant:', error);
        setFeedback({ message: 'Failed to remove participant.', severity: 'error' });
      }
    },
    [groupId, setFeedback],
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!groupId || !user) return;
    try {
      await groupsRepository.leaveGroup(groupId, user.uid);
      navigate('/');
    } catch (error) {
      console.error('Failed to leave group:', error);
      setFeedback({ message: 'Failed to leave group.', severity: 'error' });
    }
  }, [groupId, user, navigate, setFeedback]);

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
        console.error('Admin failed to complete turn for participant:', error);
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