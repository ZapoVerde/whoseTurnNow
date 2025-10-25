/**
 * @file packages/whoseturnnow/src/theme/mui.d.ts
 * @stamp {"ts":"2025-10-25T12:59:00Z"}
 * @architectural-role Type Definition
 *
 * @description
 * This is an ambient declaration file. Its sole purpose is to augment the
 * default TypeScript interfaces from the Material-UI library. It makes the
 * TypeScript compiler aware of custom properties added to the application's
 * theme object (e.g., `palette.surface`, `shape.borderWidths`), enabling
 * type safety and autocompletion across the project.
 *
 * @core-principles
 * 1. IS a globally-scoped type definition file; it IS NOT an executable module.
 * 2. OWNS the responsibility of bridging our custom theme shape with MUI's base types.
 * 3. MUST NOT contain any `import` or `export` statements to ensure it is
 *    treated as a global augmentation.
 *
 * @api-declaration
 *   - None. This is an ambient declaration file and has no exports.
 *
 * @contract
 *   assertions:
 *     purity: pure # This file contains only type declarations and no logic.
 *     state_ownership: none # It does not own or manage any application state.
 *     external_io: none # It does not perform any network or file system I/O.
 */

// This file is for extending Material-UI's TypeScript types.
// It is picked up automatically by the TypeScript compiler.

declare module '@mui/material/styles' {
    // Augment the Palette
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
  
    // Augment the Shape
    interface Shape {
      borderWidths: {
        standard: number;
        highlight: number;
      };
    }
    interface ShapeOptions {
      borderWidths?: {
        standard: number;
        highlight: number;
      };
    }
  }