/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx
 * @stamp {"ts":"2025-10-21T14:40:00Z"}
 * @architectural-role UI Component
 *
 * @description
 * Provides a suite of reusable, high-friction confirmation dialogs for
 * destructive or significant group-level administrative actions.
 *
 * @core-principles
 * 1. IS a collection of pure, presentational components.
 * 2. OWNS the UI for the confirmation prompts.
 * 3. DELEGATES the execution of the confirmed action to its parent component via callbacks.
 *
 * @api-declaration
 *   - ResetCountsConfirmationDialog: A dialog to confirm resetting all turn counts.
 *   - DeleteGroupConfirmationDialog: A dialog to confirm permanent group deletion.
 *
 * @contract
 *   assertions:
 *     purity: pure # These are presentational components controlled entirely by props.
 *     state_ownership: none # These components do not own or manage any application state.
 *     external_io: none # These components do not perform any network or file system I/O.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetCountsConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reset All Turn Counts?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This will set the turn count for every participant to zero. This action
          will be logged and cannot be undone. The current turn order will be preserved.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteGroupConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Group?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to permanently delete this group? This action
          cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};