# Task 7: End-to-End Horizon Query Validation Guide

## Overview

This guide provides instructions for validating the complete horizon query workflow from user input to final response.

## Test Objective

Verify that horizon queries:
1. Route correctly to the EDIcraft agent
2. Process through the EDIcraft handler
3. Return appropriate horizon-related content
4. Do NOT return petrophysics welcome messages
5. Include proper thought steps showing execution

## Prerequisites

- Amplify sandbox running (`npx ampx sandbox`)
- EDIcraft agent deployed and configured
- Valid AWS credentials
- Test environment configured

## Test Query

```
find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft
```

## Validation Criteria

### Required Checks (Must Pass)

1. **Query Routes to EDIcraft Agent**
   - `agentUsed` field equals `'edicraft'`
   - Verifies pattern matching works correctly

2. **Response is NOT Petrophysics Welcome Message**
   - Does not contain petrophysical analysis terms
   - Does not contain well log analysis content
   - Does not contain porosity/shale/saturation references

3. **Response Includes Horizon-Related Content**
   - Contains horizon-related terminology
   - References geological/subsurface concepts
   - Mentions Minecraft or coordinates

4. **Thought Steps Show Proper Execution**
   - `thoughtSteps` array exists and has entries
   - Steps show processing flow
   - Steps indicate agent activity

5. **Response Indicates Success**
   - `success` field is `true`
   - No error messages in response

6. **Response Contains Message Content**
   - `message` field exists
   - Message is substantial (>50 characters)
   - Message is properly formatted

### Optional Checks (Nice to Have)

7. **Response Includes Coordinate Information**
   - Mentions coordinates, position, or location
   - Provides specific coordinate values

8. **Response References Minecraft**
   - Explicitly mentions Minecraft
   - Provides Minecraft-specific information

## Running the Test

### Automated Test

```bash
# Run the comprehensive E2E validation
node tests/manual/test-horizon-e2e-validation.js
```

### Expected Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║         END-TO-END HORIZON QUERY VALIDATION TEST                           ║
╚════════════════════════════════════════════════════════════════════════════╝

================================================================================
STEP 1: Sending Horizon Query
================================================================================

Query: "find a horizon, tell me its name, convert it to minecraft coordinates..."
Session ID: test-horizon-e2e-1234567890

✅ Query completed in 2500ms

================================================================================
STEP 2: Validating Response
================================================================================

✅ Query Routes to EDIcraft Agent
✅ Response is NOT Petrophysics Welcome Message
✅ Response Includes Horizon-Related Content
✅ Thought Steps Show Proper Execution
✅ Response Indicates Success
✅ Response Contains Message Content
✅ Response Includes Coordinate Information
✅ Response References Minecraft

================================================================================
STEP 3: Response Analysis
================================================================================

Agent Used:
  edicraft

Message Content:
  I found a horizon in the subsurface data. The horizon is named "Top_Reservoir"...
  Length: 450 characters

Thought Steps:
  Count: 3
  1. Data Retrieval
     Fetching horizon data from OSDU platform
  2. Coordinate Conversion
     Converting UTM coordinates to Minecraft coordinate system
  3. Response Generation
     Formatting horizon information and coordinates

Artifacts:
  No artifacts (expected for EDIcraft - visualization in Minecraft)

Success Status:
  ✅ Success

================================================================================
STEP 4: Petrophysics Content Check
================================================================================

✅ No petrophysics content detected
   Response correctly routed to EDIcraft

================================================================================
STEP 5: Horizon Content Check
================================================================================

✅ Horizon-related content found (6 terms)
   Terms: horizon, geological, minecraft, coordinate, utm, elevation

================================================================================
VALIDATION REPORT
================================================================================

Summary:
  Total Checks: 8
  Passed: 8
  Failed: 0
  Warnings: 0
  Required Checks: 6/6

Content Validation:
  No Petrophysics Content: ✅
  Has Horizon Content: ✅

