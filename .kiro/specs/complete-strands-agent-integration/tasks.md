# Tasks: Complete Strands Agent Integration

## Current Status

✅ **Tasks 1-3 COMPLETE**: All agent files copied, Lambda integration done, orchestrator routing implemented
⏳ **Tasks 4-9 REMAINING**: Testing, verification, and frontend integration needed

## Completed Work

### ✅ Task 1: Copy Complete Agent Architecture (COMPLETE)
- All 6 agent files copied to `amplify/functions/renewableAgents/`
- All 8 tool files copied to `amplify/functions/renewableAgents/tools/`
- MCP server copied to `amplify/functions/renewableAgents/MCP_Server/`

### ✅ Task 2: Orchestrator Integration (COMPLETE)
- `strandsAgentHandler.ts` created with intelligent routing
- Orchestrator updated to use Strands Agents when available
- Fallback to legacy tool invocation implemented

### ✅ Task 3: Lambda Integration (COMPLETE)
- `lambda_handler.py` created with proper agent initialization
- `requirements.txt` with all dependencies (strands, py-wake, geopandas, etc.)
- `resource.ts` configured with Python 3.12, 15min timeout, 3GB memory
- Bedrock and S3 permissions granted in `backend.ts`
- Environment variables configured

## Remaining Tasks

## Task 4: Verify Agent System Prompts

**Objective:** Ensure all agents have comprehensive system prompts that guide intelligent decision-making

### Subtasks:

- [ ] 4.1 Verify terrain_agent system prompt
  - Check for project_id requirement explanation
  - Verify unbuildable areas analysis workflow
  - Confirm response footer format guidance
  - _Requirements: Agent must explain what it does and how_

- [ ] 4.2 Verify layout_agent system prompt
  - Check for all 4 layout algorithms explanation (grid, greedy, spiral, offset-grid)
  - Verify auto_relocate behavior description
  - Confirm explore_alternative_sites warning
  - Check decision-making process guidance
  - Verify response footer with turbine count
  - _Requirements: Agent must choose algorithm intelligently_

- [ ] 4.3 Verify simulation_agent system prompt
  - Check PyWake simulation explanation
  - Verify economic analysis description
  - Confirm GeoJSON input processing guidance
  - Check performance metrics explanation
  - Verify response footer with simulation_id
  - _Requirements: Agent must explain simulation results_

- [ ] 4.4 Verify report_agent system prompt
  - Check report generation capabilities
  - Verify output formats explanation
  - Confirm data requirements
  - _Requirements: Agent must generate comprehensive reports_

## Task 5: Test Individual Agents

**Objective:** Verify each agent works correctly in isolation

### Subtasks:

- [ ] 5.1 Test terrain_agent invocation
  - Deploy to sandbox environment
  - Invoke with test query: "Analyze terrain at 35.067482, -101.395466 with project_id 'test123'"
  - Verify agent responds (not just Lambda invocation)
  - Check CloudWatch logs for agent initialization
  - _Requirements: Agent must initialize and respond_

- [ ] 5.2 Test layout_agent invocation
  - Invoke with test query: "Create 30MW wind farm at 35.067482, -101.395466 with project_id 'test123'"
  - Verify agent responds with layout decision
  - Check which algorithm agent chose
  - Verify response includes reasoning
  - _Requirements: Agent must choose algorithm intelligently_

- [ ] 5.3 Test simulation_agent invocation
  - Invoke with test query: "Run wake simulation for project_id 'test123'"
  - Verify agent responds with simulation results
  - Check for PyWake execution
  - Verify wind rose generation
  - _Requirements: Agent must run simulation_

- [ ] 5.4 Test report_agent invocation
  - Invoke with test query: "Generate report for project_id 'test123'"
  - Verify agent responds with report
  - Check report format
  - _Requirements: Agent must generate report_

## Task 6: Test Multi-Agent Orchestration

**Objective:** Verify agents work together through the orchestrator

### Subtasks:

- [ ] 6.1 Test orchestrator routing to agents
  - Send terrain query through orchestrator
  - Verify orchestrator calls Strands Agent Lambda
  - Check response flows back correctly
  - Verify artifacts extracted properly
  - _Requirements: Orchestrator must route to agents_

- [ ] 6.2 Test complete workflow
  - Send query: "Create a complete wind farm at 35.067482, -101.395466"
  - Verify multi-agent graph executes
  - Check terrain → layout → simulation → report flow
  - Verify project_id maintained throughout
  - _Requirements: Multi-agent workflow must complete_

- [ ] 6.3 Test error handling
  - Test with missing project_id
  - Test with invalid coordinates
  - Test with Bedrock API errors
  - Verify graceful error messages
  - _Requirements: Errors must be handled gracefully_

## Task 7: Verify Artifact Generation and Storage

**Objective:** Ensure agents generate and store artifacts correctly

### Subtasks:

- [ ] 7.1 Verify S3 artifact storage
  - Check agents save artifacts to S3
  - Verify S3 paths follow conventions
  - Check artifact URLs in responses
  - Verify artifacts are retrievable
  - _Requirements: Artifacts must be stored in S3_

