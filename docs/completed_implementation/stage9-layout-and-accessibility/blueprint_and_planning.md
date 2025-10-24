# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
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
*   **`packages/whoseturnnow/src/App.tsx`**: The root `Box` or `Fragment` within the main `AuthenticatedRoutes` component will be refactored to ensure that the primary content area is correctly designated as a semantic landmark, likely by applying the `component="main"` prop to the appropriate container, in compliance with the Accessibility Standard.
*   **`packages/whoseturnnow/src/features/auth/LoginScreen.tsx`**: The component's layout will be refactored to use the `<Stack>` primitive. All manual margin props (`sx={{ mt: 3 }}`) used for spacing between the title, text fields, and buttons will be removed and replaced with a single `spacing` prop on the parent `<Stack>`, ensuring consistent vertical rhythm as defined by the Layout Standard.
*   **`packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx`**: The `IconButton` used for navigating to the settings screen will be updated to include a descriptive `aria-label="Account settings"` to comply with the Accessibility Standard. The root content container will be refactored to use the semantic `<Box component="main">` landmark.
*   **`packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx`**: The root content container will be refactored to use the semantic `<Box component="main">` landmark. The various child components will be organized using `<Stack>` or responsive `<Box display="flex">` primitives as required by the Layout Standard. The group options kebab menu `IconButton` will be updated to include a descriptive `aria-label="Group options"`.
*   **`packages/whoseturnnow/src/features/settings/SettingsScreen.tsx`**: The layout of the settings form and "Danger Zone" will be refactored to use `<Stack>` primitives to enforce consistent vertical spacing. The root content container will be refactored to use the semantic `<Box component="main">` landmark.
*   **`packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx`**: The component's layout will be refactored to use `<Stack>` primitives for consistent vertical rhythm between the welcome message, typography, and the embedded `LoginScreen` component.

#### **Collateral (Fixing) Changes:**
*   **`packages/whoseturnnow/src/features/groups/CreateListDialog.tsx`**: The internal layout of the dialog's content will be refactored to use `<Stack>` to manage the spacing between the `TextField` and the `EmojiPicker` button, ensuring it conforms to the theme's spacing rules.
*   **`packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx`**: The `Paper` component will be refactored from using `display: 'flex'` to using a `<Stack direction="row">` internally to manage the layout and spacing of the text field and button, aligning it with the Layout Standard's preference for the Stack primitive.
*   **`packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx`**: The `Fab` for the "undo" action will be updated to include a descriptive `aria-label="Undo last turn"` to comply with the Accessibility Standard.
*   **`packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx`**: The layout will be refactored to use a `<Stack direction="row">` with `alignItems="center"` to manage the relationship between the icon and the typography, ensuring consistent spacing and alignment.
*   **`packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx`**: The internal layout of the dialog content will be reviewed to ensure consistent spacing is applied according to the theme, likely using `<Stack>` if multiple elements are present.
*   **`packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx`**: The `ListItemButton`'s internal structure will be refactored to use `<Stack direction="row">` to manage the layout of the `ListItemText`, `Chip`, and any icons, ensuring predictable spacing and alignment.
*   **`packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx`**: The layout will be refactored to use a parent `<Stack>` to manage the spacing between the "Turn History" `Typography` title and the `List` component below it.

### **3. API Delta Ledger (Complete)**
*   None.

---

# **Implementation Plan (Finalized)**

### Phase 1: Apply Foundational Layout and Semantic Landmarks to Core Screens

#### Task 1.1: `packages/whoseturnnow/src/App.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/App.tsx
     * @architectural-role Orchestrator
     * @description
     * The top-level React component that acts as the application's
     * root router. It establishes the primary semantic layout structure, including
     * the main content landmark, for all authenticated views.
     * @core-principles
     * 1. IS the composition root for the entire React application.
     * 2. OWNS the top-level routing logic.
     * 3. MUST provide the primary semantic `<main>` landmark for its children.
     */
    
#### Task 1.2: `packages/whoseturnnow/src/features/auth/LoginScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/auth/LoginScreen.tsx
     * @architectural-role UI Component
     * @description
     * Renders the primary user interface for all authentication methods. Its layout
     * is constructed in compliance with the Zero-Taste Layout Standard, using a
     * `<Stack>` primitive to ensure consistent vertical rhythm.
     * @core-principles
     * 1. IS the feature entry point for all unauthenticated users.
     * 2. OWNS the UI state for the login and sign-up forms.
     * 3. DELEGATES all authentication logic to the external auth service.
     */
    
