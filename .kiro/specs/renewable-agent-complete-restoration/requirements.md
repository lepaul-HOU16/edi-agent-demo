# Requirements Document: Renewable Agent Complete Restoration

## Introduction

The Renewable Energy agent and features were partially integrated from the original `agentic-ai-for-renewable-site-design-mainline` repository but left in an incomplete and non-functional state. Current analysis shows approximately **30% functional completion** with critical architectural mismatches, missing features, and broken workflows.

**Architecture Decision**: This specification preserves the **original Strands Agents + AgentCore architecture** from the workshop, with performance optimizations to address timeout issues.

**Critical Issues Identified:**
1. **Timeout Errors**: "Execution timed out" on terrain analysis queries
   - **Root Cause**: Synchronous invocation with 60-second timeout expectation
   - **Solution**: Async invocation with progress polling
2. **Dashboard Integration**: Project dashboard operates within conversation instead of direct API calls
   - **Solution**: Direct GraphQL mutations for dashboard operations
3. **Disabled Agent Architecture**: Strands Agents deployed but hardcoded to disabled
   - **Root Cause**: Timeout issues caused fallback to simple tools
   - **Solution**: Enable agents with async pattern and optimizations
4. **Incomplete Tool Implementation**: Layout, simulation, and report tools severely limited
   - **Solution**: Restore all original tools and algorithms
5. **No MCP Server Integration**: Wind farm MCP server not deployed or accessible
   - **Solution**: Deploy MCP server as Lambda function
6. **Missing AgentCore Integration**: AgentCore proxy exists but never called
   - **Solution**: Integrate AgentCore runtime with streaming support
7. **Broken Workflow**: Multi-agent orchestration not functioning
   - **Solution**: Restore LangGraph-based multi-agent workflows
8. **Performance Issues**: Cold starts 30s, execution 60-120s
   - **Solution**: Docker optimization, lazy loading, connection pooling

## Glossary

- **Strands Agents**: Multi-agent framework used in original implementation for AI reasoning
- **PyWake**: Advanced wake modeling simulation library for wind farm analysis
- **MCP Server**: Model Context Protocol server providing wind farm analysis tools
- **AgentCore**: AWS Bedrock agent runtime framework
- **Orchestrator**: Lambda function routing renewable energy queries to specialized tools
- **Project Store**: S3-based storage system for wind farm project data
- **Terrain Agent**: Specialized agent for identifying unbuildable areas and exclusion zones
- **Layout Agent**: Specialized agent for designing optimal turbine placements
- **Simulation Agent**: Specialized agent for wake modeling and energy production calculations
- **Report Agent**: Specialized agent for generating executive reports with visualizations
- **GeoJSON**: Geographic data format for representing terrain features and turbine layouts
- **NREL**: National Renewable Energy Laboratory providing wind resource data

## Requirements

### Requirement 1: Implement Async Invocation Pattern to Fix Timeouts

**User Story:** As a renewable energy analyst, I want terrain analysis queries to complete successfully without timeout errors, so that I can begin wind farm site assessment.

#### Acceptance Criteria

1. WHEN a user submits "Analyze terrain for wind farm at coordinates (35.0, -101.0) with 5km radius", THE System SHALL invoke the Strands Agent asynchronously and return immediately with a request ID
2. WHEN async invocation starts, THE System SHALL write initial progress to DynamoDB with status 'in_progress'
3. WHEN the frontend receives a request ID, THE System SHALL poll for progress updates every 5 seconds for up to 3 minutes
4. WHEN the Strands Agent completes analysis, THE System SHALL update DynamoDB with status 'complete' and include all artifacts
5. WHEN the frontend polls for progress, THE System SHALL return current status, progress steps, and artifacts if complete

### Requirement 2: Separate Dashboard from Conversation with Direct API Calls

**User Story:** As a renewable energy analyst, I want project dashboard operations (view, delete, rename, export) to execute as direct GraphQL API calls, so that they don't clutter the conversation thread and provide instant feedback.

#### Acceptance Criteria

