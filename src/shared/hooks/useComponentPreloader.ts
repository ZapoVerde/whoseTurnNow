/**
 * @file packages/whoseturnnow/src/shared/hooks/useComponentPreloader.ts
 * @stamp {"ts":"2025-10-23T11:20:00Z"}
 * @architectural-role Hook
 * @description
 * A utility hook for performance optimization. It proactively triggers the
 * download of code for lazy-loaded components in the background after the
 * initial page is interactive, improving perceived performance on subsequent
 * navigations.
 * @core-principles
 * 1. IS a pure utility for performance optimization.
 * 2. MUST operate as a side effect after the main component has mounted.
 * 3. ORCHESTRATES the pre-fetching of specified code chunks to improve
 *    subsequent interaction speed.
 * @api-declaration
 *   - default: The useComponentPreloader hook.
 * @contract
 *   assertions:
 *     purity: mutates # This hook's purpose is to trigger a side effect (network requests).
 *     state_ownership: none
 *     external_io: none
 */

import { useEffect } from 'react';

type ComponentLoader = () => Promise<any>;

/**
 * A hook to proactively preload lazy-loaded components in the background.
 * @param loaderFns An array of dynamic import functions to execute.
 */
export function useComponentPreloader(loaderFns: ComponentLoader[]) {
  useEffect(() => {
    // Wait for a short period after the component mounts to ensure the main
    // thread is idle before starting the preload.
    const timer = setTimeout(() => {
      // Trigger each dynamic import. The browser will fetch and cache the
      // code without executing it until it's actually rendered.
      console.log('[Preloader] Pre-fetching assets...');
      loaderFns.forEach((load) => load());
    }, 2000); // 2-second delay is a safe default.

    // Cleanup the timer if the component unmounts before it fires.
    return () => clearTimeout(timer);
  }, [loaderFns]); // The dependency array is stable, so this runs once on mount.
}