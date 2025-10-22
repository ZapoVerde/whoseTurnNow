/**
 * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
 * @stamp {"ts":"2025-10-21T17:10:00Z"}
 * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
 *
 * @description
 * Verifies the correctness of all Firestore interactions for the groups repository,
 * including the complex atomic transaction for the undo feature.
 *
 * @criticality
 * Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file only asserts on mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Imports ---
import { db } from '../../lib/firebase';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  runTransaction,
  orderBy,
  limit,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  createGroup,
  getUserGroups,
  getGroup,
  addManagedParticipant,
  getGroupTurnLog,
  completeTurnTransaction,
  updateParticipantRole,
  removeParticipant,
  resetAllTurnCounts,
  updateGroupSettings,
  leaveGroup,
  deleteGroup,
  joinGroupAsNewParticipant,
  claimPlaceholder,
  undoTurnTransaction, // <-- New import
} from './groupsRepository';
import type { AppUser } from '../auth/useAuthStore';
import type {
  Group,
  TurnParticipant,
  TurnCompletedLog,
  CountsResetLog,
  TurnUndoneLog, // <-- New import
} from '../../types/group';

// --- Test Setup ---
const mockDoc = vi.mocked(doc);
const mockSetDoc = vi.mocked(setDoc);
const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockOnSnapshot = vi.mocked(onSnapshot);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockArrayUnion = vi.mocked(arrayUnion);
const mockArrayRemove = vi.mocked(arrayRemove); // Added
const mockRunTransaction = vi.mocked(runTransaction);
const mockOrderBy = vi.mocked(orderBy);
const mockLimit = vi.mocked(limit);
const mockGetDoc = vi.mocked(getDoc);          // Added
const mockDeleteDoc = vi.mocked(deleteDoc);      // Added
const mockUuidv4 = vi.mocked(uuidv4);

describe('groupsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockReturnValue(() => {});
  });

  describe('createGroup', () => {
    it('should construct and save a new group document correctly', async () => {
      // ARRANGE
      const mockCreator: AppUser = {
        uid: 'user-creator-123',
        displayName: 'Creator',
        isAnonymous: false,
      };
      (mockUuidv4 as any)
        .mockReturnValueOnce('new-group-id')
        .mockReturnValueOnce('new-participant-id');
      mockSetDoc.mockResolvedValue(undefined);

      // ACT
      const resultGid = await createGroup({
        name: 'Test Group',
        icon: '🧪',
        creator: mockCreator,
      });

      // ASSERT
      expect(resultGid).toBe('new-group-id');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const savedGroup = mockSetDoc.mock.calls[0][1] as Group;
      expect(savedGroup.gid).toBe('new-group-id');
      expect(savedGroup.participants[0].id).toBe('new-participant-id');
    });
  });

  describe('getUserGroups', () => {
    it('should set up a real-time listener using the correct query and update the callback', () => {
      // ARRANGE
      const mockUserId = 'observer-123';
      const mockOnUpdate = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockImplementation((_query, callback) => {
        const mockSnapshot = { docs: [] };
        (callback as any)(mockSnapshot);
        return mockUnsubscribe;
      });

      // ACT
      const unsubscribe = getUserGroups(mockUserId, mockOnUpdate);

      // ASSERT
      expect(mockWhere).toHaveBeenCalledWith(
        'participantUids',
        'array-contains',
        mockUserId,
      );
      expect(mockOnUpdate).toHaveBeenCalledWith([]);

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGroup', () => {
    it('should set up a listener for a single group document', () => {
      // ARRANGE
      const mockGroupId = 'group-to-get-123';
      const mockOnUpdate = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // ACT
      const unsubscribe = getGroup(mockGroupId, mockOnUpdate);
      unsubscribe(); // Call the returned function

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'groups', mockGroupId);
      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('addManagedParticipant', () => {
    it('should call updateDoc with arrayUnion for participants and turnOrder', async () => {
      // ARRANGE
      const mockGroupId = 'group-to-update-456';
      const mockParticipantName = 'New Player';
      const mockParticipantId = 'new-participant-id-abc';
      (mockUuidv4 as any).mockReturnValue(mockParticipantId);
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await addManagedParticipant(mockGroupId, mockParticipantName);

      // ASSERT
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

      // We can't easily assert on the return value of arrayUnion,
      // but we can check that it was called with the correct data.
      expect(mockArrayUnion).toHaveBeenCalledTimes(2);

      const expectedParticipant: Omit<TurnParticipant, 'id'> = {
        uid: null,
        nickname: mockParticipantName,
        role: 'member',
        turnCount: 0,
      };
      
      // Check the payload passed to the first arrayUnion call (participants)
      const participantPayload = (mockArrayUnion.mock.calls[0][0] as TurnParticipant);
      expect(participantPayload.id).toBe(mockParticipantId);
      expect(participantPayload).toMatchObject(expectedParticipant);


      // Check the payload passed to the second arrayUnion call (turnOrder)
      expect(mockArrayUnion).toHaveBeenCalledWith(mockParticipantId);
    });
  });

  describe('getGroupTurnLog', () => {
    it('should query the turnLog sub-collection with correct ordering', () => {
      // ARRANGE
      const mockGroupId = 'group-with-logs-789';
      const mockOnUpdate = vi.fn();

      // ACT
      getGroupTurnLog(mockGroupId, mockOnUpdate);

      // ASSERT
      // 1. Verify it targets the correct sub-collection
      expect(mockCollection).toHaveBeenCalledWith(
        db,
        'groups',
        mockGroupId,
        'turnLog',
      );

      // 2. Verify it constructs the query with the right ordering and limit
      expect(mockOrderBy).toHaveBeenCalledWith('completedAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // 3. Verify it sets up the listener on that query
      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeTurnTransaction', () => {
    it('should successfully update group state and create a log entry in a transaction', async () => {
      // ARRANGE
      const mockGroupId = 'tx-group-1';
      const mockActor: AppUser = { uid: 'actor-1', displayName: 'Actor', isAnonymous: false };
      const participantToMoveId = 'p-1'; // The participant at the top of the queue
      
      const initialGroupState: Group = {
        gid: mockGroupId,
        name: 'Transaction Test',
        icon: '💼',
        ownerUid: 'owner',
        participantUids: ['user-1', 'user-2'],
        participants: [
          { id: participantToMoveId, uid: 'user-1', nickname: 'Alice', role: 'member', turnCount: 5 },
          { id: 'p-2', uid: 'user-2', nickname: 'Bob', role: 'member', turnCount: 5 },
        ],
        turnOrder: [participantToMoveId, 'p-2'],
      };

      // Mock the transaction's get() call to return our initial group state
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialGroupState,
        }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      // Mock runTransaction to immediately execute the callback with our mock transaction object
      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        return await updateFunction(mockTransaction);
      });

      // ACT
      await completeTurnTransaction(mockGroupId, mockActor, participantToMoveId);

      // ASSERT
      // 1. Verify the transaction was initiated
      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      
      // 2. Verify the group state was correctly updated
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockTransaction.update.mock.calls[0][1];
      expect(updatePayload.turnOrder).toEqual(['p-2', participantToMoveId]); // p-1 moved to the end
      expect(updatePayload.participants[0].turnCount).toBe(6); // Alice's turn count incremented
      expect(updatePayload.participants[1].turnCount).toBe(5); // Bob's turn count is unchanged

      // 3. Verify a new log entry was created
      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const logPayload = mockTransaction.set.mock.calls[0][1] as TurnCompletedLog;
      expect(logPayload.type).toBe('TURN_COMPLETED');
      expect(logPayload.participantId).toBe(participantToMoveId);
      expect(logPayload.participantName).toBe('Alice');
      expect(logPayload.actorUid).toBe(mockActor.uid);
      expect(logPayload.actorName).toBe(mockActor.displayName);
    });

    it('should throw an error if the group document does not exist', async () => {
      // ARRANGE
      const mockGroupId = 'non-existent-group';
      const mockActor: AppUser = { uid: 'actor-1', displayName: 'Actor', isAnonymous: false };
      const participantToMoveId = 'p-1';

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => false, // Simulate the document not being found
        }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        // This will now throw because the document doesn't exist.
        return await updateFunction(mockTransaction);
      });

      // ACT & ASSERT
      // We expect the promise to be rejected with a specific error.
      await expect(
        completeTurnTransaction(mockGroupId, mockActor, participantToMoveId)
      ).rejects.toThrow(`Group with ID ${mockGroupId} does not exist.`);

      // Verify that no write operations were attempted.
      expect(mockTransaction.update).not.toHaveBeenCalled();
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });
  });
  
  // --- NEW TEST BLOCKS ---
  describe('updateParticipantRole', () => {
    it('should correctly update the participants array with the new role', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const participantIdToUpdate = 'p-2';
      const newRole = 'admin';

      const initialParticipants: TurnParticipant[] = [
        { id: 'p-1', uid: 'u-1', role: 'admin', turnCount: 1, nickname: 'A' },
        { id: 'p-2', uid: 'u-2', role: 'member', turnCount: 2, nickname: 'B' },
      ];
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ participants: initialParticipants }),
      } as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await updateParticipantRole(groupId, participantIdToUpdate, newRole);

      // ASSERT
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      
      // Assert that the payload is an object with a 'participants' property
      const updatePayload = mockUpdateDoc.mock.calls[0][1] as unknown as { participants: TurnParticipant[] };

      // Now this line is type-safe and the second cast is unnecessary
      const updatedParticipants = updatePayload.participants;
      
      expect(updatedParticipants.find(p => p.id === 'p-1')?.role).toBe('admin');
      expect(updatedParticipants.find(p => p.id === 'p-2')?.role).toBe('admin'); // Role was updated
    });
  });

  describe('removeParticipant', () => {
    it('should update participants, turnOrder, and participantUids', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const participantIdToRemove = 'p-2';
      const uidToRemove = 'u-2';

      const initialParticipants: TurnParticipant[] = [
        { id: 'p-1', uid: 'u-1', role: 'admin', turnCount: 1, nickname: 'A' },
        { id: participantIdToRemove, uid: uidToRemove, role: 'member', turnCount: 2, nickname: 'B' },
      ];
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ participants: initialParticipants }),
      } as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await removeParticipant(groupId, participantIdToRemove);

      // ASSERT
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

      // This is all you need. 'updatePayload' is now correctly typed.
      const updatePayload = mockUpdateDoc.mock.calls[0][1] as unknown as { 
        participants: TurnParticipant[] 
        // You can add other expected properties here too, like turnOrder
      };
            
      // 1. Check participants array was filtered
      // You can use 'updatePayload.participants' directly. It's already typed correctly.
      expect(updatePayload.participants.length).toBe(1);
      expect(updatePayload.participants[0].id).toBe('p-1');

      // 2. Check that arrayRemove was called for turnOrder and participantUids
      expect(mockArrayRemove).toHaveBeenCalledTimes(2);
      expect(mockArrayRemove).toHaveBeenCalledWith(participantIdToRemove); // for turnOrder
      expect(mockArrayRemove).toHaveBeenCalledWith(uidToRemove);            // for participantUids
    });
  });

  describe('resetAllTurnCounts', () => {
    it('should reset all counts to zero and create a log entry in a transaction', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const actor: AppUser = { uid: 'admin-user', displayName: 'Admin', isAnonymous: false };
      
      const initialParticipants: TurnParticipant[] = [
        { id: 'p-1', uid: 'u-1', role: 'admin', turnCount: 10, nickname: 'A' },
        { id: 'p-2', uid: 'u-2', role: 'member', turnCount: 20, nickname: 'B' },
      ];
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ participants: initialParticipants }),
        }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        return await updateFunction(mockTransaction);
      });

      // ACT
      await resetAllTurnCounts(groupId, actor);

      // ASSERT
      // 1. Verify transaction update payload
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockTransaction.update.mock.calls[0][1] as { participants: TurnParticipant[] };
      expect(updatePayload.participants[0].turnCount).toBe(0);
      expect(updatePayload.participants[1].turnCount).toBe(0);

      // 2. Verify transaction set payload (log entry)
      expect(mockTransaction.set).toHaveBeenCalledTimes(1);
      const logPayload = mockTransaction.set.mock.calls[0][1] as CountsResetLog;
      expect(logPayload.type).toBe('COUNTS_RESET');
      expect(logPayload.actorUid).toBe(actor.uid);
      expect(logPayload.actorName).toBe(actor.displayName);
    });
  });

  describe('updateGroupSettings', () => {
    it('should call updateDoc with the new name and icon', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const newSettings = { name: 'New Group Name', icon: '🎉' };
      const mockDocRef = { id: 'mock-ref' }; // A simple placeholder object
      
      // Tell mockDoc what to return
      mockDoc.mockReturnValue(mockDocRef as any); 
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await updateGroupSettings(groupId, newSettings);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'groups', groupId); // Verify doc() was called correctly
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      // Verify updateDoc was called with the object that doc() returned
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        mockDocRef, 
        newSettings
      );
    });
  });

  describe('leaveGroup', () => {
    it('should find the correct participant and call the underlying removal logic', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const userIdToLeave = 'u-2'; // The user who is leaving
      const participantIdToRemove = 'p-2'; // The corresponding participant ID

      const initialParticipants: TurnParticipant[] = [
        { id: 'p-1', uid: 'u-1', role: 'admin', turnCount: 1, nickname: 'A' },
        { id: participantIdToRemove, uid: userIdToLeave, role: 'member', turnCount: 2, nickname: 'B' },
      ];
       // Mock getDoc to return the full group so leaveGroup can find the participantId
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ participants: initialParticipants }),
      } as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await leaveGroup(groupId, userIdToLeave);

      // ASSERT
      // The primary assertion is that the underlying removal logic was triggered correctly.
      // We verify this by checking the same side effects as the removeParticipant test.
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updatePayload = mockUpdateDoc.mock.calls[0][1] as unknown as { participants: TurnParticipant[] };
      expect(updatePayload.participants.length).toBe(1);
      expect(updatePayload.participants[0].id).toBe('p-1');
      
      expect(mockArrayRemove).toHaveBeenCalledWith(participantIdToRemove);
      expect(mockArrayRemove).toHaveBeenCalledWith(userIdToLeave);
    });
  });

  describe('deleteGroup', () => {
    it('should call deleteDoc with the correct group document reference', async () => {
      // ARRANGE
      const groupId = 'group-to-delete';
      mockDeleteDoc.mockResolvedValue(undefined);
      const mockDocRef = {}; // A placeholder object for the document reference
      mockDoc.mockReturnValue(mockDocRef as any);

      // ACT
      await deleteGroup(groupId);

      // ASSERT
      expect(mockDoc).toHaveBeenCalledWith(db, 'groups', groupId);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
  });

  describe('joinGroupAsNewParticipant', () => {
    it('should call updateDoc with arrayUnion for all required fields', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const newUser: AppUser = { uid: 'new-user-1', displayName: 'New User', isAnonymous: false };
      const newParticipantId = 'new-participant-id';
      (mockUuidv4 as any).mockReturnValue(newParticipantId);
      mockUpdateDoc.mockResolvedValue(undefined);

      // ACT
      await joinGroupAsNewParticipant(groupId, newUser);

      // ASSERT
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      
      // We expect arrayUnion to be called 3 times, once for each field being updated.
      expect(mockArrayUnion).toHaveBeenCalledTimes(3);

      // 1. Verify the new participant object was added to the 'participants' array
      const expectedParticipant: Omit<TurnParticipant, 'id'> = {
        uid: newUser.uid,
        nickname: newUser.displayName ?? undefined,
        role: 'member',
        turnCount: 0,
      };
      // Find the call to arrayUnion that passed an object, and check it.
      const participantPayload = (mockArrayUnion.mock.calls.find(call => typeof call[0] === 'object')?.[0]) as TurnParticipant;
      expect(participantPayload).toBeDefined();
      expect(participantPayload.id).toBe(newParticipantId);
      expect(participantPayload).toMatchObject(expectedParticipant);


      // 2. Verify the new participant ID was added to the 'turnOrder' array
      expect(mockArrayUnion).toHaveBeenCalledWith(newParticipantId);

      // 3. Verify the new user's UID was added to the 'participantUids' array
      expect(mockArrayUnion).toHaveBeenCalledWith(newUser.uid);
    });
  });

  describe('claimPlaceholder', () => {
    it('should correctly update a placeholder participant with a user ID in a transaction', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const participantIdToClaim = 'p-placeholder';
      const newUser: AppUser = { uid: 'claimer-user', displayName: 'Claimer', isAnonymous: false };

      const initialGroup: Group = {
        gid: groupId,
        name: 'Test Group',
        icon: '🧪',
        ownerUid: 'owner',
        participantUids: ['u-1'], // Initially does not contain the new user
        participants: [
          { id: 'p-1', uid: 'u-1', role: 'member', turnCount: 1, nickname: 'A' },
          { id: participantIdToClaim, uid: null, role: 'member', turnCount: 0, nickname: 'Placeholder' },
        ],
        turnOrder: ['p-1', participantIdToClaim],
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialGroup,
        }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        await updateFunction(mockTransaction);
      });

      // ACT
      await claimPlaceholder(groupId, participantIdToClaim, newUser);

      // ASSERT
      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);

      const updatePayload = mockTransaction.update.mock.calls[0][1] as { participants: TurnParticipant[], participantUids: string[] };
      
      // 1. Verify the placeholder participant's UID was updated
      const claimedParticipant = updatePayload.participants.find(p => p.id === participantIdToClaim);
      expect(claimedParticipant).toBeDefined();
      expect(claimedParticipant?.uid).toBe(newUser.uid);

      // 2. Verify the denormalized UIDs array was updated
      expect(updatePayload.participantUids).toContain(newUser.uid);
      expect(updatePayload.participantUids).toEqual(['u-1', newUser.uid]);
    });

    it('should throw an error if the placeholder is already claimed', async () => {
      // ARRANGE
      const groupId = 'group-1';
      const participantIdToClaim = 'p-claimed';
      const newUser: AppUser = { uid: 'claimer-user', displayName: 'Claimer', isAnonymous: false };

      // Create an initial state where the target participant slot is NOT a placeholder (uid is not null)
      const initialGroup: Group = {
        gid: groupId,
        name: 'Test Group',
        icon: '🧪',
        ownerUid: 'owner',
        participantUids: ['u-1', 'already-claimed-uid'],
        participants: [
          { id: 'p-1', uid: 'u-1', role: 'member', turnCount: 1, nickname: 'A' },
          { id: participantIdToClaim, uid: 'already-claimed-uid', role: 'member', turnCount: 5, nickname: 'Already Taken' },
        ],
        turnOrder: ['p-1', participantIdToClaim],
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => initialGroup,
        }),
        update: vi.fn(), // This should NOT be called
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        // The updateFunction itself will throw the error
        await updateFunction(mockTransaction);
      });

      // ACT & ASSERT
      // Verify that calling the function rejects the promise with the specific error message.
      await expect(
        claimPlaceholder(groupId, participantIdToClaim, newUser)
      ).rejects.toThrow('This participant slot has already been claimed.');

      // Also, assert that no write operation was attempted.
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });
  });

  describe('undoTurnTransaction', () => {
    it('should revert state, create an undo log, and flag the original log', async () => {
      // ARRANGE
      const groupId = 'group-undo-1';
      const actor: AppUser = { uid: 'admin-user', displayName: 'Admin', isAnonymous: false };
      
      const logToUndo: TurnCompletedLog & { id: string } = {
        id: 'log-to-undo-id',
        type: 'TURN_COMPLETED',
        completedAt: {} as any,
        participantId: 'p-2', // Bob was the one who just took a turn
        participantName: 'Bob',
        actorUid: 'user-2',
        actorName: 'Bob',
        // NEW: This field is now required to match the updated type.
        _participantUids: ['user-1', 'user-2'], 
      };

      const initialState: Group = {
        gid: groupId, name: 'Undo Test', icon: '⏪', ownerUid: 'owner',
        participantUids: ['user-1', 'user-2'],
        participants: [
          { id: 'p-1', uid: 'user-1', nickname: 'Alice', role: 'member', turnCount: 5 },
          { id: 'p-2', uid: 'user-2', nickname: 'Bob', role: 'member', turnCount: 6 }, // Bob's count is 6
        ],
        turnOrder: ['p-1', 'p-2'], // Alice is next, Bob is at the end
      };

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => initialState }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      mockRunTransaction.mockImplementation(async (_db, updateFunction) => {
        return await updateFunction(mockTransaction);
      });

      // ACT
      await undoTurnTransaction(groupId, actor, logToUndo);

      // ASSERT
      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      
      // 1. Verify the group document was updated correctly
      const groupUpdateCall = mockTransaction.update.mock.calls.find(
        (call) => call[1] && 'turnOrder' in call[1],
      );
      
      expect(groupUpdateCall).toBeDefined();
      const groupUpdatePayload = groupUpdateCall![1];
      
      // Bob (p-2) should be moved back to the front
      expect(groupUpdatePayload.turnOrder).toEqual(['p-2', 'p-1']);
      
      // Bob's turn count should be decremented back to 5
      const revertedParticipant = groupUpdatePayload.participants.find((p: TurnParticipant) => p.id === 'p-2');
      expect(revertedParticipant.turnCount).toBe(5);

      // 2. Verify the new 'TURN_UNDONE' log was created with all fields
      const logSetCall = mockTransaction.set.mock.calls[0];
      const newLogPayload = logSetCall[1] as TurnUndoneLog;
      expect(newLogPayload.type).toBe('TURN_UNDONE');
      expect(newLogPayload.actorUid).toBe(actor.uid);
      expect(newLogPayload.originalParticipantName).toBe('Bob');
      // NEW: Verify the denormalized UIDs were copied to the new log entry.
      expect(newLogPayload._participantUids).toEqual(initialState.participantUids);

      // 3. Verify the original log was flagged as undone
      const originalLogUpdateCall = mockTransaction.update.mock.calls.find(
        (call) => call[1] && 'isUndone' in call[1],
      );
      
      expect(originalLogUpdateCall).toBeDefined();
      expect(originalLogUpdateCall![1]).toEqual({ isUndone: true });
    });
  });
});