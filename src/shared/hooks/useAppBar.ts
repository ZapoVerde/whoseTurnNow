/**
 * @file packages/whoseturnnow/src/shared/hooks/useAppBar.ts
 * @stamp {"ts":"2025-10-23T01:45:00Z"}
 * @architectural-role Hook
 * @description
 * A "smart" controller hook that manages the lifecycle of AppBar configuration.
 * It intelligently compares the desired state with the current state in the
 * global store, preventing unnecessary re-renders and breaking potential
 * infinite loops caused by React 18's Strict Mode.
 * @core-principles
 * 1. IS a "smart" controller for managing AppBar state over a component's lifecycle.
 * 2. MUST prevent unnecessary state updates by comparing the desired configuration with the current state before dispatching an action.
 * 3. MUST use a `useEffect` hook to apply its state changes as a side effect.
 * 4. DELEGATES all state storage to the "dumb" `useAppBarStore`.
 * @api-declaration
 *   - default: The `useAppBar` hook.
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
 * A hook to declaratively and safely control the global AppBar's state for the
 * lifecycle of the component that uses it.
 * @param config The desired AppBar configuration to apply.
 */
export function useAppBar(config: AppBarConfig) {
  // Get a stable reference to the setConfig function from the store.
  const setConfig = useAppBarStore((state) => state.setConfig);

  useEffect(() => {
    // Inside the effect, get the *current* state directly from the store.
    const currentState = useAppBarStore.getState();

    // Determine if the new config would actually change any values.
    const hasChanged =
      (config.title !== undefined && config.title !== currentState.title) ||
      (config.actions !== undefined && config.actions !== currentState.actions) ||
      (config.showBackButton !== undefined && config.showBackButton !== currentState.showBackButton);

    // Only update the store if there is a real, meaningful change. This is the
    // crucial step that breaks the infinite loop caused by Strict Mode's
    // double-invocation of useEffect. The second call will find no changes
    // and will not trigger a state update, thus stopping the cycle.
    if (hasChanged) {
      setConfig(config);
    }
  }, [config, setConfig]); // The dependency array ensures this effect re-evaluates if the config object changes.
}