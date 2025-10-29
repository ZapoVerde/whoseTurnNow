
---

# **User Journey Specification: AiAnvil V1 (Whose Turn Now)**

## **Document Role**
This document details the complete, end-to-end user experience for the V1 application. It describes **what the user can do**, **what they see**, and **how the system should react**, independent of the underlying database or component structure.

## **Skeleton Outline**

### **Section 1: Core Concepts & Terminology**
*   **1.1 User Identity:** Defining **Global Name** vs. **Local Nickname**.
*   **1.2 Group Structure:** Defining **Group** and **Participants** vs. **Users**.
*   **1.3 Governance:** Defining the **Council of Admins** and the **Last Admin Rule**.

### **Section 2: Flow 1 - Initial Entry & Authentication**
*   **Goal:** Securely establish or retrieve the user's identity.
*   **Sub-Flows:**
    *   2.1 Anonymous Session Start.
    *   2.2 Permanent Account Creation.
    *   2.3 Account Upgrade.
    *   2.4 Session Termination (Log Out).
    *   2.5 The "First-Time Handshake."

### **Section 3: Flow 2 - Group Management (Creation & Dashboard)**
*   **Goal:** Allow users to manage their collection of groups.
*   **Sub-Flows:**
    *   3.1 Dashboard View.
    *   3.2 Group Creation.
    *   3.3 Navigation to the Group Detail Page (Primary Interactive View).

### **Section 4: Flow 3 - The Core Turn Cycle (Interaction)**
*   **Goal:** Enable the primary function of advancing the turn queue.
*   **Sub-Flows:**
    *   4.1 Initial Queue Render.
    *   4.2 Smart Action Button Logic ("Complete My Turn" vs. "Take My Turn").
    *   4.3 Turn Advancement Transaction.
    *   4.4 Turn History Display.
    *   **4.5 The Skip Turn Action.**

### **Section 5: Flow 4 - Group Administration & Governance**
*   **Goal:** Enable collaborative management of the participant roster and group settings.
*   **Sub-Flows:**
    *   5.1 Role-Based UI Gating.
    *   5.2 Group-Level Management (Kebab Menu Actions).
    *   5.3 Participant-Level Management (Contextual Menu).
    *   5.4 "Last Admin" Rule Enforcement.
    *   5.5 Participant Self-Action.
    *   **5.6 Admin-Initiated Turn Completion.**

### **Section 6: Flow 5 - Collaboration & Invitation**
*   **Goal:** Enable users to invite new members to a group.
*   **Sub-Flows:**
    *   6.1 Invitation Link Generation (Generic vs. Targeted).
    *   6.2 The Invitee Experience (Landing Page).
    *   6.3 Joining Logic (Post-Authentication).
    *   6.4 Security & Validation.

### **Section 7: Flow 6 - The Undo Stack (Forgiveness)**
*   **Goal:** Provide a safety net for reversing recent mistakes.
*   **Sub-Flows:**
    *   7.1 UI Implementation & State Visibility.
    *   7.2 Undo Action Confirmation.
    *   7.3 The Transparent Reversal Transaction.

### **Section 8: Flow 7 - Global Settings & Theming**
*   **Goal:** Allow users to manage their global account and customize the UI.
*   **Sub-Flows:**
    *   8.1 Navigation & Access.
    *   8.2 Profile Management (Global Name Change).
    *   8.3 Theme Settings (Mode, Density, Complexity).
    *   8.4 About Section (GitHub Link).
    *   8.5 Danger Zone (Account Deletion).

## **Section 1: Core Concepts & Terminology**

This section establishes the user-facing vocabulary that governs all interactions within the application.

### **1.1 User Identity**

The system recognizes two states for a user's identity, which dictates where their data is stored and how they can interact with groups.

| Term | Definition | Storage Location | Persistence |
| :--- | :--- | :--- | :--- |
| **Global Name** | The user's default, preferred name across all groups and the application settings. This is set on the global Settings page. | `/users/{uid}` document | Permanent (even for anonymous users after first login/handoff). |
| **Local Nickname** | An optional, group-specific override for a participant's name. This can be set by a user for themselves, or by an admin for any participant, via the on-click contextual menu in the participant list. | `TurnParticipant.nickname` in the `/groups/{gid}` document. | Local to the specific Group. |
| **Anonymous User** | A user signed in via an ephemeral, temporary Auth token. They have a `Global Name` but no associated email/password. | `/users/{uid}` document (with `email: null`). | Data is preserved upon upgrade, but the session is not persistent without an upgrade. |
| **Registered User**| A user signed in with permanent credentials (Email/Password or Social Provider). | `/users/{uid}` document (with `email` present). | Persistent. |

