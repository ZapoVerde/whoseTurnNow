/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx
 * @stamp {"ts":"2025-10-25T11:25:00Z"}
 * @architectural-role UI Component
 * @description
 * A composite "UI Kit" component that encapsulates all dialogs, menus, and
 * popovers for the Group Detail feature, serving as a pure, presentational
 * layer controlled entirely by its parent.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST receive all its state and handlers via props.
 * 3. OWNS the JSX for all modals, menus, and snackbars for the feature.
 * @api-declaration
 *   - default: The GroupManagementDialogs React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { AddParticipantDialog } from './AddParticipantDialog';
import { ChangeGroupNameDialog } from './ChangeGroupNameDialog'; // Import the new dialog
import { EmojiPickerPopover } from '../../../shared/components/EmojiPickerPopover';
import type { useGroupDetail } from '../hooks/useGroupDetail';

// Helper components remain internal to this file
const ResetCountsDialog: React.FC<{ dialog: ReturnType<typeof useGroupDetail>['resetDialog'] }> = ({ dialog }) => (
    <Dialog open={dialog.isOpen} onClose={dialog.handleClose}>
        <DialogTitle>Reset All Turn Counts?</DialogTitle>
        <DialogContent>
            <DialogContentText>
                This will set the turn count for every participant to zero. This action will be logged and cannot be undone.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={dialog.handleClose}>Cancel</Button>
            <Button onClick={dialog.handleConfirm} variant="contained">Confirm</Button>
        </DialogActions>
    </Dialog>
);

const DeleteGroupDialog: React.FC<{ dialog: ReturnType<typeof useGroupDetail>['deleteDialog'] }> = ({ dialog }) => (
    <Dialog open={dialog.isOpen} onClose={dialog.handleClose}>
        <DialogTitle>Delete Group?</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to permanently delete this group? This action cannot be undone.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={dialog.handleClose}>Cancel</Button>
            <Button onClick={dialog.handleConfirm} variant="contained" color="error">Delete</Button>
        </DialogActions>
    </Dialog>
);

// Define a comprehensive props interface for the main component
type GroupManagementDialogsProps = Pick<
  ReturnType<typeof useGroupDetail>,
  | 'groupMenu'
  | 'participantMenu'
  | 'iconPickerMenu'
  | 'resetDialog'
  | 'deleteDialog'
  | 'undoDialog'
  | 'skipDialog'
  | 'addParticipantDialog'
  | 'changeNameDialog' // Add the new dialog state to the props
  | 'actions'
  | 'feedback'
  | 'undoableAction'
  | 'user'
  | 'group' // We need the group for the current name
  | 'isAdmin'
  | 'isLastAdmin'
  | 'isSubmitting'
>;

// The single, exported component
export const GroupManagementDialogs: React.FC<GroupManagementDialogsProps> = ({
    groupMenu,
    participantMenu,
    iconPickerMenu,
    resetDialog,
    deleteDialog,
    undoDialog,
    skipDialog,
    addParticipantDialog,
    changeNameDialog, // Destructure the new dialog state
    actions,
    feedback,
    undoableAction,
    user,
    group,
    isAdmin,
    isLastAdmin,
    isSubmitting,
}) => {
    return (
        <>
            <AddParticipantDialog
                open={addParticipantDialog.isOpen}
                onClose={addParticipantDialog.handleClose}
                onConfirm={actions.handleAddParticipant}
                isSubmitting={isSubmitting}
            />

            <ChangeGroupNameDialog
                open={changeNameDialog.isOpen}
                onClose={changeNameDialog.handleClose}
                onConfirm={actions.handleConfirmNameChange}
                isSubmitting={isSubmitting}
                currentName={group?.name || ''}
            />

            <Menu anchorEl={groupMenu.anchorEl} open={groupMenu.isOpen} onClose={groupMenu.handleClose}>
                {isAdmin && (
                    [
                        <MenuItem key="change-name" onClick={() => { groupMenu.handleClose(); changeNameDialog.handleOpen(); }}>Change Name</MenuItem>,
                        <MenuItem key="change-icon" onClick={(e) => { groupMenu.handleClose(); iconPickerMenu.handleOpen(e); }}>Change Icon</MenuItem>,
                        <MenuItem key="reset-counts" onClick={resetDialog.handleOpen}>Reset All Turn Counts</MenuItem>,
                        <MenuItem key="delete-group" onClick={deleteDialog.handleOpen}>Delete Group</MenuItem>
                    ]
                )}
                {/* --- This action is visible to all members --- */}
                <MenuItem onClick={actions.handleLeaveGroup} disabled={isLastAdmin}>Leave Group</MenuItem>
            </Menu>

            {participantMenu.selectedParticipant && (
                <Menu anchorEl={participantMenu.anchorEl} open={participantMenu.isOpen} onClose={participantMenu.handleClose}>
                    {participantMenu.selectedParticipant.uid === user?.uid && user.isAnonymous && (
                        <MenuItem onClick={actions.handleRecoveryLink}>Get Recovery Link</MenuItem>
                    )}
                    {isAdmin && participantMenu.selectedParticipant.uid !== user?.uid && (
                        <>
                            <MenuItem onClick={() => actions.handleAdminCompleteTurn(participantMenu.selectedParticipant!.id)}>Complete Turn</MenuItem>
                            {participantMenu.selectedParticipant.role === 'member' && participantMenu.selectedParticipant.uid !== null ? (
                                <MenuItem onClick={() => actions.handleRoleChange('admin')}>Promote to Admin</MenuItem>
                            ) : participantMenu.selectedParticipant.role === 'admin' && (
                                <MenuItem onClick={() => actions.handleRoleChange('member')} disabled={isLastAdmin}>Demote to Member</MenuItem>
                            )}
                            <MenuItem onClick={actions.handleRemoveParticipant}>Remove Participant</MenuItem>
                        </>
                    )}
                </Menu>
            )}

            <EmojiPickerPopover open={iconPickerMenu.isOpen} anchorEl={iconPickerMenu.anchorEl} onClose={iconPickerMenu.handleClose} onEmojiSelect={actions.handleUpdateGroupIcon} />
            <ResetCountsDialog dialog={resetDialog} />
            <DeleteGroupDialog dialog={deleteDialog} />

            <Dialog open={undoDialog.isOpen} onClose={undoDialog.handleClose}>
                <DialogTitle>Undo Last Turn?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will reverse the turn taken by "{undoableAction?.participantName}". This action will be logged. Are you sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={undoDialog.handleClose}>Cancel</Button>
                    <Button onClick={undoDialog.handleConfirm} variant="contained" autoFocus>Confirm Undo</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={skipDialog.isOpen} onClose={skipDialog.handleClose}>
                <DialogTitle>Skip Your Turn?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will move you to the bottom of the list, but your turn count will not increase. Are you sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={skipDialog.handleClose}>Cancel</Button>
                    <Button onClick={skipDialog.handleConfirm} variant="contained" autoFocus>Confirm Skip</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!feedback} autoHideDuration={4000} onClose={() => actions.setFeedback(null)}>
                <Alert onClose={() => actions.setFeedback(null)} severity={feedback?.severity || 'info'} sx={{ width: '100%' }}>
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </>
    );
};