/**
 * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
 * @stamp {"ts":"2025-10-21T18:06:00Z"}
 * @architectural-role UI Component
 * @description
 * The top-level UI component for the Group Detail feature. It acts as a "dumb"
 * orchestrator by invoking the `useGroupDetail` hook to manage all state and
 * logic, and then composes the various child UI components, passing them the
 * required data and callbacks from the hook.
 * @core-principles
 * 1. IS a "dumb" component that primarily composes other dumb children.
 * 2. MUST NOT contain any direct business logic or state management; this is
 *    delegated entirely to the `useGroupDetail` hook.
 * 3. OWNS the composition and layout of the feature's UI components.
 * @api-declaration
 *   - default: The GroupDetailScreen React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component is a pure function of the state provided by its hook.
 *     state_ownership: none # All state is owned by the `useGroupDetail` hook.
 *     external_io: none # All I/O is initiated by the `useGroupDetail` hook.
 */

import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  CircularProgress,
  Typography,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useGroupDetail } from './hooks/useGroupDetail';
import { GroupHeader } from './components/GroupHeader';
import { ParticipantList } from './components/ParticipantList';
import { AddParticipantForm } from './components/AddParticipantForm';
import { TurnHistory } from './components/TurnHistory';
import { GroupActionButtons } from './components/GroupActionButtons';
import {
  ResetCountsConfirmationDialog,
  DeleteGroupConfirmationDialog,
} from './components/GroupManagementDialogs';

export const GroupDetailScreen: FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const {
    group,
    turnLog,
    isLoading,
    isSubmitting,
    user,
    feedback,
    orderedParticipants,
    isAdmin,
    isLastAdmin,
    isUserTurn,
    undoableAction,
    addParticipantForm,
    groupMenu,
    participantMenu,
    resetDialog,
    deleteDialog,
    undoDialog,
    actions,
  } = useGroupDetail(groupId);

  const currentUserParticipant = user && group ? group.participants.find(p => p.uid === user.uid) : null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5">Group not found.</Typography>
      </Container>
    );
  }

  return (
    <>
      <Container component="main" maxWidth="md" sx={{ pb: 12 }}>
        <GroupHeader
          group={group}
          isAdmin={isAdmin}
          onMenuClick={groupMenu.handleOpen}
        />
        <ParticipantList
          participants={orderedParticipants}
          onParticipantClick={participantMenu.handleOpen}
        />
        {isAdmin && (
          <AddParticipantForm
            name={addParticipantForm.name}
            setName={addParticipantForm.setName}
            handleSubmit={addParticipantForm.handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        <TurnHistory turnLog={turnLog} formatLogEntry={actions.formatLogEntry} />
      </Container>

      <GroupActionButtons
        isParticipant={!!currentUserParticipant}
        onTurnAction={actions.handleTurnAction}
        onUndoClick={undoDialog.handleOpen}
        isUserTurn={isUserTurn}
        isSubmitting={isSubmitting}
        undoableAction={undoableAction}
      />

      {/* Menus, Dialogs, and Snackbar are controlled by the hook's composed objects */}
      <Menu
        anchorEl={groupMenu.anchorEl}
        open={groupMenu.isOpen}
        onClose={groupMenu.handleClose}
      >
        <MenuItem onClick={actions.handleCopyGenericLink}>Invite</MenuItem>
        <MenuItem onClick={resetDialog.handleOpen}>Reset All Turn Counts</MenuItem>
        <MenuItem onClick={deleteDialog.handleOpen}>Delete Group</MenuItem>
      </Menu>

      {participantMenu.selectedParticipant && (
        <Menu
          anchorEl={participantMenu.anchorEl}
          open={participantMenu.isOpen}
          onClose={participantMenu.handleClose}
        >
          {isAdmin && participantMenu.selectedParticipant.uid === null && (
            <MenuItem onClick={actions.handleCopyClaimLink}>
              Invite to Claim Spot
            </MenuItem>
          )}
          {isAdmin && participantMenu.selectedParticipant.uid !== user?.uid &&
            (participantMenu.selectedParticipant.role === 'member' ? (
              <MenuItem onClick={() => actions.handleRoleChange('admin')}>
                Promote to Admin
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() => actions.handleRoleChange('member')}
                disabled={isLastAdmin && participantMenu.selectedParticipant.role === 'admin'}
              >
                Demote to Member
              </MenuItem>
            ))}
          {isAdmin && participantMenu.selectedParticipant.uid !== user?.uid && (
            <MenuItem onClick={actions.handleRemoveParticipant}>
              Remove Participant
            </MenuItem>
          )}
          {participantMenu.selectedParticipant.uid === user?.uid && (
            <MenuItem onClick={actions.handleLeaveGroup} disabled={isLastAdmin}>
              Leave Group
            </MenuItem>
          )}
        </Menu>
      )}

      <ResetCountsConfirmationDialog
        open={resetDialog.isOpen}
        onClose={resetDialog.handleClose}
        onConfirm={resetDialog.handleConfirm}
      />
      <DeleteGroupConfirmationDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.handleClose}
        onConfirm={deleteDialog.handleConfirm}
      />
      <Dialog open={undoDialog.isOpen} onClose={undoDialog.handleClose}>
        <DialogTitle>Undo Last Turn?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reverse the turn taken by "{undoableAction?.participantName}". This action will be logged. Are you sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={undoDialog.handleClose}>Cancel</Button>
          <Button onClick={undoDialog.handleConfirm} variant="contained" autoFocus>
            Confirm Undo
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => actions.setFeedback(null)}
      >
        <Alert
          onClose={() => actions.setFeedback(null)}
          severity={feedback?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
};