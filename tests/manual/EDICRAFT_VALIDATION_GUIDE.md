# EDIcraft Agent End-to-End Validation Guide

## Overview

This guide walks you through validating the EDIcraft agent integration from deployment to end-user experience.

## Prerequisites

Before starting validation:

- [ ] Amplify sandbox is running (`npx ampx sandbox`)
- [ ] All environment variables are configured in `.env.local`
- [ ] Bedrock AgentCore agent is deployed (see `edicraft-agent/DEPLOYMENT_GUIDE.md`)
- [ ] You have access to the Minecraft server at `edicraft.nigelgardiner.com`

## Validation Steps

### Step 1: Verify Deployment

Run the automated deployment test:

```bash
node tests/manual/test-edicraft-deployment.js
```

**Expected Output:**
- ✅ EDIcraft agent Lambda function found
- ✅ All environment variables configured
- ✅ Agent execution completes successfully
- ✅ Thought steps present in response

**If any tests fail:**
1. Check CloudWatch logs for the EDIcraft agent Lambda
2. Verify environment variables in AWS Lambda console
3. Ensure Bedrock AgentCore agent is deployed

### Step 2: Test Agent Routing

Open the web application and test that Minecraft queries route to EDIcraft:

#### Test Queries:

1. **Basic Minecraft Query**
   ```
   Show me wellbore data in minecraft
   ```
   - **Expected**: Routes to EDIcraft agent
   - **Verify**: Agent switcher shows "EDIcraft" selected

2. **Wellbore Trajectory Query**
   ```
   Build a wellbore trajectory in minecraft
   ```
   - **Expected**: Routes to EDIcraft agent
   - **Verify**: Processing starts immediately

3. **Horizon Surface Query**
   ```
   Visualize horizon surface in minecraft
   ```
   - **Expected**: Routes to EDIcraft agent
   - **Verify**: No confusion with other agents

4. **Combined Query (Priority Test)**
   ```
   Show me well log data in minecraft
   ```
   - **Expected**: Routes to EDIcraft (not petrophysics)
   - **Verify**: Minecraft visualization, not log plot

5. **OSDU Query**
   ```
   Get wellbore data from OSDU and show in minecraft
   ```
   - **Expected**: Routes to EDIcraft agent
   - **Verify**: OSDU integration works

### Step 3: Test Agent Execution

Test the complete agent execution flow:

#### Test Case 1: Wellbore Visualization

**Query:**
```
Get wellbore data from well001 and visualize it in minecraft
```

**Expected Behavior:**
1. Loading indicator appears
2. Thought steps display showing:
   - "Connecting to OSDU platform..."
   - "Retrieving wellbore data..."
   - "Transforming coordinates..."
   - "Building in Minecraft..."
3. Success message with Minecraft coordinates
4. No artifacts in web UI (visualization is in Minecraft)

**Verification:**
- [ ] Thought steps display correctly
- [ ] Each step shows status (complete/pending/error)
- [ ] Final message includes Minecraft coordinates
- [ ] No errors in browser console
- [ ] Check Minecraft server for actual visualization

#### Test Case 2: Horizon Surface Rendering

**Query:**
```
Render the horizon surface for formation XYZ in minecraft
```

**Expected Behavior:**
1. Agent processes request
2. Thought steps show OSDU data retrieval
3. Coordinate transformation steps
4. Minecraft build confirmation

**Verification:**
- [ ] Thought steps are detailed and informative
- [ ] Response includes build location
- [ ] Minecraft server shows the surface

#### Test Case 3: Player Position Tracking

**Query:**
```
What is my current position in minecraft?
```

**Expected Behavior:**
1. Quick response (no OSDU needed)
2. Thought steps show RCON connection
3. Returns player coordinates

**Verification:**
- [ ] Fast response time
- [ ] Coordinates are accurate
- [ ] No unnecessary OSDU calls

### Step 4: Test Error Handling

Test that errors are handled gracefully with user-friendly messages:

#### Test Case 1: Agent Not Deployed

**Setup:** Temporarily set `BEDROCK_AGENT_ID` to invalid value

**Expected:**
- Clear error message: "EDIcraft agent is not deployed"
- Troubleshooting steps provided
- Link to deployment guide

#### Test Case 2: Minecraft Server Unreachable

**Setup:** Temporarily set `MINECRAFT_HOST` to invalid value

