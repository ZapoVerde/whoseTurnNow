/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 * @stamp {"ts":"2025-10-23T07:15:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The primary "Conductor" hook for the Group Detail feature. It is now also
 * "connection-aware," re-initializing its data listeners when the app
 * recovers from a degraded state.
 * @core-principles
 * 1. IS the single composition root for the feature's logic.
 * 2. MUST re-establish its data subscriptions when the connection mode transitions to 'live'.
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
  const skipDialog = useDialogState(actions.handleSkipTurn);
  
  const addParticipantDialog = useDialogState(async (name?: string) => {
    if (typeof name === 'string') {
      await actions.handleAddParticipant(name);
    }
  });

  // 5. Handle side effects (data loading)
  // --- THIS IS THE FIX ---
  // The effect now depends on `connectionMode`. When the app recovers and the
  // mode becomes 'live', this effect re-runs, triggering `loadGroupAndLog`
  // to re-establish the real-time listeners for this specific group.
  useEffect(() => {
    if (groupId && connectionMode === 'live') {
      // --- DEBUG LOG ---
      console.log(`[useGroupDetail] Connection is LIVE for groupId '${groupId}'. Loading data.`);
      loadGroupAndLog(groupId);
    } else {
      console.log(`[useGroupDetail] Skipping data load for groupId '${groupId}'.`, { connectionMode });
    }
    // The cleanup function from the store will be called automatically
    // before the effect re-runs, ensuring old listeners are detached.
    return () => cleanup();
  }, [groupId, loadGroupAndLog, cleanup, connectionMode]);
  // --- END FIX ---


  // --- Omitted for brevity: composed handlers and final return object ---
  // (No changes are needed in the rest of the file)
  const [selectedParticipant, setSelectedParticipant] =
    useState<TurnParticipant | null>(null);

  const handleOpenParticipantMenu = (
    event: MouseEvent<HTMLElement>,
    participant: TurnParticipant,
  ) => {
    setSelectedParticipant(participant);
    participantMenu.handleOpen(event);
  };

  const handleCloseParticipantMenu = () => {
    participantMenu.handleClose();
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
  
  const handleUpdateGroupIcon = (newIcon: string) => {
    actions.handleUpdateGroupIcon(newIcon);
  };

  return {
    group,
    turnLog,
    isLoading,
    user,
    ...derivedState,
    isSubmitting: actions.isSubmitting,
    feedback: actions.feedback,
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
    skipDialog,
    addParticipantDialog,
    actions: {
      ...actions,
      handleRoleChange,
      handleRemoveParticipant,
      handleUpdateGroupIcon,
    },
  };
}