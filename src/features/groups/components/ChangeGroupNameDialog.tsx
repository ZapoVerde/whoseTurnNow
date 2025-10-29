/**
 * @file packages/whoseturnnow/src/features/groups/components/ChangeGroupNameDialog.tsx
 * @stamp {"ts":"2025-10-25T10:00:00Z"}
 * @architectural-role UI Component
 * @description
 * A modal dialog for an admin to change the group's name.
 * @core-principles
 * 1. IS a self-contained component for a single user action.
 * 2. OWNS the local form state for the group's new name.
 * 3. MUST use the "Close and Defer" pattern on submission.
 */

import { useState, useEffect, type FC } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const DEFER_ACTION_MS = 50;

interface ChangeGroupNameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  isSubmitting: boolean;
  currentName: string;
}

export const ChangeGroupNameDialog: FC<ChangeGroupNameDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  currentName,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleConfirm = () => {
    if (!name.trim()) return;
    onClose();
    setTimeout(() => {
      onConfirm(name.trim());
    }, DEFER_ACTION_MS);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change Group Name</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="group-name"
          label="Group Name"
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
          disabled={!name.trim() || name.trim() === currentName || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};