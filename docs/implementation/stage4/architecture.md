Of course. With the core interactive loop now in place, we will proceed to build the full suite of management tools that empower admins to collaboratively maintain their lists.

Here is the detailed Architectural Report for Stage 4.

 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to implement the complete set of administrative controls for group management, establishing the "Council of Admins" governance model. The rationale is to empower users with the tools necessary to collaboratively manage participant rosters, maintain list settings, and handle exceptional situations, making the application robust for long-term use.

### **1.1 Detailed Description**
*   This stage involves building all the user interfaces and underlying logic for privileged administrative actions. It introduces the concept of roles (`admin` vs. `member`) and the contextual menus for both group-level and participant-level management. Key features include the ability for admins to promote other members, remove participants, and change a list's name or icon. This stage also implements two critical "safety net" features: the "Last Admin" rule, which prevents lists from being orphaned, and the "Reset All Turn Counts" function, which allows admins to perform a logged, group-wide reset of statistics.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Quality through User-Centricity:** All management actions will be contextual, following the intuitive "WhatsApp model" where actions are located directly on the items they affect.
*   **Blueprint-Specific Principles:**
    *   **"Council of Admins" Governance Model:** There is no privileged "owner." All admins must have equal permissions to perform management tasks. The system's logic and security rules must reflect this.
    *   **The "Last Admin" Rule:** The system must enforce a non-negotiable rule that prevents a list from being left without at least one admin.
    *   **Immutable, Auditable Log:** Significant administrative actions, specifically resetting all turn counts, must be recorded as a new, distinct entry in the `turnLog` to ensure transparency.
    *   **Atomic State Transitions:** All management actions that modify the `Group` document must be secured by declarative security rules that validate the user's role before allowing the write to proceed.

### **3. Architectural Flows**
*   **User Flow:**
    1.  An admin user navigates to a Group Detail Page.
    2.  They click the kebab menu ("...") in the header to access group-level actions. From this menu, they can initiate changing the group's name/icon, deleting the group, or resetting all turn counts.
    3.  If they choose to reset counts, they are presented with a high-friction confirmation dialog. Upon confirmation, the turn counts for all participants reset to zero, and a corresponding entry appears in the Turn History.
    4.  The admin can also click on any participant in the list to open a contextual menu for that specific user.
    5.  From this menu, the admin can promote a member to become an admin, demote an admin back to a member, or remove the participant from the list entirely.
    6.  If the admin attempts to leave the group or demote themselves while they are the last and only admin, the action is blocked, and they are shown an explanatory message.
    7.  A non-admin user will not see these administrative options in the UI.
*   **Data Flow:**
    1.  When an admin promotes or demotes a user, the client constructs a write operation that targets the `Group` document. It finds the specific `TurnParticipant` object within the `participants` array and modifies its `role` property.
    2.  When an admin removes a user, the client updates both the `participants` array (removing the user's object) and the `turnOrder` array (removing all instances of the user's participant ID).
    3.  When an admin resets all turn counts, the client performs a transaction that iterates through the `participants` array, setting each participant's `turnCount` to `0`, and simultaneously creates a new `CountsResetLog` document in the `turnLog` sub-collection.
    4.  All of these write operations are sent to the database service, which first evaluates them against the security rules.
    5.  The security rules will read the incoming write request, fetch the existing `Group` document, and inspect the `participants` array to find the requesting user's `role`. The write is only permitted if their role is `'admin'`.
    6.  The security rule for leaving a group or demoting a user will include logic to count the number of admins in the group and will reject the request if the count is one.
    7.  Upon a successful write, the client's real-time listeners receive the updated data, and the UI re-renders to reflect the changes (e.g., a user's admin badge appears, a removed user disappears from the list).
*   **Logic Flow:**
    1.  The application's UI logic must be strictly gated by role. Before rendering any admin control (button, menu item), the logic must check the current user's `role` for the current group.
    2.  The logic for promoting/demoting involves finding and updating a specific element within the `participants` array.
    3.  The logic for removing a participant is more complex, requiring a filtering operation on both the `participants` array and the `turnOrder` array to ensure all references to the participant are removed.
    4.  The "Last Admin" check requires logic that counts the number of participants in the `participants` array whose `role` property is set to `'admin'`. If the count is 1, and the current user is that admin, demotion and leave actions are disabled in the UI.
    5.  The "Reset All Turn Counts" logic maps over the `participants` array to create a new array with all `turnCount` values set to 0, which then replaces the old array in the database write.

### **4. Overall Acceptance Criteria**
*   An admin user must be able to see and use the contextual menus for group and participant management. A non-admin user must not see these controls.
*   An admin must be able to successfully promote a member to an admin and demote an admin back to a member.
*   An admin must be able to successfully remove any participant from a list.
*   An admin must be able to successfully reset the turn counts for all participants, and this action must be verifiably logged in the Turn History.
*   The system must correctly prevent the last remaining admin in a group from leaving that group or from demoting themselves.
*   An admin must be able to successfully change a group's name and icon.
*   All administrative actions must be protected by security rules that correctly validate the user's role.