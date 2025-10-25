/**
 * @file packages/whoseturnnow/src/features/groups/repository/group.command.spec.ts
 * @stamp {"ts":"2025-10-25T13:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/repository/group.command.ts
 *
 * @description
 * Verifies the correctness of all high-level group entity lifecycle operations,
 * including creation, deletion, settings updates, and the transactional
 * 'reset all counts' feature.
 *
 * @criticality
 * Critical (Reason: I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: none
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  createGroup,
  updateGroupSettings,
  resetAllTurnCounts,
  deleteGroup,
} from './group.command';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

// --- Mocks & Test Setup ---
const mockSetDoc = vi.mocked(setDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockRunTransaction = vi.mocked(runTransaction);
const mockServerTimestamp = vi.mocked(serverTimestamp);
const mockDoc = vi.mocked(doc);
const mockCollection = vi.mocked(collection);
const mockUuidv4 = vi.mocked(uuidv4);

const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

const mockCreator: AppUser = {
  uid: 'user-creator-1',
  displayName: 'Creator',
  isAnonymous: false,
};

const mockBaseGroup: Group = {
  gid: 'group-1',
  name: 'Base Group',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [
    { id: 'p1', uid: 'u1', role: 'admin', turnCount: 5, nickname: 'P1' },
    { id: 'p2', uid: 'u2', role: 'member', turnCount: 4, nickname: 'P2' },
  ],
  turnOrder: ['p1', 'p2'],
  participantUids: { u1: true, u2: true },
  adminUids: { u1: true },
};

describe('group.command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunTransaction.mockImplementation(async (_, fn) => fn(mockTransaction as any));
    mockTransaction.get.mockResolvedValue({ exists: () => true, data: () => mockBaseGroup });
    mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
    mockCollection.mockReturnValue({ id: 'mock-collection-ref' } as any);
    mockUuidv4.mockReturnValue('mock-new-gid');
    mockServerTimestamp.mockReturnValue('mock-timestamp' as any);
  });

  describe('createGroup', () => {
    it('should call setDoc with a correctly structured new group object', async () => {
      await createGroup({ name: 'New Group', icon: '✨', creator: mockCreator });

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const newGroupPayload = mockSetDoc.mock.calls[0][1] as Group;

      expect(newGroupPayload.gid).toBe('mock-new-gid');
      expect(newGroupPayload.name).toBe('New Group');
      expect(newGroupPayload.ownerUid).toBe(mockCreator.uid);
      expect(newGroupPayload.participants.length).toBe(1);
      expect(newGroupPayload.participants[0].uid).toBe(mockCreator.uid);
      expect(newGroupPayload.participants[0].role).toBe('admin');
      expect(newGroupPayload.adminUids).toEqual({ [mockCreator.uid]: true });
    });
  });

  describe('updateGroupSettings', () => {
    it('should call updateDoc with the specified settings', async () => {
      const newSettings = { name: 'Updated Name', icon: '🚀' };
      await updateGroupSettings('group-1', newSettings);

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), newSettings);
    });
  });

  describe('resetAllTurnCounts', () => {
    it('should update all participant turn counts to 0 and create a log entry', async () => {
      await resetAllTurnCounts('group-1', mockCreator);

      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockTransaction.update.mock.calls[0][1];
      expect(updatePayload.participants[0].turnCount).toBe(0);
      expect(updatePayload.participants[1].turnCount).toBe(0);

      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const logPayload = mockTransaction.set.mock.calls[0][1];
      expect(logPayload.type).toBe('COUNTS_RESET');
      expect(logPayload.actorUid).toBe(mockCreator.uid);
    });
  });

  describe('deleteGroup', () => {
    it('should call deleteDoc on the correct document reference', async () => {
      await deleteGroup('group-1');
      
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'groups', 'group-1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });
});