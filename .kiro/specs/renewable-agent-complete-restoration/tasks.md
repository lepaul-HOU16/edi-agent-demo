# Implementation Plan: Renewable Energy Agent Complete Restoration

## Overview

This implementation plan restores the original Strands Agents + AgentCore architecture with performance optimizations. Tasks are organized into 4 phases over 4 weeks, with each task building incrementally on previous work.

## Phase 1: Core Infrastructure (Week 1)

### 1. Enable Strands Agents and Async Invocation

- [x] 1.1 Remove hardcoded `return false` in strandsAgentHandler.ts
  - Update `isStrandsAgentAvailable()` to check for `RENEWABLE_AGENTS_FUNCTION_NAME` environment variable
  - Add logging to track when Strands Agents are available vs unavailable
  - _Requirements: 1.1, 3.1_

- [x] 1.2 Implement async invocation pattern in orchestrator
  - Modify `handleWithStrandsAgents()` to use `InvocationType: 'Event'`
  - Generate unique request IDs for tracking
  - Return immediately with polling metadata
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Create AgentProgress DynamoDB table
  - Define table schema with requestId (PK), status, steps, artifacts, timestamps, TTL
  - Add table to amplify/backend.ts
  - Grant Lambda permissions to read/write table
  - _Requirements: 1.3_

- [x] 1.4 Implement progress tracking in Strands Agents Lambda
  - Add `write_progress_to_dynamodb()` function in lambda_handler.py
  - Update progress after each agent step (init, bedrock, tools, thinking, executing, complete)
  - Include error status and remediation steps on failures
  - _Requirements: 1.4_

- [x] 1.5 Create progress polling endpoint
  - Add new Lambda function `renewableAgentProgress/handler.ts`
  - Query DynamoDB for request status and return current progress
  - Add GraphQL query `getRenewableAgentProgress(requestId: ID!)`
  - _Requirements: 1.5_

- [x] 1.6 Update frontend with progress polling
  - Modify ChatMessage.tsx to detect polling metadata in responses
  - Implement polling loop (5 second interval, 36 max attempts)
  - Display progress steps in real-time
  - Show artifacts when status becomes 'complete'
  - _Requirements: 1.5_

### 2. Integrate AgentCore Runtime

- [x] 2.1 Add AgentCore dependencies to requirements.txt
  - Add `bedrock-agentcore>=0.1.2`
  - Add `bedrock-agentcore-starter-toolkit>=0.1.6`
  - Verify compatibility with existing strands-agents version
  - _Requirements: 3.2, 11.1_

- [x] 2.2 Update terrain_agent.py with AgentCore integration
  - Import `BedrockAgentCoreApp` from bedrock_agentcore.runtime
  - Create `app = BedrockAgentCoreApp()` instance
  - Add `@app.entrypoint` decorator to async handler
  - Implement streaming with `agent.stream_async()`
  - _Requirements: 3.3, 3.4_

- [x] 2.3 Update layout_agent.py with AgentCore integration
  - Same AgentCore pattern as terrain_agent.py
  - Ensure MCP client connection works with AgentCore
  - _Requirements: 3.3, 3.4_

- [x] 2.4 Update simulation_agent.py with AgentCore integration
  - Same AgentCore pattern as terrain_agent.py
  - _Requirements: 3.3, 3.4_

- [x] 2.5 Update report_agent.py with AgentCore integration
  - Same AgentCore pattern as terrain_agent.py
  - _Requirements: 3.3, 3.4_

- [x] 2.6 Test AgentCore streaming
  - Verify events are yielded correctly
  - Test error handling in streaming mode
  - Validate progress updates reach DynamoDB
  - _Requirements: 3.5_

### 3. Deploy MCP Server

- [x] 3.1 Review existing MCP server implementation
  - Check MCP_Server/wind_farm_mcp_server.py in renewableAgents
  - Verify tool definitions match requirements
  - _Requirements: 8.2_

- [x] 3.2 Implement MCP tools
  - `get_wind_data(lat, lon, year)`: Fetch from NREL API
  - `get_turbine_specs(model)`: Fetch from turbine-models library
  - `calculate_wake_losses(layout, wind)`: PyWake calculations
  - `validate_layout(layout, boundaries)`: Check turbine conflicts
  - `generate_wind_rose(wind_data)`: Create wind rose chart
  - _Requirements: 8.3_

- [x] 3.3 Connect agents to MCP server
  - Update layout_agent.py to use MCPClient with stdio transport
  - Configure MCP server path and connection parameters
  - Implement retry logic with exponential backoff (20s, 10s, 5s, 5s, 5s)
  - _Requirements: 8.4, 8.5_

