/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-24T07:55:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar using a robust "growable center" flexbox
 * layout. This ensures the primary action button fluidly fills the available
 * space between the secondary action wings, creating a balanced and
 * responsive layout.
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST use a flexbox layout with `flex-grow: 1` on the central button.
 * 3. MUST apply consistent spacing between all elements using the `gap` property.
 * @api-declaration
 *   - default: The GroupActionButtons React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import ShareIcon from '@mui/icons-material/Share';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Stack from '@mui/material/Stack';
import type { TurnCompletedLog } from '../../../types/group';

interface GroupActionButtonsProps {
  onTurnAction: () => void;
  onUndoClick: () => void;
  onSkipClick: () => void;
  onInviteClick: () => void;
  onAddParticipantClick: (event: MouseEvent<HTMLElement>) => void;
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
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        // Use gap to create consistent spacing between the three main sections.
        gap: 1,
        p: 2,
        background: (theme) => `linear-gradient(to top, ${theme.palette.background.default} 70%, transparent)`,
      }}
    >
      {/* --- LEFT WING --- */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-start"
        // Reserve a minimum width to keep the layout stable even when empty.
        sx={{ minWidth: 120 }}
      >
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="Add Participant"
            onClick={onAddParticipantClick}
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
      </Stack>

      {/* --- CENTER BUTTON (FLUIDLY GROWING) --- */}
      <Fab
        variant="extended"
        color="secondary"
        onClick={onTurnAction}
        disabled={isSubmitting}
        // flexGrow: 1 is the key to making the button fill the available space.
        sx={{ flexGrow: 1 }}
      >
        {isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : isUserTurn ? (
          'Complete My Turn'
        ) : (
          'Take My Turn'
        )}
      </Fab>

      {/* --- RIGHT WING --- */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        // Reserve a minimum width to keep the layout stable.
        sx={{ minWidth: 120 }}
      >
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
      </Stack>
    </Box>
  );
};