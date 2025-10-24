/**
 * @file packages/whoseturnnow/src/features/auth/LoginScreen.tsx
 * @stamp {"ts":"2025-10-21T14:10:00Z"}
 * @architectural-role UI Component
 *
 * @description
 * Renders the primary user interface for all authentication methods, including
 * email/password, Google sign-in, and anonymous sessions. Its layout is
 * constructed in compliance with the Zero-Taste Layout Standard.
 *
 * @core-principles
 * 1. IS the feature entry point for all unauthenticated users.
 * 2. OWNS the UI state for the login and sign-up forms.
 * 3. DELEGATES all authentication logic to the external Firebase Auth service.
 *
 * @api-declaration
 *   - default: The LoginScreen React functional component.
 *   - Props: None. This is a self-contained feature screen.
 *   - Side Effects: Initiates authentication requests to the external Firebase
 *     Auth service upon user interaction.
 *
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [tab, email, password, isSubmitting, error]
 *     external_io: https_apis
 */

import React, { useState, type FC, type SyntheticEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

export const LoginScreen: FC = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: SyntheticEvent, newValue: 'login' | 'signup') => {
    setTab(newValue);
    setError(null);
  };

  const handleAuth = async (authAction: Promise<any>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authAction;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') {
      handleAuth(signInWithEmailAndPassword(auth, email, password));
    } else {
      handleAuth(createUserWithEmailAndPassword(auth, email, password));
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    handleAuth(signInWithPopup(auth, provider));
  };

  const handleAnonymousSignIn = () => {
    handleAuth(signInAnonymously(auth));
  };

  return (
    <Container component="main" maxWidth="xs">
      {/* The outer Box is replaced with a Stack to manage vertical spacing. */}
      {/* All hardcoded margins (`mt`, `my`) are removed from the children. */}
      <Stack sx={{ mt: 8, alignItems: 'center' }} spacing={2}>
        <Typography component="h1" variant="h5">
          Whose Turn Now
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Log In" value="login" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleEmailPasswordSubmit} sx={{ width: '100%' }}>
          {/* An inner Stack is used for the form fields. */}
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : tab === 'login' ? 'Log In' : 'Sign Up'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ width: '100%' }}>Or</Divider>
        {/* Another Stack for the social/anonymous login buttons. */}
        <Stack spacing={2} sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            Sign in with Google
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={handleAnonymousSignIn}
            disabled={isSubmitting}
          >
            Continue Anonymously
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
      </Stack>
    </Container>
  );
};