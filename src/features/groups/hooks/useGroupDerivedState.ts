// ----- packages/whoseturnnow/src/features/groups/hooks/useGroupDerivedState.ts -----
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
    
    // --- THIS IS THE FIX ---
    // Create a "hydrated" list of participants that substitutes the current
    // user's (potentially stale) nickname with their fresh global displayName.
    const hydratedParticipants = group.participants.map(p => {
      // If this participant is the currently logged-in user...
      if (user && p.uid === user.uid) {
        // ...return a new object with their fresh global name.
        return { ...p, nickname: user.displayName || p.nickname };
      }
      // Otherwise, return the participant as-is.
      return p;
    });
    // --- END FIX ---

    return group.turnOrder
      // Use the hydrated list to find the participants
      .map((pid) => hydratedParticipants.find((p) => p.id === pid))
      .filter((p): p is TurnParticipant => !!p);
  }, [group, user]); // Add `user` to the dependency array

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
  // ... (rest of the hook remains unchanged) ...
  const undoableAction = useMemo(() => {
    if (!user || !group || !turnLog) return null;

    const completableLogs = turnLog.filter(
      (log): log is TurnCompletedLog & { id: string } =>
        log.type === 'TURN_COMPLETED' && !log.isUndone
    );

    for (const log of completableLogs.slice(0, 3)) {
      const isActor = user.uid === log.actorUid;
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