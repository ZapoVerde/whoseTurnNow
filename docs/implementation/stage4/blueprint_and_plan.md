Acknowledged. Proceeding directly to the Test Assessment phase as requested.

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/types/group.ts`**: No test file required (Reason: Type definition file with no runtime logic).
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: Requires new/updated test file (Reason: Changes introduce critical I/O and business logic for all administrative actions).
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete and non-trivial user interaction path for all group administration features).
*   **`packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`**: No test file required (Reason: Simple UI component whose correctness is implicitly verified by the integration tests for `GroupDetailScreen` which consume it).

---

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/types/group.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx`
*   `packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/types/group.ts`**: This file will be updated to include the data definition for the administrative log entry. It will introduce the `CountsResetLog` type and expand the `LogEntry` union type to include it.
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: This repository will be expanded to include functions for all administrative actions. This includes logic for updating a participant's role, removing a participant, resetting all turn counts for a group, updating a group's settings (name/icon), and handling group departure (leaving or deleting). Each function will encapsulate the corresponding Firestore write operation.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: This component will be enhanced with all the UI and client-side logic for administrative controls. It will render contextual menus (a group-level kebab menu and on-click menus for each participant) whose contents are determined by the current user's role. It will implement the client-side "Last Admin" rule to disable invalid actions. The UI elements will be wired to invoke the new administrative functions from the `groupsRepository`.
*   **`packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`**: This new component will house the high-friction confirmation dialogs for destructive administrative actions. It will provide reusable dialogs for confirming "Reset All Turn Counts" and "Delete Group," ensuring a consistent and safe user experience for these critical operations.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/types/group.ts`**
    *   **Symbol:** `CountsResetLog`
        *   **Before:** None.
        *   **After:** `export interface CountsResetLog { ... }`
    *   **Symbol:** `LogEntry`
        *   **Before:** `export type LogEntry = TurnCompletedLog;`
        *   **After:** `export type LogEntry = TurnCompletedLog | CountsResetLog;`
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**
    *   **Symbol:** `updateParticipantRole`
        *   **Before:** None.
        *   **After:** `export async function updateParticipantRole(groupId: string, participantId: string, newRole: 'admin' | 'member'): Promise<void>`
    *   **Symbol:** `removeParticipant`
        *   **Before:** None.
        *   **After:** `export async function removeParticipant(groupId: string, participantId: string): Promise<void>`
    *   **Symbol:** `resetAllTurnCounts`
        *   **Before:** None.
        *   **After:** `export async function resetAllTurnCounts(groupId: string, actor: AppUser): Promise<void>`
    *   **Symbol:** `updateGroupSettings`
        *   **Before:** None.
        *   **After:** `export async function updateGroupSettings(groupId: string, settings: { name: string; icon: string; }): Promise<void>`
    *   **Symbol:** `leaveGroup`
        *   **Before:** None.
        *   **After:** `export async function leaveGroup(groupId: string, userId: string): Promise<void>`
    *   **Symbol:** `deleteGroup`
        *   **Before:** None.
        *   **After:** `export async function deleteGroup(groupId: string): Promise<void>`
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**
    *   None.
*   **`packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`**
    *   **Symbol:** `ResetCountsConfirmationDialog`
        *   **Before:** None.
        *   **After:** `export const ResetCountsConfirmationDialog: React.FC<{...}>`
    *   **Symbol:** `DeleteGroupConfirmationDialog`
        *   **Before:** None.
        *   **After:** `export const DeleteGroupConfirmationDialog: React.FC<{...}>`

        ---
# **Implementation Plan (Finalized)**

### Phase 1: Expand Data Layer to Support All Administrative Actions

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
     * 3. ENFORCES data consistency through atomic transactions where necessary.
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @description Verifies the correctness of all Firestore interactions for the groups repository, including all administrative actions.
     * @criticality Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct Administrative UI and Confirmation Flows

#### Task 2.1: `packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx
     * @architectural-role UI Component
     * @description Provides a suite of reusable, high-friction confirmation dialogs for destructive, group-level administrative actions.
     * @core-principles
     * 1. IS a collection of pure, presentational components.
     * 2. OWNS the UI state for the confirmation prompts.
     * 3. DELEGATES the execution of the confirmed action to its parent component.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Renders the primary interactive view for a single group, orchestrating the display of all data and providing contextual controls based on user roles.
     * @core-principles
     * 1. IS the main user interface for all group interaction and management.
     * 2. OWNS the client-side logic for role-based rendering and the "Last Admin" rule.
     * 3. DELEGATES all data mutations to the `groupsRepository`.
     */
    

#### Task 2.3: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @description Verifies all administrative user flows, ensuring that UI controls are correctly displayed based on user roles and that interactions trigger the appropriate repository functions.
     * @criticality Critical (Reason: Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    
---
