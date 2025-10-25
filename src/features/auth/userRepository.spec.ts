/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.spec.ts
 * @stamp {"ts":"2025-10-24T12:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/userRepository.ts
 * @description
 * Verifies the correctness of all user profile interactions, including
 * creation, fetching, name updates, and account deletion logic. It also
 * verifies the gatekeeper function for preventing orphaned groups.
 * @criticality
 * Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
 * @testing-layer Integration
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O. 
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks & Imports ---
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { userRepository } from './userRepository';
import { db, auth } from '../../lib/firebase';
import type { AppUser } from './useAuthStore';
import type { Group } from '../../types/group';

// Get typed references to the globally mocked functions
const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockDeleteUser = vi.mocked(deleteUser);
const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockGetDocs = vi.mocked(getDocs);

describe('userRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).currentUser = null;
  });

  describe('findBlockingGroup', () => {
    it('should return the group name if the user is the sole admin', async () => {
      // ARRANGE
      const uid = 'user-last-admin';
      const blockingGroup: Group = {
        gid: 'group-1',
        name: 'The Blocking Group',
        icon: '🚫',
        ownerUid: 'owner',
        participants: [
          { id: 'p-1', uid, role: 'admin', turnCount: 1, nickname: 'Admin' },
          { id: 'p-2', uid: 'other-user', role: 'member', turnCount: 1, nickname: 'Member' },
        ],
        turnOrder: ['p-1', 'p-2'],
        participantUids: { [uid]: true, 'other-user': true },
        adminUids: { [uid]: true },
      };
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => blockingGroup }],
      } as any);

      // ACT
      const result = await userRepository.findBlockingGroup(uid);

      // ASSERT
      expect(mockCollection).toHaveBeenCalledWith(db, 'groups');
      expect(mockQuery).toHaveBeenCalled();
      // This assertion is now correct for a map-based query.
      expect(mockWhere).toHaveBeenCalledWith('participantUids', 'array-contains', uid);
      expect(result).toBe('The Blocking Group');
    });

    it('should return null if the user is an admin but not the only one', async () => {
      // ARRANGE
      const uid = 'user-co-admin';
      const nonBlockingGroup: Group = {
        gid: 'group-2',
        name: 'Co-Admin Group',
        icon: '🤝',
        ownerUid: 'owner',
        participants: [
          { id: 'p-1', uid, role: 'admin', turnCount: 1, nickname: 'Admin1' },
          { id: 'p-2', uid: 'other-admin', role: 'admin', turnCount: 1, nickname: 'Admin2' },
        ],
        turnOrder: ['p-1', 'p-2'],
        participantUids: { [uid]: true, 'other-admin': true },
        adminUids: { [uid]: true, 'other-admin': true },
      };
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => nonBlockingGroup }],
      } as any);

      // ACT
      const result = await userRepository.findBlockingGroup(uid);

      // ASSERT
      expect(mockCollection).toHaveBeenCalledWith(db, 'groups');
      expect(result).toBeNull();
    });

    it('should return null if the user is a member but not an admin', async () => {
      // ARRANGE
      const uid = 'user-member-only';
      const nonBlockingGroup: Group = {
        gid: 'group-3',
        name: 'Member Only Group',
        icon: '👤',
        ownerUid: 'owner',
        participants: [
          { id: 'p-1', uid: 'other-admin', role: 'admin', turnCount: 1, nickname: 'Admin' },
          { id: 'p-2', uid, role: 'member', turnCount: 1, nickname: 'Member' },
        ],
        turnOrder: ['p-1', 'p-2'],
        participantUids: { [uid]: true, 'other-admin': true },
        adminUids: { 'other-admin': true },
      };
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => nonBlockingGroup }],
      } as any);

      // ACT
      const result = await userRepository.findBlockingGroup(uid);

      // ASSERT
      expect(mockCollection).toHaveBeenCalledWith(db, 'groups');
      expect(result).toBeNull();
    });

    it('should return null if the user is not in any groups', async () => {
      // ARRANGE
      const uid = 'user-no-groups';
      mockGetDocs.mockResolvedValue({ docs: [] } as any);

      // ACT
      const result = await userRepository.findBlockingGroup(uid);

      // ASSERT
      expect(mockCollection).toHaveBeenCalledWith(db, 'groups');
      expect(result).toBeNull();
    });
  });

  describe('updateUserDisplayName', () => {
    it('should call updateDoc with the correct user data', async () => {
      const uid = 'user-to-update-123';
      const newDisplayName = 'New Name';
      mockUpdateDoc.mockResolvedValue(undefined);

      await userRepository.updateUserDisplayName(uid, newDisplayName);

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', uid);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdateDoc.mock.calls[0][1];
      expect(updatePayload).toEqual({ displayName: newDisplayName });
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete the firestore doc and the auth user', async () => {
      const mockUser = { uid: 'user-to-delete-456' };
      (auth as any).currentUser = mockUser;
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDeleteUser.mockResolvedValue(undefined);

      await userRepository.deleteUserAccount();

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', mockUser.uid);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('should throw an error if no user is signed in', async () => {
      await expect(userRepository.deleteUserAccount()).rejects.toThrow(
        'No user is currently signed in to delete.',
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return a user profile when the document exists', async () => {
      const mockUserData: AppUser = {
        uid: 'user-123',
        displayName: 'Test User',
        isAnonymous: false,
      };
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const profile = await userRepository.getUserProfile('user-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user-123');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual(mockUserData);
    });

    it('should return null when the document does not exist', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false } as any);

      const profile = await userRepository.getUserProfile('user-404');

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user-404');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toBeNull();
    });
  });

  describe('createUserProfile', () => {
    it('should call setDoc with the correct user data', async () => {
      const newUser: AppUser = {
        uid: 'new-user-abc',
        displayName: 'Newbie',
        isAnonymous: true,
      };
      mockSetDoc.mockResolvedValue(undefined);

      await userRepository.createUserProfile(newUser);

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'new-user-abc');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc.mock.calls[0][1]).toEqual(newUser);
    });
  });
});