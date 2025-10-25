/**
 * @file packages/whoseturnnow/src/features/auth/NewUserHandshake.spec.tsx
 * @stamp {"ts":"2025-10-25T15:10:00Z"}
 * @test-target packages/whoseturnnow/src/features/auth/NewUserHandshake.tsx
 *
 * @description
 * Verifies the complete user interaction flow for the NewUserHandshake screen.
 * This integration test ensures that user input is correctly captured and that
 * submitting the form triggers the appropriate repository and auth store actions,
 * successfully completing the user onboarding process.
 *
 * @criticality
 * Critical (Reason: Security & Authentication Context)
 *
 * @testing-layer Integration
 *
 * @contract
 *   assertions:
 *     purity: read-only # This test file asserts on mock function calls.
 *     state_ownership: none
 *     external_io: none # Mocks MUST prevent any actual I/O.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
vi.mock('./userRepository');
vi.mock('./useAuthStore');

// --- Imports ---
import { NewUserHandshake } from './NewUserHandshake';
import { userRepository } from './userRepository';
import { useAuthStore, type AppUser, type AuthState } from './useAuthStore';

// --- Test Setup ---
const mockCreateUserProfile = vi.mocked(userRepository.createUserProfile);

const mockNewUser: AppUser = {
  uid: 'new-user-789',
  displayName: null,
  isAnonymous: true,
};

describe('NewUserHandshake', () => {
    const mockSetAuthenticated = vi.fn();
  
    // Create a complete, type-safe mock state object.
    const createMockAuthState = (user: AppUser | null): AuthState => ({
      user,
      setAuthenticated: mockSetAuthenticated,
      status: user ? 'new-user' : 'unauthenticated',
      setUnauthenticated: vi.fn(),
      setNewUser: vi.fn(),
      setStatus: vi.fn(),
    });
  
    beforeEach(() => {
      vi.clearAllMocks();
      
      // Use the factory to provide the default mock state for most tests.
      const mockState = createMockAuthState(mockNewUser);
  
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        if (selector) {
          return selector(mockState);
        }
        return mockState;
      });
    });
  
    it('should not render if there is no user in the auth store', () => {
      // ARRANGE
      // For this specific test, provide a state where the user is null.
      const nullUserState = createMockAuthState(null);
      vi.mocked(useAuthStore).mockImplementation((selector) => {
          if (selector) return selector(nullUserState);
          return nullUserState;
      });
  
      const { container } = render(<NewUserHandshake />);
      
      expect(container).toBeEmptyDOMElement();
    });
  
    it('should call createUserProfile and setAuthenticated with the correct name on submit', async () => {
      // ARRANGE
      const user = userEvent.setup();
      render(<NewUserHandshake />);
      mockCreateUserProfile.mockResolvedValue(undefined);
      const newName = 'Captain';
      const expectedProfile: AppUser = {
        ...mockNewUser,
        displayName: newName,
      };
  
      const nameInput = screen.getByLabelText(/Your Name/i);
      const submitButton = screen.getByRole('button', { name: /Let's Go/i });
  
      // ACT
      await user.type(nameInput, newName);
      await user.click(submitButton);
  
      // ASSERT
      await waitFor(() => {
        expect(mockCreateUserProfile).toHaveBeenCalledWith(expectedProfile);
        expect(mockSetAuthenticated).toHaveBeenCalledWith(expectedProfile);
      });
    });
  
    it('should disable the submit button when the input is empty or only whitespace', async () => {
      const user = userEvent.setup();
      render(<NewUserHandshake />);
      const nameInput = screen.getByLabelText(/Your Name/i);
      const submitButton = screen.getByRole('button', { name: /Let's Go/i });
  
      expect(submitButton).toBeDisabled();
  
      await user.type(nameInput, '   ');
      expect(submitButton).toBeDisabled();
  
      // Clear and type to ensure a clean state
      await user.clear(nameInput);
      await user.type(nameInput, 'Valid');
      expect(submitButton).toBeEnabled();
    });
  });