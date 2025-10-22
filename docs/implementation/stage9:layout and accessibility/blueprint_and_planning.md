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