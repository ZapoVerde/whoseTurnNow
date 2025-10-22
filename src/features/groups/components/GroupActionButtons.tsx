/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
 * @stamp {"ts":"2025-10-21T18:05:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component that renders the primary floating action buttons
 * for the group detail screen, including the main turn action and the undo action.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render its state and behavior based solely on the props it receives.
 * 3. DELEGATES all event handling to its parent component via callbacks.
 * @api-declaration
 *   - default: The GroupActionButtons React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component's output depends only on its props.
 *     state_ownership: none # This component does not own or manage any state.
 *     external_io: none # This component does not perform any network or file system I/O.
 */

import  { type FC } from 'react';
import { Fab, CircularProgress } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import type { TurnCompletedLog } from '../../../types/group';

interface GroupActionButtonsProps {
  onTurnAction: () => void;
  onUndoClick: () => void;
  isUserTurn: boolean;
  isSubmitting: boolean;
  undoableAction: (TurnCompletedLog & { id: string }) | null;
  isParticipant: boolean;
}

export const GroupActionButtons: FC<GroupActionButtonsProps> = ({
  onTurnAction,
  onUndoClick,
  isUserTurn,
  isSubmitting,
  undoableAction,
  isParticipant,
}) => {
  if (!isParticipant) {
    return null;
  }

  return (
    <>
      <Fab
        size="medium"
        color="secondary"
        aria-label="undo"
        sx={{ position: 'fixed', bottom: 16, right: 96 }}
        disabled={!undoableAction || isSubmitting}
        onClick={onUndoClick}
      >
        <UndoIcon />
      </Fab>
      <Fab
        variant="extended"
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={onTurnAction}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : isUserTurn ? (
          'Complete My Turn'
        ) : (
          'Take My Turn'
        )}
      </Fab>
    </>
  );
};