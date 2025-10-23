/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx
 * @stamp {"ts":"2025-10-21T18:01:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component responsible for displaying the main group header,
 * including its icon, name, and the administrative menu button.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render UI based solely on the props it receives.
 * 3. DELEGATES all event handling to its parent via callbacks.
 */

import { type FC, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Group } from '../../../types/group';

interface GroupHeaderProps {
  group: Group;
  isAdmin: boolean;
  onMenuClick: (event: MouseEvent<HTMLElement>) => void;
}

export const GroupHeader: FC<GroupHeaderProps> = ({ group, isAdmin, onMenuClick }) => {
  return (
    <Box
      sx={{
        mt: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Typography variant="h2">{group.icon}</Typography>
      <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
        {group.name}
      </Typography>
      {isAdmin && (
        <IconButton
          aria-label="Group options"
          data-testid="group-menu-button"
          onClick={onMenuClick}
          sx={{ position: 'absolute', right: 0 }}
        >
          <MoreVertIcon />
        </IconButton>
      )}
    </Box>
  );
};