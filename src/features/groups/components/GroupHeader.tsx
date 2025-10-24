/**
 * @file packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx
 * @stamp {"ts":"2025-10-23T08:30:00Z"}
 * @architectural-role UI Component
 * @description
 * A pure, presentational component responsible for displaying the main group
 * header. Its layout is managed by a Stack primitive to ensure theme-compliant
 * spacing and alignment.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render UI based solely on the props it receives.
 * 3. MUST use a `<Stack>` to manage the layout of its internal elements.
 * @api-declaration
 *   - default: The GroupHeader React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { type FC } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import type { Group } from '../../../types/group';

interface GroupHeaderProps {
  group: Group;
}

export const GroupHeader: FC<GroupHeaderProps> = ({ group }) => {
  return (
  <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 4 }}
    >
      <Typography variant="h2">{group.icon}</Typography>
      <Typography variant="h4" component="h1">
        {group.name}
      </Typography>
    </Stack>
  );
};