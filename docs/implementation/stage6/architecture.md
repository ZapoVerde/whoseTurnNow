Of course. The application is now a fully featured, multi-user collaborative tool. This final stage implements the crucial safety net that makes the user experience forgiving and complete.

Here is the detailed Architectural Report for Stage 6.

 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to implement a robust, multi-level "Undo" feature for completed turns. The rationale is to provide a user-centric safety net that allows for the immediate and transparent correction of common mistakes, enhancing the application's usability and the integrity of its turn history.

### **1.1 Detailed Description**
*   This stage introduces the "Undo Stack" model, a stateful system for reversing the last three completed turns. It involves adding a persistent "Undo" button to the Group Detail Page UI, which is contextually enabled only when there is a valid action to reverse. An undo is not a deletion of history; it is a new, logged action that transparently reverses a previous state change. This involves a more complex atomic transaction that reverts the turn order, decrements the relevant turn count, and creates a new `TURN_UNDONE` log entry, all while flagging the original log entry as having been undone.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Quality through User-Centricity:** The undo feature must be intuitive and forgiving, providing users with confidence that they can easily correct errors.
*   **Blueprint-Specific Principles:**
    *   **Transparent Reversal:** The "Undo" feature must not erase history. It must create a new log entry that explicitly documents the reversal, maintaining a complete and trustworthy audit trail.
    *   **Strictly LIFO (Last-In, First-Out):** The undo action must always apply to the most recent, valid action that has not already been undone. This ensures a predictable and logical state machine.
    *   **Permission-Gated Action:** The ability to undo a turn is a privileged action, restricted to only those users who were directly involved in the original action or have administrative rights.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A user is on the Group Detail Page. A persistent, secondary "Undo" button is visible.
    2.  After a turn is completed, the "Undo" button becomes enabled.
    3.  An authorized user (the original actor, the subject of the turn, or an admin) clicks the "Undo" button.
    4.  A confirmation dialog appears to prevent accidental clicks.
    5.  Upon confirmation, the on-screen participant list instantly reverts to its state before the last turn was taken. The participant who was moved to the bottom is now back at the top, and their turn count is decremented.
    6.  The Turn History log updates to show a new "Turn Undone" entry, and the original "Turn Completed" entry is now visually struck through.
    7.  The "Undo" button remains enabled if there are more actions in the three-turn stack that can be undone.
*   **Data Flow:**
    1.  When a user clicks the "Undo" button, the client queries the `turnLog` sub-collection for the most recent log entries.
    2.  The client logic scans these entries to find the most recent document with `type: 'TURN_COMPLETED'` that does not have an `isUndone: true` flag. This document is the "target" of the undo operation.
    3.  The client constructs an atomic write operation.
    4.  The transaction reads the current `Group` document. In memory, it reverts the state by moving the target participant's ID from the end of the `turnOrder` array back to the beginning and decrementing their `turnCount`.
    5.  The transaction then writes this updated `Group` document back to the database.
    6.  Simultaneously, the transaction creates a new `TurnUndoneLog` document in the `turnLog` sub-collection, recording the actor and timestamp of the undo action.
    7.  Finally, the transaction updates the original "target" `TurnCompletedLog` document, setting its `isUndone` flag to `true`.
    8.  This entire transaction is validated by security rules that check the current user's permissions against the `actorUid` and `participantId` of the target log entry, as well as their admin status in the group.
*   **Logic Flow:**
    1.  The UI logic for the "Undo" button's state (enabled/disabled) is driven by a client-side query of the `turnLog`. The button is enabled only if this query finds at least one valid, reversible action within the last three completed turns.
    2.  The core undo logic is encapsulated in a single, well-defined function that performs the multi-step atomic transaction.
    3.  This function must first identify the correct log entry to reverse by implementing the LIFO (Last-In, First-Out) scan.
    4.  The logic must correctly handle the array manipulation to move the participant's ID back to the top of the `turnOrder` (e.g., using `unshift`).
    5.  The permission-checking logic must compare the current user's ID against three potential sources of authority: the `actorUid` of the target log, the `uid` of the participant whose turn is being undone, and the list of current admins for the group.
    6.  The UI logic for rendering the Turn History must be updated to check for the `isUndone` flag and apply a visual strikethrough effect to any log entry where it is `true`.

### **4. Overall Acceptance Criteria**
*   A persistent "Undo" button must be visible on the Group Detail Page.
*   The "Undo" button must be correctly enabled only when there is a valid, recent `TURN_COMPLETED` action to reverse, up to a stack of three.
*   Clicking the "Undo" button must correctly revert the participant list and the affected participant's turn count to their previous state.
*   A new, verifiable `TurnUndoneLog` entry must be created in the Turn History for every undo action.
*   The original `TurnCompletedLog` entry must be visually and logically marked as undone.
*   The undo functionality must be restricted by the specified permission rules (actor, subject, or admin).
*   The undo feature must correctly operate as a LIFO stack, always targeting the most recent valid action.