/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-23T07:30:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the fixed bottom Action Bar as a three-segment button group.
 * The bar displays a role-aware set of controls with the central "Turn" action
 * given visual prominence through its larger size.
 * @core-principles
 * 1. IS a pure, presentational component for the application's core actions.
 * 2. MUST conditionally render the "Invite" button based on the `isAdmin` prop.
 * 3. MUST use a flexbox layout to create a 1:2:1 ratio for the three action segments.
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
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 64,
        }}
      >
        {/* Left Slot: Invite Button (Admin Only) - flex: 1 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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

        {/* Center Slot: Main Turn Action Button - flex: 2 */}
        <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onTurnAction}
            disabled={isSubmitting}
            sx={{
              width: '90%',
              minWidth: '180px',
              height: 48,
              borderRadius: '24px', // Pill shape
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : isUserTurn ? (
              'Complete My Turn'
            ) : (
              'Take My Turn'
            )}
          </Button>
        </Box>

        {/* Right Slot: Undo Button - flex: 1 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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