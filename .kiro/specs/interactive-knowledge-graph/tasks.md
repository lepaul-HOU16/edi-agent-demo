# Implementation Plan

- [x] 1. Add Knowledge Graph Explorer button to Collection Detail Page
  - Add prominent "🔗 Knowledge Graph Explorer" button to collection detail page header
  - Disable button when collection has no data items
  - Navigate to `/collections/:id/knowledge-graph` on click
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Create Knowledge Graph Explorer page structure
  - Create `src/pages/KnowledgeGraphExplorerPage.tsx` with route `/collections/:id/knowledge-graph`
  - Implement header with breadcrumbs, search box, theme toggle, and data source badges
  - Implement three-column layout: sidebar (filters), main content (graph + map), details panel
  - Add back navigation to collection detail page
  - _Requirements: 1.3, 1.4_

- [x] 3. Build LAS file data loading service
  - Create `src/services/knowledgeGraph/lasDataLoader.ts`
  - Implement async loading of LAS files from S3 using existing S3WellDataClient
  - Parse LAS file metadata (curves, data points, well info)
  - Extract well name, operator, depth range, location from LAS headers
  - Cache parsed metadata to avoid re-parsing
  - _Requirements: 2.1_

- [x] 4. Implement knowledge graph building algorithm
  - Create `src/services/knowledgeGraph/graphBuilder.ts`
  - Transform LAS file metadata into graph nodes (wells only for MVP)
  - Discover relationships: same operator, similar depth, similar curves, geographic proximity
  - Implement duplicate detection using name similarity, location, and curve overlap
  - Calculate quality scores based on curve completeness, data density, file size
  - Generate graph metadata (node counts, relationship counts, quality distribution)
  - _Requirements: 2.1, 9.1, 9.2_

- [ ]* 4.1 Write property test for graph building
  - **Property 2: All entities become nodes**
  - **Validates: Requirements 2.1**

- [x] 5. Create D3 force-directed graph component
  - Create `src/components/knowledgeGraph/D3ForceGraph.tsx`
  - Implement D3 force simulation with link, charge, center, and collision forces
  - Render nodes as circles with type-specific colors (wells: blue)
  - Render links as paths with type-specific styles
  - Implement drag interactions to reposition nodes
  - Add zoom and pan controls using d3.zoom()
  - Maintain 60fps performance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [ ]* 5.1 Write property test for node colors
  - **Property 3: Node colors match entity types**
  - **Validates: Requirements 2.2**

- [ ]* 5.2 Write property test for link styles
  - **Property 4: Link styles match relationship types**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write property test for node selection
  - **Property 5: Node selection updates UI state**
  - **Validates: Requirements 2.5**

- [x] 6. Create Leaflet map component
  - Create `src/components/knowledgeGraph/LeafletMapView.tsx`
  - Initialize Leaflet map with CartoDB dark/light tiles based on theme
  - Render circle markers for wells with coordinates
  - Use colors matching graph node colors
  - Implement marker click to select corresponding graph node
  - Add heatmap toggle using leaflet.heat plugin
  - Center map on selected node
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 6.1 Write property test for map markers
  - **Property 6: Entities with coordinates appear on map**
  - **Validates: Requirements 3.1**

- [ ]* 6.2 Write property test for marker colors
  - **Property 7: Map marker colors match graph node colors**
  - **Validates: Requirements 3.2**

- [ ]* 6.3 Write property test for marker selection sync
  - **Property 8: Map marker selection syncs with graph**
  - **Validates: Requirements 3.3**

- [x] 7. Create details panel component
  - Create `src/components/knowledgeGraph/DetailsPanel.tsx`
  - Implement tabbed interface: Overview, Data Lineage, Source Docs, Data Quality
  - Overview tab: display all well properties, related items, data sources
  - Data Lineage tab: display transformation pipeline (S3 upload → parsing → graph)
  - Source Docs tab: display LAS file with metadata and S3 link
  - Data Quality tab: display quality score, metrics, issues, confidence
  - Show quick statistics when no node selected
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for details panel tabs
  - **Property 11: Node selection displays all tabs**
  - **Validates: Requirements 4.1**

- [ ]* 7.2 Write property test for overview content
  - **Property 12: Overview tab contains all properties**
  - **Validates: Requirements 4.2**

- [x] 8. Implement filter sidebar
  - Create `src/components/knowledgeGraph/FilterSidebar.tsx`
  - Add checkboxes for node types (wells only for MVP)
  - Add checkboxes for relationship types (correlation, hierarchy, event-link, duplicate)
  - Add checkboxes for quality levels (high, medium, low)
  - Add search input for filtering by well name
  - Update count badges when filters change
  - Apply filters to graph and recalculate statistics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [ ]* 8.1 Write property test for node type filtering
  - **Property 18: Node type filter shows/hides nodes**
  - **Validates: Requirements 5.2**

- [ ]* 8.2 Write property test for relationship filtering
  - **Property 19: Relationship type filter shows/hides links**
  - **Validates: Requirements 5.3**

- [ ]* 8.3 Write property test for quality filtering
  - **Property 20: Quality filter shows/hides nodes by score**
  - **Validates: Requirements 5.4**

- [ ]* 8.4 Write property test for search filtering
  - **Property 21: Search filters nodes by name**
  - **Validates: Requirements 5.6**

