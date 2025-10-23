/**
 * @file src/theme/index.ts
 * @stamp {"ts":"2025-09-19T10:37:00Z"}
 * @architectural-role Theme System Entry Point
 *
 * @description
 * This is the public-facing entry point for the application's theming system. It
 * exports the main `getAppTheme` factory function, type definitions, and handles
 * MUI module augmentation for custom theme properties.
 *
 * @contract
 * State Ownership: None. This file exports pure functions and types.
 * Public API: Exports `getAppTheme`, `Density`, `AppMode`, and performs module augmentation on MUI's `Palette`.
 * Core Invariants: Module augmentation for custom palette colors must be correct and complete.
 *
 * @core-principles
 * 1. IS the single, public facade for the entire theming system.
 * 2. MUST export the `getAppTheme` function as the primary way to generate a theme.
 * 3. OWNS the TypeScript module augmentation for custom theme properties.
 */
import type { Theme } from '@mui/material/styles';
import { baseTheme, leakTheme } from './theme';

// ============================================================================
// Global Theme Configuration Constants
// ============================================================================

/**
 * Hard override for leak checks.
 * "normal" → UI controls choose light/dark.
 * "leakcheck_light" / "leakcheck_dark" → Force pure white/black to spot unthemed components.
 */
const HARD_OVERRIDE: 'normal' | 'leakcheck_light' | 'leakcheck_dark' = 'normal';

/**
 * Surface style for dark mode.
 * 'contrast' → Keeps a lighter "paper" surface (#1E1E1E) over the canvas (#121212).
 * 'flat' → Makes paper equal to canvas, removing the grey panel look.
 */
const SURFACE_STYLE: 'contrast' | 'flat' = 'contrast';

// ============================================================================
// Type Definitions & Augmentations
// ============================================================================

export type Density = 'comfortable' | 'compact';
export type AppMode = 'light' | 'dark' | 'leak-white' | 'leak-black';

// Extend the Palette type to include our custom semantic colors so they can be
// accessed via `theme.palette.*` and receive TypeScript autocompletion.
declare module '@mui/material/styles' {
  interface Palette {
    pinnedEntity: Palette['primary'];
    chipBackground: Palette['primary'];
    frostedSurface: { light: string; dark: string };
    surface: { canvas: string; panel: string; card: string };
  }
  interface PaletteOptions {
    pinnedEntity?: PaletteOptions['primary'];
    chipBackground?: PaletteOptions['primary'];
    frostedSurface?: { light: string; dark: string };
    surface?: { canvas: string; panel: string; card: string };
  }
}

// ============================================================================
// Public Theme Factory Function
// ============================================================================

/**
 * The main theme factory function for the application.
 * It assembles the theme based on the selected mode and density.
 * @param mode The application's color mode.
 * @param density The application's density setting.
 * @param complexity The application's visual complexity setting.
 * @returns A complete and responsive MUI Theme object.
 */
export function getAppTheme(
  mode: AppMode,
  density: Density = 'comfortable',
  complexity: 'full' | 'simple' = 'full',
): Theme {
  // Handle diagnostic leak check overrides first.
  if (HARD_OVERRIDE === 'leakcheck_light') return leakTheme('white', density);
  if (HARD_OVERRIDE === 'leakcheck_dark') return leakTheme('black', density);

  // Handle runtime leak check modes.
  if (mode === 'leak-white') return leakTheme('white', density);
  if (mode === 'leak-black') return leakTheme('black', density);

  // Return the standard application theme.
  return baseTheme(mode, density, SURFACE_STYLE, complexity);
}

export default getAppTheme;