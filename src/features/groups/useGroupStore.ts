/**
 * @file packages/whoseturnnow/src/features/groups/useGroupStore.ts
 * @stamp {"ts":"2025-10-23T10:25:00Z"}
 * @architectural-role State Management
 *
 * @description
 * Defines the Zustand store for managing the real-time state of the currently
 * active group, including its details and turn log. This store is the single
 * source of truth for the `GroupDetailScreen`.
 *
 * @core-principles
 * 1. IS the single source of truth for the currently viewed group's state.
 * 2. OWNS the client-side representation of the active `Group` and its `LogEntry` collection.
 * 3. MUST be updated only via its exposed action handlers, which orchestrate data
 *    fetching and subscriptions by delegating to the `repository`.
 *
 * @api-declaration
 *   - `useGroupStore`: The exported Zustand store hook for the active group.
 *
 * @contract
 *   assertions:
 *     purity: mutates # This is a state store; its purpose is to manage mutable state.
 *     state_ownership: [group, turnLog, isLoading] # It exclusively owns the state for the active group view.
 *     external_io: none # It delegates all I/O to the repository, only managing the results.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Unsubscribe } from 'firebase/firestore';
// --- FIX: Import from the new repository facade ---
import { groupsRepository } from './repository';
import type { Group, LogEntry } from '../../types/group';

interface GroupState {
  group: Group | null;
  turnLog: (LogEntry & { id: string })[];
  isLoading: boolean;
  _unsubscribeGroup: Unsubscribe | null;
  _unsubscribeLog: Unsubscribe | null;
  loadGroupAndLog: (groupId: string) => void;
  setGroup: (group: Group) => void;
  cleanup: () => void;
}

const initialState: Omit<GroupState, 'loadGroupAndLog' | 'cleanup' | 'setGroup'> = {
  group: null,
  turnLog: [],
  isLoading: true,
  _unsubscribeGroup: null,
  _unsubscribeLog: null,
};

export const useGroupStore = create<GroupState>()(
  immer((set, get) => ({
    ...initialState,

    setGroup: (group) =>
      set((state) => {
        state.group = group;
      }),

    loadGroupAndLog: (groupId) => {
      get().cleanup();

      set((state) => {
        state.isLoading = true;
      });

      const unsubGroup = groupsRepository.getGroup(groupId, (groupData) => {
        set((state) => {
          state.group = groupData;
          state.isLoading = false;
        });
      });

      const unsubLog = groupsRepository.getGroupTurnLog(groupId, (logData) => {
        set((state) => {
          state.turnLog = logData;
        });
      });

      set((state) => {
        state._unsubscribeGroup = unsubGroup;
        state._unsubscribeLog = unsubLog;
      });
    },

    cleanup: () => {
      const { _unsubscribeGroup, _unsubscribeLog } = get();
      if (_unsubscribeGroup) {
        _unsubscribeGroup();
      }
      if (_unsubscribeLog) {
        _unsubscribeLog();
      }
      set(initialState);
    },
  })),
);