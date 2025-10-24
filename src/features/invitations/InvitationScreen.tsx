/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @stamp {"ts":"2025-10-23T10:50:00Z"}
 * @architectural-role Feature Entry Point, Orchestrator
 * @description
 * Manages the entire user flow for accepting an invitation. It acts as a
 * self-contained orchestrator, displaying the correct onboarding UI (`LoginScreen`
 * or `NewUserHandshake`) before executing the final join action.
 * @core-principles
 * 1. OWNS the logic for parsing invitation context from the URL.
 * 2. ORCHESTRATES the full authentication and user creation UI for invitees.
 * 3. MUST wait for the user's status to be 'authenticated' before joining the group.
 * @api-declaration
 *   - URL Parameters: Consumes `groupId` from the route path (`/join/:groupId`)
 *     and an optional `participantId` from the query string.
 *   - Props: None. This is a route-level entry point.
 *   - Side Effects: Triggers database writes and redirects the user upon completion.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [groupData, isJoining, error]
 *     external_io: firestore
 */

import { useState, useEffect, type FC } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useAuthStore } from '../auth/useAuthStore';
import { LoginScreen } from '../auth/LoginScreen';
import { NewUserHandshake } from '../auth/NewUserHandshake';
import { groupsRepository } from '../groups/repository';
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

  // --- DEBUG LOG: Component mount and context ---
  useEffect(() => {
    console.log('[InvitationScreen] MOUNTED.', { groupId, participantId });
  }, [groupId, participantId]);
  
  // --- DEBUG LOG: Auth state changes ---
  useEffect(() => {
    console.log('[InvitationScreen] Auth state changed:', { status, user: user?.uid });
  }, [status, user]);

  useEffect(() => {
    if (!groupId) return;

    const fetchGroupData = async () => {
      // --- DEBUG LOG ---
      console.log('[InvitationScreen] Fetching group data...');
      try {
        const group = await groupsRepository.getGroupOnce(groupId);
        setGroupData(group);
        console.log('[InvitationScreen] Group data FETCHED.', { name: group?.name });
      } catch (err) {
        console.error('Failed to fetch group data for invitation:', err);
        setError('Could not load invitation details.');
      }
    };

    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    if (status !== 'authenticated' || !user || !groupId || isJoining || !groupData) {
      return;
    }

    if (groupData.participantUids && groupData.participantUids[user.uid]) {
      console.log('[InvitationScreen] User is already a member. Redirecting.');
      navigate(`/group/${groupId}`, { replace: true });
      return;
    }

    const joinGroup = async () => {
      setIsJoining(true);
      setError(null);
      // --- DEBUG LOG ---
      console.log('[InvitationScreen] User is authenticated. Attempting to join group...');
      try {
        if (participantId) {
          await groupsRepository.claimPlaceholder(groupId, participantId, user);
        } else {
          await groupsRepository.joinGroupAsNewParticipant(groupId, user);
        }
        console.log('[InvitationScreen] Join successful. Redirecting...');
        navigate(`/group/${groupId}`, { replace: true });
      } catch (err: any) {
        console.error('Failed to join group:', err);
        setError(
          err.message ||
            'Could not join the group. The link may be invalid or you may already be a member.',
        );
      } finally {
        setIsJoining(false);
      }
    };

    joinGroup();
  }, [status, user, groupId, participantId, navigate, isJoining, groupData]);

  if (error) {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Error
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!groupData || status === 'initializing') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const welcomeMessage = participantId
    ? `You've been invited to take over a spot in '${groupData.name}'!`
    : `You've been invited to join '${groupData.name}'!`;

  if (status === 'unauthenticated') {
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

  if (status === 'new-user') {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {welcomeMessage}
        </Typography>
        <NewUserHandshake />
      </Container>
    );
  }

  // Covers the 'authenticated' but not yet joined state.
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
        {`Joining '${groupData.name}'...`}
      </Typography>
    </Box>
  );
};