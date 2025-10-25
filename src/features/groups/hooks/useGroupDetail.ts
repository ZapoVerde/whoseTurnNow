/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-25T08:30:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The primary "Conductor" hook for the Group Detail feature. It composes all
 * state, derived logic, and user actions into a single, comprehensive view model
 * for the GroupDetailScreen component.
 * @core-principles
 * 1. IS the single composition root for all of the feature's logic.
 * 2. MUST re-establish its data subscriptions when the connection mode changes.
 * 3. DELEGATES all business logic and action handling to its satellite hooks.
 * @api-declaration
 *   - default: The `useGroupDetail` hook function.
 *   - returns: A comprehensive view model object required by the `GroupDetailScreen`.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: none
 */

import { useEffect, useState, type MouseEvent } from 'react';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useMenuState } from './useMenuState';
import { useDialogState } from './useDialogState';
import { useGroupDerivedState } from './useGroupDerivedState';
import { useGroupActions } from './useGroupActions';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import type { TurnParticipant } from '../../../types/group';

export function useGroupDetail(groupId: string | undefined) {
  // 1. Get raw data from global stores
  const user = useAuthStore((state) => state.user);
  const { group, turnLog, isLoading, loadGroupAndLog, cleanup } = useGroupStore();
  const connectionMode = useAppStatusStore((state) => state.connectionMode);

  // 2. Delegate business logic derivations to the "Brain" hook
  const derivedState = useGroupDerivedState(group, user, turnLog);

  // 3. Delegate action handlers to the "Hands" hook
  const actions = useGroupActions({ groupId, user, group, ...derivedState });
  
  // 4. Manage all primitive UI state for menus and dialogs
  const groupMenu = useMenuState();
  const [selectedParticipant, setSelectedParticipant] = useState<TurnParticipant | null>(null);
  const participantMenuState = useMenuState();

  const handleOpenParticipantMenu = (
    event: MouseEvent<HTMLElement>,
    participant: TurnParticipant,
  ) => {
    setSelectedParticipant(participant);
    participantMenuState.handleOpen(event);
  };

  const handleCloseParticipantMenu = () => {
    participantMenuState.handleClose();
    // Delay clearing the selected participant to prevent menu content from disappearing during closing animation
    setTimeout(() => setSelectedParticipant(null), 150);
  };
  
  // Combine the state and handlers for the participant menu
  const participantMenu = {
    ...participantMenuState,
    selectedParticipant,
    handleOpen: handleOpenParticipantMenu,
    handleClose: handleCloseParticipantMenu,
  };

  const iconPickerMenu = useMenuState();
  const deleteDialog = useDialogState(actions.handleConfirmDelete);
  const resetDialog = useDialogState(actions.handleConfirmReset);
  const undoDialog = useDialogState(actions.handleConfirmUndo);
  const skipDialog = useDialogState(actions.handleSkipTurn);
  
  const addParticipantDialog = useDialogState(() => {}); // Simple state management for open/close

  // 5. Handle side effects (data loading and cleanup)
  useEffect(() => {
    if (groupId && connectionMode === 'live') {
      loadGroupAndLog(groupId);
    }
    return () => cleanup();
  }, [groupId, connectionMode, loadGroupAndLog, cleanup]);

  // 6. Compose final action handlers that close menus
  const composedActions = {
    ...actions,
    handleRoleChange: (newRole: 'admin' | 'member') => {
      if (participantMenu.selectedParticipant) {
        actions.handleRoleChange(participantMenu.selectedParticipant.id, newRole);
      }
      participantMenu.handleClose();
    },
    handleRemoveParticipant: () => {
      if (participantMenu.selectedParticipant) {
        actions.handleRemoveParticipant(participantMenu.selectedParticipant.id);
      }
      participantMenu.handleClose();
    },
    handleLeaveGroup: () => {
      actions.handleLeaveGroup();
      participantMenu.handleClose();
    }
  };

  // 7. Return the complete, composed view model
  return {
    group,
    turnLog,
    isLoading,
    user,
    ...derivedState,
    isSubmitting: actions.isSubmitting,
    feedback: actions.feedback,
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