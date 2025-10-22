Acknowledged. Proceeding directly to the Test Assessment phase as requested.

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/types/group.ts`**: No test file required (Reason: Type definition file with no runtime logic).
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: Requires new/updated test file (Reason: Changes introduce critical I/O and business logic for the core turn-taking transaction).
*   **`packages/whoseturnnow/src/features/groups/useGroupStore.ts`**: Requires new/updated test file (Reason: Critical State Store Ownership; testing is required to prevent logical regressions in state management for the active group).
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete and non-trivial user interaction path, covering the entire turn-taking cycle).

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/types/group.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts`
*   `packages/whoseturnnow/src/features/groups/useGroupStore.ts`
*   `packages/whoseturnnow/src/features/groups/useGroupStore.spec.ts`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/types/group.ts`**: This file will be updated to include the data definitions for the turn log. It will introduce the `TurnCompletedLog` type and a union `LogEntry` type to ensure type safety for all audit trail interactions.
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: This repository will be expanded to include all the data-layer logic for the turn-taking cycle. New functions will be added to handle adding a managed participant, fetching the turn log for a group, and executing the core, atomic transaction for completing a turn.
*   **`packages/whoseturnnow/src/features/groups/useGroupStore.ts`**: This new file will create a dedicated Zustand store to manage the real-time state of the currently viewed group. It will hold the `Group` object and its associated `turnLog`, and provide actions to load and update this data, serving as the client-side source of truth for the `GroupDetailScreen`.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: This screen will be heavily refactored from a read-only view into the application's primary interactive hub. It will subscribe to the new `useGroupStore` to render the dynamic turn queue. It will contain the logic to determine the state of the "smart action button" and will call the `completeTurnTransaction` repository function upon user interaction. It will also render the real-time Turn History log.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/types/group.ts`**
    *   **Symbol:** `TurnCompletedLog`
        *   **Before:** None.
        *   **After:** `export interface TurnCompletedLog { ... }`
    *   **Symbol:** `LogEntry`
        *   **Before:** None.
        *   **After:** `export type LogEntry = TurnCompletedLog;`
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**
    *   **Symbol:** `addManagedParticipant`
        *   **Before:** None.
        *   **After:** `export async function addManagedParticipant(groupId: string, participantName: string): Promise<void>`
    *   **Symbol:** `getGroupTurnLog`
        *   **Before:** None.
        *   **After:** `export function getGroupTurnLog(groupId: string, onUpdate: (logs: LogEntry[]) => void): Unsubscribe`
    *   **Symbol:** `completeTurnTransaction`
        *   **Before:** None.
        *   **After:** `export async function completeTurnTransaction(groupId: string, actor: AppUser, participantToMoveId: string): Promise<void>`
*   **`packages/whoseturnnow/src/features/groups/useGroupStore.ts`**
    *   **Symbol:** `useGroupStore`
        *   **Before:** None.
        *   **After:** `export const useGroupStore: UseBoundStore<StoreApi<GroupState>>`
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**
    *   None.

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Expand Data Layer and State Management for Turn-Taking

#### Task 1.1: `packages/whoseturnnow/src/types/group.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Domain Model Definition)
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/types/group.ts
     * @architectural-role Type Definition
     * @description Defines the canonical data structures for the application's core domain, including `Group`, `TurnParticipant`, and all `LogEntry` variants.
     * @core-principles
     * 1. IS the single source of truth for the shape of all group-related data.
     * 2. OWNS the core domain model definitions.
     * 3. MUST be platform-agnostic.
     */
    

#### Task 1.2: `packages/whoseturnnow/src/features/groups/groupsRepository.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @architectural-role Data Repository
     * @description Encapsulates all Firestore interactions for the `groups` collection, providing a dedicated data access layer for creating, fetching, and modifying group data.
     * @core-principles
     * 1. OWNS all I/O logic for group data and its sub-collections.
     * 2. MUST be the only module that directly interacts with the Firestore `groups` collection.
     * 3. ENFORCES data consistency through atomic transactions for state-changing operations.
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @description Verifies the correctness of all Firestore interactions for the groups repository, including the atomic turn completion transaction.
     * @criticality Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

#### Task 1.4: `packages/whoseturnnow/src/features/groups/useGroupStore.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: State Store Ownership, High Fan-Out)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/useGroupStore.ts
     * @architectural-role State Management
     * @description Defines the Zustand store for managing the real-time state of the currently active group, including its details and turn log.
     * @core-principles
     * 1. IS the single source of truth for the currently viewed group's state.
     * 2. OWNS the client-side representation of the active `Group` and its `LogEntry` collection.
     * 3. MUST be updated via its exposed action handlers.
     */
    

#### Task 1.5: `packages/whoseturnnow/src/features/groups/useGroupStore.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/useGroupStore.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/useGroupStore.ts
     * @description Verifies the state transitions and actions of the active group store.
     * @criticality Critical (Reason: State Store Ownership)
     * @testing-layer Unit
     */
    

---
### Phase 2: Implement Interactive Turn Cycle UI

#### Task 2.1: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Renders the primary interactive view for a single group, orchestrating the display of the turn queue, the context-aware action button, and the turn history.
     * @core-principles
     * 1. IS the main user interface for the core turn-taking loop.
     * 2. OWNS the client-side logic for determining the state of the smart action button.
     * 3. DELEGATES all data fetching and state mutations to the `useGroupStore` and `groupsRepository`.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @description Verifies the entire turn-taking user flow, ensuring the UI correctly reflects the state of the turn queue and that user actions correctly trigger repository functions.
     * @criticality Critical (Reason: Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    
---

