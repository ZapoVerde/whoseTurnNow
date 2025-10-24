# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/package.json`
*   `packages/whoseturnnow/src.main.tsx`
*   `packages/whoseturnnow/src/theme/` (and all its contents)
*   `packages/whoseturnnow/src/App.tsx`
*   `packages/whoseturnnow/src/features/auth/LoginScreen.tsx`
*   `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`
*   `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`
*   `packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx`
*   `packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx`
*   `packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx`
*   `packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`
*   `packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx`
*   `packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx`
*   `packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`
*   `packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/package.json`**: This file's `dependencies` will be updated to include any necessary `@fontsource` packages (e.g., `@fontsource/roboto`) that are required by the transplanted theme's typography configuration.
*   **`packages/whoseturnnow/src.main.tsx`**: This file, the application's entry point, will be modified to import the main theme object from the new `theme` module and any required font packages. It will then wrap the root `<App />` component with Material-UI's `<ThemeProvider>` and `<CssBaseline>` components, making the new design system globally available to the entire application.
*   **`packages/whoseturnnow/src/theme/` (New Directory)**: This new directory will house the complete set of transplanted theme definition files (e.g., `theme.ts`, `palette.ts`, `typography.ts`). These files will collectively define the application's visual identity, including colors, fonts, and component overrides. The primary `theme.ts` file will be responsible for composing these parts and exporting the final, configured theme object for consumption by `main.tsx`.

#### **Collateral (Fixing) Changes:**
*   **All `.tsx` UI Components ( `App.tsx`, `LoginScreen.tsx`, etc.)**: Each of these UI components will be refactored to remove any hardcoded or one-off styling values (e.g., color strings like `'#FFF'`, pixel values like `marginTop: 8`). These will be replaced with references to the globally provided theme object, primarily via the `sx` prop, to ensure all visual aspects (colors, spacing, fonts) are derived from the single source of truth in the new `theme` module. This brings every component into compliance with the new design system.

### **3. API Delta Ledger (Complete)**
*   **File:** `packages/whoseturnnow/src/theme/theme.ts` (New File)
    *   **Symbol:** `theme`
    *   **Before:** None.
    *   **After:** `export const theme: Theme`

    ---

    # **Implementation Plan (Finalized)**

### Phase 1: Establish the Theme Foundation and Global Providers

#### Task 1.1: `packages/whoseturnnow/package.json` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    Not Applicable (JSON file).
    
#### Task 1.2: `packages/whoseturnnow/src/theme/theme.ts` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: High Fan-Out / System-Wide Dependency)
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/theme/theme.ts
     * @architectural-role Configuration
     * @description
     * The single, authoritative source of truth for the application's design system.
     * It composes the palette, typography, and component overrides into a single,
     * injectable Material-UI theme object that governs the visual identity of the
     * entire application.
     * @core-principles
     * 1. IS the single source of truth for all visual styling tokens (colors, fonts, spacing).
     * 2. MUST be provided at the application's root to ensure global availability.
     * 3. ENFORCES visual consistency across all components.
     */
    
#### Task 1.3: `packages/whoseturnnow/src/main.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/main.tsx
     * @architectural-role Feature Entry Point
     * @description
     * The main entry point for the React application. Its sole responsibility is to
     * render the root `App` component into the DOM and wrap it with all necessary
     * top-level providers, including the Material-UI `ThemeProvider`.
     * @core-principles
     * 1. IS the application's primary initialization vector.
     * 2. OWNS the instantiation and provision of the global theme.
     * 3. MUST compose the root component with all necessary global providers.
     */
    
---
### Phase 2: Refactor All UI Components for Theme Compliance

#### Task 2.1: `packages/whoseturnnow/src/App.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/App.tsx
     * @architectural-role Orchestrator
     * @description
     * The top-level React component that acts as the application's
     * root router, conditionally rendering views based on auth state and URL path.
     * All styling for this component and its children is derived from the global theme.
     * @core-principles
     * 1. IS the composition root for the entire React application.
     * 2. OWNS the top-level routing logic for all authenticated and public routes.
     * 3. MUST NOT contain feature-specific business logic.
     */
    
