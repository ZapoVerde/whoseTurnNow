/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @stamp {"ts":"2025-10-23T11:25:00Z"}
 * @architectural-role UI Component, Orchestrator
 * @description
 * Renders the user's main dashboard and acts as an orchestrator for performance
 * optimizations. It fetches and displays the user's lists and opportunistically
 * pre-loads non-critical assets like the emoji picker to improve subsequent
 * interaction performance.
 * @core-principles
 * 1. IS the primary UI for displaying a user's collection of lists.
 * 2. MUST declaratively configure the global AppBar for its context.
 * 3. MUST orchestrate the pre-loading of non-critical, lazy-loaded assets.
 * 4. DELEGATES all data fetching to the `groupsRepository` module.
 * @api-declaration
 *   - default: The DashboardScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [groups, isLoading, isCreateDialogOpen]
 *     external_io: none
 */

import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuthStore } from '../auth/useAuthStore';
import { groupsRepository } from '../groups/repository';
import type { Group } from '../../types/group';
import { CreateListDialog } from '../groups/CreateListDialog';
import { useAppBar } from '../../shared/hooks/useAppBar';
import { useMenuState } from '../groups/hooks/useMenuState';
import { useComponentPreloader } from '../../shared/hooks/useComponentPreloader';

const preloadEmojiPicker = () => import('emoji-picker-react');

export const DashboardScreen: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const settingsMenu = useMenuState();

  useComponentPreloader([preloadEmojiPicker]);

  // --- THIS IS THE FIX ---
  // The static 'Dashboard' title is replaced with a Stack component that
  // renders the red emoji and the application's name.
  useAppBar({
    title: (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6" sx={{ color: 'error.main' }}>
          ❓
        </Typography>
        <Typography variant="h6" component="div">
          Whose Turn Now
        </Typography>
      </Stack>
    ),
    actions: (
      <IconButton color="inherit" aria-label="settings" onClick={settingsMenu.handleOpen}>
        <MoreVertIcon />
      </IconButton>
    ),
  });
  // --- END FIX ---

  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const unsubscribe = groupsRepository.getUserGroups(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <>
      <Box sx={{ width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ p: 4 }}>
            No lists yet. Create one to get started!
          </Typography>
        ) : (
          <List>
            {groups.map((group) => (
              <ListItem key={group.gid} disablePadding>
                <ListItemButton onClick={() => navigate(`/group/${group.gid}`)}>
                  <ListItemIcon>
                    <Typography variant="h6">{group.icon}</Typography>
                  </ListItemIcon>
                  <ListItemText primary={group.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
      <CreateListDialog
        open={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <Menu
        anchorEl={settingsMenu.anchorEl}
        open={settingsMenu.isOpen}
        onClose={settingsMenu.handleClose}
      >
        <MenuItem
          onClick={() => {
            navigate('/settings');
            settingsMenu.handleClose();
          }}
        >
          Settings
        </MenuItem>
      </Menu>
    </>
  );
};