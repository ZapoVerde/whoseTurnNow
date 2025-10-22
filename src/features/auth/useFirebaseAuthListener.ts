/**
 * @file packages/whoseturnnow/src/features/auth/useFirebaseAuthListener.ts
 * @stamp {"ts":"2025-10-21T14:05:00Z"}
 * @architectural-role Orchestrator
 *
 * @description
 * A headless custom hook that serves as the single bridge between the external
 * Firebase Authentication service and the application's internal state. It listens
 * for authentication changes and orchestrates the user profile synchronization
 * lifecycle.
 *
 * @core-principles
 * 1. OWNS the subscription to the external `onAuthStateChanged` listener.
 * 2. ORCHESTRATES the data flow by calling the `userRepository` for data access
 *    and the `useAuthStore` for state updates.
 * 3. MUST NOT render any UI.
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
import { useAuthStore, type AppUser } from './useAuthStore';
import { userRepository } from './userRepository';

export function useFirebaseAuthListener() {
  const { setAuthenticated, setUnauthenticated } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUnauthenticated();
        return;
      }

      let userProfile = await userRepository.getUserProfile(firebaseUser.uid);

      if (!userProfile) {
        // This is a new user. We must create their profile.
        
        // MINIMAL FIX FOR STAGE 1:
        // If the user (especially a new anonymous user) has no display name,
        // provide a sensible default. A full "First-Time Handshake" feature
        // will be built in a later stage to allow the user to choose their name.
        const newDisplayName = firebaseUser.displayName || 'Anonymous User';

        const newUser: AppUser = {
          uid: firebaseUser.uid,
          displayName: newDisplayName,
          isAnonymous: firebaseUser.isAnonymous,
        };
        
        // Delegate profile creation to the repository
        await userRepository.createUserProfile(newUser);
        
        // The newly created profile is now our source of truth
        userProfile = newUser;
      }

      // With a valid profile now guaranteed, set the application state.
      setAuthenticated(userProfile);
    });

    return () => unsubscribe();
  }, [setAuthenticated, setUnauthenticated]);
}