# Task 17: Comprehensive Intent Classifier Tests - Quick Reference

## Overview

This document provides a quick reference for running and interpreting the comprehensive intent classifier test suite.

## Test Script

**Location:** `tests/test-intent-scenarios.js`

## Running the Tests

### Prerequisites

1. AWS credentials configured
2. EDIcraft agent Lambda deployed
3. Node.js and required AWS SDK packages installed

### Execute Tests

```bash
# Run the comprehensive test suite
node tests/test-intent-scenarios.js

# Or make it executable and run directly
chmod +x tests/test-intent-scenarios.js
./tests/test-intent-scenarios.js
```

## Test Categories

The test suite covers 6 main categories:

### 1. Wellbore Trajectory Intent (8 tests)
Tests deterministic pattern matching for wellbore trajectory queries with various phrasings:
- "Build wellbore trajectory for WELL-011"
- "Visualize wellbore WELL-005"
- "Show me wellbore WELL-003"
- "Create wellbore path for WELL-007"
- "Wellbore trajectory for WELL-009"
- "Trajectory for WELL-012"
- "WELL-015 trajectory"
- "Build WELL-020"

**Expected Behavior:**
- Intent: `wellbore_trajectory`
- Confidence: 0.95
- Routing: `DIRECT_TOOL_CALL`
- Tool: `build_wellbore_trajectory_complete`
- Parameter extraction: Well ID (e.g., WELL-011)

### 2. Horizon Surface Intent (10 tests)
Tests deterministic pattern matching for horizon surface queries:
- "Build horizon surface"
- "Visualize horizon"
- "Show me horizon"
- "Create horizon"
- "Render horizon"
- "Find a horizon"
- "Tell me the horizon name"
- "Get horizon coordinates"
- "Convert horizon to minecraft coordinates"
- "Build horizon Top_Reservoir" (with named horizon)

**Expected Behavior:**
- Intent: `horizon_surface`
- Confidence: 0.90
- Routing: `DIRECT_TOOL_CALL`
- Tool: `build_horizon_surface_complete`
- Parameter extraction: Horizon name (optional)

### 3. List Players Intent (6 tests)
Tests deterministic pattern matching for player listing queries:
- "List players"
- "Who is online?"
- "Show me players"
- "How many players are online?"
- "Players online"
- "Online players"

**Expected Behavior:**
- Intent: `list_players`
- Confidence: 0.95
- Routing: `DIRECT_TOOL_CALL`
- Tool: `list_players`

### 4. Player Positions Intent (5 tests)
Tests deterministic pattern matching for player position queries:
- "Where are the players?"
- "Player positions"
- "Show player coordinates"
- "Get player positions"
- "Positions of players"

**Expected Behavior:**
- Intent: `player_positions`
- Confidence: 0.95
- Routing: `DIRECT_TOOL_CALL`
- Tool: `get_player_positions`

### 5. System Status Intent (7 tests)
Tests deterministic pattern matching for greetings and status checks:
- "Hello"
- "Hi"
- "Hey"
- "Status"
- "What is the status?"
- "Are you ready?"
- "Help"

**Expected Behavior:**
- Intent: `system_status`
- Confidence: 0.90
- Routing: `GREETING` (for greetings) or `DIRECT_TOOL_CALL` (for status checks)
- Tool: `get_system_status`

### 6. Ambiguous Cases (6 tests)
Tests that ambiguous queries route to LLM agent:
- "Tell me about the subsurface data"
- "Can you analyze the geological formations and provide insights?"
- "Show me something interesting"
- "First find a horizon, then tell me its name, and convert it to minecraft coordinates"
- "What can you do with wellbore data?"
- "Compare WELL-001 and WELL-002"

**Expected Behavior:**
- Intent: `unknown` (except multi-step horizon query)
- Confidence: 0.0
- Routing: `LLM_AGENT`
- No direct tool call

