/**
 * @file packages/whoseturnnow/src/shared/utils/debug.ts
 * @stamp {"ts":"2025-10-25T07:25:00Z"}
 * @architectural-role Utility
 * @description
 * Provides a centralized, configuration-controlled logging utility for the application.
 * It is automatically disabled in production builds and can be enabled/disabled
 * during development via the `VITE_LOGGING_ENABLED` environment variable.
 * @core-principles
 * 1. IS the single, authoritative entry point for all console logging.
 * 2. MUST NOT output logs in a production environment.
 * 3. MUST gate its output based on the `VITE_LOGGING_ENABLED` environment variable.
 * @api-declaration
 *   - logger: An object with `log`, `debug`, `info`, `warn`, and `error` methods.
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: none
 */

const LOGGING_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_LOGGING_ENABLED === 'true';

const performLog = (
  level: 'log' | 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
) => {
  if (LOGGING_ENABLED) {
    // This is the fix: Use console[level] and fall back to console.log.
    const logFunction = console[level] || console.log;
    const timestamp = new Date().toLocaleTimeString();
    if (context) {
      logFunction(`[${timestamp}] ${message}`, context);
    } else {
      logFunction(`[${timestamp}] ${message}`);
    }
  }
};

export const logger = {
  log: (message: string, context?: Record<string, unknown>) => {
    performLog('log', message, context);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    performLog('debug', message, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    performLog('info', message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    performLog('warn', message, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    performLog('error', message, context);
  },
};