/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx
 * @stamp {"ts":"2025-10-25T07:44:00Z"}
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
  Link: vi.fn(({ children, to }) => <a href={to}>{children}</a>),
}));
vi.mock('../auth/useAuthStore');
vi.mock('./repository');
vi.mock('../groups/CreateListDialog', () => ({
  CreateListDialog: vi.fn(({ open }) => (open ? <div>Create List Dialog Open</div> : null)),
}));

// --- Imports ---
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore';
import { groupsRepository } from '../groups/repository';
import { DashboardScreen } from './DashboardScreen';
import type { Group } from '../../types/group';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;
const mockGetUserGroups = vi.spyOn(groupsRepository, 'getUserGroups');

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroups: Group[] = [
  { gid: 'group-1', name: 'First Group', icon: '1️⃣', ownerUid: 'owner-1', participants: [{id: 'p1', uid: 'u1', nickname: 'Alice', role: 'admin', turnCount: 1}], turnOrder: ['p1'], participantUids: { [mockUser.uid]: true }, adminUids: {} },
  { gid: 'group-2', name: 'Second Group', icon: '2️⃣', ownerUid: 'owner-2', participants: [{id: 'p2', uid: 'u2', nickname: 'Bob', role: 'member', turnCount: 2}], turnOrder: ['p2'], participantUids: { [mockUser.uid]: true }, adminUids: {} },
];

describe('DashboardScreen', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockImplementation((selector: (state: { user: AppUser | null }) => any) => selector({ user: mockUser }));
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdate([]); // Immediately provide empty data to resolve loading state
      return () => {};
    });
  });

  it('should subscribe to and display the user groups', async () => {
    let onUpdateCallback: (groups: Group[]) => void = () => {};
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdateCallback = onUpdate;
      return () => {};
    });

    render(<DashboardScreen />);

    await act(async () => {
      onUpdateCallback(mockGroups);
    });

    expect(screen.getByText('First Group')).toBeInTheDocument();
    expect(screen.getByText('Second Group')).toBeInTheDocument();
  });

  it('should navigate to the group detail page when a group is clicked', async () => {
    const user = userEvent.setup();
    let onUpdateCallback: (groups: Group[]) => void = () => {};
    mockGetUserGroups.mockImplementation((_userId, onUpdate) => {
      onUpdateCallback = onUpdate;
      return () => {};
    });

    render(<DashboardScreen />);
    await act(async () => { onUpdateCallback(mockGroups); });
    
    const firstGroupButton = screen.getByText('First Group');
    await user.click(firstGroupButton);

    expect(mockNavigate).toHaveBeenCalledWith('/group/group-1');
  });

  it('should open the CreateListDialog when the FAB is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardScreen />);

    const fab = screen.getByRole('button', { name: /add/i });
    await user.click(fab);

    expect(screen.getByText('Create List Dialog Open')).toBeInTheDocument();
  });  
});