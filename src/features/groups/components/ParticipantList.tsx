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
import Typography from '@mui/material/Typography';
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

  // Guard against an empty list to prevent errors.
  if (participants.length === 0) {
    return null;
  }

  // Separate the "Up Next" participant from the rest of the list.
  const [firstParticipant, ...remainingParticipants] = participants;

  return (
    // 1. The OUTER Stack now creates the large gap between the first card
    //    and the block of remaining cards.
    <Stack spacing={4}>
      {/* --- Block 1: The "Up Next" Card --- */}
      <Card
        key={firstParticipant.id}
        sx={{
          boxShadow: theme.shadows[8],
          border: `2px solid ${
            isUserTurn ? theme.palette.secondary.main : theme.palette.primary.main
          }`,
        }}
      >
        <ListItemButton
          onClick={isAdmin ? (e) => onParticipantClick(e, firstParticipant) : undefined}
          sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
        >
          <ListItemText
            primary={
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 'bold' }}
              >
                {firstParticipant.nickname || 'Unnamed'}
              </Typography>
            }
            secondary={`Turns: ${firstParticipant.turnCount}`}
          />
          {firstParticipant.role === 'admin' && (
            <Chip icon={<AdminPanelSettingsIcon />} label="Admin" size="small" sx={{ ml: 1 }} />
          )}
          {isAdmin && firstParticipant.uid === null && (
            <Chip
              icon={<ShareIcon />}
              label="Invite"
              size="small"
              color="primary"
              onClick={(e) => { e.stopPropagation(); onInviteToClaim(firstParticipant.id); }}
              sx={{ ml: 1 }}
            />
          )}
        </ListItemButton>
      </Card>

      {/* --- Block 2: The Stack of Remaining Cards --- */}
      {remainingParticipants.length > 0 && (
        // 2. The INNER Stack maintains the small, uniform 8px gap for the rest of the list.
        <Stack spacing={1}>
          {remainingParticipants.map((participant) => (
            <Card
              key={participant.id}
              sx={{
                boxShadow: theme.shadows[1],
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ListItemButton
                onClick={isAdmin ? (e) => onParticipantClick(e, participant) : undefined}
                sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="h6"
                      component="span"
                      sx={{ fontWeight: 'normal' }}
                    >
                      {participant.nickname || 'Unnamed'}
                    </Typography>
                  }
                  secondary={`Turns: ${participant.turnCount}`}
                />
                {participant.role === 'admin' && (
                  <Chip icon={<AdminPanelSettingsIcon />} label="Admin" size="small" sx={{ ml: 1 }} />
                )}
                {isAdmin && participant.uid === null && (
                  <Chip
                    icon={<ShareIcon />}
                    label="Invite"
                    size="small"
                    color="primary"
                    onClick={(e) => { e.stopPropagation(); onInviteToClaim(participant.id); }}
                    sx={{ ml: 1 }}
                  />
                )}
              </ListItemButton>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};