#### Task 2.2: `packages/whoseturnnow/src/features/auth/LoginScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/LoginScreen.tsx
     * @architectural-role UI Component
     * @description
     * Renders the primary user interface for all authentication methods. Its layout
     * and styling are derived from the global Material-UI theme to ensure brand
     * consistency.
     * @core-principles
     * 1. IS the feature entry point for all unauthenticated users.
     * 2. OWNS the UI state for the login and sign-up forms.
     * 3. DELEGATES all authentication logic to the external auth service.
     */
    
#### Task 2.3: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @architectural-role UI Component
     * @description
     * Renders the user's main dashboard. All visual elements, from the AppBar to the
     * list items and FAB, are styled according to the globally provided theme.
     * @core-principles
     * 1. IS the primary UI for displaying a user's collection of lists.
     * 2. DELEGATES all data fetching to the `groupsRepository`.
     * 3. OWNS the UI for navigating to other features like settings and list creation.
     */
    
#### Task 2.4: `packages/whoseturnnow/src/features/groups/CreateListDialog.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
     * @architectural-role UI Component
     * @description
     * A modal component that handles the user interaction for creating a new list.
     * Its form elements and actions are styled using the global theme.
     * @core-principles
     * 1. OWNS the UI state for the list creation form.
     * 2. MUST validate user input before proceeding.
     * 3. DELEGATES the actual data creation to the `groupsRepository`.
     */
    
#### Task 2.5: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration)
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Renders the primary interactive view for a single group. The composition and
     * styling of all sub-components are derived from the global theme.
     * @core-principles
     * 1. IS the main user interface for all group interaction and management.
     * 2. OWNS the client-side business logic for the feature, composed within its hook.
     * 3. DELEGATES all data mutations to the `groupsRepository`.
     */
    
#### Task 2.6: `packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component that provides a controlled form for administrators
     * to add new "Managed Participants." Its styling is derived from the theme.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives and the global theme.
     * 3. DELEGATES all state management and form submission logic to its parent.
     */
    
#### Task 2.7: `packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component that renders the primary floating action buttons,
     * styled with the theme's palette colors.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render its state and behavior based solely on the props it receives.
     * 3. DELEGATES all event handling to its parent component via callbacks.
     */
    
#### Task 2.8: `packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for displaying the main group header. Its typography
     * and spacing are controlled by the global theme.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives and the theme.
     * 3. DELEGATES all event handling to its parent via callbacks.
     */
    
#### Task 2.9: `packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx
     * @architectural-role UI Component
     * @description
     * Provides a suite of reusable, high-friction confirmation dialogs, styled
     * consistently with the application's theme.
     * @core-principles
     * 1. IS a collection of pure, presentational components.
     * 2. OWNS the UI for the confirmation prompts.
     * 3. DELEGATES the execution of the confirmed action to its parent component.
     */
    
#### Task 2.10: `packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for rendering the ordered list of participants.
     * All list item styles, text, and icons are themed.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render the participant list based solely on the props it receives.
     * 3. DELEGATES all user interactions to its parent component.
     */
    
#### Task 2.11: `packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for rendering the turn history log. Its visual
     * representation, including the strikethrough for undone actions, is styled
     * using theme variables.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives.
     * 3. OWNS the visual formatting of log entries.
     */
    
#### Task 2.12: `packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Manages the user flow for accepting an invitation. The layout and styling of
     * this screen are derived from the global theme for a consistent onboarding
     * experience.
     * @core-principles
     * 1. OWNS the logic for parsing invitation context from the URL.
     * 2. ORCHESTRATES the user authentication flow for new invitees.
     * 3. DELEGATES the final data mutation to the `groupsRepository`.
     */
    
#### Task 2.13: `packages/whoseturnnow/src/features/settings/SettingsScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Renders the UI for global account management. All form elements, buttons,
     * and "danger zone" styling are controlled by the global theme.
     * @core-principles
     * 1. IS the primary UI for all global user account settings.
     * 2. OWNS the local UI state for the settings form and confirmation dialogs.
     * 3. DELEGATES all data mutations to the `userRepository`.
     */
    
---