1. WHEN a user clicks "Delete" on a project in the dashboard, THE System SHALL invoke a GraphQL mutation `deleteRenewableProject(projectId: ID!)` that removes all S3 files and DynamoDB records without adding chat messages
2. WHEN a user clicks "Rename" on a project, THE System SHALL invoke a GraphQL mutation `renameRenewableProject(projectId: ID!, newName: String!)` that updates project metadata and shows inline edit interface
3. WHEN a user clicks "View Details" on a project, THE System SHALL invoke a GraphQL query `getRenewableProjectDetails(projectId: ID!)` that returns all artifacts and metadata, displaying in a modal or side panel
4. WHEN a user clicks "Export" on a project, THE System SHALL invoke a GraphQL mutation `exportRenewableProject(projectId: ID!)` that generates a ZIP file with all artifacts and returns a download URL
5. WHEN dashboard operations complete, THE System SHALL update the dashboard artifact in real-time via GraphQL subscription without page reload or conversation messages

### Requirement 3: Enable and Integrate Strands Agents with AgentCore

**User Story:** As a system architect, I want the original Strands Agents + AgentCore architecture fully functional, so that the renewable energy workflow provides intelligent AI reasoning.

#### Acceptance Criteria

1. WHEN the orchestrator checks agent availability, THE System SHALL return true (remove hardcoded `return false`)
2. WHEN Strands Agents initialize, THE System SHALL load AgentCore runtime with BedrockAgentCoreApp
3. WHEN an agent is invoked, THE System SHALL use AgentCore's @app.entrypoint decorator for streaming support
4. WHEN an agent executes, THE System SHALL use Strands Agent framework with BedrockModel and system prompts
5. WHEN an agent completes, THE System SHALL stream events via AgentCore's async generator pattern

### Requirement 4: Implement Complete Terrain Analysis with Buffer Zones

**User Story:** As a renewable energy analyst, I want comprehensive terrain analysis with OSM data showing buffer zones around all features, so that I can clearly see exclusion zones and buildable areas for turbine placement.

#### Acceptance Criteria

1. WHEN terrain analysis is requested, THE System SHALL fetch real OSM data for buildings, roads, water bodies, power lines, railways, forests, and protected areas within the specified radius
2. WHEN OSM data is retrieved, THE System SHALL apply setback distances and generate buffer polygons: buildings (500m buffer), major highways (150m buffer), highways (100m buffer), railways (100m buffer), water bodies (50m buffer), power lines (200m buffer), industrial areas (300m buffer)
3. WHEN buffer zones are calculated, THE System SHALL generate boundaries.geojson with complete GeoJSON FeatureCollection including: (a) original features as base geometries, (b) buffer polygons for each feature showing exclusion zones, (c) properties for each feature (feature_type, name, osm_id, tags, wind_impact, required_setback_m, buffer_width_m, data_source, reliability)
4. WHEN visualization is needed, THE System SHALL create boundaries.html as interactive Folium map with: (a) base features (solid fill: buildings=red, water=blue, forests=green, industrial=gray), (b) buffer zones (semi-transparent overlay with dashed borders showing exclusion zones), (c) roads/railways/power lines as polylines with buffer corridors, (d) styled popups with feature details and setback information, (e) legend showing feature types and buffer zones
5. WHEN static visualization is needed, THE System SHALL generate boundaries.png showing all terrain features with buffer zones visible as semi-transparent overlays and site perimeter
6. WHEN terrain analysis completes, THE System SHALL save all three artifacts (boundaries.geojson with buffers, boundaries.html with buffer visualization, boundaries.png) to S3 under renewable/terrain/{project_id}/ and return artifact URLs

### Requirement 5: Implement Complete Layout Optimization with Terrain + Turbines

**User Story:** As a wind farm designer, I want turbine layout maps that show the exact same terrain features and buffer zones as the terrain map, plus turbine positions, so that I can clearly see how turbines are positioned relative to exclusion zones.

#### Acceptance Criteria

