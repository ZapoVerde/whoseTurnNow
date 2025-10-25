/**
 * @file packages/whoseturnnow/src/features/groups/repository/groups.query.ts
 * @stamp {"ts":"2025-10-25T09:45:00Z"}
 * @architectural-role Data Repository (Query)
 * @description
 * Encapsulates all read-only Firestore interactions. This module implements the
 * "Circuit Breaker" pattern, attempting to use real-time listeners but gracefully
 * degrading to one-time static fetches if concurrent connection limits are reached.
 * @core-principles
 * 1. OWNS all read-only I/O logic for group data.
 * 2. MUST attempt to establish real-time listeners (`onSnapshot`) by default.
 * 3. MUST catch `resource-exhausted` errors, set the global app status to
 *    'degraded', and perform a fallback static fetch (`getDocs` or `getDoc`).
 * @api-declaration
 *   - All functions are exported via the `groupsRepository` object in `index.ts`.
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: firestore
 */

import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDoc,
  getDocs,
  type Unsubscribe,
  type Query,
  type DocumentReference,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import { logger } from '../../../shared/utils/debug';
import type { Group, LogEntry } from '../../../types/group';

const FIREBASE_RESOURCE_EXHAUSTED = 'resource-exhausted';

/**
 * A private, generic helper that implements the circuit breaker logic.
 * It now accepts a `transform` function to handle different data shapes.
 */
function createResilientListener<T>(
  q: Query | DocumentReference,
  onUpdate: (data: T) => void,
  transform: (snapshot: any) => T,
): Unsubscribe {
  const { setConnectionMode } = useAppStatusStore.getState();

  const unsubscribe = onSnapshot(
    q as Query,
    (snapshot: any) => {
      logger.debug('[CircuitBreaker] Real-time update received. Ensuring LIVE mode.');
      setConnectionMode('live');
      const data = transform(snapshot);
      onUpdate(data);
    },
    async (error: FirestoreError) => {
      // THIS IS THE FIX: The error data is now in a single context object.
      logger.error('[CircuitBreaker] Listener error:', {
        code: error.code,
        message: error.message,
      });

      if (error.code === FIREBASE_RESOURCE_EXHAUSTED) {
        logger.warn('[CircuitBreaker] TRIPPED! Degrading to static fetch.');
        setConnectionMode('degraded');

        try {
          const staticSnapshot =
            q.type === 'document' ? await getDoc(q) : await getDocs(q as Query);
          const data = transform(staticSnapshot);
          onUpdate(data);
        } catch (staticFetchError: unknown) {
          logger.error('[CircuitBreaker] Fallback static fetch also failed:', {
            error: staticFetchError,
          });
        }
      }
    },
  );

  return unsubscribe;
}

export function getUserGroups(
  userId: string,
  onUpdate: (groups: Group[]) => void,
): Unsubscribe {
  logger.debug(`[getUserGroups] Subscribing for userId: '${userId}'`);
  const groupsCollectionRef = collection(db, 'groups');
  const q = query(
    groupsCollectionRef,
    where(`participantUids.${userId}`, '==', true),
  );

  return createResilientListener<Group[]>(q, onUpdate, (snapshot) =>
    snapshot.docs.map((doc: any) => doc.data()),
  );
}

export function getGroup(
  groupId: string,
  onUpdate: (group: Group | null) => void,
): Unsubscribe {
  logger.debug(`[getGroup] Subscribing for groupId: '${groupId}'`);
  const groupDocRef = doc(db, 'groups', groupId);

  return createResilientListener<Group | null>(groupDocRef, onUpdate, (snapshot) =>
    snapshot.exists() ? snapshot.data() : null,
  );
}

export async function getGroupOnce(groupId: string): Promise<Group | null> {
  const groupDocRef = doc(db, 'groups', groupId);
  const groupDocSnap = await getDoc(groupDocRef);
  return groupDocSnap.exists() ? (groupDocSnap.data() as Group) : null;
}

export function getGroupTurnLog(
  groupId: string,
  onUpdate: (logs: (LogEntry & { id: string })[]) => void,
): Unsubscribe {
  logger.debug(`[getGroupTurnLog] Subscribing for groupId: '${groupId}'`);
  const logsCollectionRef = collection(db, 'groups', groupId, 'turnLog');
  const q = query(logsCollectionRef, orderBy('completedAt', 'desc'), limit(50));

  // REFACTORED: Now uses the single, resilient helper function.
  return createResilientListener<(LogEntry & { id: string })[]>(
    q,
    onUpdate,
    (snapshot) =>
      snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })),
  );
}