Overall Result:
  ✅ VALIDATION PASSED
  All required checks passed
  Query correctly routed to EDIcraft
  Response contains appropriate content
```

## Manual Validation Steps

### 1. Check CloudWatch Logs

```bash
# Get the agent router Lambda name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'agentRouter')].FunctionName" --output text

# Watch logs for routing decision
aws logs tail /aws/lambda/<router-function-name> --follow
```

Look for:
```
🎮 AgentRouter: EDIcraft pattern MATCHED: horizon.*coordinates
🎮 AgentRouter: EDIcraft agent selected
🎮 AgentRouter: Total patterns matched: 3
```

### 2. Check EDIcraft Handler Logs

```bash
# Get the EDIcraft handler Lambda name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraftAgent')].FunctionName" --output text

# Watch logs for processing
aws logs tail /aws/lambda/<edicraft-function-name> --follow
```

Look for:
```
🎮 Processing EDIcraft message: find a horizon, tell me its name...
🎮 EDIcraft agent response received
✅ EDIcraft handler completed successfully
```

### 3. Test in UI

1. Open the chat interface
2. Enter the test query
3. Observe the response
4. Verify:
   - Loading indicator appears
   - Response displays after processing
   - Response contains horizon information
   - Response does NOT contain petrophysics content
   - Thought steps are visible
   - No errors in browser console

### 4. Verify Response Content

Check that the response includes:
- ✅ Horizon name or reference
- ✅ Coordinate information (UTM or Minecraft)
- ✅ Geological/subsurface context
- ✅ Minecraft-related instructions
- ❌ NO petrophysical analysis terms
- ❌ NO well log analysis content
- ❌ NO porosity/shale/saturation calculations

## Troubleshooting

### Issue: Query Routes to Wrong Agent

**Symptoms:**
- `agentUsed` is not `'edicraft'`
- Response contains petrophysics content

**Solution:**
1. Check pattern matching in `agentRouter.ts`
2. Verify horizon patterns are present
3. Check pattern order (horizon patterns should be early)
4. Review logs for pattern matching results

### Issue: Response is Generic/Empty

**Symptoms:**
- Response has no horizon content
- Message is very short
- No thought steps

**Solution:**
1. Check EDIcraft handler is processing correctly
2. Verify MCP client connection
3. Check Bedrock AgentCore agent configuration
4. Review EDIcraft handler logs for errors

### Issue: Response Contains Petrophysics Content

**Symptoms:**
- Response mentions well logs, porosity, etc.
- Routing went to petrophysics agent

**Solution:**
1. Verify pattern matching logic
2. Check exclusion patterns
3. Ensure horizon patterns have higher priority
4. Test pattern matching in isolation

### Issue: No Thought Steps

**Symptoms:**
- `thoughtSteps` array is empty or missing
- Can't see processing flow

**Solution:**
1. Check EDIcraft handler returns thought steps
2. Verify thought step generation in MCP client
3. Check response formatting in handler

## Success Criteria

The validation is successful when:

- ✅ All 6 required checks pass
- ✅ No petrophysics content detected
- ✅ Horizon-related content present
- ✅ Query routes to EDIcraft agent
- ✅ Response is substantial and relevant
- ✅ Thought steps show proper execution
- ✅ No errors in logs or console

## Requirements Coverage

This test validates:

- **2.1**: EDIcraft agent receives horizon query
- **2.2**: Agent extracts horizon data
- **2.3**: Agent converts coordinates
- **2.4**: Agent returns horizon name and coordinates
- **2.5**: Agent returns user-friendly error messages (if applicable)
- **3.1**: Response includes horizon name
- **3.2**: Response includes coordinates
- **3.3**: Response uses clear formatting
- **3.4**: Multiple horizons listed (if applicable)
- **3.5**: Thought steps included
- **4.4**: Complete query logged
- **4.5**: Response logged with details

## Next Steps

After validation passes:
1. Mark Task 7 as complete
2. Proceed to Task 8: Test Error Handling
3. Document any issues found
4. Update patterns if needed
