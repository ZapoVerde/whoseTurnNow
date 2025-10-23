/**
 * @file packages/whoseturnnow/src/shared/store/useAppBarStore.ts
 * @stamp {"ts":"2025-10-23T01:40:00Z"}
 * @architectural-role State Management
 * @description
 * Defines the central Zustand store for managing the state of the global AppBar.
 * This allows child screens to declaratively set the AppBar's title, actions,
 * and navigation controls.
 * @core-principles
 * 1. IS the single, authoritative source of truth for the AppBar's configuration.
 * 2. OWNS the state for the AppBar's title, actions, and back button visibility.
 * 3. MUST be a passive data store with simple, mechanical state mutators.
 * 4. DELEGATES the logic for preventing unnecessary updates to its callers.
 * @api-declaration
 *   - AppBarState: The interface for the store's state and actions.
 *   - useAppBarStore: The exported Zustand store hook.
 * @contract
 *   assertions:
 *     purity: mutates # This is a state store; its purpose is to manage mutable state.
 *     state_ownership: [title, actions, showBackButton] # It exclusively owns the global AppBar state.
 *     external_io: none # It is a pure, in-memory store.
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

    // The store is "dumb." Its job is only to apply the state it is given,
    // not to decide if an update is necessary. This logic is now the
    // responsibility of the `useAppBar` hook.
    setConfig: (config) =>
      set((state) => {
        Object.assign(state, config);
      }),
    // --- END FIX ---
    
    reset: () => set(initialState),
  })),
);