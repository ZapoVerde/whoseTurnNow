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