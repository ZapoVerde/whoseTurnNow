/**
 * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
 * @stamp {"ts":"2025-10-24T12:00:00Z"}
 * @architectural-role UI Component
 * @description
 * Renders the ordered list of participants. It now ensures all participant rows
 * are rendered at full contrast and only attaches the menu-opening click handler
 * for administrative users, preventing empty menus from appearing for others.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST use distinct styling to visually distinguish the next participant.
 * 3. MUST only enable context menu interactions for users with the 'admin' role.
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
    <Stack spacing={1} sx={{ mt: 2 }}>
      {participants.map((participant, index) => (
        <Card
          key={participant.id}
          sx={{
            boxShadow:
              index === 0
                ? `0 0 8px 2px ${theme.palette.secondary.main}`
                : theme.shadows[1],
            border: `1px solid ${theme.palette.divider}`,
            mb: index === 0 ? 2 : 0,
          }}
        >
          {/* --- THIS IS THE FIX --- */}
          {/* The `onClick` is now conditional, and the `disabled` prop is removed. */}
          <ListItemButton
            onClick={isAdmin ? (e) => onParticipantClick(e, participant) : undefined}
            sx={{
                // Ensure the button has a pointer cursor only when it's clickable for admins
                cursor: isAdmin ? 'pointer' : 'default',
            }}
          >
          {/* --- END FIX --- */}
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