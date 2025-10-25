/**
 * @file packages/whoseturnnow/src/shared/components/layout/MainLayout.tsx
 * @stamp {"ts":"2025-10-22T18:40:00Z"}
 * @architectural-role UI Component
 * @description
 * Provides the main application shell. It renders a context-aware AppBar that
 * now also displays a "Reconnect" button when the app enters a 'degraded'
 * connection state, providing a recovery mechanism for the user.
 * @core-principles
 * 1. IS the single source of truth for the persistent application layout.
 * 2. MUST derive its AppBar's state from the `useAppBarStore`.
 * 3. MUST reflect the global connection status from `useAppStatusStore`.
 * @api-declaration
 *   - default: The MainLayout React functional component.
 *   - Global State: Subscribes to `useAppBarStore` for dynamic configuration and
 *     `useAppStatusStore` to monitor connection health.
 *   - Side Effects: Triggers a full page reload when the user attempts to reconnect.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppBarStore } from '../../store/useAppBarStore';
import { useAppStatusStore } from '../../store/useAppStatusStore';
import { logger } from '../../utils/debug';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { title, showBackButton, actions } = useAppBarStore();
  const { connectionMode, setConnectionMode } = useAppStatusStore();

  const handleReconnect = () => {
    // --- DEBUG LOG ---
    logger.log('[MainLayout] User triggered reconnect. Setting mode to "live" and reloading.');
    // Set the mode back to live optimistically before reloading.
    setConnectionMode('live');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {/* If the connection is degraded, show a reconnect button. */}
          {connectionMode === 'degraded' && (
            <Button
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={handleReconnect}
            >
              Reconnect
            </Button>
          )}

          {actions}
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth="md"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          py: 2,
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
};