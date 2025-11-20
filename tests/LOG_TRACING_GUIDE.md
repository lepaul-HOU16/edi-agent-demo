# Log Tracing Guide for Renewable Agent

## Overview

This guide helps you trace the complete flow of a renewable agent query through all system layers using the comprehensive logging already in place.

## Log Layers

### Layer 1: Frontend (Browser Console)

**Location:** Browser Developer Tools → Console tab

**Log Patterns to Look For:**

```
═══════════════════════════════════════════════════════════
🔵 FRONTEND (ChatBox): Sending message
═══════════════════════════════════════════════════════════
📝 Message: <your-query>
🆔 Session ID: <session-id>
🤖 Selected Agent: renewable
⏰ Timestamp: <timestamp>
═══════════════════════════════════════════════════════════
```

**What to Check:**
- ✅ Message is logged with correct session ID
- ✅ Agent type is 'renewable' or 'auto'
- ✅ Timestamp is recent

**Then Look For:**

```
🔵 FRONTEND (chatUtils): sendMessage called
🆔 Session ID: <session-id>
📝 Message: <your-query>
🤖 Agent Type: renewable
```

**What to Check:**
- ✅ chatUtils receives the message
- ✅ Session ID matches
- ✅ Agent type is correct

**Then Look For:**

```
🔵 FRONTEND (chatUtils): Calling REST API client...
```

**What to Check:**
- ✅ API client is being called
- ⏱️ Note the timestamp for timing analysis

**Then Look For:**

```
═══════════════════════════════════════════════════════════
🔵 FRONTEND (chatUtils): REST API Response
═══════════════════════════════════════════════════════════
✅ Success: true
📦 Has Response: true
📊 Artifact Count: <number>
💬 Message Length: <number>
═══════════════════════════════════════════════════════════
```

**What to Check:**
- ✅ Success is true
- ✅ Has Response is true
- ✅ Artifact Count > 0 (should be at least 1 for renewable queries)
- ✅ Message Length > 0

**Finally Look For:**

```
🔵 FRONTEND: Adding AI message to chat
```

**What to Check:**
- ✅ AI message is being added to state
- ⏱️ Check timing from send to display

### Layer 2: API Gateway (Network Tab)

**Location:** Browser Developer Tools → Network tab

**Request to Find:** POST to `/api/chat`

**Request Details to Check:**
```json
{
  "message": "<your-query>",
  "chatSessionId": "<session-id>",
  "conversationHistory": []
}
```

**Response Details to Check:**
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

**What to Check:**
- ✅ Status Code: 200
- ✅ Response Time: < 30 seconds
- ✅ success: true
- ✅ response.text exists and has content
- ✅ response.artifacts is an array with items
- ✅ Each artifact has type, messageContentType, and data

### Layer 3: Chat Lambda (CloudWatch Logs)

**Location:** AWS CloudWatch → Log Groups → `/aws/lambda/EnergyInsights-development-chat`

**Command to Tail Logs:**
```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow
```

**Or Filter by Session:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/EnergyInsights-development-chat \
  --filter-pattern "<your-session-id>" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

**Log Patterns to Look For:**

```
🟢 CHAT LAMBDA: Request received
```

**What to Check:**
- ✅ Lambda received the request
- ✅ Session ID matches
- ✅ Message text is correct

**Then Look For:**

```
🟢 CHAT LAMBDA: User message saved: <message-id>
```

**What to Check:**
- ✅ User message was saved to DynamoDB
- ✅ Message ID is generated
- ⏱️ Note the timestamp

**Then Look For:**

```
🟡 AGENT ROUTER: Routing decision: renewable
```

**What to Check:**
- ✅ Agent Router selected 'renewable' agent
- ✅ Not routing to 'general' or other agents

**Then Look For:**

```
🟠 PROXY AGENT: Invoking orchestrator: <function-name>
```

**What to Check:**
- ✅ Proxy Agent is invoking orchestrator
- ✅ Function name is correct (contains 'renewable-orchestrator')

**Then Look For:**

```
🟠 PROXY AGENT: Orchestrator response: <response>
```

**What to Check:**
- ✅ Orchestrator returned a response
- ✅ Response contains artifacts
- ⏱️ Check response time

**Then Look For:**

```
🟠 PROXY AGENT: Transformed artifacts: <count>
```

**What to Check:**
- ✅ Artifacts were transformed
- ✅ Count matches expected number

