Acknowledged. Proceeding directly to the Test Assessment phase as requested.

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/types/group.ts`**: No test file required (Reason: Type definition file with no runtime logic).
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: Requires new/updated test file (Reason: Changes introduce a critical, complex atomic transaction for the undo feature).
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete, non-trivial user interaction path for the entire undo flow, including permission checks).

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/types/group.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/types/group.ts`**: This file will be updated to fully support the "Undo" feature's data requirements. A new `TurnUndoneLog` type will be defined to represent the reversal action in the audit trail. The existing `TurnCompletedLog` type will be modified to include an optional `isUndone` flag. The main `LogEntry` union type will be expanded to include the new undo log type.
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: This repository will be updated with a new function to handle the "Transparent Reversal" transaction. This function will encapsulate the complex, atomic Firestore operation that reverts the state of a turn by moving the participant back to the top of the queue, decrementing their turn count, creating a new `TurnUndoneLog` entry, and flagging the original log entry as undone.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: This component will be updated to include the complete UI and client-side logic for the "Undo Stack." It will render a persistent "Undo" button. The component's logic will be responsible for scanning the turn history to identify the last valid, reversible action (up to a stack of three), checking if the current user has the necessary permissions (actor, subject, or admin) to perform the reversal, and enabling/disabling the button accordingly. On a confirmed click, it will invoke the `undoTurnTransaction` from the repository. The rendering of the Turn History will also be updated to visually strike through any log entry that has been undone.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/types/group.ts`**
    *   **Symbol:** `TurnUndoneLog`
        *   **Before:** None.
        *   **After:** `export interface TurnUndoneLog { ... }`
    *   **Symbol:** `TurnCompletedLog`
        *   **Before:** `export interface TurnCompletedLog { ... }`
        *   **After:** `export interface TurnCompletedLog { ..., isUndone?: boolean; }`
    *   **Symbol:** `LogEntry`
        *   **Before:** `export type LogEntry = TurnCompletedLog | CountsResetLog;`
        *   **After:** `export type LogEntry = TurnCompletedLog | CountsResetLog | TurnUndoneLog;`
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**
    *   **Symbol:** `undoTurnTransaction`
        *   **Before:** None.
        *   **After:** `export async function undoTurnTransaction(groupId: string, actor: AppUser, logToUndo: TurnCompletedLog): Promise<void>`
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**
    *   None.

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Implement the "Transparent Reversal" Data Layer

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
     * @description Encapsulates all Firestore interactions for the `groups` collection, providing a dedicated data access layer for all data creation, fetching, and modification.
     * @core-principles
     * 1. OWNS all I/O logic for group data and its sub-collections.
     * 2. MUST be the only module that directly interacts with the Firestore `groups` collection.
     * 3. ENFORCES data consistency through atomic transactions for all state-changing operations.
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @description Verifies the correctness of all Firestore interactions for the groups repository, including the complex atomic transaction for the undo feature.
     * @criticality Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct the "Undo Stack" User Interface

#### Task 2.1: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Renders the primary interactive view for a single group, orchestrating the display of all data and providing contextual controls based on user roles, including the "Undo" feature.
     * @core-principles
     * 1. IS the main user interface for all group interaction and management.
     * 2. OWNS the client-side logic for the "Undo Stack," including permission checks and UI state.
     * 3. DELEGATES all data mutations to the `groupsRepository`.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @description Verifies the end-to-end user flow for the "Undo Stack," ensuring the UI state is correct and that user actions trigger the repository with the correct permissions.
     * @criticality Critical (Reason: Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    
---