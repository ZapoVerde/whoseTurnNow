/**
 * @file packages/whoseturnnow/src/features/auth/useAuthStore.spec.ts
 * @stamp {"ts":"2025-10-21T14:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/useAuthStore.ts
 *
 * @description
 * Verifies the state transitions and actions of the authentication store in complete
 * isolation, ensuring that state mutations are correct and predictable.
 *
 * @criticality
 * Critical (Reason: State Store Ownership, High Fan-Out, Core Domain Model
 * Definition, Security & Authentication Context)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file only reads from the store and asserts on its state.
 *     state_ownership: none # This test file does not own or manage any application state.
 *     external_io: none # This test file MUST NOT perform any network or file system I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// --- Mocks ---

vi.mock('../../lib/firebase', () => ({
  db: {}, // Provide a dummy 'db' object to satisfy the import.
}));

// Mock the low-level firestore functions that the repository depends on.
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

// --- Imports ---
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { userRepository } from './userRepository';
import type { AppUser } from './useAuthStore';

// --- Test Setup ---
const mockDoc = doc as Mock;
const mockGetDoc = getDoc as Mock;
const mockSetDoc = setDoc as Mock;

describe('userRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      });

      // ACT
      const profile = await userRepository.getUserProfile('user-123');

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-123'); // The dummy db object is {}
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual(mockUserData);
    });

    it('should return null when the document does not exist', async () => {
      // ARRANGE
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // ACT
      const profile = await userRepository.getUserProfile('user-404');

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-404');
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

      // ACT
      await userRepository.createUserProfile(newUser);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'new-user-abc');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc.mock.calls[0][1]).toEqual(newUser);
    });
  });
});
