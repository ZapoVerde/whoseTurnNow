

# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/features/auth/userRepository.ts`**: Requires new/updated test file (Reason: Changes introduce critical I/O and business logic for account modification and deletion, which falls under "Security & Authentication Context").
*   **`packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete, non-trivial user interaction path for a critical, destructive action - account deletion - which falls under "Security & Authentication Context").
*   **`packages/whoseturnnow/src/App.tsx`**: No test file required (Reason: Changes are to simple routing logic, which will be implicitly verified by the integration test for `SettingsScreen`).
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: No test file required (Reason: The change is a simple navigation link, whose correctness is implicitly verified by the integration test for the feature it links to).

---

Acknowledged. I will now proceed to **Phase 4: Finalization**.

I will synthesize all previous outputs into a single, comprehensive plan, defining the complete scope, the full logical changes for all files, and the final API delta. This artifact completes the Blueprinting Protocol.

# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/features/auth/userRepository.ts`
*   `packages/whoseturnnow/src/features/auth/userRepository.spec.ts`
*   `packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`
*   `packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx`
*   `packages/whoseturnnow/src/App.tsx`
*   `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/features/auth/userRepository.ts`**: The repository will be updated to support global account management. A new function will be added to update the `displayName` field of a user's document in Firestore. A second new function will be added to orchestrate the complete deletion of a user's account, including their authentication record and their Firestore document.
*   **`packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`**: This new component will render the user interface for all global account management. It will subscribe to the central authentication store to display the user's current display name in an editable form. It will contain the client-side logic to invoke the `updateUserDisplayName` repository function on form submission. It will also render a high-friction "Danger Zone" for account deletion, which will manage the state of a confirmation dialog and call the `deleteUserAccount` repository function upon final user confirmation.

#### **Collateral (Fixing) Changes:**
*   **`packages/whoseturnnow/src/App.tsx`**: The application's root router will be modified to include a new, protected route. The route `/settings` will be added to the authenticated routing group and will render the new `SettingsScreen` component.
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: This component will be updated to provide a clear navigation path to the new Settings screen. A simple app bar will be added to the top of the screen containing an icon button (e.g., a "settings" or "account" icon) that, when clicked, navigates the user to the `/settings` route.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/features/auth/userRepository.ts`**
    *   **Symbol:** `updateUserDisplayName`
        *   **Before:** None.
        *   **After:** `export async function updateUserDisplayName(uid: string, newDisplayName: string): Promise<void>`
    *   **Symbol:** `deleteUserAccount`
        *   **Before:** None.
        *   **After:** `export async function deleteUserAccount(): Promise<void>`
*   **`packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`**
    *   **Symbol:** `SettingsScreen`
        *   **Before:** None.
        *   **After:** `export const SettingsScreen: React.FC`
*   **`packages/whoseturnnow/src/App.tsx`**
    *   None.
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**
    *   None.

    ---

    Acknowledged. Beginning the Detailing Pass.

I will now take the `Phased Draft` and produce the final, detailed implementation plan, including the 6-Point Rubric assessment, Validation Tier, and a complete, compliant Preamble for every file in the scope.

# **Implementation Plan (Finalized)**

### Phase 1: Expand Data Layer for Account Management

#### Task 1.1: `packages/whoseturnnow/src/features/auth/userRepository.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/userRepository.ts
     * @architectural-role Data Repository
     * @description Encapsulates all Firestore and Auth interactions for the `users`
     * collection, providing a clean data access layer for user profile management.
     * @core-principles
     * 1. OWNS all I/O logic for user profiles.
     * 2. MUST be the only module that directly interacts with the `users` collection.
     * 3. ORCHESTRATES both data and auth service calls for complex operations like account deletion.
     */
    

#### Task 1.2: `packages/whoseturnnow/src/features/auth/userRepository.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/userRepository.spec.ts
     * @test-target packages/whoseturnnow/src/features/auth/userRepository.ts
     * @description Verifies the correctness of all user profile interactions, including
     * creation, fetching, name updates, and account deletion.
     * @criticality Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct Account Management User Interface

#### Task 2.1: `packages/whoseturnnow/src/features/settings/SettingsScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
     * @architectural-role Feature Entry Point
     * @description Renders the UI for global account management, allowing users to
     * update their display name and delete their account via a high-friction flow.
     * @core-principles
     * 1. IS the primary UI for all global user account settings.
     * 2. OWNS the local UI state for the settings form and confirmation dialogs.
     * 3. DELEGATES all data mutations to the `userRepository`.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/settings/SettingsScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
     * @description Verifies the end-to-end user flow for account management,
     * ensuring that display name changes and the high-friction account deletion
     * process trigger the correct repository functions.
     * @criticality Critical (Reason: Security & Authentication Context)
     * @testing-layer Integration
     */
    

---
### Phase 3: Integrate Settings Feature into Application Shell

#### Task 3.1: `packages/whoseturnnow/src/App.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/App.tsx
     * @architectural-role Orchestrator
     * @description The top-level React component that acts as the application's
     * root router, conditionally rendering views based on auth state and URL path.
     * @core-principles
     * 1. IS the composition root for the entire React application.
     * 2. OWNS the top-level routing logic for all authenticated and public routes.
     * 3. MUST NOT contain feature-specific business logic.
     */
    

#### Task 3.2: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @architectural-role UI Component
     * @description Renders the user's main dashboard, displaying their list of
     * groups and providing the entry points for list creation and account settings.
     * @core-principles
     * 1. IS the primary UI for displaying a user's collection of lists.
     * 2. DELEGATES all data fetching to the `groupsRepository`.
     * 3. OWNS the UI for navigating to other features like settings and list creation.
     */
    

---