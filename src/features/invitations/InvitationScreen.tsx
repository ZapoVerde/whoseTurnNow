/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @stamp {"ts":"2025-10-21T16:00:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * Manages the entire user flow for accepting an invitation, handling both
 * generic and targeted "hand-off" scenarios.
 * @core-principles
 * 1. OWNS the logic for parsing invitation context from the URL.
 * 2. ORCHESTRATES the user authentication flow for new invitees.
 * 3. DELEGATES the final data mutation for joining a group to the `groupsRepository`.
 * @api-declaration
 *   - default: The InvitationScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates # This component manages local UI state and has side effects.
 *     state_ownership: none # It subscribes to global state but does not own it.
 *     external_io: firestore # It initiates calls that result in Firestore I/O.
 */

import  { useState, useEffect, type FC } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuthStore } from '../auth/useAuthStore';
import { LoginScreen } from '../auth/LoginScreen';
import {
  joinGroupAsNewParticipant,
  claimPlaceholder,
  getGroup,
} from '../groups/groupsRepository';
import type { Group } from '../../types/group';

export const InvitationScreen: FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participantId');
  const navigate = useNavigate();

  const { user, status } = useAuthStore();

  const [groupData, setGroupData] = useState<Group | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch group details to display the name
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = getGroup(groupId, (group) => {
      setGroupData(group);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Effect to handle the joining logic once the user is authenticated
  useEffect(() => {
    if (!user || !groupId || isJoining || !groupData) {
      return;
    }

    const joinGroup = async () => {
      setIsJoining(true);
      setError(null);
      try {
        if (participantId) {
          // Targeted "Hand-off" flow
          await claimPlaceholder(groupId, participantId, user);
        } else {
          // Generic invitation flow
          await joinGroupAsNewParticipant(groupId, user);
        }
        navigate(`/group/${groupId}`, { replace: true });
      } catch (err: any) {
        console.error('Failed to join group:', err);
        setError(err.message || 'Could not join the group. The link may be invalid or you may already be a member.');
      } finally {
        setIsJoining(false);
      }
    };

    joinGroup();
  }, [user, groupId, participantId, navigate, isJoining, groupData]);

  if (error) {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Error</Typography>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (isJoining || !groupData || status === 'initializing') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          {groupData ? `Joining '${groupData.name}'...` : 'Loading invitation...'}
        </Typography>
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    const welcomeMessage = participantId
      ? `You've been invited to take over a spot in '${groupData.name}'!`
      : `You've been invited to join '${groupData.name}'!`;

    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {welcomeMessage}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          To continue, please sign in or create an account.
        </Typography>
        <LoginScreen />
      </Container>
    );
  }

  // This state should be brief as the joining effect will trigger and navigate
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};