- [ ] 7.2 Verify artifact extraction
  - Check lambda_handler extracts artifacts from agent responses
  - Verify artifact types are determined correctly
  - Check project_id is associated with artifacts
  - _Requirements: Artifacts must be extracted from responses_

- [ ] 7.3 Test artifact retrieval in frontend
  - Verify frontend receives artifact URLs
  - Check artifacts render in UI
  - Test different artifact types (maps, layouts, wind roses)
  - _Requirements: Artifacts must render in UI_

## Task 8: Verify Extended Thinking Display

**Objective:** Ensure agent reasoning is visible to users

### Subtasks:

- [ ] 8.1 Check agent thinking in responses
  - Verify Claude 3.7 Sonnet extended thinking is captured
  - Check thinking appears in agent responses
  - Verify thinking is formatted properly
  - _Requirements: Agent thinking must be visible_

- [ ] 8.2 Update frontend to display thinking
  - Add UI component for extended thinking
  - Display agent decision-making process
  - Show which tools agent chose to use
  - _Requirements: Frontend must show agent reasoning_

## Task 9: Performance and Optimization Testing

**Objective:** Ensure agents perform well in production

### Subtasks:

- [ ] 9.1 Test cold start performance
  - Measure Lambda cold start time
  - Check agent initialization time
  - Verify 15-minute timeout is sufficient
  - _Requirements: Cold starts must complete within timeout_

- [ ] 9.2 Test warm start performance
  - Verify agents reuse initialized instances
  - Check response times for warm invocations
  - Measure end-to-end latency
  - _Requirements: Warm starts must be fast_

- [ ] 9.3 Test memory usage
  - Monitor Lambda memory consumption
  - Verify 3GB is sufficient for PyWake simulations
  - Check for memory leaks
  - _Requirements: Memory usage must be within limits_

- [ ] 9.4 Test concurrent invocations
  - Send multiple requests simultaneously
  - Verify agents handle concurrency
  - Check for race conditions
  - _Requirements: Agents must handle concurrent requests_

## Task 10: Align UI with Demo Repo Lab Scenarios

**Objective:** Ensure the UI reflects the workflows and example queries from the demo repo labs 1-3

### Subtasks:

- [ ] 10.1 Review demo repo lab notebooks
  - Read `lab1_ai_agents_tutorial.ipynb` for individual agent examples
  - Read `lab2_multi_agent_tutorial.ipynb` for complete workflow examples
  - Read `lab3_agentcore_tutorial.ipynb` for deployment patterns
  - Document key example queries and workflows
  - _Requirements: Understand what scenarios the labs demonstrate_

- [ ] 10.2 Add suggested prompts to chat UI
  - Create suggested prompt component for renewable energy agent
  - Include Lab 1 examples: "Analyze terrain at 35.067482, -101.395466 with 100m setback"
  - Include Lab 1 examples: "Create a grid layout for 6 turbines at 40.712, -74.006"
  - Include Lab 1 examples: "Create a wind farm with approximately 30MW capacity at longitude=-99.218100 and latitude=32.343100"
  - Include Lab 2 example: Complete multi-agent workflow query
  - Display prompts when renewable agent is selected
  - _Requirements: Users see example queries matching lab scenarios_

- [ ] 10.3 Update workflow guidance
  - Add workflow steps explanation matching Lab 2 multi-agent flow
  - Show: Terrain Analysis → Layout Design → Simulation → Reporting
  - Explain how agents coordinate and share data
  - Display in UI when multi-agent workflow is triggered
  - _Requirements: Users understand the complete workflow_

- [ ] 10.4 Add interactive examples
  - Create "Try Lab 1 Examples" button that loads terrain analysis query
  - Create "Try Lab 2 Complete Workflow" button that loads multi-agent query
  - Pre-fill chat input with example query on button click
  - _Requirements: Users can easily try lab scenarios_

- [ ] 10.5 Document agent capabilities
  - Add help text explaining what each agent does (matching lab descriptions)
  - Terrain Agent: Identifies unbuildable areas, applies setbacks
  - Layout Agent: 4 algorithms (grid, greedy, spiral, offset-grid), capacity-based design
  - Simulation Agent: PyWake analysis, wind rose, performance metrics
  - Report Agent: Comprehensive analysis and recommendations
  - Display in agent switcher or help panel
  - _Requirements: Users understand agent capabilities_

## Task 11: Verify All Demo Repo Artifacts Are Supported

**Objective:** Ensure all artifact types from the demo repo are rendered in the UI, including integration with the existing dashboard

### Subtasks:

- [ ] 11.1 Audit demo repo artifact types
  - Terrain analysis: Folium map (HTML), GeoJSON boundaries
  - Layout optimization: GeoJSON turbine positions, layout map (HTML)
  - Wake simulation: Wind rose (Plotly JSON), performance metrics (JSON), wake analysis charts
  - Report generation: PDF reports, executive summaries
  - Document all artifact formats generated by agents
  - _Requirements: Know what artifacts agents produce_

