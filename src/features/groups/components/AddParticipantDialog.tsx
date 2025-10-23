/**
 * @file packages/whoseturnnow/src/features/groups/components/AddParticipantDialog.tsx
 * @stamp {"ts":"2025-10-23T07:00:00Z"}
 * @architectural-role UI Component
 * @description
 * A modal dialog component for adding a new "Managed Participant" (placeholder)
 * to a group. It encapsulates the form logic and delegates the submission
 * action to its parent.
 * @core-principles
 * 1. IS a self-contained component for a single user action.
 * 2. OWNS the local form state for the new participant's name.
 * 3. DELEGATES the submission logic to the parent component via the `onConfirm` callback.
 * @api-declaration
 *   - default: The AddParticipantDialog React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [name]
 *     external_io: none
 */

import { useState, useEffect, type FC } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  isSubmitting: boolean;
}

export const AddParticipantDialog: FC<AddParticipantDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [name, setName] = useState('');

  // Reset name when the dialog is opened/closed
  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!name.trim()) return;
    await onConfirm(name.trim());
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Managed Participant</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="participant-name"
          label="Participant Name"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};