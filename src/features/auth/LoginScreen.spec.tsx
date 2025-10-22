/**
 * @file packages/whoseturnnow/src/features/auth/LoginScreen.spec.tsx
 * @stamp {"ts":"2025-10-21T14:10:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/LoginScreen.tsx
 *
 * @description
 * Verifies the complete user interaction flow for the LoginScreen. It ensures
 * that the UI renders correctly and that user events (button clicks, form
 * submissions) trigger the appropriate mocked authentication service calls with
 * the correct parameters.
 *
 * @criticality
 * Critical (Reason: Security & Authentication Context, I/O & Concurrency Management)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// --- Imports ---
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  type UserCredential, // Import the type we need to mock
} from 'firebase/auth';
import { LoginScreen } from './LoginScreen';

// --- Test Setup ---
const mockSignInWithEmailAndPassword = vi.mocked(signInWithEmailAndPassword);
const mockCreateUserWithEmailAndPassword = vi.mocked(createUserWithEmailAndPassword);
const mockSignInWithPopup = vi.mocked(signInWithPopup);
const mockSignInAnonymously = vi.mocked(signInAnonymously);

// A dummy UserCredential object to satisfy the promise return type.
const mockUserCredential = {} as UserCredential;

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // FIX: Resolve with a mock UserCredential object to match the real function's signature.
    mockSignInAnonymously.mockResolvedValue(mockUserCredential);
    mockSignInWithPopup.mockResolvedValue(mockUserCredential);
    mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
  });

  // ... (all test cases remain exactly the same as the previous version) ...

  it('should call signInAnonymously when "Continue Anonymously" is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const anonymousButton = screen.getByRole('button', { name: /Continue Anonymously/i });
    await user.click(anonymousButton);
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('should call signInWithPopup when "Sign in with Google" is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const googleButton = screen.getByRole('button', { name: /Sign in with Google/i });
    await user.click(googleButton);
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('should call signInWithEmailAndPassword with credentials on login', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Log In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'test@example.com',
      'password123',
    );
  });

  it('should call createUserWithEmailAndPassword with credentials on sign up', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const signUpTab = screen.getByRole('tab', { name: /Sign Up/i });
    await user.click(signUpTab);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'newpassword123');
    await user.click(signUpButton);

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'newuser@example.com',
      'newpassword123',
    );
  });

  it('should display an error message from the auth service', async () => {
    const user = userEvent.setup();
    mockSignInWithEmailAndPassword.mockRejectedValue(new Error('Firebase: Test Error.'));
    render(<LoginScreen />);
    const loginButton = screen.getByRole('button', { name: /Log In/i });

    await user.type(screen.getByLabelText(/Email Address/i), 'fail@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'anypassword');
    await user.click(loginButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Firebase: Test Error.');
  });
});