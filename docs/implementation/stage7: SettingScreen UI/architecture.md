# **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective is to build the missing UI for global account management, fulfilling the V1 specification. The rationale is to close a planning gap by providing users with the essential ability to change their global display name and delete their account.

### **1.1 Detailed Description**
*   This work involves the creation of a new, dedicated "Settings" screen accessible to all authenticated users. This screen will provide two core functionalities: a form to update the user's global `displayName` across the entire application, and a high-friction, multi-step confirmation process for permanent account deletion. This requires adding a new route to the application, providing a navigation path from the main dashboard, and implementing new data-layer functions to handle the modification and deletion of user profile data.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Client Sovereignty:** The entire account management process will be handled by client-side logic interacting directly with the backend-as-a-service.
    *   **Quality through User-Centricity:** The account deletion process must be designed with a high-friction user experience to prevent accidental data loss.
    *   **Simplicity through Modularity:** This feature will be encapsulated in its own self-contained screen and data access functions.
*   **Blueprint-Specific Principles:**
    *   **No Cloud Functions:** All user profile updates and deletion logic must be executable on the client or through declarative database security rules.
    *   **High-Friction Deletion:** The process for deleting an account must be multi-step and require explicit user confirmation to proceed.
    *   **Separation of Name Context:** This screen's logic must only affect a user's global `displayName` and must not alter any group-specific `nickname` overrides.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A logged-in user clicks a "Settings" link or icon from the main dashboard.
    2.  The user is navigated to the new `/settings` page.
    3.  The page displays their current global name in an editable text field.
    4.  The user types a new name and clicks a "Save Changes" button. A success indicator confirms the update.
    5.  The page also displays a "Delete Account" button within a clearly marked "Danger Zone."
    6.  Upon clicking the delete button, a confirmation modal appears, explaining the permanent nature of the action.
    7.  The user must perform a confirmation action (e.g., type "DELETE" into a text field) to enable the final "Confirm Deletion" button.
    8.  Upon confirming, the system processes the deletion, signs the user out, and redirects them to the public login screen.
*   **Data Flow:**
    1.  When the Settings screen loads, the client reads the current user's profile data from the central, in-memory authentication store.
    2.  When a user saves a new display name, the client triggers a write operation to update the `displayName` field of their specific document in the `users` data collection.
    3.  The database service validates this write against security rules, ensuring users can only modify their own profile.
    4.  Upon successful write, the client updates the central, in-memory authentication store with the new name, causing all subscribed UI components to re-render.
    5.  When a user confirms account deletion, the client initiates requests to both the Authentication Service (to delete the authentication record) and the data layer (to delete the `/users/{uid}` document).
*   **Logic Flow:**
    1.  The application's root router logic will be updated to include a new, protected route for `/settings` that renders the new Settings screen component.
    2.  The Dashboard screen's logic will be updated to include a UI element that navigates the user to this new route.
    3.  The Settings screen's logic will subscribe to the central authentication store to retrieve and display the current user's data.
    4.  The logic for the "Save Changes" button will perform validation (e.g., ensuring the name is not empty) before calling the data layer function to update the user's document.
    5.  The "Delete Account" logic will manage the state of the confirmation modal. It will only enable the final confirmation button after verifying the user has completed the required high-friction step.

### **4. Overall Acceptance Criteria**
*   A logged-in user must be able to navigate from the dashboard to a dedicated `/settings` page.
*   The Settings page must correctly display the user's current global display name.
*   A user must be able to successfully update their global display name, and this change must be persisted in the database and reflected in the application's state.
*   The account deletion flow must be protected by a high-friction confirmation modal.
*   A user must be able to successfully delete their own account.
*   A successful account deletion must result in the user being fully signed out of the application.