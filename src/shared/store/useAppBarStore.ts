/**
 * @file packages/whoseturnnow/src/shared/store/useAppBarStore.ts
 * @stamp {"ts":"2025-10-22T18:30:00Z"}
 * @architectural-role State Management
 * @description
 * Defines the central Zustand store for managing the state of the global AppBar.
 * This allows child screens to declaratively set the AppBar's title, actions,
 * and navigation controls.
 * @core-principles
 * 1. IS the single source of truth for the AppBar's configuration.
 * 2. OWNS the state for the AppBar's title, actions, and back button visibility.
 * 3. MUST provide actions to set the configuration and reset it to default.
 * @api-declaration
 *   - AppBarState: The interface for the store's state and actions.
 *   - useAppBarStore: The exported Zustand store hook.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [title, actions, showBackButton]
 *     external_io: none
 */

import React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface AppBarState {
  title: string;
  actions: React.ReactNode | null;
  showBackButton: boolean;
  setConfig: (config: Partial<AppBarState>) => void;
  reset: () => void;
}

const initialState: Omit<AppBarState, 'setConfig' | 'reset'> = {
  title: 'Whose Turn Now',
  actions: null,
  showBackButton: false,
};

export const useAppBarStore = create<AppBarState>()(
  immer((set) => ({
    ...initialState,
    setConfig: (config) =>
      set((state) => {
        Object.assign(state, config);
      }),
    reset: () => set(initialState),
  })),
);