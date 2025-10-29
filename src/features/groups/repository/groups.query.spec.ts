/**
 * @file packages/whoseturnnow/src/features/groups/repository/groups.query.spec.ts
 * @stamp {"ts":"2025-10-25T12:50:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/repository/groups.query.ts
 *
 * @description
 * Verifies the "Circuit Breaker" pattern by directly testing the exported
 * `handleListenerError` function, ensuring it correctly falls back to a
 * static fetch when a `resource-exhausted` error is encountered.
 *
 * @criticality
 * Critical (Reason: I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only
 *     state_ownership: none
 *     external_io: none
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs } from 'firebase/firestore';
import { useAppStatusStore } from '../../../shared/store/useAppStatusStore';
// Import the new, directly testable function
import { handleListenerError } from './groups.query';
import type { FirestoreError, Query } from 'firebase/firestore';

// --- Mocks ---
vi.mock('../../../shared/store/useAppStatusStore');
vi.mock('../../../shared/utils/debug');

// We only need to mock getDocs now, as onSnapshot is no longer part of the test.
const mockGetDocs = vi.mocked(getDocs);
const mockSetConnectionMode = vi.fn();

describe('groups.query error handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppStatusStore.getState).mockReturnValue({
      setConnectionMode: mockSetConnectionMode,
      connectionMode: 'live',
    });
    mockGetDocs.mockResolvedValue({ docs: [] } as any);
  });

  it('should trip the circuit breaker and fall back to a static fetch', async () => {
    // ARRANGE
    const mockError: Partial<FirestoreError> = { code: 'resource-exhausted' };
    const mockQuery = { type: 'query' } as Query; // A simple mock query object
    const mockOnUpdate = vi.fn();
    const mockTransform = vi.fn((snapshot) => snapshot.docs);

    // ACT: Directly call and await our business logic function. No more complex mocks needed.
    await handleListenerError(
      mockError as FirestoreError,
      mockQuery,
      mockOnUpdate,
      mockTransform,
    );

    // ASSERT
    expect(mockSetConnectionMode).toHaveBeenCalledWith('degraded');
    expect(mockGetDocs).toHaveBeenCalledWith(mockQuery);
    expect(mockOnUpdate).toHaveBeenCalledWith([]); // From the transformed mockGetDocs result
  });
});