# Implementation Plan: Wells Equipment Status Dashboard

## Phase 1: Backend Foundation

- [x] 1. Create Well Data Service
  - Create `amplify/functions/shared/wellDataService.ts`
  - Implement `getAllWells()` method to query DynamoDB for all wells (scalable to any number)
  - Implement `getWellById()` method for single well queries
  - Implement `getFleetHealthMetrics()` for aggregate statistics
  - Add error handling with retry logic
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 2. Implement AI analysis engine
  - Create `amplify/functions/shared/wellAnalysisEngine.ts`
  - Implement `analyzeNoteworthyConditions()` to identify critical issues, declining health, unusual patterns
  - Implement `generatePriorityActions()` to rank recommended actions
  - Implement `identifyTopPerformers()` and `identifyBottomPerformers()`
  - Add trend analysis for health score changes
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 3. Implement caching layer
  - Add in-memory caching for well data (Node.js Map with TTL)
  - Set 5-minute TTL for cached data
  - Implement cache invalidation logic
  - Add cache hit/miss logging
  - _Requirements: 4.3, 9.5_

- [x] 4. Enhance Equipment Status Handler
  - Update `handleAllEquipmentStatus()` to use Well Data Service
  - Implement `handleAllWellsStatus()` function
  - Add logic to detect "all wells" vs "all equipment" queries
  - Call AI analysis engine for noteworthy conditions
  - Generate consolidated dashboard artifact
  - _Requirements: 1.1, 1.4, 4.1_

- [x] 5. Create consolidated dashboard artifact generator
  - Create `generateConsolidatedDashboardArtifact()` function
  - Calculate fleet-wide metrics (total, operational, degraded, critical, fleet health score)
  - Include noteworthy conditions from AI analysis
  - Include priority actions ranked by urgency
  - Generate chart data structures (health distribution, status breakdown, fleet trend, alert heatmap)
  - Add comparative performance data (top 5 / bottom 5)
  - Add timestamp to artifact
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2_

- [x] 6. Add database query optimization
  - Implement parallel queries for multiple wells
  - Add query timeout handling (10 seconds)
  - Optimize query structure for performance
  - Handle partial failures gracefully
  - _Requirements: 9.1, 9.2_

- [x] 6.1 Write backend unit tests
  - Test Well Data Service methods
  - Test AI analysis engine logic
  - Test artifact generation logic
  - Test error handling scenarios
  - Test caching behavior
  - _Requirements: All Phase 1_

## Phase 2: Frontend Core Components

- [x] 7. Create Wells Dashboard Container
  - Create `src/components/maintenance/WellsEquipmentDashboard.tsx`
  - Implement state management (viewMode: 'consolidated' | 'individual', selectedWellId)
  - Handle artifact data parsing
  - Add loading and error states
  - Implement view switching logic
  - _Requirements: 2.1, 4.3, 9.1_

- [x] 8. Build View Selector Component
  - Create `src/components/maintenance/ViewSelector.tsx`
  - Implement dropdown with "Consolidated View" as default
  - List all wells grouped by status (Critical, Degraded, Operational)
  - Add search/filter functionality in dropdown
  - Show health score badge next to each well name
  - Add keyboard navigation support
  - _Requirements: 3.1, 3.3, 10.1_

- [x] 9. Create Consolidated Analysis View
  - Create `src/components/maintenance/ConsolidatedAnalysisView.tsx`
  - Build Executive Summary Card (total wells, fleet health, critical alerts, wells needing attention)
  - Build Noteworthy Conditions Panel with AI insights
  - Display critical issues, declining health trends, top performers
  - Add expandable sections for each category
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Build Priority Action Items Component
  - Create `src/components/maintenance/PriorityActionItems.tsx`
  - Display ranked list of recommended actions
  - Show priority level (urgent/high/medium/low) with color coding
  - Include estimated time and due date
  - Add action buttons (Schedule, View Details)
  - Implement expand for more details
  - _Requirements: 2.4, 3.1, 3.2_

- [x] 11. Create Individual Well View
  - Create `src/components/maintenance/IndividualWellView.tsx`
  - Display well header (ID, name, location, health score, status)
  - Build sensor dashboard with real-time gauges
  - Show alerts panel with severity and timestamps
  - Display maintenance timeline
  - Add production metrics section
  - Show AI-generated recommendations
  - Add action buttons (Schedule Maintenance, Export Report)
  - _Requirements: 3.2, 3.5_

- [x] 11.1 Write frontend component tests
  - Test view selector dropdown
  - Test consolidated view rendering
  - Test individual well view rendering
  - Test view switching behavior
  - Test responsive layouts
  - _Requirements: All Phase 2_

## Phase 3: Visualizations and Charts

