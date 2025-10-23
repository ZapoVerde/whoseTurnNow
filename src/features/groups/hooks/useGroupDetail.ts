/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-23T06:05:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The primary "Conductor" hook for the Group Detail feature. It composes all
 * necessary data, state, and actions from various sources (stores and specialized
 * satellite hooks) into a single, comprehensive view model for the UI component.
 * @core-principles
 * 1. IS the single composition root for the feature's logic.
 * 2. ORCHESTRATES the view model by composing data from stores with logic from satellite hooks.
 * 3. DELEGATES all business logic calculations to the `useGroupDerivedState` hook.
 * 4. DELEGATES all action handling and I/O to the `useGroupActions` hook.
 * 5. MUST NOT contain its own business logic or direct I/O calls.
 * @api-declaration
 *   - default: The `useGroupDetail` hook function.
 *   - returns: A comprehensive view model object containing all data, derived
 *     state, and actions (including invitation handlers) required by the UI.
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
import type { TurnParticipant } from '../../../types/group';

export function useGroupDetail(groupId: string | undefined) {
  // 1. Get raw data from global stores
  const user = useAuthStore((state) => state.user);
  const { group, turnLog, isLoading, loadGroupAndLog, cleanup } = useGroupStore();

  // 2. Delegate business logic to the "Brain" hook
  const derivedState = useGroupDerivedState(group, user, turnLog);

  // 3. Delegate action handlers to the "Hands" hook
  const actions = useGroupActions({ groupId, user, group, ...derivedState });

  // 4. Manage primitive UI state
  const groupMenu = useMenuState();
  const participantMenu = useMenuState();
  const iconPickerMenu = useMenuState();
  const deleteDialog = useDialogState(actions.handleConfirmDelete);
  const resetDialog = useDialogState(actions.handleConfirmReset);
  const undoDialog = useDialogState(actions.handleConfirmUndo);

  const [selectedParticipant, setSelectedParticipant] =
    useState<TurnParticipant | null>(null);

  // 5. Handle side effects (data loading)
  useEffect(() => {
    if (groupId) {
      loadGroupAndLog(groupId);
    }
    return () => cleanup();
  }, [groupId, loadGroupAndLog, cleanup]);

  // 6. Create composite handlers that combine UI state logic with actions
  const handleOpenParticipantMenu = (
    event: MouseEvent<HTMLElement>,
    participant: TurnParticipant,
  ) => {
    setSelectedParticipant(participant);
    participantMenu.handleOpen(event);
  };

  const handleCloseParticipantMenu = () => {
    participantMenu.handleClose();
    // Delay clearing the selected participant to prevent menu content from disappearing during transition
    setTimeout(() => setSelectedParticipant(null), 150);
  };

  const handleRoleChange = (newRole: 'admin' | 'member') => {
    if (selectedParticipant) {
      actions.handleRoleChange(selectedParticipant.id, newRole);
    }
    handleCloseParticipantMenu();
  };

  const handleRemoveParticipant = () => {
    if (selectedParticipant) {
      actions.handleRemoveParticipant(selectedParticipant.id);
    }
    handleCloseParticipantMenu();
  };

  const handleCopyClaimLink = () => {
    if (selectedParticipant) {
      // The old handleTargetedInvite now serves this purpose.
      actions.handleTargetedInvite(selectedParticipant.id);
    }
    handleCloseParticipantMenu();
  };
  
  // 7. Assemble and return the final, clean view model for the component
  return {
    // Raw Data
    group,
    turnLog,
    isLoading,
    user,

    // Derived State (from the "Brain")
    ...derivedState,

    // Actions & Action-related State (from the "Hands")
    isSubmitting: actions.isSubmitting,
    feedback: actions.feedback,
    addParticipantForm: {
      name: actions.newParticipantName,
      setName: actions.setNewParticipantName,
      handleSubmit: actions.handleAddParticipant,
    },

    // Composed UI State
    groupMenu,
    participantMenu: {
      ...participantMenu,
      selectedParticipant,
      handleOpen: handleOpenParticipantMenu,
      handleClose: handleCloseParticipantMenu,
    },
    iconPickerMenu,
    resetDialog,
    deleteDialog,
    undoDialog,

    // Actions that need to be composed with local UI state
    actions: {
      ...actions,
      handleRoleChange,
      handleRemoveParticipant,
      handleCopyClaimLink,
    },
  };
}