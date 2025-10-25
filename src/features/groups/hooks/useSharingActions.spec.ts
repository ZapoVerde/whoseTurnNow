/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useSharingActions.spec.ts
 * @stamp {"ts":"2025-10-25T15:05:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/hooks/useSharingActions.ts
 *
 * @description
 * Verifies the orchestration logic of the `useSharingActions` hook. This suite
 * ensures that all sharing actions correctly construct the appropriate URLs and
 * invoke the browser's Web Share API or clipboard fallback with the correct
 * parameters.
 *
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration)
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

// --- Imports ---
import { useSharingActions } from './useSharingActions';
import type { Group } from '../../../types/group';

// --- Mocks ---
// Mock the browser's navigator object
const mockNavigatorShare = vi.fn();
const mockNavigatorClipboardWriteText = vi.fn();

Object.defineProperty(global.navigator, 'share', {
  value: mockNavigatorShare,
  writable: true,
});
Object.defineProperty(global.navigator, 'clipboard', {
  value: { writeText: mockNavigatorClipboardWriteText },
  writable: true,
});

// --- Test Setup ---
const mockGroup: Group = {
  gid: 'group-share-123',
  name: 'Sharing Test Group',
  icon: '🔗',
  ownerUid: 'owner',
  participants: [
    { id: 'p-placeholder', uid: null, role: 'member', turnCount: 0, nickname: 'Placeholder Spot' },
  ],
  turnOrder: ['p-placeholder'],
  participantUids: {},
  adminUids: {},
};

// Set a base URL for window.location.origin
const origin = 'https://whoseturnnow.test';
Object.defineProperty(window, 'location', {
  value: { origin },
  writable: true,
});


describe('useSharingActions', () => {
    let mockSetFeedback: ReturnType<typeof vi.fn>;
  
    beforeEach(() => {
      vi.clearAllMocks();
      mockSetFeedback = vi.fn();
      // Restore the navigator.share mock before each test to ensure the correct
      // implementation is available.
      Object.defineProperty(global.navigator, 'share', {
        value: mockNavigatorShare,
        writable: true,
      });
    });

  const renderTestHook = () => {
    const props = {
      groupId: mockGroup.gid,
      group: mockGroup,
      setFeedback: mockSetFeedback,
    };
    return renderHook(() => useSharingActions(props));
  };

  it('should call navigator.share for a generic invite if available', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockNavigatorShare.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      result.current.handleGenericInvite();
    });

    // ASSERT
    expect(mockNavigatorShare).toHaveBeenCalledWith({
      title: `Join my list: ${mockGroup.name}`,
      text: expect.any(String),
      url: `${origin}/join/${mockGroup.gid}`,
    });
    expect(mockNavigatorClipboardWriteText).not.toHaveBeenCalled();
  });

  it('should fall back to clipboard for a generic invite if share is not available', async () => {
    // ARRANGE
    (navigator as any).share = undefined; // Simulate no share API
    const { result } = renderTestHook();
    mockNavigatorClipboardWriteText.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      result.current.handleGenericInvite();
    });

    // ASSERT
    const expectedUrl = `${origin}/join/${mockGroup.gid}`;
    expect(mockNavigatorClipboardWriteText).toHaveBeenCalledWith(expectedUrl);
    expect(mockSetFeedback).toHaveBeenCalledWith({ message: 'Invite link copied!', severity: 'success' });
  });

  it('should call navigator.share for a targeted invite', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockNavigatorShare.mockResolvedValue(undefined);
    const participantId = 'p-placeholder';

    // ACT
    await act(async () => {
      result.current.handleTargetedInvite(participantId);
    });

    // ASSERT
    expect(mockNavigatorShare).toHaveBeenCalledWith({
      title: `Claim the 'Placeholder Spot' spot`,
      text: expect.any(String),
      url: `${origin}/join/${mockGroup.gid}?participantId=${participantId}`,
    });
  });

  it('should call navigator.share for a recovery link', async () => {
    // ARRANGE
    const { result } = renderTestHook();
    mockNavigatorShare.mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      result.current.handleRecoveryLink();
    });

    // ASSERT
    expect(mockNavigatorShare).toHaveBeenCalledWith({
      title: `Access link for: ${mockGroup.name}`,
      text: expect.any(String),
      url: `${origin}/join/${mockGroup.gid}`,
    });
  });
});