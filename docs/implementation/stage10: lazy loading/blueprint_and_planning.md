# **Blueprint (Finalized)**

### **1. File Manifest (Complete Scope)**
*   `packages/whoseturnnow/src/App.tsx`

### **2. Logical Change Summary (Complete)**

#### **Core Changes:**
*   **`packages/whoseturnnow/src/App.tsx`**: This file will be refactored to implement route-based code splitting. All static, top-level imports for screen components (`LoginScreen`, `DashboardScreen`, `GroupDetailScreen`, `InvitationScreen`, and `SettingsScreen`) will be removed and replaced with dynamic `React.lazy()` imports. The main routing logic within the file will be wrapped in a `<Suspense>` component, which will be configured to render a global, full-screen loading indicator as its `fallback` UI.

#### **Collateral (Fixing) Changes:**
*   None.

### **3. API Delta Ledger (Complete)**
*   None.