/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-23T08:30:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar as a geometrically spaced group of floating
 * action buttons. The layout is symmetrical and context-aware based on user role.
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST render a set of independent, absolutely positioned floating buttons.
 * 3. MUST conditionally render admin-only buttons.
 * 4. MUST apply distinct colors to differentiate the primary action from secondary actions.
 * 5. DELEGATES all event handling to its parent via callbacks.
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
import type { TurnCompletedLog } from '../../../types/group';

interface GroupActionButtonsProps {
  onTurnAction: () => void;
  onUndoClick: () => void;
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
    <>
      {/* Center Button: Main Turn Action (The Anchor) */}
      <Fab
        variant="extended"
        color="primary"
        onClick={onTurnAction}
        disabled={isSubmitting}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          minWidth: '180px',
        }}
      >
        {isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : isUserTurn ? (
          'Complete My Turn'
        ) : (
          'Take My Turn'
        )}
      </Fab>

      {/* Left-Side Button (Admin Only) */}
      {isAdmin && (
        <Fab
          color="secondary"
          aria-label="Invite to group"
          onClick={onInviteClick}
          disabled={isSubmitting}
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '25%', // Centered in the left quadrant
            transform: 'translateX(-50%)',
          }}
        >
          <ShareIcon />
        </Fab>
      )}

      {/* Right-Side Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 0,
          width: '50vw', // Occupy the right half of the screen
          display: 'flex',
          justifyContent: 'space-evenly', // Evenly space children within this half
          alignItems: 'center',
        }}
      >
        {isAdmin && (
          <Fab
            color="secondary"
            aria-label="Add Participant"
            onClick={onAddParticipantClick}
            disabled={isSubmitting}
            size="medium"
          >
            <AddIcon />
          </Fab>
        )}
        <Fab
          color="secondary"
          aria-label="Undo last turn"
          disabled={!undoableAction || isSubmitting}
          onClick={onUndoClick}
          size="medium"
        >
          <UndoIcon />
        </Fab>
      </Box>
    </>
  );
};