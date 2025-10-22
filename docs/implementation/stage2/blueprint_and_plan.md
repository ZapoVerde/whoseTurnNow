Acknowledged. Proceeding directly to the Test Assessment phase as requested.
STAGE 2

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/types/group.ts`**: No test file required (Reason: Type definition file with no runtime logic).
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: Requires new/updated test file (Reason: Critical Data Repository managing I/O and core business logic).
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete, non-trivial user interaction - viewing lists and initiating the creation flow).
*   **`packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`**: Requires new/updated test file (Reason: Simulates a complete, non-trivial user interaction - creating a new list).
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: No test file required (Reason: Simple display component whose correctness will be implicitly verified by the integration test for the list creation flow that navigates to it).
*   **`packages/whoseturnnow/src/App.tsx`**: No test file required (Reason: Changes are to routing logic, which is covered by feature integration tests).

---

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/types/group.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts`
*   `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`
*   `packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx`
*   `packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`
*   `packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/App.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/types/group.ts`**: This new file will provide the canonical TypeScript definitions for the core data entities of the application. It will define the structure for `Group` documents and the nested `TurnParticipant` objects, ensuring type safety for all data interactions.
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: This new file will create a dedicated data access layer for all group-related Firestore operations. It will encapsulate the logic for creating new `Group` documents and for querying the database to fetch all groups a specific user is a member of.
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: This file will be refactored from a simple placeholder into a dynamic dashboard. It will use the `groupsRepository` to subscribe to and display a real-time list of the user's groups. It will also contain the primary UI element (e.g., a Floating Action Button) to trigger the "Create a New List" flow.
*   **`packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`**: This new component will render a dialog (modal) for the "Create a New List" flow. It will manage the local form state for the list's name and selected emoji. Upon user confirmation, it will invoke the `createGroup` function from the repository and handle the subsequent navigation to the new list's detail page.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: This new screen component will display the details of a single list. It will extract a group ID from the URL, fetch the corresponding `Group` document from the database, and render its name, icon, and the initial list of participants. For this stage, the component will be read-only.
*   **`packages/whoseturnnow/src/App.tsx`**: This file's routing logic will be updated to handle navigation to individual group pages. It will introduce a new route that accepts a group ID as a URL parameter and renders the `GroupDetailScreen` component for that route.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/types/group.ts`**
    *   **Symbol:** `Group`
        *   **Before:** None.
        *   **After:** `export interface Group { ... }`
    *   **Symbol:** `TurnParticipant`
        *   **Before:** None.
        *   **After:** `export interface TurnParticipant { ... }`
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**
    *   **Symbol:** `createGroup`
        *   **Before:** None.
        *   **After:** `export async function createGroup(options: { name: string; icon: string; creator: AppUser }): Promise<string>`
    *   **Symbol:** `getUserGroups`
        *   **Before:** None.
        *   **After:** `export function getUserGroups(userId: string, onUpdate: (groups: Group[]) => void): Unsubscribe`
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**
    *   None.
*   **`packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`**
    *   **Symbol:** `CreateListDialog`
        *   **Before:** None.
        *   **After:** `export const CreateListDialog: React.FC<{ open: boolean; onClose: () => void; }>`
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**
    *   **Symbol:** `GroupDetailScreen`
        *   **Before:** None.
        *   **After:** `export const GroupDetailScreen: React.FC`
*   **`packages/whoseturnnow/src/App.tsx`**
    *   None.

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Establish Core Group Data Model & Repository

#### Task 1.1: `packages/whoseturnnow/src/types/group.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Domain Model Definition)
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/types/group.ts
     * @architectural-role Type Definition
     * @description Defines the canonical data structures for the application's core domain, including `Group` and `TurnParticipant`.
     * @core-principles
     * 1. IS the single source of truth for the shape of group and participant data.
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
     * @description Encapsulates all Firestore interactions for the `groups` collection, providing a dedicated data access layer for creating and fetching list data.
     * @core-principles
     * 1. OWNS all I/O logic for group data.
     * 2. MUST be the only module that directly interacts with the Firestore `groups` collection.
     * 3. DELEGATES application state management to stores and hooks.
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @description Verifies the correctness of all Firestore interactions for the groups repository, including data creation and querying logic.
     * @criticality Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct List Creation and Viewing User Interface

#### Task 2.1: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @architectural-role UI Component
     * @description Renders the user's main dashboard, displaying their list of groups and providing the entry point for the list creation flow.
     * @core-principles
     * 1. IS the primary UI for displaying a user's collection of lists.
     * 2. DELEGATES all data fetching to the `groupsRepository`.
     * 3. ORCHESTRATES the presentation of the `CreateListDialog`.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @description Verifies the dashboard correctly displays a list of groups and that the list creation flow can be successfully initiated and completed.
     * @criticality Not Critical
     * @testing-layer Integration
     */
    

#### Task 2.3: `packages/whoseturnnow/src/features/groups/CreateListDialog.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: I/O & Concurrency Management)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
     * @architectural-role UI Component
     * @description A modal component that handles the user interaction for creating a new list, capturing its name and icon.
     * @core-principles
     * 1. OWNS the UI state for the list creation form.
     * 2. MUST validate user input before proceeding.
     * 3. DELEGATES the actual data creation to the `groupsRepository`.
     */
    

#### Task 2.4: `packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/CreateListDialog.spec.tsx
     * @test-target packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
     * @description Verifies that the create list dialog correctly captures user input and invokes the repository on submission, resulting in a successful navigation.
     * @criticality Critical (Reason: I/O & Concurrency Management)
     * @testing-layer Integration
     */
    

#### Task 2.5: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role UI Component
     * @description Renders a read-only view of a single group's details, including its name, icon, and list of participants.
     * @core-principles
     * 1. IS responsible for displaying the state of a single group.
     * 2. MUST fetch its data based on a group ID from the URL.
     * 3. MUST NOT contain business logic for modifying group state in this stage.
     */
    

#### Task 2.6: `packages/whoseturnnow/src/App.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/App.tsx
     * @architectural-role Orchestrator
     * @description The top-level React component that acts as the application's root router, conditionally rendering views based on authentication state and URL path.
     * @core-principles
     * 1. IS the composition root for the entire React application.
     * 2. OWNS the top-level routing logic.
     * 3. MUST correctly route parameterized URLs for individual groups.
     */
    
---