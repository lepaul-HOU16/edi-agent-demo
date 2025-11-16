# Requirements Document: Fix Broken Vite Migration

## Introduction

The migration from Next.js + Amplify to Vite + REST API has resulted in a completely broken application. This spec addresses all critical failures including authentication, styling, Node.js polyfills, and API integration.

## Glossary

- **Vite Application**: The React application built with Vite bundler
- **REST API**: The AWS API Gateway backend replacing Amplify
- **Cloudscape Components**: AWS design system UI components
- **Node.js Polyfills**: Browser-compatible replacements for Node.js modules
- **Mock Auth**: Temporary authentication bypass for development
- **CSS Loading**: The process of importing and applying stylesheets

## Requirements

### Requirement 1: Authentication System

**User Story:** As a developer, I want the application to load without authentication errors, so that I can test the UI and functionality.

#### Acceptance Criteria

1. WHEN the application loads, THE Vite Application SHALL NOT throw authentication errors in the console
2. WHEN a user clicks any button requiring API calls, THE Vite Application SHALL send requests with valid authentication headers
3. WHEN the backend receives a request with mock token, THE REST API SHALL accept it for development purposes
4. WHERE authentication is disabled for development, THE Vite Application SHALL clearly indicate this in the UI
5. WHEN authentication fails, THE Vite Application SHALL display a user-friendly error message

### Requirement 2: Cloudscape Design System Styling

**User Story:** As a user, I want the UI components to render correctly with proper styling, so that the application is usable and visually correct.

#### Acceptance Criteria

1. WHEN the application loads, THE Vite Application SHALL load all Cloudscape CSS files correctly
2. WHEN Cloudscape components render, THE Vite Application SHALL display them with proper spacing, alignment, and colors
3. WHEN map controls render, THE Vite Application SHALL position them correctly without overlapping
4. WHEN buttons render, THE Vite Application SHALL display them with correct dimensions and styling
5. WHEN the user switches between pages, THE Vite Application SHALL maintain consistent styling across all pages

### Requirement 3: Node.js Polyfills

**User Story:** As a developer, I want all Node.js modules to work in the browser, so that libraries like Plotly.js function correctly.

#### Acceptance Criteria

1. WHEN Plotly.js loads, THE Vite Application SHALL provide browser-compatible stream module
2. WHEN any library requires util module, THE Vite Application SHALL provide browser-compatible util module
3. WHEN any library requires buffer module, THE Vite Application SHALL provide browser-compatible buffer module
4. WHEN the application runs, THE Vite Application SHALL NOT display "module externalized" errors in console
5. WHEN scientific visualizations render, THE Vite Application SHALL display them without errors

### Requirement 4: API Integration

**User Story:** As a user, I want to interact with the application features, so that I can create chats, view data, and use all functionality.

#### Acceptance Criteria

1. WHEN a user clicks "Start a new chat", THE Vite Application SHALL successfully create a chat session
2. WHEN a user navigates to any page, THE Vite Application SHALL load data from the REST API without 401 errors
3. WHEN the API returns data, THE Vite Application SHALL display it correctly in the UI
4. WHEN an API call fails, THE Vite Application SHALL display a meaningful error message to the user
5. WHEN the user performs any action, THE Vite Application SHALL send properly formatted requests to the REST API

### Requirement 5: Page Functionality

**User Story:** As a user, I want all pages to work correctly, so that I can access all features of the application.

#### Acceptance Criteria

1. WHEN a user navigates to the home page, THE Vite Application SHALL display the landing page without errors
2. WHEN a user navigates to the catalog page, THE Vite Application SHALL display the map and data correctly
3. WHEN a user navigates to the canvases page, THE Vite Application SHALL display the list of canvases without crashing
4. WHEN a user navigates to any page, THE Vite Application SHALL render all UI components correctly
5. WHEN a user interacts with any page, THE Vite Application SHALL respond without errors

### Requirement 6: CSS and Layout

**User Story:** As a user, I want the application layout to be correct, so that I can navigate and use the interface effectively.

#### Acceptance Criteria

1. WHEN the application loads, THE Vite Application SHALL apply all global CSS styles correctly
2. WHEN components render, THE Vite Application SHALL use the correct CSS from globals.css
3. WHEN the user resizes the window, THE Vite Application SHALL maintain proper responsive layout
4. WHEN dark mode is toggled, THE Vite Application SHALL apply dark mode styles correctly
5. WHEN the user navigates between pages, THE Vite Application SHALL maintain consistent layout structure

### Requirement 7: Development Experience

**User Story:** As a developer, I want clear error messages and debugging information, so that I can identify and fix issues quickly.

#### Acceptance Criteria

1. WHEN an error occurs, THE Vite Application SHALL log detailed error information to the console
2. WHEN authentication fails, THE Vite Application SHALL indicate whether it's a frontend or backend issue
3. WHEN CSS fails to load, THE Vite Application SHALL log which CSS files are missing
4. WHEN API calls fail, THE Vite Application SHALL log the request and response details
5. WHEN the application starts, THE Vite Application SHALL log the configuration being used
