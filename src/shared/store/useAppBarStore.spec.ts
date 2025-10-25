/**
 * @file packages/whoseturnnow/src/shared/store/useAppBarStore.spec.ts
 * @stamp {"ts":"2025-10-25T04:55:00Z"}
 * @test-target packages/whoseturnnow/src/shared/store/useAppBarStore.ts
 *
 * @description
 * Verifies the state transitions and actions of the global AppBar store in
 * complete isolation. This suite ensures that the `setConfig` and `reset`
 * actions correctly and predictably mutate the store's state.
 *
 * @criticality
 * Critical (Reason: State Store Ownership, High Fan-Out)
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
import { useAppBarStore } from './useAppBarStore';

describe('useAppBarStore', () => {
  // Get a reference to the initial state for resetting between tests.
  const initialState = useAppBarStore.getState();

  beforeEach(() => {
    // Manually reset the store to its default initial state before each test.
    act(() => {
      useAppBarStore.setState(initialState);
    });
  });

  it('should have the correct initial state', () => {
    // ARRANGE & ACT: The state is set by the store's definition and the beforeEach hook.
    const { title, actions, showBackButton } = useAppBarStore.getState();

    // ASSERT: Verify all properties match their expected default values.
    expect(title).toBe('Whose Turn Now');
    expect(actions).toBeNull();
    expect(showBackButton).toBe(false);
  });

  it('should correctly update a single property with setConfig', () => {
    // ARRANGE: The initial title is 'Whose Turn Now'.
    const newTitle = 'Settings';

    // ACT: Call the setConfig action to update only the title.
    act(() => {
      useAppBarStore.getState().setConfig({ title: newTitle });
    });

    // ASSERT: Verify that only the title has changed and other properties remain the same.
    const state = useAppBarStore.getState();
    expect(state.title).toBe(newTitle);
    expect(state.actions).toBeNull(); // Unaffected
    expect(state.showBackButton).toBe(false); // Unaffected
  });

  it('should correctly update multiple properties with setConfig', () => {
    // ARRANGE: Define a new configuration object.
    const newConfig = {
      title: 'Group Details',
      showBackButton: true,
      actions: '<div>Mock Actions</div>', // Using a string for simplicity in testing
    };

    // ACT: Call the setConfig action with the full configuration object.
    act(() => {
      useAppBarStore.getState().setConfig(newConfig);
    });

    // ASSERT: Verify that all properties have been updated to the new values.
    const state = useAppBarStore.getState();
    expect(state.title).toBe(newConfig.title);
    expect(state.showBackButton).toBe(newConfig.showBackButton);
    expect(state.actions).toBe(newConfig.actions);
  });

  it('should revert to the initial state when reset is called', () => {
    // ARRANGE: First, modify the state to something different from the initial state.
    act(() => {
      useAppBarStore.getState().setConfig({ title: 'Modified State', showBackButton: true });
    });

    // ASSERT PRE-CONDITION: Ensure the state is indeed modified.
    const modifiedState = useAppBarStore.getState();
    expect(modifiedState.title).not.toBe(initialState.title);
    expect(modifiedState.showBackButton).not.toBe(initialState.showBackButton);

    // ACT: Call the reset action.
    act(() => {
      useAppBarStore.getState().reset();
    });

    // ASSERT FINAL STATE: Verify the state is identical to the initial state.
    const finalState = useAppBarStore.getState();
    expect(finalState.title).toBe(initialState.title);
    expect(finalState.actions).toBe(initialState.actions);
    expect(finalState.showBackButton).toBe(initialState.showBackButton);
  });
});