**Expected:**
- Error message: "Cannot connect to Minecraft server"
- Troubleshooting steps:
  - Check server is running
  - Verify RCON configuration
  - Check firewall rules

#### Test Case 3: OSDU Authentication Failure

**Setup:** Temporarily set `EDI_PASSWORD` to invalid value

**Expected:**
- Error message: "OSDU authentication failed"
- Troubleshooting steps:
  - Verify credentials
  - Check platform URL
  - Confirm permissions

#### Test Case 4: Missing Environment Variables

**Setup:** Remove one required environment variable

**Expected:**
- Error message listing missing variables
- Instructions to update `.env.local`
- Guidance to redeploy

### Step 5: Verify Thought Steps Display

Thought steps should provide visibility into agent execution:

#### Required Elements:

For each thought step, verify:
- [ ] **ID**: Unique identifier present
- [ ] **Type**: Correct type (analysis/processing/completion)
- [ ] **Timestamp**: Valid timestamp
- [ ] **Title**: Clear, descriptive title
- [ ] **Summary**: Detailed description of what's happening
- [ ] **Status**: Accurate status (complete/pending/error)

#### Example Thought Steps:

```json
[
  {
    "id": "step-1",
    "type": "analysis",
    "timestamp": 1705234567890,
    "title": "Analyzing Query",
    "summary": "Determining required OSDU data and Minecraft operations",
    "status": "complete"
  },
  {
    "id": "step-2",
    "type": "processing",
    "timestamp": 1705234568123,
    "title": "Retrieving Wellbore Data",
    "summary": "Fetching wellbore trajectory from OSDU platform",
    "status": "complete"
  },
  {
    "id": "step-3",
    "type": "processing",
    "timestamp": 1705234569456,
    "title": "Transforming Coordinates",
    "summary": "Converting UTM coordinates to Minecraft coordinates",
    "status": "complete"
  },
  {
    "id": "step-4",
    "type": "completion",
    "timestamp": 1705234570789,
    "title": "Building in Minecraft",
    "summary": "Constructing wellbore visualization at coordinates (1234, 64, 5678)",
    "status": "complete"
  }
]
```

### Step 6: End-to-End User Workflow

Complete a full user workflow from query to Minecraft visualization:

#### Workflow Steps:

1. **Open Web Application**
   - Navigate to chat interface
   - Verify EDIcraft agent is available in agent switcher

2. **Submit Query**
   ```
   Get wellbore data from well001 and build it in minecraft at spawn
   ```

3. **Monitor Execution**
   - Watch thought steps appear in real-time
   - Verify each step completes successfully
   - Check for any errors or warnings

4. **Review Response**
   - Read the final message
   - Note the Minecraft coordinates
   - Verify no artifacts in web UI (correct behavior)

5. **Check Minecraft Server**
   - Connect to `edicraft.nigelgardiner.com:49000`
   - Navigate to the coordinates provided
   - Verify the wellbore visualization exists
   - Check that it matches the OSDU data

6. **Verify Data Accuracy**
   - Compare Minecraft visualization to OSDU data
   - Check coordinate transformation is correct
   - Verify wellbore path is accurate

### Step 7: Performance Validation

Measure and validate performance metrics:

#### Metrics to Check:

- [ ] **Cold Start Time**: < 30 seconds (first request)
- [ ] **Warm Response Time**: < 10 seconds (subsequent requests)
- [ ] **OSDU Data Retrieval**: < 5 seconds
- [ ] **Minecraft Build Time**: < 3 seconds
- [ ] **Total End-to-End**: < 15 seconds (warm)

#### How to Measure:

1. Check CloudWatch logs for Lambda execution time
2. Use browser DevTools Network tab for API response time
3. Note timestamps in thought steps for phase timing

### Step 8: Integration Validation

Verify integration with other system components:

#### Chat Interface Integration:

- [ ] Thought steps display in chat bubble
- [ ] Loading indicators work correctly
- [ ] Error messages display properly
- [ ] Agent switcher shows EDIcraft when appropriate

#### Agent Router Integration:

- [ ] Minecraft queries route to EDIcraft
- [ ] Non-Minecraft queries route to other agents
- [ ] Priority handling works (well log + minecraft)
- [ ] Explicit agent selection works

#### Bedrock AgentCore Integration:

- [ ] Agent invocation succeeds
- [ ] Response streaming works
- [ ] Trace information is captured
- [ ] Session management works

#### OSDU Platform Integration:

