/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.ts
 * @stamp {"ts":"2025-10-22T06:20:00Z"}
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
 *   - userRepository.findBlockingGroup: Checks if a user is the last admin of any group.
 * @contract
 *   assertions:
 *     purity: mutates # This module performs read/write operations on an external database.
 *     state_ownership: none # It modifies external state but owns no internal application state.
 *     external_io: firestore, https_apis # Its purpose is to interact with Firestore and Firebase Auth services.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import type { AppUser } from './useAuthStore';
import type { Group } from '../../types/group';
import { groupsRepository } from '../groups/repository';
import { logger } from '../../shared/utils/debug';

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
 * Checks if a user is the sole admin of any group they are a member of.
 * This is a client-side gatekeeper to prevent account deletion that would
 * lead to orphaned groups.
 * @param uid The UID of the user requesting deletion.
 * @returns The name of the first blocking group found, otherwise null.
 */
async function findBlockingGroup(uid: string): Promise<string | null> {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where(`participantUids.${uid}`, '==', true));
  const userGroupsSnap = await getDocs(q);

  for (const doc of userGroupsSnap.docs) {
    const group = doc.data() as Group;
    const admins = group.participants.filter(p => p.role === 'admin');
    if (admins.length === 1 && admins[0].uid === uid) {
      return group.name;
    }
  }
  return null;
}

/**
 * Orchestrates the complete deletion of the currently authenticated user's account.
 * It performs a critical pre-flight check to prevent orphaning groups before
 * proceeding with any destructive operations.
 */
async function deleteUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in to delete.');
  }
  const { uid } = currentUser;

  // Step 1: Perform the critical pre-flight "gatekeeper" check.
  const blockingGroup = await findBlockingGroup(uid);
  if (blockingGroup) {
    // If a blocking group is found, fail the entire operation immediately.
    throw new Error(`Cannot delete account. You are the last admin of "${blockingGroup}". Please promote another admin or delete the group first.`);
  }

  try {
    // Step 2: Proceed with cleanup only if the gatekeeper check passes.
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where(`participantUids.${uid}`, '==', true));
    const userGroupsSnap = await getDocs(q);

    const removalPromises = userGroupsSnap.docs.map(async (groupDoc) => {
      const group = groupDoc.data() as Group;
      const participantToRemove = group.participants.find(p => p.uid === uid);
      if (participantToRemove) {
        return groupsRepository.removeParticipant(group.gid, participantToRemove.id);
      }
    });
    await Promise.all(removalPromises);

    // Step 3: Delete the core profile and auth record.
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
    await deleteUser(currentUser);
  } catch (error) {
    logger.error('Error during the final stages of account deletion:', { error });
    throw error;
  }
}

export const userRepository = {
  getUserProfile,
  createUserProfile,
  updateUserDisplayName,
  deleteUserAccount,
  findBlockingGroup,
};