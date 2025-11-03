# Implementation Plan: Fix Strands Agent Cold Start

## Overview

This plan fixes the critical Strands Agent deployment and cold start issues through:
1. Immediate deployment of existing agents
2. Performance monitoring and optimization
3. Enhanced chain-of-thought visualization
4. Graceful fallback mechanisms

## Task List

- [x] 1. Deploy Strands Agent Lambda to AWS
  - Deploy existing configuration without code changes
  - Verify Lambda appears in AWS console
  - Confirm Docker image builds successfully
  - Check CloudWatch logs for initialization
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Start sandbox and wait for deployment
  - Run `npx ampx sandbox` command
  - Monitor deployment progress (10-15 minutes expected)
  - Watch for "Deployed" success message
  - _Requirements: 1.1_

- [x] 1.2 Verify Lambda deployment
  - Check Lambda function exists in AWS console
  - Verify function name contains "RenewableAgentsFunction"
  - Confirm timeout set to 15 minutes (900 seconds)
  - Confirm memory set to 3GB (3008 MB)
  - _Requirements: 1.2_

- [x] 1.3 Test direct Lambda invocation
  - Invoke Lambda with test payload
  - Measure cold start time
  - Check for timeout errors
  - Verify response structure
  - _Requirements: 1.4_

- [x] 2. Add performance monitoring to Lambda handler
  - Track cold start vs warm start
  - Log initialization time
  - Log execution time
  - Log memory usage
  - Return performance metrics in response
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Add cold/warm start detection
  - Use global variable to track initialization state
  - Log "COLD START" or "WARM START" on each invocation
  - Calculate initialization time for cold starts
  - _Requirements: 2.1, 7.1, 7.2_

- [x] 2.2 Add execution time tracking
  - Record start time at handler entry
  - Record end time before return
  - Calculate total execution time
  - Log execution time to CloudWatch
  - _Requirements: 2.2, 7.2_

- [x] 2.3 Add memory usage tracking
  - Import `psutil` for memory monitoring
  - Log memory usage at initialization
  - Log peak memory usage during execution
  - Include memory metrics in response
  - _Requirements: 2.3, 7.3_

- [x] 2.4 Return performance metrics in response
  - Add `performance` object to response
  - Include `coldStart`, `initTime`, `executionTime`, `memoryUsed`
  - Format times in seconds with 2 decimal places
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Add progress updates during initialization
  - Send progress when connecting to Bedrock
  - Send progress when loading agent tools
  - Send progress when initializing agent
  - Send progress when agent is ready
  - Include elapsed time in each update
  - _Requirements: 6.1, 6.2_

- [x] 3.1 Implement send_progress function
  - Create function that logs progress with structured format
  - Include step name, message, elapsed time, timestamp
  - Store progress updates in list for return
  - _Requirements: 6.1_

- [x] 3.2 Add progress updates for Bedrock connection
  - Log "Connecting to AWS Bedrock..." before connection
  - Log "Bedrock connection established" after success
  - Include elapsed time for each step
  - _Requirements: 6.1_

- [x] 3.3 Add progress updates for tool loading
  - Log "Loading agent tools..." before loading
  - Log "Tools loaded successfully" after completion
  - Include count of tools loaded
  - _Requirements: 6.1_

- [x] 3.4 Add progress updates for agent initialization
  - Log "Initializing AI agent..." before init
  - Log "Agent ready!" after completion
  - Include total initialization time
  - _Requirements: 6.1_

- [x] 3.5 Add progress updates during execution
  - Log "Agent analyzing your request..." when thinking starts
  - Log "Executing tools..." when tools run
  - Log "Complete!" when finished
  - _Requirements: 6.1, 6.2_

- [x] 4. Create progress storage in DynamoDB
  - Create AgentProgress table
  - Store progress updates by requestId
  - Add TTL for automatic cleanup (24 hours)
  - Create API endpoint for progress polling
  - _Requirements: 6.1, 6.2_

- [x] 4.1 Define AgentProgress table schema
  - Primary key: requestId (string)
  - Attributes: steps (list), status (string), createdAt (number), updatedAt (number)
  - TTL attribute: expiresAt (24 hours from creation)
  - _Requirements: 6.1_

- [x] 4.2 Add DynamoDB write in Lambda handler
  - Write progress updates to DynamoDB after each step
  - Update status field (in_progress, complete, error)
  - Set updatedAt timestamp on each write
  - _Requirements: 6.1_

- [x] 4.3 Create progress polling API endpoint
  - Add GraphQL query: `getAgentProgress(requestId: String!)`
  - Return steps array and current status
  - Handle missing requestId gracefully
  - _Requirements: 6.1, 6.2_

