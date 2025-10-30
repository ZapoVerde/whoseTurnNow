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

import { useState, useEffect, useRef, type FC } from 'react';
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

  // ARCHITECTURAL FIX: This ref acts as a "gatekeeper". Its purpose is to
  // ensure that the join logic is only attempted ONCE. Unlike state, changing
  // a ref does not trigger a component re-render, which is the key to
  // breaking the infinite loop.
  const hasAttemptedJoin = useRef(false);

  useEffect(() => {
    // The guard clause now checks for three things:
    // 1. Is the user fully authenticated?
    // 2. Do we have all the necessary info?
    // 3. Have we ALREADY tried to run this logic? (The Gatekeeper)
    if (status !== 'authenticated' || !user || !groupId || hasAttemptedJoin.current) {
      return;
    }

    const joinGroup = async () => {
      // Set the gatekeeper flag to true immediately. This is the "lock" that
      // prevents the effect from ever running this logic again, even if the
      // component re-renders for any reason.
      hasAttemptedJoin.current = true;
      setIsJoining(true);
      setError(null);
      
      try {
        if (participantId) {
          await groupsRepository.claimPlaceholder(groupId, participantId, user);
        } else {
          await groupsRepository.joinGroupAsNewParticipant(groupId, user);
        }
        // On success, we navigate away. The component unmounts.
        navigate(`/group/${groupId}`, { replace: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not join the group. The link may be invalid.';
        setError(message);
        setIsJoining(false);
      }
    };

    joinGroup();
  // The dependency array is now correct and stable. It only contains external
  // dependencies. The linter is satisfied, and the loop is gone.
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

  if (status === 'initializing' || isJoining) {
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
  }

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

  // Fallback content in case the effect hasn't run yet.
  return null;
};