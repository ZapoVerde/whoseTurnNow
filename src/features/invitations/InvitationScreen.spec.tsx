/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.spec.tsx
 * @stamp {"ts":"2025-10-23T10:40:00Z"}
 * @test-target packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @description
 * Verifies the end-to-end invitation acceptance flow, ensuring users are
 * correctly added to groups for both generic and targeted links.
 * @criticality
 * Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
 * @testing-layer Integration
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: none
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Mock } from 'vitest';

// --- Mocks ---
vi.mock('react-router-dom', async () => {
  const original = await vi.importActual('react-router-dom');
  return {
    ...(original as object),
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});
vi.mock('../auth/useAuthStore');
// --- FIX: Update the mock path ---
vi.mock('../groups/repository');
vi.mock('../auth/LoginScreen', () => ({
  LoginScreen: vi.fn(() => <div>Login Screen Mock</div>),
}));

// --- Imports ---
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { InvitationScreen } from './InvitationScreen';
import { useAuthStore } from '../auth/useAuthStore';
// --- FIX: Import the unified repository object ---
import { groupsRepository } from '../groups/repository';
import type { AppUser } from '../auth/useAuthStore';
import type { Group } from '../../types/group';

// --- Test Setup ---
const mockUseParams = useParams as Mock;
const mockUseSearchParams = useSearchParams as Mock;
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as Mock;

// --- FIX: Get typed mocks from the repository object ---
const mockJoinGroup = vi.mocked(groupsRepository.joinGroupAsNewParticipant);
const mockClaimPlaceholder = vi.mocked(groupsRepository.claimPlaceholder);
const mockGetGroupOnce = vi.mocked(groupsRepository.getGroupOnce);

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroupData: Group = {
  gid: 'group-abc',
  name: 'Test Group Name',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [],
  turnOrder: [],
  participantUids: {},
  adminUids: {},
};

describe('InvitationScreen', () => {
  const mockNavigateFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigateFn);

    // --- FIX: Mock getGroupOnce with a resolved promise ---
    mockGetGroupOnce.mockResolvedValue(mockGroupData);

    mockJoinGroup.mockResolvedValue(undefined);
    mockClaimPlaceholder.mockResolvedValue(undefined);
  });

  it('should show the LoginScreen when the user is not logged in', () => {
    // ARRANGE
    mockUseAuthStore.mockReturnValue({ status: 'unauthenticated', user: null });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    expect(screen.getByText('Login Screen Mock')).toBeInTheDocument();
    expect(
      screen.getByText(/To continue, please sign in or create an account./i),
    ).toBeInTheDocument();
  });

  it('should call joinGroupAsNewParticipant for a generic invitation', async () => {
    // ARRANGE
    mockUseAuthStore.mockReturnValue({ status: 'authenticated', user: mockUser });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    await waitFor(() => {
      expect(mockJoinGroup).toHaveBeenCalledTimes(1);
      expect(mockJoinGroup).toHaveBeenCalledWith('group-abc', mockUser);
      expect(mockClaimPlaceholder).not.toHaveBeenCalled();
      expect(mockNavigateFn).toHaveBeenCalledWith('/group/group-abc', {
        replace: true,
      });
    });
  });

  it('should call claimPlaceholder for a targeted invitation', async () => {
    // ARRANGE
    mockUseAuthStore.mockReturnValue({ status: 'authenticated', user: mockUser });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('participantId=p-xyz'),
    ]);

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    await waitFor(() => {
      expect(mockClaimPlaceholder).toHaveBeenCalledTimes(1);
      expect(mockClaimPlaceholder).toHaveBeenCalledWith(
        'group-abc',
        'p-xyz',
        mockUser,
      );
      expect(mockJoinGroup).not.toHaveBeenCalled();
      expect(mockNavigateFn).toHaveBeenCalledWith('/group/group-abc', {
        replace: true,
      });
    });
  });

  it('should display an error if the repository call fails', async () => {
    // ARRANGE
    const errorMessage = 'Test repository error';
    mockClaimPlaceholder.mockRejectedValue(new Error(errorMessage));
    mockUseAuthStore.mockReturnValue({ status: 'authenticated', user: mockUser });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('participantId=p-xyz'),
    ]);

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(errorMessage);
    expect(mockNavigateFn).not.toHaveBeenCalled();
  });
});