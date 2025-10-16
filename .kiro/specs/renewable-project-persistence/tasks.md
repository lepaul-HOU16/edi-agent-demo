# Implementation Plan

## Overview

This implementation plan transforms the renewable energy workflow from parameter-based to project-based with human-friendly names, session context, and enhanced visualizations including Plotly wind roses and consolidated dashboards.

## Implementation Tasks

- [x] 1. Set up project persistence infrastructure
  - Create DynamoDB table for session context
  - Configure S3 bucket structure for project data
  - Set up AWS Location Service for reverse geocoding
  - Add IAM permissions for orchestrator Lambda
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 2. Implement ProjectStore (S3-based persistence)
- [x] 2.1 Create ProjectStore class with S3 operations
  - Implement save() method with merge logic
  - Implement load() method with error handling
  - Implement list() method with pagination
  - Implement findByPartialName() with fuzzy matching
  - Add in-memory caching (5 minute TTL)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.2 Create project data schema and validation
  - Define ProjectData TypeScript interface
  - Add JSON schema validation
  - Implement data migration for existing projects
  - _Requirements: 2.4_

- [x] 2.3 Add S3 error handling and fallbacks
  - Handle NoSuchKey errors gracefully
  - Implement retry logic with exponential backoff
  - Add fallback to in-memory cache on S3 failure
  - Log errors for monitoring
  - _Requirements: 2.5_

- [x] 3. Implement ProjectNameGenerator
- [x] 3.1 Create location name extraction from queries
  - Implement regex patterns for "in {location}", "at {location}"
  - Extract location from "{location} wind farm" patterns
  - Handle multi-word location names
  - _Requirements: 6.1, 6.2_

- [x] 3.2 Integrate AWS Location Service for reverse geocoding
  - Set up Location Service place index
  - Implement coordinate-to-location lookup
  - Handle geocoding API errors with fallbacks
  - Cache geocoding results (24 hour TTL)
  - _Requirements: 6.2_

- [x] 3.3 Implement name normalization and uniqueness
  - Normalize to kebab-case (lowercase, hyphens)
  - Check S3 for existing project names
  - Append numbers for conflicts (e.g., "-2", "-3")
  - Generate fallback names for coordinates
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 4. Implement SessionContextManager
- [x] 4.1 Create DynamoDB operations for session context
  - Implement getContext() with DynamoDB query
  - Implement setActiveProject() with update
  - Implement addToHistory() with list append
  - Set TTL to 7 days for auto-cleanup
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4.2 Add in-memory caching for session context
  - Cache active sessions (5 minute TTL)
  - Invalidate cache on updates
  - Handle cache misses gracefully
  - _Requirements: 7.4_

- [x] 4.3 Implement session context fallbacks
  - Fall back to session-only context if DynamoDB unavailable
  - Log DynamoDB errors for monitoring
  - Continue operation with degraded functionality
  - _Requirements: 7.4_

- [x] 5. Implement ProjectResolver
- [x] 5.1 Create explicit project reference extraction
  - Implement regex for "for project {name}"
  - Implement regex for "for {name} project"
  - Implement regex for "project {name}"
  - _Requirements: 9.1, 9.2_

- [x] 5.2 Implement implicit reference resolution
  - Handle "that project" → last mentioned
  - Handle "the project" → active project
  - Handle "continue" → active project
  - _Requirements: 9.2, 9.3_

- [x] 5.3 Implement partial name matching
  - Use Levenshtein distance for fuzzy matching
  - Prioritize exact matches over partial
  - Return most recently used on multiple matches
  - Handle ambiguous matches with user prompt
  - _Requirements: 6.6, 9.4, 9.5_

- [x] 6. Update orchestrator with project persistence
- [x] 6.1 Add project name resolution to orchestrator
  - Call ProjectResolver.resolve() on each request
  - Generate new project name if none found
  - Set active project in session context
  - _Requirements: 3.1, 3.2, 7.2_

- [x] 6.2 Add project data loading before tool calls
  - Load project data from S3 using ProjectStore
  - Merge with session context
  - Pass complete context to tool Lambdas
  - _Requirements: 3.1, 3.3, 4.1, 4.2_

- [x] 6.3 Add project data saving after tool responses
  - Extract results from tool Lambda response
  - Merge with existing project data
  - Save to S3 using ProjectStore
  - Update session context
  - _Requirements: 3.2, 3.3_

- [x] 6.4 Add project status tracking
  - Track completion of terrain, layout, simulation, report
  - Include status in response metadata
  - Display status in response messages
  - _Requirements: 8.2, 8.6_

