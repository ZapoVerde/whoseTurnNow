/**
 * @file packages/whoseturnnow/temp-test-project/vitest.setup.ts
 * @description A temporary, isolated setup file to establish a known-good baseline.
 */
import { vi } from 'vitest';

// This setup file ONLY mocks the external libraries. When the root vitest.config.ts
// is pointed here, it will force the entire test environment to use these fakes.

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    signInWithEmailAndPassword: vi.fn(),
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));