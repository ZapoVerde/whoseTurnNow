/**
 * @file packages/whoseturnnow/vite.config.ts
 * @stamp {"ts":"2025-10-21T14:20:00Z"}
 * @architectural-role Configuration
 *
 * @description
 * Provides the Vite configuration for the @aianvil/whoseturnnow application.
 * Its primary responsibility is to define the build and development server
 * settings, including the essential integration of the React plugin.
 *
 * @core-principles
 * 1. IS the single source of truth for the build and development environment of the
 *    @aianvil/whoseturnnow package.
 * 2. MUST provide the necessary plugins (e.g., @vitejs/plugin-react) for
 *    compiling and serving the application.
 * 3. DELEGATES all test-running configuration to the monorepo's root
 *    vitest.config.ts, maintaining a clean separation of concerns.
 *
 * @api-declaration
 *   - `default`: The Vite configuration object.
 *
 * @contract
 *   assertions:
 *     purity: pure # This file is declarative configuration; it contains no runtime logic.
 *     state_ownership: none
 *     external_io: none
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})