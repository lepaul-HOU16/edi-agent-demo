mock auth# Implementation Plan: Fix Broken Vite Migration

## Task Overview

This plan fixes all critical issues in the Vite migration through systematic implementation of polyfills, CSS fixes, authentication, and API integration.

---

## Phase 1: Critical Infrastructure Fixes

- [x] 1. Fix Vite configuration with all required polyfills
  - Install all required polyfill packages (stream-browserify, util, buffer)
  - Update vite.config.ts with proper resolve aliases
  - Add optimizeDeps configuration for all polyfills
  - Add proper define configuration for process and global
  - Test that Vite builds without errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Fix CSS loading and import order
  - Ensure globals.css imports Cloudscape CSS first
  - Update main.tsx to import globals.css before other CSS
  - Remove duplicate Cloudscape CSS imports
  - Add CSS load verification in console
  - Test that all styles load correctly
  - _Requirements: 2.1, 2.2, 6.1, 6.2_

- [x] 3. Implement mock authentication system
  - Create MockAuthProvider class in src/lib/auth/mockAuth.ts
  - Update client.ts to use MockAuthProvider
  - Add development mode indicator in UI
  - Add auth error handling with user-friendly messages
  - Test that API calls include mock token
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4. Update backend to accept mock tokens
  - Modify Lambda authorizer to accept mock-dev-token prefix
  - Add environment variable for development mode
  - Test that backend accepts mock tokens
  - Verify that production auth still works
  - Deploy updated authorizer
  - _Requirements: 1.2, 1.3_

---

## Phase 2: Page and Component Fixes

- [x] 5. Fix HomePage functionality
  - Remove auth checks from button handlers
  - Fix createSession API call error handling
  - Test all three buttons (chat, canvases, catalog)
  - Verify navigation works correctly
  - _Requirements: 4.1, 5.1_

- [x] 6. Fix CanvasesPage rendering
  - Fix user object to not be null
  - Update API calls to handle mock auth
  - Fix collections loading
  - Test page renders without crashing
  - _Requirements: 4.2, 5.3_

- [x] 7. Fix CatalogPage styling and functionality
  - Fix map control positioning
  - Fix button alignment and spacing
  - Test map loads correctly
  - Test search functionality
  - _Requirements: 2.3, 5.2_

- [x] 8. Fix ChatPage functionality
  - Update chat API calls for REST backend
  - Fix message sending and receiving
  - Test chat session creation
  - Test message display
  - _Requirements: 4.1, 4.3, 5.4_

- [x] 9. Fix all other pages
  - Test CollectionsPage
  - Test ProjectsPage
  - Test PreviewPage
  - Test ListChatsPage
  - Test CreateNewChatPage
  - Test CollectionDetailPage
  - _Requirements: 5.4, 5.5_

---

## Phase 3: Styling and Layout Fixes

- [x] 10. Fix Cloudscape component styling
  - Verify all Cloudscape components render correctly
  - Fix button dimensions and spacing
  - Fix dropdown positioning
  - Fix table layouts
  - Test across all pages
  - _Requirements: 2.2, 2.4, 6.2_

- [ ] 11. Fix responsive layout
  - Test mobile viewport
  - Test tablet viewport
  - Test desktop viewport
  - Fix any layout breaks
  - _Requirements: 6.3_

- [ ] 12. Fix dark mode
  - Test dark mode toggle
  - Verify dark mode styles apply
  - Fix any dark mode styling issues
  - Test dark mode across all pages
  - _Requirements: 6.4_

---

## Phase 4: Error Handling and UX

- [ ] 13. Implement comprehensive error handling
  - Add ErrorBoundary component
  - Add error logging to console
  - Add user-friendly error messages
  - Test error scenarios
  - _Requirements: 1.5, 4.4, 7.1, 7.2_

- [ ] 14. Add loading states
  - Add loading indicators for API calls
  - Add skeleton loaders for pages
  - Test loading states
  - _Requirements: 4.3_

- [ ] 15. Add development mode indicator
  - Add banner showing "Development Mode - Mock Auth"
  - Make it dismissible
  - Style it appropriately
  - _Requirements: 1.4, 7.5_

---

## Phase 5: Testing and Validation

- [ ] 16. Test all user workflows
  - Test creating a new chat
  - Test viewing catalog
  - Test viewing canvases
  - Test viewing collections
  - Test all navigation
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 17. Verify no console errors
  - Check for authentication errors
  - Check for CSS loading errors
  - Check for polyfill errors
  - Check for API errors
  - _Requirements: 1.1, 3.4, 7.1, 7.3, 7.4_

- [ ] 18. Test in deployed environment
  - Deploy to AWS
  - Test in actual environment
  - Verify backend accepts mock tokens
  - Test all functionality
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

---

## Phase 6: Documentation and Cleanup

- [ ] 19. Document all changes
  - Document mock auth system
  - Document CSS loading approach
  - Document polyfill configuration
  - Document known issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 20. Clean up temporary code
  - Remove debug logging
  - Remove commented code
  - Remove unused imports
  - Format all code
  - _Requirements: All_

---

## Success Criteria

The migration is considered fixed when:

✅ Application loads without console errors
✅ All pages render correctly with proper styling
✅ All buttons and interactions work
✅ API calls succeed with mock authentication
✅ No 401 Unauthorized errors
✅ No CSS loading errors
✅ No polyfill errors
✅ Cloudscape components display correctly
✅ Map controls position correctly
✅ Dark mode works
✅ All user workflows function end-to-end

## Rollback Criteria

Revert to Next.js if:

❌ Fixes take more than 8 hours
❌ Critical functionality cannot be restored
❌ Performance is unacceptable
❌ User experience is severely degraded
