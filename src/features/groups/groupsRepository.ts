/**
 * @file packages/whoseturnnow/src/features/groups/groupsRepository.ts
 * @stamp {"ts":"2025-10-21T17:05:00Z"}
 * @architectural-role Data Repository
 * @description
 * Encapsulates all Firestore interactions for the `groups` collection, providing a
 * dedicated data access layer for all data creation, fetching, and modification.
 * @core-principles
 * 1. OWNS all I/O logic for group data and its sub-collections.
 * 2. MUST be the only module that directly interacts with the Firestore `groups`
 *    collection.
 * 3. ENFORCES data consistency through atomic transactions for all state-changing operations.
 * @api-declaration
 *   - createGroup: Creates a new Group document.
 *   - getUserGroups: Establishes a real-time listener for a user's groups.
 *   - getGroup: Establishes a real-time listener for a single group.
 *   - addManagedParticipant: Adds a new placeholder participant to a group.
 *   - getGroupTurnLog: Establishes a real-time listener for a group's turn log.
 *   - completeTurnTransaction: Atomically completes a turn.
 *   - updateParticipantRole: Changes a participant's role.
 *   - removeParticipant: Removes a participant from a group.
 *   - resetAllTurnCounts: Atomically resets all turn counts and creates a log entry.
 *   - updateGroupSettings: Updates a group's name and icon.
 *   - leaveGroup: Allows a user to remove themselves from a group.
 *   - deleteGroup: Deletes an entire group document.
 *   - joinGroupAsNewParticipant: Adds a new user to a group.
 *   - claimPlaceholder: Allows a user to take over a placeholder slot.
 *   - undoTurnTransaction: Atomically reverses a completed turn.
 * @contract
 *   assertions:
 *     purity: mutates # This module performs read/write operations on an external database.
 *     state_ownership: none # It modifies external state but owns no internal application state.
 *     external_io: firestore # Its sole purpose is to interact with the Firestore database.
 */

import {
  collection, doc, setDoc, query, where, onSnapshot, updateDoc, arrayUnion,
  arrayRemove, runTransaction, serverTimestamp, orderBy, limit, getDoc,
  deleteDoc, type Unsubscribe,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/firebase';
import type { AppUser } from '../auth/useAuthStore';
import type {
  Group, TurnParticipant, LogEntry, TurnCompletedLog, CountsResetLog, TurnUndoneLog,
} from '../../types/group';

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
      nickname: creator.displayName ?? undefined,
    };
  
    const newGroup: Group = {
      gid,
      name,
      icon,
      ownerUid: creator.uid,
      participants: [creatorParticipant],
      turnOrder: [participantId],
      participantUids: [creator.uid],
    };
  
    const groupDocRef = doc(db, 'groups', gid);
    await setDoc(groupDocRef, newGroup);
    return gid;
  }
  
  export function getUserGroups(
    userId: string,
    onUpdate: (groups: Group[]) => void,
  ): Unsubscribe {
    const groupsCollectionRef = collection(db, 'groups');
    const q = query(
      groupsCollectionRef,
      where('participantUids', 'array-contains', userId),
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groups = querySnapshot.docs.map((doc) => doc.data() as Group);
      onUpdate(groups);
    });
  
    return unsubscribe;
  }
  
  export function getGroup(
    groupId: string,
    onUpdate: (group: Group | null) => void,
  ): Unsubscribe {
    const groupDocRef = doc(db, 'groups', groupId);
    return onSnapshot(groupDocRef, (docSnap) => {
      onUpdate(docSnap.exists() ? (docSnap.data() as Group) : null);
    });
  }
  
  export async function addManagedParticipant(
    groupId: string,
    participantName: string,
  ): Promise<void> {
    const participantId = uuidv4();
    const newParticipant: TurnParticipant = {
      id: participantId,
      uid: null,
      nickname: participantName,
      role: 'member',
      turnCount: 0,
    };
  
    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      participants: arrayUnion(newParticipant),
      turnOrder: arrayUnion(participantId),
    });
  }
  
  export function getGroupTurnLog(
    groupId: string,
    onUpdate: (logs: (LogEntry & { id: string })[]) => void,
  ): Unsubscribe {
    const logsCollectionRef = collection(db, 'groups', groupId, 'turnLog');
    const q = query(logsCollectionRef, orderBy('completedAt', 'desc'), limit(50));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // FIX: Map over the docs and explicitly include the document 'id' with the data.
      const logs = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as LogEntry),
        id: doc.id,
      }));
      onUpdate(logs);
    });
  
    return unsubscribe;
  }
  
  export async function completeTurnTransaction(
    groupId: string,
    actor: AppUser,
    participantToMoveId: string,
  ): Promise<void> {
    const groupDocRef = doc(db, 'groups', groupId);
  
    await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupDocRef);
      if (!groupDoc.exists()) {
        throw new Error(`Group with ID ${groupId} does not exist.`);
      }
  
      const groupData = groupDoc.data() as Group;
      const { participants, turnOrder } = groupData;
  
      const participantToMove = participants.find((p) => p.id === participantToMoveId);
      if (!participantToMove) {
        throw new Error(`Participant with ID ${participantToMoveId} not found in group.`);
      }
  
      const newTurnOrder = [...turnOrder.filter((id) => id !== participantToMoveId), participantToMoveId];
      const newParticipants = participants.map((p) =>
        p.id === participantToMoveId ? { ...p, turnCount: p.turnCount + 1 } : p,
      );
  
      transaction.update(groupDocRef, {
        turnOrder: newTurnOrder,
        participants: newParticipants,
      });
  
      const newLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
      const newLogEntry: TurnCompletedLog = {
        type: 'TURN_COMPLETED',
        completedAt: serverTimestamp(),
        participantId: participantToMoveId,
        participantName: participantToMove.nickname || 'Unknown',
        actorUid: actor.uid,
        actorName: actor.displayName || 'Unknown',
      };
      transaction.set(newLogRef, newLogEntry);
    });
  }

