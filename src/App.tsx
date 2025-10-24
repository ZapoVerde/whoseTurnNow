/**
 * @file packages/whoseturnnow/src/App.tsx
 * @stamp {"ts":"2025-10-23T08:16:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The top-level React component that serves as the application's composition
 * root. It owns the primary routing logic and is responsible for initializing
 * the global authentication listener, ensuring the user's session state is
 * managed consistently across all public and private routes.
 * @core-principles
 * 1. IS the composition root for the entire React application.
 * 2. OWNS the top-level routing logic for all entry points.
 * 3. MUST initialize the application's authentication listener to ensure it is
 *    active on all routes, including public ones like the invitation screen.
 * @api-declaration
 *   - default: The App React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthStore } from './features/auth/useAuthStore';
import { useFirebaseAuthListener } from './features/auth/useFirebaseAuthListener';
import { MainLayout } from './shared/components/layout/MainLayout';
import { NewUserHandshake } from './features/auth/NewUserHandshake';

// Lazy-loaded Screen Components
const LoginScreen = React.lazy(() =>
  import('./features/auth/LoginScreen').then(module => ({ default: module.LoginScreen }))
);
const DashboardScreen = React.lazy(() =>
  import('./features/dashboard/DashboardScreen').then(module => ({ default: module.DashboardScreen }))
);
const InvitationScreen = React.lazy(() =>
  import('./features/invitations/InvitationScreen').then(module => ({ default: module.InvitationScreen }))
);
const GroupDetailScreen = React.lazy(() =>
  import('./features/groups/GroupDetailScreen').then(module => ({ default: module.GroupDetailScreen }))
);
const SettingsScreen = React.lazy(() =>
  import('./features/settings/SettingsScreen').then(module => ({ default: module.SettingsScreen }))
);

const FullScreenLoader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
);

const AuthenticatedRoutes: React.FC = () => {
  // This component now only reads the status. The listener is global.
  const authStatus = useAuthStore((state) => state.status);

  // --- DEBUG LOG ---
  console.log(`[Router] Rendering with authStatus: '${authStatus}'`);

  if (authStatus === 'initializing') {
      return <FullScreenLoader />;
  }

  if (authStatus === 'new-user') {
    return <NewUserHandshake />;
  }

  if (authStatus === 'unauthenticated') {
      // For any non-public route, render the LoginScreen
      return (
          <Routes>
              <Route path="*" element={<LoginScreen />} />
          </Routes>
      );
  }
  
  // User is fully authenticated, render the main app layout
  return (
      <Routes>
          <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/group/:groupId" element={<GroupDetailScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              {/* Redirect any other authenticated path to the dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
      </Routes>
  );
};

export const App: React.FC = () => {
  // By placing the listener here, it is mounted once at the root of the
  // application and remains active for all routes, including the public
  // /join route, which resolves the deadlock.
  useFirebaseAuthListener();

  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Public routes that are always accessible */}
          <Route path="/join/:groupId" element={<InvitationScreen />} />
          
          {/* All other routes are handled by our state-aware router */}
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};