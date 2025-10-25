/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-25T08:10:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the ordered list of participants. It uses a prominent style for the
 * "Up Next" participant and a secondary highlight for the current user's row
 * to aid in self-location.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST use a prominent, high-contrast style to distinguish the next participant.
 * 3. MUST use a secondary highlight to identify the current user's row.
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
  currentUserParticipantId?: string; 
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
  currentUserParticipantId, 
  onParticipantClick,
  onInviteToClaim,
  isAdmin,
  isUserTurn,
}) => {
  const theme = useTheme();

  if (participants.length === 0) {
    return null;
  }

  const [firstParticipant, ...remainingParticipants] = participants;

  return (
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
        <Stack spacing={1}>
          {remainingParticipants.map((participant) => (
            <Card
              key={participant.id}
              sx={{
                boxShadow: theme.shadows[1],
                border: `1px solid ${
                  participant.id === currentUserParticipantId
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
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