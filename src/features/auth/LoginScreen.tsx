/**
 * @file packages/whoseturnnow/src/features/auth/LoginScreen.tsx
 * @stamp {"ts":"2025-10-21T14:10:00Z"}
 * @architectural-role UI Component
 *
 * @description
 * Renders the primary user interface for all authentication methods, including
 * email/password, Google sign-in, and anonymous sessions. It serves as the
 * feature entry point for all unauthenticated users.
 *
 * @core-principles
 * 1. IS the feature entry point for all unauthenticated users.
 * 2. OWNS the UI state for the login and sign-up forms.
 * 3. DELEGATES all authentication logic to the external Firebase Auth service.
 *
 * @api-declaration
 *   - `LoginScreen`: The exported React functional component.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This component manages internal UI state and has side effects.
 *     state_ownership: none # It triggers auth changes but does not own global state.
 *     external_io: https_apis # It directly calls Firebase Authentication services.
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
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

export const LoginScreen: FC = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: SyntheticEvent, newValue: 'login' | 'signup') => {
    setTab(newValue);
    setError(null); // Clear errors when switching tabs
  };

  const handleAuth = async (authAction: Promise<any>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authAction;
      // On success, the AuthOrchestrator will handle the state change.
    } catch (err: any) {
      // Provide a more user-friendly error message
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
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Whose Turn Now
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', mt: 2 }}>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Log In" value="login" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleEmailPasswordSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
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
            margin="normal"
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
            sx={{ mt: 3, mb: 2, height: 40 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : tab === 'login' ? 'Log In' : 'Sign Up'}
          </Button>
        </Box>

        <Divider sx={{ width: '100%', my: 2 }}>Or</Divider>

        <Button
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
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

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
};