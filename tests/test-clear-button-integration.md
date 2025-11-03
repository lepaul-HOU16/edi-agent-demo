# Clear Button Integration Test

## Test Location
`src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`

## Test Objective
Verify that the "Clear Environment (Chunk-Based Wipe)" button properly invokes the chunk-based clear operation and displays appropriate feedback.

## Test Steps

### 1. Visual Verification
- [ ] Navigate to EDIcraft agent landing page
- [ ] Locate "Environment Controls" section
- [ ] Verify button text reads: "Clear Environment (Chunk-Based Wipe)"
- [ ] Verify button has "remove" icon
- [ ] Verify description mentions:
  - "aggressive chunk-based area wipe"
  - "32×32 chunk sections"
  - "ground level to build height"
  - "restores terrain with grass blocks"

### 2. Button Click Test
- [ ] Click "Clear Environment (Chunk-Based Wipe)" button
- [ ] Verify button shows loading spinner
- [ ] Verify button is disabled during operation
- [ ] Wait for operation to complete

### 3. Success Response Test
- [ ] Verify success alert appears
- [ ] Check alert contains chunk statistics:
  - Total chunks processed
  - Successful chunks
  - Failed chunks (if any)
  - Total blocks cleared
  - Ground blocks restored
  - Execution time
- [ ] Verify alert auto-dismisses after 5 seconds
- [ ] Verify button returns to normal state

### 4. Error Response Test
- [ ] Disconnect Minecraft server
- [ ] Click "Clear Environment (Chunk-Based Wipe)" button
- [ ] Verify error alert appears
- [ ] Check error message is descriptive
- [ ] Verify error alert does NOT auto-dismiss
- [ ] Verify user can manually dismiss error alert
- [ ] Verify button returns to normal state

### 5. Console Log Verification
Open browser console and verify:
- [ ] `[CLEAR BUTTON] Button clicked - executing chunk-based area wipe`
- [ ] `[CLEAR BUTTON] Calling EDIcraft agent for chunk-based clear operation`
- [ ] `[CLEAR BUTTON] Clear result: {...}`

### 6. Agent Message Verification
Check that agent receives correct message:
- [ ] Message: "Clear the Minecraft environment using chunk-based area wipe with terrain preservation"
- [ ] Chat session ID starts with: "silent-clear-"
- [ ] Foundation model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
- [ ] User ID: "system"

### 7. Response Format Verification
When operation completes successfully, verify response includes:
- [ ] Status icon (✅ or ⚠️)
- [ ] Title: "Minecraft Environment Cleared" or "Minecraft Environment Partially Cleared"
- [ ] Chunk-Based Area Wipe Summary section
- [ ] Terrain Restoration section
- [ ] Clear Region section
- [ ] Warnings section (if any chunks failed)
- [ ] Tip message at bottom

## Expected Results

### Success Case
```
✅ Success alert appears with message like:
"Environment cleared successfully! 31 chunks processed, 195,000 blocks cleared, 5,120 blocks restored in 45.23 seconds"

Alert auto-dismisses after 5 seconds.
```

### Partial Success Case
```
⚠️ Warning alert appears with message like:
"Environment partially cleared. 28 of 31 chunks successful, 3 failed. 180,000 blocks cleared."

Alert auto-dismisses after 5 seconds.
```

### Error Case
```
❌ Error alert appears with message like:
"Failed to clear environment: Connection to Minecraft server failed"

Alert stays visible until user dismisses.
```

## Integration Points

### Frontend → Backend Flow
1. Button click → `handleClearEnvironment()`
2. Generate Amplify client
3. Call `client.mutations.invokeEDIcraftAgent()`
4. Backend receives message
5. EDIcraft agent parses intent
6. Agent calls `clear_minecraft_environment()` tool
7. Tool executes chunk-based clear
8. Tool returns formatted response
9. Response sent back to frontend
10. Alert displayed to user

### Key Components
- **Button Component:** `EDIcraftAgentLanding.tsx`
- **Agent Mutation:** `invokeEDIcraftAgent` (GraphQL)
- **Agent Handler:** `amplify/functions/edicraftAgent/handler.ts`
- **Clear Tool:** `edicraft-agent/tools/clear_environment_tool.py`
- **Response Template:** `edicraft-agent/tools/response_templates.py`
- **RCON Executor:** `edicraft-agent/tools/rcon_executor.py`

## Troubleshooting

### Button Not Responding
- Check browser console for errors
- Verify Amplify client is initialized
- Check network tab for GraphQL mutation
- Verify authentication is valid

### No Alert Displayed
- Check `result.data.success` value
- Verify `result.data.message` exists
- Check `setClearResult()` is called
- Verify Alert component is rendered

### Operation Times Out
- Check Minecraft server is running
- Verify RCON is enabled
- Check RCON credentials are correct
- Verify network connectivity to server
- Check CloudWatch logs for Lambda timeout

### Wrong Response Format
- Verify agent is calling correct tool
- Check tool is using `_format_clear_response()`
- Verify response template is up to date
- Check for response parsing errors

## Success Criteria

All tests pass:
- ✅ Button displays correct text and description
- ✅ Button shows loading state during operation
- ✅ Success alert displays with chunk statistics
- ✅ Success alert auto-dismisses after 5 seconds
- ✅ Error alert displays and stays visible
- ✅ Console logs show correct messages
- ✅ Agent receives correct message
- ✅ Response format matches template

## Notes

- Button uses "silent mode" - does not create chat message
- Operation is asynchronous - may take 30-60 seconds
- Success messages auto-dismiss to avoid clutter
- Error messages stay visible for user action
- Button is full-width for better visibility
- Description clearly explains chunk-based approach