- [x] 7. Update tool Lambdas to use project context
- [x] 7.1 Update layout Lambda to use project coordinates
  - Check for coordinates in project context
  - Fall back to explicit parameters if not found
  - Return clear error if coordinates missing
  - _Requirements: 4.1, 5.1_

- [x] 7.2 Update simulation Lambda to use project layout
  - Check for layout in project context
  - Fall back to explicit parameters if not found
  - Return clear error if layout missing
  - _Requirements: 4.2, 5.2_

- [x] 7.3 Update report Lambda to use all project data
  - Receive terrain, layout, simulation results from context
  - Return clear error if any required data missing
  - _Requirements: 4.3, 5.3_

- [x] 8. Implement user-friendly error messages
- [x] 8.1 Create error message templates
  - Template for missing coordinates
  - Template for missing layout
  - Template for missing analysis results
  - Include project name and next step suggestion
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.2 Add ambiguous project reference handling
  - Detect multiple matches in ProjectResolver
  - Return list of matching projects
  - Suggest specific queries to disambiguate
  - _Requirements: 9.5_

- [x] 9. Implement Plotly wind rose visualization
- [x] 9.1 Update Python backend to generate wind rose data
  - Bin wind data into 16 directions
  - Bin wind speeds into 7 ranges (0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6+)
  - Calculate frequency percentages
  - Return structured data for Plotly
  - _Requirements: Design - Plotly Wind Rose_

- [x] 9.2 Create Plotly wind rose component in frontend
  - Implement barpolar chart with stacked bars
  - Apply color gradient (yellow → orange → pink → purple)
  - Add dark background styling
  - Implement hover tooltips
  - Add zoom/pan interactivity
  - _Requirements: Design - Plotly Wind Rose_

- [x] 9.3 Add wind rose export functionality
  - Export to PNG using Plotly.toImage()
  - Export to SVG for vector graphics
  - Export data as JSON
  - _Requirements: Design - Plotly Wind Rose_

- [x] 10. Implement dashboard consolidation
- [x] 10.1 Create Wind Resource Dashboard component
  - Layout: 60% wind rose, 40% supporting charts
  - Include seasonal patterns chart
  - Include wind speed distribution
  - Include monthly averages
  - Include variability analysis
  - _Requirements: Design - Dashboard Consolidation_

- [x] 10.2 Create Performance Analysis Dashboard component
  - Layout: 2x2 grid with summary bar
  - Include monthly energy production
  - Include capacity factor distribution
  - Include turbine performance heatmap
  - Include availability and losses
  - _Requirements: Design - Dashboard Consolidation_

- [x] 10.3 Create Wake Analysis Dashboard component
  - Layout: 50% map, 50% charts (2x2 grid)
  - Include wake heat map (Folium)
  - Include wake deficit profile
  - Include turbine interaction matrix
  - Include wake loss by direction
  - _Requirements: Design - Dashboard Consolidation_

- [x] 10.4 Update backend to return dashboard data
  - Return all chart data in single response
  - Use artifact type: `renewable_dashboard`
  - Include dashboard type in metadata
  - _Requirements: Design - Dashboard Consolidation_

- [x] 11. Implement contextual action buttons
- [x] 11.1 Add action buttons to artifact responses
  - Include actions array in artifact data
  - Define context-specific button sets
  - Include pre-filled queries for one-click actions
  - _Requirements: Design - Contextual Action Buttons_

- [x] 11.2 Create action button component in frontend
  - Render buttons in artifact footer
  - Style primary vs. secondary buttons
  - Send pre-filled query on click
  - Add icons from Cloudscape icon set
  - _Requirements: Design - Contextual Action Buttons_

- [x] 11.3 Add project status display to responses
  - Show checklist of completed steps
  - Display "Next:" suggestion
  - Include project name in response
  - _Requirements: Design - Response Message Enhancements_

- [ ] 12. Implement project listing and status
- [x] 12.1 Create project list query handler
  - Handle "list my renewable projects" query
  - Return all projects with status
  - Include created/updated timestamps
  - Show active project marker
  - _Requirements: 8.1, 8.6_

- [x] 12.2 Create project details query handler
  - Handle "show project {name}" query
  - Return complete project data
  - Include all analysis results
  - Display metrics and status
  - _Requirements: 8.3_

- [x] 12.3 Create project list UI component
  - Display projects in table format
  - Show status indicators (✓/✗)
  - Show key metrics (turbines, capacity, AEP)
  - Add click to view details
  - _Requirements: 8.4, 8.5_

