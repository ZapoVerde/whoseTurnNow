/**
 * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
 * @stamp {"ts":"2025-10-25T08:30:00Z"}
 * @architectural-role UI Component
 * @description
 * The top-level UI component for the Group Detail feature. It is a lean,
 * presentational component that delegates all logic to the `useGroupDetail` hook.
 * @core-principles
 * 1. IS a "dumb" component that primarily composes other dumb children.
 * 2. MUST delegate all business logic to its backing `useGroupDetail` hook.
 * 3. MUST use the <Stack> primitive for vertical layout as per the standard.
 * @api-declaration
 *   - default: The GroupDetailScreen React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { useMemo, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Stack from '@mui/material/Stack';
import { useGroupDetail } from './hooks/useGroupDetail';
import { useAppBar } from '../../shared/hooks/useAppBar';
import { ParticipantList } from './components/ParticipantList';
import { TurnHistory } from './components/TurnHistory';
import { GroupActionButtons } from './components/GroupActionButtons';
import { GroupManagementDialogs } from './components/GroupManagementDialogs';

export const GroupDetailScreen: FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // Single hook call to get the entire view model
  const viewModel = useGroupDetail(groupId);
  const {
    group,
    turnLog,
    isLoading,
    orderedParticipants,
    isAdmin,
    isUserTurn,
    actions,
    groupMenu,
  } = viewModel;

  const appBarActions = useMemo(() => {
    return isAdmin ? (
      <IconButton
        color="inherit"
        aria-label="Group options"
        onClick={groupMenu.handleOpen}
      >
        <MoreVertIcon />
      </IconButton>
    ) : null;
  }, [isAdmin, groupMenu.handleOpen]);

  useAppBar({
    title: (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Typography variant="h3">{group?.icon}</Typography>
        <Typography variant="h4" component="div">
          {group?.name || 'Loading...'}
        </Typography>
      </Stack>
    ),
    showBackButton: true,
    actions: appBarActions,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
        <Typography variant="h5">Group not found.</Typography>
        <Button onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={4} sx={{ pb: 12 }}>
        <Typography variant="h5" component="h2">
          Up Next
        </Typography>
        <ParticipantList
          participants={orderedParticipants}
          onParticipantClick={viewModel.participantMenu.handleOpen}
          onInviteToClaim={actions.handleTargetedInvite}
          isAdmin={isAdmin}
          isUserTurn={isUserTurn}
        />
        <TurnHistory turnLog={turnLog} formatLogEntry={actions.formatLogEntry} />
      </Stack>

      <GroupActionButtons
        isParticipant={!!viewModel.currentUserParticipant}
        onTurnAction={actions.handleTurnAction}
        onUndoClick={viewModel.undoDialog.handleOpen}
        onSkipClick={viewModel.skipDialog.handleOpen}
        onInviteClick={actions.handleGenericInvite}
        onAddParticipantClick={viewModel.addParticipantDialog.handleOpen}
        isUserTurn={isUserTurn}
        isSubmitting={viewModel.isSubmitting}
        undoableAction={viewModel.undoableAction}
        isAdmin={isAdmin}
      />

      <GroupManagementDialogs {...viewModel} />
    </>
  );
};