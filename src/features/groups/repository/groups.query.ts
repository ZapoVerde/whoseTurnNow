/**
 * @file packages/whoseturnnow/src/features/groups/repository/groups.query.ts
 * @stamp {"ts":"2025-10-23T09:45:00Z"}
 * @architectural-role Data Repository (Query)
 * @description
 * Encapsulates all read-only and subscription-based Firestore interactions for
 * the `groups` collection. This module is responsible for fetching and listening
 * to group and turn log data without mutating state.
 * @core-principles
 * 1. OWNS all read-only I/O logic for group data.
 * 2. MUST NOT contain any functions that mutate state (create, update, delete).
 * 3. MUST provide both one-time fetch and real-time subscription capabilities.
 * @api-declaration
 *   - getUserGroups: Establishes a real-time listener for a user's groups.
 *   - getGroup: Establishes a real-time listener for a single group.
 *   - getGroupOnce: Fetches a single group document once.
 *   - getGroupTurnLog: Establishes a real-time listener for a group's turn log.
 * @contract
 *   assertions:
 *     purity: read-only # This module only reads from an external database.
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
    type Unsubscribe,
  } from 'firebase/firestore';
  import { db } from '../../../lib/firebase';
  import type { Group, LogEntry } from '../../../types/group';
  
  /**
   * Establishes a real-time listener that provides all groups a user is a member of.
   * @param userId The UID of the user whose groups to fetch.
   * @param onUpdate A callback function that will be invoked with the updated list of groups.
   * @returns An Unsubscribe function to detach the listener.
   */
  export function getUserGroups(
    userId: string,
    onUpdate: (groups: Group[]) => void,
  ): Unsubscribe {
    const groupsCollectionRef = collection(db, 'groups');
    const q = query(
      groupsCollectionRef,
      where(`participantUids.${userId}`, '==', true),
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groups = querySnapshot.docs.map((doc) => doc.data() as Group);
      onUpdate(groups);
    });
  
    return unsubscribe;
  }
  
  /**
   * Establishes a real-time listener for a single group document.
   * @param groupId The ID of the group to listen to.
   * @param onUpdate A callback function that will be invoked with the group data.
   * @returns An Unsubscribe function to detach the listener.
   */
  export function getGroup(
    groupId: string,
    onUpdate: (group: Group | null) => void,
  ): Unsubscribe {
    const groupDocRef = doc(db, 'groups', groupId);
    return onSnapshot(groupDocRef, (docSnap) => {
      onUpdate(docSnap.exists() ? (docSnap.data() as Group) : null);
    });
  }
  
  /**
   * Fetches a single group document once, without establishing a listener.
   * @param groupId The ID of the group to fetch.
   * @returns A promise that resolves to the Group object or null if not found.
   */
  export async function getGroupOnce(groupId: string): Promise<Group | null> {
    const groupDocRef = doc(db, 'groups', groupId);
    const groupDocSnap = await getDoc(groupDocRef);
    return groupDocSnap.exists() ? (groupDocSnap.data() as Group) : null;
  }
  
  /**
   * Establishes a real-time listener for a group's turn log, ordered by most recent.
   * @param groupId The ID of the group whose log to fetch.
   * @param onUpdate A callback function that will be invoked with the list of log entries.
   * @returns An Unsubscribe function to detach the listener.
   */
  export function getGroupTurnLog(
    groupId: string,
    onUpdate: (logs: (LogEntry & { id: string })[]) => void,
  ): Unsubscribe {
    const logsCollectionRef = collection(db, 'groups', groupId, 'turnLog');
    const q = query(logsCollectionRef, orderBy('completedAt', 'desc'), limit(50));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as LogEntry),
        id: doc.id,
      }));
      onUpdate(logs);
    });
  
    return unsubscribe;
  };