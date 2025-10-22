/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-21T18:00:00Z"}
 * @architectural-role Orchestrator
 *
 * @description
 * This hook is the single source of truth for the business logic and derived state
 * of the Group Detail feature. It acts as a "composition hook" by fetching core
 * data, defining all business actions, and then consuming smaller, specialized
 * hooks (`useMenuState`, `useDialogState`) to manage the UI state.
 *
 * @core-principles
 * 1. IS the single source of business logic for the entire Group Detail feature.
 * 2. OWNS the composition of the final view model returned to the UI component.
 * 3. OWNS all top-level action handlers (e.g., handleTurnAction, handleConfirmDelete).
 * 4. DELEGATES all direct I/O operations to the `groupsRepository`.
 * 5. DELEGATES all primitive UI state management (e.g., menu anchors, dialog visibility)
 *    to specialized, reusable hooks.
 * 6. MUST NOT contain raw `useState` calls for managing simple UI states like menus or dialogs.
 *
 * @api-declaration
 *   - `useGroupDetail`: The exported hook that provides the complete view model for the feature.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This hook contains side effects (useEffect) and manages local state.
 *     state_ownership: none # It reads from global stores but does not own any global state slices.
 *     external_io: none # It delegates all I/O to the repository; it does not directly import from Firebase.
 */

import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useMenuState } from './useMenuState';
import { useDialogState } from './useDialogState';
import {
  completeTurnTransaction, addManagedParticipant, updateParticipantRole,
  removeParticipant, resetAllTurnCounts, deleteGroup, leaveGroup,
  undoTurnTransaction,
} from '../groupsRepository';
import type { LogEntry, TurnCompletedLog, TurnParticipant } from '../../../types/group';