### **1.2 Group Structure**

The primary organizing principle of the application is the **Group**. The term "Group" is used consistently in both the UI and the backend data model.

*   **Participant Slot:** A position in the turn queue. Each slot has a unique, fixed **Participant ID** (`TurnParticipant.id`) for the duration of the group's life.
*   **Membership Status:**
    *   A participant is **Linked** if their `uid` field in the slot is populated with a user's ID.
    *   A participant is a **Managed Placeholder** if their `uid` field is `null`.

### **1.3 Governance Model**

The application enforces a democratic management structure.

*   **Admin Role:** A participant with the `role: 'admin'` has the authority to manage the group's roster, settings, and history.
*   **Council of Admins:** All admins have **equal power**. There is no singular "owner" role that supersedes the admin consensus.
*   **The "Last Admin" Rule:** The system *must* prevent any action that would result in a group having zero administrators (i.e., preventing the last admin from leaving or demoting themselves).


## **Section 2: Flow 1 - Initial Entry & Authentication**

**Goal:** Securely establish or retrieve the user's identity and persist their global identifier/name before they interact with any group data.

### **2.1 Anonymous Session Start (Instant Access)**

1.  **User Action:** A new visitor lands on the site and clicks the **"Try it Now Instantly"** button.
2.  **System Action:** The application calls the Firebase Auth service to initiate an anonymous sign-in.
3.  **System State:** A new anonymous user account is created with a unique, temporary `uid`.
4.  **Next Step:** The system immediately proceeds to **Sub-Flow 1.2 (First-Time Handshake)**, as all new users, regardless of sign-in type, must establish a Global Name.

### **2.2 Permanent Account Creation (Sign Up)**

1.  **User Action:** A new visitor lands on the site and clicks **"Sign Up / Log In,"** selects the "Sign Up" tab, provides an email and password, and clicks **"Sign Up."**
2.  **System Action:** The application calls the Firebase Auth service to create a new permanent user account.
3.  **System State:** A new permanent user account is created with a unique `uid` and associated email.
4.  **Next Step:** The system immediately proceeds to **Sub-Flow 1.2 (First-Time Handshake)**.

### **2.3 Session Upgrade (Linking Identity)**

This flow is used by an existing **Anonymous User** who now wishes to save their work permanently, or by a user who wants to link an existing Google account to their existing anonymous session.

1.  **User Action:** An existing anonymous user clicks the persistent **"Save your progress"** banner (or explicitly chooses a sign-up method).
2.  **System Action:** The user completes the chosen sign-up/link method (e.g., signing in with Google or creating an email/password).
3.  **System Action (Crucial Step):** The application uses the Firebase Auth SDK's linking capability (`linkWithCredential`) to associate the *new* permanent credentials with the *existing* anonymous `uid`.
4.  **System Action:** The user's `/users/{uid}` document is updated to include their new email address (if applicable).
5.  **Result:** The user remains on the same authenticated session (`uid` is preserved), but their identity is now permanent.

### **2.4 Session Termination (Log Out)**

1.  **User Action:** A logged-in user (anonymous or permanent) navigates to **Settings** or clicks a **Log Out** button.
2.  **System Action:** The application calls the Firebase Auth service to sign the user out.
3.  **System State:** The session is terminated, and the user is redirected to the initial landing/login view.
4.  **Result:** The system state transitions to **unauthenticated**, and all local data derived from the previous session is cleared.

### **Sub-Flow 1.2: The First-Time Handshake (Name Capture)**

This flow runs **immediately after successful authentication** (for any new account, anonymous or permanent) *if* the user profile in the database does not yet exist.

