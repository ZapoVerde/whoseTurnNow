[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Code Style: ESLint](https://img.shields.io/badge/code%20style-ESLint-563d7c.svg)](https://eslint.org/)

---

# Whose Turn Now


A lightweight, real-time, open-source utility for tracking whose turn it is. Manage your turn-based lists as easily and intuitively as a WhatsApp group.

**Live Demo:** [whoseturnnow.web.app](https://whoseturnnow.web.app) *(Link will be live upon deployment)*

![Screenshot of Whose Turn Now App](https://via.placeholder.com/800x450.png?text=App+Screenshot+Coming+Soon)

## The Philosophy

"Whose Turn Now" is designed to solve a simple, recurring social problem with a clean, transparent, and forgiving interface. The core principle is that the turn-tracking list should be a **dynamic queue**, not a static rotation. The application is built on an immutable, auditable log, ensuring every action is recorded and verifiable to avoid any "sneaky shit."

## Core Features

*   **⚡️ Instant Anonymous Use:** Start using the app instantly without an account. Your lists are saved to your session, and you can create a permanent account later to save them forever.
*   **🔄 Dynamic Turn Queue:** The person at the top of the list is always next. When a turn is completed, they move to the bottom. Simple, visual, and intuitive.
*   **👥 Managed Participants:** Keep track of turns for anyone, even if they don't have the app. Perfect for managing kids' chores, pets, or friends who aren't online.
*   **🤝 "Council of Admins" Management:** All admins have equal power to manage a list, add participants, and promote other admins. There's no single "owner" bottleneck.
*   **↩️ Multi-Level Undo Stack:** Accidentally clicked the button? No problem. The app supports undoing the last three turns. Every undo is a transparent, logged action.
*   **📜 Immutable Turn History:** Every action—completing a turn, resetting counts, or undoing an action—is recorded in a permanent, timestamped log for full transparency.
*   **🎨 Personalized Lists:** Give your lists personality with a selectable emoji icon.
*   **🔗 Invite via Link:** Easily invite friends to join your list with a simple, shareable URL.

## Tech Stack

*   **Framework:** [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **UI:** [Material-UI](https://mui.com/)
*   **Package Manager:** [pnpm](https://pnpm.io/) (within a monorepo)

## Getting Started

This project is part of a monorepo. To run it locally, follow these steps from the repository root:

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/your-monorepo.git
cd your-monorepo
```

**2. Install dependencies:**
```bash
pnpm install
```

**3. Set up your Firebase project:**
*   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
*   Enable **Authentication** (Email/Password and Google providers).
*   Enable **Firestore Database**.
*   In your project settings, create a new Web App and copy the Firebase configuration object.

**4. Create an environment file:**
*   In the `packages/whoseturnnow` directory, create a file named `.env`.
*   Add your Firebase configuration to the `.env` file using the Vite environment variable format:
    ```
    VITE_FIREBASE_API_KEY="your-api-key"
    VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    VITE_FIREBASE_PROJECT_ID="your-project-id"
    VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    VITE_FIREBASE_APP_ID="your-app-id"
    ```

**5. Run the development server:**
```bash
pnpm --filter @aianvil/whoseturnnow dev
```
The application will be running at `http://localhost:5173`.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see `CONTRIBUTING.md` for guidelines on our development process.

## License

Distributed under the MIT License. See `LICENSE` for more information.