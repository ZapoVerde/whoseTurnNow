# **Architectural Report**

### **1. System Overview**

"Whose Turn Now" is a standalone, open-source, real-time utility for tracking turns. It was built to provide a simple and transparent solution for managing recurring social tasks, using an intuitive, chat-app-like management model.

The application enables users, either anonymously or with a permanent account, to create and collaboratively manage turn-based lists. Its core functionality is centered on a **dynamic turn queue**, where completing a turn moves the participant to the bottom of the list. The system supports both registered users and offline participants via a "Managed Participant" (placeholder) system. All state-changing actions are recorded in an **immutable, timestamped log** to ensure complete transparency. The user experience is enhanced by a multi-level **"Undo Stack"** and a **"Skip Turn"** feature to provide a forgiving and flexible way to manage the queue.

### **2. Core Architectural Principles**

The application was built according to a strict set of governing principles that dictated all major technical and design decisions.

1.  **Client Sovereignty:** The application is serverless. All business logic resides on the client, interacting directly with the backend-as-a-service (Firebase). Security is enforced via declarative database security rules, not server-side code.

2.  **No Cloud Functions / Adherence to Firebase Spark Plan:** This is a hard technical and financial constraint. The entire feature set was implemented without the use of server-side functions, relying exclusively on client-side logic and Firestore's capabilities.

3.  **Immutable, Auditable Log:** Every action that changes the state of a list (completing, skipping, or undoing a turn; resetting counts) is recorded as a new, immutable entry in a permanent log. History is never deleted or modified, ensuring complete transparency.

4.  **"Council of Admins" Governance Model:** A list has no single, privileged owner. All users with the `admin` role have equal managerial power. The system enforces a "Last Admin" rule to prevent lists from becoming unmanageable.

5.  **Dynamic Queue, Not Static Rotation:** The turn order is a flexible queue. A completed or skipped turn always results in the participant moving to the end of the line.

6.  **Transparent Reversal:** The "Undo" feature does not erase history. It is a new, logged action that creates a `TURN_UNDONE` entry, transparently reversing a previous state change while preserving the full audit trail.

7.  **Apparent Simplicity:** The user interface is intentionally simple, clean, and intuitive, hiding the underlying technical complexity of its features. The cognitive load on the user is always minimized.

8.  **Professional Aesthetics:** The application's visual design is based on a mature, professional design system (Material-UI) and a strict set of internal standards (Zero-Taste). This ensures a consistent, accessible, and trustworthy user experience.

### **3. Architectural Flows**

#### **User Flow**

This describes the complete end-to-end user experience of the V1 application.

1.  **Onboarding:** A new user lands on the application and chooses between creating a permanent account (e.g., via Google) or starting instantly with an anonymous one. If the user is new, the system performs a "First-Time Handshake" to capture their global display name.
2.  **Dashboard:** The user arrives at the dashboard, which displays a real-time list of all groups they are a member of. From here, they can create a new list by providing a name and an emoji icon.
3.  **Group Interaction:** Upon entering a group, the user sees the main interactive view:
    *   A dynamically ordered list of participants, with the person at `turnOrder[0]` clearly marked as being next.
    *   A context-aware action bar at the bottom. The primary button reads "Complete My Turn" if it is their turn, or "Take My Turn" if it is not.
    *   If it is their turn, a secondary "Skip Turn" button is also visible.
4.  **Core Actions:**
    *   **Completing a Turn:** Moves the participant to the bottom of the list and increments their turn count.
    *   **Skipping a Turn:** Moves the participant to the bottom of the list but does *not* increment their turn count.
5.  **Administrative Actions:** A user with the `admin` role has access to contextual menus to manage the list. They can:
    *   Promote, demote, or remove other participants.
    *   Complete a turn on behalf of another participant.
    *   Add new "Managed Participants" (placeholders).
    *   Reset all turn counts to zero.
    *   Change the list's name or icon.
6.  **Safety Nets:** If a mistake is made, an authorized user can click the "Undo" button to transparently reverse the last completed turn.
7.  **Settings:** From the dashboard, any user can navigate to the global Settings page to change their display name, customize the application's theme (light/dark mode, density), or initiate the high-friction account deletion process.
8.  **Transparency:** At all times, the user can view a complete, reverse-chronological, and transparent history of all actions (turns completed, skipped, undone, or counts reset) at the bottom of the group screen.

#### **Data Flow**

All state-changing user actions follow a consistent, atomic data flow pattern.

1.  A user action in the client UI (e.g., clicking "Skip Turn") triggers a dedicated function call in the `groupsRepository`.
2.  The repository function constructs a single, atomic Firestore transaction.
3.  This transaction reads the current `Group` document, modifies its state in memory (e.g., re-ordering the `turnOrder` array), and stages the updated document to be written back.
4.  Simultaneously, within the same transaction, it creates a new `LogEntry` document (e.g., a `TurnSkippedLog`) in the `/groups/{groupId}/turnLog` sub-collection, populating it with details of the action and a server-generated timestamp.
5.  The Firestore service commits this transaction, validating it against all deployed security rules.
6.  Upon successful commit, the client's real-time `onSnapshot` listeners receive the updated `Group` document and the new `LogEntry` data.
7.  The application's Zustand stores are updated, causing the UI to reactively and instantly re-render to reflect the new, correct state.

#### **Logic Flow**

The client-side application logic is responsible for deriving the UI state from the raw data.

