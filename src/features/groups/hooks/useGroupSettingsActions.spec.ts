/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupSettingsActions.spec.ts
 * @stamp {"ts":"2025-10-25T15:00:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useGroupSettingsActions.ts
 *
 * @description
 * Verifies the orchestration logic of the `useGroupSettingsActions` hook. This
 * suite ensures that all high-level, administrative actions correctly invoke
 * the corresponding repository functions with the correct parameters.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('../repository');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// --- Imports ---
import { useGroupSettingsActions } from './useGroupSettingsActions';
import { groupsRepository } from '../repository';
import { useNavigate } from 'react-router-dom';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

// --- Test Setup ---
const mockUpdateSettings = vi.mocked(groupsRepository.updateGroupSettings);
const mockDeleteGroup = vi.mocked(groupsRepository.deleteGroup);
const mockResetCounts = vi.mocked(groupsRepository.resetAllTurnCounts);
const mockNavigate = vi.fn();

const mockUser: AppUser = { uid: 'user-admin', displayName: 'Admin User', isAnonymous: false };
const mockGroup: Group = {
  gid: 'group-1', name: 'Original Name', icon: '🧪', ownerUid: 'owner',
  participants: [], turnOrder: [], participantUids: {}, adminUids: {},
};

describe('useGroupSettingsActions', () => {
  let mockSetFeedback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetFeedback = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  const renderTestHook = () => {
    const props = {
      groupId: mockGroup.gid,
      group: mockGroup,
      user: mockUser,
      setFeedback: mockSetFeedback,
    };
    return renderHook(() => useGroupSettingsActions(props));
  };

  it('should call updateGroupSettings with the new icon', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockUpdateSettings.mockResolvedValue(undefined);
    const newIcon = '🚀';

    // ACT
    await act(async () => {
      await result.current.handleUpdateGroupIcon(newIcon);
    });

    // ASSERT
    expect(mockUpdateSettings).toHaveBeenCalledWith(mockGroup.gid, {
      name: mockGroup.name, // The original name should be preserved
      icon: newIcon,
    });
    expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'Group icon updated!', severity: 'success' });
  });

  it('should call deleteGroup and navigate on success', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockDeleteGroup.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    // ASSERT
    expect(mockDeleteGroup).toHaveBeenCalledWith(mockGroup.gid);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should call resetAllTurnCounts', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockResetCounts.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.handleConfirmReset();
    });

    // ASSERT
    expect(mockResetCounts).toHaveBeenCalledWith(mockGroup.gid, mockUser);
    expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'All turn counts have been reset.', severity: 'success' });
  });

  it('should set feedback on repository failure', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    const errorMessage = 'Database error';
    mockDeleteGroup.mockRejectedValue(new Error(errorMessage));

    // ACT
    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    // ASSERT
    expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'Failed to delete group.', severity: 'error' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});