**Then Look For:**

```
🟢 CHAT LAMBDA: Agent response: <response>
```

**What to Check:**
- ✅ Agent response received
- ✅ Contains text and artifacts

**Finally Look For:**

```
🟢 CHAT LAMBDA: AI message saved: <message-id>
```

**What to Check:**
- ✅ AI message was saved to DynamoDB
- ✅ Message ID is generated
- ✅ Artifacts are included

### Layer 4: Renewable Orchestrator (CloudWatch Logs)

**Location:** AWS CloudWatch → Log Groups → `/aws/lambda/EnergyInsights-development-renewable-orchestrator`

**Command to Tail Logs:**
```bash
aws logs tail /aws/lambda/EnergyInsights-development-renewable-orchestrator --follow
```

**Log Patterns to Look For:**

```
🔴 ORCHESTRATOR: Query received: <query>
```

**What to Check:**
- ✅ Orchestrator received the query
- ✅ Query text is correct
- ✅ Session ID is present

**Then Look For:**

```
🔴 ORCHESTRATOR: Intent detected: <intent>
```

**What to Check:**
- ✅ Intent was detected (e.g., 'terrain_analysis')
- ✅ Intent matches the query type

**Then Look For:**

```
🔴 ORCHESTRATOR: Invoking tool: <tool-name>
```

**What to Check:**
- ✅ Correct tool is being invoked
- ✅ Tool Lambda name is correct

**Then Look For:**

```
🔴 ORCHESTRATOR: Tool results: <results>
```

**What to Check:**
- ✅ Tool returned results
- ✅ Results contain data
- ⏱️ Check tool execution time

**Finally Look For:**

```
🔴 ORCHESTRATOR: Final artifacts: <count>
```

**What to Check:**
- ✅ Artifacts were generated
- ✅ Count > 0
- ✅ Artifacts have correct structure

### Layer 5: Tool Lambda (CloudWatch Logs)

**Location:** AWS CloudWatch → Log Groups → `/aws/lambda/EnergyInsights-development-renewable-<tool-name>`

**Examples:**
- `/aws/lambda/EnergyInsights-development-renewable-terrain`
- `/aws/lambda/EnergyInsights-development-renewable-layout`

**Log Patterns to Look For:**

```
Tool Lambda: Processing request
```

**What to Check:**
- ✅ Tool received the request
- ✅ Parameters are correct

**Then Look For:**

```
Tool Lambda: Generating artifacts
```

**What to Check:**
- ✅ Artifacts are being generated
- ⏱️ Check generation time

**Finally Look For:**

```
Tool Lambda: Returning results
```

**What to Check:**
- ✅ Results are being returned
- ✅ Results contain artifacts

## Complete Flow Trace Example

Here's what a successful flow looks like:

```
[Browser Console]
🔵 FRONTEND (ChatBox): Sending message
  → Message: "Analyze terrain at 40.7128, -74.0060"
  → Session: session-123
  → Agent: renewable
  → Time: 10:00:00.000

🔵 FRONTEND (chatUtils): sendMessage called
  → Time: 10:00:00.010

🔵 FRONTEND (chatUtils): Calling REST API client
  → Time: 10:00:00.020

[Network Tab]
POST /api/chat
  → Status: 200
  → Time: 10:00:05.500 (5.5s response time)
  → Response: { success: true, artifacts: [1] }

[Browser Console]
🔵 FRONTEND (chatUtils): REST API Response
  → Success: true
  → Artifact Count: 1
  → Time: 10:00:05.510

🔵 FRONTEND: Adding AI message to chat
  → Time: 10:00:05.520

[CloudWatch - Chat Lambda]
🟢 CHAT LAMBDA: Request received
  → Time: 10:00:00.100

🟢 CHAT LAMBDA: User message saved: msg-user-123
  → Time: 10:00:00.200

🟡 AGENT ROUTER: Routing decision: renewable
  → Time: 10:00:00.250

🟠 PROXY AGENT: Invoking orchestrator
  → Time: 10:00:00.300

[CloudWatch - Orchestrator]
🔴 ORCHESTRATOR: Query received
  → Time: 10:00:00.400

🔴 ORCHESTRATOR: Intent detected: terrain_analysis
  → Time: 10:00:00.500

🔴 ORCHESTRATOR: Invoking tool: terrain-tool
  → Time: 10:00:00.600

[CloudWatch - Tool Lambda]
Tool Lambda: Processing request
  → Time: 10:00:00.700

Tool Lambda: Generating artifacts
  → Time: 10:00:02.000

Tool Lambda: Returning results
  → Time: 10:00:04.000

[CloudWatch - Orchestrator]
🔴 ORCHESTRATOR: Tool results received
  → Time: 10:00:04.100

🔴 ORCHESTRATOR: Final artifacts: 1
  → Time: 10:00:04.200

[CloudWatch - Chat Lambda]
🟠 PROXY AGENT: Orchestrator response received
  → Time: 10:00:04.300

🟠 PROXY AGENT: Transformed artifacts: 1
  → Time: 10:00:04.400

🟢 CHAT LAMBDA: Agent response received
  → Time: 10:00:04.500

🟢 CHAT LAMBDA: AI message saved: msg-ai-123
  → Time: 10:00:04.600

[Network Tab]
Response received
  → Time: 10:00:05.500

[Browser Console]
🔵 FRONTEND: Message displayed
  → Time: 10:00:05.520
```

