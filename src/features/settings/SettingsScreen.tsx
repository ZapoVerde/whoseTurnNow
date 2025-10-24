/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @stamp {"ts":"2025-10-22T18:50:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * Renders the UI for global account management. It uses the `useAppBar` hook to
 * configure the global AppBar with a back button and the appropriate title.
 * @core-principles
 * 1. IS the primary UI for all global user account and theme settings.
 * 2. OWNS the local UI state for the settings form and confirmation dialogs.
 * 3. MUST declaratively configure the global AppBar for its context.
 * @api-declaration
 *   - default: The SettingsScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [displayName, isSaving, isDeleting, isDeleteDialogOpen, feedback]
 *     external_io: none
 */

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import GitHubIcon from '@mui/icons-material/GitHub'; // <-- ADD THIS IMPORT
import { useAuthStore } from '../auth/useAuthStore';
import { userRepository } from '../auth/userRepository';
import { ThemeControls } from '../../theme/components/ThemeControls';
import { useAppBar } from '../../shared/hooks/useAppBar';

export const SettingsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // Configure the global AppBar for this screen
  useAppBar({ title: 'Settings', showBackButton: true });

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  const handleSaveDisplayName = async () => {
    if (!user || !displayName.trim() || displayName.trim() === user.displayName) {
      return;
    }

    setIsSaving(true);
    try {
      await userRepository.updateUserDisplayName(user.uid, displayName.trim());
      const updatedUser = { ...user, displayName: displayName.trim() };
      setAuthenticated(updatedUser);
      setFeedback({ message: 'Display name updated!', severity: 'success' });
    } catch (error) {
      console.error('Failed to update display name:', error);
      setFeedback({ message: 'Failed to update name.', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userRepository.deleteUserAccount();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setFeedback({
        message: 'Failed to delete account. You may need to log in again first.',
        severity: 'error',
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Stack spacing={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveDisplayName();
            }}
          >
            <TextField
              label="Global Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              disabled={isSaving}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || displayName === user?.displayName}
              sx={{ mt: 1 }}
            >
              {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Theme Settings
          </Typography>
          <ThemeControls />
        </Paper>

        {/* --- THIS IS THE FIX --- */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            About
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            component="a"
            href="https://github.com/ZapoVerde/whoseTurnNow"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </Button>
        </Paper>
        {/* --- END FIX --- */}

        <Divider />

        <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </Paper>
      </Stack>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Your Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent and cannot be undone. All your data
            will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? (
              <CircularProgress size={24} />
            ) : (
              'Confirm Deletion'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
      >
        <Alert
          onClose={() => setFeedback(null)}
          severity={feedback?.severity}
          sx={{ width: '100%' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
};