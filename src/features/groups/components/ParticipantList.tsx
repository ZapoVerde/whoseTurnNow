/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-24T07:55:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the ordered list of participants. It now uses the theme's accent
 * color to highlight the participant whose turn is next, reinforcing the
 * application's primary visual hierarchy.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST use the theme's accent color to visually distinguish the next participant.
 * 3. MUST render UI based solely on the props it receives.
 * 4. DELEGATES all user interactions to its parent component via callbacks.
 * @api-declaration
 *   - default: The ParticipantList React functional component.
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
  isAdmin: boolean;
}

export const ParticipantList: FC<ParticipantListProps> = ({
  participants,
  onParticipantClick,
  onInviteToClaim,
  isAdmin,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={1} sx={{ mt: 4 }}>
      {participants.map((participant, index) => (
        <Card
          key={participant.id}
          sx={{
            // --- THIS IS THE FIX: Use the accent color for the highlight ---
            boxShadow:
              index === 0
                ? `0 0 8px 2px ${theme.palette.secondary.main}`
                : theme.shadows[1],
            // --- END FIX ---
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ListItemButton
            onClick={(e) => onParticipantClick(e, participant)}
            disabled={!isAdmin && participant.uid === null}
          >
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
            {isAdmin && participant.uid === null && (
              // --- THIS IS THE FIX: Changed from secondary to primary ---
              <Chip
                icon={<ShareIcon />}
                label="Invite"
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
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