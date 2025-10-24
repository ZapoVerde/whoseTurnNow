Here is the revised Architectural Decision Record (ADR) that now fully accounts for the architectural split of the original `AuthOrchestrator` into the `userRepository` and the `useFirebaseAuthListener` hook, alongside the necessary adjustments to `App.tsx` and `main.tsx`.

---

# **Architectural Decision Record (ADR): Authentication Orchestration Refinement & Split**

## **1. Decision Overview**
The initial Stage 1 plan specified the creation of a **headless React Component (`AuthOrchestrator.tsx`)** to manage the subscription to the external Firebase Auth service and synchronize the state. This plan has been **diverged from** to enforce stricter **Separation of Concerns (SOC)** and adhere to idiomatic React patterns by splitting the orchestrator's responsibilities into two distinct artifacts: a **Repository** for data access and a **Custom Hook** for lifecycle management.

*   **Divergence:** The single component was split into a Repository (for database I/O) and a Hook (for React lifecycle/service subscription).
*   **Impacted Files:** `AuthOrchestrator.tsx` and its test were eliminated, while `userRepository.ts`, `userRepository.spec.ts`, `useFirebaseAuthListener.ts`, and `useFirebaseAuthListener.spec.ts` were created to fulfill the intended goal more cleanly.

## **2. Context & Problem Statement**
The original plan to use a headless component for authentication orchestration introduced structural issues that conflicted with the project's **Coding Standard**:

1.  **Component Misuse:** A React Component is meant for rendering or local state; using it purely for global side effects violates SOC.
2.  **Coupled Logic:** The planned component would have been coupled to both the **external Firebase Auth service** (listening for state changes) AND the **internal Firestore service** (creating/fetching user profiles).

## **3. Architectural Rationale for Divergence**
The decision was made to split the responsibilities to better align with the **Principle of Single Responsibility** and maintainability:

1.  **Introduction of `userRepository.ts`:**
    *   This new file encapsulates all low-level I/O and CRUD operations against the `/users` Firestore collection. It ensures that data access logic is centralized, testable in a **Unit** environment, and completely decoupled from React.
2.  **Introduction of `useFirebaseAuthListener.ts`:**
    *   This new headless hook now correctly owns the **lifecycle and side-effect management**. It subscribes to the external Firebase Auth service and *delegates* the subsequent database calls to the `userRepository`. This makes the hook purely responsible for state synchronization.
3.  **Adjustment of Root Components:**
    *   **`App.tsx`:** The root router now directly calls the `useFirebaseAuthListener()` hook to initiate the entire authentication process on mount.
    *   **`main.tsx`:** The wrapper structure remains, but the now-unnecessary placeholder component is removed.

## **4. Implementation Summary of Changes**

| Original Plan Artifact | Status in Final Code | Rationale for Change |
| :--- | :--- | :--- |
| `AuthOrchestrator.tsx` | **REMOVED** | Logic extracted into a purpose-built Hook. |
| `AuthOrchestrator.spec.tsx` | **REMOVED** | Testing now covers the Hook and the new Repository separately. |
| **(New) `userRepository.ts`** | **CREATED** | **New Layer:** Owns all Firestore I/O for user profiles. |
| **(New) `userRepository.spec.ts`**| **CREATED** | **New Verification:** Unit test for the repository's I/O logic. |
| **(New) `useFirebaseAuthListener.ts`** | **CREATED** | **New Layer:** Owns the external Auth service subscription and state synchronization. |
| **(New) `useFirebaseAuthListener.spec.ts`**| **CREATED** | **New Verification:** Integration test for the lifecycle orchestration. |
| `App.tsx` | **MODIFIED** | Now directly calls the new hook instead of rendering the component. |

This refinement results in a **cleaner, more modular architecture** that better respects the boundaries between data access logic (Repository), service subscription logic (Hook), and UI composition (App/Components).