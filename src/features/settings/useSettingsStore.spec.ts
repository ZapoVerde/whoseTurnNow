/**
 * @file packages/whoseturnnow/src/features/settings/useSettingsStore.spec.ts
 * @stamp {"ts":"2025-10-25T04:50:00Z"}
 * @test-target packages/whoseturnnow/src/features/settings/useSettingsStore.ts
 *
 * @description
 * Verifies the state transitions and actions of the global settings store in
 * complete isolation. This suite ensures that all state mutations related to
 * theme and UI preferences are correct and predictable.
 *
 * @criticality
 * Critical (Reason: State Store Ownership)
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
import { useSettingsStore, type ThemeMode, type Density, type VisualComplexity } from './useSettingsStore';

describe('useSettingsStore', () => {
  // Reset the store to its initial state before each test to ensure isolation.
  beforeEach(() => {
    act(() => {
      // Vitest doesn't have a direct equivalent of Jest's resetModules, so we
      // manually reset the store's state to its initial value.
      useSettingsStore.setState(useSettingsStore.getInitialState());
    });
  });

  it('should have the correct initial state', () => {
    // ARRANGE: The initial state is set by the store's definition and the beforeEach hook.
    const { themeMode, density, visualComplexity } = useSettingsStore.getState();

    // ASSERT: Verify that all properties match their expected default values.
    expect(themeMode).toBe('light');
    expect(density).toBe('comfortable');
    expect(visualComplexity).toBe('full');
  });

  it('should correctly update the themeMode when setThemeMode is called', () => {
    // ARRANGE: The initial state is 'light'.
    const newMode: ThemeMode = 'dark';

    // ACT: Call the action to update the state, wrapped in `act`.
    act(() => {
      useSettingsStore.getState().setThemeMode(newMode);
    });

    // ASSERT: Verify that only the themeMode has changed.
    const state = useSettingsStore.getState();
    expect(state.themeMode).toBe(newMode);
    expect(state.density).toBe('comfortable'); // Ensure other state is unaffected.
  });

  it('should correctly update the density when setDensity is called', () => {
    // ARRANGE: The initial state is 'comfortable'.
    const newDensity: Density = 'compact';

    // ACT: Call the action to update the state.
    act(() => {
      useSettingsStore.getState().setDensity(newDensity);
    });

    // ASSERT: Verify that only the density has changed.
    const state = useSettingsStore.getState();
    expect(state.density).toBe(newDensity);
    expect(state.themeMode).toBe('light'); // Ensure other state is unaffected.
  });

  it('should correctly update the visualComplexity when setVisualComplexity is called', () => {
    // ARRANGE: The initial state is 'full'.
    const newComplexity: VisualComplexity = 'simple';

    // ACT: Call the action to update the state.
    act(() => {
      useSettingsStore.getState().setVisualComplexity(newComplexity);
    });

    // ASSERT: Verify that only the visualComplexity has changed.
    const state = useSettingsStore.getState();
    expect(state.visualComplexity).toBe(newComplexity);
    expect(state.themeMode).toBe('light'); // Ensure other state is unaffected.
  });
});