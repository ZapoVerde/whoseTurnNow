/**
 * @file packages/whoseturnnow/src/features/groups/repository/participants.command.ts
 * @stamp {"ts":"2025-10-23T09:55:00Z"}
 * @architectural-role Data Repository (Command)
 * @description
 * Encapsulates all write-only and transactional Firestore interactions for
 * managing a group's participants and membership. This includes adding,

 * removing, updating roles, and handling join/leave logic.
 * @core-principles
 * 1. OWNS all write I/O logic for participant and membership management.
 * 2. MUST NOT contain any functions that only read or subscribe to data.
 * 3. MUST use atomic transactions to ensure data integrity when modifying the
 *    participants array and its derived UID maps.
 * @api-declaration
 *   - addManagedParticipant: Adds a new placeholder participant.
 *   - updateParticipantRole: Changes a participant's role.
 *   - removeParticipant: Removes a participant from a group.
 *   - leaveGroup: Allows a user to remove themselves from a group.
 *   - joinGroupAsNewParticipant: Adds a new user to a group.
 *   - claimPlaceholder: Allows a user to take over a placeholder slot.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: firestore
 */

import { doc, runTransaction, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../lib/firebase';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnParticipant } from '../../../types/group';
import { _deriveUids } from './_utils';
import { logger } from '../../../shared/utils/debug';

/**
 * Adds a new "Managed Participant" (a placeholder without a user account) to a group.
 * @param groupId The ID of the group to modify.
 * @param participantName The name for the new placeholder.
 */
export async function addManagedParticipant(
  groupId: string,
  participantName: string,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);

  await runTransaction(db, async (transaction) => {
    const groupDoc = await transaction.get(groupDocRef);
    if (!groupDoc.exists()) {
      throw new Error('Group does not exist!');
    }

    const groupData = groupDoc.data() as Group;

    const participantId = uuidv4();
    const newParticipant: TurnParticipant = {
      id: participantId,
      uid: null,
      nickname: participantName,
      role: 'member',
      turnCount: 0,
    };

    const newParticipants = [...groupData.participants, newParticipant];
    const newTurnOrder = [...groupData.turnOrder, participantId];
    const { participantUids, adminUids } = _deriveUids(newParticipants);

    transaction.update(groupDocRef, {
      participants: newParticipants,
      turnOrder: newTurnOrder,
      participantUids,
      adminUids,
    });
  });
}

/**
 * Updates the role of a specific participant within a group.
 * @param groupId The ID of the group to modify.
 * @param participantId The ID of the participant whose role is changing.
 * @param newRole The new role to assign ('admin' or 'member').
 */
export async function updateParticipantRole(
  groupId: string,
  participantId: string,
  newRole: 'admin' | 'member',
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);

  await runTransaction(db, async (transaction) => {
    const groupDoc = await transaction.get(groupDocRef);
    if (!groupDoc.exists()) {
      throw new Error('Group does not exist!');
    }
    const group = groupDoc.data() as Group;

    const newParticipants = group.participants.map((p) =>
      p.id === participantId ? { ...p, role: newRole } : p,
    );

    const { participantUids, adminUids } = _deriveUids(newParticipants);

    transaction.update(groupDocRef, {
      participants: newParticipants,
      participantUids,
      adminUids,
    });
  });
}

/**
 * Removes a participant from a group entirely.
 * @param groupId The ID of the group to modify.
 * @param participantId The ID of the participant to remove.
 */
export async function removeParticipant(
  groupId: string,
  participantId: string,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);

  await runTransaction(db, async (transaction) => {
    const groupDoc = await transaction.get(groupDocRef);
    if (!groupDoc.exists()) {
      throw new Error('Group does not exist!');
    }
    const group = groupDoc.data() as Group;

    const newParticipants = group.participants.filter(
      (p) => p.id !== participantId,
    );
    const newTurnOrder = group.turnOrder.filter((id) => id !== participantId);

    const { participantUids, adminUids } = _deriveUids(newParticipants);

    transaction.update(groupDocRef, {
      participants: newParticipants,
      turnOrder: newTurnOrder,
      participantUids,
      adminUids,
    });
  });
}

/**
 * Allows a user to leave a group by removing their own participant entry.
 * @param groupId The ID of the group to leave.
 * @param userId The UID of the user who is leaving.
 */
export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) return;

  const group = groupSnap.data() as Group;
  const participant = group.participants.find((p) => p.uid === userId);
  if (participant) {
    await removeParticipant(groupId, participant.id);
  }
}

/**
 * Adds a new, authenticated user as a new participant to a group.
 * @param groupId The group to join.
 * @param user The user who is joining.
 */
export async function joinGroupAsNewParticipant(
  groupId: string,
  user: AppUser,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);

  await runTransaction(db, async (transaction) => {
    const groupDoc = await transaction.get(groupDocRef);
    if (!groupDoc.exists()) {
      throw new Error('Group does not exist!');
    }
    const group = groupDoc.data() as Group;

    if (group.participantUids[user.uid]) {
      logger.log('User is already in this group.');
      return;
    }

    const newParticipant: TurnParticipant = {
      id: uuidv4(),
      uid: user.uid,
      nickname: user.displayName || 'New User',
      role: 'member',
      turnCount: 0,
    };

    const newParticipants = [...group.participants, newParticipant];
    const newTurnOrder = [...group.turnOrder, newParticipant.id];
    const { participantUids, adminUids } = _deriveUids(newParticipants);

    transaction.update(groupDocRef, {
      participants: newParticipants,
      turnOrder: newTurnOrder,
      participantUids,
      adminUids,
    });
  });
}

/**
 * Atomically claims an existing placeholder ("Managed Participant") slot for a user.
 * @param groupId The group containing the placeholder.
 * @param participantId The ID of the placeholder slot to claim.
 * @param user The user claiming the slot.
 */
export async function claimPlaceholder(
  groupId: string,
  participantId: string,
  user: AppUser,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  await runTransaction(db, async (transaction) => {
    const groupDoc = await transaction.get(groupDocRef);
    if (!groupDoc.exists()) {
      throw new Error('Group not found while trying to claim placeholder.');
    }

    const group = groupDoc.data() as Group;
    const participantIndex = group.participants.findIndex(
      (p) => p.id === participantId,
    );

    if (participantIndex === -1) {
      throw new Error('Participant placeholder not found.');
    }
    if (group.participants[participantIndex].uid !== null) {
      throw new Error('This participant slot has already been claimed.');
    }

    // --- THIS IS THE FIX ---
    // Update the participant's UID to link the account.
    group.participants[participantIndex].uid = user.uid;
    // Overwrite the placeholder nickname with the user's global displayName,
    // providing a fallback to satisfy the type system.
    group.participants[participantIndex].nickname = user.displayName || 'New Member';
    // --- END FIX ---
    
    const { participantUids, adminUids } = _deriveUids(group.participants);

    transaction.update(groupDocRef, {
      participants: group.participants,
      participantUids,
      adminUids,
    });
  });
}

