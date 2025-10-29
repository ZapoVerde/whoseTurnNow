/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-25T15:20:00Z"}
 * @architectural-role Orchestrator
 *
 * @description
 * The primary "Conductor" hook for the Group Detail feature. It now systemically
 * applies the "Close and Defer" pattern to all actions triggered from menus
 * or dialogs to prevent focus-related race conditions during UI re-renders.
 *
 * @core-principles
 * 1. IS the single composition root for all of the feature's logic.
 * 2. MUST re-establish its data subscriptions when the connection mode changes.
 * 3. MUST deterministically manage UI focus when actions are triggered from temporary surfaces.
 *
 * @api-declaration
 *   - default: The `useGroupDetail` hook function.
 *   - returns: A comprehensive view model object required by the `GroupDetailScreen`.
 *
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isSubmitting, feedback]
 *     external_io: none
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

const DEFER_ACTION_MS = 50; // A consistent, small delay for all deferred actions.

export function useGroupDetail(groupId: string | undefined) {
  const user = useAuthStore((state) => state.user);
  const { group, turnLog, isLoading, loadGroupAndLog, cleanup } = useGroupStore();
  const connectionMode = useAppStatusStore((state) => state.connectionMode);
  const [showTurnCounts, setShowTurnCounts] = useState(true);
  const [showTurnHistory, setShowTurnHistory] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const derivedState = useGroupDerivedState(group, user, turnLog);

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

  const groupMenu = useMenuState();
  const [selectedParticipant, setSelectedParticipant] = useState<TurnParticipant | null>(null);
  const participantMenuState = useMenuState();
  const iconPickerMenu = useMenuState();

  const deleteDialog = useDialogState(() => {
    setTimeout(() => settingsActions.handleConfirmDelete(), DEFER_ACTION_MS);
  });
  const resetDialog = useDialogState(() => {
    setTimeout(() => settingsActions.handleConfirmReset(), DEFER_ACTION_MS);
  });
  const undoDialog = useDialogState(() => {
    setTimeout(() => turnActions.handleConfirmUndo(), DEFER_ACTION_MS);
  });
  const skipDialog = useDialogState(() => {
    setTimeout(() => turnActions.handleSkipTurn(), DEFER_ACTION_MS);
  });
  const addParticipantDialog = useDialogState(() => {});
  const changeNameDialog = useDialogState(() => {}); // New dialog state

  useEffect(() => {
    if (groupId && connectionMode === 'live') {
      loadGroupAndLog(groupId);
    }
    return () => cleanup();
  }, [groupId, connectionMode, loadGroupAndLog, cleanup]);

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
      setFeedback,

      // New action handler for the name change dialog
      handleConfirmNameChange: async (newName: string) => {
        await settingsActions.handleUpdateGroupName(newName);
      },

      handleAdminCompleteTurn: (participantId: string) => {
        participantMenuState.handleClose();
        setTimeout(() => {
          membershipActions.handleAdminCompleteTurn(participantId);
        }, DEFER_ACTION_MS);
      },
      handleRoleChange: (newRole: 'admin' | 'member') => {
        const participantId = selectedParticipant?.id;
        participantMenuState.handleClose();
        setTimeout(() => {
          if (participantId) {
            membershipActions.handleRoleChange(participantId, newRole);
          }
        }, DEFER_ACTION_MS);
      },
      handleRemoveParticipant: () => {
        const participantId = selectedParticipant?.id;
        participantMenuState.handleClose();
        setTimeout(() => {
          if (participantId) {
            membershipActions.handleRemoveParticipant(participantId);
          }
        }, DEFER_ACTION_MS);
      },
      handleLeaveGroup: () => {
        groupMenu.handleClose();
        setTimeout(() => {
          membershipActions.handleLeaveGroup();
        }, DEFER_ACTION_MS);
      },
    };
  }, [
    turnActions,
    membershipActions,
    settingsActions,
    sharingActions,
    selectedParticipant,
    participantMenuState,
    groupMenu,
  ]);

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
    changeNameDialog, 
    actions: composedActions,
    showTurnCounts,
    setShowTurnCounts,
    showTurnHistory,
    setShowTurnHistory,
  };
}