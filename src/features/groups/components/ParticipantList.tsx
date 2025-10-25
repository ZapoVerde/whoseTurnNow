/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-25T08:10:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the ordered list of participants. It now uses a theme-compliant
 * combination of a higher-elevation shadow and a thick, colored border to
 * prominently highlight the "Up Next" participant.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST use a prominent, high-contrast style to distinguish the next participant.
 * 3. MUST use only properties from the central theme object for all styling.
 * @api-declaration
 *   - default: The ParticipantList React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC, type MouseEvent } from 'react';
import { useTheme } from '@mui/material';
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
  isUserTurn: boolean;
}

export const ParticipantList: FC<ParticipantListProps> = ({
  participants,
  onParticipantClick,
  onInviteToClaim,
  isAdmin,
  isUserTurn,
}) => {
  const theme = useTheme();

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {participants.map((participant, index) => (
        <Card
          key={participant.id}
          sx={
            index === 0
              ? {
                  boxShadow: theme.shadows[8],
                  // The highlight border is now a hardcoded 2px.
                  border: `2px solid ${
                    isUserTurn ? theme.palette.secondary.main : theme.palette.primary.main
                  }`,
                  mb: 2,
                }
              : {
                  boxShadow: theme.shadows[1],
                  // The standard border is now a hardcoded 1px.
                  border: `1px solid ${theme.palette.divider}`,
                  mb: 0,
                }
          }
        >
          <ListItemButton
            onClick={isAdmin ? (e) => onParticipantClick(e, participant) : undefined}
            sx={{
                cursor: isAdmin ? 'pointer' : 'default',
            }}
          >
            <ListItemText
              primary={participant.nickname || 'Unnamed'}
              secondary={`Turns: ${participant.turnCount}`}
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: index === 0 ? 'bold' : 'normal',
                component: 'span',
              }}
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