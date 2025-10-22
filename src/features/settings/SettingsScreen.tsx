/**
 * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
 * @stamp {"ts":"2025-10-22T02:40:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * Renders the UI for global account management, allowing users to
 * update their display name and delete their account via a high-friction flow.
 * @core-principles
 * 1. IS the primary UI for all global user account settings.
 * 2. OWNS the local UI state for the settings form and confirmation dialogs.
 * 3. DELEGATES all data mutations to the `userRepository`.
 * @api-declaration
 *   - default: The SettingsScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates # This component manages internal UI state and has side effects.
 *     state_ownership: [displayName, isSaving, isDeleting, isDeleteDialogOpen, deleteConfirmText, feedback]
 *     external_io: none # Delegates all I/O operations to the userRepository.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useAuthStore } from '../auth/useAuthStore';
import { userRepository } from '../auth/userRepository';

export const SettingsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

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
    if (!user) return; // Guard for type safety

    setIsDeleting(true);
    setFeedback(null); // Clear previous feedback
    try {
      // --- NEW LOGIC: Call the gatekeeper first ---
      const blockingGroup = await userRepository.findBlockingGroup(user.uid);

      if (blockingGroup) {
        // If a blocking group is found, show an error and stop.
        setFeedback({
          message: `Cannot delete account. You are the last admin of "${blockingGroup}". Please delete the group or promote another admin first.`,
          severity: 'error',
        });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false); // Close the dialog
        return; // Halt the function
      }
      // --- END NEW LOGIC ---

      // If the check passes, proceed with the deletion as before.
      await userRepository.deleteUserAccount();
      // On success, the useFirebaseAuthListener will automatically handle the
      // state change to 'unauthenticated', triggering a redirect.

    } catch (error) {
      console.error('Failed to delete account:', error);
      setFeedback({
        message: 'Failed to delete account. You may need to log in again first.',
        severity: 'error',
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false); // Close the dialog on failure
    }
  };

  const isDeleteButtonDisabled = deleteConfirmText !== 'DELETE';

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Account Settings
        </Typography>

        <Paper sx={{ p: 3, mt: 2 }}>
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

        <Divider sx={{ my: 4 }} />

        <Paper sx={{ p: 3, mt: 2, border: 1, borderColor: 'error.main' }}>
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
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is irreversible. It will permanently delete your account
            and all associated data. To confirm, please type{' '}
            <strong>DELETE</strong> in the box below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type DELETE to confirm"
            type="text"
            fullWidth
            variant="standard"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={isDeleting}
          />
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
            disabled={isDeleteButtonDisabled || isDeleting}
          >
            {isDeleting ? (
              <CircularProgress size={24} />
            ) : (
              'Confirm Deletion'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
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