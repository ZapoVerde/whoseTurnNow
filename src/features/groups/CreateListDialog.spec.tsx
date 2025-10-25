/**
 * @file packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx
 * @stamp {"ts":"2025-10-25T07:44:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
 * @description Verifies that the create list dialog correctly captures user input and invokes the repository on submission, resulting in a successful navigation.
 * @criticality Critical (Reason: I/O & Concurrency Management)
 * @testing-layer Integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dialog } from '@mui/material';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../auth/useAuthStore');
vi.mock('./repository');
// The mock wraps its content in a Dialog component. This ensures that
// when it's open, it exists in the same modal layer as the main CreateListDialog,
// making it accessible to testing-library's queries and avoiding the
// `aria-hidden` issue.
vi.mock('../../shared/components/EmojiPickerPopover', () => ({
  EmojiPickerPopover: ({ onEmojiSelect, open, onClose }: { onEmojiSelect: (e: string) => void, open: boolean, onClose: () => void }) => {
    if (!open) return null;
    return (
      <Dialog open={open} onClose={onClose}>
        <button
          onClick={() => {
            onEmojiSelect('🧪');
            onClose();
          }}
        >
          Mock Emoji Select
        </button>
      </Dialog>
    );
  },
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
const mockCreateGroup = vi.mocked(groupsRepository.createGroup);

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
    const user = userEvent.setup();
    render(<CreateListDialog open={true} onClose={mockOnClose} />);

    const createButton = screen.getByRole('button', { name: /Create/i });
    const nameInput = screen.getByLabelText(/List Name/i);
    const iconButton = screen.getByRole('button', { name: /select emoji icon/i });

    expect(createButton).toBeDisabled();

    await user.type(nameInput, 'My Awesome List');
    await user.click(iconButton);

    // Now this button will be found because it's in an accessible dialog
    const mockEmojiButton = await screen.findByRole('button', { name: /Mock Emoji Select/i });
    await user.click(mockEmojiButton);

    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });

    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: 'My Awesome List',
        icon: '🧪',
        creator: mockUser,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/group/new-group-id');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});