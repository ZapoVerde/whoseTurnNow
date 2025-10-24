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
import { Stack, Button } from '@mui/material';
import { useSettingsStore } from '../../features/settings/useSettingsStore';

export const ThemeControls: React.FC = () => {
  const { themeMode, density, visualComplexity, setThemeMode, setDensity, setVisualComplexity } = useSettingsStore();

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
    // --- THIS IS THE FIX ---
    // The descriptive Typography labels have been removed.
    // The text inside each Button is now dynamic and displays the current state.
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        variant="outlined"
        onClick={handleModeToggle}
        sx={{ textTransform: 'capitalize' }}
      >
        {themeMode} Mode
      </Button>

      <Button
        variant="outlined"
        onClick={handleDensityToggle}
        sx={{ textTransform: 'capitalize' }}
      >
        {density} Density
      </Button>

      <Button
        variant="outlined"
        onClick={handleComplexityToggle}
        sx={{ textTransform: 'capitalize' }}
      >
        {visualComplexity} Complexity
      </Button>
    </Stack>
    // --- END FIX ---
  );
};