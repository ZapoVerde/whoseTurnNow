/**
 * @file packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
 * @stamp {"ts":"2025-10-23T11:45:00Z"}
 * @architectural-role UI Component
 * @description
 * A modal component for creating a new list. It now uses the "Close and Defer"
 * pattern to prevent focus-related race conditions upon submission.
 * @core-principles
 * 1. OWNS the UI state for the list creation form.
 * 2. MUST validate user input before proceeding.
 * 3. MUST deterministically manage focus by closing itself before triggering navigation.
 * @api-declaration
 *   - default: The CreateListDialog React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [name, icon, isSubmitting]
 *     external_io: none
 */

import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import { groupsRepository } from './repository';
import { useAuthStore } from '../auth/useAuthStore';
import { useMenuState } from './hooks/useMenuState';
import { EmojiPickerPopover } from '../../shared/components/EmojiPickerPopover';
import { logger } from '../../shared/utils/debug';

const DEFER_ACTION_MS = 50;

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
  const emojiPickerMenu = useMenuState();

  const handleClose = () => {
    setName('');
    setIcon('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !icon.trim() || !user) {
      return;
    }

    setIsSubmitting(true);
    // 1. Close the dialog immediately to start the unmount animation.
    handleClose();

    // 2. Defer the expensive operation to the next event loop tick.
    setTimeout(async () => {
      try {
        const newGroupId = await groupsRepository.createGroup({
          name: name.trim(),
          icon: icon.trim(),
          creator: user,
        });
        navigate(`/group/${newGroupId}`);
      } catch (error) {
        logger.error('Failed to create group:', { error });
      } finally {
        setIsSubmitting(false);
      }
    }, DEFER_ACTION_MS);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Create a New List</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <IconButton
              aria-label="select emoji icon"
              onClick={emojiPickerMenu.handleOpen}
              sx={{ border: 1, borderColor: 'divider', borderRadius: '50%', width: 56, height: 56 }}
              disabled={isSubmitting}
            >
              {icon ? (
                <Typography variant="h4">{icon}</Typography>
              ) : (
                <AddReactionIcon />
              )}
            </IconButton>
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
          </Box>
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

      <EmojiPickerPopover
        open={emojiPickerMenu.isOpen}
        anchorEl={emojiPickerMenu.anchorEl}
        onClose={emojiPickerMenu.handleClose}
        onEmojiSelect={setIcon}
      />
    </>
  );
};