/**
 * @file packages/whoseturnnow/src/shared/store/useAppStatusStore.ts
 * @architectural-role State Management
 * @description
 * Defines the central Zustand store for the application's global connection
 * status, implementing the state machine for the "Circuit Breaker" pattern.
 * @core-principles
 * 1. IS the single source of truth for the application's connection mode ('live' vs. 'degraded').
 * 2. OWNS the state machine that determines whether the app uses real-time listeners or static fetches.
 * 3. MUST be a pure, in-memory store.
 * @api-declaration
 *   - ConnectionMode: The type for the connection status ('live' | 'degraded').
 *   - AppStatusState: The interface for the store's state and actions.
 *   - useAppStatusStore: The exported Zustand store hook.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [connectionMode]
 *     external_io: none
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * @id packages/whoseturnnow/src/shared/store/useAppStatusStore.ts#ConnectionMode
 * @description Defines the possible connection modes for the application.
 * 'live' -> Using real-time Firestore listeners.
 * 'degraded' -> Firestore listeners have failed; using one-time static fetches.
 */
export type ConnectionMode = 'live' | 'degraded';

/**
 * @id packages/whoseturnnow/src/shared/store/useAppStatusStore.ts#AppStatusState
 * @description The complete state and action interface for the global status store.
 */
export interface AppStatusState {
  /**
   * The current connection mode of the application.
   */
  connectionMode: ConnectionMode;
  /**
   * An action to set the application's connection mode.
   * @param mode The new connection mode to apply.
   */
  setConnectionMode: (mode: ConnectionMode) => void;
}

const initialState: Pick<AppStatusState, 'connectionMode'> = {
  connectionMode: 'live',
};

export const useAppStatusStore = create<AppStatusState>()(
  immer((set) => ({
    ...initialState,

    setConnectionMode: (mode) =>
      set((state) => {
        if (state.connectionMode !== mode) {
          // --- DEBUG LOG ---
          console.log(`[AppStatusStore] Connection mode transitioning from '${state.connectionMode}' to '${mode}'.`);
          state.connectionMode = mode;
        }
      }),
  })),
);