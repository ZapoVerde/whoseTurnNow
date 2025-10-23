/**
 * @file packages/whoseturnnow/src/features/groups/repository/group.command.ts
 * @stamp {"ts":"2025-10-23T09:50:00Z"}
 * @architectural-role Data Repository (Command)
 * @description
 * Encapsulates all write-only and transactional Firestore interactions for
 * high-level Group entity management. This includes creation, deletion, and
 * settings updates.
 * @core-principles
 * 1. OWNS all write I/O logic for the Group entity lifecycle.
 * 2. MUST NOT contain any functions that only read or subscribe to data.
 * 3. MUST use atomic transactions for operations that modify state and create
 *    log entries simultaneously (e.g., resetting counts).
 * @api-declaration
 *   - createGroup: Creates a new Group document.
 *   - updateGroupSettings: Updates a group's name and icon.
 *   - resetAllTurnCounts: Atomically resets all turn counts and creates a log entry.
 *   - deleteGroup: Deletes an entire group document.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: firestore
 */

import {
    collection,
    doc,
    setDoc,
    updateDoc,
    runTransaction,
    serverTimestamp,
    deleteDoc,
  } from 'firebase/firestore';
  import { v4 as uuidv4 } from 'uuid';
  import { db } from '../../../lib/firebase';
  import type { AppUser } from '../../auth/useAuthStore';
  import type {
    Group,
    TurnParticipant,
    CountsResetLog,
  } from '../../../types/group';
  import { _deriveUids } from './_utils';
  
  /**
   * Creates a new, valid Group document in Firestore.
   * @param options An object containing the name, icon, and creator's user object.
   * @returns The unique ID of the newly created group.
   */
  export async function createGroup(options: {
    name: string;
    icon: string;
    creator: AppUser;
  }): Promise<string> {
    const { name, icon, creator } = options;
    const gid = uuidv4();
    const participantId = uuidv4();
  
    const creatorParticipant: TurnParticipant = {
      id: participantId,
      uid: creator.uid,
      role: 'admin',
      turnCount: 0,
      nickname: creator.displayName ?? 'default',
    };
  
    const participants = [creatorParticipant];
    const { participantUids, adminUids } = _deriveUids(participants);
  
    const newGroup: Group = {
      gid,
      name,
      icon,
      ownerUid: creator.uid,
      participants,
      turnOrder: [participantId],
      participantUids,
      adminUids,
    };
  
    const groupDocRef = doc(db, 'groups', gid);
    await setDoc(groupDocRef, newGroup);
    return gid;
  }
  
  /**
   * Updates a group's settings (name and icon).
   * @param groupId The ID of the group to update.
   * @param settings An object containing the new name and/or icon.
   */
  export async function updateGroupSettings(
    groupId: string,
    settings: { name: string; icon: string },
  ): Promise<void> {
    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, settings);
  }
  
  /**
   * Atomically resets all participant turn counts to 0 and creates a log entry.
   * @param groupId The ID of the group to reset.
   * @param actor The user performing the reset action.
   */
  export async function resetAllTurnCounts(
    groupId: string,
    actor: AppUser,
  ): Promise<void> {
    const groupDocRef = doc(db, 'groups', groupId);
    await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupDocRef);
      if (!groupDoc.exists()) throw new Error('Group not found.');
  
      const group = groupDoc.data() as Group;
      const newParticipants = group.participants.map((p) => ({
        ...p,
        turnCount: 0,
      }));
  
      transaction.update(groupDocRef, { participants: newParticipants });
  
      const newLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
      const newLogEntry: CountsResetLog = {
        type: 'COUNTS_RESET',
        completedAt: serverTimestamp(),
        actorUid: actor.uid,
        actorName: actor.displayName || 'Unknown Actor',
        _participantUids: group.participantUids,
      };
      transaction.set(newLogRef, newLogEntry);
    });
  }
  
  /**
   * Permanently deletes a group document and all its sub-collections.
   * @param groupId The ID of the group to delete.
   */
  export async function deleteGroup(groupId: string): Promise<void> {
    const groupDocRef = doc(db, 'groups', groupId);
    await deleteDoc(groupDocRef);
  }