1.  **Trigger:** The `useFirebaseAuthListener` hook detects that the Firebase user exists but the corresponding `/users/{uid}` document in Firestore is missing.
2.  **User Action (For Anonymous/New Permanent User):** The application presents a modal prompt: **"Welcome! Before you start, what should we call you?"** The user enters their desired **Global Name** (e.g., "Captain").
3.  **System Action:** The application constructs the initial `/users/{uid}` document containing the `uid`, the new `displayName`, and `isAnonymous: true` (if applicable). This is written to Firestore.
4.  **Result:** The system proceeds to the next stage of the application lifecycle (Dashboard).

---

## **Section 3: Flow 2 - Group Creation & Dashboard Viewing**

**Goal:** Allow authenticated users to view their existing groups and initiate the creation of a new group.

### **3.1 Dashboard View: Displaying User Groups**

This view is the landing page for authenticated users (anonymous or permanent).

1.  **Initial State:** The user lands on the Dashboard.
2.  **System Action (Data Fetch):** The application immediately queries Firestore for all `Group` documents where the user's authenticated `uid` is present in the **`participantUids`** array.
3.  **System State (Real-Time):** The list of groups updates in real-time as the user joins or is invited to new groups.
4.  **User View:** The dashboard displays each accessible group using its **emoji icon** and **group name**.
5.  **Anonymous User Condition:** If the user is anonymous, a persistent, non-intrusive banner is displayed at the top of the screen stating: *"Save your progress! Create a permanent account to keep your groups forever."*
6.  **Navigation:** Clicking on any group item navigates the user to the **Group Detail Page** (`/group/{groupId}`).

### **3.2 Group Creation Workflow**

This flow is initiated from the Dashboard via a prominent **Create New Group** action (e.g., a Floating Action Button).

1.  **User Action (Input):** The system presents a modal/dialog prompting for two inputs:
    *   **Group Name:** A required string input.
    *   **Group Icon:** A selection interface for choosing a Unicode emoji.
2.  **User Action (Confirmation):** The user confirms the creation.
3.  **System Action (Atomic Write - Group Creation):** A single transaction/write operation creates the new `Group` document in Firestore, which includes:
    *   A new unique `gid`.
    *   The provided `name` and `icon`.
    *   The creator's `uid` saved as the historical `ownerUid`.
    *   A single entry in the `participants` array for the creator, set with `role: 'admin'` and `turnCount: 0`.
    *   The creator's `uid` added to the new `participantUids` array.
    *   The creator's participant ID added to the `turnOrder` array.
    *   The creation of the first **Log Entry** (`COUNTS_RESET` or a special `GROUP_CREATED` event) in the `turnLog`.
4.  **System Action (Navigation):** Upon successful write, the application programmatically redirects the user to the new group's detail page: `/group/{groupId}`.

### **3.3 Group Detail Page (Primary Interactive View)**

This view is the main hub for all interactions with a specific group, reached after creation or by navigating from the Dashboard.

1.  **System Action (Data Fetch):** The page establishes real-time listeners for the specific `Group` document and its `turnLog` sub-collection, based on the ID in the URL.
2.  **User View:** The page displays the group's **icon and name** in the header and the full, interactive participant list. This is where all core actions, such as taking turns, skipping turns, and group management, are performed.

## **Section 4: Flow 3 - The Core Turn Cycle (Interaction)**

**Goal:** To implement the primary, repeated interactive loop of the application: advancing the turn queue dynamically, updating statistics, and maintaining a transparent, immutable audit trail.

### **4.1 Initial Queue Render & State Recognition**

1.  **System State:** The Group Detail Page is loaded, and real-time listeners for the `Group` document and `turnLog` are active.
2.  **Next Participant Identification:** The system determines whose turn it is by identifying the participant whose ID is at the **first index (`[0]`)** of the **`turnOrder`** array.
3.  **Participant Display:** The list renders all participants, with the user at index `[0]` clearly marked with a **"Next Turn" indicator**.
4.  **Statistic Display:** Each participant row displays their **Local Nickname** (if present) or **Global Name**, and their current **Turn Count** in parentheses (e.g., `(7)`).
5.  **User Context Check:** The system compares the current viewer's `uid` against the `uid` of the participant at index `[0]` and against the roles of all participants. This comparison determines the text and function of the primary **Action Button**.

### **4.2 The Smart Action Button Logic**

The user interacts with the system via a single, prominent button at the bottom of the screen.

