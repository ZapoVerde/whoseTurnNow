/**
 * @file packages/whoseturnnow/src/types/group.ts
 * @stamp {"ts":"2025-10-22T04:00:00Z"}
 * @architectural-role Type Definition
 * @description Defines the canonical data structures for the application's core domain, including `Group`, `TurnParticipant`, and all `LogEntry` variants.
 * @core-principles
 * 1. IS the single source of truth for the shape of all group-related data.
 * 2. OWNS the core domain model definitions.
 * 3. MUST be platform-agnostic.
 * @api-declaration
 *   - TurnParticipant: The interface for a participant within a group.
 *   - Group: The interface for the central group data entity.
 *   - TurnCompletedLog: An immutable record for a completed turn.
 *   - CountsResetLog: An immutable record for a group-wide turn count reset.
 *   - TurnUndoneLog: An immutable record for a turn reversal action.
 *   - LogEntry: A union type for all possible log events.
 * @contract
 *   assertions:
 *     purity: pure # This file contains only type definitions and has no runtime logic.
 *     state_ownership: none # This file does not own or manage any application state.
 *     external_io: none # This file does not perform any network or file system I/O.
 */

import type { FieldValue } from 'firebase/firestore';

/**
 * @id packages/whoseturnnow/src/types/group.ts#TurnParticipant
 * @description Represents the profile of a single participant within the context of a specific group.
 */
export interface TurnParticipant {
  /**
   * A unique, stable identifier for this specific participant slot within the group.
   */
  id: string;
  /**
   * The unique ID of the user account linked to this participant slot.
   * It is `null` for "Managed Participants" (placeholders).
   */
  uid: string | null;
  /**
   * An optional, user-defined name that overrides the user's global display name
   * for this specific group.
   */
  nickname?: string;
  /**
   * The participant's permission level within the group.
   */
  role: 'admin' | 'member';
  /**
   * A lifetime counter of all turns this participant has completed in this group.
   */
  turnCount: number;
}

/**
 * @id packages/whoseturnnow/src/types/group.ts#Group
 * @description The central data entity for a single turn-tracking list.
 */
export interface Group {
  /**
   * The unique identifier for the group document.
   */
  gid: string;
  /**
   * The user-defined name of the list.
   */
  name: string;
  /**
   * A single Unicode emoji character selected by the user to represent the list.
   */
  icon: string;
  /**
   * A historical record of the original creator's user ID. This field grants
   * no special permissions and is for informational purposes only.
   */
  ownerUid: string;
  /**
   * The complete roster of all participants in this group, stored as an array of objects.
   */
  participants: TurnParticipant[];
  /**
   * An ordered array of participant `id` strings that defines the current turn queue.
   * The participant at index `[0]` is always the one whose turn is next.
   */
  turnOrder: string[];
  /**
   * A denormalized array of all non-null participant UIDs. This is used
   * exclusively for efficient Firestore querying.
   */
  participantUids: string[];
}

/**
 * @id packages/whoseturnnow/src/types/group.ts#TurnCompletedLog
 * @description An immutable record representing the completion of a single turn. It captures the "who, what, and when" of the event for the audit trail.
 */
export interface TurnCompletedLog {
  /**
   * The unique, machine-readable identifier for this type of log entry.
   */
  type: 'TURN_COMPLETED';
  /**
   * The server-generated timestamp indicating when the turn was officially completed.
   */
  completedAt: FieldValue;
  /**
   * The unique ID of the participant slot whose turn was completed.
   */
  participantId: string;
  /**
   * A snapshot of the participant's name at the moment the turn was completed, ensuring historical accuracy.
   */
  participantName: string;
  /**
   * The unique ID of the user who initiated the action (e.g., clicking the button). This may differ from the participant's UID if an admin acts on another's behalf.
   */
  actorUid: string;
  /**
   * A snapshot of the actor's name at the moment the action was initiated.
   */
  actorName: string;
  /**
   * If true, this log entry has been reversed by a subsequent 'TURN_UNDONE' action
   * and should be visually represented as such (e.g., struck-through).
   */
  isUndone?: boolean;
  /**
   * A denormalized snapshot of the parent group's `participantUids` array at the
   * time of logging. This field exists solely to enable secure Firestore rule queries.
   */
  _participantUids: string[];
}

/**
 * @id packages/whoseturnnow/src/types/group.ts#CountsResetLog
 * @description An immutable record representing the administrative action of resetting all turn counts within a group to zero.
 */
export interface CountsResetLog {
  /**
   * The unique, machine-readable identifier for this type of log entry.
   */
  type: 'COUNTS_RESET';
  /**
   * The server-generated timestamp indicating when the reset occurred.
   */
  completedAt: FieldValue;
  /**
   * The unique ID of the admin who initiated the reset action.
   */
  actorUid: string;
  /**
   * A snapshot of the admin's name at the moment the action was initiated.
   */
  actorName: string;
  /**
   * A denormalized snapshot of the parent group's `participantUids` array at the
   * time of logging. This field exists solely to enable secure Firestore rule queries.
   */
  _participantUids: string[];
}

/**
 * @id packages/whoseturnnow/src/types/group.ts#TurnUndoneLog
 * @description An immutable record representing the reversal of a previously completed turn. It is a new, separate event that points back to the original action.
 */
export interface TurnUndoneLog {
    /**
     * The unique, machine-readable identifier for this type of log entry.
     */
    type: 'TURN_UNDONE';
    /**
     * The server-generated timestamp indicating when the undo action occurred.
     */
    completedAt: FieldValue;
    /**
     * The unique ID of the admin or user who initiated the undo action.
     */
    actorUid: string;
    /**
     * A snapshot of the actor's name at the moment the undo was initiated.
     */
    actorName: string;
    /**
     * A snapshot of the name of the participant from the original turn that was undone.
     */
    originalParticipantName: string;
    /**
     * A denormalized snapshot of the parent group's `participantUids` array at the
     * time of logging. This field exists solely to enable secure Firestore rule queries.
     */
    _participantUids: string[];
}


/**
 * @id packages/whoseturnnow/src/types/group.ts#LogEntry
 * @description A union type representing any possible event that can be recorded in a group's immutable turn history.
 */
export type LogEntry = TurnCompletedLog | CountsResetLog | TurnUndoneLog;