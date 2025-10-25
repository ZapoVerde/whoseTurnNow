/**
 * @file packages/whoseturnnow/src/theme/index.ts
 * @stamp {"ts":"2025-10-25T09:25:00Z"}
 * @architectural-role Theme System Entry Point
 *
 * @description
 * This is the public-facing entry point for the application's theming system. It
 * exports the main `getAppTheme` factory function, type definitions, and handles
 * MUI module augmentation for custom theme properties.
 *
 * @core-principles
 * 1. IS the single, public facade for the entire theming system.
 * 2. MUST export the `getAppTheme` function as the primary way to generate a theme.
 * 3. OWNS the TypeScript module augmentation for all custom theme properties.
 *
 * @api-declaration
 *   - getAppTheme: The primary factory function to generate a theme.
 *   - Performs module augmentation on MUI's `Palette` and `PaletteOptions` interfaces.
 *
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import { baseTheme, leakTheme } from './theme';
import type { Theme } from '@mui/material';

// ============================================================================
// Global Theme Configuration Constants
// ============================================================================

const HARD_OVERRIDE: 'normal' | 'leakcheck_light' | 'leakcheck_dark' = 'normal';
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
    surface: { canvas: string; panel: string; card: string };
  }
  interface PaletteOptions {
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