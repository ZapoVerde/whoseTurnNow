/**
 * @file packages/whoseturnnow/vite.config.ts
 * @stamp {"ts":"2025-10-21T20:00:00Z"}
 * @architectural-role Configuration
 *
 * @description
 * Provides the unified configuration for the @aianvil/whoseturnnow application,
 * managing settings for both the Vite development/build server and the Vitest
 * test runner.
 *
 * @core-principles
 * 1. IS the single source of truth for the build, development, and test environments
 *    for this standalone package.
 * 2. MUST provide the necessary plugins (e.g., @vitejs/plugin-react) for
 *    compiling and serving the application.
 * 3. MUST correctly configure the Vitest test environment, specifying the use of
 *    'jsdom' and loading the package-specific './vitest.setup.ts' file.
 *
 * @api-declaration
 *   - `default`: The unified Vite and Vitest configuration object.
 *
 * @contract
 *   assertions:
 *     purity: pure # This file is declarative configuration; it contains no runtime logic.
 *     state_ownership: none
 *     external_io: none
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
});
