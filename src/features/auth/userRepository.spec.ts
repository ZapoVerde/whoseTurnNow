/**
 * @file packages/whoseturnnow/src/features/auth/userRepository.spec.ts
 * @stamp {"ts":"2025-10-21T14:05:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/userRepository.ts
 *
 * @description
 * Verifies that the userRepository correctly invokes the underlying Firestore
 * functions with the expected parameters for all user profile CRUD operations.
 *
 * @criticality
 * Critical (Reason: Core Domain Model Definition, Security & Authentication Context,
 * I/O & Concurrency Management)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file only asserts on mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Imports ---
// Import the functions we want to test against
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { userRepository } from './userRepository';
import type { AppUser } from './useAuthStore';

// --- Test Setup ---
// Use vi.mocked() to get a type-safe reference to the mocked functions.
// This is the correct pattern.
const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);

describe('userRepository', () => {
  beforeEach(() => {
    // Reset mocks before each test
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
      // FIX: Call mockResolvedValue on the correctly referenced mock
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      // ACT
      const profile = await userRepository.getUserProfile('user-123');

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-123');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual(mockUserData);
    });

    it('should return null when the document does not exist', async () => {
      // ARRANGE
      // FIX: Call mockResolvedValue on the correctly referenced mock
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

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
      // For setDoc, we can mock it to resolve successfully.
      mockSetDoc.mockResolvedValue(undefined);

      // ACT
      await userRepository.createUserProfile(newUser);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'new-user-abc');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc.mock.calls[0][1]).toEqual(newUser);
    });
  });
});