**Total Time:** ~5.5 seconds from send to display

## Identifying Where Flow Breaks

### Break Point 1: Frontend to API
**Symptom:** No network request in Network tab
**Check:** Browser console for errors before API call
**Likely Cause:** JavaScript error in sendMessage function

### Break Point 2: API to Chat Lambda
**Symptom:** Network request fails (4xx/5xx)
**Check:** API Gateway logs, Lambda errors
**Likely Cause:** API Gateway configuration, Lambda timeout

### Break Point 3: Chat Lambda to Agent Router
**Symptom:** No "Routing decision" log
**Check:** Chat Lambda logs for errors
**Likely Cause:** Agent Router initialization failure

### Break Point 4: Agent Router to Proxy Agent
**Symptom:** Routing to wrong agent or no "Invoking orchestrator" log
**Check:** Agent Router logs, Proxy Agent initialization
**Likely Cause:** Agent selection logic, Proxy Agent not initialized

### Break Point 5: Proxy Agent to Orchestrator
**Symptom:** No orchestrator logs
**Check:** Proxy Agent logs for invocation errors
**Likely Cause:** Lambda invocation permission, function name incorrect

### Break Point 6: Orchestrator to Tool Lambda
**Symptom:** No tool invocation logs
**Check:** Orchestrator logs for tool invocation
**Likely Cause:** Tool Lambda name incorrect, IAM permissions

### Break Point 7: Tool Lambda Execution
**Symptom:** Tool logs show errors
**Check:** Tool Lambda logs for execution errors
**Likely Cause:** Tool code error, missing dependencies

### Break Point 8: Orchestrator Artifact Generation
**Symptom:** "Final artifacts: 0"
**Check:** Orchestrator logs for artifact transformation
**Likely Cause:** Artifact transformation logic error

### Break Point 9: Proxy Agent Artifact Transformation
**Symptom:** "Transformed artifacts: 0"
**Check:** Proxy Agent logs for transformation errors
**Likely Cause:** EDI format transformation error

### Break Point 10: Chat Lambda Message Persistence
**Symptom:** No "AI message saved" log
**Check:** Chat Lambda logs for DynamoDB errors
**Likely Cause:** DynamoDB write permission, table not found

### Break Point 11: API Response
**Symptom:** Network response missing artifacts
**Check:** Chat Lambda response structure
**Likely Cause:** Response formatting error

### Break Point 12: Frontend Display
**Symptom:** Response received but not displayed
**Check:** Browser console for React errors
**Likely Cause:** ChatBox state management, ChatMessage rendering

## Using This Guide

1. **Send a test query** through the UI
2. **Note the session ID** from browser console
3. **Follow the flow** through each layer using the log patterns above
4. **Identify where logs stop** or show errors
5. **That's your break point** - focus debugging there

## Quick Commands

```bash
# Tail all relevant logs simultaneously (requires tmux or multiple terminals)

# Terminal 1: Chat Lambda
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# Terminal 2: Orchestrator
aws logs tail /aws/lambda/EnergyInsights-development-renewable-orchestrator --follow

# Terminal 3: Tool Lambda (example: terrain)
aws logs tail /aws/lambda/EnergyInsights-development-renewable-terrain --follow
```

## Next Steps

After tracing the logs:

1. **Document where the flow breaks**
2. **Copy relevant log entries**
3. **Note any error messages**
4. **Report findings** for targeted fix implementation
