/**
 * @file src/theme/components/AppThemeProvider.tsx
 * @stamp {"ts":"2025-09-19T10:37:00Z"}
 * @architectural-role Smart Provider Component
 *
 * @description
 * This component is the central bridge between the application's state and its
 * visual theme. It generates a static MUI theme object that references CSS
 * variables. It also contains a critical `useEffect` hook that synchronizes the
 * `themeMode` from the state store to a class on the `<body>` element,
 * enabling instantaneous, CSS-driven theme switching.
 *
 * @contract
 * State Ownership: None. This component is a pure consumer of the `useSettingsStore`.
 * Public API: `AppThemeProvider` React component.
 * Core Invariants: The `useEffect` hook must correctly manage the `.dark` class on the `document.body`.
 *
 * @core-principles
 * 1. IS the single, authoritative point of connection between state and the theme engine.
 * 2. MUST subscribe to `useSettingsStore` for all user preferences.
 * 3. MUST perform the side effect of toggling the theme class on the DOM.
 */
import '../global.css';
import React, { useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useSettingsStore } from '../../features/settings/useSettingsStore';
import { getAppTheme } from '..';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const density = useSettingsStore((state) => state.density);
  const visualComplexity = useSettingsStore((state) => state.visualComplexity);

  useEffect(() => {
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [themeMode]);

  const theme = useMemo(
    () => getAppTheme(themeMode, density, visualComplexity),
    [themeMode, density, visualComplexity], 
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};