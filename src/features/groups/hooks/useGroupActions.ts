/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupActions.ts
 * @stamp {"ts":"2025-10-23T07:10:00Z"}
 * @architectural-role Hook
 * @description
 * The "Hands" of the Group Detail feature. This hook centralizes all user-initiated
 * actions, including group settings updates and the unified sharing mechanism.
 * @core-principles
 * 1. OWNS the logic for all user-initiated state changes and I/O orchestration.
 * 2. MUST encapsulate the `navigator.share` / clipboard fallback logic.
 * 3. DELEGATES all direct I/O to the `groupsRepository`.
 * @api-declaration
 *   - `useGroupActions`: The exported hook.
 *   - `returns.handleAddParticipant`: Action to add a new managed participant.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isSubmitting, feedback]
 *     external_io: firestore
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsRepository } from '../repository';
import type { AppUser } from '../../auth/useAuthStore';
import type {
  Group,
  LogEntry,
  TurnCompletedLog,
  TurnParticipant,
} from '../../../types/group';

interface GroupActionsProps {
  group: Group | null;
  groupId: string | undefined;
  user: AppUser | null;
  currentUserParticipant: TurnParticipant | null;
  isUserTurn: boolean;
  orderedParticipants: TurnParticipant[];
  undoableAction: (TurnCompletedLog & { id: string }) | null;
}

export function useGroupActions({
  group,
  groupId,
  user,
  currentUserParticipant,
  isUserTurn,
  orderedParticipants,
  undoableAction,
}: GroupActionsProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const handleShare = useCallback(
    async (url: string, title: string, successMessage: string) => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `Join "${group?.name || 'the list'}" on Whose Turn Now!`,
            url: url,
          });
        } catch (error) {
          console.log('Web Share API was cancelled or failed.', error);
        }
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback({ message: successMessage, severity: 'success' });
      }
    },
    [group?.name],
  );

  const handleGenericInvite = useCallback(() => {
    if (!groupId || !group) return;
    const url = `${window.location.origin}/join/${groupId}`;
    handleShare(url, `Join my list: ${group.name}`, 'Invite link copied!');
  }, [groupId, group, handleShare]);

  const handleTargetedInvite = useCallback(
    (participantId: string) => {
      if (!groupId || !group) return;
      const participant = group.participants.find((p) => p.id === participantId);
      const participantName = participant?.nickname || 'this spot';
      const url = `${window.location.origin}/join/${groupId}?participantId=${participantId}`;
      handleShare(
        url,
        `Claim the '${participantName}' spot`,
        `Claim link for '${participantName}' copied!`,
      );
    },
    [groupId, group, handleShare],
  );

  const handleRecoveryLink = useCallback(() => {
    if (!groupId || !group) return;
    const url = `${window.location.origin}/join/${groupId}`;
    handleShare(
      url,
      `Access link for: ${group.name}`,
      'Recovery link copied! Use this on another device.',
    );
  }, [groupId, group, handleShare]);

  const handleUpdateGroupIcon = useCallback(
    async (newIcon: string) => {
      if (!groupId || !group) return;
      try {
        await groupsRepository.updateGroupSettings(groupId, {
          name: group.name,
          icon: newIcon,
        });
        setFeedback({ message: 'Group icon updated!', severity: 'success' });
      } catch (error) {
        console.error('Failed to update group icon:', error);
        setFeedback({ message: 'Failed to update icon.', severity: 'error' });
      }
    },
    [groupId, group],
  );

  const handleTurnAction = useCallback(async () => {
    if (!groupId || !user || !currentUserParticipant) return;
    const participantToMoveId = isUserTurn
      ? orderedParticipants[0].id
      : currentUserParticipant.id;
    if (!participantToMoveId) return;
    setIsSubmitting(true);
    try {
      await groupsRepository.completeTurnTransaction(
        groupId,
        user,
        participantToMoveId,
      );
    } catch (error) {
      console.error('Failed to complete turn:', error);
      setFeedback({ message: 'Failed to complete turn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, user, currentUserParticipant, isUserTurn, orderedParticipants]);

  const handleAddParticipant = useCallback(
    async (name: string) => {
      if (!groupId) return;
      setIsSubmitting(true);
      try {
        await groupsRepository.addManagedParticipant(groupId, name);
      } catch (error) {
        console.error('Failed to add participant:', error);
        setFeedback({
          message: 'Failed to add participant.',
          severity: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [groupId],
  );

  const handleRoleChange = useCallback(
    async (participantId: string, newRole: 'admin' | 'member') => {
      if (!groupId) return;
      await groupsRepository.updateParticipantRole(groupId, participantId, newRole);
    },
    [groupId],
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!groupId) return;
      await groupsRepository.removeParticipant(groupId, participantId);
    },
    [groupId],
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!groupId || !user) return;
    await groupsRepository.leaveGroup(groupId, user.uid);
    navigate('/');
  }, [groupId, user, navigate]);

  const handleConfirmDelete = useCallback(async () => {
    if (!groupId) return;
    await groupsRepository.deleteGroup(groupId);
    navigate('/');
  }, [groupId, navigate]);

  const handleConfirmReset = useCallback(async () => {
    if (!groupId || !user) return;
    await groupsRepository.resetAllTurnCounts(groupId, user);
  }, [groupId, user]);

  const handleConfirmUndo = useCallback(async () => {
    if (!groupId || !user || !undoableAction) return;
    setIsSubmitting(true);
    try {
      await groupsRepository.undoTurnTransaction(groupId, user, undoableAction);
      setFeedback({
        message: 'Last turn successfully undone.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to undo turn:', error);
      setFeedback({ message: 'Failed to undo turn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, user, undoableAction]);

  const formatLogEntry = useCallback((log: LogEntry) => {
    switch (log.type) {
      case 'TURN_COMPLETED':
        const byActor =
          log.actorUid !== log.participantId ? ` by ${log.actorName}` : '';
        return `${log.participantName}'s turn was completed${byActor}.`;
      case 'COUNTS_RESET':
        return `All turn counts were reset by ${log.actorName}.`;
      case 'TURN_UNDONE':
        return `${log.actorName} undid ${log.originalParticipantName}'s turn.`;
      default:
        return 'An unknown action occurred.';
    }
  }, []);

  return {
    isSubmitting,
    feedback,
    setFeedback,
    handleTurnAction,
    handleAddParticipant,
    handleRoleChange,
    handleRemoveParticipant,
    handleLeaveGroup,
    handleConfirmDelete,
    handleConfirmReset,
    handleConfirmUndo,
    handleGenericInvite,
    handleTargetedInvite,
    handleRecoveryLink,
    handleUpdateGroupIcon,
    formatLogEntry,
  };
}