- [x] 13. Implement AgentCore-style chain of thought display
- [x] 13.1 Create simplified ThoughtStep component
  - Use Cloudscape ExpandableSection for each step
  - Show step number, action, status, duration
  - Default collapsed for completed steps
  - Always expanded for in-progress and error steps
  - _Requirements: 10.1, 10.2, 10.3, 10.8_

- [x] 13.2 Add status indicators and timing
  - Use Cloudscape StatusIndicator for status
  - Show actual duration in milliseconds
  - Use Spinner for in-progress steps
  - Remove complex animations and effects
  - _Requirements: 10.3, 10.5, 10.6, 10.7_

- [x] 13.3 Implement error step display
  - Use Cloudscape Alert for errors
  - Show clear error messages
  - Include remediation suggestions
  - Always keep error steps expanded
  - _Requirements: 10.9_

- [x] 13.4 Remove old chain of thought components
  - Remove ChainOfThoughtStep.tsx (MUI version)
  - Remove complex animation logic
  - Remove Psychology icons and gradients
  - Clean up unused imports
  - _Requirements: 10.7, 10.10_

- [x] 13.5 Update orchestrator to return timing data
  - Track duration for each step
  - Include timestamps in thought steps
  - Return actual timing (not estimated)
  - _Requirements: 10.5_

- [ ] 14. Testing and validation
- [ ] 14.1 Unit test ProjectStore operations
  - Test save/load/list operations
  - Test partial name matching
  - Test error handling
  - Test caching behavior
  - _Requirements: Design - Testing Strategy_

- [ ] 14.2 Unit test ProjectNameGenerator
  - Test location extraction
  - Test reverse geocoding
  - Test name normalization
  - Test uniqueness checking
  - _Requirements: Design - Testing Strategy_

- [ ] 14.3 Unit test SessionContextManager
  - Test context creation
  - Test active project tracking
  - Test project history
  - Test DynamoDB operations
  - _Requirements: Design - Testing Strategy_

- [ ] 14.4 Unit test ProjectResolver
  - Test explicit reference extraction
  - Test implicit reference resolution
  - Test partial name matching
  - Test ambiguity handling
  - _Requirements: Design - Testing Strategy_

- [ ] 14.5 Integration test end-to-end workflow
  - Test terrain → layout → simulation → report
  - Test project name generation
  - Test session context persistence
  - Test auto-loading of previous results
  - _Requirements: Design - Testing Strategy_

- [ ] 14.6 Test Plotly wind rose visualization
  - Test data binning and frequency calculation
  - Test chart rendering and interactivity
  - Test export functionality
  - Test responsive layout
  - _Requirements: Design - Testing Strategy_

- [ ] 14.7 Test dashboard consolidation
  - Test all three dashboard types
  - Test responsive grid layout
  - Test chart interactions
  - Test export functionality
  - _Requirements: Design - Testing Strategy_

- [ ] 14.8 Test chain of thought display
  - Test step expansion/collapse
  - Test status indicators
  - Test timing display
  - Test error step display
  - Verify clean, minimal appearance
  - _Requirements: 10.1-10.10_

- [ ] 15. Documentation and deployment
- [ ] 15.1 Update API documentation
  - Document new project-based API
  - Document session context behavior
  - Document error messages
  - Add example queries
  - _Requirements: Design - Deployment Considerations_

- [ ] 15.2 Create migration guide
  - Document changes from parameter-based to project-based
  - Provide migration script for existing data
  - Document breaking changes
  - _Requirements: Design - Migration Strategy_

- [ ] 15.3 Deploy infrastructure changes
  - Deploy DynamoDB table
  - Configure S3 bucket structure
  - Set up AWS Location Service
  - Update IAM permissions
  - _Requirements: Design - Deployment Considerations_

- [ ] 15.4 Deploy code changes
  - Deploy updated orchestrator Lambda
  - Deploy updated tool Lambdas
  - Deploy frontend changes
  - Run smoke tests
  - _Requirements: Design - Deployment Considerations_

## Notes

- **Incremental Development**: Implement and test each component independently before integration
- **Backward Compatibility**: Maintain support for explicit parameters during transition period
- **Performance**: Monitor S3 and DynamoDB latency, optimize caching as needed
- **User Feedback**: Collect feedback on project naming and session context behavior
- **Visualization Quality**: Ensure Plotly wind rose matches reference image quality
- **Dashboard Usability**: Test dashboard layouts on various screen sizes
