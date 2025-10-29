This document consolidates the entire V1 specification, integrating the final **System Blueprint (Architecture)** with the phased **Implementation Roadmap**, and clearly defining the role of the **User Journey** documentation.

---

# **Project Specification: AiAnvil V1 - Whose Turn Now**

This document serves as the complete, final specification for Version 1 of the application, integrating the technical blueprint, the staged implementation plan, and the user experience narrative.

## **Part I: System Blueprint (The Constitution)**

This section defines the permanent architectural constraints and the final data model for the entire application.

### **1. Vision & Guiding Philosophy**
The application is a real-time, collaborative utility designed to manage turn-based queues with maximum transparency and minimal friction, built on the principle of a **"Council of Admins"** and **Client Sovereignty**.

### **2. Core Architectural Principles**
1.  **Client Sovereignty:** All logic is client-side; security is enforced via declarative Firestore Rules. No Cloud Functions are used.
2.  **Immutability & Auditability:** All state-changing actions result in a new, immutable entry in the permanent `turnLog`.
3.  **Democratic Governance:** All admins share equal privileges, enforced by the "Last Admin" rule.
4.  **Simplicity Through Constraint:** Design is driven by defined tokens (8-point grid, 60-30-10 color rule).
5.  **Idiomatic Separation of Concerns:** Strict separation between Repository (I/O), State Management (Store/Hooks), Orchestration (Logic Gateways), and UI (Presentation).

### **3. Canonical Data Model (Firestore Schema)**

| Collection/Document | Key Fields | Security Constraint |
| :--- | :--- | :--- |
| **`/users/{uid}`** | `uid`, `displayName`, `email` \| `null` | Read/Write only by self (`auth.uid == userId`). |
| **`/groups/{groupId}`** | `gid`, `name`, `icon`, `ownerUid` (legacy), `participants` (array of objects), `turnOrder` (array of participant IDs), `participantUids` (denormalized array of UIDs). | Writes are gated by Admin role or by creating/updating membership via invitation flows. |
| **`/groups/{groupId}/turnLog/{logId}`** | `type` (Enum), `actorUid`, Timestamps. | Log creation is part of the atomic transaction of the action being logged. |

---

## **Part II: Implementation Roadmap & Stage Responsibilities**

The project is built in six sequential, verifiable stages, all adhering to the constraints set in Part I. The **System Blueprint (Part I)** is the single architectural reference for every stage.

| Stage | Stage Name | Primary Deliverable / Focus |
| :--- | :--- | :--- |
| **Stage 1** | **Identity & Session Foundation** | Complete Authentication (Anonymous/Registered), Global Name management, and root routing. |
| **Stage 2** | **Core Data Entity & Dashboard** | Implement the `Group` entity CRUD, secure creation logic, and the user's dashboard view. |
| **Stage 3** | **Dynamic Turn Cycle & Logging** | Implement the core interactive loop: dynamic queue, context-aware action button, and immutable `turnLog` for completed turns. |
| **Stage 4** | **Group Administration & Governance** | Implement all admin controls: Role management, group settings modification, turn count resets, and enforcement of the "Last Admin" rule. |
| **Stage 5** | **Social & Invitation System** | Implement generic and targeted invitation links, the joining flow, and logic for new users to claim placeholder spots. |
| **Stage 6** | **User Experience Safety Net** | Implement the LIFO "Undo Stack" feature, which reverts state, updates counts, and creates a transparent `TURN_UNDONE` log entry. |

---

## **Part III: User Experience Specification (The Final Flow)**

This section details the complete user journey from start to finish, consolidating all operational narratives from the previous flow documents.

### **Core Concepts**
*   **Participant Types:** A group slot can be a **Managed Participant** (`uid: null`) or a **Linked User** (`uid` is present).
*   **Name Context:** Users have a **Global Name** (on `/users/{uid}`) and an optional **Local Nickname** (on the `TurnParticipant` object).

### **End-to-End User Journeys**

#### **Flow 1: First-Time Onboarding (Identity)**
A user lands on the site and chooses **"Try it Now Instantly"** (anonymous session) or **"Sign Up/Log In"** (permanent account). The system performs the **First-Time Handshake** to capture their **Global Name** on their `/users/{uid}` profile document. Anonymous users are prompted to upgrade seamlessly.

#### **Flow 2: group Creation & Dashboard**
The user sees their **Dashboard** of groups. They click **"Create New group"** to provide a name and emoji icon. A new `Group` document is created, and they are the first participant with the `admin` role. They are navigated to the **Group Detail Page**.

#### **Flow 3: Core Turn Cycle (Interaction)**
On the **Group Detail Page**, the user sees the dynamic queue where **the person at `turnOrder[0]` is next**.
*   The primary action button intelligently displays **"Complete My Turn"** (if they are next) or **"Take My Turn"** (if they are not).
*   Clicking the button triggers an **Atomic Transaction** that re-orders the `turnOrder` array, increments the participant's `turnCount`, and creates a `TURN_COMPLETED` log entry.
*   The **Turn History** log displays a reverse-chronological audit trail of all completed turns.

#### **Flow 4: Group Management (Governance)**
Available to any user with the **`admin` role** in the group, accessible via the header kebab menu or contextual click menus.
*   **Participant Management:** Admins can Promote/Demote members, Remove participants, or Edit placeholder names. The system enforces the **"Last Admin" Rule**, preventing the removal/demotion of the final admin.
*   **group Settings:** Admins can change the group's name/icon.
*   **Reset Counts:** Admins can reset all participant `turnCount`s to zero via a high-friction confirmation, which logs a **`COUNTS_RESET`** event.

#### **Flow 5: Invitations & Collaboration**
Admins generate links to grow the group:
1.  **Generic Link:** Creates a new `TurnParticipant` slot when a new user joins.
2.  **Targeted Link:** Allows a new user to **claim** an existing placeholder slot by overwriting its `uid` field.
The invitee lands on a dedicated **Invitation Screen** to sign up/in before being redirected to the Group Detail Page.

#### **Flow 6: Forgiveness (The Undo Stack)**
A persistent **"Undo"** button on the Group Detail Page allows authorized users (Admin, Actor, or Subject) to reverse the **last three valid `TURN_COMPLETED` actions** in a LIFO manner.
*   **Mechanism:** A complex **Atomic Transaction** reverts the turn order, decrements the count, flags the original log entry as `isUndone: true`, and creates a new **`TURN_UNDONE`** log entry, preserving a complete audit trail.