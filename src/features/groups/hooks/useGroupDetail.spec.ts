/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.spec.ts
 * @stamp {"ts":"2025-10-24T22:50:00Z"}
 * @architectural-role Verification
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.ts
 *
 * @description
 * Verifies the orchestrator logic of the `useGroupDetail` hook. This suite ensures
 * that the hook correctly subscribes to data stores, triggers data loading based on
 * its lifecycle and dependencies (like `connectionMode`), and properly composes the
 * final view model from its various sources.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # Asserts on mock function calls and hook return values.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { renderHook, } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));
vi.mock('../useGroupStore');
vi.mock('../../auth/useAuthStore');
vi.mock('../../../shared/store/useAppStatusStore');
vi.mock('./useGroupDerivedState');
vi.mock('./useGroupActions');

// --- Imports ---
import { useGroupDetail } from './useGroupDetail';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import { useGroupDerivedState } from './useGroupDerivedState';
import { useGroupActions } from './useGroupActions';

// --- Test Setup ---
const mockLoadGroupAndLog = vi.fn();
const mockCleanup = vi.fn();

// Mock implementations for all composed hooks and stores
vi.mocked(useAuthStore).mockReturnValue({ uid: 'test-user' } as any);
vi.mocked(useGroupStore).mockReturnValue({
  group: null,
  turnLog: [],
  isLoading: true,
  loadGroupAndLog: mockLoadGroupAndLog,
  cleanup: mockCleanup,
});
vi.mocked(useAppStatusStore).mockReturnValue('live');
vi.mocked(useGroupDerivedState).mockReturnValue({
  // Return a dummy object with the expected shape
  currentUserParticipant: null,
  orderedParticipants: [],
  isAdmin: false,
  isUserTurn: false,
  isLastAdmin: false,
  undoableAction: null,
});
vi.mocked(useGroupActions).mockReturnValue({
  // Return a dummy object with the expected shape
  isSubmitting: false,
  feedback: null,
  setFeedback: vi.fn(),
  // Add other actions if they need to be tested for pass-through
} as any);

describe('useGroupDetail Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call loadGroupAndLog on initial render with the correct groupId', () => {
    // ARRANGE: The setup in the mock provides the initial state.
    const groupId = 'group-123';

    // ACT
    renderHook(() => useGroupDetail(groupId));

    // ASSERT
    expect(mockLoadGroupAndLog).toHaveBeenCalledTimes(1);
    expect(mockLoadGroupAndLog).toHaveBeenCalledWith(groupId);
  });

  it('should call the cleanup function on unmount', () => {
    // ARRANGE
    const groupId = 'group-123';
    const { unmount } = renderHook(() => useGroupDetail(groupId));

    // ACT
    unmount();

    // ASSERT
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  it('should not call loadGroupAndLog if groupId is undefined', () => {
    // ARRANGE: Pass undefined for the groupId.
    renderHook(() => useGroupDetail(undefined));

    // ASSERT
    expect(mockLoadGroupAndLog).not.toHaveBeenCalled();
  });

  it('should re-trigger data loading when connectionMode changes from degraded to live', () => {
    // ARRANGE: Start in a 'degraded' state.
    vi.mocked(useAppStatusStore).mockReturnValue('degraded');
    const { rerender } = renderHook(() => useGroupDetail('group-123'));

    // ASSERT PRE-CONDITION: It should not have loaded data in degraded mode.
    expect(mockLoadGroupAndLog).not.toHaveBeenCalled();

    // ACT: Simulate the app recovering and the store updating.
    vi.mocked(useAppStatusStore).mockReturnValue('live');
    rerender();

    // ASSERT: Now that the connection is live, it should load the data.
    expect(mockLoadGroupAndLog).toHaveBeenCalledTimes(1);
    expect(mockLoadGroupAndLog).toHaveBeenCalledWith('group-123');
  });

  it('should return the correctly composed view model', () => {
    // ARRANGE: Set up rich mock return values for all dependencies.
    const mockDerivedState = {
      isAdmin: true,
      isUserTurn: true,
      orderedParticipants: [{ id: 'p1', name: 'Alice' }],
    };
    const mockActions = {
      isSubmitting: false,
      feedback: { message: 'Success!', severity: 'success' },
    };

    vi.mocked(useGroupStore).mockReturnValue({
      group: { gid: 'group-123', name: 'Test Group' } as any,
      turnLog: [{ id: 'log-1', type: 'TURN_COMPLETED' }] as any,
      isLoading: false,
      loadGroupAndLog: mockLoadGroupAndLog,
      cleanup: mockCleanup,
    });
    vi.mocked(useGroupDerivedState).mockReturnValue(mockDerivedState as any);
    vi.mocked(useGroupActions).mockReturnValue(mockActions as any);

    // ACT
    const { result } = renderHook(() => useGroupDetail('group-123'));

    // ASSERT: Verify that the final returned object is a correct composition.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.group?.name).toBe('Test Group');
    expect(result.current.turnLog.length).toBe(1);
    expect(result.current.isAdmin).toBe(true); // From useGroupDerivedState
    expect(result.current.isUserTurn).toBe(true); // From useGroupDerivedState
    expect(result.current.feedback?.message).toBe('Success!'); // From useGroupActions
  });
});