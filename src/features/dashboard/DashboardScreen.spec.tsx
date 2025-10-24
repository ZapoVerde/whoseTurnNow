/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx
 * @stamp {"ts":"2025-10-24T10:25:00Z"}
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

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  Link: vi.fn(({ children }) => children), // Mock Link for simplicity
}));
vi.mock('../auth/useAuthStore');
vi.mock('../groups/repository');
vi.mock('../groups/CreateListDialog', () => ({
  CreateListDialog: vi.fn(({ open }) => (open ? <div>Create List Dialog Open</div> : null)),
}));

// --- Imports ---
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore';
// FIX #1: Import the repository facade object, not the named function.
import { groupsRepository } from '../groups/repository';
import { DashboardScreen } from './DashboardScreen';
import type { Group } from '../../types/group';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;
// FIX #1 (cont.): Spy on the method of the imported object.
const mockGetUserGroups = vi.spyOn(groupsRepository, 'getUserGroups');

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroups: Group[] = [
  // FIX #2: Correct the data structure for `participantUids` and `adminUids`.
  { gid: 'group-1', name: 'First Group', icon: '1️⃣', ownerUid: 'owner-1', participants: [], turnOrder: [], participantUids: { [mockUser.uid]: true }, adminUids: {} },
  { gid: 'group-2', name: 'Second Group', icon: '2️⃣', ownerUid: 'owner-2', participants: [], turnOrder: [], participantUids: { [mockUser.uid]: true }, adminUids: {} },
];

describe('DashboardScreen', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue(mockUser);
    mockGetUserGroups.mockImplementation((_userId, _onUpdate) => {
      // Provide a default implementation that does nothing but returns an unsubscribe function.
      return () => {};
    });
  });

  it('should subscribe to and display the user groups', async () => {
    // ARRANGE
    let onUpdateCallback: (groups: Group[]) => void;
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdateCallback = onUpdate;
      return () => {};
    });

    render(<DashboardScreen />);

    // ACT
    await act(async () => {
      onUpdateCallback(mockGroups);
    });

    // ASSERT
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
    await act(async () => {
      onUpdateCallback(mockGroups);
    });
    const firstGroupButton = screen.getByText('First Group');
    await user.click(firstGroupButton);

    // ASSERT
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/group/group-1');
  });

  it('should open the CreateListDialog when the FAB is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      act(() => onUpdate([]));
      return () => {};
    });
    render(<DashboardScreen />);

    // ACT
    const fab = screen.getByRole('button', { name: /add/i });
    await user.click(fab);

    // ASSERT
    const dialog = await screen.findByText('Create List Dialog Open');
    expect(dialog).toBeInTheDocument();
  });

  it('should navigate to /settings when the settings icon is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<DashboardScreen />);
    
    // ACT
    // The settings button is now inside a "More" menu
    const menuButton = screen.getByRole('button', { name: /Account settings/i });
    await user.click(menuButton);
    const settingsMenuItem = await screen.findByRole('menuitem', { name: /Settings/i });
    await user.click(settingsMenuItem);

    // ASSERT
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});