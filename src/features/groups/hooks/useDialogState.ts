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

import { useState, useCallback, type MouseEvent } from 'react';

export interface DialogState {
  isOpen: boolean;
  handleOpen: (event?: MouseEvent<HTMLElement>) => void; // <-- MODIFIED
  handleClose: () => void;
  handleConfirm: () => void;
}

export function useDialogState(onConfirm: () => void): DialogState {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback((event?: MouseEvent<HTMLElement>) => {
    // Proactively remove focus from the element that triggered the dialog.
    if (event?.currentTarget) {
      event.currentTarget.blur();
    }
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