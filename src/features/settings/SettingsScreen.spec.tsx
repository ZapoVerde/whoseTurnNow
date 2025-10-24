/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx
 * @stamp {"ts":"2025-10-24T23:30:00Z"}
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

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('../auth/userRepository');

// --- Imports ---
import { SettingsScreen } from './SettingsScreen';
// THIS IS THE FIX: Import the actual store to manipulate its state.
import { useAuthStore } from '../auth/useAuthStore';
import { userRepository } from '../auth/userRepository';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUpdateUserDisplayName = vi.mocked(userRepository.updateUserDisplayName);
const mockDeleteUserAccount = vi.mocked(userRepository.deleteUserAccount);
const mockFindBlockingGroup = vi.mocked(userRepository.findBlockingGroup);

describe('SettingsScreen', () => {
  const mockUser: AppUser = {
    uid: 'user-settings-123',
    displayName: 'Old Name',
    isAnonymous: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // THIS IS THE FIX: Set the state of the actual store before each test.
    act(() => {
      useAuthStore.setState({
        user: mockUser,
        status: 'authenticated',
      });
    });

    mockUpdateUserDisplayName.mockResolvedValue(undefined);
    mockDeleteUserAccount.mockResolvedValue(undefined);
    mockFindBlockingGroup.mockResolvedValue(null);
  });

  it('should update the display name and call the store action on success', async () => {
    const user = userEvent.setup();
    // Spy on the store's action to verify it's called.
    const setAuthenticatedSpy = vi.spyOn(useAuthStore.getState(), 'setAuthenticated');
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

    await waitFor(() => {
      expect(mockUpdateUserDisplayName).toHaveBeenCalledWith(mockUser.uid, newName);
      expect(setAuthenticatedSpy).toHaveBeenCalledWith({
        ...mockUser,
        displayName: newName,
      });
    });
    setAuthenticatedSpy.mockRestore();
  });

  it('should complete the high-friction deletion flow when not blocked', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    // ACT
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    await screen.findByText(/Are you absolutely sure/i);
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    const finalConfirmButton = await screen.findByRole('button', { name: /Confirm Deletion/i });
    await user.click(finalConfirmButton);

    // ASSERT
    await waitFor(() => {
      expect(mockFindBlockingGroup).toHaveBeenCalledWith(mockUser.uid);
      expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
    });
  });

  it('should BLOCK deletion and show a warning if the user is the last admin', async () => {
    const user = userEvent.setup();
    mockFindBlockingGroup.mockResolvedValue('Orphaned Group');
    render(<SettingsScreen />);

    // ACT
    await user.click(screen.getByRole('button', { name: /Delete Account/i }));
    await screen.findByText(/Are you absolutely sure/i);
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    const finalConfirmButton = await screen.findByRole('button', { name: /Confirm Deletion/i });
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
    await screen.findByText(/Are you absolutely sure/i);
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    const finalConfirmButton = await screen.findByRole('button', { name: /Confirm Deletion/i });
    await user.click(finalConfirmButton);

    // ASSERT
    const alert = await screen.findByText(/Failed to delete account/i);
    expect(alert).toBeInTheDocument();
    
    expect(mockDeleteUserAccount).toHaveBeenCalledTimes(1);
  });
});