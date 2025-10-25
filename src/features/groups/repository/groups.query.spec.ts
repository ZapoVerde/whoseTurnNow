// packages/whoseturnnow/src/features/groups/repository/groups.query.spec.ts

/**
 * @file packages/whoseturnnow/src/features/groups/repository/groups.query.spec.ts
 * @stamp {"ts":"2025-10-25T05:10:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/repository/groups.query.ts
 *
 * @description
 * Verifies the correctness and resilience of the data query layer, with a
 * specific focus on the "Circuit Breaker" pattern implemented in the
 * `createResilientListener` helper and other query functions.
 *
 * @criticality
 * Critical (Reason: I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on the state of mocked modules.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
import { onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { getUserGroups, getGroup, getGroupTurnLog } from './groups.query';
import type { Group, LogEntry } from '../../../types/group';
import type { FirestoreError } from 'firebase/firestore';

// --- Mocks ---
vi.mock('../../../shared/store/useAppStatusStore');

const mockOnSnapshot = vi.mocked(onSnapshot);
const mockGetDocs = vi.mocked(getDocs);
const mockGetDoc = vi.mocked(getDoc);
const mockSetConnectionMode = vi.fn();

// --- Test Data ---
const mockGroupData: Group = { gid: 'group-1', name: 'Group One' } as Group;
const mockGroupsData: Group[] = [mockGroupData];
const mockLogData: (LogEntry & { id: string })[] = [
  { id: 'log-1', type: 'TURN_COMPLETED' } as any,
];

describe('groups.query (Circuit Breaker)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppStatusStore.getState).mockReturnValue({
      setConnectionMode: mockSetConnectionMode,
      connectionMode: 'live',
    });
  });

  describe('Collection Listener (`getUserGroups`)', () => {
    it('should establish a real-time listener and update data in "live" mode', async () => {
      // ARRANGE
      const mockOnUpdate = vi.fn();
      const mockUnsubscribe = vi.fn();
      let onNextCallback: (snapshot: any) => void = () => {};

      mockOnSnapshot.mockImplementation((...args: any[]) => {
        onNextCallback = args[1];
        return mockUnsubscribe;
      });

      // ACT
      const unsubscribe = getUserGroups('test-user-id', mockOnUpdate);
      onNextCallback({ docs: mockGroupsData.map((g) => ({ data: () => g })) });

      // ASSERT
      expect(mockOnUpdate).toHaveBeenCalledWith(mockGroupsData);
      expect(mockGetDocs).not.toHaveBeenCalled();
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("should trip and fall back to a static fetch on a resource-exhausted error", async () => {
      // ARRANGE
      const mockOnUpdate = vi.fn();
      const mockError: Partial<FirestoreError> = { code: 'resource-exhausted' };
      let onErrorCallback: (error: FirestoreError) => void = () => {};

      mockOnSnapshot.mockImplementation((...args: any[]) => {
        if (args[2]) onErrorCallback = args[2];
        return vi.fn();
      });
      mockGetDocs.mockResolvedValue({
        docs: mockGroupsData.map((g) => ({ data: () => g })),
      } as any);

      // ACT
      getUserGroups('test-user-id', mockOnUpdate);
      onErrorCallback(mockError as FirestoreError);

      // ASSERT
      await vi.waitFor(() => {
        expect(mockSetConnectionMode).toHaveBeenCalledWith('degraded');
        expect(mockGetDocs).toHaveBeenCalledTimes(1);
        expect(mockOnUpdate).toHaveBeenCalledWith(mockGroupsData);
      });
    });

    it('should NOT trip the circuit breaker for other types of errors', async () => {
        // ARRANGE
        const mockOnUpdate = vi.fn();
        const mockError: Partial<FirestoreError> = { code: 'permission-denied' };
        let onErrorCallback: (error: FirestoreError) => void = () => {};

        mockOnSnapshot.mockImplementation((...args: any[]) => {
            if (args[2]) onErrorCallback = args[2];
            return vi.fn();
        });

        // ACT
        getUserGroups('test-user-id', mockOnUpdate);
        onErrorCallback(mockError as FirestoreError);

        // ASSERT
        await vi.waitFor(() => {
            expect(mockSetConnectionMode).not.toHaveBeenCalledWith('degraded');
            expect(mockGetDocs).not.toHaveBeenCalled();
            expect(mockOnUpdate).not.toHaveBeenCalled();
        });
    });
  });

  describe('Single Document Listener (`getGroup`)', () => {
    it('should establish a listener and update data in "live" mode', () => {
      // ARRANGE
      const mockOnUpdate = vi.fn();
      let onNextCallback: (snapshot: any) => void = () => {};

      mockOnSnapshot.mockImplementation((...args: any[]) => {
        onNextCallback = args[1];
        return vi.fn();
      });

      // ACT
      getGroup('group-1', mockOnUpdate);
      onNextCallback({ exists: () => true, data: () => mockGroupData });

      // ASSERT
      expect(mockOnUpdate).toHaveBeenCalledWith(mockGroupData);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('should trip and fall back to a static fetch on a resource-exhausted error', async () => {
      // ARRANGE
      const mockOnUpdate = vi.fn();
      const mockError: Partial<FirestoreError> = { code: 'resource-exhausted' };
      let onErrorCallback: (error: FirestoreError) => void = () => {};

      mockOnSnapshot.mockImplementation((...args: any[]) => {
        if (args[2]) onErrorCallback = args[2];
        return vi.fn();
      });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockGroupData,
      } as any);

      // ACT
      getGroup('group-1', mockOnUpdate);
      onErrorCallback(mockError as FirestoreError);

      // ASSERT
      await vi.waitFor(() => {
        expect(mockSetConnectionMode).toHaveBeenCalledWith('degraded');
        expect(mockGetDoc).toHaveBeenCalledTimes(1);
        expect(mockOnUpdate).toHaveBeenCalledWith(mockGroupData);
      });
    });
  });

  describe('Turn Log Listener (`getGroupTurnLog`) - Separate Implementation', () => {
    it('should establish a listener and update data in "live" mode', () => {
        // ARRANGE
        const mockOnUpdate = vi.fn();
        let onNextCallback: (snapshot: any) => void = () => {};

        mockOnSnapshot.mockImplementation((...args: any[]) => {
            onNextCallback = args[1];
            return vi.fn();
        });

        // ACT
        getGroupTurnLog('group-1', mockOnUpdate);
        onNextCallback({ docs: mockLogData.map(log => ({ id: log.id, data: () => log })) });

        // ASSERT
        expect(mockOnUpdate).toHaveBeenCalledWith(mockLogData);
        expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('should trip and fall back to a static fetch on a resource-exhausted error', async () => {
        // ARRANGE
        const mockOnUpdate = vi.fn();
        const mockError: Partial<FirestoreError> = { code: 'resource-exhausted' };
        let onErrorCallback: (error: FirestoreError) => void = () => {};

        mockOnSnapshot.mockImplementation((...args: any[]) => {
            if (args[2]) onErrorCallback = args[2];
            return vi.fn();
        });
        mockGetDocs.mockResolvedValue({
            docs: mockLogData.map(log => ({ id: log.id, data: () => log })),
        } as any);

        // ACT
        getGroupTurnLog('group-1', mockOnUpdate);
        onErrorCallback(mockError as FirestoreError);

        // ASSERT
        await vi.waitFor(() => {
            expect(mockSetConnectionMode).toHaveBeenCalledWith('degraded');
            expect(mockGetDocs).toHaveBeenCalledTimes(1);
            expect(mockOnUpdate).toHaveBeenCalledWith(mockLogData);
        });
    });
  });
});