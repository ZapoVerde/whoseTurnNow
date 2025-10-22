/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useMenuState.ts
 * @architectural-role Hook
 * @description A generic and reusable hook to encapsulate the standard state
 * management logic for a Material-UI menu component.
 *
 * @core-principles
 * 1. IS a pure, single-purpose hook for UI state management.
 * 2. OWNS the `anchorEl` state and the open/close handlers for a menu.
 * 3. MUST NOT contain any business logic; it is entirely presentational.
 *
 * @api-declaration
 *   - `MenuState`: The interface for the object returned by the hook.
 *   - `useMenuState`: The exported hook function.
 *
 * @contract
 *   assertions:
 *     purity: pure # This hook's logic depends only on React's internal state.
 *     state_ownership: [anchorEl] # It exclusively owns the anchor element state.
 *     external_io: none # This hook performs no I/O.
 */

import { useState, type MouseEvent } from 'react';

/**
 * @id packages/whoseturnnow/src/features/groups/hooks/useMenuState.ts#MenuState
 * @description The return type for the useMenuState hook, providing all necessary
 * state and handlers to control a menu.
 */
export interface MenuState {
  /**
   * The DOM element that the menu should be anchored to. `null` if the menu is closed.
   */
  anchorEl: HTMLElement | null;
  /**
   * A boolean flag indicating whether the menu is currently open.
   */
  isOpen: boolean;
  /**
   * A callback to open the menu, anchoring it to the clicked element.
   * @param event The React mouse event from the element that triggered the menu.
   */
  handleOpen: (event: MouseEvent<HTMLElement>) => void;
  /**
   * A callback to close the menu.
   */
  handleClose: () => void;
}

/**
 * A generic hook to manage the state of a single Material-UI menu.
 * @returns {MenuState} An object containing the menu's state and its handlers.
 */
export function useMenuState(): MenuState {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return {
    anchorEl,
    isOpen: Boolean(anchorEl),
    handleOpen,
    handleClose,
  };
}