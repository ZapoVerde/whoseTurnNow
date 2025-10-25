/**
 * @file packages/whoseturnnow/src/features/groups/repository/participants.command.spec.ts
 * @stamp {"ts":"2025-10-25T12:30:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/repository/participants.command.ts
 *
 * @description
 * Verifies the transactional integrity and correctness of all participant and
 * membership management operations, ensuring that the participants array and all
 * derived UID maps are updated correctly.
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
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  addManagedParticipant,
  updateParticipantRole,
  removeParticipant,
  leaveGroup,
  joinGroupAsNewParticipant,
  claimPlaceholder,
} from './participants.command';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

// --- Mocks & Test Setup ---
const mockRunTransaction = vi.mocked(runTransaction);
const mockGetDoc = vi.mocked(getDoc);
const mockDoc = vi.mocked(doc);
const mockUuidv4 = vi.mocked(uuidv4);

const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

const mockUser: AppUser = {
  uid: 'user-new-1',
  displayName: 'New User',
  isAnonymous: false,
};

const baseMockGroup: Group = {
  gid: 'group-1',
  name: 'Test Group',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [
    { id: 'p-admin', uid: 'user-admin', role: 'admin', turnCount: 5, nickname: 'Admin Alice' },
    { id: 'p-member', uid: 'user-member', role: 'member', turnCount: 4, nickname: 'Member Bob' },
    { id: 'p-placeholder', uid: null, role: 'member', turnCount: 0, nickname: 'Placeholder' },
  ],
  turnOrder: ['p-admin', 'p-member', 'p-placeholder'],
  participantUids: { 'user-admin': true, 'user-member': true },
  adminUids: { 'user-admin': true },
};

describe('participants.command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunTransaction.mockImplementation(async (_, fn) => fn(mockTransaction as any));
    mockTransaction.get.mockResolvedValue({ exists: () => true, data: () => baseMockGroup });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => baseMockGroup } as any);
    mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
    mockUuidv4.mockReturnValue('mock-uuid-123');
  });

  describe('addManagedParticipant', () => {
    it('should add a new placeholder participant to the end of the queue', async () => {
      await addManagedParticipant(baseMockGroup.gid, 'New Placeholder');
      
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockTransaction.update.mock.calls[0][1];

      expect(updatePayload.participants.length).toBe(4);
      expect(updatePayload.participants[3].nickname).toBe('New Placeholder');
      expect(updatePayload.participants[3].uid).toBeNull();
      expect(updatePayload.turnOrder).toEqual(['p-admin', 'p-member', 'p-placeholder', 'mock-uuid-123']);
    });
  });

  describe('updateParticipantRole', () => {
    it('should correctly promote a member to an admin and update adminUids', async () => {
      await updateParticipantRole(baseMockGroup.gid, 'p-member', 'admin');
      
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const payload = mockTransaction.update.mock.calls[0][1];
      
      expect(payload.participants[1].role).toBe('admin');
      expect(payload.adminUids).toEqual({ 'user-admin': true, 'user-member': true });
    });
  });

  describe('removeParticipant', () => {
    it('should remove the participant and update all relevant arrays and maps', async () => {
      await removeParticipant(baseMockGroup.gid, 'p-member');

      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const payload = mockTransaction.update.mock.calls[0][1];
      
      expect(payload.participants.length).toBe(2);
      expect(payload.participants.find((p: any) => p.id === 'p-member')).toBeUndefined();
      expect(payload.turnOrder).toEqual(['p-admin', 'p-placeholder']);
      expect(payload.participantUids).toEqual({ 'user-admin': true });
      expect(payload.adminUids).toEqual({ 'user-admin': true });
    });
  });

  describe('leaveGroup', () => {
    it('should call removeParticipant for the correct user', async () => {
      // Since `leaveGroup` orchestrates `removeParticipant`, we can verify its effect.
      await leaveGroup(baseMockGroup.gid, 'user-member');

      expect(mockGetDoc).toHaveBeenCalledTimes(1); // It first fetches the group.
      expect(mockRunTransaction).toHaveBeenCalledTimes(1); // Then it runs the remove transaction.
      const payload = mockTransaction.update.mock.calls[0][1];
      expect(payload.participants.find((p: any) => p.id === 'p-member')).toBeUndefined();
    });
  });

  describe('joinGroupAsNewParticipant', () => {
    it('should add the new user as a participant', async () => {
      await joinGroupAsNewParticipant(baseMockGroup.gid, mockUser);
      
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const payload = mockTransaction.update.mock.calls[0][1];
      
      expect(payload.participants.length).toBe(4);
      expect(payload.participants[3].uid).toBe(mockUser.uid);
      expect(payload.participantUids).toEqual({ 'user-admin': true, 'user-member': true, [mockUser.uid]: true });
    });
  });

  describe('claimPlaceholder', () => {
    it('should update the placeholder with the new user`s info', async () => {
      await claimPlaceholder(baseMockGroup.gid, 'p-placeholder', mockUser);
      
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const payload = mockTransaction.update.mock.calls[0][1];
      const claimedSlot = payload.participants.find((p: any) => p.id === 'p-placeholder');
      
      expect(claimedSlot.uid).toBe(mockUser.uid);
      expect(claimedSlot.nickname).toBe(mockUser.displayName);
      expect(payload.participantUids).toEqual({ 'user-admin': true, 'user-member': true, [mockUser.uid]: true });
    });
  });
});