Of course. The application can now manage user identity and create the core data entities. We are now ready to build the primary interactive experience.

Here is the detailed Architectural Report for Stage 3.

 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to implement the complete, dynamic turn-taking cycle, which is the core interactive loop of the application. The rationale is to transform the static lists into a fully functional and interactive queue, enabling the app to fulfill its main purpose of tracking and advancing turns.

### **1.1 Detailed Description**
*   This stage focuses on making the Group Detail Page a fully interactive experience. It involves building the UI for the dynamic participant list, which will visually represent the turn queue. The core of this stage is the implementation of the "smart action button," which allows users to complete their turn or take a turn out of order. This will be powered by a single, atomic database transaction that correctly re-orders the queue, updates statistics, and writes to the immutable log. The stage also includes the implementation of the read-only Turn History log, providing users with a transparent audit trail of all completed turns.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Clarity through Explicitness:** The UI must clearly and unambiguously display who is next, the current turn order, and the history of past turns.
    *   **Quality through User-Centricity:** The interaction model must be simple and intuitive, with a single primary action button that is context-aware.
*   **Blueprint-Specific Principles:**
    *   **Immutable, Auditable Log:** Every single completed turn must be recorded as a new, immutable entry in the `turnLog`. This is a non-negotiable part of the turn-taking action.
    *   **Dynamic Queue, Not Static Rotation:** The system must implement the "Top of the List is Next" model. The `turnOrder` array is the source of truth, and the `currentTurnIndex` field will be removed from the data model.
    *   **Atomic State Transitions:** The logic for advancing a turn must be executed as a single, atomic transaction to guarantee data consistency across the `Group` document and its `turnLog`.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A user navigates to a Group Detail Page.
    2.  They see a dynamically ordered list of participants, with the person at the top clearly marked as being next. Each participant has a visible turn count next to their name.
    3.  At the bottom of the screen, they see a primary action button.
    4.  **If it is their turn (they are at the top of the list):** The button reads "Complete My Turn." They click it. The on-screen list instantly re-orders, moving them to the bottom, and their turn count increments.
    5.  **If it is not their turn:** The button reads "Take My Turn." They click it. The on-screen list instantly re-orders, moving them from their current position to the bottom, and their turn count increments.
    6.  Below the participant list, the user can view a simple, reverse-chronological "Turn History" log, which now contains a new entry for the action they just performed, showing who took the turn and when.
    7.  An admin can add a new "Managed Participant" (placeholder) to the list by providing a name. This new participant is added to the bottom of the queue.
*   **Data Flow:**
    1.  When the Group Detail Page loads, the client establishes a real-time listener for the `Group` document and for its `turnLog` sub-collection.
    2.  When a user clicks the action button, the client constructs an atomic write operation targeting the `Group` document and a new document in the `turnLog` sub-collection.
    3.  The operation reads the current `turnOrder` array and the relevant participant's `turnCount` from the `participants` array.
    4.  In memory, the client logic rearranges the `turnOrder` array by moving the correct participant ID to the end of the array. It also increments the participant's `turnCount`.
    5.  The client then constructs a new `TurnCompletedLog` document, populating it with the participant's ID and name, the current user's (actor's) ID and name, and a server-generated timestamp.
    6.  The transaction commits both the updated `Group` document and the new `TurnCompletedLog` document to the database in a single, atomic operation.
    7.  The client's real-time listeners receive the updated data, which is then passed to the state management store, causing the UI to re-render with the new turn order, updated turn counts, and the new log entry.
*   **Logic Flow:**
    1.  The core logic for displaying the turn queue is driven entirely by the order of IDs in the `turnOrder` array. The participant corresponding to the ID at index `[0]` is always rendered as the next turn.
    2.  The application logic determines the text and behavior of the main action button by comparing the authenticated user's ID with the ID of the participant at the top of the queue.
    3.  The logic for adding a managed participant involves generating a new unique ID for the participant slot, creating a `TurnParticipant` object with a `null` `uid`, and appending both the object to the `participants` array and its new ID to the end of the `turnOrder` array.
    4.  The logic for a turn-taking event must be encapsulated in a single, atomic transaction to ensure that the `turnOrder` is never updated without a corresponding log entry being created, and vice-versa.
    5.  The Turn History view's logic involves a query on the `turnLog` sub-collection, ordered by timestamp in descending order, to display the most recent events first.

### **4. Overall Acceptance Criteria**
*   The Group Detail Page must correctly display the participant at the top of the list as the next turn.
*   The smart action button must correctly display "Complete My Turn" or "Take My Turn" based on the user's position in the queue.
*   Clicking the action button must correctly and visibly re-order the participant list on screen, moving the active participant to the bottom.
*   A participant's `turnCount` must be correctly incremented after they complete a turn.
*   A new, accurate `TurnCompletedLog` entry, including both the participant and the actor, must be created and appear in the Turn History for every completed turn.
*   An admin user must be able to successfully add a new managed participant (placeholder) to the list.