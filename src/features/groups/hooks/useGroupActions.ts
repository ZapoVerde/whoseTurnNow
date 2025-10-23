/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupActions.ts
 * @stamp {"ts":"2025-10-23T11:00:00Z"}
 * @architectural-role Hook
 * @description
 * The "Hands" of the Group Detail feature. This hook is a collection of all
 * user-initiated actions that cause a state change. It encapsulates the logic
 * for calling the repository, managing submission states, and providing user feedback.
 * @core-principles
 * 1. IS a collection of memoized action handlers (`useCallback`).
 * 2. OWNS the "transient" UI states related to actions (e.g., `isSubmitting`, `feedback`).
 * 3. DELEGATES all I/O to the `groupsRepository` module.
 * 4. MUST be stateless regarding core business data; it receives the necessary
 *    context from its props to perform its actions.
 * @api-declaration
 *   - useGroupActions: The exported hook function.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isSubmitting, feedback, newParticipantName]
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
  groupId: string | undefined;
  // --- THIS IS NEW ---
  // The full group object is now required to perform settings updates.
  group: Group | null;
  user: AppUser | null;
  currentUserParticipant: TurnParticipant | null;
  isUserTurn: boolean;
  orderedParticipants: TurnParticipant[];
  undoableAction: (TurnCompletedLog & { id: string }) | null;
}

export function useGroupActions({
  groupId,
  group,
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
  const [newParticipantName, setNewParticipantName] = useState('');

  // --- ADD THIS NEW ACTION ---
  const handleUpdateGroupIcon = useCallback(
    async (newIcon: string) => {
      if (!groupId || !group || !newIcon.trim()) return;

      try {
        await groupsRepository.updateGroupSettings(groupId, {
          name: group.name, // Preserve the existing name
          icon: newIcon.trim(),
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

  const handleAddParticipant = useCallback(async () => {
    if (!groupId || !newParticipantName.trim()) return;
    setIsSubmitting(true);
    try {
      await groupsRepository.addManagedParticipant(
        groupId,
        newParticipantName.trim(),
      );
      setNewParticipantName('');
    } catch (error) {
      console.error('Failed to add participant:', error);
      setFeedback({
        message: 'Failed to add participant.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, newParticipantName]);

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
  }, [groupId, user]);

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

  const handleCopyGenericLink = useCallback(() => {
    if (!groupId) return;
    const url = `${window.location.origin}/join/${groupId}`;
    navigator.clipboard.writeText(url);
    setFeedback({ message: 'Generic invite link copied!', severity: 'success' });
  }, [groupId]);

  const handleCopyClaimLink = useCallback(
    (participantId: string) => {
      if (!groupId) return;
      const url = `${window.location.origin}/join/${groupId}?participantId=${participantId}`;
      navigator.clipboard.writeText(url);
      setFeedback({ message: 'Claim link for spot copied!', severity: 'success' });
    },
    [groupId],
  );

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
    newParticipantName,
    setNewParticipantName,
    setFeedback,
    handleTurnAction,
    handleAddParticipant,
    handleRoleChange,
    handleRemoveParticipant,
    handleLeaveGroup,
    handleConfirmDelete,
    handleConfirmReset,
    handleConfirmUndo,
    handleCopyGenericLink,
    handleCopyClaimLink,
    // --- EXPOSE THE NEW ACTION ---
    handleUpdateGroupIcon,
    formatLogEntry,
  };
}