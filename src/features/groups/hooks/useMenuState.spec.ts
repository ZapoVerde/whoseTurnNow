/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useMenuState.spec.ts
 * @architectural-role Verification
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useMenuState.ts
 *
 * @description
 * Unit tests for the `useMenuState` hook. This suite verifies the complete
 * state lifecycle of the hook, ensuring it correctly manages the anchor element
 * and the open/closed state of a menu.
 *
 * @criticality
 * Critical (Reason: High Fan-Out / System-Wide Dependency)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file only asserts on the hook's output.
 *     state_ownership: none
 *     external_io: none # This test MUST NOT perform any I/O.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMenuState } from './useMenuState';
import type { MouseEvent } from 'react';

describe('useMenuState', () => {
  it('should have a correct initial state', () => {
    // ARRANGE: Render the hook.
    const { result } = renderHook(() => useMenuState());

    // ASSERT: Verify the initial values.
    expect(result.current.isOpen).toBe(false);
    expect(result.current.anchorEl).toBeNull();
  });

  it('should update state correctly when handleOpen is called', () => {
    // ARRANGE
    const { result } = renderHook(() => useMenuState());
    const mockAnchorEl = document.createElement('button');
    // Create a mock event that satisfies the type checker.
    const mockEvent = {
      currentTarget: mockAnchorEl,
    } as MouseEvent<HTMLButtonElement>;

    // ACT: Call the open handler within an `act` block for state updates.
    act(() => {
      result.current.handleOpen(mockEvent);
    });

    // ASSERT: Verify the new state.
    expect(result.current.isOpen).toBe(true);
    expect(result.current.anchorEl).toBe(mockAnchorEl);
  });

  it('should revert to the initial state when handleClose is called', () => {
    // ARRANGE
    const { result } = renderHook(() => useMenuState());
    const mockAnchorEl = document.createElement('button');
    const mockEvent = {
      currentTarget: mockAnchorEl,
    } as MouseEvent<HTMLButtonElement>;

    // ACT: First, open the menu.
    act(() => {
      result.current.handleOpen(mockEvent);
    });

    // ASSERT PRE-CONDITION: Ensure the menu is actually open.
    expect(result.current.isOpen).toBe(true);

    // ACT: Now, close the menu.
    act(() => {
      result.current.handleClose();
    });

    // ASSERT FINAL STATE: Verify it's closed and the anchor is gone.
    expect(result.current.isOpen).toBe(false);
    expect(result.current.anchorEl).toBeNull();
  });
});