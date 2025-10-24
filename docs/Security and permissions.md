# "Whose Turn Now" Security & Permissions Guide

This document provides a definitive overview of the data access and security model for the "Whose Turn Now" application. It explains the core philosophy of the security rules and details who can perform what actions under which conditions.

## Part I: The Security Philosophy

The application's security is built on a "Public Read, Gated Write" model, which is enforced by the `firestore.whoseturnnow.rules` file.

1.  **Users Own Their Identity:** A user has exclusive control over their own profile document (`/users/{userId}`). No other user can read or modify another's global profile.

2.  **Groups are Publicly Viewable, Democratically Managed:** A group's data is **readable by any authenticated user who has the direct link (the group ID)**. This is an intentional architectural choice to simplify the invitation and joining flow. The privacy of a list relies on the non-guessable nature of its ID. However, all **write access** (modifying, deleting, or managing the group) is strictly limited to its members, with permissions based on their role ("Council of Admins" model).

3.  **History is Immutable:** The turn log is an audit trail. While new events can be added, existing log entries can never be deleted and can only be modified in one specific way: to flag a completed turn as "undone." This ensures a transparent and trustworthy history of all actions.

## Part II: Detailed Permissions Matrix

This table breaks down the specific rules for each type of data in the Firestore database.

| Collection / Action | Who Can Perform It? | Conditions |
| :--- | :--- | :--- |
| **User Profile** (`/users/{userId}`) |
| `read`, `write` | The user themselves | The user's authenticated `uid` must exactly match the `userId` of the document they are trying to access. |
| `delete` | The user themselves | This action is initiated from the client. The client performs a **gatekeeper check** first: it will block the deletion request if the user is the last remaining admin of any group to prevent orphaning. |
| **Group Document** (`/groups/{groupId}`) |
| `get` (read a single document) | **Any authenticated user** | The user must be logged in. This allows the invitation flow's transaction to read the group before a user officially joins. |
| `list` (query the collection) | **Any authenticated user** | The user must be logged in. This rule is permissive to allow for flexible querying. Client-side code is responsible for applying filters (e.g., `where('participantUids', 'array-contains', userId)`) for views like the dashboard. |
| `create` | Any authenticated user | The user must be logged in, and the new group document they are creating must be perfectly formed: they are listed as the `ownerUid` and are the sole initial participant with the `admin` role. |
| `update` | An existing **admin** of the group | The user is an admin, and the change does not result in the group having zero admins (the "Last Admin Rule"). |
| `update` | Any **member** of the group | This is for taking or skipping a turn. The write is only allowed if it **only** modifies the fields related to the participant roster (`participants`, `turnOrder`, `participantUids`, `adminUids`), preventing a member from changing the group's name or icon. |
| `update` | An authenticated user **joining** the group | The user is logged in, is not currently a member, and the update adds their `uid` to the `participantUids` map. |
| `update` | A group member **leaving** the group | The user is currently a member, the update removes their `uid` from the `participantUids` map, and this action does not violate the "Last Admin Rule". |
| `delete` | An existing **admin** of the group | The user's role in the group's `participants` array must be `admin`. |
| **Turn Log** (`/groups/{groupId}/turnLog/{logId}`) |
| `read`, `create` | Any member of the group | The user must be authenticated, and their `uid` must be in the parent group's `participantUids` map. |
| `update` | Any **admin** of the group | This action is only for the "Undo" feature. The update is only allowed if it sets the `isUndone` flag to `true`, and the user initiating the action is an admin of the parent group. |
| `delete` | **No one** | Log entries are immutable and can never be deleted through the client application. |

## Part III: Anonymous vs. Registered Users

A core feature of the application is "Instant Access" via anonymous accounts. From a security perspective, it's critical to understand that the database **does not distinguish between anonymous and registered users.**

The only factor that matters to the security rules is whether a user is authenticated, meaning they have a valid session and a unique User ID (`uid`).

### Permission Equivalence Table

| Action | Anonymous User | Registered User | Explanation |
| :--- | :--- | :--- | :--- |
| **Create a Group** | ✅ **Allowed** | ✅ **Allowed** | Both are authenticated and can create a new group, becoming its first admin. |
| **Read/Update a Group** | ✅ **Allowed** | ✅ **Allowed** | Read permissions are public for authenticated users. Write permissions depend on group membership and role, which are tied to the user's `uid`, not their registration status. |
| **Delete a Group (as Admin)** | ✅ **Allowed** | ✅ **Allowed** | If an anonymous user is an admin, they have the same power to delete a group as a registered admin. |
| **Create/Undo Log Entries** | ✅ **Allowed** | ✅ **Allowed** | All log-related permissions are based on group membership or role, which applies equally to both user types. |

### Architectural Implication: Persistence vs. Permission

The difference between an anonymous and a registered user is not about *what they can do*, but about the *permanence of their access*.

*   **Anonymous User:** Has full capabilities but their session is **ephemeral**. If they clear their browser data or switch devices, they lose their `uid` and, with it, access to all their groups.
*   **Registered User:** Has a **permanent** identity. They can sign out and sign back in from any device to regain access to their `uid` and all associated data.

The application's "Save your progress" feature is the client-side mechanism that bridges this gap. It allows a user to link permanent credentials (like an email or Google account) to their existing anonymous `uid`, effectively converting their ephemeral session into a permanent one without any data loss or change in permissions.