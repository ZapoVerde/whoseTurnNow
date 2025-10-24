/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @stamp {"ts":"2025-10-24T08:16:00Z"}
 * @architectural-role UI Component, Orchestrator
 * @description
 * Renders the user's main dashboard. It explicitly configures the AppBar to
 * hide the back button, establishing itself as a top-level screen. The layout
 * has been enhanced for better readability and visual weight.
 * @core-principles
 * 1. IS the primary UI for displaying a user's collection of lists.
 * 2. MUST re-establish its data subscription when the connection mode transitions to 'live'.
 * 3. MUST explicitly set `showBackButton: false` in its AppBar configuration.
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
import { useAppStatusStore } from '../../shared/store/useAppStatusStore';

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
  const connectionMode = useAppStatusStore((state) => state.connectionMode);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const settingsMenu = useMenuState();

  useAppBar({
    title: (
      <Stack direction="row" alignItems="center">
        <Typography variant="h6" component="div">
          Whose Turn Now
        </Typography>
        <Typography variant="h6" sx={{ color: 'secondary.main', ml: 0.5 }}>
          ❓
        </Typography>        
      </Stack>
    ),
    // --- THIS IS FIX #1: Explicitly hide the back button ---
    showBackButton: false,
    // --- END FIX ---
    actions: (
      <IconButton color="inherit" aria-label="Account settings" onClick={settingsMenu.handleOpen}>
        <MoreVertIcon />
      </IconButton>
    ),
  });

  useEffect(() => {
    if (!user?.uid || connectionMode === 'degraded') {
      return;
    }

    setIsLoading(true);
    const unsubscribe = groupsRepository.getUserGroups(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, connectionMode]);

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
                  {/* --- THIS IS FIX #2: Enhance layout --- */}
                  <ListItemButton 
                    onClick={() => navigate(`/group/${group.gid}`)}
                    sx={{ py: 1.5 }} // Increase vertical padding
                  >
                    <ListItemIcon>
                      <Typography variant="h5">{group.icon}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={group.name}
                      secondary={`Up next: ${getNextParticipantName(group)}`}
                      primaryTypographyProps={{ variant: 'h6' }} // Make title larger
                      secondaryTypographyProps={{ variant: 'body1' }} // Make subtitle larger
                    />
                  </ListItemButton>
                   {/* --- END FIX --- */}
                </ListItem>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
      <Fab
        color="secondary"
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