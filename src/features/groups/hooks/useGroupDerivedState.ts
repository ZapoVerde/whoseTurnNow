/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDerivedState.ts
 * @architectural-role Hook
 * @description
 * The "Brain" of the Group Detail feature. It is a pure, stateless hook that
 * encapsulates all complex business logic derivations, including the now-corrected
 * logic for enforcing a strict three-turn undo limit.
 *
 * @core-principles
 * 1. IS a pure, deterministic function of its inputs (group, user, turnLog).
 * 2. OWNS all business logic calculations (e.g., 'isAdmin', 'isUserTurn', 'undoableAction').
 * 3. MUST strictly limit the undo capability to the three most recent completed turns.
 *
 * @api-declaration
 *   - useGroupDerivedState: The exported hook function.
 *
 * @contract
 *   assertions:
 *     purity: pure
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
  const currentUserParticipant = useMemo(() => {
    if (!user || !group) return null;
    return group.participants.find((p) => p.uid === user.uid) || null;
  }, [user, group]);

  const isAdmin = currentUserParticipant?.role === 'admin';

  const orderedParticipants = useMemo(() => {
    if (!group) return [];
    
    const hydratedParticipants = group.participants.map(p => {
      if (user && p.uid === user.uid) {
        return { ...p, nickname: user.displayName || p.nickname };
      }
      return p;
    });

    return group.turnOrder
      .map((pid) => hydratedParticipants.find((p) => p.id === pid))
      .filter((p): p is TurnParticipant => !!p);
  }, [group, user]);

  const isUserTurn = useMemo(() => {
    if (!currentUserParticipant || orderedParticipants.length === 0) return false;
    return orderedParticipants[0].id === currentUserParticipant.id;
  }, [currentUserParticipant, orderedParticipants]);

  const isLastAdmin = useMemo(() => {
    if (!group || !isAdmin) return false;
    return group.participants.filter((p) => p.role === 'admin').length === 1;
  }, [group, isAdmin]);

  const undoableAction = useMemo(() => {
    if (!user || !group || !turnLog) return null;

    // --- THIS IS THE FIX ---
    // 1. Get ALL completed logs from the history, sorted with the most recent first.
    const allCompletedLogs = turnLog.filter(
      (log): log is TurnCompletedLog & { id: string } =>
        log.type === 'TURN_COMPLETED'
    );

    // 2. Establish a fixed window of only the THREE most recent completed turns.
    const recentTurnWindow = allCompletedLogs.slice(0, 3);

    // 3. From within that fixed window, find the most recent log that is NOT already undone.
    const logToUndo = recentTurnWindow.find(log => !log.isUndone);
    // --- END FIX ---

    // 4. Check permissions and return the result.
    // The security rule has been updated; only admins can undo.
    if (logToUndo && isAdmin) {
      return logToUndo;
    }

    return null;
  }, [turnLog, group, user, isAdmin]);

  return {
    currentUserParticipant,
    orderedParticipants,
    isAdmin,
    isUserTurn,
    isLastAdmin,
    undoableAction,
  };
}