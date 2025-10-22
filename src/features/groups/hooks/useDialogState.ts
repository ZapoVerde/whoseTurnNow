/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useDialogState.ts
 * @architectural-role Hook
 * @description A generic and reusable hook to encapsulate the standard state
 * management logic for a confirmation dialog or modal.
 *
 * @core-principles
 * 1. IS a pure, single-purpose hook for UI state management.
 * 2. OWNS the `isOpen` boolean state for a dialog.
 * 3. DELEGATES the confirmation action to a callback, ensuring it remains generic.
 *
 * @api-declaration
 *   - `DialogState`: The interface for the object returned by the hook.
 *   - `useDialogState`: The exported hook function.
 *
 * @contract
 *   assertions:
 *     purity: pure # This hook's logic depends only on React's internal state.
 *     state_ownership: [isOpen] # It exclusively owns the dialog's visibility state.
 *     external_io: none # This hook performs no I/O.
 */

import { useState, useCallback } from 'react';

/**
 * @id packages/whoseturnnow/src/features/groups/hooks/useDialogState.ts#DialogState
 * @description The return type for the useDialogState hook, providing all
 * necessary state and handlers to control a dialog.
 */
export interface DialogState {
  /**
   * A boolean flag indicating whether the dialog is currently open.
   */
  isOpen: boolean;
  /**
   * A callback to open the dialog.
   */
  handleOpen: () => void;
  /**
   * A callback to close the dialog without confirming.
   */
  handleClose: () => void;
  /**
   * A callback that executes the provided `onConfirm` logic and then closes the dialog.
   */
  handleConfirm: () => void;
}

/**
 * A generic hook to manage the state of a single confirmation dialog.
 * @param onConfirm A memoized callback function to be executed when the user confirms the dialog.
 * @returns {DialogState} An object containing the dialog's state and its handlers.
 */
export function useDialogState(onConfirm: () => void): DialogState {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm();
    handleClose();
  }, [onConfirm, handleClose]);

  return {
    isOpen,
    handleOpen,
    handleClose,
    handleConfirm,
  };
}