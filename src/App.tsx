/**
 * @file packages/whoseturnnow/src/App.tsx
 * @stamp {"ts":"2025-10-22T02:45:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The top-level React component that acts as the application's
 * root router, conditionally rendering views based on auth state and URL path.
 * @core-principles
 * 1. IS the composition root for the entire React application.
 * 2. OWNS the top-level routing logic for all authenticated and public routes.
 * 3. MUST NOT contain feature-specific business logic.
 * @api-declaration
 *   - default: The App React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component is a pure function of the state provided by its hooks.
 *     state_ownership: none # All state is owned by the useAuthStore and managed by hooks.
 *     external_io: none # All I/O is initiated by child components or hooks.
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
import { SettingsScreen } from './features/settings/SettingsScreen';

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
      <Route path="/settings" element={<SettingsScreen />} />
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