/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx
 * @stamp {"ts":"2025-10-22T02:40:00Z"}
 * @test-target packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @description
 * Verifies the end-to-end user flow for account management,
 * ensuring that display name changes and the high-friction account deletion
 * process trigger the correct repository functions.
 * @criticality
 * Critical (Reason: Security & Authentication Context)
 * @testing-layer Integration
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { render, screen } from '@testing-library/react'; // No longer need waitFor
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

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
      setStatus: vi.fn(),
    };
    mockUseAuthStore.mockImplementation((selector: (state: AuthState) => any) =>
      selector(mockAuthState)
    );
    mockUpdateUserDisplayName.mockResolvedValue(undefined);
    mockDeleteUserAccount.mockResolvedValue(undefined);
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
    // THE FIX: Instead of using waitFor, we await a 'findBy' query. This is the
    // recommended way to test for results of async actions. We wait for the
    // success message to appear in the snackbar.
    const successMessage = await screen.findByText('Display name updated!');
    expect(successMessage).toBeInTheDocument();

    // Because the 'findBy' query succeeded, we now know for a fact that the
    // async function completed, and we can synchronously assert on the mock calls.
    expect(mockUpdateUserDisplayName).toHaveBeenCalledWith(
      mockUser.uid,
      newName,
    );
    expect(mockAuthState.setAuthenticated).toHaveBeenCalledWith({
      ...mockUser,
      displayName: newName,
    });
  });

  // The other two tests were already passing, but we will make them more robust
  // by using findBy queries to wait for animations to settle.
  it('should complete the high-friction deletion flow and call the repository', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    await user.click(screen.getByRole('button', { name: /Delete Account/i }));

    // Use findBy to wait for the dialog to fully open
    const dialogTitle = await screen.findByText(/Are you absolutely sure/i);
    expect(dialogTitle).toBeInTheDocument();

    const finalConfirmButton = screen.getByRole('button', { name: /Confirm Deletion/i });
    expect(finalConfirmButton).toBeDisabled();

    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    expect(finalConfirmButton).toBeEnabled();

    await user.click(finalConfirmButton);

    // Use waitFor for non-DOM related async assertions
    await screen.findByRole('progressbar'); // Wait for spinner to appear
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });

  it('should display an error message if account deletion fails', async () => {
    const user = userEvent.setup();
    mockDeleteUserAccount.mockRejectedValue(new Error('Auth failed.'));
    render(<SettingsScreen />);

    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    
    // Wait for the dialog to appear before typing
    const confirmationInput = await screen.findByLabelText(/Type DELETE to confirm/i);
    await user.type(confirmationInput, 'DELETE');
    
    await user.click(screen.getByRole('button', { name: /Confirm Deletion/i }));

    const alert = await screen.findByText(/Failed to delete account/i);
    expect(alert).toBeInTheDocument();
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });
});