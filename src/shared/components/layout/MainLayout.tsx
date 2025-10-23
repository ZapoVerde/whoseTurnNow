/**
 * @file packages/whoseturnnow/src/shared/components/layout/MainLayout.tsx
 * @stamp {"ts":"2025-10-22T18:40:00Z"}
 * @architectural-role UI Component
 * @description
 * Provides the main application shell. It subscribes to the `useAppBarStore` to
 * dynamically render a context-aware AppBar with the correct title, actions,
 * and navigation controls for the currently active screen.
 * @core-principles
 * 1. IS the single source of truth for the persistent application layout.
 * 2. OWNS the rendering of the global AppBar.
 * 3. MUST derive its AppBar's state from the `useAppBarStore`.
 * @api-declaration
 *   - default: The MainLayout React functional component.
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppBarStore } from '../../store/useAppBarStore';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { title, showBackButton, actions } = useAppBarStore();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {actions}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};