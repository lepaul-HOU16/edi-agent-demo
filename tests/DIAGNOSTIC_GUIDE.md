# Renewable Agent Diagnostic Guide

## Overview

This guide helps you diagnose the renewable agent issue by systematically testing each part of the flow from frontend to backend.

## Prerequisites

1. Application is running (either locally or deployed)
2. You have access to:
   - Browser Developer Tools (Console, Network tab)
   - AWS CloudWatch Logs
   - AWS DynamoDB Console

## Diagnostic Steps

### Step 1: Reproduce the Issue in Browser

1. **Open the application** in your browser
2. **Open Developer Tools** (F12 or Right-click → Inspect)
3. **Go to the Console tab**
4. **Clear the console** (to see fresh logs)
5. **Send a renewable energy query**:
   - Example: "Analyze terrain at 40.7128, -74.0060"
   - Or use the agent switcher to select "Renewable" agent
6. **Document what you see**:
   - Does the user message appear immediately?
   - Does a loading indicator show?
   - Does an AI response appear?
   - Are artifacts displayed?
   - Do you see "No response generated" or similar error?

### Step 2: Check Browser Console Logs

Look for these log patterns in the console:

#### Expected Frontend Logs:

```
═══════════════════════════════════════════════════════════
🔵 FRONTEND (ChatBox): Sending message
═══════════════════════════════════════════════════════════
📝 Message: Analyze terrain at 40.7128, -74.0060
🆔 Session ID: <session-id>
🤖 Selected Agent: renewable
⏰ Timestamp: <timestamp>
═══════════════════════════════════════════════════════════

🔵 FRONTEND (chatUtils): sendMessage called
...

🔵 FRONTEND (chatUtils): REST API Response
✅ Success: true
📦 Has Response: true
📊 Artifact Count: <number>
💬 Message Length: <number>
```

#### Check for Errors:

- ❌ Any red error messages?
- ⚠️ Any warnings about missing data?
- 🔴 Any failed network requests?

### Step 3: Check Network Tab

1. **Go to Network tab** in Developer Tools
2. **Find the POST request** to `/api/chat`
3. **Check the request**:
   - Status code (should be 200)
   - Request payload (should have message, chatSessionId)
   - Response payload (should have success, response, artifacts)
4. **Copy the response** for analysis

#### Expected Response Structure:

```json
{
  "success": true,
  "message": "Message processed successfully",
  "response": {
    "text": "AI response text...",
    "artifacts": [
      {
        "type": "wind_farm_terrain_analysis",
        "messageContentType": "application/vnd.renewable.terrain+json",
        "data": { ... }
      }
    ]
  }
}
```

### Step 4: Use the Diagnostic HTML Tool

1. **Open** `tests/diagnose-renewable-frontend.html` in your browser
2. **Click "Run Diagnostics"**
3. **Review the results**:
   - Check which tests passed/failed
   - Read the diagnosis summary
   - Copy logs if needed

### Step 5: Check CloudWatch Logs

#### Chat Lambda Logs:

```bash
# Tail Chat Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# Or filter by session ID
aws logs filter-log-events \
  --log-group-name /aws/lambda/EnergyInsights-development-chat \
  --filter-pattern "<your-session-id>"
```

**Look for:**
- 🟢 "CHAT LAMBDA: Request received"
- 🟢 "CHAT LAMBDA: User message saved"
- 🟢 "CHAT LAMBDA: Agent response"
- 🟢 "CHAT LAMBDA: AI message saved"

#### Renewable Orchestrator Logs:

```bash
# Tail Orchestrator logs
aws logs tail /aws/lambda/EnergyInsights-development-renewable-orchestrator --follow
```

**Look for:**
- 🔴 "ORCHESTRATOR: Query received"
- 🔴 "ORCHESTRATOR: Intent detected"
- 🔴 "ORCHESTRATOR: Tool results"
- 🔴 "ORCHESTRATOR: Final artifacts"

