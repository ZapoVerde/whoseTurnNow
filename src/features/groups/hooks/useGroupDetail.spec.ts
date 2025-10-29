/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupDetail.spec.ts
 * @stamp {"ts":"2025-10-25T11:50:00Z"}
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

import { renderHook } from '@testing-library/react';
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
vi.mock('./useTurnLifecycleActions');
vi.mock('./useMembershipActions');
vi.mock('./useGroupSettingsActions');
vi.mock('./useSharingActions');

// --- Imports ---
import { useGroupDetail } from './useGroupDetail';
import { useGroupStore } from '../useGroupStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import { useGroupDerivedState } from './useGroupDerivedState';
import { useTurnLifecycleActions } from './useTurnLifecycleActions';
import { useMembershipActions } from './useMembershipActions';
import { useGroupSettingsActions } from './useGroupSettingsActions';
import { useSharingActions } from './useSharingActions';

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
  currentUserParticipant: null,
  orderedParticipants: [],
  isAdmin: false,
  isUserTurn: false,
  isLastAdmin: false,
  undoableAction: null,
});
vi.mocked(useTurnLifecycleActions).mockReturnValue({} as any);
vi.mocked(useMembershipActions).mockReturnValue({} as any);
vi.mocked(useGroupSettingsActions).mockReturnValue({} as any);
vi.mocked(useSharingActions).mockReturnValue({} as any);


describe('useGroupDetail Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call loadGroupAndLog on initial render with the correct groupId', () => {
    const groupId = 'group-123';
    renderHook(() => useGroupDetail(groupId));
    expect(mockLoadGroupAndLog).toHaveBeenCalledTimes(1);
    expect(mockLoadGroupAndLog).toHaveBeenCalledWith(groupId);
  });

  it('should call the cleanup function on unmount', () => {
    const groupId = 'group-123';
    const { unmount } = renderHook(() => useGroupDetail(groupId));
    unmount();
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  it('should not call loadGroupAndLog if groupId is undefined', () => {
    renderHook(() => useGroupDetail(undefined));
    expect(mockLoadGroupAndLog).not.toHaveBeenCalled();
  });

  it('should re-trigger data loading when connectionMode changes from degraded to live', () => {
    vi.mocked(useAppStatusStore).mockReturnValue('degraded');
    const { rerender } = renderHook(() => useGroupDetail('group-123'));
    expect(mockLoadGroupAndLog).not.toHaveBeenCalled();

    vi.mocked(useAppStatusStore).mockReturnValue('live');
    rerender();

    expect(mockLoadGroupAndLog).toHaveBeenCalledTimes(1);
    expect(mockLoadGroupAndLog).toHaveBeenCalledWith('group-123');
  });

  it('should return the correctly composed view model', () => {
    // ARRANGE
    const mockDerivedState = {
      isAdmin: true,
      isUserTurn: true,
      orderedParticipants: [{ id: 'p1', name: 'Alice' }],
    };
    vi.mocked(useGroupStore).mockReturnValue({
      group: { gid: 'group-123', name: 'Test Group' } as any,
      turnLog: [{ id: 'log-1', type: 'TURN_COMPLETED' }] as any,
      isLoading: false,
      loadGroupAndLog: mockLoadGroupAndLog,
      cleanup: mockCleanup,
    });
    vi.mocked(useGroupDerivedState).mockReturnValue(mockDerivedState as any);

    // ACT
    const { result } = renderHook(() => useGroupDetail('group-123'));

    // ASSERT
    expect(result.current.isLoading).toBe(false);
    expect(result.current.group?.name).toBe('Test Group');
    expect(result.current.turnLog.length).toBe(1);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isUserTurn).toBe(true);
    expect(result.current.actions).toBeDefined();
    expect(result.current.feedback).toBeNull();
    
    // Verify the new dialog state is part of the hook's contract.
    expect(result.current.changeNameDialog).toBeDefined();
    expect(result.current.changeNameDialog.isOpen).toBe(false);
  });
});