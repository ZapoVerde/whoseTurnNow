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

/**
 * @id packages/whoseturnnow/src/features/auth/useAuthStore.ts#AppUser
 * @description A simplified, application-specific representation of a user's identity.
 */
export interface AppUser {
  /**
   * The unique, stable identifier for the user, provided by the authentication service.
   */
  uid: string;
  /**
   * The user's chosen global display name. Can be null during initial setup.
   */
  displayName: string | null;
  /**
   * A flag indicating whether the user is in a temporary, anonymous session.
   */
  isAnonymous: boolean;
}

export interface AuthState {
  /**
   * The current status of the authentication lifecycle.
   * 'initializing': The application is starting and has not yet received the auth state.
   * 'authenticated': A user is signed in.
   * 'unauthenticated': No user is signed in.
   */
  status: 'initializing' | 'authenticated' | 'unauthenticated' | 'new-user';
  /**
   * The application-specific user object for the currently authenticated user, or null.
   */
  user: AppUser | null;
  /**
   * Sets the state to 'authenticated' and stores the provided user object.
   * @param user The user object for the newly authenticated user.
   */
  setAuthenticated: (user: AppUser) => void;
  /**
   * Sets the state to 'unauthenticated' and clears the user object.
   */
  setUnauthenticated: () => void;
  /**
   * Manually sets the authentication status, typically for managing the 'initializing' state.
   * @param status The new authentication status.
   */
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
        state.user = user;
        state.status = 'authenticated';
      }),
    setUnauthenticated: () =>
      set((state) => {
        state.user = null;
        state.status = 'unauthenticated';
      }),
    setStatus: (status) =>
      set((state) => {
        state.status = status;
      }),
  })),
);