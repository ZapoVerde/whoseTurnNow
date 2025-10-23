/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx
 * @stamp {"ts":"2025-10-23T08:30:00Z"}
 * @architectural-role UI Component
 * @description
 * A pure, presentational component responsible for displaying the main group
 * header, including its icon and name. All actions are handled by the global
 * AppBar, which is controlled by the parent screen.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render UI based solely on the props it receives.
 * 3. MUST NOT contain any of its own interactive elements like buttons or menus.
 * @api-declaration
 *   - default: The GroupHeader React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Group } from '../../../types/group';

interface GroupHeaderProps {
  group: Group;
}

export const GroupHeader: FC<GroupHeaderProps> = ({ group }) => {
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
      {/* --- THIS IS THE FIX --- */}
      {/* The redundant IconButton has been completely removed from this component. */}
      {/* The global AppBar is now the single source of truth for this action. */}
    </Box>
  );
};