### Step 6: Check DynamoDB

1. **Open AWS Console** → DynamoDB
2. **Find the ChatMessage table**
3. **Query by chatSessionId** (use your session ID from Step 1)
4. **Check the messages**:
   - Is there a user message (role: 'user')?
   - Is there an AI message (role: 'ai')?
   - Does the AI message have artifacts?
   - Is responseComplete set to true?

### Step 7: Analyze the Results

Based on your findings, identify where the flow breaks:

#### Scenario A: No API Response
- **Symptom**: Network request fails or returns error
- **Likely Cause**: API Gateway, Lambda, or IAM issues
- **Check**: CloudWatch logs for Lambda errors

#### Scenario B: API Returns Success but No Artifacts
- **Symptom**: Response has success: true but artifacts array is empty
- **Likely Cause**: Orchestrator not being invoked or tools failing
- **Check**: Orchestrator CloudWatch logs

#### Scenario C: API Returns Artifacts but UI Doesn't Show Them
- **Symptom**: Network tab shows artifacts but UI shows "No response"
- **Likely Cause**: Frontend display logic issue
- **Check**: ChatMessage component, artifact rendering components

#### Scenario D: Messages Not Persisted
- **Symptom**: DynamoDB has no messages or missing AI message
- **Likely Cause**: DynamoDB write operation failing
- **Check**: Chat Lambda logs for DynamoDB errors

#### Scenario E: Everything Works in Logs but UI Broken
- **Symptom**: All logs show success, DynamoDB has data, but UI broken
- **Likely Cause**: State management or rendering issue
- **Check**: React component state, re-render logic

## Common Issues and Solutions

### Issue 1: "No response generated"

**Diagnosis:**
- Check if API response has `response.text` field
- Check if artifacts array exists but is empty
- Check orchestrator logs for errors

**Solution:**
- If orchestrator not invoked: Check agent routing logic
- If orchestrator fails: Check tool Lambda configuration
- If artifacts missing: Check artifact transformation logic

### Issue 2: User Message Doesn't Appear

**Diagnosis:**
- Check if message is sent to API
- Check if user message is saved to DynamoDB
- Check ChatBox component state

**Solution:**
- If not sent: Check frontend sendMessage function
- If not saved: Check Chat Lambda DynamoDB write
- If not displayed: Check ChatBox message filtering

### Issue 3: Loading Indicator Never Dismisses

**Diagnosis:**
- Check if API response is received
- Check if isLoading state is updated
- Check for JavaScript errors

**Solution:**
- If response not received: Check API timeout settings
- If state not updated: Check state management logic
- If errors present: Fix JavaScript errors first

### Issue 4: Artifacts Not Rendering

**Diagnosis:**
- Check if artifacts are in API response
- Check if artifacts are passed to ChatMessage
- Check if artifact components exist

**Solution:**
- If not in response: Check orchestrator artifact generation
- If not passed: Check ChatBox artifact handling
- If components missing: Implement artifact components

## Reporting Results

When reporting your findings, include:

1. **What you see**: Exact behavior in UI
2. **Browser console logs**: Copy relevant logs
3. **Network response**: Copy API response JSON
4. **CloudWatch logs**: Copy relevant Lambda logs
5. **DynamoDB data**: Screenshot or copy message data
6. **Diagnostic tool results**: Copy from HTML diagnostic tool

## Next Steps

After completing diagnostics:

1. **Identify the broken component** (frontend, API, orchestrator, etc.)
2. **Implement targeted fix** for that specific component
3. **Test the fix** using this diagnostic guide again
4. **Verify no regressions** in other features

## Automated Diagnostic Script

For backend testing, you can also use:

```bash
# Set your API endpoint
export CHAT_API_ENDPOINT="https://your-api-endpoint.com/chat"
export AWS_REGION="us-east-1"

# Run diagnostic script
node tests/diagnose-renewable-agent-flow.js
```

This will test the backend flow and report any issues found.
