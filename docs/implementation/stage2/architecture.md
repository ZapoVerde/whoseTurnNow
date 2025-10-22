
Here is the detailed Architectural Report for Stage 2.

 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to enable users to create the core data entities, referred to as "Lists," and to view them on a central dashboard. The rationale is to establish the main organizing principle of the application and provide the foundational user experience for creating and accessing their content.

### **1.1 Detailed Description**
*   This stage introduces the `Group` data entity and the user flows for its creation and display. It involves building the UI for the main user dashboard, which will be responsible for querying and displaying all the lists a user is a member of. It also includes the complete UI and logic for the "Create a New List" workflow, where a user provides a name and a personalized emoji icon. The outcome of this workflow is the creation of a new, valid `Group` document in the database, with the creator being automatically established as the first participant and the first admin. Upon creation, the user will be automatically navigated to that list's unique view.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Client Sovereignty:** All logic for creating and fetching list data will be handled by client-side code interacting directly with the database service.
    *   **Simplicity through Modularity:** This stage introduces the `Group` module, which is the central, self-contained entity for all turn-tracking activities.
*   **Blueprint-Specific Principles:**
    *   **No Cloud Functions:** All data creation and query logic will be executed on the client or through declarative database security rules.
    *   **"Council of Admins" Governance Model:** The creator of a list is not a special "owner." The system must establish them as the first participant with the `admin` role, with no other special privileges.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A logged-in user lands on their dashboard.
    2.  The dashboard displays a list of all groups they are a member of (this list will be empty on their first visit).
    3.  The user clicks a prominent "Create a New List" button.
    4.  An interface appears, prompting the user for a list name and allowing them to select an emoji icon.
    5.  The user provides the required information and confirms the creation.
    6.  The system immediately navigates the user to a new, unique URL for the created list.
    7.  On this new "Group Detail Page," the user sees the list's name and icon, and themselves as the sole participant.
    8.  If the user navigates back to the dashboard, the new list is now present in the list of their groups.
*   **Data Flow:**
    1.  When the dashboard view loads, the client executes a query against the `groups` data collection. This query is filtered to only return documents where the current user's ID is present in the roster of participants.
    2.  The list of retrieved `Group` documents is loaded into the application's state management store and rendered in the dashboard UI.
    3.  When a user initiates the "Create a New List" flow, the client captures the user-provided name and icon from the UI.
    4.  The client generates a new, unique ID for the `Group` and a separate, unique ID for the first `TurnParticipant` slot.
    5.  A new `Group` document is constructed in memory, conforming to the established data model. This document includes the name, icon, the creator's ID as the historical `ownerUid`, and a `participants` array containing a single `TurnParticipant` object for the creator. This object contains their `uid`, sets their `role` to `'admin'`, and initializes their `turnCount` to `0`. The `turnOrder` array is also initialized with the new participant's ID.
    6.  This fully-formed `Group` document is written as a new document to the `groups` data collection in the database.
    7.  The client's real-time listener, which is active on the dashboard, automatically receives the new data, causing the dashboard's UI to update.
*   **Logic Flow:**
    1.  The dashboard's core logic is governed by a data query that is dependent on the current, authenticated user's ID, ensuring strict data separation between users.
    2.  The list creation logic must enforce that the user who initiates the action is automatically set as the first participant in the new list.
    3.  This logic must also correctly implement the "Council of Admins" principle by establishing the creator as the first `admin` by correctly setting the `role` property in their `TurnParticipant` object.
    4.  Upon the successful creation of the data object in the database, the application's routing logic must programmatically redirect the user to a unique path for the newly created list, using its generated ID.
    5.  The Group Detail Page will have basic, read-only logic for this stage, responsible for fetching and displaying the data for a single `Group` based on the ID in the URL.

### **4. Overall Acceptance Criteria**
*   A logged-in user must be able to view an initially empty dashboard.
*   A user must be able to successfully initiate and complete the "Create a New List" flow, providing both a name and an icon.
*   A new `Group` document, conforming to the specified data model, must be correctly created in the database upon list creation.
*   The creator of a list must be correctly and automatically added as the first participant with the `admin` role.
*   A newly created list must immediately appear on the user's dashboard.
*   Clicking on a list on the dashboard must navigate the user to a unique, read-only "Group Detail Page" for that list, which correctly displays its name, icon, and the creator as the single participant.