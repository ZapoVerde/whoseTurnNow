/**
 * @file packages/whoseturnnow/src/features/groups/useGroupStore.spec.ts
 * @stamp {"ts":"2025-10-21T15:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/useGroupStore.ts
 *
 * @description
 * Verifies the state transitions and actions of the active group store, ensuring
 * that data loading, state updates, and subscription cleanup are handled correctly.
 *
 * @criticality
 * Critical (Reason: State Store Ownership)
 *
 * @testing-layer Unit
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the store's state and mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { describe, it, expect, vi, beforeEach,  } from 'vitest';
import { act } from '@testing-library/react';
import type { Mock } from 'vitest';

// --- Mocks ---
vi.mock('./groupsRepository');

// --- Imports ---
import { useGroupStore } from './useGroupStore';
import { getGroup, getGroupTurnLog } from './groupsRepository';
import type { Group, LogEntry } from '../../types/group';

// --- Test Setup ---
const mockGetGroup = getGroup as Mock;
const mockGetGroupTurnLog = getGroupTurnLog as Mock;

const mockGroup: Group = {
  gid: 'test-group-1',
  name: 'Mock Group',
  icon: '🧪',
  ownerUid: 'owner-1',
  participants: [],
  turnOrder: [],
  participantUids: [],
};

const mockTurnLog: LogEntry[] = [
  {
    type: 'TURN_COMPLETED',
    completedAt: null as any, // Firestore FieldValue is complex to mock
    participantId: 'p-1',
    participantName: 'Alice',
    actorUid: 'u-1',
    actorName: 'Alice',
  },
];

describe('useGroupStore', () => {
  // Get the initial state to reset the store between tests
  const initialState = useGroupStore.getState();

  beforeEach(() => {
    // Reset the store to its initial state before each test
    useGroupStore.setState(initialState);
    vi.clearAllMocks();
  });

  it('should load group and log data, update state, and set loading to false', () => {
    // ARRANGE
    let groupUpdateCallback: (group: Group | null) => void;
    let logUpdateCallback: (logs: LogEntry[]) => void;

    // Add explicit types to the mock implementation parameters
    mockGetGroup.mockImplementation(
      (_groupId: string, onUpdate: (group: Group | null) => void) => {
        groupUpdateCallback = onUpdate;
        return vi.fn(); // Return a mock unsubscribe function
      },
    );
    mockGetGroupTurnLog.mockImplementation(
      (_groupId: string, onUpdate: (logs: LogEntry[]) => void) => {
        logUpdateCallback = onUpdate;
        return vi.fn();
      },
    );
    // ACT
    // 1. Call the action that sets up the listeners
    act(() => {
      useGroupStore.getState().loadGroupAndLog('test-group-1');
    });

    // ASSERT initial loading state
    expect(useGroupStore.getState().isLoading).toBe(true);

    // 2. Simulate the repository sending updates
    act(() => {
      groupUpdateCallback(mockGroup);
      logUpdateCallback(mockTurnLog);
    });

    // ASSERT final state
    const state = useGroupStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.group).toEqual(mockGroup);
    expect(state.turnLog).toEqual(mockTurnLog);
    expect(mockGetGroup).toHaveBeenCalledWith('test-group-1', expect.any(Function));
    expect(mockGetGroupTurnLog).toHaveBeenCalledWith('test-group-1', expect.any(Function));
  });

  it('should call unsubscribe functions and reset state on cleanup', () => {
    // ARRANGE
    const mockUnsubscribeGroup = vi.fn();
    const mockUnsubscribeLog = vi.fn();

    // Set up mocks to return our specific unsubscribe functions
    mockGetGroup.mockReturnValue(mockUnsubscribeGroup);
    mockGetGroupTurnLog.mockReturnValue(mockUnsubscribeLog);

    // ACT
    // 1. Load data to activate the subscriptions
    act(() => {
      useGroupStore.getState().loadGroupAndLog('test-group-1');
    });

    // 2. Simulate data arriving to move out of the initial loading state
    act(() => {
        useGroupStore.setState({ group: mockGroup, isLoading: false });
    });


    // ASSERT that we are in a "loaded" state before cleanup
    expect(useGroupStore.getState().group).toEqual(mockGroup);
    expect(useGroupStore.getState().isLoading).toBe(false);

    // 3. Call the cleanup action
    act(() => {
      useGroupStore.getState().cleanup();
    });

    // ASSERT
    // 1. Verify that the unsubscribe functions were called
    expect(mockUnsubscribeGroup).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeLog).toHaveBeenCalledTimes(1);

    // 2. Verify that the state was reset to its initial values
    const finalState = useGroupStore.getState();
    expect(finalState.group).toBeNull();
    expect(finalState.turnLog).toEqual([]);
    expect(finalState.isLoading).toBe(true);
    expect(finalState._unsubscribeGroup).toBeNull();
    expect(finalState._unsubscribeLog).toBeNull();
  });
});