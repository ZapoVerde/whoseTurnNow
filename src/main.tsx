/**
 * @file packages/whoseturnnow/src/main.tsx
 * @stamp {"ts":"2025-10-21T14:20:00Z"}
 * @architectural-role Feature Entry Point
 *
 * @description
 * The main entry point for the React application. Its sole responsibility is to
 * render the root `App` component into the DOM and wrap it with any necessary
 * top-level providers.
 *
 * @core-principles
 * 1. IS the application's primary initialization vector.
 * 2. MUST compose the root component with all necessary global providers (like
 *    React.StrictMode).
 * 3. MUST NOT contain any business logic.
 *
 * @api-declaration
 *   - None. This is an executable entry point with no exports.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This file has the side effect of rendering to the DOM.
 *     state_ownership: none
 *     external_io: none
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// Note: The AuthOrchestrator is no longer needed here as its logic has been
// refactored into a headless hook called directly by the App component.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);