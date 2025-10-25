/**
 * @file packages/whoseturnnow/src/features/auth/useAuthStore.ts
 * @stamp {"ts":"2025-10-21T14:00:00Z"}
 * @architectural-role State Management
 *
 * @description
 * Defines the central Zustand store for managing global user authentication state. It
 * serves as the client-side single source of truth for the user's identity and
 * session status.
 *
 * @core-principles
 * 1. IS the single source of truth for the current user's identity and auth status.
 * 2. OWNS the `AppUser` domain model for the client application.
 * 3. MUST only be mutated by the `useFirebaseAuthListener` hook to ensure a
 *    single, unidirectional data flow from the external auth service.
 *
 * @api-declaration
 *   - `AppUser`: The interface defining the application-specific user model.
 *   - `AuthState`: The interface defining the store's state and actions.
 *   - `useAuthStore`: The exported Zustand store hook.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This is a state store; its purpose is to manage mutable state.
 *     state_ownership: [status, user] # It exclusively owns the global auth state.
 *     external_io: none # It is a pure, in-memory store and MUST NOT perform any I/O.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { logger } from '../../shared/utils/debug';

export interface AppUser {
  uid: string;
  displayName: string | null;
  isAnonymous: boolean;
}

export interface AuthState {
  status: 'initializing' | 'authenticated' | 'unauthenticated' | 'new-user';
  user: AppUser | null;
  setAuthenticated: (user: AppUser) => void;
  setUnauthenticated: () => void;
  setNewUser: (user: AppUser) => void;
  setStatus: (status: AuthState['status']) => void;
}

const initialState: Pick<AuthState, 'status' | 'user'> = {
  status: 'initializing',
  user: null,
};

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    ...initialState,
    setAuthenticated: (user) =>
      set((state) => {
        // --- DEBUG LOG ---
        logger.log('[AuthStore] ACTION: setAuthenticated', { user });
        state.user = user;
        state.status = 'authenticated';
      }),
    setUnauthenticated: () =>
      set((state) => {
        // --- DEBUG LOG ---
        logger.log('[AuthStore] ACTION: setUnauthenticated');
        state.user = null;
        state.status = 'unauthenticated';
      }),
    setNewUser: (user) =>
      set((state) => {
        // --- DEBUG LOG ---
        logger.log('[AuthStore] ACTION: setNewUser', { user });
        state.user = user;
        state.status = 'new-user';
      }),
    setStatus: (status) =>
      set((state) => {
        // --- DEBUG LOG ---
        logger.log(`[AuthStore] ACTION: setStatus to '${status}'`);
        state.status = status;
      }),
  })),
);