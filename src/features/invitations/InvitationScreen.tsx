// ----- packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx -----
/**
 * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
 * @stamp {"ts":"2025-10-23T10:50:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * Manages the entire user flow for accepting an invitation, handling both
 * generic and targeted "hand-off" scenarios.
 * @core-principles
 * 1. OWNS the logic for parsing invitation context from the URL.
 * 2. ORCHESTRATES the user authentication flow for new invitees.
 * 3. DELEGATES the final data mutation for joining a group to the `groupsRepository` module.
 * @api-declaration
 *   - default: The InvitationScreen React functional component.
 * @contract
 *   assertions:
 *     purity: mutates # This component manages local UI state and has side effects.
 *     state_ownership: none # It subscribes to global state but does not own it.
 *     external_io: firestore # It initiates calls that result in Firestore I/O.
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

  useEffect(() => {
    if (!groupId) return;

    const fetchGroupData = async () => {
      try {
        const group = await groupsRepository.getGroupOnce(groupId);
        setGroupData(group);
      } catch (err) {
        console.error('Failed to fetch group data for invitation:', err);
        setError('Could not load invitation details.');
      }
    };

    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    if (!user || !groupId || isJoining || !groupData) {
      return;
    }

    // --- THIS IS THE FIX ---
    // Before attempting to join, check if the user is already a member.
    // The `participantUids` map is the most efficient way to do this.
    if (groupData.participantUids && groupData.participantUids[user.uid]) {
      // If they are, just redirect them to the group.
      navigate(`/group/${groupId}`, { replace: true });
      return; // Stop the effect immediately.
    }
    // --- END FIX ---

    const joinGroup = async () => {
      setIsJoining(true);
      setError(null);
      try {
        if (participantId) {
          await groupsRepository.claimPlaceholder(groupId, participantId, user);
        } else {
          await groupsRepository.joinGroupAsNewParticipant(groupId, user);
        }
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
  }, [user, groupId, participantId, navigate, isJoining, groupData]);

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