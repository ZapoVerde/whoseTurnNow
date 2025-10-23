/**
 * @file packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx
 * @stamp {"ts":"2025-10-21T18:04:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component responsible for rendering the immutable turn
 * history log, including visual treatments for undone actions.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render UI based solely on the props it receives.
 * 3. OWNS the visual formatting of log entries but delegates the content
 *    generation to its parent.
 * @api-declaration
 *   - default: The TurnHistory React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component's output depends only on its props.
 *     state_ownership: none # This component does not own or manage any state.
 *     external_io: none # This component does not perform any network or file system I/O.
 */

import { type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import type { LogEntry } from '../../../types/group';

interface TurnHistoryProps {
  turnLog: (LogEntry & { id: string })[];
  formatLogEntry: (log: LogEntry) => string;
}

export const TurnHistory: FC<TurnHistoryProps> = ({ turnLog, formatLogEntry }) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Turn History
      </Typography>
      <List component={Paper}>
        {turnLog.map((log) => (
          <ListItem key={log.id}>
            <ListItemText
              primary={formatLogEntry(log)}
              secondary={new Date().toLocaleDateString()} // Placeholder timestamp
              sx={
                log.type === 'TURN_COMPLETED' && log.isUndone
                  ? { textDecoration: 'line-through', color: 'text.disabled' }
                  : {}
              }
            />
          </ListItem>
        ))}
        {turnLog.length === 0 && (
            <ListItem>
                <ListItemText secondary="No actions have been taken yet." />
            </ListItem>
        )}
      </List>
    </Box>
  );
};