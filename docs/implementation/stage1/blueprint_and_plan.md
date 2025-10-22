# **Blueprint (Test Assessment)**

*   **`packages/whoseturnnow/src/lib/firebase.ts`**: No test file required (Reason: Configuration file whose functionality is verified by integration tests of the features that consume it).
*   **`packages/whoseturnnow/src/features/auth/useAuthStore.ts`**: Requires new/updated test file (Reason: Critical State Store Ownership; testing is required to prevent logical regressions in state management).
*   **`packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx`**: Requires new/updated test file (Reason: Critical business logic orchestration and I/O management; an integration test is required to validate the architectural boundary with the authentication service).
*   **`packages/whoseturnnow/src/features/auth/LoginScreen.tsx`**: Requires new/updated test file (Reason: Simulates a complete and non-trivial user interaction path, which is a high-value integration test).
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: No test file required (Reason: Simple UI component whose correctness is implicitly verified by the integration tests for the authentication flow).
*   **`packages/whoseturnnow/src/App.tsx`**: No test file required (Reason: Simple routing logic that is implicitly verified by the integration tests of the features it routes between).
*   **`packages/whoseturnnow/src/main.tsx`**: No test file required (Reason: Application entry point with no testable logic).
---
# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/lib/firebase.ts`
*   `packages/whoseturnnow/src/features/auth/useAuthStore.ts`
*   `packages/whoseturnnow/src/features/auth/useAuthStore.spec.ts`
*   `packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx`
*   `packages/whoseturnnow/src/features/auth/AuthOrchestrator.spec.tsx`
*   `packages/whoseturnnow/src/features/auth/LoginScreen.tsx`
*   `packages/whoseturnnow/src/features/auth/LoginScreen.spec.tsx`
*   `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`
*   `packages/whoseturnnow/src/App.tsx`
*   `packages/whoseturnnow/src/main.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/lib/firebase.ts`**: This new file will initialize the Firebase application using credentials from environment variables. It will instantiate and export the core `auth` (Authentication) and `db` (Firestore) services for use throughout the application.
*   **`packages/whoseturnnow/src/features/auth/useAuthStore.ts`**: This new file will define and create a Zustand store to serve as the single source of truth for global authentication state. It will track the current user's simplified profile, the overall authentication status (`initializing`, `authenticated`, `unauthenticated`), and will export the store hook for components to subscribe to state changes.
*   **`packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx`**: This new, headless React component will orchestrate the application's authentication lifecycle. It will subscribe to the Firebase Authentication service's state changes. Upon detecting a new user, it will create their corresponding user profile document in the database; for returning users, it will load their existing profile. It will then synchronize this information with the `useAuthStore`, ensuring the application's state is always an accurate reflection of the user's session.
*   **`packages/whoseturnnow/src/features/auth/LoginScreen.tsx`**: This new component will render the primary user interface for authentication. It will provide UI elements for all sign-in and sign-up methods (Google, Anonymous, Email/Password), manage local form state, invoke the appropriate authentication service functions upon user interaction, and display any resulting errors.
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: This new component will serve as the main authenticated view for this stage. It will read the current user's profile from the `useAuthStore` to display a personalized welcome message and will provide a "Log Out" button to terminate the session.
*   **`packages/whoseturnnow/src/App.tsx`**: This file will be refactored into the application's root router. It will subscribe to the `useAuthStore` and conditionally render one of three states: a global loading indicator (`initializing`), the `LoginScreen` (`unauthenticated`), or the `DashboardScreen` (`authenticated`).
*   **`packages/whoseturnnow/src/main.tsx`**: This file, the application's main entry point, will be modified to wrap the root `App` component with the `AuthOrchestrator`. This ensures the authentication state listener is active throughout the entire application lifecycle.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   **`packages/whoseturnnow/src/lib/firebase.ts`**
    *   **Symbol:** `auth`
        *   **Before:** None.
        *   **After:** `export const auth: Auth`
    *   **Symbol:** `db`
        *   **Before:** None.
        *   **After:** `export const db: Firestore`
*   **`packages/whoseturnnow/src/features/auth/useAuthStore.ts`**
    *   **Symbol:** `AppUser`
        *   **Before:** None.
        *   **After:** `export interface AppUser { uid: string; displayName: string | null; isAnonymous: boolean; }`
    *   **Symbol:** `useAuthStore`
        *   **Before:** None.
        *   **After:** `export const useAuthStore: UseBoundStore<StoreApi<AuthState>>`
*   **`packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx`**
    *   **Symbol:** `AuthOrchestrator`
        *   **Before:** None.
        *   **After:** `export const AuthOrchestrator: React.FC<{ children: React.ReactNode }>`
*   **`packages/whoseturnnow/src/features/auth/LoginScreen.tsx`**
    *   **Symbol:** `LoginScreen`
        *   **Before:** None.
        *   **After:** `export const LoginScreen: React.FC`
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**
    *   **Symbol:** `DashboardScreen`
        *   **Before:** None.
        *   **After:** `export const DashboardScreen: React.FC`