1.  On startup, the root `App` component initializes a global listener for the authentication state, which orchestrates the rendering of the correct view (e.g., `LoginScreen`, `NewUserHandshake`, or the main application).
2.  The system determines whose turn it is by identifying the participant whose `id` is at the first index (`[0]`) of the `turnOrder` array.
3.  The main action bar's UI and behavior (e.g., the visibility of the "Skip Turn" button) are determined by a pure `useGroupDerivedState` hook that compares the current user's ID to the ID of the participant at the top of the queue.
4.  Before rendering any administrative controls, the UI logic checks the current user's `role` within the list's `participants` array to determine their permission level.
5.  The "Undo" logic queries the `turnLog` to find the most recent `TURN_COMPLETED` action that has not already been undone and that the current user is authorized to reverse, identifying it as the target for the undo action.

***

### **4. Canonical Data Model**

This section defines the canonical data structures for the entire application, serving as the definitive schema for the Firestore database.

#### **User Profile**
*   **Collection:** `/users/{uid}`
*   **Description:** A document representing a single user's global identity.

```typescript
interface AppUser {
  // The user's unique ID from Firebase Authentication.
  uid: string;
  // The user's email address (null for anonymous users).
  email: string | null;
  // The user's preferred global display name.
  displayName: string | null;
  // A flag indicating if the user is signed in anonymously.
  isAnonymous: boolean;
}
```

#### **Group**
*   **Collection:** `/groups/{gid}`
*   **Description:** The central document for a single turn-tracking list.

```typescript
interface Group {
  // The unique ID for the group document.
  gid: string;
  // The user-defined name of the list.
  name: string;
  // A single Unicode emoji character representing the list.
  icon: string;
  // A historical record of the original creator's user ID.
  ownerUid: string;
  // The complete roster of all participants in this group.
  participants: TurnParticipant[];
  // An ordered array of participant `id` strings defining the turn queue.
  turnOrder: string[];
  // A denormalized map of all participant UIDs for efficient security rules.
  participantUids: Record<string, boolean>;
  // A denormalized map of all admin UIDs for efficient security rules.
  adminUids: Record<string, boolean>;
}

interface TurnParticipant {
  // A unique, stable identifier for this participant's slot within the group.
  id: string;
  // The user `uid` linked to this slot (null for placeholders).
  uid: string | null;
  // An optional, group-specific nickname.
  nickname?: string;
  // The participant's permission level within the group.
  role: 'admin' | 'member';
  // A lifetime counter of all turns this participant has completed.
  turnCount: number;
}
```

#### **Turn Log**
*   **Sub-Collection:** `/groups/{gid}/turnLog/{logId}`
*   **Description:** The immutable audit trail for a single group.

```typescript
// A union type for all possible log events.
type LogEntry = 
  | TurnCompletedLog 
  | TurnSkippedLog 
  | TurnUndoneLog 
  | CountsResetLog;

// Represents a completed turn.
interface TurnCompletedLog {
  type: 'TURN_COMPLETED';
  completedAt: Timestamp;
  participantId: string;
  participantName: string;
  actorUid: string;
  actorName: string;
  isUndone?: boolean; // Flagged true if this action was reversed.
}

// Represents a skipped turn.
interface TurnSkippedLog {
  type: 'TURN_SKIPPED';
  completedAt: Timestamp;
  participantId: string;
  participantName: string;
  actorUid: string;
  actorName: string;
}

// Represents the reversal of a previous turn.
interface TurnUndoneLog {
  type: 'TURN_UNDONE';
  completedAt: Timestamp;
  actorUid: string;
  actorName: string;
  originalParticipantName: string;
}

// Represents an admin resetting all turn counts.
interface CountsResetLog {
  type: 'COUNTS_RESET';
  completedAt: Timestamp;
  actorUid: string;
  actorName: string;
}
```

### **5. Core Architectural Patterns**

The application's architecture is built upon a small set of well-defined, repeatable software patterns.

1.  **Repository Pattern**
    *   **Purpose:** To abstract and centralize all data access logic. No other part of the application (UI components, hooks) interacts directly with Firebase. This creates a clean, testable boundary for all I/O operations.
    *   **Implementation:** The entire data layer is split into command (write) and query (read) modules, which are then exposed as a single facade.
    *   **Examples:** `userRepository` (for user profiles) and `groupsRepository` (for all group and turn log data).

2.  **Zustand Store Pattern**
    *   **Purpose:** To manage global, reactive, client-side state. Stores act as the single source of truth for shared application state, such as the user's identity or the currently viewed group.
    *   **Implementation:** Simple, single-purpose stores are created using the Zustand library. UI components subscribe to these stores to reactively re-render when state changes.
    *   **Examples:** `useAuthStore`, `useGroupStore`, `useAppStatusStore`, `useSettingsStore`.

3.  **Headless Hook / Orchestrator Pattern**
    *   **Purpose:** To encapsulate complex business logic, side effects, and the composition of other hooks and stores. These hooks serve as the "brain" or "conductor" for a given feature, providing a clean, comprehensive view model to the UI components.
    *   **Implementation:** A primary `useFeatureName` hook (e.g., `useGroupDetail`) is created. It consumes data from stores, derives complex state, and composes action handlers from other specialized hooks, returning a single object for the UI to consume.
    *   **Examples:** `useFirebaseAuthListener` (orchestrates the entire auth lifecycle) and `useGroupDetail` (composes all logic for the group detail screen).

4.  **Circuit Breaker Pattern**
    *   **Purpose:** To provide resilience against a known failure mode: exceeding the concurrent connection limit on the Firebase Spark plan.
    *   **Implementation:** All real-time data listeners (`onSnapshot`) are wrapped in a `try...catch` block. If a `resource-exhausted` error is caught, the application's global state is transitioned to `'degraded'`, and the listener falls back to a one-time static data fetch (`getDocs`). The UI then provides manual and automatic triggers for the user to attempt a full reconnection.
    *   **Example:** The `createResilientListener` helper function and its implementation within `groups.query.ts`.