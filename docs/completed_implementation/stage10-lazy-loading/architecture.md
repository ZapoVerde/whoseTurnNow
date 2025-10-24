# **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective is to improve the application's initial load performance by implementing route-based code splitting. The rationale is to reduce the size of the initial JavaScript bundle, resulting in a significantly faster "Time to Interactive" for new users and a more efficient loading experience for all.

### **1.1 Detailed Description**
*   This work involves refactoring the application's root routing mechanism to "lazy load" its screen-level components. Instead of bundling all application screens into a single, monolithic JavaScript file that is downloaded on the first visit, each screen will be compiled into its own separate "chunk." These chunks will be fetched from the server on-demand, only when a user first navigates to the corresponding route. This will be achieved by using the standard `React.lazy()` function for dynamic imports and wrapping the application's router in a `<Suspense>` component to handle the loading state.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Quality through User-Centricity:** This change directly enhances the user experience by reducing initial wait times, which is a critical quality metric for web applications.
*   **Blueprint-Specific Principles:**
    *   Code splitting **MUST** be implemented at the route level.
    *   The `React.lazy()` function **MUST** be the mechanism used for dynamically importing the screen components.
    *   A single, application-wide `<Suspense>` boundary **MUST** be placed at the root of the routing tree.
    *   A clear, non-jarring loading indicator (e.g., a full-screen spinner) **MUST** be provided as the fallback UI for the `<Suspense>` component to ensure a smooth user experience during on-demand loading.

### **3. Architectural Flows**
*   **User Flow:**
    1.  A new user navigates to the application URL.
    2.  The browser quickly downloads a small, initial JavaScript bundle and the login screen appears almost instantly.
    3.  After the user successfully authenticates, they are redirected to the dashboard.
    4.  For a brief moment, the user sees the global loading indicator.
    5.  The dashboard screen then appears.
    6.  When the user navigates from the dashboard to the settings page for the first time, they again see the global loading indicator briefly before the settings page appears.
    7.  Any subsequent navigation to an already-visited route (e.g., back to the dashboard) is instantaneous, with no loading indicator.
*   **Data Flow:**
    *   This flow describes the transfer of code assets, not application data.
    1.  The user's initial request to the server returns the main HTML file and a minimal core JavaScript bundle.
    2.  When the application's routing logic attempts to render a lazy-loaded component for the first time, it triggers a dynamic `import()` call.
    3.  This initiates a new HTTP request from the browser to the server for the specific JavaScript "chunk" file corresponding to that component.
    4.  The server responds with the requested code chunk.
    5.  The browser parses and executes this new chunk, making the component's code available, and caches it for future use.
*   **Logic Flow:**
    1.  The application's root router component no longer uses static `import` statements for its screen components. Instead, it defines them as constants using `React.lazy()`.
    2.  The main `<Routes>` component is wrapped in a `<Suspense>` component, which has a `fallback` prop pointing to the global loading indicator UI.
    3.  When the router's logic determines that a lazy-loaded component should be rendered, the React runtime checks if the component's code has been loaded.
    4.  If the code is not available, React "suspends" the rendering of that component and displays the nearest parent `<Suspense>` boundary's fallback UI instead.
    5.  Once the dynamic `import()` promise resolves (i.e., the code chunk has been downloaded and parsed), React automatically re-renders, replacing the loading indicator with the fully-loaded component.

### **4. Overall Acceptance Criteria**
*   The build process must successfully output multiple, smaller JavaScript chunk files instead of a single large application bundle.
*   The initial JavaScript file downloaded by the browser on first visit must be significantly smaller than before the change.
*   When navigating to a new, not-yet-visited route, a global loading indicator must be displayed to the user.
*   After the loading indicator disappears, the correct screen component must render and be fully functional.
*   Navigating to a previously visited route must not trigger the loading indicator and must render the component instantly.
*   All existing application functionality and integration tests must remain fully operational and pass without modification.