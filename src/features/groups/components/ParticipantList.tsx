/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-23T09:00:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component responsible for rendering the ordered list of
 * participants as a stack of cards. It provides a clear "spotlight" effect for
 * the active participant (at index 0) using a themed box-shadow.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render the participant list based solely on the props it receives.
 * 3. DELEGATES all user interactions (clicks) to its parent component via callbacks.
 * 4. MUST use a card-based layout to visually separate participants.
 * @api-declaration
 *   - default: The ParticipantList React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component's output depends only on its props.
 *     state_ownership: none
 *     external_io: none
 */

import { type FC, type MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
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
  const theme = useTheme();

  return (
    <Stack spacing={1} sx={{ mt: 4 }}>
      {participants.map((participant, index) => (
        <Card
          key={participant.id}
          sx={{
            // --- THIS IS THE FIX ---
            // Apply the "subtle glow" using the primary theme color only to the
            // first participant in the list.
            boxShadow:
              index === 0
                ? `0 0 8px 2px ${theme.palette.primary.main}`
                : theme.shadows[1],
            // Ensure the border is consistent with other cards in the app.
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ListItemButton onClick={(e) => onParticipantClick(e, participant)}>
            <ListItemText
              primary={participant.nickname || 'Unnamed'}
              secondary={`Turns: ${participant.turnCount}`}
            />
            {participant.role === 'admin' && (
              <Chip
                icon={<AdminPanelSettingsIcon />}
                label="Admin"
                size="small"
              />
            )}
          </ListItemButton>
        </Card>
      ))}
    </Stack>
  );
};