# Implementation Plan - Lambda-Based Interim Renewable Solution

## Overview

This implementation plan breaks down the Lambda-based renewable energy solution into discrete, manageable tasks. Each task focuses on creating working Lambda functions that use the ACTUAL renewable demo Python code.

## Task List

- [x] 1. Create Lambda Layer with Renewable Demo Code
  - [x] 1.1 Create layer directory structure
    - Create `amplify/layers/renewableDemo/` directory
    - Create `amplify/layers/renewableDemo/python/renewable-demo/` directory
    - _Requirements: 3_
  
  - [x] 1.2 Copy renewable demo Python code to layer
    - Copy `agentic-ai-for-renewable-site-design-mainline/exploratory/` to layer
    - Copy `terrain_analysis.py`, `layout_optimization.py`, `wake_simulation.py`
    - Copy `visualization_utils.py`, `gis_utils.py`, `wind_data.py`, `turbine_specs.py`
    - _Requirements: 3_
  
  - [x] 1.3 Create requirements.txt for layer
    - List dependencies: pandas, numpy, folium, matplotlib, py-wake, geopandas
    - Add boto3, requests for AWS and API calls
    - _Requirements: 5_
  
  - [x] 1.4 Create build script for layer
    - Create `build.sh` script to install dependencies
    - Create zip file for Lambda layer
    - Test layer creation locally
    - _Requirements: 5_
  
  - [x] 1.5 Publish Lambda layer
    - Run build script to create layer zip
    - Publish layer to AWS Lambda
    - Note layer ARN for use in Lambda functions
    - _Requirements: 3, 5_

- [x] 2. Create Terrain Analysis Tool Lambda
  - [x] 2.1 Create Lambda function directory
    - Create `amplify/functions/renewableTools/terrain/` directory
    - Create `handler.py` file
    - _Requirements: 2, 3_
  
  - [x] 2.2 Implement terrain analysis handler
    - Import renewable demo's terrain analysis functions
    - Parse input coordinates from event
    - Call `fetch_elevation_data()` from demo
    - Call `fetch_land_use_data()` from demo
    - Call `analyze_terrain_suitability()` from demo
    - _Requirements: 2, 3_
  
  - [x] 2.3 Implement visualization generation
    - Call `create_terrain_map()` from demo to generate Folium HTML
    - Store map HTML in S3
    - Return map HTML and S3 URL in response
    - _Requirements: 2, 3_
  
  - [x] 2.4 Add error handling
    - Catch Python exceptions
    - Return structured error response
    - Log errors to CloudWatch
    - _Requirements: 6_
  
  - [x] 2.5 Create Lambda resource definition
    - Create `resource.ts` using CDK Lambda construct
    - Configure Python 3.12 runtime
    - Attach renewable demo layer
    - Set timeout to 30 seconds, memory to 1024MB
    - _Requirements: 2, 5_

- [x] 3. Create Layout Optimization Tool Lambda
  - [x] 3.1 Create Lambda function directory
    - Create `amplify/functions/renewableTools/layout/` directory
    - Create `handler.py` file
    - _Requirements: 2, 3_
  
  - [x] 3.2 Implement layout optimization handler
    - Import renewable demo's layout optimization functions
    - Parse input coordinates and capacity from event
    - Call `get_turbine_specifications()` from demo
    - Call `optimize_turbine_layout()` from demo
    - _Requirements: 2, 3_
  
  - [x] 3.3 Implement visualization generation
    - Call `create_layout_map()` from demo to generate Folium HTML
    - Generate GeoJSON for turbine positions
    - Store map HTML in S3
    - Return layout data and visualizations
    - _Requirements: 2, 3_
  
  - [x] 3.4 Add error handling
    - Catch Python exceptions
    - Return structured error response
    - Log errors to CloudWatch
    - _Requirements: 6_
  
  - [x] 3.5 Create Lambda resource definition
    - Create `resource.ts` using CDK Lambda construct
    - Configure Python 3.12 runtime
    - Attach renewable demo layer
    - Set timeout to 30 seconds, memory to 1024MB
    - _Requirements: 2, 5_

