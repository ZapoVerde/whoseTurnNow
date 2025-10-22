/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.spec.tsx
 * @test-target packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @description Verifies the end-to-end invitation acceptance flow, ensuring users are correctly added to groups for both generic and targeted links.
 * @criticality Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
 * @testing-layer Integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';

// --- Mocks ---
vi.mock('react-router-dom', async () => {
  const original = await vi.importActual('react-router-dom');
  return {
    ...(original as any),
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});
vi.mock('../auth/useAuthStore');
vi.mock('../groups/groupsRepository');
vi.mock('../auth/LoginScreen', () => ({
  LoginScreen: vi.fn(() => <div>Login Screen Mock</div>),
}));

// --- Imports ---
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { InvitationScreen } from './InvitationScreen';
import { useAuthStore } from '../auth/useAuthStore';
import {
  joinGroupAsNewParticipant,
  claimPlaceholder,
  getGroup,
} from '../groups/groupsRepository';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseParams = useParams as Mock;
const mockUseSearchParams = useSearchParams as Mock;
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;

// FIX: Use the vi.mocked() helper to get a correctly typed mock object.
const mockJoinGroup = vi.mocked(joinGroupAsNewParticipant);
const mockClaimPlaceholder = vi.mocked(claimPlaceholder);
const mockGetGroup = vi.mocked(getGroup);

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroupData = {
  gid: 'group-abc',
  name: 'Test Group Name',
  icon: '🧪',
  ownerUid: 'owner',
  participants: [],
  turnOrder: [],
  participantUids: [],
};

describe('InvitationScreen', () => {
  const mockNavigateFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigateFn);

    // FIX: Apply mockImplementation to the correctly referenced mock variable.
    mockGetGroup.mockImplementation((_groupId, onUpdate) => {
      onUpdate(mockGroupData);
      return () => {}; // Return mock unsubscribe
    });

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
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]); // No participantId

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    await waitFor(() => {
      expect(mockJoinGroup).toHaveBeenCalledTimes(1);
      expect(mockJoinGroup).toHaveBeenCalledWith('group-abc', mockUser);
      expect(mockClaimPlaceholder).not.toHaveBeenCalled();
      expect(mockNavigateFn).toHaveBeenCalledWith('/group/group-abc', { replace: true });
    });
  });

  it('should call claimPlaceholder for a targeted invitation', async () => {
    // ARRANGE
    mockUseAuthStore.mockReturnValue({ status: 'authenticated', user: mockUser });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('participantId=p-xyz')]); // Has participantId

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    await waitFor(() => {
      expect(mockClaimPlaceholder).toHaveBeenCalledTimes(1);
      expect(mockClaimPlaceholder).toHaveBeenCalledWith('group-abc', 'p-xyz', mockUser);
      expect(mockJoinGroup).not.toHaveBeenCalled(); // Ensure the other path wasn't taken
      expect(mockNavigateFn).toHaveBeenCalledWith('/group/group-abc', { replace: true });
    });
  });

  it('should display an error if the repository call fails', async () => {
    // ARRANGE
    const errorMessage = 'Test repository error';
    mockClaimPlaceholder.mockRejectedValue(new Error(errorMessage)); // Make the repository fail
    mockUseAuthStore.mockReturnValue({ status: 'authenticated', user: mockUser });
    mockUseParams.mockReturnValue({ groupId: 'group-abc' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('participantId=p-xyz')]);

    // ACT
    render(<InvitationScreen />);

    // ASSERT
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(errorMessage);
    expect(mockNavigateFn).not.toHaveBeenCalled(); // Should not navigate on failure
  });
});