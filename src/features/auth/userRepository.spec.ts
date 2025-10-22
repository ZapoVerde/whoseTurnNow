/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.spec.ts
 * @stamp {"ts":"2025-10-22T02:30:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/userRepository.ts
 * @description
 * Verifies the correctness of all user profile interactions, including
 * creation, fetching, name updates, and account deletion.
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
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { userRepository } from './userRepository';
import { auth } from '../../lib/firebase'; // <-- We import the plain '{}' mock
import type { AppUser } from './useAuthStore';

// Get typed references to the globally mocked functions
const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockDeleteUser = vi.mocked(deleteUser);

describe('userRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // THE FIX: The 'auth' object is just {}. Reset its currentUser property before each test.
    // We use 'as any' to tell TypeScript it's okay to add this property for testing.
    (auth as any).currentUser = null;
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
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', uid);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdateDoc.mock.calls[0][1];
      expect(updatePayload).toEqual({ displayName: newDisplayName });
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete the firestore doc and the auth user', async () => {
      // ARRANGE
      const mockUser = { uid: 'user-to-delete-456' };
      // THE FIX: Directly set the currentUser property on our mocked auth object.
      (auth as any).currentUser = mockUser;
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDeleteUser.mockResolvedValue(undefined);

      // ACT
      await userRepository.deleteUserAccount();

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', mockUser.uid);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
      expect(mockDeleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('should throw an error if no user is signed in', async () => {
      // ARRANGE
      // The beforeEach hook already sets currentUser to null.

      // ACT & ASSERT
      await expect(userRepository.deleteUserAccount()).rejects.toThrow(
        'No user is currently signed in to delete.',
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return a user profile when the document exists', async () => {
      const mockUserData: AppUser = { uid: 'user-123', displayName: 'Test User', isAnonymous: false };
      mockGetDoc.mockResolvedValue({ exists: () => true, data: () => mockUserData } as any);
      const profile = await userRepository.getUserProfile('user-123');
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-123');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual(mockUserData);
    });

    it('should return null when the document does not exist', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false } as any);
      const profile = await userRepository.getUserProfile('user-404');
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-404');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toBeNull();
    });
  });

  describe('createUserProfile', () => {
    it('should call setDoc with the correct user data', async () => {
      const newUser: AppUser = { uid: 'new-user-abc', displayName: 'Newbie', isAnonymous: true };
      mockSetDoc.mockResolvedValue(undefined);
      await userRepository.createUserProfile(newUser);
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'new-user-abc');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc.mock.calls[0][1]).toEqual(newUser);
    });
  });
});