- [x] 5. Build AgentProgressIndicator UI component
  - Create component in `src/components/renewable/`
  - Display progress steps with icons
  - Show elapsed time for each step
  - Add expandable thinking section
  - Style with Cloudscape or MUI
  - _Requirements: 6.1, 6.2_

- [x] 5.1 Create AgentProgressIndicator.tsx
  - Accept props: steps, currentStep, isVisible
  - Render progress steps with status icons
  - Show spinner for in-progress steps
  - Show checkmark for completed steps
  - _Requirements: 6.1_

- [x] 5.2 Add progress polling in ChatMessage component
  - Poll progress endpoint every 1 second
  - Update AgentProgressIndicator with new steps
  - Stop polling when status is complete
  - _Requirements: 6.1, 6.2_

- [x] 5.3 Add ExtendedThinkingDisplay component
  - Show Claude's reasoning process
  - Make expandable/collapsible
  - Display thinking blocks with timestamps
  - Style for readability
  - _Requirements: 6.2_

- [x] 5.4 Integrate components into chat UI
  - Show AgentProgressIndicator during agent execution
  - Show ExtendedThinkingDisplay when thinking available
  - Hide components when complete
  - _Requirements: 6.1, 6.2_

- [x] 6. Implement lazy loading for heavy dependencies
  - Lazy load PyWake (only for simulation agent)
  - Lazy load GeoPandas (only for terrain agent)
  - Lazy load Matplotlib (only for report agent)
  - Keep lightweight imports at top level
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.1 Create lazy loading helper functions
  - `get_pywake()`: Load PyWake on first use
  - `get_geopandas()`: Load GeoPandas on first use
  - `get_matplotlib()`: Load Matplotlib on first use
  - Cache loaded modules in global variables
  - _Requirements: 4.4_

- [x] 6.2 Update agent functions to use lazy loading
  - Terrain agent: Call `get_geopandas()` when needed
  - Layout agent: No heavy dependencies
  - Simulation agent: Call `get_pywake()` when needed
  - Report agent: Call `get_matplotlib()` when needed
  - _Requirements: 4.4_

- [x] 7. Implement Bedrock connection pooling
  - Create global Bedrock client variable
  - Initialize client on first use
  - Reuse client across warm invocations
  - Log connection establishment time
  - _Requirements: 2.3, 4.3_

- [x] 7.1 Create get_bedrock_client function
  - Check if global client exists
  - If not, create new boto3 bedrock-runtime client
  - Cache client in global variable
  - Return cached client
  - _Requirements: 2.3_

- [x] 7.2 Update agent initialization to use pooled client
  - Replace direct boto3.client calls with get_bedrock_client()
  - Verify client reuse across invocations
  - Measure connection time savings
  - _Requirements: 2.3_

- [x] 8. Add orchestrator fallback logic
  - Detect Strands agent timeout errors
  - Fall back to direct tool invocation
  - Return response with fallbackUsed flag
  - Log fallback events for monitoring
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.1 Add timeout error handling in orchestrator
  - Wrap Strands agent invocation in try-catch
  - Catch TooManyRequestsException and timeout errors
  - Log warning when timeout occurs
  - _Requirements: 8.1, 8.2_

- [x] 8.2 Implement fallbackToDirectTools function
  - Map agent type to direct tool Lambda name
  - Invoke direct tool Lambda with same parameters
  - Return response with fallbackUsed: true
  - _Requirements: 8.2, 8.3_

- [x] 8.3 Update UI to show fallback warning
  - Display warning when fallbackUsed is true
  - Message: "Advanced AI unavailable, using basic mode"
  - Style as info banner, not error
  - _Requirements: 8.2_

- [x] 9. Optimize Dockerfile (if cold start > 5 minutes)
  - Implement multi-stage build
  - Use python:3.12-slim base image
  - Pre-compile Python bytecode
  - Cache pip dependencies in layer
  - Minimize installed packages
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9.1 Create multi-stage Dockerfile
  - Stage 1: Build dependencies with full Python image
  - Stage 2: Runtime with slim image
  - Copy only necessary files to runtime stage
  - _Requirements: 4.2_

- [x] 9.2 Add Python bytecode compilation
  - Run `python -m compileall .` in Dockerfile
  - Compile all .py files to .pyc
  - Reduce import time on cold start
  - _Requirements: 4.3_

- [x] 9.3 Optimize pip dependencies
  - Use `--no-cache-dir` flag
  - Install only production dependencies
  - Remove build tools after installation
  - _Requirements: 4.1_

- [x] 10. Create comprehensive test suite
  - Test cold start performance
  - Test warm start performance
  - Test all 4 agents individually
  - Test multi-agent orchestration
  - Test fallback mechanism
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.1 Create test-strands-cold-start.js
  - Measure cold start time (first invocation)
  - Verify cold start < 5 minutes
  - Log detailed timing breakdown
  - _Requirements: 9.1_

