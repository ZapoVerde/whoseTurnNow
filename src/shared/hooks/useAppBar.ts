/**
 * @file packages/whoseturnnow/src/shared/hooks/useAppBar.ts
 * @stamp {"ts":"2025-10-22T18:35:00Z"}
 * @architectural-role Hook
 * @description
 * A controller hook that manages the lifecycle of AppBar configuration. Components
 * use this hook to set the global AppBar's state upon mounting and automatically
 * reset it upon unmounting.
 * @core-principles
 * 1. IS a pure controller for managing AppBar state over a component's lifecycle.
 * 2. MUST use a `useEffect` hook to apply and clean up its state changes.
 * 3. DELEGATES all state storage to the `useAppBarStore`.
 * @api-declaration
 *   - default: The useAppBar hook.
 * @contract
 *   assertions:
 *     purity: mutates # This hook's purpose is to trigger side effects on a global store.
 *     state_ownership: none
 *     external_io: none
 */

import { useEffect } from 'react';
import { useAppBarStore, type AppBarState } from '../store/useAppBarStore';

type AppBarConfig = Partial<Omit<AppBarState, 'setConfig' | 'reset'>>;

/**
 * A hook to declaratively control the global AppBar's state for the lifecycle
 * of the component that uses it.
 * @param config The desired AppBar configuration to apply.
 */
export function useAppBar(config: AppBarConfig) {
  const { setConfig, reset } = useAppBarStore();

  useEffect(() => {
    // On mount, apply the new configuration.
    setConfig(config);

    // On unmount, reset the configuration to its default state.
    return () => {
      reset();
    };
  }, [config, setConfig, reset]); // Re-run if the config object changes.
}