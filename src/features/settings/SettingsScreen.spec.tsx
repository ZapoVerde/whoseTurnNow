/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx
 * @stamp {"ts":"2025-10-22T06:35:00Z"}
 * @test-target packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @description
 * Verifies the end-to-end user flow for account management,
 * ensuring that display name changes and the high-friction account deletion
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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';


// --- Mocks ---
vi.mock('../auth/useAuthStore');
vi.mock('../auth/userRepository');

// --- Imports ---
import { SettingsScreen } from './SettingsScreen';
import { useAuthStore } from '../auth/useAuthStore';
import { userRepository } from '../auth/userRepository';
import type { AppUser, AuthState } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUpdateUserDisplayName = vi.mocked(userRepository.updateUserDisplayName);
const mockDeleteUserAccount = vi.mocked(userRepository.deleteUserAccount);
const mockFindBlockingGroup = vi.mocked(userRepository.findBlockingGroup);

describe('SettingsScreen', () => {
  const mockUser: AppUser = {
    uid: 'user-settings-123',
    displayName: 'Old Name',
    isAnonymous: false,
  };

  let mockAuthState: AuthState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: mockUser,
      status: 'authenticated',
      setAuthenticated: vi.fn(),
      setUnauthenticated: vi.fn(),
      setNewUser: vi.fn(),
      setStatus: vi.fn(),
    };
    mockUseAuthStore.mockImplementation((selector: (state: AuthState) => any) =>
      selector(mockAuthState)
    );
    mockUpdateUserDisplayName.mockResolvedValue(undefined);
    mockDeleteUserAccount.mockResolvedValue(undefined);
    // Default to the non-blocking case
    mockFindBlockingGroup.mockResolvedValue(null);
  });

  it('should update the display name and call the store action on success', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);
    const nameInput = screen.getByLabelText(/Global Display Name/i);
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    const newName = 'New Name For User';

    // ACT
    await user.clear(nameInput);
    await user.type(nameInput, newName);
    await user.click(saveButton);

    // ASSERT
    const successMessage = await screen.findByText('Display name updated!');
    expect(successMessage).toBeInTheDocument();

    expect(mockUpdateUserDisplayName).toHaveBeenCalledWith(mockUser.uid, newName);
    expect(mockAuthState.setAuthenticated).toHaveBeenCalledWith({
      ...mockUser,
      displayName: newName,
    });
  });

  it('should complete the high-friction deletion flow when not blocked', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    // ACT: Open dialog
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    const dialogTitle = await screen.findByText(/Are you absolutely sure/i);
    expect(dialogTitle).toBeInTheDocument();

    // ACT: Enable button by typing
    const finalConfirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    expect(finalConfirmButton).toBeDisabled();
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    await waitFor(() => expect(finalConfirmButton).toBeEnabled());

    // ACT: Confirm deletion
    await user.click(finalConfirmButton);

    // ASSERT
    expect(mockFindBlockingGroup).toHaveBeenCalledWith(mockUser.uid);
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });

  it('should BLOCK deletion and show a warning if the user is the last admin', async () => {
    const user = userEvent.setup();
    // ARRANGE: Mock the gatekeeper to return a blocking group name
    mockFindBlockingGroup.mockResolvedValue('Orphaned Group');
    render(<SettingsScreen />);

    // ACT: Go through the whole deletion flow
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    await screen.findByText(/Are you absolutely sure/i);
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    const finalConfirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    await waitFor(() => expect(finalConfirmButton).toBeEnabled());

    await user.click(finalConfirmButton);

    // ASSERT
    const alert = await screen.findByText(/Cannot delete account. You are the last admin of "Orphaned Group"./i);
    expect(alert).toBeInTheDocument();
    
    // Crucially, verify the destructive action was never called
    expect(mockDeleteUserAccount).not.toHaveBeenCalled();
  });

  it('should display an error message if account deletion fails at the repository level', async () => {
    const user = userEvent.setup();
    // ARRANGE: Make the final step fail
    mockDeleteUserAccount.mockRejectedValue(new Error('Auth failed.'));
    render(<SettingsScreen />);

    // ACT
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    const confirmationInput = await screen.findByLabelText(/Type DELETE to confirm/i);
    await user.type(confirmationInput, 'DELETE');
    const finalConfirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    await waitFor(() => expect(finalConfirmButton).toBeEnabled());
    await user.click(finalConfirmButton);

    // ASSERT
    const alert = await screen.findByText(/Failed to delete account/i);
    expect(alert).toBeInTheDocument();
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });
});