- [x] 10.2 Create test-strands-warm-start.js
  - Invoke Lambda twice in succession
  - Measure warm start time (second invocation)
  - Verify warm start < 30 seconds
  - _Requirements: 9.2_

- [x] 10.3 Create test-strands-all-agents.js
  - Test terrain agent invocation
  - Test layout agent invocation
  - Test simulation agent invocation
  - Test report agent invocation
  - Verify all agents respond successfully
  - _Requirements: 9.3_

- [x] 10.4 Create test-strands-orchestration.js
  - Test orchestrator routing to Strands agents
  - Test complete multi-agent workflow
  - Verify artifacts generated and stored
  - _Requirements: 9.4_

- [x] 10.5 Create test-strands-fallback.js
  - Simulate Strands agent timeout
  - Verify fallback to direct tools
  - Check fallbackUsed flag in response
  - Verify UI shows fallback warning
  - _Requirements: 9.5_

- [x] 11. Add CloudWatch monitoring and alarms
  - Create custom metrics for cold/warm starts
  - Create alarm for cold start > 10 minutes
  - Create alarm for warm start > 60 seconds
  - Create alarm for memory > 2.8GB
  - Create alarm for timeout rate > 10%
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11.1 Add CloudWatch custom metrics
  - Publish ColdStartDuration metric
  - Publish WarmStartDuration metric
  - Publish MemoryUsed metric
  - Publish TimeoutRate metric
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 11.2 Create CloudWatch alarms
  - Alarm: ColdStartDuration > 600 seconds (10 min)
  - Alarm: WarmStartDuration > 60 seconds
  - Alarm: MemoryUsed > 2867 MB (95% of 3GB)
  - Alarm: TimeoutRate > 10%
  - _Requirements: 7.5_

- [x] 12. Document deployment and troubleshooting
  - Document cold start behavior
  - Document warm start behavior
  - Document environment variables
  - Document troubleshooting steps
  - Document performance benchmarks
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12.1 Create STRANDS_AGENT_DEPLOYMENT_GUIDE.md
  - Explain deployment process
  - List all environment variables
  - Document timeout and memory settings
  - Provide deployment commands
  - _Requirements: 10.2, 10.3_

- [ ] 12.2 Create STRANDS_AGENT_TROUBLESHOOTING.md
  - Common issues and solutions
  - How to check CloudWatch logs
  - How to verify environment variables
  - How to test cold/warm starts
  - _Requirements: 10.3, 10.4_

- [ ] 12.3 Create STRANDS_AGENT_PERFORMANCE.md
  - Document performance benchmarks
  - Cold start: target < 5 min, acceptable < 10 min
  - Warm start: target < 30 sec, acceptable < 60 sec
  - Memory: target < 2.5GB, max 3GB
  - _Requirements: 10.4_

## Success Criteria

✅ **Deployment**:
- Strands Agent Lambda deployed to AWS
- Lambda appears in console
- CloudWatch logs show initialization
- Direct invocation succeeds

✅ **Performance**:
- Cold start < 5 minutes (target) or < 10 minutes (acceptable)
- Warm start < 30 seconds (target) or < 60 seconds (acceptable)
- Memory usage < 2.5GB
- Success rate > 95%

✅ **User Experience**:
- Progress updates show during cold start
- Extended thinking visible in UI
- Fallback works if timeout occurs
- Clear error messages

✅ **Monitoring**:
- CloudWatch metrics track performance
- Alarms alert on degradation
- Logs provide debugging info

## Deployment Order

1. **Phase 1: Deploy and Measure** (Tasks 1-2)
   - Deploy existing configuration
   - Add performance monitoring
   - Measure baseline metrics

2. **Phase 2: Progress Visualization** (Tasks 3-5)
   - Add progress updates in Lambda
   - Create progress storage
   - Build UI components

3. **Phase 3: Optimization** (Tasks 6-7)
   - Add lazy loading
   - Add connection pooling
   - Optimize if needed

4. **Phase 4: Fallback and Monitoring** (Tasks 8, 11)
   - Add orchestrator fallback
   - Add CloudWatch monitoring
   - Create alarms

5. **Phase 5: Testing and Documentation** (Tasks 10, 12)
   - Run comprehensive tests
   - Document everything
   - Validate with user

## Estimated Timeline

- **Phase 1**: 30 minutes (deploy + monitor)
- **Phase 2**: 2 hours (progress updates + UI)
- **Phase 3**: 1 hour (optimization)
- **Phase 4**: 1 hour (fallback + monitoring)
- **Phase 5**: 1 hour (testing + docs)

**Total**: ~5.5 hours

## Next Steps

**Start with Task 1**: Deploy Strands Agent Lambda to AWS and measure baseline performance. This will tell us if optimization is needed.
