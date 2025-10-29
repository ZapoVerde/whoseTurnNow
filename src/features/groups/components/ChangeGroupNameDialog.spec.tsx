/**
 * @file packages/whoseturnnow/src/features/groups/components/ChangeGroupNameDialog.spec.tsx
 * @stamp {"ts":"2025-10-25T10:20:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/components/ChangeGroupNameDialog.tsx
 *
 * @description
 * Verifies the interactive behavior of the ChangeGroupNameDialog component. This
 * suite ensures that user input is correctly captured, form validation works as
 * expected, and that submitting the dialog triggers the appropriate callbacks.
 *
 * @criticality
 * Not Critical (Standard UI Component with Logic)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: none
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeGroupNameDialog } from './ChangeGroupNameDialog';

describe('ChangeGroupNameDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const currentName = 'Original Group Name';

  beforeEach(() => {
    vi.clearAllMocks();
    // THIS IS THE FIX: All fake timer logic has been removed.
  });

  const renderComponent = () => {
    render(
      <ChangeGroupNameDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isSubmitting={false}
        currentName={currentName}
      />,
    );
  };

  it('should call onConfirm with the new name and then call onClose', async () => {
    const user = userEvent.setup();
    renderComponent();
    const newName = 'Updated Group Name';
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: /Save/i });

    await user.clear(nameInput);
    await user.type(nameInput, newName);
    await user.click(saveButton);

    // Assert that onClose was called immediately.
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // THIS IS THE FIX: Use waitFor to handle the real 50ms timeout
    // from the "Close and Defer" pattern in the component.
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(newName);
    });
  });

  it('should disable the save button when input is empty or same as current name', async () => {
    const user = userEvent.setup();
    renderComponent();
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: /Save/i });

    expect(saveButton).toBeDisabled();

    await user.clear(nameInput);
    expect(saveButton).toBeDisabled();

    await user.type(nameInput, '   ');
    expect(saveButton).toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, 'A valid name');
    expect(saveButton).toBeEnabled();
  });

  it('should call onClose when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });

    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});