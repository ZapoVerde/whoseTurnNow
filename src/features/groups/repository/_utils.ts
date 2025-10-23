/**
 * @file packages/whoseturnnow/src/features/groups/repository/_utils.ts
 * @stamp {"ts":"2025-10-23T10:05:00Z"}
 * @architectural-role Utility
 * @description
 * Provides private, shared utility functions for the groups repository module.
 * This function serves as the single source of truth for deriving denormalized
 * UID maps from a `participants` array, ensuring data consistency across all
 * write operations within the module.
 * @core-principles
 * 1. IS a collection of pure, stateless helper functions.
 * 2. MUST NOT be exported by the repository's public `index.ts` facade.
 * 3. MUST NOT perform any I/O operations.
 * @api-declaration
 *   - _deriveUids: A function to generate participant and admin UID maps.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import type { TurnParticipant } from '../../../types/group';

/**
 * A private helper function that serves as the single source of truth for
 * generating the denormalized UID maps from a `participants` array. This
 * ensures data consistency across all write operations.
 * @param participants The array of TurnParticipant objects.
 * @returns An object containing the derived participantUids and adminUids maps.
 */
export const _deriveUids = (
  participants: TurnParticipant[],
): {
  participantUids: Record<string, boolean>;
  adminUids: Record<string, boolean>;
} => {
  const participantUids: Record<string, boolean> = {};
  const adminUids: Record<string, boolean> = {};

  for (const p of participants) {
    if (p.uid) {
      participantUids[p.uid] = true;
      if (p.role === 'admin') {
        adminUids[p.uid] = true;
      }
    }
  }

  return { participantUids, adminUids };
};