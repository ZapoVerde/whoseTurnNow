/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-24T07:55:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar. It enforces visual hierarchy by applying
 * the theme's accent color to the primary CTA and a muted color to secondary actions.
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST apply the accent color (`secondary`) to the main turn-taking button.
 * 3. MUST apply the primary color to all other floating action buttons.
 * 4. DELEGATES all event handling to its parent via callbacks.
 * @api-declaration
 *   - default: The GroupActionButtons React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import ShareIcon from '@mui/icons-material/Share';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import type { TurnCompletedLog } from '../../../types/group';

interface GroupActionButtonsProps {
  onTurnAction: () => void;
  onUndoClick: () => void;  
  onSkipClick: () => void;
  onInviteClick: () => void;
  onAddParticipantClick: () => void;
  isUserTurn: boolean;
  isSubmitting: boolean;
  undoableAction: (TurnCompletedLog & { id: string }) | null;
  isParticipant: boolean;
  isAdmin: boolean;
}

export const GroupActionButtons: FC<GroupActionButtonsProps> = ({
  onTurnAction,
  onUndoClick,  
  onSkipClick,
  onInviteClick,
  onAddParticipantClick,
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
    <Box /* ... */ >
      {/* --- LEFT WING --- */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="Add Participant"
            onClick={onAddParticipantClick} // This now correctly passes the event
            disabled={isSubmitting}
            size="medium"
          >
            <AddIcon />
          </Fab>
        )}
        {isUserTurn && (
          <Fab
            color="primary"
            aria-label="Skip turn"
            onClick={onSkipClick}
            disabled={isSubmitting}
            size="medium"
          >
            <SkipNextIcon />
          </Fab>
        )}
      </Box>

      {/* --- CENTER ANCHOR --- */}
      <Box>
        <Fab
          variant="extended"
          color="secondary"
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

      {/* --- RIGHT WING --- */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Fab
          color="primary"
          aria-label="Undo last turn"
          disabled={!undoableAction || isSubmitting}
          onClick={onUndoClick}
          size="medium"
        >
          <UndoIcon />
        </Fab>
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="Invite to group"
            onClick={onInviteClick}
            disabled={isSubmitting}
            size="medium"
          >
            <ShareIcon />
          </Fab>
        )}
      </Box>
    </Box>
  );
};