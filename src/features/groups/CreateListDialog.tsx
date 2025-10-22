/**
 * @file packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
 * @architectural-role UI Component
 * @description A modal component that handles the user interaction for creating a new list, capturing its name and icon.
 * @core-principles
 * 1. OWNS the UI state for the list creation form.
 * 2. MUST validate user input before proceeding.
 * 3. DELEGATES the actual data creation to the `groupsRepository`.
 */

import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { createGroup } from './groupsRepository';
import { useAuthStore } from '../auth/useAuthStore';

interface CreateListDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateListDialog: FC<CreateListDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    // Reset state on close to ensure a clean form next time
    setName('');
    setIcon('');
    onClose();
  };
  
  const handleSubmit = async () => {
    // Validation guard
    if (!name.trim() || !icon.trim() || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newGroupId = await createGroup({
        name: name.trim(),
        icon: icon.trim(),
        creator: user,
      });
      // On success, navigate to the new group's page and close the dialog
      navigate(`/group/${newGroupId}`);
      handleClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      // Here you might set an error state to display to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Create a New List</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="List Name"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <TextField
          margin="dense"
          id="icon"
          label="Emoji Icon"
          type="text"
          fullWidth
          variant="standard"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          // Basic validation for emoji length
          inputProps={{ maxLength: 2 }}
          disabled={isSubmitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || !icon.trim() || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};