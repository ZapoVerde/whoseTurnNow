/**
 * @file packages/whoseturnnow/src/main.tsx
 * @stamp {"ts":"2025-10-22T15:55:00Z"}
 * @architectural-role Feature Entry Point
 * @description
 * The main entry point for the React application. Its sole responsibility is to
 * render the root `App` component into the DOM and wrap it with all necessary
 * top-level providers, including the new smart `AppThemeProvider` which manages
 * the dynamic theme for the entire application.
 * @core-principles
 * 1. IS the application's primary initialization vector.
 * 2. OWNS the instantiation and provision of the global theme provider.
 * 3. MUST NOT contain any business logic.
 * @api-declaration
 *   - None. This is an executable entry point with no exports.
 * @contract
 *   assertions:
 *     purity: mutates # This file has the side effect of rendering to the DOM.
 *     state_ownership: none
 *     external_io: none
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter';
import { App } from './App';
import { AppThemeProvider } from './theme/components/AppThemeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </React.StrictMode>,
);