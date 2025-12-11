# Implementation Plan

## Phase 1: Fix OSDU Search Regression (Option B - Colleague's Serverless API)

- [ ] 1.1 Verify Secrets Manager credentials
  - Check `osdu-credentials` secret exists with `apiUrl` and `apiKey`
  - Verify IAM permissions allow Lambda to read secret
  - Test secret retrieval in Lambda handler
  - Log credential loading success/failure
  - _Requirements: 1.1, 2.4, 2.5_

- [ ] 1.2 Debug colleague's OSDU API
  - Test direct API call with credentials from Secrets Manager
  - Verify API returns real OSDU data (not demo data)
  - Check API response format matches expected structure
  - Log full API request/response for debugging
  - Identify why demo data fallback is triggering
  - _Requirements: 1.2, 1.3, 3.2_

- [ ] 1.3 Fix handler to use real OSDU data
  - Ensure `useRealAPI` flag is set correctly when credentials exist
  - Remove or fix demo data fallback logic
  - Verify API response parsing extracts wells correctly
  - Add better error handling for API failures
  - Log when real API is used vs demo fallback
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 1.4 Test OSDU search with real data
  - Deploy Lambda: `cd cdk && npm run deploy`
  - Execute OSDU search query from frontend
  - Verify real wells are returned (not demo data)
  - Check wells have valid coordinates for map display
  - Test various query types (location, operator, prefix)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.5 Add defensive logging and error handling
  - Log when credentials are loaded from Secrets Manager
  - Log when calling colleague's API (URL, query params)
  - Log API response status and record count
  - Add clear error messages when API fails
  - Ensure demo fallback only triggers when API is unavailable
  - _Requirements: 1.4, 1.5, 3.4, 3.5_

## Phase 2: Compact Query Builder Design

- [x] 2.1 Create CompactOSDUQueryBuilder component
  - Create `src/components/CompactOSDUQueryBuilder.tsx` ✅
  - Implement compact layout (max 400px height) ✅
  - Add sticky positioning with high z-index (1400) ✅
  - Add scrollable criteria list (max 200px) ✅
  - Add collapsed advanced options section ✅
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.2_

- [x] 2.2 Create CompactCriterionRow component
  - Create `src/components/CompactCriterionRow.tsx` ✅
  - Implement inline compact form with Grid layout ✅
  - Add field, operator, value selectors in one row ✅
  - Add remove button ✅
  - Add validation error display ✅
  - _Requirements: 6.3, 6.4_

- [x] 2.3 Add debounced query preview
  - Implement debounced query preview update (300ms) ✅
  - Use useMemo for debounce function ✅
  - Update preview only after user stops typing ✅
  - Add loading indicator during debounce ✅
  - _Requirements: 8.2, 8.3_

- [x] 2.4 Add sticky positioning logic
  - Implement sticky CSS with conditional shadow ✅
  - Add high z-index (1400) when sticky ✅
  - Add smooth transition for shadow ✅
  - Handle scroll events for sticky state ✅
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.5 Optimize performance
  - Memoize criterion row components ✅
  - Add virtual scrolling for >20 criteria (deferred - not needed yet)
  - Lazy load autocomplete data (deferred - not needed yet)
  - Optimize re-renders with React.memo ✅
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Phase 3: Query Builder Mock-up Page

- [x] 3.1 Create mock-up page
  - Create `src/pages/OSDUQueryBuilderMockup.tsx` ✅
  - Add route `/mockup/osdu-query-builder` ✅
  - Display compact query builder ✅
  - Add toggle for old vs new design ✅
  - Add toggle for sticky behavior ✅
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 3.2 Add design comparison
  - Show side-by-side comparison (new vs old) ✅
  - Add annotations explaining design decisions ✅
  - Highlight improvements (size, sticky, performance) ✅
  - Add metrics comparison table ✅
  - _Requirements: 7.4, 7.5_

