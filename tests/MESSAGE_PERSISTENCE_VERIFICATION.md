# Message Persistence Verification Guide

## Overview

This guide helps you verify that messages are being correctly saved to DynamoDB, including checking for user messages, AI messages, artifacts, and duplicate messages.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Access to DynamoDB console or CLI
- Session ID from your test query

## Method 1: AWS Console (Visual)

### Step 1: Open DynamoDB Console

1. Go to AWS Console → DynamoDB
2. Click "Tables" in the left sidebar
3. Find the table named `ChatMessage` or similar (check your CDK stack outputs)

### Step 2: Query by Session ID

1. Click on the table name
2. Click "Explore table items"
3. Click "Query"
4. Select "chatSessionId" as the partition key
5. Enter your session ID
6. Click "Run"

### Step 3: Verify Messages

You should see at least 2 items:

#### User Message:
```json
{
  "id": "msg-user-xxx",
  "chatSessionId": "your-session-id",
  "role": "user",
  "content": {
    "text": "Analyze terrain at 40.7128, -74.0060"
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Check:**
- ✅ role is "user"
- ✅ content.text matches your query
- ✅ createdAt is recent
- ✅ chatSessionId matches

#### AI Message:
```json
{
  "id": "msg-ai-xxx",
  "chatSessionId": "your-session-id",
  "role": "ai",
  "content": {
    "text": "AI response text..."
  },
  "artifacts": [
    {
      "type": "wind_farm_terrain_analysis",
      "messageContentType": "application/vnd.renewable.terrain+json",
      "data": { ... }
    }
  ],
  "responseComplete": true,
  "createdAt": "2024-01-15T10:00:05.000Z",
  "updatedAt": "2024-01-15T10:00:05.000Z"
}
```

**Check:**
- ✅ role is "ai"
- ✅ content.text has response
- ✅ artifacts array exists
- ✅ artifacts array has at least 1 item
- ✅ responseComplete is true
- ✅ createdAt is after user message
- ✅ chatSessionId matches

### Step 4: Check for Duplicates

**Look for:**
- Multiple messages with the same ID
- Multiple user messages with the same text
- Multiple AI messages with the same response

**If duplicates exist:**
- Note the IDs of duplicate messages
- Check the timestamps
- Determine which is the "real" message

## Method 2: AWS CLI (Programmatic)

### Query Messages by Session ID

```bash
# Set your session ID
SESSION_ID="your-session-id-here"

# Set your table name (check CDK outputs)
TABLE_NAME="ChatMessage"

# Query messages
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --output json
```

### Pretty Print Results

```bash
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --output json | jq '.Items'
```

### Count Messages

```bash
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --select COUNT \
  --output json | jq '.Count'
```

**Expected:** At least 2 (1 user + 1 AI)

### Check for User Message

```bash
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --filter-expression "#role = :role" \
  --expression-attribute-names '{"#role":"role"}' \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"user"}}' \
  --output json | jq '.Items'
```

**Expected:** 1 item with role "user"

### Check for AI Message

```bash
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --filter-expression "#role = :role" \
  --expression-attribute-names '{"#role":"role"}' \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"ai"}}' \
  --output json | jq '.Items'
```

**Expected:** 1 item with role "ai"

### Check AI Message Artifacts

```bash
aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --filter-expression "#role = :role" \
  --expression-attribute-names '{"#role":"role"}' \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"ai"}}' \
  --output json | jq '.Items[0].artifacts'
```

**Expected:** Array with at least 1 artifact object

## Method 3: Automated Verification Script

Create a script to automate verification:

```bash
#!/bin/bash

# verify-message-persistence.sh

SESSION_ID=$1
TABLE_NAME=${2:-"ChatMessage"}

if [ -z "$SESSION_ID" ]; then
  echo "Usage: $0 <session-id> [table-name]"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "Verifying Message Persistence"
echo "═══════════════════════════════════════════════════════════"
echo "Session ID: $SESSION_ID"
echo "Table: $TABLE_NAME"
echo ""

# Count total messages
echo "📊 Counting messages..."
TOTAL_COUNT=$(aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --select COUNT \
  --output json | jq '.Count')

echo "Total messages: $TOTAL_COUNT"

if [ "$TOTAL_COUNT" -eq 0 ]; then
  echo "❌ No messages found!"
  exit 1
fi

# Count user messages
echo ""
echo "👤 Checking user messages..."
USER_COUNT=$(aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --filter-expression "#role = :role" \
  --expression-attribute-names '{"#role":"role"}' \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"user"}}' \
  --select COUNT \
  --output json | jq '.Count')

echo "User messages: $USER_COUNT"

if [ "$USER_COUNT" -eq 0 ]; then
  echo "❌ No user message found!"
elif [ "$USER_COUNT" -gt 1 ]; then
  echo "⚠️  Multiple user messages found (possible duplicate)"
else
  echo "✅ User message found"
fi

# Count AI messages
echo ""
echo "🤖 Checking AI messages..."
AI_COUNT=$(aws dynamodb query \
  --table-name "$TABLE_NAME" \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
  --filter-expression "#role = :role" \
  --expression-attribute-names '{"#role":"role"}' \
  --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"ai"}}' \
  --select COUNT \
  --output json | jq '.Count')

echo "AI messages: $AI_COUNT"

if [ "$AI_COUNT" -eq 0 ]; then
  echo "❌ No AI message found!"
elif [ "$AI_COUNT" -gt 1 ]; then
  echo "⚠️  Multiple AI messages found (possible duplicate)"
else
  echo "✅ AI message found"
fi