- [ ] 4. Create Wake Simulation Tool Lambda
  - [ ] 4.1 Create Lambda function directory
    - Create `amplify/functions/renewableTools/simulation/` directory
    - Create `handler.py` file
    - _Requirements: 2, 3_
  
  - [ ] 4.2 Implement wake simulation handler
    - Import renewable demo's wake simulation functions
    - Parse input layout data from event
    - Call `fetch_nrel_wind_data()` from demo to get REAL wind data
    - Call `run_wake_simulation()` from demo using py-wake
    - _Requirements: 2, 3_
  
  - [ ] 4.3 Implement visualization generation
    - Call `create_wake_map()` from demo to generate wake visualization
    - Call `create_performance_chart()` from demo to generate matplotlib charts
    - Store visualizations in S3
    - Return simulation results and visualizations
    - _Requirements: 2, 3_
  
  - [ ] 4.4 Add error handling
    - Catch Python exceptions
    - Handle NREL API failures with fallback data
    - Return structured error response
    - Log errors to CloudWatch
    - _Requirements: 6_
  
  - [ ] 4.5 Create Lambda resource definition
    - Create `resource.ts` using CDK Lambda construct
    - Configure Python 3.12 runtime
    - Attach renewable demo layer
    - Set timeout to 60 seconds, memory to 2048MB (simulation is compute-intensive)
    - _Requirements: 2, 5_

- [ ] 5. Create Report Generation Tool Lambda
  - [ ] 5.1 Create Lambda function directory
    - Create `amplify/functions/renewableTools/report/` directory
    - Create `handler.py` file
    - _Requirements: 2, 3_
  
  - [ ] 5.2 Implement report generation handler
    - Import renewable demo's report generation functions
    - Parse input project data from event
    - Aggregate terrain, layout, and simulation results
    - Generate executive summary
    - Generate recommendations
    - _Requirements: 2, 3_
  
  - [ ] 5.3 Implement report formatting
    - Format report as HTML
    - Include all visualizations
    - Store report in S3
    - Return report HTML and S3 URL
    - _Requirements: 2, 3_
  
  - [ ] 5.4 Add error handling
    - Catch Python exceptions
    - Return structured error response
    - Log errors to CloudWatch
    - _Requirements: 6_
  
  - [ ] 5.5 Create Lambda resource definition
    - Create `resource.ts` using CDK Lambda construct
    - Configure Python 3.12 runtime
    - Attach renewable demo layer
    - Set timeout to 30 seconds, memory to 1024MB
    - _Requirements: 2, 5_

- [x] 6. Create TypeScript Orchestrator Lambda
  - [ ] 6.1 Create orchestrator directory
    - Create `amplify/functions/renewableOrchestrator/` directory
    - Create `handler.ts` file
    - Create `types.ts` for TypeScript interfaces
    - _Requirements: 4_
  
  - [ ] 6.2 Implement intent parsing
    - Create `parseIntent()` function with pattern matching
    - Detect terrain analysis queries
    - Detect layout optimization queries
    - Detect wake simulation queries
    - Detect report generation queries
    - Extract parameters (coordinates, capacity, etc.) from queries
    - _Requirements: 4_
  
  - [ ] 6.3 Implement Lambda invocation logic
    - Create `invokeLambda()` function using AWS SDK
    - Add retry logic with exponential backoff
    - Handle Lambda invocation errors
    - Parse Lambda response payloads
    - _Requirements: 4_
  
  - [ ] 6.4 Implement tool calling logic
    - Create `callToolLambdas()` function
    - Route to appropriate tool Lambda based on intent
    - Pass parameters to tool Lambda
    - Aggregate results from multiple tool calls if needed
    - _Requirements: 4_
  
  - [ ] 6.5 Implement artifact formatting
    - Create `formatArtifacts()` function
    - Transform tool Lambda responses to EDI artifact format
    - Generate thought steps for UI display
    - Create response message
    - _Requirements: 4, 9_
  
  - [ ] 6.6 Implement main handler
    - Parse incoming request
    - Call intent parsing
    - Call tool Lambdas
    - Format response
    - Return OrchestratorResponse
    - _Requirements: 4_
  
  - [ ] 6.7 Add error handling
    - Catch all errors
    - Return user-friendly error messages
    - Log errors to CloudWatch
    - _Requirements: 4_
  
  - [ ] 6.8 Create Lambda resource definition
    - Create `resource.ts` using defineFunction
    - Set timeout to 60 seconds, memory to 512MB
    - Add environment variables for tool Lambda names
    - _Requirements: 4, 5_

- [ ] 7. Configure IAM Permissions
  - [ ] 7.1 Grant orchestrator permission to invoke tool Lambdas
    - Add IAM policy to orchestrator Lambda role
    - Allow `lambda:InvokeFunction` on all tool Lambda ARNs
    - _Requirements: 4_
  
  - [ ] 7.2 Grant tool Lambdas permission to access S3
    - Add IAM policy to each tool Lambda role
    - Allow `s3:PutObject` and `s3:GetObject` on renewable S3 bucket
    - _Requirements: 2_
  
  - [ ] 7.3 Grant tool Lambdas permission to access SSM
    - Add IAM policy to each tool Lambda role
    - Allow `ssm:GetParameter` for configuration parameters
    - _Requirements: 7_
  
  - [ ] 7.4 Grant tool Lambdas permission to call external APIs
    - Ensure Lambdas can make HTTPS requests to NREL, USGS APIs
    - Configure VPC settings if needed
    - _Requirements: 2_

