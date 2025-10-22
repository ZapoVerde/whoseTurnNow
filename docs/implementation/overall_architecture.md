# **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective is to build a new, standalone, open-source application named "Whose Turn Now." The core rationale is to provide a simple, transparent, and real-time utility for tracking turns in recurring social tasks, designed with an intuitive, chat-app-like management model.

### **1.1 Detailed Description**
*   This project will establish a new, self-contained application within the existing monorepo, managed as an independent, public Git repository. The application will enable users, either anonymously or with a permanent account, to create and manage turn-based lists. The core functionality is centered on a dynamic turn queue, where the participant whose turn it is is always at the top of the list, and completing a turn moves them to the bottom. The system is designed for both online and offline participants through a "Managed Participant" (placeholder) system. All state-changing actions are recorded in an immutable, timestamped log to ensure complete transparency. The user experience is further enhanced by a multi-level "Undo Stack" to provide a forgiving way to correct mistakes.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Simplicity through Modularity:** The application is architected as a distinct, self-contained module within the monorepo.
    *   **Clarity through Explicitness:** The data model, user roles, and system states are explicitly defined and managed.
    *   **Quality through User-Centricity:** The user experience is explicitly modeled on familiar patterns (WhatsApp group management), and features like the transparent log and undo stack are prioritized.
    *   **Client Sovereignty:** The application is architected to be serverless, interacting directly with cloud services. Security and business logic are enforced by client-side code and declarative database security rules.
*   **Blueprint-Specific Principles:**
    *   **No Cloud Functions / Adherence to Firebase Spark Plan:** This is a non-negotiable constraint. All application logic must be executable on the client or through declarative Firestore Security Rules.
    *   **Immutable, Auditable Log:** Every action that changes the state of a list (completing a turn, undoing a turn, resetting counts) must be recorded as a new, immutable entry in a permanent log. History is never deleted.
    *   **"Council of Admins" Governance Model:** A list has no single, privileged owner. All admins have equal managerial power. The system will enforce a "Last Admin" rule to prevent lists from becoming unmanageable.
    *   **Dynamic Queue, Not Static Rotation:** The turn order is a dynamic queue. A completed turn always results in the participant moving to the end of the line.
    *   **Transparent Reversal:** The "Undo" feature does not erase history. It is a new action that creates a new log entry, transparently reversing a previous state change.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A new user lands on the application and chooses between creating a permanent account or starting instantly with an anonymous one.
    2.  The user provides a global default name for their profile.
    3.  They are taken to a dashboard where they can see their lists or create a new one by providing a name and an emoji icon.
    4.  Upon creating or entering a list, they see a dynamically ordered list of participants, with the person at the top being next.
    5.  The user can take a turn for themselves via a primary action button, which moves them to the bottom of the list.
    6.  An admin can manage the list by clicking on participants to promote/demote/remove them, or by using a group-level menu to add new participants, reset all turn counts, or change the list's name/icon.
    7.  If a mistake is made, an authorized user can click the "Undo" button to reverse the last completed turn.
    8.  At all times, the user can view a complete and transparent history of all actions at the bottom of the screen.
*   **Data Flow:**
    1.  A user action in the client UI (e.g., clicking "Take My Turn") triggers a data write operation.
    2.  The application logic constructs a single, atomic Firestore transaction.
    3.  This transaction reads the current `Group` document, modifies its state in memory (e.g., re-ordering the `turnOrder` array and incrementing a `turnCount`), and writes the updated document back.
    4.  Simultaneously, within the same transaction, it creates a new `LogEntry` document in the `/groups/{groupId}/turnLog` sub-collection, populating it with details of the action and a server-generated timestamp.
    5.  The Firestore service commits this transaction, validating it against the deployed security rules.
    6.  Upon successful commit, the client's real-time listeners receive the updated `Group` and new `LogEntry` data from Firestore.
    7.  The application's state management store is updated, causing the UI to reactively re-render to reflect the new, correct state.
*   **Logic Flow:**
    1.  The application's root component first determines the user's authentication status by subscribing to the authentication service. It renders a loading state, a login view, or the main application based on this status.
    2.  The system determines whose turn it is by identifying the participant ID at the first index (`[0]`) of the `turnOrder` array.
    3.  The main action button's UI and behavior are determined by comparing the current user's ID to the ID of the participant whose turn it is.
    4.  Before rendering any administrative controls, the system's logic checks the current user's `role` within the list's `participants` array to determine their permission level.
    5.  The "Undo" logic queries the `turnLog` to find the most recent `TURN_COMPLETED` action that has not already been undone, identifying it as the target for reversal.
    6.  When displaying any participant's name, the system logic first checks for a group-specific `nickname` for that user. If one is not present, it falls back to displaying the user's global `displayName`.

### **4. Overall Acceptance Criteria**
*   A user must be able to successfully create a permanent or an anonymous account.
*   A user must be able to create, configure (name/icon), and view their lists.
*   An admin must be able to add, remove, and manage the roles of participants.
*   The application must correctly update the turn order by moving a completed participant to the end of the queue.
*   Every completed turn must result in the creation of a verifiable, timestamped log entry.
*   An authorized user must be able to undo the last three completed turns, with each undo action creating its own log entry.
*   An admin must be able to reset the turn counts for all participants to zero, and this action must be logged.
*   The system must correctly prevent the last admin from leaving or being removed from a list.
*   The entire feature set must be implemented without the use of server-side Cloud Functions, relying exclusively on client-side logic and Firestore security rules.