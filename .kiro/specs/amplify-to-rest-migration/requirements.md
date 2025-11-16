# Requirements Document: Next.js + Amplify to React + CDK Migration

## Introduction

Migrate the application from Next.js + Amplify to React (Vite) + AWS CDK. The backend is AWS CDK with Lambda functions, API Gateway, DynamoDB, and Cognito. The frontend must remove ALL Next.js and Amplify dependencies and use standard React with REST API calls.

## Glossary

- **Next.js**: React framework with SSR (being removed)
- **Amplify**: AWS client library for GraphQL (being removed)
- **React (Vite)**: Standard React with Vite build tool (target)
- **AWS CDK**: Infrastructure as Code for backend (already exists)
- **REST API**: HTTP-based API via API Gateway + Lambda
- **Frontend**: React components in `src/` using Vite
- **Backend**: AWS CDK stack in `cdk/` with Lambda functions
- **Migration**: Complete removal of Next.js and Amplify from frontend

## Requirements

### Requirement 1: Remove ALL Amplify and Next.js Dependencies

**User Story:** As a developer, I want to remove all Amplify and Next.js code from the frontend, so that the application uses standard React with REST APIs.

#### Acceptance Criteria

1. WHEN scanning all TypeScript files in `src/`, THE System SHALL have zero imports from `aws-amplify`, `@aws-amplify`, `next`, or `next/*`
2. WHEN scanning all TypeScript files in `src/`, THE System SHALL have zero calls to `generateClient()` or `dynamic()`
3. WHEN scanning all TypeScript files in `src/`, THE System SHALL have zero references to `amplifyClient` or `router` from Next.js
4. WHEN checking `package.json`, THE System SHALL not include `aws-amplify`, `@aws-amplify/*`, or `next` in dependencies
5. WHEN building the application with Vite, THE System SHALL compile without errors
6. WHEN running the application, THE System SHALL function without Amplify or Next.js loaded

### Requirement 2: Replace Chat Operations with REST API

**User Story:** As a user, I want to send and receive chat messages, so that I can interact with the AI assistant.

#### Acceptance Criteria

1. WHEN sending a message in ChatPage, THE System SHALL call `POST /api/chat/messages` from `src/lib/api/chat.ts`
2. WHEN loading chat history, THE System SHALL call `GET /api/sessions/{id}/messages` from `src/lib/api/sessions.ts`
3. WHEN creating a new chat session, THE System SHALL call `POST /api/sessions` from `src/lib/api/sessions.ts`
4. WHEN listing chat sessions, THE System SHALL call `GET /api/sessions` from `src/lib/api/sessions.ts`
5. WHEN all chat operations complete, THE System SHALL display results identical to Amplify implementation

### Requirement 3: Replace Project Operations with REST API

**User Story:** As a user, I want to manage projects, so that I can organize my work.

#### Acceptance Criteria

1. WHEN listing projects in ProjectsPage, THE System SHALL call `GET /api/projects` from `src/lib/api/projects.ts`
2. WHEN creating a project, THE System SHALL call `POST /api/projects` from `src/lib/api/projects.ts`
3. WHEN updating a project status, THE System SHALL call `PATCH /api/projects/{id}` from `src/lib/api/projects.ts`
4. WHEN deleting a project, THE System SHALL call `DELETE /api/projects/{id}` from `src/lib/api/projects.ts`
5. WHEN all project operations complete, THE System SHALL display results identical to Amplify implementation

### Requirement 4: Replace File Storage Operations with REST API

**User Story:** As a user, I want to upload and download files, so that I can work with data.

#### Acceptance Criteria

1. WHEN uploading a file, THE System SHALL call backend API endpoint (not Amplify Storage)
2. WHEN downloading a file, THE System SHALL call backend API endpoint (not Amplify Storage)
3. WHEN listing files, THE System SHALL call backend API endpoint (not Amplify Storage)
4. WHEN deleting a file, THE System SHALL call backend API endpoint (not Amplify Storage)
5. WHEN all file operations complete, THE System SHALL function identical to Amplify Storage implementation

### Requirement 5: Replace Next.js with React Router

**User Story:** As a developer, I want to use React Router for navigation, so that the application works with Vite.

#### Acceptance Criteria

1. WHEN using navigation, THE System SHALL use `useNavigate()` from `react-router-dom`
2. WHEN using route parameters, THE System SHALL use `useParams()` from `react-router-dom`
3. WHEN using search parameters, THE System SHALL use `useSearchParams()` from `react-router-dom`
4. WHEN scanning all TypeScript files, THE System SHALL have zero imports from `next/navigation` or `next/router`
5. WHEN the application runs, THE System SHALL navigate correctly using React Router

### Requirement 6: Replace Next.js Dynamic Imports with React.lazy

**User Story:** As a developer, I want to use React.lazy for code splitting, so that the application works with Vite.

#### Acceptance Criteria

1. WHEN loading Plotly components, THE System SHALL use `React.lazy(() => import('react-plotly.js'))`
2. WHEN scanning all TypeScript files, THE System SHALL have zero calls to `dynamic()` from Next.js
3. WHEN lazy loading components, THE System SHALL wrap with `<Suspense>` boundary
4. WHEN the application builds, THE System SHALL code-split correctly
5. WHEN lazy components load, THE System SHALL display loading states correctly

### Requirement 7: Maintain All Existing Functionality

**User Story:** As a user, I want all features to work after migration, so that I don't lose functionality.

#### Acceptance Criteria

1. WHEN using the chat interface, THE System SHALL send and receive messages correctly
2. WHEN managing projects, THE System SHALL create, read, update, and delete projects correctly
3. WHEN uploading files, THE System SHALL store and retrieve files correctly
4. WHEN navigating between pages, THE System SHALL route correctly
5. WHEN the application runs, THE System SHALL have zero runtime errors related to Amplify or Next.js
