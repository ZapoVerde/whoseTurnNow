/**
 * @file packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx
 * @stamp {"ts":"2025-10-21T18:03:00Z"}
 * @architectural-role UI Component
 * @description
 * A presentational component that provides a controlled form for administrators
 * to add new "Managed Participants" (placeholders) to a group.
 * @core-principles
 * 1. IS a pure, presentational ("dumb") component.
 * 2. MUST render UI based solely on the props it receives.
 * 3. DELEGATES all state management and form submission logic to its parent.
 * @api-declaration
 *   - default: The AddParticipantForm React functional component.
 * @contract
 *   assertions:
 *     purity: pure # This component's output depends only on its props.
 *     state_ownership: none # This component does not own or manage any state.
 *     external_io: none # This component does not perform any network or file system I/O.
 */

import { type FC } from 'react';
import { Paper, TextField, Button } from '@mui/material';

interface AddParticipantFormProps {
  name: string;
  setName: (name: string) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
}

export const AddParticipantForm: FC<AddParticipantFormProps> = ({
  name,
  setName,
  handleSubmit,
  isSubmitting,
}) => {
  return (
    <Paper component="form" sx={{ p: 2, mt: 4, display: 'flex', gap: 1 }} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <TextField
        label="Add Managed Participant"
        variant="outlined"
        size="small"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting || !name.trim()}
      >
        Add
      </Button>
    </Paper>
  );
};