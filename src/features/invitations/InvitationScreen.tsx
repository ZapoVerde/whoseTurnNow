/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @stamp {"ts":"2025-10-24T09:30:00Z"}
 * @architectural-role Feature Entry Point, Orchestrator
 * @description
 * Manages the invitation flow. It now correctly waits for a user to be
 * fully authenticated before attempting to add them to a group, resolving a
 * permissions-related race condition by performing the write operation
 * before any reads and then redirecting.
 * @core-principles
 * 1. OWNS the logic for parsing invitation context from the URL.
 * 2. MUST orchestrate the full authentication and user creation UI for invitees.
 * 3. MUST successfully add the user to the group before navigating to the group detail page.
 * @api-declaration
 *   - default: The InvitationScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isJoining, error]
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

export const InvitationScreen: FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participantId');
  const navigate = useNavigate();

  const { user, status } = useAuthStore();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This single, consolidated effect is the core of the solution.
  // It waits for authentication to be complete before attempting any action.
  useEffect(() => {
    // 1. Wait until the user is fully authenticated and we have a groupId.
    if (status !== 'authenticated' || !user || !groupId || isJoining) {
      return;
    }

    const joinGroup = async () => {
      setIsJoining(true);
      setError(null);
      try {
        // Step 1: Perform the WRITE operation first. This makes the user a member.
        if (participantId) {
          await groupsRepository.claimPlaceholder(groupId, participantId, user);
        } else {
          await groupsRepository.joinGroupAsNewParticipant(groupId, user);
        }
        // Step 2: On success, redirect. The destination screen is responsible for all reads.
        navigate(`/group/${groupId}`, { replace: true });
      } catch (err: any) {
        // This catch block will now correctly handle errors from the join operation itself,
        // such as trying to claim an already-claimed spot.
        setError(
          err.message || 'Could not join the group. The link may be invalid.',
        );
      } finally {
        setIsJoining(false);
      }
    };

    joinGroup();
  //}, [status, user, groupId, participantId, navigate, isJoining]);
    }, [status, user, groupId, participantId, navigate]);
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

  if (status === 'initializing') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Funnel unauthenticated users to the login screen with a generic message.
  if (status === 'unauthenticated') {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          You've been invited to join a list!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          To continue, please sign in or create an account.
        </Typography>
        <LoginScreen />
      </Container>
    );
  }

  // Funnel brand-new users to the handshake screen.
  if (status === 'new-user') {
    return (
      <Container component="main" maxWidth="xs" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          You've been invited to join a list!
        </Typography>
        <NewUserHandshake />
      </Container>
    );
  }

  // This view is shown while the join operation is in progress after authentication is complete.
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
      <Typography sx={{ mt: 2 }}>Joining list...</Typography>
    </Box>
  );
};