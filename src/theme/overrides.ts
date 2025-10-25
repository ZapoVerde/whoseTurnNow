/**
 * @file src/theme/overrides.ts
 * @stamp {"ts":"2025-09-19T10:37:00Z"}
 * @architectural-role Global Style Configuration
 *
 * @description
 * This file centralizes all default component styles. It is the core of the
 * "Bootstrap and Override" pattern. It forces key components to ignore the
 * static bootstrap colors from the theme object and instead use the dynamic
 * CSS Custom Properties from `global.css` for their styling.
 *
 * @contract
 * State Ownership: None. This file exports a pure function.
 * Public API: Exports the `getComponentOverrides` factory function.
 * Core Invariants: Key surface components (`MuiPaper`, `MuiCard`, etc.) must have their color and background-color overridden to use CSS variables.
 *
 * @core-principles
 * 1. IS the single source of truth for default component styling.
 * 2. MUST enforce the use of CSS variables for final component styling.
 * 3. MUST be a pure function that derives styles from the theme object and its parameters.
 */
import type { Theme } from '@mui/material';
import type { Density } from './index';

// A helper type for the object returned by densityScale
type DensityScale = {
  controlMinHeight: number;
  iconButtonSize: number;
  inputPaddingY: number;
  radius: number;
  toolbarHeight: number;
  spacingFactor: number;
};

/**
 * Generates the `components` object for the MUI theme.
 * This function centralizes all component-specific style overrides.
 * @param theme The partially built theme to access palette, spacing, etc.
 * @param d The calculated density scale values.
 * @param density The current density setting ('compact' or 'comfortable').
 * @param complexity The current visual complexity setting ('full' or 'simple').
 * @returns The complete `components` object for the theme.
 */
export function getComponentOverrides(
  theme: Theme,
  d: DensityScale,
  density: Density,
  complexity: 'full' | 'simple',
): Theme['components'] {
  const isSimpleMode = complexity === 'simple';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        html: {
          height: '100%',
          WebkitTextSizeAdjust: '100%',
          scrollBehavior: 'smooth',
        },
        body: {
          height: '100%',
          margin: 0,
        },
        '#root': {
          height: '100%',
        },
        'img, video, canvas': {
          maxWidth: '100%',
          height: 'auto',
        },
        '*': {
          minWidth: 0,
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      },
    },


    MuiContainer: { defaultProps: { maxWidth: 'lg' } },
    MuiButtonBase: { defaultProps: { disableRipple: false } },

    MuiPaper: {
      styleOverrides: {
        root: {
          color: 'var(--palette-text-primary)',
          ...(isSimpleMode
            ? {
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }
            : {
                backgroundColor: 'var(--palette-surface-panel)',
                border: `1px solid var(--palette-divider)`,
                boxShadow: theme.shadows[1],
              }),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          color: 'var(--palette-text-primary)',
          ...(isSimpleMode
            ? {
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
              }
            : {
                backgroundColor: 'var(--palette-surface-card)',
                border: `1px solid var(--palette-divider)`,
                boxShadow: theme.shadows[2],
              }),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--palette-background-paper)',
          color: 'var(--palette-text-primary)',
          borderBottom: `1px solid var(--palette-divider)`,
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--palette-surface-panel)',
          borderRight: `1px solid var(--palette-divider)`,
        },
      },
    },
    MuiToolbar: { styleOverrides: { root: { minHeight: d.toolbarHeight } } },

    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: d.controlMinHeight,
          borderRadius: theme.shape.borderRadius,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: d.iconButtonSize,
          height: d.iconButtonSize,
          borderRadius: theme.shape.borderRadius,
        },
      },
    },

    MuiTextField: { defaultProps: { size: density === 'compact' ? 'small' : 'medium' } },
    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: `${theme.shape.borderRadius}px !important` },
        input: { paddingTop: `${d.inputPaddingY}rem`, paddingBottom: `${d.inputPaddingY}rem` },
      },
    },

    // Controls unified
    MuiSlider: {
      defaultProps: {
        size: density === 'compact' ? 'small' : 'medium',
        valueLabelDisplay: 'auto',
      },
      styleOverrides: {
        root: { padding: theme.spacing(2, 0), touchAction: 'none' },
        rail: {
          height: density === 'compact' ? 3 : 4,
          opacity: 1,
          backgroundColor: theme.palette.divider,
        },
        track: {
          height: density === 'compact' ? 3 : 4,
          border: 'none',
          backgroundColor: theme.palette.primary.main,
        },
        thumb: {
          width: density === 'compact' ? 14 : 18,
          height: density === 'compact' ? 14 : 18,
          marginTop: density === 'compact' ? -5.5 : -7,
          marginLeft: density === 'compact' ? -7 : -9,
          boxShadow: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${theme.palette.primary.main}`,
          '&.Mui-focusVisible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        },
        valueLabel: {
          borderRadius: 6,
          padding: theme.spacing(0.25, 0.75),
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          transform: 'none',
          top: -6,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        track: { backgroundColor: theme.palette.divider, opacity: 1 },
        thumb: { boxShadow: 'none' },
      },
    },
    MuiCheckbox: {
      styleOverrides: { root: { color: theme.palette.text.secondary } },
    },
    MuiRadio: {
      styleOverrides: { root: { color: theme.palette.text.secondary } },
    },
  };
}