/**
 * @file packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx
 * @test-target packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
 * @description Verifies that the create list dialog correctly captures user input and invokes the repository on submission, resulting in a successful navigation.
 * @criticality Critical (Reason: I/O & Concurrency Management)
 * @testing-layer Integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';

// --- Mocks ---
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
vi.mock('../auth/useAuthStore');
vi.mock('./groupsRepository');

// --- Imports ---
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/useAuthStore';
import { createGroup } from './groupsRepository';
import { CreateListDialog } from './CreateListDialog';
import type { AppUser } from '../auth/useAuthStore';

// --- Test Setup ---
const mockUseNavigate = useNavigate as Mock;
const mockUseAuthStore = useAuthStore as unknown as Mock;
const mockCreateGroup = createGroup as Mock;

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
    // FIX: Ensure the async createGroup function returns a resolved promise.
    mockCreateGroup.mockResolvedValue('new-group-id');
  });

  it('should have the Create button disabled until the form is valid', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CreateListDialog open={true} onClose={mockOnClose} />);
    const createButton = screen.getByRole('button', { name: /Create/i });
    const nameInput = screen.getByLabelText(/List Name/i);
    const iconInput = screen.getByLabelText(/Emoji Icon/i);

    // ASSERT: Initially disabled
    expect(createButton).toBeDisabled();

    // ACT: Fill in only the name
    await user.type(nameInput, 'My New List');

    // ASSERT: Still disabled
    expect(createButton).toBeDisabled();

    // ACT: Fill in the icon
    await user.type(iconInput, '🎉');

    // ASSERT: Now enabled
    expect(createButton).toBeEnabled();
  });

  it('should call createGroup with correct data and navigate on success', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<CreateListDialog open={true} onClose={mockOnClose} />);

    const createButton = screen.getByRole('button', { name: /Create/i });
    const nameInput = screen.getByLabelText(/List Name/i);
    const iconInput = screen.getByLabelText(/Emoji Icon/i);

    // ACT
    await user.type(nameInput, 'My Awesome List');
    await user.type(iconInput, '🚀');
    await user.click(createButton);

    // ASSERT
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: 'My Awesome List',
        icon: '🚀',
        creator: mockUser,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/group/new-group-id');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});