*   **`packages/whoseturnnow/src/App.tsx`**
    *   None.
*   **`packages/whoseturnnow/src/main.tsx`**
    *   None.

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Establish Core Authentication Services & State Management

#### Task 1.1: `packages/whoseturnnow/src/lib/firebase.ts` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/lib/firebase.ts
     * @architectural-role Configuration
     * @description Initializes and exports the core Firebase services (Authentication and Firestore) for the application.
     * @core-principles
     * 1. IS the single source of truth for all Firebase service instances.
     * 2. MUST NOT contain any application-specific business logic.
     * 3. MUST load its configuration from environment variables.
     */
    

#### Task 1.2: `packages/whoseturnnow/src/features/auth/useAuthStore.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: State Store Ownership, High Fan-Out, Core Domain Model Definition, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/useAuthStore.ts
     * @architectural-role State Management
     * @description Defines the central Zustand store for managing global user authentication state, serving as the single source of truth for the user's identity.
     * @core-principles
     * 1. IS the single source of truth for the current user's identity and auth status.
     * 2. OWNS the `AppUser` domain model.
     * 3. MUST be updated only by the `AuthOrchestrator`.
     */
    

#### Task 1.3: `packages/whoseturnnow/src/features/auth/useAuthStore.spec.ts` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/useAuthStore.spec.ts
     * @test-target packages/whoseturnnow/src/features/auth/useAuthStore.ts
     * @description Verifies the state transitions and actions of the authentication store.
     * @criticality Critical (Reason: State Store Ownership)
     * @testing-layer Unit
     */
    

#### Task 1.4: `packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx
     * @architectural-role Orchestrator
     * @description A headless component that synchronizes Firebase Auth state with the application's central auth store. It is the sole bridge between the external service and internal state.
     * @core-principles
     * 1. OWNS the logic for creating user profiles in the database on first sign-up.
     * 2. MUST listen to the external auth service and update the internal state store.
     * 3. MUST NOT render any of its own UI.
     */
    

#### Task 1.5: `packages/whoseturnnow/src/features/auth/AuthOrchestrator.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/AuthOrchestrator.spec.tsx
     * @test-target packages/whoseturnnow/src/features/auth/AuthOrchestrator.tsx
     * @description Verifies that the component correctly handles authentication state changes from the external service, creates user profiles, and updates the state store accordingly.
     * @criticality Critical (Reason: Core Business Logic Orchestration, I/O & Concurrency Management)
     * @testing-layer Integration
     */
    

---
### Phase 2: Construct the Application Shell & User Authentication UI

#### Task 2.1: `packages/whoseturnnow/src/features/auth/LoginScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: I/O & Concurrency Management, Security & Authentication Context)
*   **Validation Tier:** Tier 2: Required by Planner
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/LoginScreen.tsx
     * @architectural-role UI Component
     * @description Renders the primary user interface for all authentication methods, including social, anonymous, and email/password sign-in.
     * @core-principles
     * 1. IS the feature entry point for all unauthenticated users.
     * 2. OWNS the UI state for the login and sign-up forms.
     * 3. DELEGATES all authentication logic to the external auth service.
     */
    

#### Task 2.2: `packages/whoseturnnow/src/features/auth/LoginScreen.spec.tsx` (Verification)
*   **6-Point Rubric Assessment:** Not Applicable
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/LoginScreen.spec.tsx
     * @test-target packages/whoseturnnow/src/features/auth/LoginScreen.tsx
     * @description Verifies that the UI renders correctly and that user interactions (button clicks, form submissions) trigger the appropriate authentication service calls.
     * @criticality Critical (Reason: Security & Authentication Context)
     * @testing-layer Integration
     */
    

#### Task 2.3: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @architectural-role UI Component
     * @description The main authenticated view for the application, acting as the user's home base and entry point to their content.
     * @core-principles
     * 1. IS the primary entry point for authenticated users.
     * 2. DELEGATES state management to its respective hooks and stores.
     * 3. MUST NOT contain complex business logic.
     */
    

#### Task 2.4: `packages/whoseturnnow/src/App.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/App.tsx
     * @architectural-role Orchestrator
     * @description The top-level React component that acts as the application's root router, conditionally rendering views based on authentication state.
     * @core-principles
     * 1. IS the composition root for the entire React application.
     * 2. OWNS the top-level routing logic.
     * 3. MUST NOT contain feature-specific business logic.
     */
    

#### Task 2.5: `packages/whoseturnnow/src/main.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/main.tsx
     * @architectural-role Feature Entry Point
     * @description The main entry point for the React application, responsible for rendering the root component into the DOM.
     * @core-principles
     * 1. IS the application's primary initialization vector.
     * 2. MUST compose the root component with all necessary global providers.
     */
    
---