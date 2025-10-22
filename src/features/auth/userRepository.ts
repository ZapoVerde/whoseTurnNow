/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.ts
 * @stamp {"ts":"2025-10-21T14:00:00Z"}
 * @architectural-role Data Repository
 *
 * @description
 * Encapsulates all Firestore interactions for the `users` collection, providing a
 * clean, reusable, and testable data access layer for user profile management.
 *
 * @core-principles
 * 1. OWNS all I/O logic for the 'users' collection.
 * 2. MUST be the only module that directly reads from or writes to the 'users'
 *    collection, enforcing a strict data boundary.
 * 3. DELEGATES all business logic (e.g., deciding when to create a profile) to
 *    its callers, such as orchestrators or hooks.
 *
 * @api-declaration
 *   - `userRepository.getUserProfile`: Fetches a user profile document.
 *   - `userRepository.createUserProfile`: Creates a new user profile document.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This module performs read and write operations on an external database.
 *     state_ownership: none # It modifies external state but owns no internal application state.
 *     external_io: firestore # Its sole purpose is to interact with the Firestore database.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AppUser } from './useAuthStore';

/**
 * Fetches a user profile document from Firestore based on their UID.
 * @param uid The unique ID of the user to fetch.
 * @returns The AppUser profile object if found, otherwise null.
 */
async function getUserProfile(uid: string): Promise<AppUser | null> {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? (userDocSnap.data() as AppUser) : null;
}

/**
 * Creates a new user profile document in Firestore.
 * @param user The complete AppUser object to save.
 */
async function createUserProfile(user: AppUser): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, user);
}

export const userRepository = {
  getUserProfile,
  createUserProfile,
};