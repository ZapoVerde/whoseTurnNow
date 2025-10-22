/**
 * @file packages/whoseturnnow/src/lib/firebase.ts
 * @stamp {"ts":"2025-10-20T10:42:00Z"}
 * @architectural-role Configuration
 * @description Initializes and exports the core Firebase services (Authentication and Firestore) for the application.
 * @core-principles
 * 1. IS the single source of truth for all Firebase service instances.
 * 2. MUST NOT contain any application-specific business logic.
 * 3. MUST load its configuration from environment variables, making it environment-agnostic.
 *
 * @api-declaration
 *   - "auth": The initialized Firebase Authentication service instance.
 *   - "db": The initialized Firebase Firestore service instance.
 *
 * @contract
 *   assertions:
 *     - purity: mutates # This module has the side effect of initializing global SDKs.
 *     - state_ownership: none # It does not own any application state slices.
 *     - external_io: https_apis # It establishes connections to external Google Cloud services.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);