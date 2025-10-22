# **Architectural Report**

### **1. High-Level Goal & Rationale**
*   The primary objective is to refactor the entire `whoseturnnow` application to be fully compliant with the "Zero-Taste Layout Standard" and the "Zero-Taste Accessibility Standard." The rationale for this change is to enforce a consistent, professional, and responsive user interface while ensuring the application is usable by the widest possible audience, including those who rely on assistive technologies.

### **1.1 Detailed Description**
*   This work involves a comprehensive refactoring of the application's presentation layer. All existing screens and components will be audited and modified to adhere to a strict, hierarchical set of layout and accessibility rules. This includes replacing ad-hoc layout implementations with a systematic, mobile-first approach using specific layout primitives (`<Stack>`, `<Box>`). Furthermore, the application's HTML structure will be made semantically correct by introducing landmark elements, and all interactive controls will be audited to ensure they have universal, accessible labels.

### **2. Core Principles & Constraints**
*   **Governing Principles (From Project Docs):**
    *   **Quality through User-Centricity:** The entire effort is centered on improving the user experience by providing a predictable, professional, and accessible interface.
    *   **Simplicity through Modularity:** The standards themselves are a set of modular, hierarchical rules that will be applied consistently to all UI components.
*   **Blueprint-Specific Principles:**
    *   All layout design **MUST** follow a mobile-first approach.
    *   The layout hierarchy (`Container` -> `Stack` -> `Responsive Flexbox`) **MUST** be strictly adhered to.
    *   The main content area of every screen **MUST** be wrapped in a semantic `<main>` landmark.
    *   Every interactive element, especially icon-only buttons, **MUST** have an accessible text label (e.g., via an `aria-label`).
    *   In any conflict between a visual aesthetic and an accessible implementation, the accessible implementation **MUST** be chosen.

### **3. Architectural Flows**
*   **User Flow:**
    *   The functional user flow remains unchanged; users will still log in, view dashboards, and manage lists as before. The change is perceptual.
    *   A sighted user will perceive a more professional and visually consistent layout across all screens and on all device sizes. Spacing and alignment will be uniform and predictable.
    *   A user navigating with a screen reader will now be able to use landmark navigation to jump directly to the main content of any page. They will also hear a descriptive label for every interactive element, including icon-only buttons, allowing them to understand and operate the entire application.
*   **Data Flow:**
    *   This refactoring effort is confined exclusively to the presentation layer. There are **no changes** to the application's data flow, data models, or interactions with the database.
*   **Logic Flow:**
    1.  The rendering logic for each screen component will be modified. Instead of rendering content inside generic containers with manual spacing, the logic will now compose components within the prescribed layout primitives (`<Stack>`, `<Box>`).
    2.  The logic will apply responsive properties to these primitives to ensure content stacks vertically on mobile viewports and adapts appropriately for larger screens.
    3.  The root content container for each screen will be logically designated as the main content landmark.
    4.  The rendering logic for all interactive elements, particularly icon-only buttons, will be updated to conditionally include an `aria-label` attribute that describes the element's function (e.g., "Account settings").

### **4. Overall Acceptance Criteria**
*   All existing feature-level integration tests must continue to pass without modification.
*   The primary content area of every screen (`DashboardScreen`, `GroupDetailScreen`, etc.) must be rendered within a semantic `<main>` HTML element.
*   Layouts that are primarily single-axis (like forms) must be implemented using the `<Stack>` primitive, and all spacing must be controlled by the `spacing` prop.
*   All interactive elements that do not have visible text (i.e., icon-only buttons) must have a descriptive `aria-label` attribute.
*   When visually inspected, the application's layout must be responsive and correctly adapt from a single-column mobile view to multi-column or wider views on desktop.
*   An automated accessibility audit (e.g., using browser developer tools) must pass with no critical errors related to content landmarks or control labeling.