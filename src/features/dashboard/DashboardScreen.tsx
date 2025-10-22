/**
 * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
 * @architectural-role UI Component
 * @description Renders the user's main dashboard, displaying their list of groups and providing the entry point for the list creation flow.
 * @core-principles
 * 1. IS the primary UI for displaying a user's collection of lists.
 * 2. DELEGATES all data fetching to the `groupsRepository`.
 * 3. ORCHESTRATES the presentation of the `CreateListDialog`.
 */

import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Fab,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuthStore } from '../auth/useAuthStore';
import { getUserGroups } from '../groups/groupsRepository';
import type { Group } from '../../types/group';
import { CreateListDialog } from '../groups/CreateListDialog';

export const DashboardScreen: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    setIsLoading(true);
    const unsubscribe = getUserGroups(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setIsLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <>
      <Container component="main" maxWidth="md">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4">
            My Lists
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
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
        </Box>
      </Container>
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
    </>
  );
};