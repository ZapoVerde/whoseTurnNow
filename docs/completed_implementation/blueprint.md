

---

### **Topic 1 of 6: The Definitive Data Model**

This topic covers the complete Firestore database structure, serving as the technical blueprint for the application.

*   **/users/{uid}**: The global identity for a single user.
    ```typescript
    interface User {
      uid: string;
      email: string | null;
      displayName: string;
    }
    ```
*   **/groups/{groupId}**: The document for a single list.
    ```typescript
    interface Group {
      gid: string;
      name: string;
      icon: string; // Emoji
      ownerUid: string; // Historical record only
      participants: TurnParticipant[];
      turnOrder: string[]; // Ordered list of participant IDs
    }
    ```
*   **TurnParticipant**: An object within the `participants` array.
    ```typescript
    interface TurnParticipant {
      id: string;
      uid: string | null;
      nickname?: string;
      role: 'admin' | 'member';
      turnCount: number;
    }
    ```
*   **/groups/{groupId}/turnLog/{logId}**: The immutable audit trail.
    ```typescript
    type LogEntry = TurnCompletedLog | TurnUndoneLog | CountsResetLog;
    
    interface TurnCompletedLog {
      type: 'TURN_COMPLETED';
      isUndone?: boolean;
      completedAt: Firebase.Timestamp;
      participantId: string;
      participantName: string;
      actorUid: string;
      actorName: string;
    }

    interface TurnUndoneLog {
      type: 'TURN_UNDONE';
      completedAt: Firebase.Timestamp;
      actorUid: string;
      actorName: string;
      originalParticipantName: string;
    }

    interface CountsResetLog {
      type: 'COUNTS_RESET';
      completedAt: Firebase.Timestamp;
      actorUid: string;
      actorName: string;
    }
    ```

---

### **Topic 2 of 6: Onboarding & Authentication**

This topic covers how users enter and establish their identity within the application.

*   **Two Paths:** Users can either **"Sign Up / Log In"** for a permanent, registered account or click **"Try it Now Instantly"** for a fully-featured anonymous account.
*   **The First-Time Handshake:** The very first time a user account is created (anonymous or registered), the app prompts them to provide a **Global Name** (`displayName`), which is saved to their `User` profile.
*   **Anonymous Upgrading:** Anonymous users see a persistent banner prompting them to create a free account. This process links their permanent credentials to their existing anonymous `uid`, seamlessly saving all their lists and memberships.
*   **Invitations:** New users can also be brought into the app by clicking an invitation link, which funnels them into the same onboarding flows.

---

### **Topic 3 of 6: The Core User Interface & Experience**

This topic describes the main screens and visual components of the application.

*   **The Dashboard:** The app's landing page after login. It's a clean, scannable list of all the user's groups, identified by their emoji icon and name. A primary "Create New List" button is always present.
*   **The Group Detail Page (The "WhatsApp View"):**
    *   **Header:** Displays the group's icon and name, with a kebab menu for group-level actions.
    *   **Participant List (The Queue):** A dynamically ordered list where the user at the top is next. Each row displays a current turn indicator, the participant's name, an admin badge (if applicable), and their lifetime turn count `(7)`.
    *   **Turn History:** A read-only, reverse-chronological log at the bottom of the screen that shows all `TURN_COMPLETED`, `TURN_UNDONE`, and `COUNTS_RESET` events with full transparency. Undone actions are visually struck through.

---

### **Topic 4 of 6: The Turn Cycle & The Undo Stack**

This topic covers the core mechanics of how turns are taken and how mistakes are corrected.

*   **The "Top of the List" Model:** The person whose turn it is is always the participant at `turnOrder[0]`.
*   **The Core Action:** When a turn is completed, the participant who took the turn is moved from their current position to the **bottom of the list**.
*   **The Smart Action Button:** A single, primary button at the bottom of the screen intelligently changes its text and function:
    *   If it's your turn (you are at the top), it says **"Complete My Turn."**
    *   If it's not your turn, it says **"Take My Turn,"** allowing you to jump the queue.
*   **The Undo Stack:**
    *   A persistent "Undo" button is available on the Group Detail Page.
    *   It allows the **last three** `TURN_COMPLETED` actions to be reversed.
    *   It operates in a strict "Last-In, First-Out" (LIFO) order.
    *   An Undo is a new, logged action (`TURN_UNDONE`) that transparently reverses a previous turn by moving the participant back to the top of the list and decrementing their turn count.

---

### **Topic 5 of 6: Group & Participant Management**

This topic covers all administrative actions performed within a specific list.

*   **The "Council of Admins" Model:** There is no single owner. All admins have equal power to manage the group. The original creator is simply the first admin.
*   **The "Last Admin" Rule:** The app prevents the last remaining admin from leaving or demoting themselves, ensuring the group is never left unmanaged.
*   **Contextual Menus:** All management actions are contextual:
    *   **Group-Level (Kebab Menu):** Add Participant, Change Name/Icon, Reset All Turn Counts, Delete Group. The reset action is a logged, group-wide event that preserves the turn order.
    *   **Participant-Level (On-Click Menu):** An admin can click any participant to Promote/Demote, Remove, or Edit their name. Anyone can click their own name to change their local nickname.
*   **Participant Types:** Admins can add **Managed Participants** (placeholders with just a name) or invite **Registered Users** via a link. A placeholder can be seamlessly "handed off" to a real user via a special targeted invitation link.

---

### **Topic 6 of 6: Global Account Management**

This topic covers the user-specific actions that live outside of any single group.

*   **The Settings Page (`/settings`):** A dedicated page for global actions.
    *   **Change Global Name:** Allows any user (anonymous or registered) to change the default `displayName` on their `User` profile.
    *   **Delete Account:** A high-friction flow that allows a user to permanently delete their account and all associated data. It is blocked if the user is the original `ownerUid` of any groups, to protect legacy data.
*   **Local Nicknames:** While the Global Name is set in Settings, the ability to set a **Local Nickname** override is handled contextually within each group's participant list.