/**
 * Updates the role of a specific participant within a group.
 */
export async function updateParticipantRole(
  groupId: string,
  participantId: string,
  newRole: 'admin' | 'member',
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  const group = groupSnap.data() as Group;
  const newParticipants = group.participants.map((p) =>
    p.id === participantId ? { ...p, role: newRole } : p,
  );
  await updateDoc(groupDocRef, { participants: newParticipants });
}

/**
 * Removes a participant from a group entirely.
 */
export async function removeParticipant(
  groupId: string,
  participantId: string,
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) {
    throw new Error('Group not found');
  }
  const group = groupSnap.data() as Group;
  const participantToRemove = group.participants.find((p) => p.id === participantId);

  if (!participantToRemove) return; // Already removed

  const newParticipants = group.participants.filter((p) => p.id !== participantId);
  const updatePayload: any = {
    participants: newParticipants,
    turnOrder: arrayRemove(participantId),
  };

  if (participantToRemove.uid) {
    updatePayload.participantUids = arrayRemove(participantToRemove.uid);
  }

  await updateDoc(groupDocRef, updatePayload);
}

/**
 * Atomically resets all participant turn counts to 0 and creates a log entry.
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
    const newParticipants = group.participants.map((p) => ({ ...p, turnCount: 0 }));

    transaction.update(groupDocRef, { participants: newParticipants });

    const newLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
    const newLogEntry: CountsResetLog = {
      type: 'COUNTS_RESET',
      completedAt: serverTimestamp(),
      actorUid: actor.uid,
      actorName: actor.displayName || 'Unknown Actor',
    };
    transaction.set(newLogRef, newLogEntry);
  });
}

/**
 * Updates a group's settings (name and icon).
 */
export async function updateGroupSettings(
  groupId: string,
  settings: { name: string; icon: string },
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  await updateDoc(groupDocRef, settings);
}

/**
 * Allows a user to leave a group by removing their participant entry.
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
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
 * Permanently deletes a group document.
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  await deleteDoc(groupDocRef);
}

/**
 * Adds a new user as a new participant to a group.
 * @param groupId The group to join.
 * @param user The user who is joining.
 */
export async function joinGroupAsNewParticipant(
  groupId: string,
  user: AppUser,
): Promise<void> {
  const participantId = uuidv4();
  const newParticipant: TurnParticipant = {
    id: participantId,
    uid: user.uid,
    nickname: user.displayName || 'New User',
    role: 'member',
    turnCount: 0,
  };

  const groupDocRef = doc(db, 'groups', groupId);
  await updateDoc(groupDocRef, {
    participants: arrayUnion(newParticipant),
    turnOrder: arrayUnion(participantId),
    participantUids: arrayUnion(user.uid),
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

    const targetParticipant = group.participants[participantIndex];

    // --- Validation ---
    if (targetParticipant.uid !== null) {
      throw new Error('This participant slot has already been claimed.');
    }

    // Update the participant and the denormalized UID array
    group.participants[participantIndex].uid = user.uid;
    const newParticipantUids = [...group.participantUids, user.uid];

    transaction.update(groupDocRef, {
      participants: group.participants,
      participantUids: newParticipantUids,
    });
  });
}

/**
 * Atomically reverses a completed turn. This involves reverting the group state
 * (turn order and count), creating a new log entry for the undo action, and
 * flagging the original log entry as undone.
 * @param groupId The ID of the group.
 * @param actor The user performing the undo action.
 * @param logToUndo The original 'TURN_COMPLETED' log object, which MUST include its Firestore document ID.
 */
export async function undoTurnTransaction(
  groupId: string,
  actor: AppUser,
  logToUndo: TurnCompletedLog & { id: string }
): Promise<void> {
  const groupDocRef = doc(db, 'groups', groupId);
  const originalLogDocRef = doc(db, 'groups', groupId, 'turnLog', logToUndo.id);

  await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupDocRef);
      if (!groupDoc.exists()) {
          throw new Error(`Group with ID ${groupId} does not exist.`);
      }

      const groupData = groupDoc.data() as Group;
      const { participants, turnOrder } = groupData;

      const participantIdToRestore = logToUndo.participantId;
      const participantToRestore = participants.find(p => p.id === participantIdToRestore);

      if (!participantToRestore) {
          throw new Error(`Participant ${participantIdToRestore} from log entry not found in group.`);
      }

      // Revert State: Move participant back to the front of the queue
      const newTurnOrder = [
          participantIdToRestore,
          ...turnOrder.filter(id => id !== participantIdToRestore)
      ];

      // Revert State: Decrement the participant's turn count
      const newParticipants = participants.map(p =>
          p.id === participantIdToRestore
              ? { ...p, turnCount: Math.max(0, p.turnCount - 1) } // Prevent negative counts
              : p
      );
      
      // Create Log: A new entry for the undo action itself
      const newUndoLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
      const newUndoLogEntry: TurnUndoneLog = {
          type: 'TURN_UNDONE',
          completedAt: serverTimestamp(),
          actorUid: actor.uid,
          actorName: actor.displayName || 'Unknown',
          originalParticipantName: logToUndo.participantName,
      };

      // --- Execute Atomic Writes ---
      // 1. Update the group document with the reverted state
      transaction.update(groupDocRef, {
          turnOrder: newTurnOrder,
          participants: newParticipants
      });

      // 2. Create the new log entry for the undo action
      transaction.set(newUndoLogRef, newUndoLogEntry);

      // 3. Flag the original log entry as undone
      transaction.update(originalLogDocRef, { isUndone: true });
  });
}