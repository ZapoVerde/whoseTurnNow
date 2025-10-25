/**
 * @file packages/whoseturnnow/src/features/auth/NewUserHandshake.tsx
 * @architectural-role UI Component
 * @description
 * A dedicated screen that captures a new user's display name immediately after their
 * account is created. Its layout is compliant with the Zero-Taste Standard.
 * @core-principles
 * 1. IS the single entry point for all new users after initial authentication.
 * 2. OWNS the UI and logic for creating the user's profile document in Firestore.
 * 3. MUST transition the global auth state from 'new-user' to 'authenticated' upon success.
 * @api-declaration
 *   - default: The NewUserHandshake React functional component.
 *   - Props: None. This is a self-contained feature screen.
 *   - Side Effects: Creates a user profile via the `userRepository` and updates
 *     the global `useAuthStore` upon successful submission.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [displayName, isSubmitting]
 *     external_io: firestore
 */

import React, { useState } from 'react';
import { Box, Button, CircularProgress, Container, TextField, Typography, Stack } from '@mui/material';
import { useAuthStore } from './useAuthStore';
import { userRepository } from './userRepository';

export const NewUserHandshake: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { setAuthenticated } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    try {
      const newUserProfile = { ...user, displayName: displayName.trim() };
      await userRepository.createUserProfile(newUserProfile);
      
      setAuthenticated(newUserProfile);
    } catch (error) {
      logger.error("Failed to create user profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      {/* The root Box has been replaced with a Stack. */}
      {/* All manual margins on children have been removed and are now controlled by the `spacing` prop. */}
      <Stack sx={{ mt: 8, alignItems: 'center' }} spacing={2}>
        <Typography component="h1" variant="h5">Welcome!</Typography>
        <Typography color="text.secondary">
          What should we call you?
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              autoFocus
              label="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="submit" fullWidth variant="contained" disabled={isSubmitting || !displayName.trim()}>
              {isSubmitting ? <CircularProgress size={24} /> : "Let's Go"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};