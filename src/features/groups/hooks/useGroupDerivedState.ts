/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDerivedState.ts
 * @architectural-role Hook
 * @description
 * The "Brain" of the Group Detail feature. It is a pure, stateless hook that
 * encapsulates all complex business logic derivations. It takes raw data as
 * input and returns a calculated view model of the group's current state.
 *
 * @core-principles
 * 1. IS a pure, deterministic function of its inputs (group, user, turnLog).
 * 2. OWNS all business logic calculations (e.g., 'isAdmin', 'isUserTurn', 'undoableAction').
 * 3. MUST NOT contain any side effects, action handlers, or UI state.
 *
 * @api-declaration
 *   - useGroupDerivedState: The exported hook function.
 *
 * @contract
 *   assertions:
 *     purity: pure # deeply pure; depends ONLY on props, no internal state.
 *     state_ownership: none
 *     external_io: none
 */

import { useMemo } from 'react';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, LogEntry, TurnCompletedLog, TurnParticipant } from '../../../types/group';

export function useGroupDerivedState(
  group: Group | null,
  user: AppUser | null,
  turnLog: (LogEntry & { id: string })[]
) {
  // 1. Identify the current user's participant record (used by most other checks)
  const currentUserParticipant = useMemo(() => {
    if (!user || !group) return null;
    return group.participants.find((p) => p.uid === user.uid) || null;
  }, [user, group]);

  // 2. Calculate the basic role booleans
  const isAdmin = currentUserParticipant?.role === 'admin';

  // 3. Calculate the ordered list of participants for rendering the queue
  const orderedParticipants = useMemo(() => {
    if (!group) return [];
    return group.turnOrder
      .map((pid) => group.participants.find((p) => p.id === pid))
      .filter((p): p is TurnParticipant => !!p);
  }, [group]);

  // 4. Determine if it is currently the user's turn
  const isUserTurn = useMemo(() => {
    if (!currentUserParticipant || orderedParticipants.length === 0) return false;
    // The user is "up next" if their ID matches the first ID in the ordered queue.
    return orderedParticipants[0].id === currentUserParticipant.id;
  }, [currentUserParticipant, orderedParticipants]);

  // 5. "Last Admin" Safety Check: Is the current user the ONLY admin left?
  const isLastAdmin = useMemo(() => {
    if (!group || !isAdmin) return false;
    return group.participants.filter((p) => p.role === 'admin').length === 1;
  }, [group, isAdmin]);

  // 6. Complex Logic: Find the most recent action this user is allowed to Undo.
  // Rules: LIFO (slice 0-3), must be 'TURN_COMPLETED', must not be undone already.
  // Permissions: User must be an Admin OR the original Actor OR the Subject.
  const undoableAction = useMemo(() => {
    if (!user || !group || !turnLog) return null;

    // Filter down to just the valid candidate logs first
    const completableLogs = turnLog.filter(
      (log): log is TurnCompletedLog & { id: string } =>
        log.type === 'TURN_COMPLETED' && !log.isUndone
    );

    // Scan the last 3 valid candidates
    for (const log of completableLogs.slice(0, 3)) {
      // Check permissions for this specific log entry
      const isActor = user.uid === log.actorUid;

      // We must find the subject in the CURRENT group state to verify their identity
      const subjectParticipant = group.participants.find(p => p.id === log.participantId);
      const isSubject = !!subjectParticipant && user.uid === subjectParticipant.uid;

      if (isAdmin || isActor || isSubject) {
        return log;
      }
    }
    return null;
  }, [turnLog, user, group, isAdmin]);

  return {
    currentUserParticipant,
    orderedParticipants,
    isAdmin,
    isUserTurn,
    isLastAdmin,
    undoableAction,
  };
}