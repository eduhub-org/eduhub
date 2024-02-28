## 🧱 React App Structure and Component Usage

Components are organized based on their functionality and the pages they are used in. Here is an overview of the structure and guidelines on how to utilize the components effectively:

### Directory Structure

- `frontend-nx/apps/edu-hub/`
  - `components/`: Contains reusable UI components.
  - `pages/`: Contains the page components used for routing.
  - `hooks/`: Custom React hooks for shared logic across components.
  - `helpers/`: Utility functions for common tasks.
  - `queries/`: GraphQL queries and mutations.
  - `i18n/`: Translation files for internationalization.
  - `locales/`: Locale-specific configuration and settings.
  - `styles/`: Global styles and CSS-in-JS definitions.
  - `types/`: TypeScript type definitions and interfaces.
  - `lib/`: External libraries and utilities.
  - `public/`: Static assets and files.

### Component Categories

1. **Common Components (`frontend-nx/apps/edu-hub/components/common/`):**
   - Purpose: Reusable UI elements like buttons, modals, and form elements.
   - Usage: Import and use these components across various pages for consistency in look and feel.

2. **Layout Components (`frontend-nx/apps/edu-hub/components/layout/`):**
   - Purpose: Define the layout of the app, including headers, footers, and navigation bars.
   - Usage: Use these components to wrap page content and provide a consistent layout across the app.

3. **Page-specific Components (`frontend-nx/apps/edu-hub/components/pages/[PageName]/`):**
   - Purpose: Components specific to a particular page or feature.
   - Usage: Used within the respective page to encapsulate the page's functionality and UI.

4. **Form Components (`frontend-nx/apps/edu-hub/components/forms/`):**
   - Purpose: Encapsulate form-related logic and UI.
   - Usage: Reuse form components to maintain consistent behavior and styling for forms across the app.

5. **Data Display Components (`frontend-nx/apps/edu-hub/components/data-display/`):**
   - Purpose: Components for displaying data, such as tables, lists, and charts.
   - Usage: Use these components to present data in a structured and user-friendly manner.

### Component Usage Guidelines

- **Reusability:** Aim to make components reusable when possible. Consider props and customization options that can make a component flexible for different use cases.
- **Single Responsibility:** Each component should have a single responsibility and encapsulate the related logic and UI.
- **Composition:** Favor composition over inheritance. Build complex components by composing simpler ones.
- **Styling:** Use the CSS-in-JS approach or similar methodologies for styling to keep component styles scoped and manageable.

### Adding New Components

When adding new components:

1. **Naming Convention:** Use clear and descriptive names. For multi-word names, use PascalCase (e.g., `UserProfileCard`).
2. **Placement:** Place the new component in the appropriate category directory based on its purpose.
3. **Documentation:** Document the component's purpose, props, and usage examples in a comment block above the component definition.
4. **Testing:** Write unit tests for the component's functionality to ensure reliability and prevent regressions.

### Additional Information

## Force redirect to Keycloak login page for specific links

1. Use `withAuthRedirect` from `frontend-nx/apps/edu-hub/helpers/auth.ts` in your page (for reference see `frontend-nx/apps/edu-hub/pages/course/[courseId].tsx`)
2. Add `?force_redirect=true` parameter to your link's URL
