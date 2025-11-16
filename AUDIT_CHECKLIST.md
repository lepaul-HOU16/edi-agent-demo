# Migration Audit Checklist

## Summary
- **Total TypeScript files**: 368
- **Files using React Router**: 9
- **Files using React.lazy**: 16
- **Migration date**: November 14, 2024

## Phase 1: Core Application Files (CRITICAL)

### 1.1 Entry Point & Root
- [ ] `src/main.tsx` - ✅ FIXED (theme system)
- [ ] `src/App.tsx` - ❌ NEEDS REVIEW
- [ ] `src/index.css` - ❌ NEEDS REVIEW
- [ ] `src/globals.css` - ⚠️ PARTIALLY FIXED (layout CSS added)

### 1.2 Layout & Navigation
- [ ] `src/components/AppLayout.tsx` - ❌ NEEDS REVIEW (uses useNavigate)
- [ ] `src/components/TopNavBar.tsx` - ❌ NEEDS REVIEW (uses useNavigate)
- [ ] `src/components/WithAuth.tsx` - ❌ NEEDS REVIEW (uses useNavigate)

## Phase 2: Page Components (HIGH PRIORITY)

### 2.1 Main Pages
- [ ] `src/pages/HomePage.tsx` - ❌ NEEDS REVIEW (uses useNavigate)
- [ ] `src/pages/ChatPage.tsx` - ⚠️ PARTIALLY FIXED (uses useNavigate, useParams)
- [ ] `src/pages/CatalogPage.tsx` - ❌ NEEDS REVIEW
- [ ] `src/pages/CreateNewChatPage.tsx` - ❌ NEEDS REVIEW (uses useNavigate)
- [ ] `src/pages/CollectionDetailPage.tsx` - ❌ NEEDS REVIEW (uses useNavigate, useParams)
- [ ] `src/pages/PreviewPage.tsx` - ❌ NEEDS REVIEW (uses useNavigate, useParams)

### 2.2 Other Pages
- [ ] `src/pages/ListChatsPage.tsx` - ❌ NEEDS REVIEW
- [ ] `src/pages/CollectionsPage.tsx` - ❌ NEEDS REVIEW
- [ ] `src/pages/CanvasesPage.tsx` - ❌ NEEDS REVIEW
- [ ] `src/pages/ProjectsPage.tsx` - ❌ NEEDS REVIEW

## Phase 3: Components with Dynamic Imports (MEDIUM PRIORITY)

### 3.1 Chat Components
- [ ] `src/components/ChatMessage.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/ChatBox.tsx` - ❌ NEEDS REVIEW

### 3.2 Message Components
- [ ] `src/components/messageComponents/LogPlotViewerComponent.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/messageComponents/ComprehensivePorosityAnalysisComponent.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/messageComponents/ComprehensiveShaleAnalysisComponent.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/messageComponents/ComprehensiveWellDataDiscoveryComponent.tsx` - ❌ NEEDS REVIEW (React.lazy)

### 3.3 Renewable Energy Components
- [ ] `src/components/renewable/PerformanceAnalysisDashboard.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/renewable/PlotlyWindRose.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/renewable/WindResourceDashboard.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/renewable/InteractiveWindRose.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/renewable/WakeAnalysisArtifact.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/renewable/WakeAnalysisDashboard.tsx` - ❌ NEEDS REVIEW (React.lazy)

### 3.4 Cloudscape Components
- [ ] `src/components/cloudscape/CloudscapePorosityDisplay.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/cloudscape/CloudscapeShaleVolumeDisplay.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/cloudscape/CloudscapeSaturationDisplay.tsx` - ❌ NEEDS REVIEW (React.lazy)

### 3.5 Other Components
- [ ] `src/components/PlotDataToolComponent.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/mockups/PetrophysicsCloudscapeMockup.tsx` - ❌ NEEDS REVIEW (React.lazy)
- [ ] `src/components/CollectionContextBadge.tsx` - ❌ NEEDS REVIEW (uses useParams)

## Phase 4: Specific Issues to Check

### 4.1 Router Conversion Issues
For each file using `useNavigate`, `useParams`, or `useLocation`, verify:
- [ ] `useRouter()` properly replaced with `useNavigate()`
- [ ] `router.push()` properly replaced with `navigate()`
- [ ] `router.query` properly replaced with `useParams()` or `useSearchParams()`
- [ ] `router.pathname` properly replaced with `useLocation().pathname`
- [ ] `router.back()` properly replaced with `navigate(-1)`

### 4.2 Dynamic Import Issues
For each file using `React.lazy()`, verify:
- [ ] Wrapped in `<Suspense>` with proper fallback
- [ ] Loading state handled correctly
- [ ] Error boundary in place
- [ ] No SSR-specific options lost (like `{ ssr: false }`)

### 4.3 Data Fetching Issues
For each page component, verify:
- [ ] No `getServerSideProps` or `getStaticProps` remnants
- [ ] Data fetching moved to `useEffect`
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] Initial data handled correctly

### 4.4 CSS Issues
For each component, verify:
- [ ] CSS Module imports converted correctly
- [ ] Class names not conflicting
- [ ] Styles applying correctly
- [ ] Dark mode working
- [ ] Layout not broken

### 4.5 Amplify Client Issues
For each file that used Amplify, verify:
- [ ] `generateClient()` removed or replaced
- [ ] GraphQL queries replaced with REST API calls
- [ ] Authentication handled correctly
- [ ] File uploads handled correctly
- [ ] Real-time subscriptions handled (if any)

## Review Process for Each File

1. **Get original version**:
   ```bash
   git show <commit-before-nov-14>:src/path/to/file.tsx
   ```

2. **Compare with current**:
   ```bash
   git diff <commit-before-nov-14> HEAD -- src/path/to/file.tsx
   ```

3. **Review changes line by line**:
   - Is this change necessary?
   - Is this change correct?
   - Does it maintain the same functionality?
   - Are there any side effects?

4. **Test the file**:
   - Does it compile?
   - Does it render?
   - Does it work correctly?
   - Does it work in dark mode?

5. **Document findings**:
   - What was changed?
   - Why was it changed?
   - Is it correct?
   - What needs to be fixed?

## Progress Tracking

### Completed
- [x] `src/main.tsx` - Theme system fixed

### In Progress
- [ ] None

### Blocked
- [ ] None

## Next Steps

1. Start with `src/App.tsx`
2. Then `src/components/AppLayout.tsx`
3. Then `src/pages/ChatPage.tsx`
4. Continue through the list systematically

**NO SCRIPTS. MANUAL REVIEW ONLY.**
