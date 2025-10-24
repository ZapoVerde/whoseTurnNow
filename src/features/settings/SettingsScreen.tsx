/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @stamp {"ts":"2025-10-22T18:50:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * Renders the UI for global account management. It uses the `useAppBar` hook to
 * configure the global AppBar and adheres to all layout and accessibility standards.
 * @core-principles
 * 1. IS the primary UI for all global user account and theme settings.
 * 2. OWNS the local UI state for the settings form and confirmation dialogs.
 * 3. MUST provide a semantic `<main>` landmark for its content.
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
import GitHubIcon from '@mui/icons-material/GitHub';
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
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

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
      setFeedback({ message: 'Failed to update name.', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const blockingGroup = await userRepository.findBlockingGroup(user.uid);
      if (blockingGroup) {
        throw new Error(`Cannot delete account. You are the last admin of "${blockingGroup}". Please promote another admin or delete the group first.`);
      }
      await userRepository.deleteUserAccount();
      // On success, the auth listener will handle navigation.
    } catch (error: any) {
      setFeedback({
        message: error.message || 'Failed to delete account.',
        severity: 'error',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <>
      {/* --- THIS IS FIX #13 --- */}
      <Box component="main">
        <Stack spacing={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile
            </Typography>
            {/* --- THIS IS FIX #14 --- */}
            <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); handleSaveDisplayName(); }}>
              <TextField
                label="Global Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                variant="outlined"
                disabled={isSaving}
              />
              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSaving || displayName.trim() === (user?.displayName || '')}
                >
                  {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Stack>
            {/* --- END FIX --- */}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theme Settings
            </Typography>
            <ThemeControls />
          </Paper>

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
      </Box>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action cannot be undone. To confirm, please type <strong>DELETE</strong> in the box below.
          </DialogContentText>
          <TextField
            autoFocus
            label="Type DELETE to confirm"
            fullWidth
            variant="outlined"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={isDeleting || deleteConfirmationText !== 'DELETE'}
          >
            {isDeleting ? <CircularProgress size={24} /> : 'Confirm Deletion'}
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