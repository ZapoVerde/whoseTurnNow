/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx
 * @stamp {"ts":"2025-10-22T02:42:00Z"}
 * @test-target packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @description
 * Verifies the dashboard correctly displays a list of groups, handles
 * user navigation, and orchestrates the list creation flow.
 * @criticality
 * Not Critical
 * @testing-layer Integration
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../auth/useAuthStore');
vi.mock('../groups/repository');
// Mock the dialog to verify it opens, without needing its full implementation
vi.mock('../groups/CreateListDialog', () => ({
  CreateListDialog: vi.fn(({ open }) => (open ? <div>Create List Dialog Open</div> : null)),
}));

// --- Imports ---
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore';
import { getUserGroups } from '../groups/repository';
import { DashboardScreen } from './DashboardScreen';
import type { Group } from '../../types/group';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;
const mockGetUserGroups = getUserGroups as Mock;

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroups: Group[] = [
  { gid: 'group-1', name: 'First Group', icon: '1️⃣', ownerUid: 'owner-1', participantUids: [mockUser.uid], participants: [], turnOrder: [] },
  { gid: 'group-2', name: 'Second Group', icon: '2️⃣', ownerUid: 'owner-2', participantUids: [mockUser.uid], participants: [], turnOrder: [] },
];

describe('DashboardScreen', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue(mockUser);
    // Default mock for getUserGroups to avoid hanging tests
    mockGetUserGroups.mockReturnValue(() => {});
  });

  it('should subscribe to and display the user groups', async () => {
    // ARRANGE
    // Capture the callback passed to the repository function
    let onUpdateCallback: (groups: Group[]) => void;
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdateCallback = onUpdate;
      return () => {}; // Return mock unsubscribe
    });

    render(<DashboardScreen />);

    // ACT
    // Simulate the repository sending an update from Firestore
    await act(async () => {
      onUpdateCallback(mockGroups);
    });

    // ASSERT
    // Verify that the names of the mock groups are now in the document
    expect(screen.getByText('First Group')).toBeInTheDocument();
    expect(screen.getByText('Second Group')).toBeInTheDocument();
    expect(mockGetUserGroups).toHaveBeenCalledWith(mockUser.uid, expect.any(Function));
  });

  it('should navigate to the group detail page when a group is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    let onUpdateCallback: (groups: Group[]) => void;
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdateCallback = onUpdate;
      return () => {};
    });

    render(<DashboardScreen />);

    // ACT
    // 1. Simulate the repository sending an update to render the list
    await act(async () => {
      onUpdateCallback(mockGroups);
    });

    // 2. Find and click the first group in the list
    const firstGroupButton = screen.getByText('First Group');
    await user.click(firstGroupButton);

    // ASSERT
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/group/group-1');
  });

  it('should open the CreateListDialog when the FAB is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    // Provide an empty list of groups initially
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      act(() => onUpdate([]));
      return () => {};
    });
    render(<DashboardScreen />);

    // ACT
    const fab = screen.getByRole('button', { name: /add/i });
    await user.click(fab);

    // ASSERT
    // Our mock dialog renders this text when 'open' is true
    const dialog = await screen.findByText('Create List Dialog Open');
    expect(dialog).toBeInTheDocument();
  });

  it('should navigate to /settings when the settings icon is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<DashboardScreen />);

    // ACT
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // ASSERT
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});