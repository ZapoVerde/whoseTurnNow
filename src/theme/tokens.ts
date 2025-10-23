/**
 * @file src/theme/tokens.ts
 * @stamp {"ts":"2025-09-19T10:37:00Z"}
 * @architectural-role Design System Definition
 *
 * @description
 * This file is the single source of truth for all primitive design values,
 * including the static color definitions used to bootstrap the MUI theme object.
 * The canonical, dynamic color palette lives as CSS Custom Properties in
 * `global.css`. This file defines shadows, radii, transitions, and z-index layers.
 *
 * @contract
 * State Ownership: None. This is a stateless configuration file.
 * Public API: Exports constant objects for `TOKENS`, `SHADOWS`, `RADII`, `TRANSITIONS`, and `Z_INDEX`.
 * Core Invariants: This file must contain the complete set of static color definitions needed by `theme.ts`.
 *
 * @core-principles
 * 1. IS the canonical source for all raw styling values.
 * 2. MUST export only plain constant objects.
 * 3. MUST be dependency-free.
 */
// Brand tokens incorporating new palette additions from Phase 1
export const TOKENS = {
  // Light Mode Colors
  lightBgDefault: '#f2e9e4',
  lightBgPaper: '#FFFFFF', // Keeping paper white for contrast on the light background
  lightTextPrimary: '#22223b',
  lightTextSecondary: '#c9ada7',
  dividerLight: '#c9ada7',

  // Dark Mode Colors
  darkBgDefault: '#22223b',
  darkBgPaper: '#4a4e69', // Using primary for paper to create contrast
  darkTextPrimary: '#f2e9e4',
  darkTextSecondary: '#c9ada7',
  dividerDark: '#9a8c98',

  // Universal Brand Colors
  primaryLight: '#4a4e69',
  primaryDark: '#9a8c98', // A slightly lighter variant for better contrast on dark BG
  secondaryLight: '#9a8c98',
  secondaryDark: '#c9ada7',

  // Semantic Colors (derived for consistency)
  pinnedLight: 'rgba(74, 78, 105, 0.85)', // primaryLight with alpha
  pinnedDark: 'rgba(154, 140, 152, 0.40)',// primaryDark with alpha
  chipBgLight: 'rgba(255, 255, 255, 0.70)',
  chipBgDark: 'rgba(0, 0, 0, 0.40)',
  frostedLight: 'rgba(255, 255, 255, 0.60)',
  frostedDark: 'rgba(34, 34, 59, 0.40)',   // darkBgDefault with alpha
};

// Phase 1 Addition: New consistent shadow ladder
export const SHADOWS = [
  'none',
  '0 1px 1px rgba(0,0,0,0.12)',
  '0 2px 4px rgba(0,0,0,0.14)',
  '0 4px 8px rgba(0,0,0,0.16)',
  '0 6px 12px rgba(0,0,0,0.18)',
  '0 8px 16px rgba(0,0,0,0.20)',
  '0 10px 20px rgba(0,0,0,0.22)',
  '0 12px 24px rgba(0,0,0,0.24)',
  '0 14px 28px rgba(0,0,0,0.26)',
  '0 16px 32px rgba(0,0,0,0.28)',
  '0 18px 36px rgba(0,0,0,0.30)',
  '0 20px 40px rgba(0,0,0,0.32)',
  '0 22px 44px rgba(0,0,0,0.34)',
  '0 24px 48px rgba(0,0,0,0.36)',
  '0 26px 52px rgba(0,0,0,0.38)',
  '0 28px 56px rgba(0,0,0,0.40)',
  '0 30px 60px rgba(0,0,0,0.42)',
  '0 32px 64px rgba(0,0,0,0.44)',
  '0 34px 68px rgba(0,0,0,0.46)',
  '0 36px 72px rgba(0,0,0,0.48)',
  '0 38px 76px rgba(0,0,0,0.50)',
  '0 40px 80px rgba(0,0,0,0.52)',
  '0 42px 84px rgba(0,0,0,0.54)',
  '0 44px 88px rgba(0,0,0,0.56)',
  '0 46px 92px rgba(0,0,0,0.58)',
];

export const RADII = {
  small: 8, // For small elements like tags or inputs
  medium: 12, // For cards and buttons
  large: 16, // For larger containers or modals
};

export const TRANSITIONS = {
  duration: '250ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const Z_INDEX = {
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};