- [ ] 11.2 Verify terrain artifacts render correctly
  - Check `TerrainMapArtifact.tsx` handles Folium HTML maps
  - Verify GeoJSON boundaries display on map
  - Test unbuildable areas visualization
  - Ensure setback zones are visible
  - **Honor demo repo line thickness/weight for terrain features** (check for threshold values in demo code)
  - Apply appropriate line weights for different feature types (boundaries, water, buildings, roads)
  - _Requirements: Terrain artifacts match demo repo output with correct line styling_

- [ ] 11.3 Verify layout artifacts render correctly
  - Check `LayoutMapArtifact.tsx` handles turbine GeoJSON
  - Verify `TurbineLayoutMap.tsx` displays turbine positions
  - **Ensure terrain features appear on layout map** (unbuildable areas, boundaries, water bodies, buildings)
  - Display terrain constraints as background layers on turbine map
  - Show setback zones around exclusion areas
  - **Apply demo repo line thickness/weight to terrain features on layout map**
  - Use appropriate line weights for terrain boundaries vs turbine connections
  - Test all 4 layout algorithms visualization (grid, greedy, spiral, offset-grid)
  - Ensure turbine labels and capacity info display
  - Verify terrain + turbines render together (not separate maps)
  - _Requirements: Layout artifacts match demo repo output with terrain context and correct line styling_

- [ ] 11.4 Verify simulation artifacts render correctly
  - Check `PlotlyWindRose.tsx` handles Plotly JSON wind roses
  - Verify `WakeAnalysisDashboard.tsx` displays wake effects
  - Test `PerformanceAnalysisDashboard.tsx` shows energy production
  - Ensure `WindResourceDashboard.tsx` displays wind statistics
  - _Requirements: Simulation artifacts match demo repo output_

- [ ] 11.5 Verify report artifacts render correctly
  - Check `ReportArtifact.tsx` handles PDF reports
  - Verify executive summary display
  - Test recommendations and insights rendering
  - Ensure economic analysis displays
  - _Requirements: Report artifacts match demo repo output_

- [ ] 11.6 Integrate artifacts with ProjectDashboardArtifact
  - Update `ProjectDashboardArtifact.tsx` to show artifact gallery per project
  - Display terrain map thumbnail in project row
  - Show layout visualization preview
  - Include wind rose thumbnail
  - Add "View All Artifacts" button that opens gallery
  - _Requirements: Dashboard shows project artifacts_

- [ ] 11.7 Create artifact gallery view
  - Build `VisualizationGallery.tsx` component (already exists - verify it works)
  - Display all artifacts for a project in grid layout
  - Support filtering by artifact type (terrain, layout, simulation, report)
  - Enable full-screen view for each artifact
  - Add download buttons for artifacts
  - _Requirements: Users can view all project artifacts_

- [ ] 11.8 Add artifact comparison tools
  - Verify `LayoutComparisonTool.tsx` compares different layouts
  - Check `SiteComparisonDashboard.tsx` compares multiple sites
  - Test side-by-side artifact viewing
  - Ensure comparison metrics display
  - _Requirements: Users can compare artifacts_

- [ ] 11.9 Enhance artifact metadata display
  - Show generation timestamp for each artifact
  - Display agent that created the artifact
  - Include parameters used (coordinates, capacity, setbacks, etc.)
  - Add data source indicators (OSM, NREL, synthetic)
  - _Requirements: Users understand artifact provenance_

- [ ] 11.10 Test complete artifact workflow
  - Run complete multi-agent workflow
  - Verify all artifacts generate correctly
  - Check artifacts save to S3
  - Confirm artifacts display in UI
  - Test artifacts persist across sessions
  - Verify dashboard shows all artifacts
  - _Requirements: Complete artifact pipeline works end-to-end_

## Success Criteria

✅ **Infrastructure Complete:**
- All 4 agents (terrain, layout, simulation, report) copied and configured
- Lambda integration with proper handler and dependencies
- Orchestrator routing to Strands Agents implemented
- Bedrock and S3 permissions granted
- Environment variables configured

⏳ **Testing Required:**
- [ ] Individual agents respond to queries
- [ ] Multi-agent orchestration works end-to-end
- [ ] Turbine placement uses intelligent algorithms (not grid-like)
- [ ] Agent system prompts guide decision-making
- [ ] Extended thinking visible in responses
- [ ] Artifacts generated and stored in S3
- [ ] Artifacts render in frontend UI
- [ ] Error handling works gracefully
- [ ] Performance meets requirements (cold/warm starts, memory)

## Next Steps

**Priority Order:**
1. ✅ Task 1-3: Infrastructure (COMPLETE)
2. ⏳ Task 4: Verify system prompts
3. ⏳ Task 5: Test individual agents
4. ⏳ Task 6: Test multi-agent orchestration
5. ⏳ Task 7: Verify artifact generation
6. ⏳ Task 8: Verify extended thinking display
7. ⏳ Task 9: Performance testing

**Start with Task 4** to verify the agent system prompts are comprehensive and guide intelligent decision-making.