- [x] 3.4 Test MCP integration
  - Verify agents can call MCP tools
  - Test error handling when MCP server unavailable
  - Validate tool responses are correctly parsed
  - _Requirements: 8.4_

### 4. Implement Dashboard Direct API Calls

- [x] 4.1 Create GraphQL mutations for project operations
  - `deleteRenewableProject(projectId: ID!)`: Delete project and all S3 files
  - `renameRenewableProject(projectId: ID!, newName: String!)`: Update project name
  - `exportRenewableProject(projectId: ID!)`: Generate ZIP with all artifacts
  - Add mutations to amplify/data/resource.ts
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4.2 Create GraphQL query for project details
  - `getRenewableProjectDetails(projectId: ID!)`: Return all artifacts and metadata
  - Include artifact URLs, project metadata, completion status
  - _Requirements: 2.3_

- [x] 4.3 Update ProjectDashboard.tsx to use direct mutations
  - Replace conversation-based delete with GraphQL mutation call
  - Replace conversation-based rename with inline edit + mutation
  - Add modal for project details using query
  - Remove all chat message generation for dashboard operations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.4 Implement real-time dashboard updates
  - Add GraphQL subscription for project changes
  - Update dashboard table without page reload
  - Show success/error toasts for operations
  - _Requirements: 2.5_

## Phase 2: Performance Optimization (Week 2)

### 5. Optimize Docker Image

- [x] 5.1 Implement multi-stage Docker build
  - Create builder stage with build dependencies
  - Create runtime stage with minimal dependencies
  - Copy only necessary files to runtime stage
  - _Requirements: 14.1_

- [x] 5.2 Reduce image size
  - Remove unnecessary build tools from runtime
  - Use `--no-cache-dir` for pip installs
  - Clean up apt cache and temporary files
  - Target: Reduce from 2GB to <1GB
  - _Requirements: 14.1_

- [x] 5.3 Test Docker image
  - Build image and verify size reduction
  - Test cold start time improvement
  - Ensure all dependencies work correctly
  - _Requirements: 14.1_

### 6. Implement Lazy Loading

- [x] 6.1 Create lazy_imports.py module
  - Implement `get_pywake()` with lazy loading
  - Implement `get_folium()` with lazy loading
  - Implement `get_matplotlib()` with lazy loading
  - Implement `get_geopandas()` with lazy loading
  - _Requirements: 14.1_

- [x] 6.2 Update agents to use lazy imports
  - Replace direct imports with lazy loading calls
  - Only load PyWake when simulation runs
  - Only load Folium when maps are generated
  - Only load matplotlib when charts are generated
  - _Requirements: 14.1_

- [x] 6.3 Test lazy loading
  - Measure cold start time with/without lazy loading
  - Verify functionality is unchanged
  - Target: Reduce cold start by 5-10 seconds
  - _Requirements: 14.1_

### 7. Implement Connection Pooling and Caching

- [x] 7.1 Add Bedrock client pooling
  - Create singleton `get_bedrock_client()` function
  - Reuse client across warm invocations
  - Track connection time metrics
  - _Requirements: 14.5_

- [x] 7.2 Implement turbine specs caching
  - Use `@functools.lru_cache` for turbine specs
  - Cache size: 100 entries
  - _Requirements: 14.5_

- [x] 7.3 Implement wind data caching with TTL
  - Cache NREL wind data for 1 hour
  - Use cache key: `{lat}_{lon}_{year}`
  - Clear expired entries automatically
  - _Requirements: 14.5_

- [x] 7.4 Test caching effectiveness
  - Measure API call reduction
  - Verify cache hit rates
  - Test cache expiration
  - _Requirements: 14.5_

### 8. Implement Parallel Processing

- [x] 8.1 Parallelize chart generation
  - Use ThreadPoolExecutor with 4 workers
  - Generate simulation charts in parallel
  - Generate report charts in parallel
  - _Requirements: 14.3_

- [x] 8.2 Test parallel processing
  - Measure time reduction (target: 67% for 9 charts)
  - Verify all charts generate correctly
  - Test error handling in parallel execution
  - _Requirements: 14.3_

## Phase 3: Feature Completion (Week 3)

### 9. Implement Buffer Zone Visualization

- [x] 9.1 Add buffer zone calculation to terrain analysis
  - Use Shapely to generate buffer polygons
  - Apply setback distances: buildings (500m), highways (150m), water (50m), power lines (200m)
  - Convert meters to degrees for buffer calculation
  - _Requirements: 4.2_

