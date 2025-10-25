/**
 * @file packages/whoseturnnow/src/features/groups/repository/turns.command.ts
 * @stamp {"ts":"2025-10-24T12:15:00Z"}
 * @architectural-role Data Repository (Command)
 * @description
 * Encapsulates all transactional Firestore interactions for the core turn
 * lifecycle. It ensures that all data modifications also update the necessary
 * denormalized fields required by the security rules.
 * @core-principles
 * 1. OWNS all write I/O logic for the turn lifecycle.
 * 2. MUST use atomic transactions for all state-changing operations.
 * 3. MUST maintain the integrity of denormalized data (e.g., `participantUids` and `adminUids`).
 * @api-declaration
 *   - completeTurnTransaction: Atomically completes a turn.
 *   - skipTurnTransaction: Atomically skips a turn.
 *   - undoTurnTransaction: Atomically reverses a completed turn.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: firestore
 */

import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { AppUser } from '../../auth/useAuthStore';
import type {
  Group,
  TurnCompletedLog,
  TurnUndoneLog,
  TurnSkippedLog,
} from '../../../types/group';
import { _deriveUids } from './_utils';

/**
 * Atomically completes a turn. This involves re-ordering the queue, incrementing
 * the participant's turn count, and creating a new `TURN_COMPLETED` log entry.
 * @param groupId The ID of the group where the turn is being completed.
 * @param actor The user performing the action.
 * @param participantToMoveId The ID of the participant whose turn is being completed.
 */
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

    const participantToMove = participants.find(
      (p) => p.id === participantToMoveId,
    );
    if (!participantToMove) {
      throw new Error(
        `Participant with ID ${participantToMoveId} not found in group.`,
      );
    }

    const newTurnOrder = [
      ...turnOrder.filter((id) => id !== participantToMoveId),
      participantToMoveId,
    ];
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
      _participantUids: groupData.participantUids,
      _adminUids: groupData.adminUids,
    };
    transaction.set(newLogRef, newLogEntry);
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
  logToUndo: TurnCompletedLog & { id: string },
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
    const participantToRestore = participants.find(
      (p) => p.id === participantIdToRestore,
    );

    if (!participantToRestore) {
      throw new Error(
        `Participant ${participantIdToRestore} from log entry not found in group.`,
      );
    }

    const newTurnOrder = [
      participantIdToRestore,
      ...turnOrder.filter((id) => id !== participantIdToRestore),
    ];

    const newParticipants = participants.map((p) =>
      p.id === participantIdToRestore
        ? { ...p, turnCount: Math.max(0, p.turnCount - 1) }
        : p,
    );

    const { participantUids, adminUids } = _deriveUids(newParticipants);

    const newUndoLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
    const newUndoLogEntry: TurnUndoneLog = {
      type: 'TURN_UNDONE',
      completedAt: serverTimestamp(),
      actorUid: actor.uid,
      actorName: actor.displayName || 'Unknown',
      originalParticipantName: logToUndo.participantName,
      _participantUids: groupData.participantUids,
      _adminUids: groupData.adminUids,
    };

    transaction.update(groupDocRef, {
      turnOrder: newTurnOrder,
      participants: newParticipants,
      participantUids,
      adminUids,
    });

    transaction.set(newUndoLogRef, newUndoLogEntry);

    transaction.update(originalLogDocRef, { isUndone: true });
  });
}

/**
* Atomically skips a turn. This involves re-ordering the queue and creating a
* new `TURN_SKIPPED` log entry, without incrementing the turn count.
* @param groupId The ID of the group where the turn is being skipped.
* @param actor The user performing the action.
* @param participantToMoveId The ID of the participant whose turn is being skipped.
*/
export async function skipTurnTransaction(
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

    const participantToMove = participants.find(
      (p) => p.id === participantToMoveId,
    );
    if (!participantToMove) {
      throw new Error(
        `Participant with ID ${participantToMoveId} not found in group.`,
      );
    }

    const newTurnOrder = [
      ...turnOrder.filter((id) => id !== participantToMoveId),
      participantToMoveId,
    ];

    transaction.update(groupDocRef, {
      turnOrder: newTurnOrder,
    });

    const newLogRef = doc(collection(db, 'groups', groupId, 'turnLog'));
    const newLogEntry: TurnSkippedLog = {
      type: 'TURN_SKIPPED',
      completedAt: serverTimestamp(),
      participantId: participantToMoveId,
      participantName: participantToMove.nickname || 'Unknown',
      actorUid: actor.uid,
      actorName: actor.displayName || 'Unknown',
      _participantUids: groupData.participantUids,
      _adminUids: groupData.adminUids,
    };
    transaction.set(newLogRef, newLogEntry);
  });
}