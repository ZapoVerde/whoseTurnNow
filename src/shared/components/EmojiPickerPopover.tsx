/**
 * @file packages/whoseturnnow/src/shared/components/EmojiPickerPopover.tsx
 * @stamp {"ts":"2025-10-23T09:15:00Z"}
 * @architectural-role UI Component
 * @description
 * A reusable popover component that lazy-loads and displays a third-party emoji
 * picker. It uses React.Suspense to provide a clean loading fallback, ensuring
 * the main application bundle remains small.
 * @core-principles
 * 1. IS a self-contained, reusable UI component.
 * 2. MUST lazy-load the EmojiPicker component to optimize initial page load.
 * 3. OWNS the popover and loading state for the emoji picker.
 * 4. DELEGATES the selection action to its parent via the `onEmojiSelect` callback.
 * @api-declaration
 *   - default: The EmojiPickerPopover React functional component.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import React, { Suspense } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { EmojiClickData } from 'emoji-picker-react';

// Lazy-load the EmojiPicker component. It will only be fetched when first rendered.
const LazyEmojiPicker = React.lazy(() => import('emoji-picker-react'));

interface EmojiPickerPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  onEmojiSelect,
}) => {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 350,
              height: 450,
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <LazyEmojiPicker onEmojiClick={handleEmojiClick} />
      </Suspense>
    </Popover>
  );
};