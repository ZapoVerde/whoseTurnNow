
---

# **Architectural Decision Record (ADR): Group Membership Query Strategy**

## **1. Decision Overview**
We have chosen to **denormalize the Group data structure** by adding a new array field, `participantUids`, to the core `Group` document. This change is necessary to enable efficient and scalable querying of a user's associated groups, directly fulfilling the requirements of the dashboard display functionality.

*   **Decision:** Implement Denormalization by adding `participantUids: string[]` to the `Group` document.
*   **Impacted Stage:** Stage 2 (List Creation and Dashboard Viewing).

## **2. Context & Problem Statement**
The Stage 2 plan required the implementation of `getUserGroups` to fetch all lists a user belongs to. The initial directive for this function specified a Firestore query to check for a user's UID *inside* the nested `participants` array within the `Group` document.

*   **The Inconsistency:** Firestore does not support querying the fields within an array of objects (e.g., `where('participants.uid', '==', userId)`). Attempting to implement the original plan would result in a non-functional or extremely costly implementation.

## **3. Considered Alternatives**

| Approach | Pros | Cons | Cost Implication (Reads/Writes) |
| :--- | :--- | :--- | :--- |
| **A. Client-Side Filter (Original Implied Logic)** | No schema change. | Non-scalable, high read volume, poor security enforcement. | **High Reads.** Reads *all* groups, quickly exhausting the Free Tier. |
| **B. Collection Group Query** | Clean query on a denormalized index collection. | High write cost (updates **two** documents per join/update). Increased total document count. | **Higher Writes** than the chosen approach. |
| **C. Denormalization (Chosen Approach)** | Efficient querying using `array-contains`. Aligns with best practices for this type of "fan-out" query. | Higher write cost *only* when a participant joins/leaves (one extra field to update on the main Group doc). | **Lowest overall operational cost** for the core user loop. |

## **4. The Chosen Solution: Denormalization**

We will proceed with **Approach C: Denormalization**.

### **Implementation Impact Summary:**

1.  **Data Model Update:** The `Group` interface in **`packages/whoseturnnow/src/types/group.ts`** must be updated to include:
    ```typescript
    interface Group {
      // ... existing fields
      participants: TurnParticipant[];
      turnOrder: string[];
      participantUids: string[]; // <-- NEW: Array of all non-null participant UIDs for querying.
    }
    ```
2.  **Write Logic Update:** All functions that modify the `participants` array (`createGroup`, `joinGroupAsNewParticipant`, `removeParticipant`, etc.) must be updated to **ensure the new `participantUids` array is perfectly synchronized** with the UIDs present in the `participants` array.
3.  **Query Logic Update:** The `getUserGroups` function in **`packages/whoseturnnow/src/features/groups/groupsRepository.ts`** will now use the supported Firestore query:
    ```typescript
    where('participantUids', 'array-contains', userId)
    ```

## **5. Cost & Free Tier Justification**
This approach provides the best cost profile:

*   **Writes are Minimal:** An update only requires modifying one document (the `Group` doc) to update two arrays within it, keeping write operations low and sustainable under the 20,000/day limit.
*   **Reads are Targeted:** Queries only read the exact documents needed (the user's groups), making the read usage extremely low, well within the 50,000/day limit, even with multiple page loads.

This architectural refinement ensures that the application remains cost-effective and scalable within the constraints of the Free Tier while achieving the necessary functionality.