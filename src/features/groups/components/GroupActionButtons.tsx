/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-23T06:15:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar, displaying a role-aware set of controls.
 * It shows the three-way split for admins (Invite, Turn, Undo) and a two-way
 * split for members (Turn, Undo).
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST conditionally render the "Invite" button based on the `isAdmin` prop.
 * 3. DELEGATES all event handling to its parent via callbacks.
 * @api-declaration
 *   - default: The GroupActionButtons React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ShareIcon from '@mui/icons-material/Share';
import UndoIcon from '@mui/icons-material/Undo';
import type { TurnCompletedLog } from '../../../types/group';

interface GroupActionButtonsProps {
  onTurnAction: () => void;
  onUndoClick: () => void;
  onInviteClick: () => void;
  isUserTurn: boolean;
  isSubmitting: boolean;
  undoableAction: (TurnCompletedLog & { id: string }) | null;
  isParticipant: boolean;
  isAdmin: boolean;
}

export const GroupActionButtons: FC<GroupActionButtonsProps> = ({
  onTurnAction,
  onUndoClick,
  onInviteClick,
  isUserTurn,
  isSubmitting,
  undoableAction,
  isParticipant,
  isAdmin,
}) => {
  if (!isParticipant) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 64,
          px: 2,
        }}
      >
        {/* Left Slot: Invite Button (Admin Only) */}
        <Box sx={{ width: 48, display: 'flex', justifyContent: 'center' }}>
          {isAdmin && (
            <IconButton
              color="primary"
              aria-label="Invite to group"
              onClick={onInviteClick}
              disabled={isSubmitting}
            >
              <ShareIcon />
            </IconButton>
          )}
        </Box>

        {/* Center Slot: Main Turn Action Button */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Fab
            variant="extended"
            color="primary"
            onClick={onTurnAction}
            disabled={isSubmitting}
            sx={{ minWidth: '180px' }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : isUserTurn ? (
              'Complete My Turn'
            ) : (
              'Take My Turn'
            )}
          </Fab>
        </Box>

        {/* Right Slot: Undo Button */}
        <Box sx={{ width: 48, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            color="secondary"
            aria-label="Undo last turn"
            disabled={!undoableAction || isSubmitting}
            onClick={onUndoClick}
          >
            <UndoIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};