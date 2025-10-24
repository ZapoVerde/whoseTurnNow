/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-23T08:00:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar as a centered, horizontal group of
 * floating action buttons. The layout and visibility of the buttons are
 * context-aware based on the user's role.
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST render a single, centered group of floating action buttons.
 * 3. MUST conditionally render the "Invite" and "Add Participant" buttons based on the `isAdmin` prop.
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
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* Left-Side Buttons (Admin Only) */}
      {isAdmin && (
        <Fab
          color="secondary"
          aria-label="Invite to group"
          onClick={onInviteClick}
          disabled={isSubmitting}
          size="medium"
        >
          <ShareIcon />
        </Fab>
      )}

      {/* Center Button: Main Turn Action */}
      <Fab
        variant="extended"
        color="primary"
        onClick={onTurnAction}
        disabled={isSubmitting}
        sx={{
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

      {/* Right-Side Buttons */}
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
  );
};