- [x] 9.2 Update boundaries.geojson to include buffers
  - Add buffer features with `is_buffer: true` property
  - Include `buffer_width_m` in properties
  - Maintain original features alongside buffers
  - _Requirements: 4.3_

- [x] 9.3 Visualize buffers in Folium maps
  - Style buffer zones with semi-transparent fill (opacity: 0.2)
  - Use dashed borders for buffer zones
  - Color-code by feature type (buildings=red, water=blue, etc.)
  - _Requirements: 4.4_

- [x] 9.4 Generate static PNG with buffers
  - Use matplotlib to render terrain + buffers
  - Match Folium styling for consistency
  - _Requirements: 4.5_

- [x] 9.5 Test buffer visualization
  - Verify buffers are visible on all maps
  - Check buffer widths are correct
  - Validate semi-transparent overlay rendering
  - _Requirements: 4.6_

### 10. Integrate Terrain Features into Layout Maps

- [x] 10.1 Load terrain boundaries in layout agent
  - Read boundaries.geojson from S3
  - Extract all features including buffers
  - _Requirements: 5.1_

- [x] 10.2 Generate turbine_layout.geojson with terrain + turbines
  - Include ALL terrain features from boundaries.geojson
  - Include ALL buffer zones from boundaries.geojson
  - Add turbine points with proper properties
  - Add site perimeter polygon
  - _Requirements: 5.4_

- [x] 10.3 Create layout_map_1.png with terrain + turbines
  - Render EXACT SAME terrain features as boundaries.html
  - Render EXACT SAME buffer zones as boundaries.html
  - Overlay turbine markers (blue wind turbine icons)
  - Add legend showing terrain features and turbines
  - _Requirements: 5.5_

- [x] 10.4 Create layout_final.png with spacing indicators
  - Render terrain + buffers + turbines
  - Add 9D spacing circles around each turbine
  - Highlight exclusion zones in semi-transparent red
  - Show buildable areas in semi-transparent green
  - _Requirements: 5.6_

- [x] 10.5 Test terrain + turbine integration
  - Verify layout maps show same terrain as terrain maps
  - Check that buffer zones are identical
  - Validate turbine positions are correct
  - _Requirements: 5.7_

### 11. Restore All Layout Algorithms

- [x] 11.1 Implement create_grid_layout
  - Regular grid pattern with configurable spacing
  - Skip turbines in buffer zones
  - _Requirements: 5.2_

- [x] 11.2 Implement create_offset_grid_layout
  - Staggered rows for wake reduction
  - Offset by half spacing in crosswind direction
  - _Requirements: 5.2_

- [x] 11.3 Implement create_spiral_layout
  - Spiral pattern from center outward
  - Maintain minimum spacing between turbines
  - _Requirements: 5.2_

- [x] 11.4 Implement create_greedy_layout
  - Optimized placement avoiding constraints
  - Prioritize high wind resource areas
  - _Requirements: 5.2_

- [x] 11.5 Implement turbine conflict detection
  - Check if turbine intersects with buffer zones
  - Support auto_relocate=False (skip) and auto_relocate=True (relocate)
  - _Requirements: 5.3_

- [x] 11.6 Test all layout algorithms
  - Verify each algorithm produces valid layouts
  - Check turbine spacing is correct (9D minimum)
  - Validate conflict detection works
  - _Requirements: 5.2, 5.3_

### 12. Implement Complete Wake Simulation

- [x] 12.1 Integrate PyWake with Bastankhah-Gaussian model
  - Load turbine layout from S3
  - Fetch wind data from NREL API
  - Configure PyWake WindFarmModel
  - Run simulation with Bastankhah-Gaussian wake model
  - _Requirements: 6.1, 6.2_

- [x] 12.2 Generate wake_map.png
  - Visualize wake flow with turbine positions
  - Show wake effects downstream
  - _Requirements: 6.3_

- [x] 12.3 Generate aep_distribution.png
  - Bar chart of AEP distribution across turbines
  - _Requirements: 6.4_

- [x] 12.4 Generate aep_per_turbine.png
  - Bar chart of individual turbine AEP with turbine IDs
  - _Requirements: 6.5_

- [x] 12.5 Generate wake_losses.png
  - Bar chart of wake loss percentage per turbine
  - _Requirements: 6.6_

- [x] 12.6 Generate wind_rose.png
  - Polar plot of wind speed and direction distribution
  - _Requirements: 6.7_

- [x] 12.7 Generate wind_speed_distribution.png
  - Histogram of wind speed frequency
  - _Requirements: 6.8_

- [x] 12.8 Generate aep_vs_windspeed.png
  - Scatter plot with trend line showing AEP vs wind speed correlation
  - _Requirements: 6.9_

