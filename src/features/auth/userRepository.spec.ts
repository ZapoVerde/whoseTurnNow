/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.spec.ts
 * @stamp {"ts":"2025-10-25T05:05:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/userRepository.ts
 *
 * @description
 * Verifies the correctness of all user profile data interactions with the
 * external Firestore service. This suite ensures that the repository functions
 * for creating, fetching, updating, and deleting user profiles correctly
 * invoke the mocked Firestore SDK with the expected parameters.
 *
 * @criticality
 * Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
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
    // Restore any spies to their original implementations. This is key for the fix.
    vi.restoreAllMocks();
    // Ensure currentUser is null by default for auth-dependent tests
    (auth as any).currentUser = null;
  });

  describe('getUserProfile', () => {
    it('should return a user profile when the document exists', async () => {
      // ARRANGE
      const mockUserData: AppUser = {
        uid: 'user-123',
        displayName: 'Test User',
        isAnonymous: false,
      };
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      // ACT
      const profile = await userRepository.getUserProfile('user-123');

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user-123');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual(mockUserData);
    });

    it('should return null when the document does not exist', async () => {
      // ARRANGE
      mockGetDoc.mockResolvedValue({ exists: () => false } as any);

      // ACT
      const profile = await userRepository.getUserProfile('user-404');

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user-404');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toBeNull();
    });
  });

  describe('createUserProfile', () => {
    it('should call setDoc with the correct user data', async () => {
      // ARRANGE
      const newUser: AppUser = {
        uid: 'new-user-abc',
        displayName: 'Newbie',
        isAnonymous: true,
      };
      mockSetDoc.mockResolvedValue(undefined);

      // ACT
      await userRepository.createUserProfile(newUser);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'new-user-abc');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      // Ensure the second argument to setDoc (the data payload) matches the new user object
      expect(mockSetDoc.mock.calls[0][1]).toEqual(newUser);
    });
  });

  describe('updateUserDisplayName', () => {
    it('should call updateDoc with the correct user data', async () => {
      // ARRANGE
      const uid = 'user-to-update-123';
      const newDisplayName = 'New Name';
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await userRepository.updateUserDisplayName(uid, newDisplayName);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'users', uid);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdateDoc.mock.calls[0][1];
      expect(updatePayload).toEqual({ displayName: newDisplayName });
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete the firestore doc and the auth user when not blocked', async () => {
      // ARRANGE
      const mockUser = { uid: 'user-to-delete-456' };
      (auth as any).currentUser = mockUser; // Simulate a logged-in user

      // For this test, we need getDocs to return an empty array for both calls
      // (the check and the cleanup) to simulate the "not blocked" and "no memberships to clean" case.
      mockGetDocs.mockResolvedValue({ docs: [] } as any);
      
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDeleteUser.mockResolvedValue(undefined);

      // ACT
      await userRepository.deleteUserAccount();

      // ASSERT
      // --- THIS IS THE FIX ---
      // The function is called twice: once for the gatekeeper check, and once
      // for the membership cleanup. The test must assert this.
      expect(mockGetDocs).toHaveBeenCalledTimes(2);
      // --- END FIX ---
      
      // Verify the deletion proceeded.
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('should throw an error and NOT delete if blocked by findBlockingGroup', async () => {
        // ARRANGE
        const mockUser = { uid: 'user-to-delete-789' };
        (auth as any).currentUser = mockUser;
        const blockingGroup: Partial<Group> = { 
            name: 'Blocking Group Name',
            participants: [{ id: 'p1', uid: mockUser.uid, role: 'admin', turnCount: 0 }]
        };
        
        // --- THIS IS THE FIX ---
        // Make the underlying DB call return the blocking group.
        mockGetDocs.mockResolvedValue({ docs: [{ data: () => blockingGroup }] } as any);

        // ACT & ASSERT
        await expect(userRepository.deleteUserAccount()).rejects.toThrow(
            'Cannot delete account. You are the last admin of "Blocking Group Name". Please promote another admin or delete the group first.',
        );

        // Verify the gatekeeper check was performed.
        expect(mockGetDocs).toHaveBeenCalledTimes(1);
        // Verify deletion did NOT proceed.
        expect(mockDeleteDoc).not.toHaveBeenCalled();
        expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should throw an error if no user is signed in', async () => {
      // ARRANGE: currentUser is null by default

      // ACT & ASSERT
      await expect(userRepository.deleteUserAccount()).rejects.toThrow(
        'No user is currently signed in to delete.',
      );
    });
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
      // --- THIS IS THE FIX (Part 3): These assertions will now pass because the original function is no longer spied on. ---
      expect(mockCollection).toHaveBeenCalledWith(db, 'groups');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith(`participantUids.${uid}`, '==', true);
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
      expect(result).toBeNull();
    });
    
    it('should return null if the user is a member but not an admin', async () => {
        // ARRANGE
        const uid = 'user-member-only';
        const nonBlockingGroup: Group = {
            gid: 'group-3', name: 'Member Only Group', icon: '👤', ownerUid: 'owner',
            participants: [
                { id: 'p-1', uid: 'admin-user', role: 'admin', turnCount: 1, nickname: 'Admin' },
                { id: 'p-2', uid, role: 'member', turnCount: 1, nickname: 'Member' },
            ],
            turnOrder: ['p-1', 'p-2'],
            participantUids: { [uid]: true, 'admin-user': true },
            adminUids: { 'admin-user': true },
        };
        mockGetDocs.mockResolvedValue({ docs: [{ data: () => nonBlockingGroup }] } as any);

        // ACT
        const result = await userRepository.findBlockingGroup(uid);

        // ASSERT
        expect(result).toBeNull();
    });
  });
});