- [ ] 8. Register Lambdas in Amplify Backend
  - [ ] 8.1 Import Lambda resources in backend.ts
    - Import renewableOrchestrator from resource file
    - Import all tool Lambdas from resource files
    - _Requirements: 4, 5_
  
  - [ ] 8.2 Add Lambdas to defineBackend
    - Add renewableOrchestrator to backend definition
    - Add renewableTerrainTool to backend definition
    - Add renewableLayoutTool to backend definition
    - Add renewableSimulationTool to backend definition
    - Add renewableReportTool to backend definition
    - _Requirements: 4, 5_
  
  - [ ] 8.3 Configure environment variables
    - Pass tool Lambda function names to orchestrator
    - Pass S3 bucket name to tool Lambdas
    - Pass NREL API key to tool Lambdas (if required)
    - _Requirements: 7_
  
  - [ ] 8.4 Apply IAM permissions
    - Add IAM policies defined in task 7
    - Verify permissions are correctly applied
    - _Requirements: 4_

- [ ] 9. Update Frontend Configuration
  - [ ] 9.1 Update environment variables
    - Add `NEXT_PUBLIC_RENEWABLE_ENABLED=true` to .env.local
    - Add `NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT` with orchestrator URL
    - Add `NEXT_PUBLIC_RENEWABLE_S3_BUCKET` with bucket name
    - _Requirements: 9_
  
  - [ ] 9.2 Update renewable client configuration
    - Modify `src/services/renewable-integration/config.ts`
    - Point to Lambda orchestrator endpoint instead of AgentCore
    - _Requirements: 9_
  
  - [ ] 9.3 Verify frontend integration
    - Ensure RenewableClient works with Lambda endpoint
    - Ensure ResponseTransformer handles Lambda responses
    - Ensure UI components render artifacts correctly
    - _Requirements: 9_

- [ ] 10. Deploy and Test
  - [ ] 10.1 Deploy Lambda layer
    - Run layer build script
    - Publish layer to AWS
    - Verify layer is available
    - _Requirements: 3, 5_
  
  - [ ] 10.2 Deploy Lambda functions
    - Run `npx ampx sandbox` to deploy all Lambdas
    - Verify all Lambdas are created
    - Check CloudWatch logs for initialization
    - _Requirements: 4, 5_
  
  - [ ] 10.3 Test terrain analysis
    - Invoke orchestrator with query: "Analyze terrain for wind farm at 35.067482, -101.395466"
    - Verify terrain tool Lambda is called
    - Verify REAL elevation and land use data is fetched
    - Verify Folium map is generated
    - Verify response is formatted correctly
    - _Requirements: 1, 2, 3, 4_
  
  - [ ] 10.4 Test layout optimization
    - Invoke orchestrator with query: "Create a 30MW wind farm layout at those coordinates"
    - Verify layout tool Lambda is called
    - Verify REAL turbine specifications are used
    - Verify layout optimization runs
    - Verify Folium map is generated
    - Verify response is formatted correctly
    - _Requirements: 1, 2, 3, 4_
  
  - [ ] 10.5 Test wake simulation
    - Invoke orchestrator with query: "Run wake simulation for the layout"
    - Verify simulation tool Lambda is called
    - Verify REAL NREL wind data is fetched
    - Verify py-wake simulation runs
    - Verify visualizations are generated
    - Verify response is formatted correctly
    - _Requirements: 1, 2, 3, 4_
  
  - [ ] 10.6 Test report generation
    - Invoke orchestrator with query: "Generate executive report"
    - Verify report tool Lambda is called
    - Verify report aggregates all results
    - Verify report HTML is generated
    - Verify response is formatted correctly
    - _Requirements: 1, 2, 3, 4_
  
  - [ ] 10.7 Test error scenarios
    - Test with invalid coordinates
    - Test with NREL API unavailable (mock failure)
    - Test with Lambda timeout
    - Verify error messages are user-friendly
    - Verify partial results are returned when possible
    - _Requirements: 6_
  
  - [ ] 10.8 Test end-to-end in chat UI
    - Open EDI Platform chat interface
    - Type renewable query
    - Verify query is routed to renewable orchestrator
    - Verify artifacts display correctly
    - Verify thought steps are shown
    - Verify visualizations are interactive
    - _Requirements: 9_

