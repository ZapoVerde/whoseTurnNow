/**
 * @file packages/whoseturnnow/src/shared/utils/formatDate.ts
 * @stamp {"ts":"2025-10-24T07:38:00Z"}
 * @architectural-role Utility
 * @description
 * Provides a centralized, reusable utility for safely formatting Firestore
 * Timestamp objects into human-readable strings that respect the user's
 * local timezone and locale.
 * @core-principles
 * 1. IS a pure, stateless helper function.
 * 2. MUST gracefully handle non-Timestamp objects that may appear before the
 *    server resolves the timestamp.
 * 3. MUST use the browser's native Intl API for localization.
 * @api-declaration
  - default formatFirestoreTimestamp(timestamp: any): string
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

// Define a type for Firestore-like Timestamp objects to avoid a direct dependency.
interface FirestoreTimestamp {
    toDate: () => Date;
  }
  
  /**
   * Safely formats a Firestore Timestamp into a localized date and time string.
   * @param timestamp The Firestore Timestamp object (or any object with a .toDate() method).
   * @returns A formatted string (e.g., "10/24/25, 8:15 AM") or 'Pending...' if the
   *          timestamp is not yet resolved.
   */
  export function formatFirestoreTimestamp(timestamp: any): string {
    // Type guard to check if the object is a Firestore Timestamp.
    if (timestamp && typeof timestamp.toDate === 'function') {
      const date = (timestamp as FirestoreTimestamp).toDate();
      // Use the user's default locale and timezone for formatting.
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
    }
    
    // Return a fallback for server timestamps that haven't been set yet.
    return 'Pending...';
  }