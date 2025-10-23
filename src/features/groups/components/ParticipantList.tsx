/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-23T06:20:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component for rendering the ordered list of participants. It
 * now includes a contextual "Invite" badge on placeholder participants, allowing
 * admins to generate a targeted "hand-off" link.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render the participant list based solely on the props it receives.
 * 3. MUST conditionally render an "Invite" badge for placeholder participants.
 * 4. DELEGATES all user interactions to its parent component via callbacks.
 * @api-declaration
 *   - default: The ParticipantList React functional component.
 *   - props.onInviteToClaim: Callback for when the "Invite" badge is clicked.
 * @contract
 *   assertions:
 *     purity: pure
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
import ShareIcon from '@mui/icons-material/Share';
import type { TurnParticipant } from '../../../types/group';

interface ParticipantListProps {
  participants: TurnParticipant[];
  onParticipantClick: (
    event: MouseEvent<HTMLDivElement>,
    participant: TurnParticipant,
  ) => void;
  onInviteToClaim: (participantId: string) => void;
}

export const ParticipantList: FC<ParticipantListProps> = ({
  participants,
  onParticipantClick,
  onInviteToClaim,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={1} sx={{ mt: 4 }}>
      {participants.map((participant, index) => (
        <Card
          key={participant.id}
          sx={{
            boxShadow:
              index === 0
                ? `0 0 8px 2px ${theme.palette.primary.main}`
                : theme.shadows[1],
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
                sx={{ ml: 1 }}
              />
            )}
            {participant.uid === null && (
              <Chip
                icon={<ShareIcon />}
                label="Invite"
                size="small"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the main button click
                  onInviteToClaim(participant.id);
                }}
                sx={{ ml: 1 }}
              />
            )}
          </ListItemButton>
        </Card>
      ))}
    </Stack>
  );
};