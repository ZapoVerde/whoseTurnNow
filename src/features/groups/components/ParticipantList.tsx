/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-21T18:02:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component responsible for rendering the ordered list of
 * participants, including their turn status, role, and statistics.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render the participant list based solely on the props it receives.
 * 3. DELEGATES all user interactions (clicks) to its parent component via callbacks.
 * @api-declaration
 *   - default: The ParticipantList React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component's output depends only on its props and has no side effects.
 *     state_ownership: none # This component does not own or manage any state.
 *     external_io: none # This component does not perform any network or file system I/O.
 */

import { type FC, type MouseEvent } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import type { TurnParticipant } from '../../../types/group';

interface ParticipantListProps {
  participants: TurnParticipant[];
  onParticipantClick: (
    event: MouseEvent<HTMLDivElement>,
    participant: TurnParticipant,
  ) => void;
}

export const ParticipantList: FC<ParticipantListProps> = ({
  participants,
  onParticipantClick,
}) => {
  return (
    <List sx={{ mt: 4 }}>
      {participants.map((participant, index) => (
        <ListItem key={participant.id} divider disablePadding>
          <ListItemButton onClick={(e) => onParticipantClick(e, participant)}>
            {index === 0 && (
              <ListItemIcon sx={{ minWidth: 4 }}>
                <ArrowForwardIosIcon
                  data-testid="ArrowForwardIosIcon"
                  fontSize="small"
                  color="primary"
                />
              </ListItemIcon>
            )}
            <ListItemText
              primary={participant.nickname || 'Unnamed'}
              secondary={`Turns: ${participant.turnCount}`}
              inset={index !== 0}
            />
            {participant.role === 'admin' && (
              <Chip
                icon={<AdminPanelSettingsIcon />}
                label="Admin"
                size="small"
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};