# Check AI message artifacts
if [ "$AI_COUNT" -gt 0 ]; then
  echo ""
  echo "📊 Checking artifacts..."
  
  ARTIFACTS=$(aws dynamodb query \
    --table-name "$TABLE_NAME" \
    --key-condition-expression "chatSessionId = :sessionId" \
    --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
    --filter-expression "#role = :role" \
    --expression-attribute-names '{"#role":"role"}' \
    --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"ai"}}' \
    --output json | jq '.Items[0].artifacts')
  
  if [ "$ARTIFACTS" == "null" ] || [ "$ARTIFACTS" == "[]" ]; then
    echo "❌ No artifacts found in AI message!"
  else
    ARTIFACT_COUNT=$(echo "$ARTIFACTS" | jq 'length')
    echo "✅ Found $ARTIFACT_COUNT artifact(s)"
    echo ""
    echo "Artifact types:"
    echo "$ARTIFACTS" | jq -r '.[].type'
  fi
fi

# Check responseComplete
if [ "$AI_COUNT" -gt 0 ]; then
  echo ""
  echo "✓ Checking responseComplete..."
  
  RESPONSE_COMPLETE=$(aws dynamodb query \
    --table-name "$TABLE_NAME" \
    --key-condition-expression "chatSessionId = :sessionId" \
    --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"}}' \
    --filter-expression "#role = :role" \
    --expression-attribute-names '{"#role":"role"}' \
    --expression-attribute-values '{":sessionId":{"S":"'$SESSION_ID'"},":role":{"S":"ai"}}' \
    --output json | jq '.Items[0].responseComplete')
  
  if [ "$RESPONSE_COMPLETE" == "true" ]; then
    echo "✅ responseComplete is true"
  else
    echo "❌ responseComplete is false or missing"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Verification Complete"
echo "═══════════════════════════════════════════════════════════"
```

**Usage:**
```bash
chmod +x verify-message-persistence.sh
./verify-message-persistence.sh "your-session-id"
```

## Common Issues and Diagnosis

### Issue 1: No Messages Found

**Symptom:** Query returns 0 items

**Possible Causes:**
1. Wrong session ID
2. Wrong table name
3. Messages not being saved
4. DynamoDB write permission issue

**Check:**
- Verify session ID from browser console logs
- Check CDK stack outputs for correct table name
- Check Chat Lambda logs for "User message saved" and "AI message saved"
- Check IAM permissions for Lambda to write to DynamoDB

### Issue 2: User Message Missing

**Symptom:** Only AI message found, no user message

**Possible Causes:**
1. User message save operation failed
2. User message saved to different session ID
3. Race condition in message saving

**Check:**
- Chat Lambda logs for "User message saved"
- Check for errors in DynamoDB write operation
- Verify session ID consistency

### Issue 3: AI Message Missing

**Symptom:** Only user message found, no AI message

**Possible Causes:**
1. Agent processing failed
2. AI message save operation failed
3. Response not generated

**Possible Causes:**
1. Agent processing failed
2. AI message save operation failed
3. Response not generated

**Check:**
- Chat Lambda logs for "AI message saved"
- Agent Router logs for routing decision
- Proxy Agent logs for orchestrator response
- Check for errors in agent processing

### Issue 4: AI Message Has No Artifacts

**Symptom:** AI message exists but artifacts array is empty or null

**Possible Causes:**
1. Orchestrator didn't generate artifacts
2. Artifacts lost during transformation
3. Artifacts not included in DynamoDB write

**Check:**
- Orchestrator logs for "Final artifacts"
- Proxy Agent logs for "Transformed artifacts"
- Chat Lambda logs for artifact inclusion
- Verify artifact structure in save operation

### Issue 5: Duplicate Messages

**Symptom:** Multiple messages with same content

**Possible Causes:**
1. Multiple API calls from frontend
2. Retry logic creating duplicates
3. Race condition in message creation

**Check:**
- Browser console for multiple API calls
- Network tab for duplicate requests
- Chat Lambda logs for multiple invocations
- Check message IDs and timestamps

### Issue 6: responseComplete is False

**Symptom:** AI message saved but responseComplete is false

**Possible Causes:**
1. Streaming response not completed
2. Error during response generation
3. Logic error in completion flag

**Check:**
- Chat Lambda logs for completion logic
- Check if response was fully generated
- Verify responseComplete is set in save operation

## Verification Checklist

Use this checklist to verify message persistence:

```
□ Total message count ≥ 2
□ User message exists (role: "user")
□ User message has correct text
□ User message has correct session ID
□ User message has createdAt timestamp
□ AI message exists (role: "ai")
□ AI message has response text
□ AI message has artifacts array
□ Artifacts array has ≥ 1 item
□ Each artifact has type field
□ Each artifact has messageContentType field
□ Each artifact has data field
□ AI message has responseComplete: true
□ AI message has correct session ID
□ AI message has createdAt timestamp
□ AI message createdAt > user message createdAt
□ No duplicate messages
□ Message IDs are unique
```

## Next Steps

After verifying message persistence:

1. **If all checks pass:**
   - Messages are being saved correctly
   - Issue is likely in frontend display logic
   - Move to verifying API response format and frontend display

2. **If user message missing:**
   - Check Chat Lambda user message save logic
   - Verify DynamoDB write permissions
   - Check for errors in logs

3. **If AI message missing:**
   - Check agent processing flow
   - Verify orchestrator is being invoked
   - Check AI message save logic

4. **If artifacts missing:**
   - Check orchestrator artifact generation
   - Verify artifact transformation
   - Check artifact inclusion in save operation

5. **If duplicates found:**
   - Check for multiple API calls
   - Review retry logic
   - Implement deduplication if needed
