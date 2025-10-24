/**
 * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
 * @stamp {"ts":"2025-10-24T11:40:00Z"}
 * @architectural-role UI Component
 * @description
 * The top-level UI component for the Group Detail feature. It now configures the
 * AppBar to display a large, centered title, making it the single source of
 * truth for the group's name on this screen.
 * @core-principles
 * 1. IS a "dumb" component that primarily composes other dumb children.
 * 2. MUST delegate all business logic to its backing `useGroupDetail` hook.
 * 3. MUST configure the AppBar to display a prominent, centered title.
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

  const {
    group,
    turnLog,
    isLoading,
    isSubmitting,
    feedback,
    user,
    orderedParticipants,
    isAdmin,
    isLastAdmin,
    isUserTurn,
    undoableAction,
    currentUserParticipant,
    groupMenu,
    participantMenu,
    iconPickerMenu,
    resetDialog,
    deleteDialog,
    undoDialog,
    skipDialog,
    addParticipantDialog,
    actions,
  } = useGroupDetail(groupId);

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
        {/* --- THIS IS THE FIX --- */}
        <Typography variant="h3">{group?.icon}</Typography>
        <Typography variant="h4" component="div">
          {group?.name || 'Loading...'}
        </Typography>
        {/* --- END FIX --- */}
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
      <Box component="main" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h5">Group not found.</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box component="main" sx={{ pb: 12, pt: 2 }}>
        <ParticipantList
          participants={orderedParticipants}
          onParticipantClick={participantMenu.handleOpen}
          onInviteToClaim={actions.handleTargetedInvite}
          isAdmin={isAdmin}
          isUserTurn={isUserTurn}
        />
        <TurnHistory turnLog={turnLog} formatLogEntry={actions.formatLogEntry} />
      </Box>

      <GroupActionButtons
        isParticipant={!!currentUserParticipant}
        onTurnAction={actions.handleTurnAction}
        onUndoClick={undoDialog.handleOpen}
        onSkipClick={skipDialog.handleOpen}
        onInviteClick={actions.handleGenericInvite}
        onAddParticipantClick={addParticipantDialog.handleOpen}
        isUserTurn={isUserTurn}
        isSubmitting={isSubmitting}
        undoableAction={undoableAction}
        isAdmin={isAdmin}
      />

      <GroupManagementDialogs
        groupMenu={groupMenu}
        participantMenu={participantMenu}
        iconPickerMenu={iconPickerMenu}
        resetDialog={resetDialog}
        deleteDialog={deleteDialog}
        undoDialog={undoDialog}
        skipDialog={skipDialog}
        addParticipantDialog={addParticipantDialog}
        actions={actions}
        feedback={feedback}
        undoableAction={undoableAction}
        user={user}
        isAdmin={isAdmin}
        isLastAdmin={isLastAdmin}
      />
    </>
  );
};