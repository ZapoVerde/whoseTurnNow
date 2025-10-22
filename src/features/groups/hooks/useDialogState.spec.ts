/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useDialogState.spec.ts
 * @architectural-role Verification
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useDialogState.ts
 *
 * @description
 * Unit tests for the `useDialogState` hook. This suite verifies the hook's
 * state machine, ensuring it correctly manages the dialog's visibility and
 * properly invokes the confirmation callback.
 *
 * @criticality
 * Critical (Reason: High Fan-Out / System-Wide Dependency)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the hook's output and mock function calls.
 *     state_ownership: none
 *     external_io: none # This test MUST NOT perform any I/O.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDialogState } from './useDialogState';

describe('useDialogState', () => {
  it('should have a correct initial state', () => {
    // ARRANGE: Create a mock callback and render the hook.
    const mockOnConfirm = vi.fn();
    const { result } = renderHook(() => useDialogState(mockOnConfirm));

    // ASSERT: Verify the initial state.
    expect(result.current.isOpen).toBe(false);
  });

  it('should set isOpen to true when handleOpen is called', () => {
    // ARRANGE
    const mockOnConfirm = vi.fn();
    const { result } = renderHook(() => useDialogState(mockOnConfirm));

    // ACT: Call the open handler.
    act(() => {
      result.current.handleOpen();
    });

    // ASSERT
    expect(result.current.isOpen).toBe(true);
  });

  it('should set isOpen to false when handleClose is called', () => {
    // ARRANGE
    const mockOnConfirm = vi.fn();
    const { result } = renderHook(() => useDialogState(mockOnConfirm));

    // ACT: First, open the dialog.
    act(() => {
      result.current.handleOpen();
    });

    // ASSERT PRE-CONDITION
    expect(result.current.isOpen).toBe(true);

    // ACT: Now, close it.
    act(() => {
      result.current.handleClose();
    });

    // ASSERT FINAL STATE
    expect(result.current.isOpen).toBe(false);
  });

  it('should call onConfirm and then close the dialog when handleConfirm is called', () => {
    // ARRANGE
    const mockOnConfirm = vi.fn();
    const { result } = renderHook(() => useDialogState(mockOnConfirm));

    // ACT: First, open the dialog.
    act(() => {
      result.current.handleOpen();
    });

    // ASSERT PRE-CONDITION
    expect(result.current.isOpen).toBe(true);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // ACT: Now, confirm the action.
    act(() => {
      result.current.handleConfirm();
    });

    // ASSERT FINAL STATE
    // 1. The callback was executed.
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    // 2. The dialog is now closed.
    expect(result.current.isOpen).toBe(false);
  });
});