- [ ] 12. Implement health score distribution chart
  - Create `src/components/maintenance/HealthDistributionChart.tsx`
  - Use Recharts histogram/bar chart
  - Show distribution of health scores across all wells (0-20, 21-40, 41-60, 61-80, 81-100)
  - Add interactive tooltips showing well count in each range
  - Use consistent color scheme (red for low, yellow for medium, green for high)
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 13. Create status breakdown pie chart
  - Create `src/components/maintenance/StatusBreakdownChart.tsx`
  - Use Recharts pie chart
  - Show operational/degraded/critical/offline counts
  - Add percentage labels
  - Use color-coded segments matching status colors
  - Add click to filter by status
  - _Requirements: 6.2, 6.4, 6.5_

- [ ] 14. Build fleet health trend chart
  - Create `src/components/maintenance/FleetHealthTrendChart.tsx`
  - Use Recharts line chart
  - Show 30-day trend of average fleet health score
  - Add reference line for target health score (80)
  - Highlight periods with critical alerts
  - Interactive tooltips with daily details
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 15. Create alert frequency heatmap
  - Create `src/components/maintenance/AlertHeatmap.tsx`
  - Use Recharts or custom calendar heatmap
  - Show alert frequency by day (last 30 days)
  - Color intensity based on alert count
  - Interactive tooltips showing alert details
  - _Requirements: 6.3, 6.4_

- [ ] 16. Add sensor gauges to individual well view
  - Create `src/components/maintenance/SensorGauge.tsx`
  - Implement circular gauge for each sensor type
  - Show current value, normal range, and alert thresholds
  - Color code based on status (green/yellow/red)
  - Add trend indicator (up/down/stable arrow)
  - _Requirements: 3.5, 6.4_

- [ ] 17. Add sensor trend charts to individual well view
  - Integrate Recharts line charts in Individual Well View
  - Show 24-hour trend for each sensor
  - Add normal range shading
  - Highlight alert thresholds with dashed lines
  - Interactive tooltips with exact values and timestamps
  - _Requirements: 6.3, 6.4, 6.5_

## Phase 4: Controls and Interactions

- [ ] 18. Create Dashboard Controls Component
  - Create `src/components/maintenance/DashboardControls.tsx`
  - Add refresh button with last updated timestamp
  - Add export button (PDF/CSV)
  - Add time range selector for trend charts (7/30/90 days)
  - Add filter by status for consolidated view
  - _Requirements: 4.3, 4.4, 7.1, 7.2_

- [ ] 19. Implement comparative performance table
  - Create `src/components/maintenance/ComparativePerformanceTable.tsx`
  - Display top 5 wells by health score
  - Display bottom 5 wells by health score
  - Display top 5 wells by production efficiency
  - Display bottom 5 wells by production efficiency
  - Add click to view individual well details
  - _Requirements: 2.4, 3.1_

- [ ] 20. Add interactive filtering in consolidated view
  - Implement click-to-filter on status breakdown chart
  - Add filter badges showing active filters
  - Implement "Clear Filters" button
  - Update all visualizations when filters applied
  - Persist filter state during session
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 21. Implement well search in view selector
  - Add search input in view selector dropdown
  - Filter wells by ID or name as user types
  - Highlight matching text
  - Show "No results" message when no matches
  - Clear search when dropdown closes
  - _Requirements: 5.3, 5.4_

## Phase 5: Export and Data Refresh

- [ ] 22. Implement CSV export
  - Add CSV export option to Dashboard Controls
  - Generate CSV with all well data for consolidated view
  - Include columns: ID, Name, Health Score, Status, Alerts, Last Maintenance, Next Maintenance, Key Metrics
  - Generate CSV with detailed data for individual well view
  - Trigger browser download with timestamp in filename
  - Show export progress indicator
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 23. Implement PDF export
  - Add PDF export option to Dashboard Controls
  - Use jsPDF library
  - For consolidated view: Include executive summary, noteworthy conditions, priority actions, charts
  - For individual well view: Include well details, sensor readings, alerts, maintenance timeline, charts
  - Format as professional report with branding
  - Trigger browser download with timestamp in filename
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ] 24. Add data refresh functionality
  - Implement manual refresh button in Dashboard Controls
  - Show loading indicator during refresh
  - Display last updated timestamp
  - Invalidate cache on manual refresh
  - Show success/error toast notification
  - _Requirements: 4.3, 4.4_

- [ ] 25. Implement auto-refresh
  - Add auto-refresh toggle in Dashboard Controls
  - Configurable refresh interval (1/5/10 minutes)
  - Show countdown timer until next refresh
  - Pause auto-refresh when user is interacting with dashboard
  - Resume auto-refresh after inactivity
  - _Requirements: 4.3, 4.4_

## Phase 6: Performance Optimization

- [ ] 26. Optimize rendering performance
  - Implement React.memo for all dashboard components
  - Use useMemo for AI analysis results and chart data calculations
  - Use useCallback for event handlers
  - Optimize re-render triggers in dashboard container
  - Add React DevTools Profiler to identify bottlenecks
  - _Requirements: 9.1, 9.3_

- [ ] 27. Implement lazy loading
  - Lazy load Recharts library (only load when charts visible)
  - Lazy load individual well detailed data on view switch
  - Code split consolidated view and individual view components
  - Add loading skeletons for all lazy-loaded content
  - Implement intersection observer for chart lazy loading
  - _Requirements: 9.4, 9.5_