## Test Output

### Console Output

The test suite provides color-coded console output:

- **Cyan:** Test category headers
- **Blue:** Individual test names
- **Yellow:** Response times and metadata
- **Green:** Passed checks (✅)
- **Red:** Failed checks (❌)

### Results Document

After running, a detailed results document is generated:

**Location:** `tests/TASK_17_INTENT_CLASSIFIER_TEST_RESULTS.md`

**Contents:**
- Overall test summary
- Category-by-category results
- Detailed analysis of each test
- Pass/fail reasons
- Conclusion and recommendations

## Interpreting Results

### Success Criteria

A test passes when ALL of the following checks pass:

1. **Routing Check:** Query routes to expected destination (DIRECT_TOOL_CALL, GREETING, or LLM_AGENT)
2. **Parameter Extraction:** Expected parameters are extracted (well ID, horizon name)
3. **Tool Execution:** Evidence of tool execution in response

### Common Failure Reasons

1. **Routing Failure:** Query routed to wrong destination
   - Check intent classifier patterns
   - Verify confidence thresholds

2. **Parameter Extraction Failure:** Parameters not extracted correctly
   - Check regex patterns in intent classifier
   - Verify parameter extraction logic

3. **Tool Execution Failure:** Tool not executed or returned error
   - Check Python agent tool implementation
   - Verify Lambda permissions and configuration

## Troubleshooting

### Test Script Fails to Find Lambda

**Error:** `EDIcraft agent function not found`

**Solution:**
1. Verify Lambda is deployed: `aws lambda list-functions | grep edicraft`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Verify region: `export AWS_REGION=us-east-1`

### All Tests Fail with Same Error

**Error:** Response indicates failure

**Solution:**
1. Check Lambda logs: `aws logs tail /aws/lambda/<function-name> --follow`
2. Verify environment variables are set
3. Check Python agent is deployed correctly

### Specific Intent Tests Fail

**Error:** Routing check fails

**Solution:**
1. Review intent classifier patterns in `amplify/functions/edicraftAgent/intentClassifier.ts`
2. Check confidence thresholds in handler
3. Verify Python agent tool implementations

### Ambiguous Cases Route to Direct Tool Call

**Error:** Should route to LLM but routes to direct tool call

**Solution:**
1. Check that patterns are not too broad
2. Verify confidence threshold (should be >= 0.85 for direct routing)
3. Review intent classifier logic for unknown intent

## Performance Expectations

- **Individual Test:** 2-5 seconds
- **Full Suite:** 3-5 minutes (42 tests with 1.5s delay between tests)
- **Success Rate:** 95%+ expected

## Next Steps After Testing

1. **All Tests Pass:**
   - Mark task 17 as complete
   - Proceed to task 18 (Performance and Accuracy Validation)
   - Document any observations

2. **Some Tests Fail:**
   - Review failure reasons in results document
   - Fix intent classifier patterns or tool implementations
   - Re-run tests to verify fixes
   - Document changes made

3. **Many Tests Fail:**
   - Check deployment status
   - Verify environment configuration
   - Review CloudWatch logs for errors
   - Consider rollback if major issues

## Related Files

- Intent Classifier: `amplify/functions/edicraftAgent/intentClassifier.ts`
- Handler: `amplify/functions/edicraftAgent/handler.ts`
- Python Agent: `edicraft-agent/agent.py`
- Tool Implementations: `edicraft-agent/tools/workflow_tools.py`
- Requirements: `.kiro/specs/fix-edicraft-horizon-routing/requirements.md`
- Design: `.kiro/specs/fix-edicraft-horizon-routing/design.md`

## Requirements Coverage

This test suite validates:

- **Requirement 5.4:** Test ambiguous cases that should use LLM
- **Requirement 5.5:** Document test results

All test scenarios are designed to verify the hybrid intent classification system works correctly for both deterministic patterns and ambiguous cases.
