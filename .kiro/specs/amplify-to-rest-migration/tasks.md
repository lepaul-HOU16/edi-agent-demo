# Implementation Plan: Amplify SDK to REST API Migration

- [x] 1. Migrate ChatPage to REST API
  - Replace `generateClient()` with REST API imports from `@/lib/api/chat` and `@/lib/api/sessions`
  - Replace `amplifyClient.models.ChatMessage` calls with `sendMessage()` function
  - Replace `amplifyClient.models.ChatSession` calls with session API functions
  - Replace `useRouter()` from Next.js with `useNavigate()` from React Router
  - Replace `useParams()` from Next.js with `useParams()` from React Router
  - Remove all Amplify imports
  - Test chat message sending and receiving
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2_

- [x] 2. Migrate ProjectsPage to REST API
  - Replace `generateClient()` with REST API imports from `@/lib/api/projects`
  - Replace `amplifyClient.models.Project.list()` with `getProjects()` function
  - Replace `amplifyClient.models.Project.update()` with `updateProject()` function
  - Replace `amplifyClient.models.Project.delete()` with `deleteProject()` function
  - Replace `fetchAuthSession()` with standard auth check
  - Replace `dynamic()` import with `React.lazy()` for Plotly
  - Remove all Amplify imports
  - Test project CRUD operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_

- [x] 3. Migrate CreateNewChatPage to REST API
  - Replace `generateClient()` with REST API imports from `@/lib/api/sessions`
  - Replace `amplifyClient.mutations.invokeLightweightAgent()` with appropriate REST API call
  - Replace `useRouter()` and `useSearchParams()` from Next.js with React Router equivalents
  - Remove all Amplify imports
  - Test chat session creation flow
  - _Requirements: 2.3, 5.1, 5.3_

- [x] 4. Migrate PreviewPage to REST API
  - Replace `uploadData()` from Amplify Storage with backend API endpoint
  - Replace `getUrl()` from Amplify Storage with backend API endpoint
  - Remove all Amplify Storage imports
  - Test file upload and preview functionality
  - _Requirements: 4.1, 4.2_

- [x] 5. Migrate File Components (FileViewer, FileExplorer, FileDrawer)
  - Replace `getUrl()` from Amplify Storage with backend API in FileViewer
  - Replace `list()`, `uploadData()` from Amplify Storage with backend API in FileExplorer
  - Replace `uploadData()`, `remove()` from Amplify Storage with backend API in FileDrawer
  - Remove all Amplify Storage imports
  - Test file operations (list, upload, download, delete)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Migrate PlotDataToolComponent
  - Replace `getUrl()` from Amplify Storage with backend API endpoint
  - Replace `dynamic()` import with `React.lazy()` for Plotly
  - Add `<Suspense>` boundary for lazy-loaded Plot component
  - Remove all Amplify imports
  - Test plot data visualization
  - _Requirements: 4.2, 6.1, 6.3_

- [x] 7. Migrate remaining Plotly components to React.lazy
  - Update CloudscapePorosityDisplay to use `React.lazy()`
  - Update CloudscapeShaleVolumeDisplay to use `React.lazy()`
  - Update CloudscapeSaturationDisplay to use `React.lazy()`
  - Update ComprehensiveWellDataDiscoveryComponent to use `React.lazy()`
  - Update ComprehensiveShaleAnalysisComponent to use `React.lazy()`
  - Update ComprehensivePorosityAnalysisComponent to use `React.lazy()`
  - Update all renewable energy components to use `React.lazy()`
  - Remove all `dynamic()` imports
  - Add `<Suspense>` boundaries where needed
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Clean up remaining Amplify references
  - Remove `amplifyClient` state variables from all components
  - Remove `getConfiguredAmplifyClient()` function from amplifyUtils.ts
  - Remove `setAmplifyEnvVars()` function from amplifyUtils.ts
  - Remove Amplify-specific comments and TODOs
  - Remove unused Amplify utility functions
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 9. Update App.tsx routing
  - Verify all routes use correct page components
  - Ensure ChatPage route uses `:chatSessionId` parameter
  - Ensure PreviewPage route uses catch-all parameter
  - Test navigation between all pages
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Final cleanup and verification
  - Run build and verify zero Amplify in bundle
  - Run application and verify zero Amplify runtime errors
  - Test all user workflows end-to-end
  - Remove `aws-amplify` and `@aws-amplify/*` from package.json dependencies
  - Update documentation to reflect REST API usage
  - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_
