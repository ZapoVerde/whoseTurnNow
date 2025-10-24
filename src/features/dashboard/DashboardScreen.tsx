/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @stamp {"ts":"2025-10-23T11:25:00Z"}
 * @architectural-role UI Component, Orchestrator
 * @description
 * Renders the user's main dashboard. It fetches and displays the user's lists
 * and provides the primary UI for creating new lists and navigating to settings,
 * while adhering to all accessibility and theming standards.
 * @core-principles
 * 1. IS the primary UI for displaying a user's collection of lists.
 * 2. MUST declaratively configure the global AppBar for its context.
 * 3. MUST provide accessible labels for all interactive controls.
 * @api-declaration
 *   - default: The DashboardScreen React functional component.
 *   - Props: None. This component is a route-level entry point.
 *   - Global State: Subscribes to `useAuthStore` to get the current user's UID for
 *     data fetching. It also dispatches configuration to the `useAppBarStore` to
 *     set the screen's title and actions.
 *   - Side Effects:
 *     - Fetches the user's groups by establishing a real-time listener via the
 *       `groupsRepository` on mount.
 *     - Triggers browser navigation to the `/group/:groupId` or `/settings`
 *       routes upon user interaction.
 *     - Manages the visibility of the `CreateListDialog` component.
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
import Card from '@mui/material/Card';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuthStore } from '../auth/useAuthStore';
import { groupsRepository } from '../groups/repository';
import type { Group } from '../../types/group';
import { CreateListDialog } from '../groups/CreateListDialog';
import { useAppBar } from '../../shared/hooks/useAppBar';
import { useMenuState } from '../groups/hooks/useMenuState';

const getNextParticipantName = (group: Group): string => {
  if (!group.turnOrder || group.turnOrder.length === 0) {
    return 'No one is in the list';
  }
  const nextParticipantId = group.turnOrder[0];
  const nextParticipant = group.participants.find(
    (p) => p.id === nextParticipantId,
  );
  return nextParticipant?.nickname || 'Unknown participant';
};

export const DashboardScreen: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const settingsMenu = useMenuState();

  useAppBar({
    title: (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6" component="div">
          Whose Turn Now
        </Typography>
        {/* The color is changed from 'error.main' to 'primary.main' for correct semantic theming. */}
        <Typography variant="h6" sx={{ color: 'primary.main' }}>
          ❓
        </Typography>
      </Stack>
    ),
    actions: (
      <IconButton color="inherit" aria-label="settings" onClick={settingsMenu.handleOpen}>
        <MoreVertIcon />
      </IconButton>
    ),
  });

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
          <Stack spacing={1}>
            {groups.map((group) => (
              <Card key={group.gid}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate(`/group/${group.gid}`)}>
                    <ListItemIcon>
                      <Typography variant="h6">{group.icon}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={group.name}
                      secondary={`Up next: ${getNextParticipantName(group)}`}
                    />
                  </ListItemButton>
                </ListItem>
              </Card>
            ))}
          </Stack>
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