- [ ] Authentication succeeds
- [ ] Data retrieval works
- [ ] Error handling is graceful
- [ ] Permissions are correct

#### Minecraft Server Integration:

- [ ] RCON connection succeeds
- [ ] Commands execute correctly
- [ ] Visualizations appear in-game
- [ ] Coordinate transformation is accurate

## Validation Checklist

Use this checklist to track validation progress:

### Deployment
- [ ] Lambda function deployed
- [ ] Environment variables configured
- [ ] IAM permissions granted
- [ ] Bedrock AgentCore agent deployed

### Routing
- [ ] Minecraft queries route correctly
- [ ] Priority handling works
- [ ] Explicit selection works
- [ ] No routing conflicts

### Execution
- [ ] Agent invokes successfully
- [ ] Thought steps display
- [ ] Response format correct
- [ ] No errors in execution

### Error Handling
- [ ] Missing config detected
- [ ] Connection errors handled
- [ ] Auth failures handled
- [ ] User-friendly messages

### Integration
- [ ] Chat interface works
- [ ] Agent router works
- [ ] Bedrock AgentCore works
- [ ] OSDU platform works
- [ ] Minecraft server works

### Performance
- [ ] Response time acceptable
- [ ] Cold start acceptable
- [ ] No timeouts
- [ ] Efficient execution

### User Experience
- [ ] Queries are intuitive
- [ ] Responses are clear
- [ ] Errors are helpful
- [ ] Workflow is smooth

## Troubleshooting

### Issue: Agent Not Found

**Symptoms:**
- "EDIcraft agent not found" error
- Routing fails

**Solutions:**
1. Verify Lambda is deployed: `aws lambda list-functions | grep edicraft`
2. Check backend.ts includes edicraftAgentFunction
3. Redeploy: `npx ampx sandbox`

### Issue: Environment Variables Missing

**Symptoms:**
- "Missing environment variable" error
- Configuration validation fails

**Solutions:**
1. Check `.env.local` has all required variables
2. Restart sandbox to apply changes
3. Verify in AWS Lambda console

### Issue: Bedrock Agent Not Deployed

**Symptoms:**
- "Agent not deployed" error
- Agent invocation fails

**Solutions:**
1. Follow `edicraft-agent/DEPLOYMENT_GUIDE.md`
2. Run `make deploy` in edicraft-agent directory
3. Update `BEDROCK_AGENT_ID` in `.env.local`

### Issue: Minecraft Connection Failed

**Symptoms:**
- "Connection refused" error
- RCON timeout

**Solutions:**
1. Verify server is running: `telnet edicraft.nigelgardiner.com 49000`
2. Check RCON password is correct
3. Verify firewall allows connection

### Issue: OSDU Authentication Failed

**Symptoms:**
- "Authentication failed" error
- 401/403 responses

**Solutions:**
1. Verify credentials in `.env.local`
2. Check platform URL is correct
3. Confirm user has necessary permissions
4. Try generating new OAuth credentials

### Issue: Thought Steps Not Displaying

**Symptoms:**
- No thought steps in response
- Empty thoughtSteps array

**Solutions:**
1. Check Bedrock AgentCore trace is enabled
2. Verify trace parsing logic in mcpClient.ts
3. Check response format in handler.ts

## Success Criteria

The EDIcraft agent integration is considered successful when:

✅ **All automated tests pass**
✅ **Minecraft queries route correctly**
✅ **Agent execution completes successfully**
✅ **Thought steps display in chat interface**
✅ **Error handling provides helpful messages**
✅ **Minecraft visualizations appear correctly**
✅ **OSDU data integration works**
✅ **Performance meets targets**
✅ **User workflow is smooth and intuitive**
✅ **No console errors or warnings**

## Next Steps After Validation

Once validation is complete:

1. **Document any issues found** and create tickets
2. **Update deployment guide** with any new findings
3. **Create user documentation** for EDIcraft features
4. **Set up monitoring** for production use
5. **Plan for production deployment** with proper credentials management

## Support

If you encounter issues during validation:

1. Check CloudWatch logs for detailed error messages
2. Review the troubleshooting section above
3. Consult `edicraft-agent/DEPLOYMENT_GUIDE.md`
4. Check `edicraft-agent/FIND_CREDENTIALS.md` for credential issues

## Validation Sign-Off

**Validated By:** _________________

**Date:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Status:** [ ] PASSED  [ ] FAILED  [ ] PARTIAL

**Blockers:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