#### Task 1.3: `packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/dashboard/DashboardScreen.tsx
     * @architectural-role UI Component
     * @description
     * Renders the user's main dashboard. Its layout is compliant with the
     * Zero-Taste standards, and all interactive elements are accessible.
     * @core-principles
     * 1. IS the primary UI for displaying a user's collection of lists.
     * 2. DELEGATES all data fetching to the `groupsRepository`.
     * 3. MUST provide an accessible label for its settings navigation control.
     */
    
#### Task 1.4: `packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Critical (Reason: Core Business Logic Orchestration)
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/GroupDetailScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Renders the primary interactive view for a single group. Its layout is
     * composed of standard primitives, and all administrative controls are
     * fully accessible.
     * @core-principles
     * 1. IS the main user interface for all group interaction and management.
     * 2. DELEGATES all business logic to its backing `useGroupDetail` hook.
     * 3. MUST ensure all interactive elements, like the group menu, have accessible labels.
     */
    
#### Task 1.5: `packages/whoseturnnow/src/features/settings/SettingsScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/settings/SettingsScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Renders the UI for global account management. Its layout is constructed using
     * `<Stack>` primitives in accordance with the Zero-Taste Layout Standard.
     * @core-principles
     * 1. IS the primary UI for all global user account settings.
     * 2. OWNS the local UI state for the settings form and confirmation dialogs.
     * 3. DELEGATES all data mutations to the `userRepository`.
     */
    
#### Task 1.6: `packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/invitations/InvitationScreen.tsx
     * @architectural-role Feature Entry Point
     * @description
     * Manages the user flow for accepting an invitation. Its layout uses standard
     * primitives to ensure a consistent and professional onboarding experience.
     * @core-principles
     * 1. OWNS the logic for parsing invitation context from the URL.
     * 2. ORCHESTRATES the user authentication flow for new invitees.
     * 3. DELEGATES the final data mutation to the `groupsRepository`.
     */
    
---
### Phase 2: Refine Reusable UI Components for Standard Compliance

#### Task 2.1: `packages/whoseturnnow/src/features/groups/CreateListDialog.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/CreateListDialog.tsx
     * @architectural-role UI Component
     * @description
     * A modal component for creating a new list. Its internal layout is managed by
     * standard primitives to ensure consistent spacing.
     * @core-principles
     * 1. OWNS the UI state for the list creation form.
     * 2. MUST validate user input before proceeding.
     * 3. DELEGATES the actual data creation to the `groupsRepository`.
     */
    
#### Task 2.2: `packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/AddParticipantForm.tsx
     * @architectural-role UI Component
     * @description
     * A presentational form for adding "Managed Participants." Its layout is
     * managed by a `<Stack>` primitive to conform to the layout standard.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives.
     * 3. DELEGATES all logic to its parent.
     */
    
#### Task 2.3: `packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupActionButtons.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component that renders the primary FABs. It adheres to the
     * Accessibility Standard by providing labels for all icon-only buttons.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST provide an `aria-label` for the Undo button.
     * 3. DELEGATES all event handling to its parent.
     */
    
#### Task 2.4: `packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupHeader.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for the group header. Its internal layout and
     * alignment are managed by standard layout primitives.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives.
     * 3. DELEGATES all event handling to its parent.
     */
    
#### Task 2.5: `packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/GroupManagementDialogs.tsx
     * @architectural-role UI Component
     * @description
     * Provides a suite of reusable, high-friction confirmation dialogs. Their
     * internal layout uses standard spacing from the theme.
     * @core-principles
     * 1. IS a collection of pure, presentational components.
     * 2. OWNS the UI for the confirmation prompts.
     * 3. DELEGATES the execution of the confirmed action to its parent.
     */
    
#### Task 2.6: `packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/ParticipantList.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for rendering the ordered list of participants.
     * The internal layout of each list item is managed by standard primitives.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render the participant list based solely on the props it receives.
     * 3. DELEGATES all user interactions to its parent component.
     */
    
#### Task 2.7: `packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx` (Source)
*   **6-Point Rubric Assessment:** Not Critical
*   **Validation Tier:** Tier 1: Human Review
*   **Preamble:**    
    /**
     * @file packages/whoseturnnow/src/features/groups/components/TurnHistory.tsx
     * @architectural-role UI Component
     * @description
     * A presentational component for rendering the turn history log. Its layout is
     * managed by standard primitives for consistent spacing.
     * @core-principles
     * 1. IS a pure, presentational ("dumb") component.
     * 2. MUST render UI based solely on the props it receives.
     * 3. OWNS the visual formatting of log entries.
     */
    
---