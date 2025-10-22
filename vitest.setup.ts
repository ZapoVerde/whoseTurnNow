/**
 * @file packages/whoseturnnow/vitest.setup.ts
 * @stamp {"ts":"2025-10-21T14:25:00Z"}
 * @architectural-role Configuration
 *
 * @description
 * This is the definitive test setup file for the @aianvil/whoseturnnow package.
 * It prepares the Vitest environment by completely mocking the external Firebase SDK
 * (app, auth, firestore) and other global dependencies like `uuid`. This ensures
 * that all tests run in a fully isolated, predictable, and offline environment. It
 * also extends the test runner's assertion library with DOM-specific matchers.
 *
 * @core-principles
 * 1. ENFORCES architectural boundaries by mocking all external services.
 * 2. MUST prevent the real Firebase SDK from being initialized during any test run.
 * 3. OWNS the responsibility for extending the test environment's capabilities (e.g.,
 *    with jest-dom matchers).
 *
 * @api-declaration
 *   - None. This file has no exports; its effects are applied globally to the
 *     test environment by Vitest.
 *
 * @contract
 *   assertions:
 *     purity: mutates # Modifies the state of the Vitest module registry and global `expect`.
 *     state_ownership: none
 *     external_io: none
 */
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// --- MOCK THE ENTIRE FIREBASE SDK (THE PROVEN PATTERN) ---

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(),
}));