| User's Context | Button Text Displayed | Action Triggered |
| :--- | :--- | :--- |
| **It IS their turn** (User's `uid` matches the `uid` of the participant at `turnOrder[0]`) | **"Complete My Turn"** | Triggers the **Turn Advancement Transaction** on *their own* participant slot. |
| **It is NOT their turn** (User's `uid` does not match the user at `turnOrder[0]`) | **"Take My Turn"** | Triggers the **Turn Advancement Transaction** to move the user *out of turn* to the back of the queue. |
| **User is NOT a participant** | Button is **hidden/disabled**. | No action possible. |
| **User is an Admin, but not next** | Button text is **"Take My Turn"** (same as above). | The user can still jump the queue via this button. |

### **4.3 The Turn Advancement Transaction (Core Atomic Operation)**

This operation **MUST** be executed as a single, atomic Firestore transaction to maintain data consistency between the active state and the audit log.

1.  **Transaction Trigger:** The user clicks the enabled Action Button.
2.  **Transaction Step 1: Read Current State:** The transaction reads the current `Group` document, specifically the `turnOrder` array and the relevant participant's `turnCount`.
3.  **Transaction Step 2: Revert State (Based on Action):**
    *   **If "Complete My Turn":** The participant ID at index `[0]` is removed from the front and appended to the end of the `turnOrder` array (`unshift` then `push` on the array copy).
    *   **If "Take My Turn":** The user's participant ID is found at its current position, removed, and then appended to the end of the `turnOrder` array.
4.  **Transaction Step 3: Update Statistics:** The `turnCount` for the participant who just moved is **incremented by 1**.
5.  **Transaction Step 4: Write Group Update:** The modified `Group` document (with updated `turnOrder` and `turnCount`) is written back to Firestore.
6.  **Transaction Step 5: Create Audit Log Entry:** **Separately** (or as a second step in the transaction, depending on complexity), a new document is created in the `/turnLog` sub-collection with `type: 'TURN_COMPLETED'`, recording the `participantId`, `participantName`, `actorUid`, and `actorName`.

### **4.4 Turn History Display**

1.  **Data Source:** The UI subscribes to the `turnLog` sub-collection.
2.  **Display Order:** The logs are displayed in **reverse chronological order** (most recent at the top).
3.  **Visual Representation:** Each entry displays:
    *   **Event Type:** e.g., "Carol completed her turn," or "Dave took his turn."
    *   **Timestamp:** When the event occurred.
    *   **Actors:** Clearly indicating who performed the action.

### **4.5 The Skip Turn Action**

This flow provides a way for a user to voluntarily give up their turn.

1.  **UI Implementation:** A new, secondary **"Skip Turn" button** appears in the main action bar, but it is **only visible if it is the user's turn**.
2.  **User Action:** The user clicks the "Skip Turn" button and confirms the action via a dialog.
3.  **System Action (Atomic Write - Skip Turn):** A single transaction is executed:
    *   The user's participant ID is moved from the **front (`[0]`) to the end** of the `turnOrder` array.
    *   Crucially, their **`turnCount` is NOT incremented**.
    *   A new, distinct `TURN_SKIPPED` log entry is created in the `turnLog`.
4.  **Result:** The user is moved to the bottom of the queue, and the action is transparently logged in the Turn History.

## **Section 5: Flow 4 - Group Management & Administration**

**Goal:** Empower users with the `admin` role to collaboratively manage the participant roster, group settings, and clear the turn history, all while enforcing critical governance rules.

### **5.1 Role-Based UI Gating**

The visibility of administrative controls is strictly based on the current user's `role` within the specific group.

*   **Non-Admin User View:** Only sees the participant list, their own turn count, the action button, and the turn history. **No administrative options are visible.**
*   **Admin User View:** Sees all of the above, plus:
    *   A **Kebab Menu ("...")** in the group header for **Group-Level Actions**.
    *   Contextual options when clicking on any participant's row for **Participant-Level Actions**.

### **5.2 Group-Level Management (Kebab Menu Actions)**

These actions affect the group as a whole. They all trigger a high-friction confirmation step before executing the database write.

| Action | Triggered By | Effect on Data | Logged Event |
| :--- | :--- | :--- | :--- |
| **View Options (Toggles)** | Admin | Toggles the client-side visibility of turn counts and the turn history panel. This is a transient UI state and is not saved. | None. |
| **Change Group Name/Icon** | Admin | Updates the `name` and `icon` fields in the main `Group` document. | None (Configuration change is implicitly tracked by the log, but no dedicated log entry required). |
| **Reset All Turn Counts** | Admin $\rightarrow$ Confirmation Dialog | Updates the `turnCount` for **every** participant in the `participants` array to **0**. The **`turnOrder` array is explicitly preserved.** | **`COUNTS_RESET`** log entry created. |
| **Delete Group** | Admin $\rightarrow$ High-Friction Confirmation | Deletes the entire `/groups/{groupId}` document and its sub-collections. | Not explicitly logged (deletion is final). |

### **5.3 Participant-Level Management (Contextual Menu)**

These actions appear when an Admin clicks on a specific participant's row in the queue.

| Action | Triggered By | Effect on Data | Governance Rule |
| :--- | :--- | :--- | :--- |
| **Promote Member** | Admin on a 'member' slot | Updates the target participant's `role` from `'member'` to `'admin'`. | N/A |
| **Demote Admin** | Admin on an 'admin' slot | Updates the target participant's `role` from `'admin'` to `'member'`. | **MUST** check the **"Last Admin" Rule** before allowing the write. |
| **Remove Participant** | Admin on any slot | Removes the participant's object from the `participants` array, removes their ID from the `turnOrder` array, and removes their UID from the `participantUids` array. | **MUST** check the **"Last Admin" Rule** before allowing the write. |
| **Edit Nickname** | Any user on their own slot | Updates the target participant's `nickname` field. | N/A |
| **View Profile** | Any user on any slot | No data change; navigates to the user's public profile (if applicable) or shows local name override status. | N/A |

### **5.4 The "Last Admin" Rule Enforcement**

This is a critical safety net implemented in **both the client-side UI logic and the Firestore Security Rules**.

1.  **Client-Side Check:** Before displaying the "Demote" or "Remove" options for an Admin slot, the UI logic counts the total number of participants with `role: 'admin'`.
    *   If the count is **1**, and the user attempting the action is that single admin, the "Demote" and "Remove" options are **disabled** or hidden.
2.  **Security Rule Enforcement:** The Firestore security rule protecting the write to the `Group` document must also contain logic to count admins. If a client attempts to write a change that would result in zero admins, the database **must reject the write**, regardless of the client-side UI state.

### **5.5 Participant Self-Action**

1.  **User Action:** Any participant clicks on their own row in the queue.
2.  **Result:** A menu appears allowing them to change their **Local Nickname** for this group only. This updates the `nickname` field in their `TurnParticipant` object.

### **5.6 Admin-Initiated Turn Completion**

This flow allows an admin to manage the turn queue on behalf of others.

1.  **UI Implementation:** When an `admin` clicks on a participant who is *not* themselves, a new **"Complete Turn for [Name]"** option appears in the contextual menu.
2.  **User Action:** The admin selects this option.
3.  **System Action (Atomic Write - Delegated Turn Completion):** The system executes the same **Turn Advancement Transaction** as a normal turn, but with a crucial difference in the parameters:
    *   The `participantToMove` is the participant who was clicked on.
    *   The `actor` is the admin who initiated the action.
4.  **Result:** The selected participant is moved to the bottom of the queue and their turn count is incremented.
5.  **Logging:** A `TURN_COMPLETED` log entry is created, but the `actorName` (the admin) and `participantName` (the subject) will be different, resulting in a transparent audit trail (e.g., *"Bob's turn was completed by Sue."*).

## **Section 6: Flow 5 - Participant Invitations & The "Hand-off" Flow**

**Goal:** Implement the full suite of social features that allow **Registered Users** to join an existing group, including support for inviting new users and claiming existing placeholder slots.

### **6.1 Invitation Link Generation (Admin Action)**

This action is available only to users with the `admin` role on the Group Detail Page.

1.  **Admin Action (Generic Invite):** An admin clicks the **"Invite"** option in the group's Kebab Menu.
2.  **System Action (Link Creation):** The system generates a **Generic Invitation URL**.
    *   **Format:** `/join/{groupId}`
    *   **Purpose:** For inviting entirely new users who will occupy a new, unassigned slot.

3.  **Admin Action (Targeted Invite):** An admin clicks the **"Invite"** option next to a specific **Managed Participant** (where `uid` is `null`).
4.  **System Action (Link Creation):** The system generates a **Targeted Invitation URL**.
    *   **Format:** `/join/{groupId}?participantId={participantId}`
    *   **Purpose:** For inviting a specific user to **claim** that existing placeholder slot.

### **6.2 The Invitee Experience (Invitation Landing Page)**

When an invitee clicks a shared link, they are routed to a dedicated, context-aware landing page.

1.  **System Action (URL Parsing):** The application parses the URL to determine the `groupId` and checks for the optional `participantId` query parameter.
2.  **System State (Context):** The page loads a specific contextual message based on the URL parsing:
    *   **If `participantId` is missing:** Message indicates joining a new slot (e.g., *"You've been invited to join the 'Office Chores' group!"*).
    *   **If `participantId` is present:** Message indicates claiming a specific slot (e.g., *"You've been invited to take over the 'Billy' spot in 'Office Chores'!"*).
3.  **Authentication Prompt:** If the invitee is not authenticated, they are presented with the standard **Login/Sign Up** options (Flow 1).

### **6.3 Joining Logic (Post-Authentication)**

Once the invitee is authenticated (or signs in), the system executes the final data-write based on the context determined in step 6.2.

#### **Path A: Joining as a New Participant (Generic Link)**
1.  **System Action:** The system uses the new user's `uid` and the `groupId` from the URL.
2.  **Data Write:** The system performs a write operation to update the `Group` document:
    *   A **new** `TurnParticipant` object is created (e.g., `role: 'member'`, `turnCount: 0`, `uid: newUserId`).
    *   The new participant's unique `id` is appended to the **`turnOrder`** array.
    *   The new user's `uid` is appended to the **`participantUids`** array.
3.  **Result:** The new user appears as a new member at the **end of the queue**.

#### **Path B: Claiming a Placeholder Slot (Targeted Link)**
1.  **System Action:** The system uses the new user's `uid` and the `participantId` from the URL.
2.  **Data Write:** The system performs a write operation to update the existing `TurnParticipant` object within the `participants` array.
    *   The existing participant object matching the `participantId` has its **`uid` field updated** from `null` to the new user's `uid`.
    *   The `turnCount` and `role` of this slot are **preserved** (if the slot was already an admin, the new user inherits admin status).
3.  **Result:** The new user seamlessly takes over the placeholder slot. The `participantUids` array is automatically updated because the `uid` field in that slot changed.

### **6.4 Security & Validation**

*   **Security Rule Constraint:** Firestore security rules **MUST** prevent a user from claiming a `participantId` if its `uid` field is **already populated** (i.e., the slot is already claimed by another user).
*   **Client-Side Constraint:** The UI should ideally check this upon link generation or initial page load to provide immediate feedback if a targeted link is stale or invalid.

---

## **Section 7: Flow 6 - The "Undo Stack" Feature**

**Goal:** Implement a forgiving, multi-level "Undo" system that allows authorized users to reverse the last few completed turns while maintaining a complete, transparent audit trail.

### **7.1 UI Implementation & State Visibility**

1.  **Undo Button Location:** A dedicated **"Undo" button** (likely secondary or tertiary style) is persistently visible on the **Group Detail Page**, positioned near the primary turn action button.
2.  **Button State Control (Client-Side Logic):** The button's enabled/disabled state is dynamically controlled by scanning the active `turnLog` for reversible actions:
    *   **Enabled:** If the system can find at least one valid, un-undone `TURN_COMPLETED` entry within the last **three** total completed actions.
    *   **Disabled:** If no such action exists, or if all three most recent actions have already been undone.
3.  **Turn History Display Update:** The logic for rendering the Turn History is updated to visually represent reversed actions:
    *   If a `TURN_COMPLETED` log entry has its `isUndone` flag set to `true`, the entry **MUST be visually struck through** (e.g., `<del>` tag or theme-appropriate styling).
    *   The corresponding `TURN_UNDONE` entry appears immediately above it.

### **7.2 The Undo Action Confirmation**

1.  **User Action:** An authorized user clicks the enabled **"Undo"** button.
2.  **System Action:** A high-friction, simple confirmation modal appears: **"Are you sure you want to undo the last completed turn? This action will be logged."**
3.  **User Action:** The user confirms the action.

### **7.3 The Transparent Reversal Transaction (Core Atomic Operation)**

This entire sequence **MUST** execute as a single, atomic Firestore transaction to guarantee state consistency between the `Group` document and its `turnLog`.

1.  **Transaction Step 1: Identify Target Log:** The system scans the most recent, un-undone `TURN_COMPLETED` log entries (LIFO) to find the **exact log document** to reverse. This target log must exist and not have `isUndone: true`.
2.  **Transaction Step 2: Permission Check:** The transaction is only allowed to proceed if the *actor* (`request.auth.uid`) is one of the following:
    *   The user who performed the original action (`actorUid` of the target log).
    *   The user who is the subject of the turn (`participantId` of the target log).
    *   Any user with the `admin` role in the current group.
3.  **Transaction Step 3: Revert State on Group Document:**
    *   The transaction reads the current `Group` document state.
    *   It finds the target participant's ID in the **`turnOrder`** array.
    *   It removes the participant ID from the **end** of the `turnOrder` array and **prepends it to the beginning** (`unshift`). (Reversing the move to the back).
    *   The `turnCount` for that participant is **decremented by 1**.
    *   The updated `Group` document is written back.
4.  **Transaction Step 4: Create New Log Entry:** A new document is created in the `/turnLog` with:
    *   `type: 'TURN_UNDONE'`.
    *   Recording the `actorUid` of the user who initiated the undo.
    *   Reference to the original action (e.g., by including the original log ID).
5.  **Transaction Step 5: Flag Original Log:** The original `TURN_COMPLETED` document found in Step 1 is updated by setting the field **`isUndone: true`**.

### **7.4 System Result**

1.  The UI state reacts to the committed transaction: the participant list instantly reverts to its previous order, the count decrements, and the log now displays the reversed state with the appropriate visual strike-through effect.
2.  The "Undo" button state re-evaluates based on the new, shorter history stack.

---

## **Section 8: Flow 7 - Global Settings & Theming**

**Goal:** Provide users with a centralized location to manage their global account preferences and customize the application's appearance.

### **8.1 Navigation & Access**

1.  **User Action:** A logged-in user is on the **Dashboard Screen**.
2.  **User Action:** The user clicks the **kebab menu ("...")** in the main `AppBar`.
3.  **User Action:** The user selects the **"Settings"** option from the menu.
4.  **System Action:** The application navigates the user to the dedicated `/settings` page.

### **8.2 Profile Management**

This section of the settings page allows a user to manage their application-wide identity.

1.  **User View:** The user sees a form field pre-populated with their current **Global Display Name**.
2.  **User Action:** The user can edit this name and click a "Save Changes" button.
3.  **System Action:** The `displayName` field on the user's `/users/{uid}` document is updated. The change is immediately reflected in the application's state and UI.

### **8.3 Theme Settings**

This section allows a user to customize their visual experience.

1.  **User View:** The user sees a set of toggle buttons that display the current theme state.
2.  **User Actions:**
    *   Clicking the **"[Light/Dark] Mode"** button toggles the application's color scheme.
    *   Clicking the **"[Comfortable/Compact] Density"** button toggles the spacing and size of UI elements.
    *   Clicking the **"[Full/Simple] Complexity"** button toggles advanced visual styles like shadows and borders.
3.  **System Action:** The user's preferences are saved to the client-side `useSettingsStore`, and the application's theme is instantly re-generated and applied.

### **8.4 About Section**

This section provides meta-information about the project.

1.  **User View:** The user sees a button labeled **"View on GitHub"**.
2.  **User Action:** Clicking the button opens the project's public GitHub repository in a new browser tab.

### **8.5 Danger Zone (Account Deletion)**

This section provides a high-friction flow for permanent account deletion.

1.  **User View:** The user sees a "Danger Zone" section with a "Delete Account" button.
2.  **User Action:** The user clicks the "Delete Account" button.
3.  **System Action:** A confirmation dialog appears, explaining the permanent nature of the action and requiring the user to type the word "DELETE" to enable the final confirmation button.
4.  **Gatekeeper Check:** Before proceeding, the system checks if the user is the **last remaining admin** of any group. If they are, the deletion is blocked, and an error message is displayed explaining why.
5.  **User Action:** If not blocked, the user confirms the deletion.
6.  **System Action:** The system deletes the user's authentication record and their `/users/{uid}` document, signs them out, and redirects them to the login screen.