- [ ] 11. Performance Optimization
  - [ ] 11.1 Implement Lambda warm-up
    - Create CloudWatch Events rule to invoke Lambdas every 5 minutes
    - Keep Lambdas warm to avoid cold starts
    - _Requirements: 8_
  
  - [ ] 11.2 Implement caching
    - Cache turbine specifications in Lambda memory
    - Cache wind data for common locations
    - Cache terrain data for common locations
    - _Requirements: 8_
  
  - [ ] 11.3 Optimize Lambda memory settings
    - Test different memory configurations
    - Find optimal memory/cost balance
    - Update Lambda resource definitions
    - _Requirements: 8_
  
  - [ ] 11.4 Implement parallel execution
    - Identify opportunities for parallel tool Lambda invocation
    - Modify orchestrator to invoke Lambdas in parallel when possible
    - _Requirements: 8_

- [ ] 12. Documentation
  - [ ] 12.1 Create deployment guide
    - Document Lambda layer creation process
    - Document Lambda function deployment
    - Document IAM permission setup
    - Document environment variable configuration
    - _Requirements: 10_
  
  - [ ] 12.2 Create testing guide
    - Document sample queries for each tool
    - Document expected responses
    - Document how to check CloudWatch logs
    - Document troubleshooting steps
    - _Requirements: 10_
  
  - [ ] 12.3 Create migration guide
    - Document how to migrate to AgentCore when it becomes GA
    - Document what changes are needed
    - Document rollback procedure
    - _Requirements: 7, 10_
  
  - [ ] 12.4 Update main README
    - Add Lambda-based renewable solution section
    - Link to detailed documentation
    - Add architecture diagram
    - _Requirements: 10_

- [ ]* 13. Write Unit Tests (Optional)
  - [ ]* 13.1 Test orchestrator intent parsing
    - Write tests for parseIntent() function
    - Test various query patterns
    - Test parameter extraction
    - _Requirements: 4_
  
  - [ ]* 13.2 Test orchestrator Lambda invocation
    - Write tests for invokeLambda() function
    - Mock AWS SDK calls
    - Test retry logic
    - Test error handling
    - _Requirements: 4_
  
  - [ ]* 13.3 Test orchestrator artifact formatting
    - Write tests for formatArtifacts() function
    - Test transformation of tool responses
    - Test thought step generation
    - _Requirements: 4_
  
  - [ ]* 13.4 Test tool Lambda handlers
    - Write tests for each tool Lambda handler
    - Mock renewable demo function calls
    - Test error handling
    - Test response formatting
    - _Requirements: 2, 3_

## Task Execution Notes

### Prerequisites
- Renewable demo code available in `agentic-ai-for-renewable-site-design-mainline/`
- AWS account with Lambda, S3, and IAM permissions
- Amplify Gen 2 project set up
- NREL API key (if required for wind data)

### Task Dependencies
- Task 1 (Lambda layer) must be completed before tasks 2-5 (tool Lambdas)
- Tasks 2-5 (tool Lambdas) must be completed before task 6 (orchestrator)
- Task 6 (orchestrator) must be completed before task 8 (backend registration)
- Task 8 (backend registration) must be completed before task 9 (frontend config)
- Task 9 (frontend config) must be completed before task 10 (testing)
- Tasks 11-13 can be done in parallel after task 10

### Testing Strategy
- Unit tests (task 13) are optional but recommended
- Integration tests (task 10) are mandatory
- Manual testing in chat UI is required for user acceptance

### Deployment Strategy
- Deploy to sandbox environment first
- Test thoroughly before production deployment
- Have rollback plan ready (keep AgentCore proxy as backup)

## Success Criteria

When all tasks are complete:
- [ ] Lambda layer contains renewable demo Python code
- [ ] All tool Lambdas use REAL renewable demo functions
- [ ] Orchestrator Lambda routes queries correctly
- [ ] Users can analyze wind farms in chat interface
- [ ] REAL NREL wind data is fetched
- [ ] REAL terrain analysis with GIS data
- [ ] REAL py-wake simulations
- [ ] REAL Folium/matplotlib visualizations
- [ ] Response time < 30 seconds
- [ ] Error handling is graceful
- [ ] Documentation is complete
- [ ] Clear migration path to AgentCore exists

## Migration to AgentCore (Future)

When AgentCore becomes GA:
1. Deploy AgentCore backend using demo's `deploy-to-agentcore.sh`
2. Update frontend endpoint to point to AgentCore
3. Keep Lambda implementation as backup
4. Monitor AgentCore performance
5. Deprecate Lambda implementation after validation

The Lambda implementation provides a working solution TODAY while we wait for AgentCore GA.
