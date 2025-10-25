/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-25T15:20:00Z"}
 * @architectural-role Orchestrator
 *
 * @description
 * The primary "Conductor" hook for the Group Detail feature. It composes all
 * state, derived logic, and user actions into a single, comprehensive view model
 * for the `GroupDetailScreen` component. It now imports multiple specialized
 * action hooks to keep file sizes small and adhere to the project's LOC limit
 * for AI-friendliness.
 *
 * @core-principles
 * 1. IS the single composition root for all of the feature's logic.
 * 2. MUST re-establish its data subscriptions when the connection mode changes.
 * 3. OWNS the shared UI state (`isSubmitting`, `feedback`) for its child action hooks.
 * 4. DELEGATES all business logic and action handling to its satellite hooks.
 *
 * @api-declaration
 *   - default: The `useGroupDetail` hook function.
 *   - returns: A comprehensive view model object required by the `GroupDetailScreen`.
 *
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isSubmitting, feedback]
 *     external_io: none # Delegates all I/O.
 */

import { useEffect, useState, useMemo, type MouseEvent } from 'react';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import { useMenuState } from './useMenuState';
import { useDialogState } from './useDialogState';
import { useGroupDerivedState } from './useGroupDerivedState';
import { useTurnLifecycleActions } from './useTurnLifecycleActions';
import { useMembershipActions } from './useMembershipActions';
import { useGroupSettingsActions } from './useGroupSettingsActions';
import { useSharingActions } from './useSharingActions';
import type { TurnParticipant, LogEntry } from '../../../types/group';

export function useGroupDetail(groupId: string | undefined) {
  // 1. Raw Data & Global State
  const user = useAuthStore((state) => state.user);
  const { group, turnLog, isLoading, loadGroupAndLog, cleanup } = useGroupStore();
  const connectionMode = useAppStatusStore((state) => state.connectionMode);

  // 2. Local UI State (Owned by the Orchestrator)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // 3. Derived State (The "Brain")
  const derivedState = useGroupDerivedState(group, user, turnLog);

  // 4. Specialized Action Hooks (The "Hands")
  const turnActions = useTurnLifecycleActions({
    ...derivedState,
    groupId,
    group,
    user,
    setIsSubmitting,
    setFeedback,
  });

  const membershipActions = useMembershipActions({
    groupId,
    group,
    user,
    setIsSubmitting,
    setFeedback,
  });

  const settingsActions = useGroupSettingsActions({
    groupId,
    group,
    user,
    setFeedback,
  });

  const sharingActions = useSharingActions({
    groupId,
    group,
    setFeedback,
  });

  // 5. Primitive UI State for Menus and Dialogs
  const groupMenu = useMenuState();
  const [selectedParticipant, setSelectedParticipant] = useState<TurnParticipant | null>(null);
  const participantMenuState = useMenuState();
  const iconPickerMenu = useMenuState();
  
  const deleteDialog = useDialogState(settingsActions.handleConfirmDelete);
  const resetDialog = useDialogState(settingsActions.handleConfirmReset);
  const undoDialog = useDialogState(turnActions.handleConfirmUndo);
  const skipDialog = useDialogState(turnActions.handleSkipTurn);
  const addParticipantDialog = useDialogState(() => {}); // Simple open/close state

  // 6. Data Loading Side Effect
  useEffect(() => {
    if (groupId && connectionMode === 'live') {
      loadGroupAndLog(groupId);
    }
    return () => cleanup();
  }, [groupId, connectionMode, loadGroupAndLog, cleanup]);

  // 7. Compose Final Actions Object for the UI
  const composedActions = useMemo(() => {
    const formatLogEntry = (log: LogEntry) => {
      switch (log.type) {
        case 'TURN_COMPLETED':
          const byActor = log.actorUid !== log.participantId ? ` by ${log.actorName}` : '';
          return `${log.participantName}'s turn was completed${byActor}.`;
        case 'TURN_SKIPPED':
          return `${log.participantName} skipped their turn.`;
        case 'COUNTS_RESET':
          return `All turn counts were reset by ${log.actorName}.`;
        case 'TURN_UNDONE':
          return `${log.actorName} undid ${log.originalParticipantName}'s turn.`;
        default:
          return 'An unknown action occurred.';
      }
    };

    return {
      ...turnActions,
      ...membershipActions,
      ...settingsActions,
      ...sharingActions,
      formatLogEntry,
      setFeedback, // Expose the setter for snackbar control
      // Composed actions that also close menus
      handleRoleChange: (newRole: 'admin' | 'member') => {
        if (selectedParticipant) {
          membershipActions.handleRoleChange(selectedParticipant.id, newRole);
        }
        participantMenuState.handleClose();
      },
      handleRemoveParticipant: () => {
        if (selectedParticipant) {
          membershipActions.handleRemoveParticipant(selectedParticipant.id);
        }
        participantMenuState.handleClose();
      },
      handleLeaveGroup: () => {
        membershipActions.handleLeaveGroup();
        participantMenuState.handleClose();
      },
    };
  }, [
    turnActions,
    membershipActions,
    settingsActions,
    sharingActions,
    selectedParticipant,
    participantMenuState,
  ]);

  // 8. Compose Participant Menu Handlers
  const participantMenu = {
    ...participantMenuState,
    selectedParticipant,
    handleOpen: (event: MouseEvent<HTMLElement>, participant: TurnParticipant) => {
      setSelectedParticipant(participant);
      participantMenuState.handleOpen(event);
    },
    handleClose: () => {
      participantMenuState.handleClose();
      setTimeout(() => setSelectedParticipant(null), 150);
    },
  };

  // 9. Return the Complete View Model
  return {
    group,
    turnLog,
    isLoading,
    user,
    ...derivedState,
    isSubmitting,
    feedback,
    groupMenu,
    participantMenu,
    iconPickerMenu,
    resetDialog,
    deleteDialog,
    undoDialog,
    skipDialog,
    addParticipantDialog,
    actions: composedActions,
  };
}