1. WHEN layout optimization is requested, THE System SHALL load terrain boundaries.geojson (with all features and buffer zones) from S3 storage and fetch turbine specifications (rotor diameter, capacity, hub height) from turbine-models library
2. WHEN layout algorithm is selected, THE System SHALL support all 4 algorithms: create_grid_layout (regular grid), create_offset_grid_layout (staggered rows for wake reduction), create_spiral_layout (spiral pattern from center), create_greedy_layout (optimized placement avoiding constraints)
3. WHEN turbines conflict with buffer zones, THE System SHALL either skip conflicting positions (auto_relocate=False) or relocate to nearby valid positions (auto_relocate=True with user permission)
4. WHEN layout is complete, THE System SHALL generate turbine_layout.geojson with complete GeoJSON FeatureCollection including: (a) ALL terrain features from boundaries.geojson (buildings, roads, water, power lines, railways, forests with their buffer polygons), (b) turbine points with properties (turbine_id, turbine_model, capacity_MW, hub_height_m, rotor_diameter_m, latitude, longitude, marker-color=#0000ff, marker-symbol=wind-turbine), (c) site perimeter polygon
5. WHEN visualization is needed, THE System SHALL generate layout_map_1.png showing interactive Folium map with: (a) EXACT SAME terrain features and buffer zones as boundaries.html (buildings with 500m buffers, roads with corridor buffers, water with 50m buffers, power lines with 200m buffers, all with same colors and styling), (b) turbine markers overlaid as blue wind turbine icons, (c) site perimeter (green dashed line), (d) legend showing both terrain features and turbines
6. WHEN final layout is ready, THE System SHALL generate layout_final.png showing: (a) EXACT SAME terrain features and buffer zones as boundaries.png, (b) turbine positions overlaid with spacing indicators (9D minimum circles around each turbine), (c) exclusion zones (buffer zones) highlighted in semi-transparent red, (d) buildable areas shown in semi-transparent green
7. WHEN layout completes, THE System SHALL save all three artifacts (turbine_layout.geojson with terrain+turbines, layout_map_1.png with terrain+turbines, layout_final.png with terrain+turbines+spacing) to S3 under renewable/layout/{project_id}/ and return artifact URLs with metadata (turbine_count, total_capacity_mw, algorithm_used, spacing_d, skipped_turbines, buildable_area_km2, exclusion_area_km2)

### Requirement 6: Implement Complete Wake Simulation with All Visualizations

**User Story:** As a wind farm analyst, I want PyWake-based wake modeling with comprehensive visualizations matching the original demo, so that I can assess project viability and expected returns with professional-grade charts.

#### Acceptance Criteria

1. WHEN wake simulation is requested, THE System SHALL load turbine layout from project storage and fetch real wind conditions from NREL Wind Toolkit API
2. WHEN simulation runs, THE System SHALL use PyWake with Bastankhah-Gaussian wake model and calculate gross AEP, net AEP, wake losses, capacity factor, and performance metrics
3. WHEN simulation completes, THE System SHALL generate wake_map.png showing wake flow visualization with turbine positions and wake effects
4. WHEN simulation completes, THE System SHALL generate aep_distribution.png showing annual energy production distribution across turbines as a bar chart
5. WHEN simulation completes, THE System SHALL generate aep_per_turbine.png showing individual turbine AEP as a bar chart with turbine IDs
6. WHEN simulation completes, THE System SHALL generate wake_losses.png showing wake loss percentage per turbine as a bar chart
7. WHEN simulation completes, THE System SHALL generate wind_rose.png showing wind speed and direction distribution as a polar plot
8. WHEN simulation completes, THE System SHALL generate wind_speed_distribution.png showing wind speed frequency distribution as a histogram
9. WHEN simulation completes, THE System SHALL generate aep_vs_windspeed.png showing AEP correlation with wind speed as a scatter plot with trend line
10. WHEN simulation completes, THE System SHALL generate power_curve.png showing turbine power curve with actual vs theoretical performance
11. WHEN simulation completes, THE System SHALL save simulation_summary.json with all metrics (gross_aep_gwh, net_aep_gwh, wake_losses_percent, capacity_factor, turbine_count, total_capacity_mw)
12. WHEN all artifacts are generated, THE System SHALL upload to S3 under renewable/simulation/{project_id}/ and return artifact URLs

### Requirement 7: Implement Complete Report Generation with Professional PDF

**User Story:** As a project stakeholder, I want comprehensive PDF reports with executive summaries, technical analysis, financial projections, and all visualizations embedded, so that I can make informed investment decisions with professional documentation.

#### Acceptance Criteria

1. WHEN report generation is requested, THE System SHALL load all project data (terrain boundaries, turbine layout, simulation results, all charts) from S3 storage
2. WHEN charts are needed, THE System SHALL generate spider_chart.png showing multi-dimensional project assessment (wind resource, grid access, environmental impact, community support, economic viability, technical feasibility)
3. WHEN charts are needed, THE System SHALL generate performance_heatmap.png showing monthly performance metrics (wind speed, capacity factor, availability, efficiency) as a seaborn heatmap
4. WHEN charts are needed, THE System SHALL generate financial_projections.png showing 20-year revenue vs costs with cumulative cash flow and ROI analysis
5. WHEN charts are needed, THE System SHALL generate economic_impact.png showing job creation, tax revenue, and local economic benefits as stacked bar chart
6. WHEN charts are needed, THE System SHALL generate risk_matrix.png showing risk probability vs impact as scatter plot with risk categories
7. WHEN charts are needed, THE System SHALL generate timeline_gantt.png showing project phases (planning, permitting, construction, commissioning) as horizontal bar chart
8. WHEN report content is assembled, THE System SHALL include sections: Executive Summary, Project Overview, Site Analysis (with terrain map), Turbine Layout & Design (with layout map), Wake Analysis (with all simulation charts), Economic Analysis (with financial charts), Environmental Impact, Risk Analysis, Implementation Timeline, Conclusions & Recommendations
9. WHEN PDF is generated, THE System SHALL embed all images (terrain map, layout map, 8 simulation charts, 6 report charts) with professional formatting using WeasyPrint and markdown
10. WHEN report is complete, THE System SHALL save wind_farm_report.pdf to S3 under renewable/report/{project_id}/ and return download URL

### Requirement 8: Deploy MCP Server for Wind Farm Tools

**User Story:** As a system administrator, I want the wind farm MCP server deployed and accessible, so that agents can access specialized wind farm analysis tools via Model Context Protocol.

#### Acceptance Criteria

1. WHEN the system deploys, THE System SHALL deploy wind_farm_mcp_server.py as part of the renewableAgents Lambda function
2. WHEN agents initialize, THE System SHALL connect to MCP server via stdio transport using MCPClient from strands.tools.mcp
3. WHEN MCP server starts, THE System SHALL register tools: get_wind_data, get_turbine_specs, calculate_wake_losses, validate_layout, and generate_wind_rose
4. WHEN an agent needs MCP tools, THE System SHALL invoke tools via MCP protocol and receive structured responses
5. WHEN MCP connection fails, THE System SHALL retry up to 5 times with exponential backoff (20s, 10s, 5s, 5s, 5s)

### Requirement 9: Implement Project Lifecycle Management

**User Story:** As a renewable energy analyst, I want complete project lifecycle management (create, read, update, delete, list, search), so that I can organize and manage multiple wind farm projects.

#### Acceptance Criteria

1. WHEN a new project is created, THE System SHALL generate a unique project_id and human-readable project name
2. WHEN project data is saved, THE System SHALL store all files (GeoJSON, HTML, PNG, JSON) in S3 under project_id folder
3. WHEN projects are listed, THE System SHALL return all projects with metadata (name, location, created date, status, completion percentage)
4. WHEN a project is deleted, THE System SHALL remove all associated files from S3 and update session context
5. WHEN projects are searched, THE System SHALL support search by name, location, date range, and status

### Requirement 10: Implement Session Context Management

**User Story:** As a renewable energy analyst, I want the system to remember my active project across conversation turns, so that I don't have to repeat project names in every query.

#### Acceptance Criteria

1. WHEN a project is created or selected, THE System SHALL store project_name in session context (DynamoDB)
2. WHEN a user query references "the project" or "this project", THE System SHALL resolve to the active project from session context
3. WHEN multiple projects match a query, THE System SHALL prompt user to clarify which project they mean
4. WHEN session context is stale (>24 hours), THE System SHALL clear active project and require explicit project selection
5. WHEN user switches projects, THE System SHALL update session context with new active project

### Requirement 11: Restore Python Dependencies with AgentCore

**User Story:** As a system administrator, I want all required Python dependencies including AgentCore available in Lambda execution environment, so that agents can perform advanced calculations with proper runtime support.

#### Acceptance Criteria

1. WHEN Lambda functions deploy, THE System SHALL include bedrock-agentcore and bedrock-agentcore-starter-toolkit in requirements.txt
2. WHEN Lambda functions deploy, THE System SHALL include strands-agents, strands-agents-tools, and mcp packages
3. WHEN Lambda functions deploy, THE System SHALL include py-wake, turbine-models, geopandas, folium, matplotlib, seaborn, and weasyprint
4. WHEN Docker image builds, THE System SHALL use multi-stage build to reduce image size from 2GB to under 1GB
5. WHEN dependencies load, THE System SHALL implement lazy loading for heavy packages (PyWake, folium, matplotlib) to reduce cold start time

### Requirement 12: Implement Multi-Agent Orchestration with LangGraph

**User Story:** As a renewable energy analyst, I want to execute complete wind farm workflows (terrain → layout → simulation → report) in a single query using intelligent multi-agent orchestration, so that I can get comprehensive analysis efficiently.

#### Acceptance Criteria

1. WHEN a user requests "complete wind farm analysis", THE System SHALL create a LangGraph StateGraph with nodes for terrain, layout, simulation, and report agents
2. WHEN the workflow executes, THE System SHALL maintain shared state (WindFarmState) with query, project_id, coordinates, and intermediate results
3. WHEN one agent completes, THE System SHALL update the shared state and trigger the next agent via graph edges
4. WHEN an agent fails, THE System SHALL stop the workflow, update DynamoDB with error status, and return clear error message with remediation steps
5. WHEN workflow progresses, THE System SHALL update DynamoDB progress with current agent, elapsed time, and intermediate artifacts

### Requirement 13: Implement Proper Error Handling

**User Story:** As a renewable energy analyst, I want clear, actionable error messages when things go wrong, so that I know how to fix issues or retry operations.

#### Acceptance Criteria

1. WHEN OSM API fails, THE System SHALL return "Unable to fetch terrain data from OpenStreetMap. Please try again in a few minutes."
2. WHEN NREL API fails, THE System SHALL return "Unable to fetch wind data from NREL. Check API key configuration."
3. WHEN PyWake simulation fails, THE System SHALL return "Wake simulation failed: [specific error]. Check turbine layout and wind data."
4. WHEN S3 storage fails, THE System SHALL return "Unable to save project data. Check S3 bucket permissions."
5. WHEN timeout occurs, THE System SHALL return "Analysis is taking longer than expected. Try reducing the analysis radius or simplifying the query."

### Requirement 14: Implement Performance Optimization

**User Story:** As a system administrator, I want renewable energy operations optimized for Lambda constraints (memory, timeout, cold start), so that the system performs reliably at scale.

#### Acceptance Criteria

1. WHEN Lambda functions cold start, THE System SHALL initialize in under 20 seconds (down from 30s) via Docker optimization and lazy loading
2. WHEN terrain analysis runs, THE System SHALL process OSM data in under 45 seconds for 5km radius (down from 60-90s)
3. WHEN layout optimization runs, THE System SHALL generate layouts in under 60 seconds for 50 turbines (down from 90-120s)
4. WHEN wake simulation runs, THE System SHALL complete PyWake calculations in under 90 seconds (down from 120-180s)
5. WHEN Bedrock client is needed, THE System SHALL reuse pooled connection across warm invocations to save 2-5 seconds

### Requirement 15: Enforce Real Data Only - No Mock Data

**User Story:** As a renewable energy analyst, I want all data to be real and generated from actual API calls or calculations, so that I can trust the analysis results for real-world decision making.

#### Acceptance Criteria

1. WHEN terrain analysis runs, THE System SHALL fetch real OSM data from Overpass API and SHALL NOT use synthetic or mock terrain features
2. WHEN wind data is needed, THE System SHALL fetch real wind conditions from NREL Wind Toolkit API and SHALL NOT use synthetic wind data
3. WHEN turbine specifications are needed, THE System SHALL fetch real turbine data from turbine-models library and SHALL NOT use hardcoded or mock turbine specs
4. WHEN wake simulation runs, THE System SHALL use real PyWake calculations with actual wind data and turbine positions and SHALL NOT use mock simulation results
5. WHEN charts are generated, THE System SHALL use real calculated data from simulations and SHALL NOT use placeholder or synthetic chart data
6. WHEN any API call fails, THE System SHALL return clear error message indicating data unavailability and SHALL NOT fall back to mock data
7. WHEN testing is performed, THE System SHALL use real API calls in integration tests and SHALL ONLY use mocks in isolated unit tests with clear test data labeling

### Requirement 16: Implement Comprehensive Testing

**User Story:** As a developer, I want comprehensive test coverage for all renewable energy features, so that I can confidently deploy changes without breaking existing functionality.

#### Acceptance Criteria

1. WHEN code changes are made, THE System SHALL have unit tests for all agent tools and utilities
2. WHEN integration testing runs, THE System SHALL test complete workflows (terrain → layout → simulation → report) with real API calls
3. WHEN performance testing runs, THE System SHALL verify operations complete within timeout limits
4. WHEN error scenarios are tested, THE System SHALL verify proper error handling and user-friendly messages
5. WHEN regression testing runs, THE System SHALL verify all previously working features still function correctly
