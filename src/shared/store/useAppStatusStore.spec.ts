/**
 * @file packages/whoseturnnow/src/shared/store/useAppStatusStore.spec.ts
 * @test-target packages/whoseturnnow/src/shared/store/useAppStatusStore.ts
 * @description Verifies the state transitions of the application status store.
 * @criticality High
 * @testing-layer Unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStatusStore } from './useAppStatusStore';

describe('useAppStatusStore', () => {
  // Reset the store to its initial state before each test
  beforeEach(() => {
    act(() => {
      useAppStatusStore.setState(useAppStatusStore.getInitialState());
    });
  });

  it('should initialize with a "live" connection mode', () => {
    // ARRANGE & ACT: The initial state is set in the beforeEach hook.
    const { connectionMode } = useAppStatusStore.getState();

    // ASSERT
    expect(connectionMode).toBe('live');
  });

  it('should correctly transition the state from "live" to "degraded"', () => {
    // ARRANGE
    const initialState = useAppStatusStore.getState().connectionMode;
    expect(initialState).toBe('live'); // Pre-condition check

    // ACT
    act(() => {
      useAppStatusStore.getState().setConnectionMode('degraded');
    });

    // ASSERT
    const finalState = useAppStatusStore.getState().connectionMode;
    expect(finalState).toBe('degraded');
  });

  it('should correctly transition the state from "degraded" back to "live"', () => {
    // ARRANGE: First, set the state to 'degraded'.
    act(() => {
      useAppStatusStore.getState().setConnectionMode('degraded');
    });
    const initialState = useAppStatusStore.getState().connectionMode;
    expect(initialState).toBe('degraded'); // Pre-condition check

    // ACT
    act(() => {
      useAppStatusStore.getState().setConnectionMode('live');
    });

    // ASSERT
    const finalState = useAppStatusStore.getState().connectionMode;
    expect(finalState).toBe('live');
  });

  it('should not trigger a state change if the mode is already set to the new mode', () => {
    // ARRANGE
    const originalState = useAppStatusStore.getState();

    // Subscribe to the store and create a spy to watch for changes.
    const listener = vi.fn();
    const unsubscribe = useAppStatusStore.subscribe(listener);
    
    // ACT: Call the setter with the same value it already has.
    act(() => {
      useAppStatusStore.getState().setConnectionMode('live');
    });

    // ASSERT
    expect(listener).not.toHaveBeenCalled();
    expect(useAppStatusStore.getState()).toBe(originalState); // The state object itself should not have changed.
    
    unsubscribe();
  });
});