- [x] 12.9 Generate power_curve.png
  - Line chart showing turbine power curve (actual vs theoretical)
  - _Requirements: 6.10_

- [x] 12.10 Save simulation_summary.json
  - Include all metrics: gross_aep_gwh, net_aep_gwh, wake_losses_percent, capacity_factor, turbine_count, total_capacity_mw
  - _Requirements: 6.11_

- [x] 12.11 Upload all simulation artifacts to S3
  - Save to renewable/simulation/{project_id}/
  - Return artifact URLs
  - _Requirements: 6.12_

- [x] 12.12 Test wake simulation
  - Verify PyWake calculations are correct
  - Check all 9 charts are generated
  - Validate simulation_summary.json has all metrics
  - _Requirements: 6.1-6.12_

### 13. Implement Complete Report Generation

- [x] 13.1 Load all project data from S3
  - Load terrain boundaries, turbine layout, simulation results
  - Load all existing charts (terrain, layout, simulation)
  - _Requirements: 7.1_

- [x] 13.2 Generate spider_chart.png
  - Multi-dimensional assessment: wind resource, grid access, environmental impact, community support, economic viability, technical feasibility
  - _Requirements: 7.2_

- [x] 13.3 Generate performance_heatmap.png
  - Monthly performance metrics: wind speed, capacity factor, availability, efficiency
  - Use seaborn heatmap
  - _Requirements: 7.3_

- [x] 13.4 Generate financial_projections.png
  - 20-year revenue vs costs with cumulative cash flow
  - ROI analysis by year
  - _Requirements: 7.4_

- [x] 13.5 Generate economic_impact.png
  - Stacked bar chart: job creation, tax revenue, local economic benefits
  - _Requirements: 7.5_

- [x] 13.6 Generate risk_matrix.png
  - Scatter plot: risk probability vs impact with risk categories
  - _Requirements: 7.6_

- [x] 13.7 Generate timeline_gantt.png
  - Horizontal bar chart: project phases (planning, permitting, construction, commissioning)
  - _Requirements: 7.7_

- [x] 13.8 Assemble report content in markdown
  - Executive Summary
  - Project Overview
  - Site Analysis (with terrain map)
  - Turbine Layout & Design (with layout map)
  - Wake Analysis (with all 9 simulation charts)
  - Economic Analysis (with financial charts)
  - Environmental Impact
  - Risk Analysis
  - Implementation Timeline
  - Conclusions & Recommendations
  - _Requirements: 7.8_

- [x] 13.9 Generate PDF with WeasyPrint
  - Embed all images (terrain, layout, 9 simulation, 6 report charts)
  - Professional formatting with markdown
  - _Requirements: 7.9_

- [x] 13.10 Save wind_farm_report.pdf to S3
  - Upload to renewable/report/{project_id}/
  - Return download URL
  - _Requirements: 7.10_

- [x] 13.11 Test report generation
  - Verify all sections are included
  - Check all images are embedded
  - Validate PDF formatting
  - _Requirements: 7.1-7.10_

### 14. Implement Multi-Agent Orchestration

- [x] 14.1 Create LangGraph StateGraph
  - Define WindFarmState with query, project_id, coordinates, intermediate results
  - Add nodes for terrain, layout, simulation, report agents
  - Define edges: terrain → layout → simulation → report → END
  - _Requirements: 12.1_

- [x] 14.2 Implement agent nodes
  - terrain_analysis_node: Execute terrain agent, update state
  - layout_optimization_node: Execute layout agent, update state
  - wake_simulation_node: Execute simulation agent, update state
  - report_generation_node: Execute report agent, update state
  - _Requirements: 12.2_

- [x] 14.3 Implement state management
  - Maintain shared state across agents
  - Pass intermediate results between agents
  - _Requirements: 12.3_

- [x] 14.4 Implement error handling in workflow
  - Stop workflow on agent failure
  - Update DynamoDB with error status
  - Return clear error message with remediation steps
  - _Requirements: 12.4_

- [x] 14.5 Implement progress tracking in workflow
  - Update DynamoDB after each agent completes
  - Include current agent, elapsed time, intermediate artifacts
  - _Requirements: 12.5_

- [x] 14.6 Test multi-agent orchestration
  - Verify complete workflow executes correctly
  - Check state is passed between agents
  - Validate error handling stops workflow
  - _Requirements: 12.1-12.5_

## Phase 4: Testing & Refinement (Week 4)

### 15. Enforce Real Data Only

