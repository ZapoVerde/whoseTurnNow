/**
 * @file packages/whoseturnnow/src/features/groups/repository/turns.command.spec.ts
 * @stamp {"ts":"2025-10-25T11:55:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/repository/turns.command.ts
 *
 * @description
 * Verifies the transactional integrity and correctness of all core turn
 * lifecycle operations: completing, skipping, and undoing a turn.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import {
  completeTurnTransaction,
  skipTurnTransaction,
  undoTurnTransaction,
} from './turns.command';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group, TurnCompletedLog } from '../../../types/group';

// --- Mocks & Test Setup ---
const mockRunTransaction = vi.mocked(runTransaction);
const mockServerTimestamp = vi.mocked(serverTimestamp);
const mockDoc = vi.mocked(doc);

const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

const mockActor: AppUser = {
  uid: 'user-actor-1',
  displayName: 'Actor User',
  isAnonymous: false,
};

const mockGroup: Group = {
  gid: 'group-1',
  name: 'Test Group',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [
    { id: 'p-alice', uid: 'user-alice', role: 'member', turnCount: 5, nickname: 'Alice' },
    { id: 'p-bob', uid: 'user-bob', role: 'member', turnCount: 4, nickname: 'Bob' },
  ],
  turnOrder: ['p-alice', 'p-bob'],
  participantUids: { 'user-alice': true, 'user-bob': true },
  adminUids: {},
};

describe('turns.command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
      await updateFunction(mockTransaction as any);
    });
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => mockGroup,
    });
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
    // Configure the doc mock to return a placeholder object. This ensures
    // the document reference passed to transaction.update is not undefined.
    mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
  });

  describe('completeTurnTransaction', () => {
    it('should re-order the queue, increment count, and create a log entry', async () => {
      // ACT
      await completeTurnTransaction(mockGroup.gid, mockActor, 'p-alice');

      // ASSERT
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockTransaction.update.mock.calls[0][1];
      expect(updatePayload.turnOrder).toEqual(['p-bob', 'p-alice']);
      expect(updatePayload.participants[0].turnCount).toBe(6);

      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const logPayload = mockTransaction.set.mock.calls[0][1];
      expect(logPayload.type).toBe('TURN_COMPLETED');
    });
  });

  describe('skipTurnTransaction', () => {
    it('should re-order the queue, NOT increment count, and create a log entry', async () => {
      // ACT
      await skipTurnTransaction(mockGroup.gid, mockActor, 'p-alice');

      // ASSERT
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
        turnOrder: ['p-bob', 'p-alice'],
      });

      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const logPayload = mockTransaction.set.mock.calls[0][1];
      expect(logPayload.type).toBe('TURN_SKIPPED');
    });
  });

  describe('undoTurnTransaction', () => {
    const mockLogToUndo: TurnCompletedLog & { id: string } = {
      id: 'log-to-undo-123',
      type: 'TURN_COMPLETED',
      participantId: 'p-alice',
      participantName: 'Alice',
      completedAt: 'old-timestamp' as any,
      actorUid: 'user-alice',
      actorName: 'Alice',
      _adminUids: {},
      _participantUids: {},
    };

    it('should revert turn order, decrement count, create an UNDONE log, and flag the original log', async () => {
      // ACT
      await undoTurnTransaction(mockGroup.gid, mockActor, mockLogToUndo);

      // ASSERT
      expect(mockTransaction.update).toHaveBeenCalledTimes(2);
      const groupUpdatePayload = mockTransaction.update.mock.calls[0][1];
      expect(groupUpdatePayload.turnOrder).toEqual(['p-alice', 'p-bob']);
      expect(groupUpdatePayload.participants[0].turnCount).toBe(4);

      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const undoLogPayload = mockTransaction.set.mock.calls[0][1];
      expect(undoLogPayload.type).toBe('TURN_UNDONE');

      const logUpdatePayload = mockTransaction.update.mock.calls[1][1];
      expect(logUpdatePayload).toEqual({ isUndone: true });
    });
  });
});