/**
 * @file packages/whoseturnnow/src/features/auth/useFirebaseAuthListener.ts
 * @stamp {"ts":"2025-10-21T14:05:00Z"}
 * @architectural-role Orchestrator
 *
 * @description
 * A headless custom hook that serves as the single bridge between the external
 * Firebase Authentication service and the application's internal state. It listens
 * for authentication changes and orchestrates the user profile synchronization
 * lifecycle, handing off to the UI for new user creation.
 *
 * @core-principles
 * 1. OWNS the subscription to the external `onAuthStateChanged` listener.
 * 2. ORCHESTRATES the data flow by calling the `userRepository` for data access
 *    and the `useAuthStore` for state updates.
 * 3. MUST correctly manage the application's authentication status lifecycle.
 *
 * @api-declaration
 *   - `useFirebaseAuthListener`: The exported headless React hook.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This hook has side effects, subscribing to services and triggering state changes.
 *     state_ownership: none # It triggers mutations on other stores but owns no global state itself.
 *     external_io: https_apis # It directly interacts with the Firebase Authentication service listener.
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { userRepository } from './userRepository';

export function useFirebaseAuthListener() {
  const { setAuthenticated, setUnauthenticated, setNewUser } = useAuthStore();

  useEffect(() => {
    // --- DEBUG LOG ---
    logger.log('[Listener] Hook MOUNTED. Subscribing to auth changes.');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // --- DEBUG LOG ---
      logger.log('[Listener] onAuthStateChanged FIRED.', { 
        uid: firebaseUser?.uid, 
        isAnonymous: firebaseUser?.isAnonymous 
      });

      if (!firebaseUser) {
        // --- DEBUG LOG ---
        logger.log('[Listener] User is NULL. Setting unauthenticated.');
        setUnauthenticated();
        return;
      }

      const userProfile = await userRepository.getUserProfile(firebaseUser.uid);

      if (userProfile) {
        // --- DEBUG LOG ---
        logger.log('[Listener] Profile FOUND in database. Setting authenticated.', userProfile);
        setAuthenticated(userProfile);
      } else {
        // --- DEBUG LOG ---
        logger.log('[Listener] Profile NOT FOUND. Setting to new-user state.');
        setNewUser({
          uid: firebaseUser.uid,
          displayName: null,
          isAnonymous: firebaseUser.isAnonymous,
        });
      }
    });

    return () => {
      // --- DEBUG LOG ---
      logger.log('[Listener] Hook UNMOUNTED. Unsubscribing.');
      unsubscribe();
    };
  }, [setAuthenticated, setUnauthenticated, setNewUser]);
}