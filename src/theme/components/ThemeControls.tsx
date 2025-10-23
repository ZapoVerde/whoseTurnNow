/**
 * @file src/theme/components/ThemeControls.tsx
 * @stamp {"ts":"2025-09-19T10:37:00Z"}
 * @architectural-role UI Smart Component
 *
 * @description
 * A "smart" component that provides UI controls for changing the application's
 * theme. It connects directly to the central `useSettingsStore` to read the
 * current theme preferences and to dispatch actions that modify them.
 *
 * @contract
 * State Ownership: None. This component is a pure consumer of the `useSettingsStore`.
 * Public API: `ThemeControls` React component.
 * Core Invariants: All user interactions must dispatch actions to the central store.
 *
 * @core-principles
 * 1. IS a self-sufficient component for managing theme settings.
 * 2. MUST derive all its state and actions directly from `useSettingsStore`.
 * 3. MUST NOT contain any of its own local state.
 */
import React from 'react';
import { Stack, Button, Typography } from '@mui/material';
import { useSettingsStore } from '../../features/settings/useSettingsStore';

export const ThemeControls: React.FC = () => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const density = useSettingsStore((state) => state.density);
  const visualComplexity = useSettingsStore((state) => state.visualComplexity);

  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const setDensity = useSettingsStore((state) => state.setDensity);
  const setVisualComplexity = useSettingsStore((state) => state.setVisualComplexity);

  const handleModeToggle = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const handleDensityToggle = () => {
    setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
  };

  const handleComplexityToggle = () => {
    setVisualComplexity(visualComplexity === 'full' ? 'simple' : 'full');
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2">Mode: {themeMode}</Typography>
      <Button variant="outlined" onClick={handleModeToggle}>
        Toggle Mode
      </Button>

      <Typography variant="body2">Density: {density}</Typography>
      <Button variant="outlined" onClick={handleDensityToggle}>
        Toggle Density
      </Button>

      <Typography variant="body2">Complexity: {visualComplexity}</Typography>
      <Button variant="outlined" onClick={handleComplexityToggle}>
        Toggle Complexity
      </Button>
    </Stack>
  );
};