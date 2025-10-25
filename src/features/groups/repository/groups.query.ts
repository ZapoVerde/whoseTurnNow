/**
 * @file packages/whoseturnnow/src/features/groups/repository/groups.query.ts
 * @stamp {"ts":"2025-10-23T09:45:00Z"}
 * @architectural-role Data Repository (Query)
 * @description
 * Encapsulates all read-only Firestore interactions. This module implements the
 * "Circuit Breaker" pattern, attempting to use real-time listeners but gracefully
 * degrading to one-time static fetches if concurrent connection limits are reached.
 * @core-principles
 * 1. OWNS all read-only I/O logic for group data.
 * 2. MUST attempt to establish real-time listeners (`onSnapshot`) by default.
 * 3. MUST catch `resource-exhausted` errors, set the global app status to
 *    'degraded', and perform a fallback static fetch (`getDocs`).
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
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import type { Group, LogEntry } from '../../../types/group';
import { logger } from '../../../shared/utils/debug';

const FIREBASE_RESOURCE_EXHAUSTED = 'resource-exhausted';

/**
 * A private helper function that implements the circuit breaker logic for any query.
 */
function createResilientListener<T>(
  q: Query | DocumentReference,
  onUpdate: (data: any) => void,
  isSingleDoc: boolean = false,
): Unsubscribe {
  const { setConnectionMode } = useAppStatusStore.getState();

  const unsubscribe = onSnapshot(
    q as Query, // Cast for onSnapshot signature
    (snapshot: any) => {
      // --- DEBUG LOG ---
      logger.log('[CircuitBreaker] Real-time update received. Ensuring LIVE mode.');
      setConnectionMode('live');
      if (isSingleDoc) {
        onUpdate(snapshot.exists() ? (snapshot.data() as T) : null);
      } else {
        const data = snapshot.docs.map((doc: any) => doc.data() as T);
        onUpdate(data);
      }
    },
    async (error) => {
      logger.error('[CircuitBreaker] Listener error:', error.code, error.message);

      if (error.code === FIREBASE_RESOURCE_EXHAUSTED) {
        logger.warn('[CircuitBreaker] TRIPPED! Degrading to static fetch.');
        setConnectionMode('degraded');
        
        try {
          const staticSnapshot = isSingleDoc 
            ? await getDoc(q as DocumentReference) 
            // @ts-ignore
            : await getDocs(q);

          if (isSingleDoc) {
            // @ts-ignore
            onUpdate(staticSnapshot.exists() ? (staticSnapshot.data() as T) : null);
          } else {
            // @ts-ignore
            const data = staticSnapshot.docs.map((doc: any) => doc.data() as T);
            onUpdate(data);
          }
        } catch (staticFetchError) {
          logger.error('[CircuitBreaker] Fallback static fetch also failed:', staticFetchError);
        }
      }
    }
  );

  return unsubscribe;
}

export function getUserGroups(
  userId: string,
  onUpdate: (groups: Group[]) => void,
): Unsubscribe {
  logger.log(`[getUserGroups] Subscribing for userId: '${userId}'`);
  const groupsCollectionRef = collection(db, 'groups');
  const q = query(
    groupsCollectionRef,
    where(`participantUids.${userId}`, '==', true),
  );
  
  return createResilientListener<Group>(q, onUpdate);
}

export function getGroup(
  groupId: string,
  onUpdate: (group: Group | null) => void,
): Unsubscribe {
  logger.log(`[getGroup] Subscribing for groupId: '${groupId}'`);
  const groupDocRef = doc(db, 'groups', groupId);
  
  return createResilientListener<Group>(groupDocRef, onUpdate, true);
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
  logger.log(`[getGroupTurnLog] Subscribing for groupId: '${groupId}'`);
  const { setConnectionMode } = useAppStatusStore.getState();
  const logsCollectionRef = collection(db, 'groups', groupId, 'turnLog');
  const q = query(logsCollectionRef, orderBy('completedAt', 'desc'), limit(50));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      // --- DEBUG LOG ---
      logger.log(`[getGroupTurnLog] Real-time update received for groupId: '${groupId}'. Ensuring LIVE mode.`);
      setConnectionMode('live');
      const logs = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as LogEntry),
        id: doc.id,
      }));
      onUpdate(logs);
    },
    async (error) => {
      logger.error(`[getGroupTurnLog listener] FAILED for groupId '${groupId}'. Code: ${error.code}`, error.message);

      if (error.code === FIREBASE_RESOURCE_EXHAUSTED) {
        logger.warn(`[getGroupTurnLog] TRIPPED for groupId '${groupId}'! Degrading to static fetch.`);
        setConnectionMode('degraded');
        
        try {
          const staticSnapshot = await getDocs(q);
          const logs = staticSnapshot.docs.map((doc) => ({
            ...(doc.data() as LogEntry),
            id: doc.id,
          }));
          onUpdate(logs);
        } catch (staticFetchError) {
          logger.error('[getGroupTurnLog] Fallback static fetch also failed:', staticFetchError);
        }
      }
    }
  );

  return unsubscribe;
}