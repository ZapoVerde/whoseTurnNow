/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @stamp {"ts":"2025-10-29T02:15:00Z"}
 * @architectural-role UI Component, Orchestrator
 * @description
 * Renders the user's main dashboard, which serves as the primary entry point
 * after authentication. It displays a real-time list of the user's groups,
 * provides the UI to create new groups, and contains the main application menu
 * for accessing settings or logging out.
 * @core-principles
 * 1. IS the primary UI for displaying a user's collection of groups.
 * 2. OWNS the data subscription for the user's list of groups.
 * 3. MUST provide the primary navigation points for creating a new group and logging out.
 * @api-declaration
 *   - default: The DashboardScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [groups, isLoading, isCreateDialogOpen]
 *     external_io: firestore
 */

import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
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
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../auth/useAuthStore';
import { groupsRepository } from '../groups/repository';
import type { Group } from '../../types/group';
import { CreateGroupDialog } from '../groups/CreateGroupDialog'; // <-- UPDATED IMPORT
import { useAppBar } from '../../shared/hooks/useAppBar';
import { useMenuState } from '../groups/hooks/useMenuState';
import { useAppStatusStore } from '../../shared/store/useAppStatusStore';

const getNextParticipantName = (group: Group): string => {
  if (!group.turnOrder || group.turnOrder.length === 0) {
    return 'No one is in the group';
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

  const handleLogout = () => {
    signOut(auth);
    settingsMenu.handleClose();
  };

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
    showBackButton: false,
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
            No groups yet. Create one to get started! {/* <-- UPDATED TEXT */}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {groups.map((group) => {
              const nextParticipantId = group.turnOrder?.[0];
              const nextParticipant = group.participants.find(p => p.id === nextParticipantId);
              const isMyTurn = nextParticipant?.uid === user?.uid;

              return (
                <Card
                  key={group.gid}
                  sx={{
                    boxShadow: (theme) => theme.shadows[1],
                    border: isMyTurn
                      ? (theme) => `2px solid ${theme.palette.secondary.main}`
                      : (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => navigate(`/group/${group.gid}`)}
                      sx={{ py: 1.5, alignItems: 'center' }}
                    >
                      <Box sx={{ mr: 2, display: 'flex' }}>
                        <Typography variant="h3">{group.icon}</Typography>
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="h6">{group.name}</Typography>
                        }
                        secondary={
                          <Typography variant="body1">
                            {`Up next: ${getNextParticipantName(group)}`}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Card>
              );
            })}
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
      <CreateGroupDialog // <-- UPDATED COMPONENT
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
        <MenuItem onClick={handleLogout}>Log Out</MenuItem>
      </Menu>
    </>
  );
};