/**
 * @file packages/whoseturnnow/src/hooks/useRoutePreloader.ts
 * @stamp {"ts":"2025-10-22T17:00:00Z"}
 * @architectural-role Hook
 * @description
 * A utility hook that proactively triggers the download of code for lazy-loaded
 * components in the background after the initial page is interactive.
 * @core-principles
 * 1. IS a pure utility for performance optimization.
 * 2. MUST operate as a side effect after the main component has mounted.
 * 3. ORCHESTRATES the pre-fetching of specified code chunks to improve subsequent navigation speed.
 * @api-declaration
 *   - default: The useRoutePreloader hook.
 * @contract
 *   assertions:
 *     purity: mutates # This hook's purpose is to trigger a side effect (network requests).
 *     state_ownership: none
 *     external_io: none
 */

import { useEffect } from 'react';

type ComponentLoader = () => Promise<any>;

/**
 * A hook to proactively preload lazy-loaded route components in the background.
 * @param loaderFns An array of dynamic import functions to execute.
 */
export function useRoutePreloader(loaderFns: ComponentLoader[]) {
  useEffect(() => {
    // Wait for the application to be idle before starting the preload.
    const timer = setTimeout(() => {
      // Trigger each dynamic import. The browser will fetch and cache the code.
      loaderFns.forEach(load => load());
    }, 2000); // 2-second delay

    return () => clearTimeout(timer);
  }, [loaderFns]); // The array of functions is stable, so this runs once on mount.
}