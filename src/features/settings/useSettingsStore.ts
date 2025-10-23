/**
 * @file packages/whoseturnnow/src/features/settings/state/useSettingsStore.ts
 * @architectural-role State Management
 * @description
 * Defines the central Zustand store for managing global UI and application settings,
 * including all theme-related user preferences like color mode, density, and
 * visual complexity.
 * @core-principles
 * 1. IS the single source of truth for all user-configurable theme and UI settings.
 * 2. OWNS the state for `themeMode`, `density`, and `visualComplexity`.
 * 3. MUST be a pure, in-memory store with no direct external I/O.
 * @api-declaration
 *   - ThemeMode: The type for the color scheme ('light' | 'dark').
 *   - Density: The type for UI density ('comfortable' | 'compact').
 *   - VisualComplexity: The type for visual complexity ('full' | 'simple').
 *   - SettingsState: The interface for the store's state and actions.
 *   - useSettingsStore: The exported Zustand store hook.
 * @contract
 *   assertions:
 *     purity: mutates # This is a state store; its purpose is to manage mutable state.
 *     state_ownership: [themeMode, density, visualComplexity] # It exclusively owns the global UI settings.
 *     external_io: none # It is a pure, in-memory store.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * @id packages/whoseturnnow/src/features/settings/state/useSettingsStore.ts#ThemeMode
 * @description Defines the possible color schemes for the application.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * @id packages/whoseturnnow/src/features/settings/state/useSettingsStore.ts#Density
 * @description Defines the possible density settings for UI controls, affecting spacing and size.
 */
export type Density = 'comfortable' | 'compact';

/**
 * @id packages/whoseturnnow/src/features/settings/state/useSettingsStore.ts#VisualComplexity
 * @description Defines the visual complexity, allowing users to switch between a full-featured
 *              UI and a simpler, more minimal presentation.
 */
export type VisualComplexity = 'full' | 'simple';

/**
 * @id packages/whoseturnnow/src/features/settings/state/useSettingsStore.ts#SettingsState
 * @description The complete state and action interface for the global settings store.
 */
export interface SettingsState {
  /**
   * The current color scheme of the application.
   */
  themeMode: ThemeMode;
  /**
   * The current density of the UI controls.
   */
  density: Density;
  /**
   * The current level of visual complexity for UI components.
   */
  visualComplexity: VisualComplexity;
  /**
   * An action to set the application's color scheme.
   * @param mode The new theme mode to apply.
   */
  setThemeMode: (mode: ThemeMode) => void;
  /**
   * An action to set the application's UI density.
   * @param density The new density to apply.
   */
  setDensity: (density: Density) => void;
  /**
   * An action to set the application's visual complexity.
   * @param complexity The new visual complexity to apply.
   */
  setVisualComplexity: (complexity: VisualComplexity) => void;
}

export const useSettingsStore = create<SettingsState>()(
  immer((set) => ({
    // Default initial state
    themeMode: 'light',
    density: 'comfortable',
    visualComplexity: 'full',

    // Actions to update the state
    setThemeMode: (mode) => set({ themeMode: mode }),
    setDensity: (density) => set({ density: density }),
    setVisualComplexity: (complexity) => set({ visualComplexity: complexity }),
  })),
);