- [ ] 28. Add frontend data caching
  - Cache individual well detailed data after first load
  - Cache chart data with 5-minute TTL
  - Implement stale-while-revalidate pattern for well data
  - Add cache invalidation on manual refresh
  - Use session storage for cache (cleared on tab close)
  - _Requirements: 9.5_

- [ ] 29. Optimize bundle size
  - Analyze bundle size with webpack-bundle-analyzer
  - Tree-shake unused Recharts components
  - Use dynamic imports for PDF/CSV export libraries
  - Optimize icon imports (use only needed icons)
  - Implement code splitting for consolidated vs individual views
  - _Requirements: 9.1_

## Phase 7: Accessibility and Polish

- [ ] 30. Implement keyboard navigation
  - Add tab navigation through all interactive elements
  - Implement arrow keys for view selector dropdown navigation
  - Add keyboard shortcuts (Enter/Space to select, Escape to close dropdown)
  - Show clear focus indicators on all interactive elements
  - Add skip link to jump to main content
  - _Requirements: 10.1, 10.5_

- [ ] 31. Add screen reader support
  - Add ARIA labels to all controls and buttons
  - Implement ARIA live regions for dynamic updates (alerts, data refresh)
  - Add descriptive alt text for charts (describe data trends)
  - Announce view changes when switching between consolidated and individual
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - _Requirements: 10.2, 10.4_

- [ ] 32. Enhance visual accessibility
  - Implement high contrast mode support
  - Use color-blind friendly palette (avoid red-green only distinctions)
  - Add icons alongside color coding (✓ for operational, ⚠ for degraded, ✗ for critical)
  - Ensure text scalability (test at 200% zoom)
  - Test color contrast ratios meet WCAG AA standards (4.5:1 for text)
  - _Requirements: 10.3, 10.5_

- [ ] 33. Add animations and transitions
  - Implement smooth view switching animation (fade/slide)
  - Add fade-in for loading states
  - Implement skeleton loaders for all loading content
  - Add subtle hover effects on interactive elements
  - Optimize animation performance (use CSS transforms, avoid layout thrashing)
  - Add prefers-reduced-motion support
  - _Requirements: 8.4, 9.3_

- [ ] 34. Implement responsive design
  - Test consolidated view on desktop (1920x1080, 1366x768)
  - Test individual well view on desktop
  - Test on tablet (768x1024, 1024x768) - adjust chart sizes
  - Test on mobile (375x667, 414x896) - stack charts vertically
  - Adjust view selector dropdown for mobile (full-screen overlay)
  - Ensure touch targets are 44x44px minimum on mobile
  - Test landscape and portrait orientations
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Phase 8: Integration and Deployment

- [ ] 35. Write comprehensive tests
  - Unit tests for AI analysis engine
  - Unit tests for all React components
  - Integration tests for view switching
  - Integration tests for data flow (backend to frontend)
  - E2E tests for user workflows (consolidated view, individual view, export)
  - Performance tests with 24+ wells
  - Accessibility tests (axe-core, keyboard navigation)
  - _Requirements: All_

- [ ] 36. Update ChatMessage component
  - Add case for 'wells_equipment_dashboard' artifact type in ChatMessage.tsx
  - Import and render WellsEquipmentDashboard component
  - Handle loading and error states
  - Test artifact rendering in chat interface
  - Verify artifact displays correctly in conversation history
  - _Requirements: 2.1_

- [ ] 37. Deploy and test in sandbox
  - Deploy backend changes (Well Data Service, AI analysis engine, enhanced handler)
  - Deploy frontend changes (all dashboard components)
  - Test with real well data from database
  - Verify performance with all 24 wells
  - Test consolidated view with AI insights
  - Test individual well view switching
  - Test export functionality (PDF/CSV)
  - Test on multiple devices and browsers
  - _Requirements: All_

- [ ] 38. Set up monitoring and analytics
  - Add CloudWatch metrics for backend (query time, cache hit rate, error rate)
  - Add frontend analytics (view mode usage, well selection frequency, export usage)
  - Set up alerts for critical errors
  - Monitor AI analysis engine performance
  - Track user engagement metrics
  - _Requirements: 9.1, 9.2_

- [ ] 39. Create user documentation
  - Document how to use consolidated view
  - Document how to switch to individual well view
  - Document how to interpret AI insights and priority actions
  - Document export functionality
  - Create quick reference guide
  - Add tooltips and help text in UI
  - _Requirements: All_

## Notes

- Tasks marked with * are optional testing tasks
- Each task should be completed and tested before moving to the next
- **Consolidated view is the primary interface** - prioritize AI insights and actionable intelligence
- **Scalability is critical** - design must work with 24, 121, or any number of wells
- **View selector dropdown** is the key navigation element - make it fast and intuitive
- Performance is critical - implement caching and lazy loading early
- Accessibility should be built in from the start, not added later
- AI analysis engine is the differentiator - focus on providing truly noteworthy insights, not just data dumps