- [x] 15.1 Remove all synthetic data generation
  - Search codebase for mock/synthetic data generation
  - Remove fallback to synthetic data in terrain analysis
  - Remove fallback to synthetic data in wind data fetching
  - _Requirements: 15.1, 15.2_

- [x] 15.2 Implement strict error handling for API failures
  - Raise DataFetchError when OSM API fails (no fallback)
  - Raise DataFetchError when NREL API fails (no fallback)
  - Include clear error messages with remediation steps
  - _Requirements: 15.6_

- [x] 15.3 Add data source validation
  - Verify all features have `data_source: 'osm'` (not 'synthetic')
  - Verify wind data comes from NREL API
  - Verify turbine specs come from turbine-models library
  - _Requirements: 15.3, 15.4_

- [x] 15.4 Test with real APIs
  - Run integration tests with actual OSM API
  - Run integration tests with actual NREL API
  - Verify no synthetic data is used
  - _Requirements: 15.1-15.6_

### 16. Comprehensive Testing

- [x] 16.1 Write unit tests for all components
  - Test buffer zone calculation
  - Test layout algorithms
  - Test chart generation functions
  - Test error handling
  - Use clearly labeled mocks in unit tests
  - _Requirements: 16.1, 15.7_

- [x] 16.2 Write integration tests with real APIs
  - Test terrain analysis end-to-end with real OSM
  - Test layout optimization with real turbine specs
  - Test wake simulation with real NREL data
  - Test report generation with real data
  - _Requirements: 16.2_

- [x] 16.3 Write performance tests
  - Test terrain analysis completes in < 45 seconds
  - Test layout optimization completes in < 60 seconds
  - Test wake simulation completes in < 90 seconds
  - Test report generation completes in < 45 seconds
  - Test complete workflow completes in < 4 minutes
  - _Requirements: 16.3_

- [x] 16.4 Write end-to-end workflow tests
  - Test complete terrain → layout → simulation → report workflow
  - Verify all 17 artifacts are generated
  - Validate artifact content and format
  - _Requirements: 16.2_

- [x] 16.5 Test error scenarios
  - Test OSM API failure handling
  - Test NREL API failure handling
  - Test timeout handling
  - Test invalid parameter handling
  - Verify error messages and remediation steps
  - _Requirements: 16.4_

- [x] 16.6 Regression testing
  - Test all previously working features
  - Verify no features are broken
  - Check dashboard operations work
  - Validate progress polling works
  - _Requirements: 16.5_

### 17. Documentation and Examples

- [x] 17.1 Document API endpoints
  - Document GraphQL mutations for dashboard
  - Document progress polling endpoint
  - Include example requests and responses
  - _Requirements: All_

- [x] 17.2 Create user guide
  - How to analyze terrain
  - How to optimize layout
  - How to run wake simulation
  - How to generate reports
  - How to use project dashboard
  - _Requirements: All_

- [x] 17.3 Create developer guide
  - Architecture overview
  - How to add new agents
  - How to add new MCP tools
  - How to modify layout algorithms
  - Performance optimization tips
  - _Requirements: All_

- [x] 17.4 Add code examples
  - Example queries for each agent
  - Example multi-agent workflow
  - Example error handling
  - _Requirements: All_

### 18. User Acceptance Testing

- [x] 18.1 Test complete workflow with real user scenarios
  - Analyze terrain at multiple locations
  - Optimize layouts with different algorithms
  - Run wake simulations with various turbine models
  - Generate reports for different project sizes
  - _Requirements: All_

- [x] 18.2 Test dashboard operations
  - Create, view, rename, delete projects
  - Verify no conversation clutter
  - Check real-time updates work
  - _Requirements: 2.1-2.5_

- [x] 18.3 Test progress polling
  - Verify progress updates appear in real-time
  - Check timeout handling works
  - Validate error messages are clear
  - _Requirements: 1.1-1.5_

- [x] 18.4 Validate all artifacts
  - Check terrain maps show buffer zones
  - Verify layout maps = terrain maps + turbines
  - Validate all 9 simulation charts are correct
  - Check PDF report includes all sections and charts
  - _Requirements: 4.1-4.6, 5.1-5.7, 6.1-6.12, 7.1-7.10_

- [x] 18.5 Performance validation
  - Measure actual execution times
  - Verify cold start < 20 seconds
  - Check complete workflow < 4 minutes
  - _Requirements: 14.1-14.5_

- [x] 18.6 Collect user feedback
  - Identify any usability issues
  - Note any missing features
  - Document any bugs or errors
  - _Requirements: All_

- [x] 18.7 Address feedback and iterate
  - Fix identified bugs
  - Improve error messages
  - Optimize performance bottlenecks
  - _Requirements: All_
