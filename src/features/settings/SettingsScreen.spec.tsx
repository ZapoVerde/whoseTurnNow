/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx
 * @stamp {"ts":"2025-10-24T23:30:00Z"}
 * @test-target packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @description
 * Verifies the end-to-end user flow for account management,
 * ensuring that display name changes and the standard account deletion
 * process trigger the correct repository functions and gatekeeper checks.
 * @criticality
 * Critical (Reason: Security & Authentication Context)
 * @testing-layer Integration
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// --- Mocks ---
vi.mock('../auth/userRepository');
vi.mock('../auth/useAuthStore');

// --- Imports ---
import { SettingsScreen } from './SettingsScreen';
import { useAuthStore } from '../auth/useAuthStore';
import { userRepository } from '../auth/userRepository';
import type { AppUser, AuthState } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUpdateUserDisplayName = vi.mocked(userRepository.updateUserDisplayName);
const mockDeleteUserAccount = vi.mocked(userRepository.deleteUserAccount);
const mockFindBlockingGroup = vi.mocked(userRepository.findBlockingGroup);
const mockUseAuthStore = useAuthStore as unknown as Mock;

describe('SettingsScreen', () => {
  const mockUser: AppUser = {
    uid: 'user-settings-123',
    displayName: 'Old Name',
    isAnonymous: false,
  };
  const mockSetAuthenticated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthStore.mockImplementation((selector: (state: AuthState) => any) => {
      const state: AuthState = {
        user: mockUser,
        setAuthenticated: mockSetAuthenticated,
        status: 'authenticated',
        setUnauthenticated: vi.fn(),
        setNewUser: vi.fn(),
        setStatus: vi.fn(),
      };
      return selector(state);
    });

    mockUpdateUserDisplayName.mockResolvedValue(undefined);
    mockDeleteUserAccount.mockResolvedValue(undefined);
    mockFindBlockingGroup.mockResolvedValue(null);
  });

  it('should update the display name and call the store action on success', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const nameInput = screen.getByLabelText(/Global Display Name/i);
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    const newName = 'New Name For User';

    await user.clear(nameInput);
    await user.type(nameInput, newName);
    await user.click(saveButton);

    expect(await screen.findByText('Display name updated!')).toBeInTheDocument();
    expect(mockUpdateUserDisplayName).toHaveBeenCalledWith(mockUser.uid, newName);
    expect(mockSetAuthenticated).toHaveBeenCalledWith({
      ...mockUser,
      displayName: newName,
    });
  });

  it('should complete the simplified deletion flow when not blocked', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    // ACT
    // 1. Click the initial button to open the dialog.
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));

    // 2. Find and click the final confirmation button in the dialog.
    const finalConfirmButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(finalConfirmButton);

    // ASSERT
    // Verify the underlying repository functions were called correctly.
    expect(mockFindBlockingGroup).toHaveBeenCalledWith(mockUser.uid);
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });

  it('should BLOCK deletion and show a warning if the user is the last admin', async () => {
    const user = userEvent.setup();
    mockFindBlockingGroup.mockResolvedValue('Orphaned Group');
    render(<SettingsScreen />);

    // ACT
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    const finalConfirmButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(finalConfirmButton);

    // ASSERT
    const alert = await screen.findByText(/Cannot delete account. You are the last admin of "Orphaned Group"./i);
    expect(alert).toBeInTheDocument();
    expect(mockDeleteUserAccount).not.toHaveBeenCalled();
  });

  it('should display an error message if account deletion fails at the repository level', async () => {
    const user = userEvent.setup();
    mockDeleteUserAccount.mockRejectedValue(new Error('Failed to delete account.'));
    render(<SettingsScreen />);

    // ACT
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    const finalConfirmButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(finalConfirmButton);

    // ASSERT
    const alert = await screen.findByText(/Failed to delete account/i);
    expect(alert).toBeInTheDocument();
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });
});