/**
 * @file packages/whoseturnnow/src/features/groups/useGroupStore.spec.ts
 * @stamp {"ts":"2025-10-23T10:20:00Z"}
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// --- Mocks ---
vi.mock('./repository');

// --- Imports ---
import { useGroupStore } from './useGroupStore';
import { groupsRepository } from './repository';
import type { Group, LogEntry } from '../../types/group';

// --- Test Setup ---
const mockGetGroup = vi.mocked(groupsRepository.getGroup);
const mockGetGroupTurnLog = vi.mocked(groupsRepository.getGroupTurnLog);

const mockGroup: Group = {
  gid: 'test-group-1',
  name: 'Mock Group',
  icon: '🧪',
  ownerUid: 'owner-1',
  participants: [],
  turnOrder: [],
  participantUids: {},
  adminUids: {},
};

const mockTurnLog: (LogEntry & { id: string })[] = [
  {
    id: 'log-1',
    type: 'TURN_COMPLETED',
    completedAt: null as any,
    participantId: 'p-1',
    participantName: 'Alice',
    actorUid: 'u-1',
    actorName: 'Alice',
    _participantUids: {},
    // THIS IS THE FIX: Add the missing '_adminUids' property to match the
    // official TurnCompletedLog type definition.
    _adminUids: {},
  },
];

describe('useGroupStore', () => {
  const initialState = useGroupStore.getState();

  beforeEach(() => {
    useGroupStore.setState(initialState);
    vi.clearAllMocks();
  });

  it('should load group and log data, update state, and set loading to false', () => {
    // ARRANGE
    let groupUpdateCallback: (group: Group | null) => void;
    let logUpdateCallback: (logs: (LogEntry & { id: string })[]) => void;

    mockGetGroup.mockImplementation(
      (_groupId: string, onUpdate: (group: Group | null) => void) => {
        groupUpdateCallback = onUpdate;
        return vi.fn(); // Return a mock unsubscribe function
      },
    );
    mockGetGroupTurnLog.mockImplementation(
      (_groupId: string, onUpdate: (logs: (LogEntry & { id: string })[]) => void) => {
        logUpdateCallback = onUpdate;
        return vi.fn();
      },
    );

    // ACT
    act(() => {
      useGroupStore.getState().loadGroupAndLog('test-group-1');
    });

    // ASSERT initial loading state
    expect(useGroupStore.getState().isLoading).toBe(true);

    // ACT: Simulate the repository sending updates
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
    mockGetGroup.mockReturnValue(mockUnsubscribeGroup);
    mockGetGroupTurnLog.mockReturnValue(mockUnsubscribeLog);

    // ACT
    act(() => {
      useGroupStore.getState().loadGroupAndLog('test-group-1');
    });

    act(() => {
      useGroupStore.setState({ group: mockGroup, isLoading: false });
    });

    // ASSERT that we are in a "loaded" state before cleanup
    expect(useGroupStore.getState().group).toEqual(mockGroup);
    expect(useGroupStore.getState().isLoading).toBe(false);

    // ACT: Call the cleanup action
    act(() => {
      useGroupStore.getState().cleanup();
    });

    // ASSERT
    expect(mockUnsubscribeGroup).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeLog).toHaveBeenCalledTimes(1);

    const finalState = useGroupStore.getState();
    expect(finalState.group).toBeNull();
    expect(finalState.turnLog).toEqual([]);
    expect(finalState.isLoading).toBe(true);
    expect(finalState._unsubscribeGroup).toBeNull();
    expect(finalState._unsubscribeLog).toBeNull();
  });
});