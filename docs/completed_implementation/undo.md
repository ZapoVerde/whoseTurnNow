

Here is the final, definitive blueprint for what we will call the **"Undo Stack" Model.**

### **Core Principles of the "Undo Stack"**

1.  **Persistent Button:** An "Undo" button is always present on the Group Detail Page, not temporarily. It is only *enabled* if there is a valid action to undo.
2.  **Limited Depth:** The stack has a memory. We will allow the last **three** `TURN_COMPLETED` actions to be reversible.
3.  **Logged Action:** Every "Undo" is a new, permanent `TURN_UNDONE` event in the log, creating a complete and transparent audit trail.
4.  **Strictly LIFO (Last-In, First-Out):** The "Undo" button **always** reverses the most recent action that has not yet been undone.

---

### **1. The User Flow & UI**

*   **Location:** On the Group Detail Page, there will be a dedicated, persistent **"Undo" button**. It will likely be a secondary button near the primary "Take a Turn" action button.
*   **State:** The "Undo" button will be **enabled** if there is at least one reversible action within the last three turns. If there are no actions to undo (e.g., at the start of a list, or after three consecutive undos), the button will be **disabled**.
*   **The Action:** An authorized user (Admin, Actor, or Subject) clicks the enabled "Undo" button.
*   **Confirmation:** A simple confirmation appears: "Undo the last turn?"
*   **The Result:** The most recent turn is reversed. The on-screen participant list instantly updates, and the "Undo" button remains enabled if there are still more actions on the stack to undo.

---

### **2. The "Behind the Scenes" Logic**

This is how the app knows what to do.

1.  **Finding the Target:** When the "Undo" button is clicked, the app queries the `turnLog` for that group, ordering by timestamp descending, with a limit of ~5-10 entries. It then scans this list to find the **most recent log entry** where `type === 'TURN_COMPLETED'` and `isUndone !== true`. This is the "target action" to be undone.
2.  **Permission Check:** The app checks if the current user is an Admin, the `actorUid` from the target action, or the `participantId`'s `uid` from the target action.
3.  **The "Transparent Reversal" Transaction:** If permissions pass, the app executes the atomic transaction:
    *   **Reverses Turn Order:** Moves the target participant back to the top of the `turnOrder` list.
    *   **Decrements Turn Count:** Decrements the target participant's `turnCount`.
    *   **Logs the Undo:** Creates a new `TURN_UNDONE` log entry.
    *   **Flags the Original:** Sets `isUndone: true` on the target `TurnCompletedLog` document.

---

### **3. A Concrete Example: The Stack in Action**

This illustrates the LIFO (Last-In, First-Out) logic perfectly.

**Initial State:**
*   **Queue:** `[Carol, Dave, Jeremy]`

**Action 1: Carol takes her turn.**
*   **Queue:** `[Dave, Jeremy, Carol]`
*   **Log:** `(Log #1) Carol's turn completed.`
*   *Undo Stack: `[Log #1]`*

**Action 2: Dave's turn is completed.**
*   **Queue:** `[Jeremy, Carol, Dave]`
*   **Log:** `(Log #2) Dave's turn completed.`
*   *Undo Stack: `[Log #1, Log #2]`*

**Action 3: Jeremy takes his turn.**
*   **Queue:** `[Carol, Dave, Jeremy]`
*   **Log:** `(Log #3) Jeremy's turn completed.`
*   *Undo Stack: `[Log #1, Log #2, Log #3]`*

---

**Now, the User clicks "Undo" for the first time:**

*   **Target:** The most recent un-undone action is `Log #3` (Jeremy's turn).
*   **Result Queue:** `[Jeremy, Carol, Dave]` (Jeremy is moved back to the top).
*   **New Log Entry:** `(Log #4) Undo Jeremy's turn.`
*   **Updated Log View:**
    > • `Undo Jeremy's turn.`
    >
    > • ~~`Jeremy's turn completed.`~~
    >
    > • `Dave's turn completed.`
    >
    > • `Carol's turn completed.`
*   *Undo Stack is now: `[Log #1, Log #2]`*

**The User clicks "Undo" a second time:**

*   **Target:** The most recent un-undone action is now `Log #2` (Dave's turn).
*   **Result Queue:** `[Dave, Jeremy, Carol]` (Dave is moved back to the top).
*   **New Log Entry:** `(Log #5) Undo Dave's turn.`
*   *Undo Stack is now: `[Log #1]`*
