/**
 * @file packages/whoseturnnow/src/App.tsx
 * @stamp {"ts":"2025-10-22T18:10:00Z"}
 * @architectural-role Orchestrator
 * @description
 * The top-level React component that acts as the application's root router.
 * It uses a layout route to provide a persistent UI shell (`MainLayout`) for all
 * authenticated screens, ensuring consistent navigation.
 * @core-principles
 * 1. IS the composition root for the entire React application.
 * 2. OWNS the top-level routing logic.
 * 3. DELEGATES the persistent UI shell to the `MainLayout` component.
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
import { useRoutePreloader } from './shared/hooks/useRoutePreloader';
import { MainLayout } from './shared/components/layout/MainLayout'; // Import the new layout
import { NewUserHandshake } from './features/auth/NewUserHandshake';

// --- Lazy-loaded Screen Components ---
const LoginScreen = React.lazy(() =>
  import('./features/auth/LoginScreen').then(module => ({ default: module.LoginScreen }))
);
const DashboardScreen = React.lazy(() =>
  import('./features/dashboard/DashboardScreen').then(module => ({ default: module.DashboardScreen }))
);
const InvitationScreen = React.lazy(() =>
  import('./features/invitations/InvitationScreen').then(module => ({ default: module.InvitationScreen }))
);

const loadGroupDetail = () => import('./features/groups/GroupDetailScreen');
const loadSettings = () => import('./features/settings/SettingsScreen');

const GroupDetailScreen = React.lazy(() =>
  loadGroupDetail().then(module => ({ default: module.GroupDetailScreen }))
);
const SettingsScreen = React.lazy(() =>
  loadSettings().then(module => ({ default: module.SettingsScreen }))
);

const FullScreenLoader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
);

const AuthenticatedRoutes: React.FC = () => {
  useFirebaseAuthListener();
  const authStatus = useAuthStore((state) => state.status);

  const routesToPreload = [loadGroupDetail, loadSettings];
  useRoutePreloader(routesToPreload);

  if (authStatus === 'initializing') {
      return <FullScreenLoader />;
  }

  // --- THIS IS THE NEW LOGIC ---
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
  
  // This now only runs for 'authenticated' status
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