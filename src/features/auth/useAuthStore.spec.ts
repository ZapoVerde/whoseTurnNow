/**
 * @file packages/whoseturnnow/src/features/auth/useAuthStore.spec.ts
 * @stamp {"ts":"2025-10-25T05:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/useAuthStore.ts
 *
 * @description
 * Verifies the state transitions and actions of the authentication store in complete
 * isolation. This suite ensures that the store's state machine (initializing,
 * authenticated, unauthenticated, new-user) is correct and predictable.
 *
 * @criticality
 * Critical (Reason: State Store Ownership, High Fan-Out, Security & Authentication Context)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file only reads from the store and asserts on its state.
 *     state_ownership: none # This test file does not own or manage any application state.
 *     external_io: none # This test file MUST NOT perform any network or file system I/O.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore, type AppUser } from './useAuthStore';

describe('useAuthStore', () => {
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    act(() => {
      useAuthStore.setState(initialState);
    });
  });

  it('should have the correct initial state', () => {
    // ARRANGE & ACT: State is set by the store definition and the beforeEach hook.
    const { status, user } = useAuthStore.getState();

    // ASSERT
    expect(status).toBe('initializing');
    expect(user).toBeNull();
  });

  it('should transition to the "authenticated" state when setAuthenticated is called', () => {
    // ARRANGE
    const mockUser: AppUser = {
      uid: 'user-123',
      displayName: 'Test User',
      isAnonymous: false,
    };

    // ACT
    act(() => {
      useAuthStore.getState().setAuthenticated(mockUser);
    });

    // ASSERT
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(mockUser);
  });

  it('should transition to the "unauthenticated" state when setUnauthenticated is called', () => {
    // ARRANGE: First, put the store into an authenticated state.
    act(() => {
      useAuthStore.getState().setAuthenticated({ uid: 'temp-user', displayName: 'Temp', isAnonymous: true });
    });

    // ACT
    act(() => {
      useAuthStore.getState().setUnauthenticated();
    });

    // ASSERT
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
  });

  it('should transition to the "new-user" state when setNewUser is called', () => {
    // ARRANGE
    const mockNewUser: AppUser = {
      uid: 'new-user-456',
      displayName: null,
      isAnonymous: true,
    };

    // ACT
    act(() => {
      useAuthStore.getState().setNewUser(mockNewUser);
    });

    // ASSERT
    const state = useAuthStore.getState();
    expect(state.status).toBe('new-user');
    expect(state.user).toEqual(mockNewUser);
  });

  it('should allow directly setting the status for orchestration purposes', () => {
    // ARRANGE
    const targetStatus = 'initializing';

    // ACT: First, change the status to something else.
    act(() => {
      useAuthStore.getState().setAuthenticated({ uid: 'user-123', displayName: 'Test', isAnonymous: false });
    });
    // Now, call the direct status setter.
    act(() => {
      useAuthStore.getState().setStatus(targetStatus);
    });

    // ASSERT
    const state = useAuthStore.getState();
    expect(state.status).toBe(targetStatus);
    // The user object should remain unchanged by this specific action.
    expect(state.user).not.toBeNull();
  });
});