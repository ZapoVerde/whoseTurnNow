Acknowledged. Proceeding directly to the Test Assessment phase as requested.

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: Requires new/updated test file (Reason: Changes introduce critical I/O and business logic for handling both generic and targeted group invitations).
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: Requires new/updated test file (Reason: Changes introduce new user interaction paths - generating invitation links - which must be verified).
*   **`packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete and non-trivial user interaction path for the entire invitation and group joining flow).
*   **`packages/whoseturnnow/src/App.tsx`**: No test file required (Reason: Changes are to routing logic, which is implicitly verified by the integration test for `InvitationScreen`).

---

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/features/groups/groupsRepository.ts`
*   `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx`
*   `packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`
*   `packages/whoseturnnow/src/features/invitations/InvitationScreen.spec.tsx`
*   `packages/whoseturnnow/src/App.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**: This repository will be expanded with functions to handle the logic of a user joining a group. One new function will add a user as a brand-new participant in a group. A second function will handle the "Hand-off" flow, where a user claims an existing placeholder slot by updating its user ID.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: This component's UI will be updated to provide the entry points for generating invitation links. An "Invite" option will be added to the group-level administrative menu to generate a generic join link. Additionally, a distinct "Invite" button will be rendered next to each "Managed Participant" (placeholder) to generate a targeted hand-off link for that specific slot.
*   **`packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`**: This new screen component will manage the entire experience for an invited user. It will parse the group ID and the optional participant ID from the URL to understand the context. It will display a tailored welcome message and guide the user through the sign-up or sign-in process if they are not already authenticated. Once authenticated, it will call the appropriate repository function (`joinGroupAsNewParticipant` or `claimPlaceholder`) and then redirect the user to the group's detail page.
*   **`packages/whoseturnnow/src/App.tsx`**: This file's routing logic will be updated to include a new route for handling invitations. The route will be parameterized to accept a group ID (e.g., `/join/:groupId`) and will render the new `InvitationScreen` component, making the invitation links functional.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`**
    *   **Symbol:** `joinGroupAsNewParticipant`
        *   **Before:** None.
        *   **After:** `export async function joinGroupAsNewParticipant(groupId: string, user: AppUser): Promise<void>`
    *   **Symbol:** `claimPlaceholder`
        *   **Before:** None.
        *   **After:** `export async function claimPlaceholder(groupId: string, participantId: string, user: AppUser): Promise<void>`
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**
    *   None.
*   **`packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`**
    *   **Symbol:** `InvitationScreen`
        *   **Before:** None.
        *   **After:** `export const InvitationScreen: React.FC`
*   **`packages/whoseturnnow/src/App.tsx`**
    *   None.

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Enable Invitation Generation and Data Layer

#### Task 1.1: `packages/whoseturnnow/src/features/groups/groupsRepository.ts` (Source)
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
    

#### Task 1.2: `packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/groupsRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/groups/groupsRepository.ts
     * @description Verifies the correctness of all Firestore interactions for the groups repository, including invitation and joining logic.
     * @criticality Critical (Reason: I/O & Concurrency Management, Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Renders the primary interactive view for a single group, orchestrating the display of all data and providing contextual controls based on user roles.
     * @core-principles
     * 1. IS the main user interface for all group interaction and management.
     * 2. OWNS the client-side logic for generating invitation links.
     * 3. DELEGATES all data mutations to the `groupsRepository`.
     */
    

#### Task 1.4: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @description Verifies that the UI for generating both generic and targeted invitation links is correctly displayed and functional for admin users.
     * @criticality Critical (Reason: Core Business Logic Orchestration)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct the Invitation Acceptance and Onboarding Flow

#### Task 2.1: `packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Manages the entire user flow for accepting an invitation, handling both generic and targeted "hand-off" scenarios.
     * @core-principles
     * 1. OWNS the logic for parsing invitation context from the URL.
     * 2. ORCHESTRATES the user authentication flow for new invitees.
     * 3. DELEGATES the final data mutation for joining a group to the `groupsRepository`.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/invitations/InvitationScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
     * @description Verifies the end-to-end invitation acceptance flow, ensuring users are correctly added to groups for both generic and targeted links.
     * @criticality Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
     * @testing-layer Integration
     */
    

#### Task 2.3: `packages/whoseturnnow/src/App.tsx` (Source)
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
     * 3. MUST correctly route parameterized URLs for invitations.
     */
    
---