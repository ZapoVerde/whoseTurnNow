/**
 * @file packages/whoseturnnow/src/features/auth/useFirebaseAuthListener.spec.ts
 * @stamp {"ts":"2025-10-21T14:05:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/useFirebaseAuthListener.ts
 *
 * @description
 * Verifies that the useFirebaseAuthListener hook correctly orchestrates the full
 * authentication lifecycle. It tests the interactions between the mocked Firebase
 * Auth service, the `userRepository`, and the `useAuthStore` to ensure state is
 * synchronized correctly for new and returning users.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, Security & Authentication Context)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User as FirebaseUser } from 'firebase/auth';

// --- Mocks ---
vi.mock('./userRepository');

// --- Imports ---
import { onAuthStateChanged } from 'firebase/auth';
import { userRepository } from './userRepository';
import { useAuthStore, type AppUser } from './useAuthStore';
import { useFirebaseAuthListener } from './useFirebaseAuthListener';

// --- Test Setup ---
const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockGetUserProfile = vi.mocked(userRepository.getUserProfile);
const mockCreateUserProfile = vi.mocked(userRepository.createUserProfile);

describe('useFirebaseAuthListener', () => {
  const originalState = useAuthStore.getState();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState(originalState);
    mockOnAuthStateChanged.mockReturnValue(() => {});
  });

  it('should create a new user profile and authenticate when a new user signs in', async () => {
    // ARRANGE
    const mockFirebaseUser = { uid: 'new-user-123' } as FirebaseUser;
    mockGetUserProfile.mockResolvedValue(null);
    mockCreateUserProfile.mockResolvedValue(undefined);

    // FINAL FIX: Explicitly type parameters as 'any' to satisfy noImplicitAny.
    mockOnAuthStateChanged.mockImplementation(((_auth: any, callback: any) => {
      callback(mockFirebaseUser);
      return () => {};
    }) as any);

    // ACT
    renderHook(() => useFirebaseAuthListener());

    // ASSERT
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith('new-user-123');
      expect(useAuthStore.getState().status).toBe('authenticated');
    });
  });

  it('should load an existing profile and authenticate when a returning user signs in', async () => {
    // ARRANGE
    const mockFirebaseUser = { uid: 'returning-user-456' } as FirebaseUser;
    const existingProfile: AppUser = {
      uid: 'returning-user-456',
      displayName: 'Returning Hero',
      isAnonymous: false,
    };
    mockGetUserProfile.mockResolvedValue(existingProfile);

    // FINAL FIX: Explicitly type parameters as 'any'.
    mockOnAuthStateChanged.mockImplementation(((_auth: any, callback: any) => {
      callback(mockFirebaseUser);
      return () => {};
    }) as any);

    // ACT
    renderHook(() => useFirebaseAuthListener());

    // ASSERT
    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(existingProfile);
    });
  });

  it('should set unauthenticated state when the user logs out', async () => {
    // ARRANGE
    // FINAL FIX: Explicitly type parameters as 'any'.
    mockOnAuthStateChanged.mockImplementation(((_auth: any, callback: any) => {
      callback(null); // Simulate logout
      return () => {};
    }) as any);

    // ACT
    renderHook(() => useFirebaseAuthListener());

    // ASSERT
    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    });
  });

  it('should call the unsubscribe function on unmount', () => {
    // ARRANGE
    const mockUnsubscribe = vi.fn();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const { unmount } = renderHook(() => useFirebaseAuthListener());

    // ACT
    unmount();

    // ASSERT
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});