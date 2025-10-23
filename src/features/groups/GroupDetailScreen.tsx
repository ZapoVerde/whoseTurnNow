/**
 * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
 * @stamp {"ts":"2025-10-23T11:50:00Z"}
 * @architectural-role UI Component
 * @description
 * The top-level UI component for the Group Detail feature. It acts as a "dumb"
 * view that consumes the complete view model from the `useGroupDetail` hook and
 * renders the UI. It is also responsible for managing the `AppBar` state as a
 * side effect for its lifecycle.
 * @core-principles
 * 1. IS a "dumb" component that primarily composes other dumb children.
 * 2. MUST NOT contain any direct business logic; this is delegated to the `useGroupDetail` hook.
 * 3. OWNS the side effect of configuring the global `AppBar` for its specific context.
 * 4. MUST derive all of its rendered content from the view model provided by the `useGroupDetail` hook.
 * @api-declaration
 *   - default: The `GroupDetailScreen` React functional component.
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useGroupDetail } from './hooks/useGroupDetail';
import { useAppBar } from '../../shared/hooks/useAppBar';
import { GroupHeader } from './components/GroupHeader';
import { ParticipantList } from './components/ParticipantList';
import { AddParticipantForm } from './components/AddParticipantForm';
import { TurnHistory } from './components/TurnHistory';
import { GroupActionButtons } from './components/GroupActionButtons';
import {
  ResetCountsConfirmationDialog,
  DeleteGroupConfirmationDialog,
} from './components/GroupManagementDialogs';
import { EmojiPickerPopover } from '../../shared/components/EmojiPickerPopover';

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
    addParticipantForm,
    groupMenu,
    participantMenu,
    iconPickerMenu,
    resetDialog,
    deleteDialog,
    undoDialog,
    actions,
  } = useGroupDetail(groupId);

  const appBarActions = useMemo(() => {
    return isAdmin ? (
      <IconButton color="inherit" aria-label="Group options" onClick={groupMenu.handleOpen}>
        <MoreVertIcon />
      </IconButton>
    ) : null;
  }, [isAdmin, groupMenu.handleOpen]);

  useAppBar({
    title: group?.name || 'Loading...',
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
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go to Dashboard</Button>
      </Box>
    );
  }

  return (
    <>
      <Box component="main" sx={{ pb: 12 }}>
        <GroupHeader group={group} />
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
      </Box>

      {/* --- THIS IS THE FIX --- */}
      {/* The redundant, non-functional "Reset All Turn Counts" button that was */}
      {/* previously rendered here has been completely removed. The correct */}
      {/* implementation in the kebab menu is now the single source of truth. */}

      <GroupActionButtons
        isParticipant={!!currentUserParticipant}
        onTurnAction={actions.handleTurnAction}
        onUndoClick={undoDialog.handleOpen}
        isUserTurn={isUserTurn}
        isSubmitting={isSubmitting}
        undoableAction={undoableAction}
      />

      <Menu
        anchorEl={groupMenu.anchorEl}
        open={groupMenu.isOpen}
        onClose={groupMenu.handleClose}
      >
        <MenuItem
          onClick={(e) => {
            groupMenu.handleClose();
            iconPickerMenu.handleOpen(e);
          }}
        >
          Change Icon
        </MenuItem>
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
          {isAdmin &&
            participantMenu.selectedParticipant.uid !== user?.uid && (
              <>
                {participantMenu.selectedParticipant.role === 'member' &&
                participantMenu.selectedParticipant.uid !== null ? (
                  <MenuItem onClick={() => actions.handleRoleChange('admin')}>
                    Promote to Admin
                  </MenuItem>
                ) : participantMenu.selectedParticipant.role === 'admin' ? (
                  <MenuItem
                    onClick={() => actions.handleRoleChange('member')}
                    disabled={
                      isLastAdmin &&
                      participantMenu.selectedParticipant.role === 'admin'
                    }
                  >
                    Demote to Member
                  </MenuItem>
                ) : null}
              </>
            )}
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

      <EmojiPickerPopover
        open={iconPickerMenu.isOpen}
        anchorEl={iconPickerMenu.anchorEl}
        onClose={iconPickerMenu.handleClose}
        onEmojiSelect={actions.handleIconSelect}
      />

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
            This will reverse the turn taken by "{undoableAction?.participantName}
            ". This action will be logged. Are you sure?
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