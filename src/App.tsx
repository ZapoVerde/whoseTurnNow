/**
 * @file packages/whoseturnnow/src/App.tsx
 * @stamp {"ts":"2025-10-29T04:00:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The top-level React component. It owns the primary routing logic, initializes
 * the global authentication listener, and now also manages a "wake up" trigger
 * to gracefully re-sync data when the app becomes visible on mobile devices.
 * @core-principles
 * 1. IS the composition root for the entire React application.
 * 2. OWNS the top-level routing and authentication lifecycle.
 * 3. MUST attempt to recover from a stale data state when the tab is re-focused.
 * @api-declaration
 *   - default: The App React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthStore } from './features/auth/useAuthStore';
import { useFirebaseAuthListener } from './features/auth/useFirebaseAuthListener';
import { MainLayout } from './shared/components/layout/MainLayout';
import { NewUserHandshake } from './features/auth/NewUserHandshake';
import { useGroupStore } from './features/groups/useGroupStore';
import { logger } from './shared/utils/debug';

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
  const authStatus = useAuthStore((state) => state.status);

  if (authStatus === 'initializing') {
      return <FullScreenLoader />;
  }

  if (authStatus === 'new-user') {
    return <NewUserHandshake />;
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
          <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/group/:groupId" element={<GroupDetailScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
      </Routes>
  );
};

export const App: React.FC = () => {
  useFirebaseAuthListener();

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Check if the page has become visible again after being hidden.
      if (document.visibilityState === 'visible') {
        logger.info('[App] Tab became visible. Checking for stale data...');
        
        // Get the current state from the group store without subscribing.
        const { group, loadGroupAndLog } = useGroupStore.getState();

        // If a group is currently loaded, it means we are on a detail page.
        // Re-trigger the data loading to tear down old listeners and create
        // fresh ones, ensuring we get the latest state.
        if (group?.gid) {
          logger.info('[App] Active group found. Forcing data re-sync.');
          loadGroupAndLog(group.gid);
        }
      }
    };

    // Subscribe to the browser's visibility change event.
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up the event listener when the App component unmounts.
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // The empty dependency array ensures this runs only once on mount.


  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/join/:groupId" element={<InvitationScreen />} />
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};