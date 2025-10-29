/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx
 * @stamp {"ts":"2025-10-29T02:45:00Z"}
 * @test-target packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @description
 * Verifies the dashboard correctly displays user groups, handles navigation,
 * and orchestrates core user actions like creating a list and logging out.
 * @criticality
 * Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
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
import { signOut } from 'firebase/auth';
// --- Import router components and MainLayout ---
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '../../shared/components/layout/MainLayout';

// --- Mocks ---
// vi.mock('react-router-dom') is no longer needed, as we use the real MemoryRouter.
// We only need to mock the useNavigate hook used internally by the components.
vi.mock('react-router-dom', async () => {
    const original = await vi.importActual('react-router-dom');
    return {
        ...(original as object),
        useNavigate: vi.fn(),
    };
});
vi.mock('../auth/useAuthStore');
vi.mock('../groups/repository');
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
const mockSignOut = vi.mocked(signOut);

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

const mockGroups: Group[] = [
  { gid: 'group-1', name: 'First Group', icon: '1️⃣', ownerUid: 'owner-1', participants: [{id: 'p1', uid: 'u1', nickname: 'Alice', role: 'admin', turnCount: 1}], turnOrder: ['p1'], participantUids: { [mockUser.uid]: true }, adminUids: {} },
  { gid: 'group-2', name: 'Second Group', icon: '2️⃣', ownerUid: 'owner-2', participants: [{id: 'p2', uid: 'u2', nickname: 'Bob', role: 'member', turnCount: 2}], turnOrder: ['p2'], participantUids: { [mockUser.uid]: true }, adminUids: {} },
];

// --- Create a reusable render function ---
const renderTestComponent = () => {
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardScreen />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
};


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

    renderTestComponent(); // Use the new render function

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

    renderTestComponent(); // Use the new render function
    await act(async () => { onUpdateCallback(mockGroups); });
    
    const firstGroupButton = screen.getByText('First Group');
    await user.click(firstGroupButton);

    expect(mockNavigate).toHaveBeenCalledWith('/group/group-1');
  });

  it('should open the CreateListDialog when the FAB is clicked', async () => {
    const user = userEvent.setup();
    renderTestComponent(); // Use the new render function

    const fab = screen.getByRole('button', { name: /add/i });
    await user.click(fab);

    expect(screen.getByText('Create List Dialog Open')).toBeInTheDocument();
  });

  it('should call signOut when the logout menu item is clicked', async () => {
    const user = userEvent.setup();
    renderTestComponent(); // Use the new render function

    // The button will now be found because MainLayout is rendering the AppBar.
    const menuButton = screen.getByRole('button', { name: /Account settings/i });
    await user.click(menuButton);

    const logoutMenuItem = await screen.findByRole('menuitem', { name: /Log Out/i });
    await user.click(logoutMenuItem);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});