
 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to build the foundational user identity and session management system for the application. The rationale is to establish a secure, stable, and verifiable base for all subsequent features by implementing a complete authentication and user profile lifecycle.

### **1.1 Detailed Description**
*   This stage involves the creation of the core application shell and the full implementation of its authentication system. The system will support two distinct user pathways: a permanent, registered account created via an email/password or a social provider, and a temporary, anonymous session that allows instant access. The logic will handle the initial creation of a user's profile in the database, the capture of their global display name, and the seamless process of upgrading an anonymous account to a permanent one while preserving their unique identity and any future data.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Client Sovereignty:** The entire authentication and user management process will be handled by client-side logic interacting directly with the backend-as-a-service provider.
    *   **Simplicity through Modularity:** This stage establishes the first core, self-contained module (user identity) upon which all other modules will depend.
*   **Blueprint-Specific Principles:**
    *   **No Cloud Functions / Adherence to Firebase Spark Plan:** All user profile creation and session management logic must be executed on the client or through declarative database security rules.
    *   **Decoupled Identity:** The application's internal state for a user will be a simplified representation, decoupled from the complex object provided by the authentication service.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A user arrives at the application's entry point and is presented with two primary options: sign up for a permanent account or start an anonymous session.
    2.  **Permanent Path:** The user provides their credentials. Upon successful authentication, they are taken to a placeholder dashboard view.
    3.  **Anonymous Path:** The user selects the instant access option. The system prompts them to provide a global display name. After they provide a name, they are taken to the placeholder dashboard view.
    4.  An anonymous user will see a persistent, non-intrusive banner prompting them to save their progress by creating a permanent account.
    5.  Clicking this banner initiates the account upgrade flow, where the user provides permanent credentials. Upon completion, the banner disappears, and their session is now permanent.
    6.  Any user can navigate to a settings page where they can view and change their global display name.
    7.  Any user can log out, which returns them to the sign-in view.
*   **Data Flow:**
    1.  A user's credentials or request for an anonymous session are sent from the client to the Authentication Service.
    2.  The Authentication Service validates the request and returns a user object containing a unique, stable user ID (`uid`).
    3.  The client receives this user object and immediately queries the `users` data collection for a document corresponding to the received `uid`.
    4.  **If a `User` document does not exist:** It signifies a first-time sign-up. The client constructs a new `User` document containing the `uid`, email (if available), the user-provided or default display name, and a creation timestamp. This document is written to the `users` collection.
    5.  **If a `User` document does exist:** It signifies a returning user. The client reads this document to retrieve their profile information.
    6.  The authenticated user's profile data (`uid`, `displayName`, anonymous status) is loaded into the application's central, in-memory state management store.
    7.  For an account upgrade, the client sends the new permanent credential and the existing anonymous user's session to the Authentication Service, which links them. The client then updates the corresponding `User` document with the new email address.
*   **Logic Flow:**
    1.  On application startup, the system subscribes to the Authentication Service to listen for real-time changes in the user's session state.
    2.  While awaiting the initial state from the service, the application's logic renders a system-wide "initializing" view to prevent UI flicker.
    3.  Upon receiving a state update, the logic determines if the user is authenticated or not.
    4.  If the user is not authenticated, the application logic routes them to the sign-in view.
    5.  If the user is authenticated, the logic routes them to the main application view (a placeholder dashboard for this stage).
    6.  The logic for handling a successful authentication event includes the conditional step of checking for a user's profile document's existence to differentiate between a new and returning user, ensuring a profile is created only once.
    7.  The logic for changing a global name involves a direct write operation to the `displayName` field of the current user's document in the `users` collection.

### **4. Overall Acceptance Criteria**
*   A new user must be able to successfully create a permanent, registered account.
*   A new user must be able to successfully start and use the application in an anonymous session.
*   The system must correctly capture and persist a user's global display name in the `users` data collection for both anonymous and registered users.
*   An anonymous user must be able to successfully upgrade to a permanent account, and the system must preserve their original user ID and associated data.
*   A logged-in user must be able to log out, and a logged-out user must be able to log back in.