export function useGroupDetail(groupId: string | undefined) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { group, turnLog, isLoading, loadGroupAndLog, cleanup } = useGroupStore();

  // --- Local Business & UI State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<TurnParticipant | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (groupId) loadGroupAndLog(groupId);
    return () => cleanup();
  }, [groupId, loadGroupAndLog, cleanup]);

  // --- Memoized Data Derivations (Business Logic) ---
  const orderedParticipants = useMemo(() => {
    if (!group) return [];
    return group.turnOrder
      .map((pid: string) => group.participants.find((p: TurnParticipant) => p.id === pid))
      .filter((p?: TurnParticipant): p is TurnParticipant => !!p);
  }, [group]);

  const currentUserParticipant = useMemo(() => {
    if (!user || !group) return null;
    return group.participants.find((p: TurnParticipant) => p.uid === user.uid);
  }, [user, group]);

  const isUserTurn = !!currentUserParticipant && orderedParticipants.length > 0 && orderedParticipants[0].id === currentUserParticipant.id;
  const isAdmin = currentUserParticipant?.role === 'admin';
  const isLastAdmin = useMemo(() => {
    if (!group || !currentUserParticipant || currentUserParticipant.role !== 'admin') return false;
    return group.participants.filter((p: TurnParticipant) => p.role === 'admin').length === 1;
  }, [group, currentUserParticipant]);

  const undoableAction = useMemo(() => {
    if (!user || !group || !turnLog) return null;
    const completableLogs = turnLog.filter(
      (log): log is TurnCompletedLog & { id: string } => log.type === 'TURN_COMPLETED' && !log.isUndone
    );
    // Find the most recent, valid action in the last 3 completed turns
    for (const log of completableLogs.slice(0, 3)) {
      const subjectParticipant = group.participants.find(p => p.id === log.participantId);
      const isActor = user.uid === log.actorUid;
      const isSubject = !!subjectParticipant && user.uid === subjectParticipant.uid;
      if (isAdmin || isActor || isSubject) {
        return log; // Return the first one we have permission for
      }
    }
    return null;
  }, [turnLog, user, group, isAdmin]);

  // --- Action Handlers (Business Logic) ---
  const handleTurnAction = useCallback(async () => {
    if (!groupId || !user || !currentUserParticipant) return;
    const participantToMoveId = isUserTurn ? orderedParticipants[0].id : currentUserParticipant.id;
    setIsSubmitting(true);
    try {
      await completeTurnTransaction(groupId, user, participantToMoveId);
    } catch (error) { console.error('Failed to complete turn:', error); }
    finally { setIsSubmitting(false); }
  }, [groupId, user, currentUserParticipant, isUserTurn, orderedParticipants]);

  const handleAddParticipant = useCallback(async () => {
    if (!groupId || !newParticipantName.trim()) return;
    setIsSubmitting(true);
    try {
      await addManagedParticipant(groupId, newParticipantName.trim());
      setNewParticipantName('');
    } catch (error) { console.error('Failed to add participant:', error); }
    finally { setIsSubmitting(false); }
  }, [groupId, newParticipantName]);

  const handleConfirmDelete = useCallback(async () => {
    if(groupId) {
      await deleteGroup(groupId);
      navigate('/');
    }
  }, [groupId, navigate]);

  const handleConfirmReset = useCallback(() => {
    if(groupId && user) {
      resetAllTurnCounts(groupId, user);
    }
  }, [groupId, user]);

  const handleConfirmUndo = useCallback(async () => {
    if (!groupId || !user || !undoableAction) return;
    setIsSubmitting(true);
    try {
      await undoTurnTransaction(groupId, user, undoableAction);
      setFeedback({ message: 'Last turn successfully undone.', severity: 'success' });
    } catch (error) {
      console.error('Failed to undo turn:', error);
      setFeedback({ message: 'Failed to undo turn.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, user, undoableAction]);

  // --- Composed UI State Hooks ---
  const groupMenu = useMenuState();
  const participantMenu = useMenuState();
  const deleteDialog = useDialogState(handleConfirmDelete);
  const resetDialog = useDialogState(handleConfirmReset);
  const undoDialog = useDialogState(handleConfirmUndo);
  
  // --- Composite Action Handlers ---
  const handleOpenParticipantMenu = (event: MouseEvent<HTMLElement>, participant: TurnParticipant) => {
    setSelectedParticipant(participant);
    participantMenu.handleOpen(event);
  };
  
  const handleCloseParticipantMenu = () => {
    setSelectedParticipant(null);
    participantMenu.handleClose();
  };

  const handleRoleChange = useCallback((newRole: 'admin' | 'member') => {
    if (groupId && selectedParticipant) {
      updateParticipantRole(groupId, selectedParticipant.id, newRole);
    }
    handleCloseParticipantMenu();
  }, [groupId, selectedParticipant]);

  const handleRemoveParticipant = useCallback(() => {
    if (groupId && selectedParticipant) {
      removeParticipant(groupId, selectedParticipant.id);
    }
    handleCloseParticipantMenu();
  }, [groupId, selectedParticipant]);
  
  const handleLeaveGroup = useCallback(() => {
    if (groupId && user) {
      leaveGroup(groupId, user.uid);
    }
    handleCloseParticipantMenu();
  }, [groupId, user]);

  const handleCopyGenericLink = useCallback(() => {
      if (!groupId) return;
      const url = `${window.location.origin}/join/${groupId}`;
      navigator.clipboard.writeText(url);
      setFeedback({ message: 'Generic invite link copied!', severity: 'success' });
      groupMenu.handleClose();
  }, [groupId, groupMenu]);

  const handleCopyClaimLink = useCallback(() => {
      if (!groupId || !selectedParticipant) return;
      const url = `${window.location.origin}/join/${groupId}?participantId=${selectedParticipant.id}`;
      navigator.clipboard.writeText(url);
      setFeedback({ message: 'Claim link for spot copied!', severity: 'success' });
      handleCloseParticipantMenu();
  }, [groupId, selectedParticipant]);
  
  const formatLogEntry = useCallback((log: LogEntry) => {
    switch (log.type) {
      case 'TURN_COMPLETED':
        const byActor = log.actorUid !== log.participantId ? ` by ${log.actorName}` : '';
        return `${log.participantName}'s turn was completed${byActor}.`;
      case 'COUNTS_RESET':
        return `All turn counts were reset by ${log.actorName}.`;
      case 'TURN_UNDONE':
        return `${log.actorName} undid ${log.originalParticipantName}'s turn.`;
      default:
        return 'An unknown action occurred.';
    }
  }, []);

  // --- The Final View Model ---
  return {
    // Raw Data & State
    group,
    turnLog,
    isLoading,
    isSubmitting,
    user,
    feedback,

    // Derived State
    orderedParticipants,
    isAdmin,
    isLastAdmin,
    isUserTurn,
    undoableAction,

    // Composed UI State Hooks
    addParticipantForm: {
      name: newParticipantName,
      setName: setNewParticipantName,
      handleSubmit: handleAddParticipant,
    },
    groupMenu,
    participantMenu: {
      ...participantMenu,
      selectedParticipant,
      handleOpen: handleOpenParticipantMenu,
      handleClose: handleCloseParticipantMenu,
    },
    resetDialog,
    deleteDialog,
    undoDialog,

    // Action Handlers
    actions: {
      handleTurnAction,
      handleRoleChange,
      handleRemoveParticipant,
      handleLeaveGroup,
      handleCopyGenericLink,
      handleCopyClaimLink,
      formatLogEntry,
      setFeedback,
    },
  };
}