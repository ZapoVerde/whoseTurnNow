/**
 * @file packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx
 * @stamp {"ts":"2025-10-23T07:05:00Z"}
 * @architectural-role UI Component
 * @description
 * A stateful, presentational component that renders the immutable turn history
 * log. It is collapsed by default, showing only the most recent action, and
 * can be expanded by the user to view the full history.
 * @core-principles
 * 1. IS a self-contained, stateful presentational component.
 * 2. OWNS its own `isExpanded` UI state.
 * 3. MUST render UI based solely on the props it receives and its internal state.
 * 4. DELEGATES the content generation for log entries to its parent.
 * @api-declaration
 *   - default: The TurnHistory React functional component.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: [isExpanded]
 *     external_io: none
 */

import { useState, type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { LogEntry } from '../../../types/group';

interface TurnHistoryProps {
  turnLog: (LogEntry & { id: string })[];
  formatLogEntry: (log: LogEntry) => string;
}

export const TurnHistory: FC<TurnHistoryProps> = ({ turnLog, formatLogEntry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const entriesToShow = isExpanded ? turnLog : turnLog.slice(0, 1);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Turn History
      </Typography>
      <Paper>
        <List>
          {entriesToShow.map((log) => (
            <ListItem key={log.id} sx={{ py: 0.5 }}>
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
              <ListItemText secondary="No actions have been taken yet." sx={{ textAlign: 'center' }}/>
            </ListItem>
          )}
        </List>
        {turnLog.length > 1 && (
            <Button
                fullWidth
                onClick={() => setIsExpanded(!isExpanded)}
                endIcon={<ExpandMoreIcon sx={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                sx={{ justifyContent: 'space-between', p: 1, textTransform: 'none', color: 'text.secondary' }}
            >
                {isExpanded ? 'Show Less' : `Show ${turnLog.length - 1} more...`}
            </Button>
        )}
      </Paper>
    </Box>
  );
};