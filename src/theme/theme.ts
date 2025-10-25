/**
 * @file packages/whoseturnnow/src/theme/theme.ts
 * @stamp {"ts":"2025-10-25T09:25:00Z"}
 * @architectural-role Theme Engine Core
 *
 * @description
 * This file contains the primary logic for generating the application's MUI
 * theme object. It composes primitive values from tokens.ts into a complete
 * theme structure, including palette, shape, and component overrides.
 *
 * @core-principles
 * 1. IS the central engine for all theme generation.
 * 2. MUST create a valid, static "bootstrap" theme to satisfy MUI's internal logic.
 * 3. MUST correctly compose all primitive tokens into the final theme object.
 *
 * @api-declaration
 *   - baseTheme: Factory function for the main application theme.
 *   - leakTheme: Factory function for a diagnostic theme.
 *
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { createTheme, responsiveFontSizes, type Theme } from '@mui/material';
import { TOKENS, SHADOWS, RADII, Z_INDEX } from './tokens';
import { getComponentOverrides } from './overrides';
import type { Density } from './index';


/**
 * Calculates scaling values for UI controls based on the selected density.
 * @param density The current density setting.
 * @returns An object with scaled values for radii, heights, padding, etc.
 */
function densityScale(density: Density) {
  if (density === 'compact') {
    return {
      controlMinHeight: 36,
      iconButtonSize: 44,
      inputPaddingY: 0.75,
      radius: RADII.medium,
      toolbarHeight: 48,
      spacingFactor: 0.9,
    };
  }
  return {
    controlMinHeight: 44,
    iconButtonSize: 44,
    inputPaddingY: 1.0,
    radius: RADII.large,
    toolbarHeight: 56,
    spacingFactor: 1.0,
  };
}

/**
 * Creates the main application theme.
 * @param mode The color mode ('light' or 'dark').
 * @param density The density setting ('compact' or 'comfortable').
 * @param surfaceStyle The surface style ('contrast' or 'flat').
 * @param complexity The visual complexity setting ('full' or 'simple').
 * @returns A complete and responsive MUI Theme object.
 */
export function baseTheme(
  mode: 'light' | 'dark',
  density: Density,
  surfaceStyle: 'contrast' | 'flat',
  complexity: 'full' | 'simple',
): Theme {
  const t = TOKENS;
  const isLight = mode === 'light';
  const d = densityScale(density);

  const bgDefault = isLight ? t.lightBgDefault : t.darkBgDefault;
  const bgPaper =
    complexity === 'simple'
      ? bgDefault
      : isLight
        ? t.lightBgPaper
        : surfaceStyle === 'flat'
          ? t.darkBgDefault
          : t.darkBgPaper;

  const themeWithoutComponents = createTheme({
    palette: {
      mode,
      primary: { main: isLight ? t.primaryLight : t.primaryDark },
      secondary: { main: isLight ? t.secondaryLight : t.secondaryDark },
      background: { default: bgDefault, paper: bgPaper },
      text: {
        primary: isLight ? t.lightTextPrimary : t.darkTextPrimary,
        secondary: isLight ? t.lightTextSecondary : t.darkTextSecondary,
      },
      divider: isLight ? t.dividerLight : t.dividerDark,
      surface: { canvas: bgDefault, panel: bgPaper, card: bgPaper },
    },
    shape: {
      borderRadius: d.radius,
    },
    spacing: 8 * d.spacingFactor,
    shadows: SHADOWS as Theme['shadows'],
    zIndex: Z_INDEX,
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
  });

  const finalTheme = createTheme(themeWithoutComponents, {
    components: getComponentOverrides(themeWithoutComponents, d, density, complexity),
  });

  return responsiveFontSizes(finalTheme);
}

/**
 * Creates a "leak check" theme where all UI elements are pure white or black.
 * @param kind 'white' or 'black'.
 * @param density The current density setting.
 * @returns A diagnostic MUI Theme object.
 */
export function leakTheme(kind: 'white' | 'black', density: Density): Theme {
  const base = kind === 'white' ? '#FFFFFF' : '#000000';
  const d = densityScale(density);

  return createTheme({
    palette: {
      mode: kind === 'white' ? 'light' : 'dark',
      primary: { main: base },
      secondary: { main: base },
      background: { default: base, paper: base },
      text: { primary: base, secondary: base, disabled: base },
      divider: base,
      surface: { canvas: base, panel: base, card: base },
    },
    shape: { borderRadius: d.radius },
    spacing: 8 * d.spacingFactor,
    shadows: SHADOWS as Theme['shadows'],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': { boxSizing: 'border-box' },
          'html, body, #root': { height: '100%', backgroundColor: base, color: base },
          'body, #root, div, span, p, h1, h2, h3, h4, h5, h6, li, ul, ol, button, input, textarea, select, label, a, header, main, footer, aside, section, article, nav, table, thead, tbody, tr, th, td, fieldset, legend, figure, figcaption, pre, code':
            {
              backgroundColor: base + ' !important',
              color: base + ' !important',
              borderColor: base + ' !important',
              outlineColor: base + ' !important',
              boxShadow: 'none !important',
              textShadow: 'none !important',
            },
          'img, video, canvas, svg': { filter: 'grayscale(100%) brightness(100%)' },
          '*': { minWidth: 0 },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundColor: base, border: `1px solid ${base}` } } },
      MuiCard: { styleOverrides: { root: { backgroundColor: base, border: `1px solid ${base}` } } },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: d.controlMinHeight,
            borderRadius: d.radius,
            color: base,
            borderColor: base,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { width: d.iconButtonSize, height: d.iconButtonSize, color: base } },
      },
      MuiTextField: { defaultProps: { size: density === 'compact' ? 'small' : 'medium' } },
      MuiInputBase: { styleOverrides: { root: { borderRadius: d.radius }, input: { color: base } } },
      MuiToolbar: { styleOverrides: { root: { minHeight: d.toolbarHeight } } },
      MuiSlider: {
        styleOverrides: {
          rail: { height: density === 'compact' ? 3 : 4, backgroundColor: base },
          track: {
            height: density === 'compact' ? 3 : 4,
            backgroundColor: base,
            border: 'none',
          },
          thumb: {
            width: density === 'compact' ? 14 : 18,
            height: density === 'compact' ? 14 : 18,
            marginTop: density === 'compact' ? -5.5 : -7,
            marginLeft: density === 'compact' ? -7 : -9,
            backgroundColor: base,
            border: `2px solid ${base}`,
            boxShadow: 'none',
          },
          valueLabel: {
            backgroundColor: base,
            border: `1px solid ${base}`,
            color: base,
            transform: 'none',
            top: -6,
          },
        },
      },
    },
  });
}