- [x] 9. Implement resizable split view
  - Create `src/components/knowledgeGraph/ResizableSplitView.tsx`
  - Implement draggable divider between graph and map
  - Resize panels proportionally on drag
  - Trigger resize events for graph and map on resize complete
  - Maintain graph zoom/center and call map.invalidateSize()
  - Constrain resize between 20% and 80%
  - _Requirements: 11.1, 11.2, 11.4_

- [ ]* 9.1 Write property test for panel resizing
  - **Property 29: Divider drag resizes panels proportionally**
  - **Validates: Requirements 11.2**

- [x] 10. Add canvas creation from selection
  - Add "Create Canvas from Selection" button to Knowledge Graph Explorer
  - Add "Create Canvas from Collection" button
  - Implement selection state management for graph nodes
  - Create new canvas with selected wells as context
  - Navigate to new canvas and show success message
  - Disable "Create Canvas from Selection" when no nodes selected
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 10.1 Write property test for canvas creation
  - **Property 22: Canvas creation includes selected entities**
  - **Validates: Requirements 6.2**

- [x] 11. Implement theme support
  - Detect user theme preference on load
  - Apply theme to graph colors, map tiles, and UI elements
  - Toggle between light and dark mode
  - Update map tiles when theme changes (CartoDB dark/light)
  - Persist theme preference to localStorage
  - _Requirements: 7.1, 7.2, 7.5_

- [ ]* 11.1 Write property test for theme detection
  - **Property 24: Theme detection matches user preference**
  - **Validates: Requirements 7.1**

- [x] 12. Add graph controls and interactions
  - Implement zoom in/out buttons
  - Implement reset view button
  - Implement auto-cluster button (force simulation restart)
  - Add legend showing node type colors
  - Handle node click to select and show details
  - Handle related item click to select that node
  - Handle lineage doc link click to switch tabs
  - _Requirements: 2.6, 4.6, 4.7_

- [ ]* 12.1 Write property test for related item navigation
  - **Property 16: Related item click selects node**
  - **Validates: Requirements 4.6**

- [x] 13. Implement error handling
  - Handle collection not found errors
  - Handle LAS file loading errors
  - Handle graph building errors
  - Handle map initialization errors
  - Show error alerts with retry options
  - Fall back to table view if graph fails
  - _Requirements: All error scenarios_

- [x] 14. Add loading states and async handling
  - Show loading indicator while loading collection
  - Show loading indicator while loading LAS files
  - Show loading indicator while building graph
  - Show loading indicator when fetching entity details
  - Display progress for multi-file loading
  - _Requirements: 8.4_

- [ ]* 14.1 Write property test for async loading
  - **Property 26: Async loading shows loading indicator**
  - **Validates: Requirements 8.4**

- [x] 15. Optimize performance for large datasets
  - Implement virtualization for >100 nodes in D3ForceGraph
  - Limit force simulation iterations for performance (maxIterations config)
  - Debounce filter application in FilterSidebar (300ms delay)
  - Show warning alert for >500 nodes in KnowledgeGraphExplorerPage
  - _Requirements: 8.1, 8.5_

- [x] 16. Enhance duplicate detection UI
  - Add "Show Duplicates Only" toggle to FilterSidebar
  - Display similarity score percentage in DetailsPanel for duplicate links
  - Add visual indicator (orange badge) on duplicate nodes in graph
  - Show duplicate count prominently in statistics section
  - _Requirements: 9.1, 9.2_

- [ ]* 16.1 Write property test for duplicate detection
  - **Property 27: Duplicate detection identifies similar entities**
  - **Validates: Requirements 9.1, 9.2**

- [x] 17. Enhance data quality visualization
  - Add quality score color coding to node badges (green/orange/red)
  - Add quality bar chart to DetailsPanel Data Quality tab
  - Add quality filter quick-select buttons (High/Medium/Low)
  - Show quality distribution chart in statistics section
  - _Requirements: 9.3, 9.4, 9.5_

- [ ]* 17.1 Write property test for quality issues
  - **Property 28: Quality issues display with suggestions**
  - **Validates: Requirements 9.3, 9.4**

- [x] 18. Enhance statistics display
  - Add statistics summary card to DetailsPanel (when no node selected)
  - Show node type breakdown with counts and percentages
  - Show relationship type breakdown with counts
  - Show quality distribution (high/medium/low counts)
  - Update statistics dynamically when filters change
  - _Requirements: 12.1, 12.2, 12.4_

- [ ]* 18.1 Write property test for statistics
  - **Property 31: Filter updates recalculate statistics**
  - **Validates: Requirements 12.2**

- [ ]* 18.2 Write property test for statistics completeness
  - **Property 32: Statistics include all counts**
  - **Validates: Requirements 12.4**

- [x] 19. Create comprehensive test file with real LAS data
  - Create `test-knowledge-graph-real-data.html` using actual S3 LAS files
  - Load 24 numbered wells from S3 bucket
  - Build knowledge graph from real data
  - Test all interactions: node selection, filtering, canvas creation
  - Verify quality scores are accurate for real data
  - Verify relationships are discovered correctly
  - Test error handling with missing/invalid files
  - _Requirements: All_

- [x] 20. Final checkpoint - Ensure all tests pass
  - Verify all core features work with real S3 data
  - Test performance with 24 wells (should be smooth)
  - Verify error handling for missing files/data
  - Test canvas creation and navigation flow
  - Confirm theme switching works correctly
  - Ask user if questions arise
