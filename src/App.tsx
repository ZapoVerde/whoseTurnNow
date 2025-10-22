/**
 * @file packages/whoseturnnow/src/App.tsx
 * @architectural-role Orchestrator
 * @description The top-level React component that acts as the application's root router, conditionally rendering views based on authentication state and URL path.
 * @core-principles
 * 1. IS the composition root for the entire React application.
 * 2. OWNS the top-level routing logic.
 * 3. MUST correctly route parameterized URLs for invitations.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from './features/auth/useAuthStore';
import { useFirebaseAuthListener } from './features/auth/useFirebaseAuthListener';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { GroupDetailScreen } from './features/groups/GroupDetailScreen';
import { InvitationScreen } from './features/invitations/InvitationScreen';

const FullScreenLoader = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

/**
 * A private component that handles all routes and logic for an authenticated user session.
 * It is responsible for initializing the auth listener and rendering the correct
 * view (loading, login, or the main app) based on the auth state.
 */
const AuthenticatedRoutes: React.FC = () => {
  useFirebaseAuthListener();
  const authStatus = useAuthStore((state) => state.status);

  if (authStatus === 'initializing') {
    return <FullScreenLoader />;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/group/:groupId" element={<GroupDetailScreen />} />
      {/* A catch-all for authenticated users to redirect them home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public-facing invitation route */}
        <Route path="/join/:groupId" element={<InvitationScreen />} />
        {/* All other routes are handled by the authenticated logic */}
        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
};