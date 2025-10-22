/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.ts
 * @stamp {"ts":"2025-10-21T14:00:00Z"}
 * @architectural-role Data Repository
 * @description
 * Encapsulates all Firestore and Auth interactions for the `users`
 * collection, providing a clean data access layer for user profile management.
 * @core-principles
 * 1. OWNS all I/O logic for user profiles.
 * 2. MUST be the only module that directly interacts with the `users` collection.
 * 3. ORCHESTRATES both data and auth service calls for complex operations like account deletion.
 * @api-declaration
 *   - userRepository.getUserProfile: Fetches a user profile document.
 *   - userRepository.createUserProfile: Creates a new user profile document.
 *   - userRepository.updateUserDisplayName: Updates a user's display name.
 *   - userRepository.deleteUserAccount: Deletes a user's profile and auth record.
 * @contract
 *   assertions:
 *     purity: mutates # This module performs read/write operations on an external database.
 *     state_ownership: none # It modifies external state but owns no internal application state.
 *     external_io: firestore, https_apis # Its purpose is to interact with Firestore and Firebase Auth services.
 */

import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
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

/**
 * Updates the display name for a given user in their Firestore document.
 * @param uid The unique ID of the user to update.
 * @param newDisplayName The new display name to set.
 */
async function updateUserDisplayName(
  uid: string,
  newDisplayName: string,
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { displayName: newDisplayName });
}

/**
 * Orchestrates the complete deletion of the currently authenticated user's account,
 * including their Firestore profile and their authentication record.
 */
async function deleteUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in to delete.');
  }
  const { uid } = currentUser;

  try {
    // First, delete the user's profile document from Firestore.
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);

    // Then, delete the user's authentication record.
    await deleteUser(currentUser);
  } catch (error) {
    console.error('Error deleting user account:', error);
    // Re-throw the error to be handled by the calling UI, which can
    // potentially prompt for re-authentication if required.
    throw error;
  }
}

export const userRepository = {
  getUserProfile,
  createUserProfile,
  updateUserDisplayName,
  deleteUserAccount,
};