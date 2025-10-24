
---

### **Resolution Summary: Fixing the `userRepository.spec.ts` Test Suite**

**Purpose:** This document outlines the two-phase process used to resolve the failures in the `userRepository.spec.ts` test suite, transforming it from a non-functional state into a passing and robust unit test.

---

### **Phase 1: Resolving the Environment Initialization Error**

The initial and most critical failure prevented any tests from running, producing a fatal error.

*   **Problem:** The test suite immediately failed with the error `FirebaseError: Firebase: Error (auth/invalid-api-key)`.

*   **Diagnosis:** The root cause was an architectural issue with test setup. The Vitest environment was importing and executing the real `packages/whoseturnnow/src/lib/firebase.ts` module. This module's initialization code (`getAuth(app)`) attempted to connect to actual Firebase services, which failed without valid API keys. The local `vi.mock` within the spec file was being applied too late in the module loading process to prevent this.

*   **Solution:** The canonical pattern for mocking project-level service initializations was implemented:
    1.  **Created a Global Setup File:** A new file, `packages/whoseturnnow/vitest.setup.ts`, was created. Its sole responsibility is to mock the internal `firebase.ts` module, providing dummy objects for its `db` and `auth` exports.
    2.  **Updated Monorepo Configuration:** The monorepo root `vitest.config.ts` was modified to include the new setup file in its `test.setupFiles` array. This guarantees that Vitest executes our mock *before* any test files are loaded, preventing the real Firebase SDK from ever being initialized.
    3.  **Cleaned the Spec File:** The now-redundant local `vi.mock` for `../../lib/firebase` was removed from `userRepository.spec.ts`.

### **Phase 2: Correcting the Test Assertions**

After resolving the environment error, the tests began to run but failed due to incorrect assertions.

*   **Problem:** All three tests failed with assertion errors. The error logs clearly showed that the mocked `doc` function was being called with an empty object (`{}`) as its first argument, but the tests were expecting `undefined`.

*   **Diagnosis:** The test assertions were outdated. They did not account for the new, correct mocking strategy from the global setup file, which provides `{}` as the `db` instance. The test's expectations were misaligned with the correctly mocked environment.

*   **Solution:** The assertions within `userRepository.spec.ts` were updated. All instances of `expect(mockDoc).toHaveBeenCalledWith(undefined, ...)` were corrected to `expect(mockDoc).toHaveBeenCalledWith({}, ...)`, aligning the tests with the actual output of the mocked `db` object.

### **Final Outcome**

By first isolating the test environment from external services and then correcting the test's internal assertions, the `userRepository.spec.ts` suite was successfully repaired. It now passes reliably and correctly verifies the repository's logic in isolation.