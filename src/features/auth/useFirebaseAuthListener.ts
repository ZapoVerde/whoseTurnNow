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
 * 3. MUST NOT create user profiles directly; it must delegate this to the UI by setting the 'new-user' state.
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
  const { setAuthenticated, setUnauthenticated, setStatus } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUnauthenticated();
        return;
      }

      // Check if the user profile already exists in Firestore.
      const userProfile = await userRepository.getUserProfile(firebaseUser.uid);

      if (userProfile) {
        // This is a returning user with an existing profile.
        setAuthenticated(userProfile);
      } else {
        // This is a brand new user.
        // Set the 'new-user' status and provide a temporary user object.
        // The UI will use this to render the name input screen.
        setStatus('new-user');
        setAuthenticated({
          uid: firebaseUser.uid,
          displayName: null, // This is null because they have not set it yet.
          isAnonymous: firebaseUser.isAnonymous,
        });
      }
    });

    return () => unsubscribe();
  }, [setAuthenticated, setUnauthenticated, setStatus]);
}