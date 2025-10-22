Of course. The application is now a fully functional, self-contained management tool. The next stage is to build the features that allow it to grow by making it social.

Here is the detailed Architectural Report for Stage 5.

 # **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective of this stage is to implement the full suite of social invitation features, enabling users to add other real users to their lists. The rationale is to transform the application from a personal management tool into a collaborative, multi-user system and to provide a seamless onboarding path for new users who are invited to an existing list.

### **1.1 Detailed Description**
*   This stage focuses on creating the mechanisms by which users can join a list. It involves two distinct invitation flows. The first is a generic invitation, where an admin generates a link that allows any new user to join the list, creating a new participant slot for them. The second is a targeted "Hand-off" invitation, where an admin can generate a unique link for a specific managed placeholder, allowing a new user to sign up and seamlessly claim that existing spot. This stage includes building the invitation landing page that greets invitees and funnels them through the correct sign-up and joining logic.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Quality through User-Centricity:** The invitation and joining process must be as frictionless as possible, with clear, contextual messaging for the invitee.
    *   **Clarity through Explicitness:** The system must clearly differentiate between a generic invitation and a targeted "Hand-off" invitation, providing a distinct and unambiguous experience for each.
*   **Blueprint-Specific Principles:**
    *   **No Cloud Functions:** The entire process of a user joining a group and claiming a spot must be handled by client-side logic and secured by declarative database security rules.
    *   **URL as the Source of Truth:** The URL (`/join/{groupId}` or `/join/{groupId}?participantId=...`) is the canonical entry point and the sole determinant of the user's joining context.

### **3. Architectural Flows**
*   **User Flow (Admin/Inviter):**
    1.  An admin is on a Group Detail Page.
    2.  To invite a new, unassigned user, they open the group's kebab menu and select "Invite." This provides them with a generic join link to share.
    3.  To invite a user to take over a specific placeholder's spot (e.g., "Billy"), they click on the placeholder in the participant list and select the "Invite" action from the contextual menu. This provides them with a targeted, hand-off link to share.
*   **User Flow (Invitee):**
    1.  The invitee clicks the link they received.
    2.  They are taken to a dedicated invitation landing page.
    3.  **If it's a generic link:** The page says, "You've been invited to join 'Office Coffee Run'!"
    4.  **If it's a targeted link:** The page says, "You've been invited to take over the 'Billy' spot in 'Office Coffee Run'!"
    5.  The invitee is then prompted to either sign up for a permanent account or join the list with a new anonymous account.
    6.  After successfully authenticating, they are added to the list and redirected to the Group Detail Page, now as a participant.
*   **Data Flow:**
    1.  When an admin requests an invitation link, the client constructs the appropriate URL, either with just the `groupId` or with both the `groupId` and the `participantId` as a query parameter.
    2.  When an invitee's browser loads this URL, the client-side application parses the URL to retrieve the `groupId` and the optional `participantId`.
    3.  After the invitee authenticates, the client now has their `uid`.
    4.  **If there is no `participantId`:** The client constructs a new `TurnParticipant` object for the new user with `role: 'member'` and `turnCount: 0`. It then performs a write operation to add this new object to the `participants` array and its new ID to the end of the `turnOrder` array.
    5.  **If there is a `participantId`:** The client performs a write operation that finds the existing placeholder `TurnParticipant` object in the `participants` array and updates its `uid` field from `null` to the new user's `uid`. The `turnOrder` is not modified.
    6.  These write operations are validated by security rules, which will allow a user to add themselves to a group if they have authenticated, but not to modify other aspects of the group.
*   **Logic Flow:**
    1.  The application's router will have a dedicated route (e.g., `/join/:groupId`) to handle all incoming invitations.
    2.  The component at this route will be responsible for parsing the URL (both the path parameter and the query parameter) to understand the invitation's context.
    3.  This component's logic will first check if the current user is authenticated. If not, it will display the sign-up/in prompts.
    4.  Once the user is authenticated, the logic will proceed with one of the two database write flows: either creating a new participant or updating an existing one, based on the presence of the `participantId` in the URL.
    5.  The logic must ensure that a user cannot claim a participant slot that is already claimed (i.e., its `uid` is not `null`). This check will be enforced by both the client-side logic and the Firestore security rules.
    6.  After the database write is successful, the application logic will programmatically redirect the user to the main Group Detail Page (`/group/{groupId}`).

### **4. Overall Acceptance Criteria**
*   An admin must be able to successfully generate both a generic and a targeted invitation link.
*   A new user clicking a generic invitation link must be able to sign up/in and be successfully added as a new participant to the correct list.
*   A new user clicking a targeted invitation link must be able to sign up/in and successfully claim the specific placeholder spot, updating its `uid`.
*   The invitation landing page must display the correct contextual message based on the type of link used.
*   All invitation-based writes to the database must be protected by security rules.
*   A user should not be able to use a targeted link to claim a participant slot that has already been claimed by another user.