/**
 * @file packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx
 * @stamp {"ts":"2025-10-24T23:30:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
 * @description Verifies that the create list dialog correctly captures user input and invokes the repository on submission, resulting in a successful navigation.
 * @criticality Critical (Reason: I/O & Concurrency Management)
 * @testing-layer Integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../auth/useAuthStore');
vi.mock('./repository');
// THIS IS THE FIX: Mock the complex child component.
vi.mock('../../shared/components/EmojiPickerPopover', () => ({
  EmojiPickerPopover: ({ onEmojiSelect, open }: any) =>
    open ? (
      <button onClick={() => onEmojiSelect('🧪')}>Mock Emoji Select</button>
    ) : null,
}));

// --- Imports ---
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore';
import { groupsRepository } from './repository';
import { CreateListDialog } from './CreateListDialog';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseNavigate = vi.mocked(useNavigate);
const mockUseAuthStore = vi.mocked(useAuthStore);
const mockCreateGroup = vi.spyOn(groupsRepository, 'createGroup');

const mockUser: AppUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  isAnonymous: false,
};

describe('CreateListDialog', () => {
  const mockNavigate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue(mockUser);
    mockCreateGroup.mockResolvedValue('new-group-id');
  });

  it('should call createGroup with correct data and navigate on success', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CreateListDialog open={true} onClose={mockOnClose} />);

    const createButton = screen.getByRole('button', { name: /Create/i });
    const nameInput = screen.getByLabelText(/List Name/i);
    const iconButton = screen.getByRole('button', { name: /select emoji icon/i });

    // ASSERT PRE-CONDITION: Button is disabled.
    expect(createButton).toBeDisabled();

    // ACT: Fill out the form.
    await user.type(nameInput, 'My Awesome List');
    await user.click(iconButton); // Open the mocked picker.

    // Find and click the button inside our mock component.
    const mockEmojiButton = await screen.findByRole('button', { name: /Mock Emoji Select/i });
    await user.click(mockEmojiButton);

    // ASSERT: The button should now be enabled.
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });

    // ACT: Submit the form.
    await user.click(createButton);

    // ASSERT FINAL STATE
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledTimes(1);
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: 'My Awesome List',
        icon: '🧪',
        creator: mockUser,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/group/new-group-id');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});