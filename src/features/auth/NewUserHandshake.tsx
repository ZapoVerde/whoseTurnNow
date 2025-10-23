/**
 * @file packages/whoseturnnow/src/features/auth/NewUserHandshake.tsx
 * @architectural-role UI Component
 * @description
 * A dedicated screen that captures a new user's display name immediately after their
 * account is created. This is the "First-Time Handshake" that ensures all users
 * have a non-null display name before proceeding into the application.
 * @core-principles
 * 1. IS the single entry point for all new users after initial authentication.
 * 2. OWNS the UI and logic for creating the user's profile document in Firestore.
 * 3. MUST transition the global auth state from 'new-user' to 'authenticated' upon success.
 * @api-declaration
 *   - default: The NewUserHandshake React functional component.
 * @contract
 *   assertions:
 *     purity: mutates # This component manages its own form state and has side effects.
 *     state_ownership: [displayName, isSubmitting] # It owns the local form state.
 *     external_io: firestore # It calls the userRepository to create a document.
 */

import React, { useState } from 'react';
import { Box, Button, CircularProgress, Container, TextField, Typography } from '@mui/material';
import { useAuthStore } from './useAuthStore';
import { userRepository } from './userRepository';

export const NewUserHandshake: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { setStatus, setAuthenticated } = useAuthStore();
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
      
      // Update the store with the now-complete profile and move to the main app
      setAuthenticated(newUserProfile);
      setStatus('authenticated');
    } catch (error) {
      console.error("Failed to create user profile:", error);
      // In a real app, you might show an error message here.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Welcome!</Typography>
        <Typography sx={{ mt: 1, mb: 3 }} color="text.secondary">
          What should we call you?
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            required
            fullWidth
            autoFocus
            label="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={isSubmitting || !displayName.trim()}>
            {isSubmitting ? <CircularProgress size={24} /> : "Let's Go"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};