Of course. This is the final and most critical step: translating our comprehensive design into a practical, step-by-step implementation plan.

Here is the entire project broken down into **6 sequential, non-overlapping, and verifiable tasks.** Each task builds upon the previous one, creating a logical path from a blank slate to a fully-featured application.

---

### **Task 1: Project Scaffolding & Core Authentication**

This is the foundation. The goal is to create a runnable application where users can create accounts and log in, but which has no other features yet.

*   **Actions:**
    1.  Scaffold the new Vite application at `packages/whoseturnnow`.
    2.  Install all core dependencies (`react`, `firebase`, `zustand`, `mui`, etc.).
    3.  Implement the Firebase configuration and initialization (`src/lib/firebase.ts`).
    4.  Build the routing structure (`/`, `/login`, `/settings`).
    5.  Build the UI for the Login/Sign Up page.
    6.  Implement the full anonymous and registered user authentication flows, including the "First-Time Handshake" to set a user's `Global Name`.
    7.  Implement the logic for anonymous users to upgrade to a permanent account.
    8.  Build the basic global Settings page where a user can change their `Global Name` and see a (non-functional for now) "Delete Account" button.

*   **Verification (Definition of Done):**
    *   ✅ A new user can create a registered account.
    *   ✅ A new user can start an anonymous session.
    *   ✅ A user's `Global Name` is correctly captured and stored in their `/users/{uid}` document.
    *   ✅ An anonymous user can successfully upgrade to a permanent account, preserving their original `uid` and data.
    *   ✅ Users can log out and log back in.

---

### **Task 2: List Creation & Dashboard Viewing**

The goal is to allow users to create the core `Group` objects and see them. The lists won't be interactive yet.

*   **Actions:**
    1.  Build the UI for the Dashboard, which will display a list of the user's groups.
    2.  Implement the Firestore query to fetch and display the groups a user is a member of.
    3.  Build the UI for the "Create a New List" flow (prompt for name and emoji icon).
    4.  Implement the logic to create a new `Group` document in Firestore when a user creates a list, making them the first admin.
    5.  Build the basic, read-only structure of the Group Detail Page.

*   **Verification (Definition of Done):**
    *   ✅ A logged-in user can create a new list with a name and icon.
    *   ✅ The new list appears on the user's Dashboard.
    *   ✅ Clicking on the list navigates the user to that list's unique URL (`/group/{gid}`).
    *   ✅ The Group Detail Page correctly displays the name, icon, and the initial participant (the creator).

---

### **Task 3: The Dynamic Turn Cycle & Core Logic**

This is the largest task, implementing the heart of the application. The goal is to make the lists fully interactive.

*   **Actions:**
    1.  Implement the logic for an admin to add/remove **Managed Participants** (placeholders).
    2.  Build the full UI for the Participant List on the Group Detail Page, including the turn indicator, admin badges, and turn counts.
    3.  Implement the "Top of the List is Next" model, removing the `currentTurnIndex`.
    4.  Build the smart action button that displays "Complete My Turn" or "Take My Turn."
    5.  Implement the core atomic transaction that:
        *   Moves the correct participant to the bottom of the `turnOrder`.
        *   Increments their `turnCount`.
        *   Creates a `TURN_COMPLETED` log entry in the `turnLog` sub-collection.
    6.  Build the UI for the read-only Turn History log, displaying all events.

*   **Verification (Definition of Done):**
    *   ✅ An admin can add a placeholder participant to a list.
    *   ✅ The list correctly displays the person at the top as the next turn.
    *   ✅ Clicking the action button correctly re-orders the list.
    *   ✅ The `turnCount` for the participant correctly increments.
    *   ✅ A new, accurate `TurnLogEntry` appears in the Turn History for every completed turn.

---

### **Task 4: Administrative Controls & Group Management**

The goal is to empower admins with the tools to fully manage their lists.

*   **Actions:**
    1.  Build the contextual kebab menu in the group header.
    2.  Build the contextual on-click menus for each participant.
    3.  Implement the logic for promoting a member to an admin and demoting an admin to a member.
    4.  Implement the "Last Admin" rule to prevent a group from being orphaned.
    5.  Implement the logic to change a group's name and icon.
    6.  Implement the logic for the "Reset All Turn Counts" feature, including the confirmation dialog and the creation of the `COUNTS_RESET` log entry.
    7.  Implement the logic to "Delete Group" (for admins) and "Leave Group" (for everyone).

*   **Verification (Definition of Done):**
    *   ✅ An admin can successfully promote another member to become an admin.
    *   ✅ An admin can remove a participant from the list.
    *   ✅ The "Last Admin" is correctly prevented from leaving or self-demoting.
    *   ✅ An admin can reset all turn counts, see the log entry for the action, and verify the `turnOrder` was preserved.

---

### **Task 5: Participant Invitations & The "Hand-off" Flow**

The goal is to make the lists social and allow real users to join and claim placeholder spots.

*   **Actions:**
    1.  Implement the logic to generate a generic invitation link (`.../join/{gid}`).
    2.  Implement the logic for an admin to generate a targeted "Hand-off" link for a specific placeholder (`.../join/{gid}?participantId=...`).
    3.  Build the UI for the invitation landing page that greets the user and prompts them to join.
    4.  Implement the logic for a new user to join via a generic link, creating a new participant slot for them.
    5.  Implement the logic for a new user to join via a targeted link, seamlessly claiming the placeholder spot by updating the `uid` field.

*   **Verification (Definition of Done):**
    *   ✅ A new user clicking a generic link can successfully join the group.
    *   ✅ A new user clicking a targeted link successfully takes over the intended placeholder spot.
    *   ✅ In both cases, the user now appears as a registered participant in the list.

---

### **Task 6: The "Undo Stack" Feature**

This is the final polish. The goal is to add a forgiving way for users to correct immediate mistakes.

*   **Actions:**
    1.  Build the persistent "Undo" button on the Group Detail Page UI.
    2.  Implement the logic to enable/disable the button based on whether there are valid, recent `TURN_COMPLETED` actions to reverse (up to a stack of 3).
    3.  Implement the permission check to ensure only an Admin, Actor, or Subject can perform the undo.
    4.  Implement the "Transparent Reversal" atomic transaction that:
        *   Moves the participant back to the top of the `turnOrder`.
        *   Decrements their `turnCount`.
        *   Creates a `TURN_UNDONE` log entry.
        *   Flags the original log entry with `isUndone: true`.
    5.  Update the Turn History UI to visually strike through undone actions.

*   **Verification (Definition of Done):**
    *   ✅ The "Undo" button correctly enables and disables.
    *   ✅ Clicking "Undo" correctly reverts the participant list and the turn count to their previous state.
    *   ✅ The Turn History correctly logs the `TURN_UNDONE` action and strikes through the original completed turn.
    *   ✅ The undo stack correctly works up to 3 levels deep.