- [x] 3.3 Add scroll demo content
  - Generate sample search results (20+ items) ✅
  - Demonstrate sticky behavior on scroll ✅
  - Show query builder stays at top ✅
  - Add visual indicators for sticky state ✅
  - _Requirements: 7.2, 7.3_

- [x] 3.4 Add responsive demo
  - Test on mobile viewport (< 768px) ✅
  - Show collapsed advanced options on mobile ✅
  - Demonstrate compact layout on small screens ✅
  - Add viewport size indicator (not needed - responsive CSS handles it)
  - _Requirements: 4.4, 7.3_

## Phase 4: Integration and Accessibility

- [ ] 4.1 Add keyboard navigation
  - Support Tab/Shift+Tab between fields
  - Add keyboard shortcuts (Ctrl+Enter to execute)
  - Add Escape key to close query builder
  - Add arrow keys for criterion navigation
  - _Requirements: 9.1, 9.3_

- [ ] 4.2 Add screen reader support
  - Add ARIA labels to all form fields
  - Announce validation errors to screen readers
  - Add role="region" to query builder
  - Add aria-live for query preview updates
  - _Requirements: 9.2, 9.5_

- [ ] 4.3 Integrate with CatalogPage
  - Replace old OSDUQueryBuilder with CompactOSDUQueryBuilder
  - Update CatalogChatBoxCloudscape to use new component
  - Maintain existing onExecute and onClose handlers
  - Test with existing features (collections, map, chat)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 4.4 Add focus management
  - Maintain focus when query builder becomes sticky
  - Return focus to trigger button when closed
  - Trap focus within query builder when open
  - Handle focus for dynamically added criteria
  - _Requirements: 9.4_

## Phase 5: Testing and Deployment

- [ ] 5.1 Test OSDU integration
  - Test with real OSDU credentials
  - Execute various query types (well, wellbore, log, seismic)
  - Verify real data is displayed on map
  - Test error handling (auth failures, API errors)
  - Test token refresh logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.2 Test compact query builder
  - Test sticky behavior on scroll
  - Test with 1, 5, 10, 20+ criteria
  - Test debounced query preview
  - Test collapsed advanced options
  - Test on mobile devices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.3 Test performance
  - Measure query preview update time (< 100ms)
  - Measure query builder render time (< 200ms)
  - Test with 20+ criteria (smooth scrolling)
  - Test autocomplete filter speed (< 50ms)
  - Profile with React DevTools
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.4 Test accessibility
  - Test keyboard navigation (Tab, Shift+Tab, Enter, Escape)
  - Test with screen reader (NVDA/JAWS)
  - Test focus management
  - Verify ARIA labels and roles
  - Test with keyboard-only navigation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 5.5 Test integration
  - Test with conversational search
  - Test with map integration
  - Test with collections feature
  - Test with chat history
  - Test switching between query builder and conversational mode
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 5.6 Deploy to production
  - Deploy backend: `cd cdk && npm run deploy`
  - Test on localhost: `npm run dev`
  - Verify OSDU integration works
  - Verify query builder is compact and sticky
  - User validates and approves
  - _Requirements: All requirements_

## Phase 6: Documentation and Cleanup

- [ ] 6.1 Update documentation
  - Document OSDU credentials setup
  - Document query builder usage
  - Add troubleshooting guide
  - Update README with new features
  - _Requirements: All requirements_

- [ ] 6.2 Remove old query builder
  - Delete `src/components/OSDUQueryBuilder.tsx` (1971 lines)
  - Remove unused dependencies
  - Update imports in CatalogPage
  - Clean up old mock-up files
  - _Requirements: All requirements_

- [ ] 6.3 Monitor production
  - Check CloudWatch logs for errors
  - Monitor OAuth2 token refresh rate
  - Monitor query execution times
  - Monitor query builder performance
  - Gather user feedback
  - _Requirements: All requirements_
