# Task 14: Manual Testing and Validation - Quick Reference

## Status: IN PROGRESS

## What This Task Does

This task performs comprehensive manual testing and validation of the EDIcraft agent integration to ensure it works end-to-end from deployment to user experience.

## Quick Start

### 1. Configure Credentials (Required)

Run the interactive setup script:

```bash
./tests/manual/setup-edicraft-credentials.sh
```

Or manually edit `.env.local` and add:

```bash
# Bedrock AgentCore
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
BEDROCK_REGION=us-east-1

# Minecraft Server
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=49000
MINECRAFT_RCON_PORT=49001
MINECRAFT_RCON_PASSWORD=your_rcon_password

# OSDU Platform
EDI_USERNAME=your_username
EDI_PASSWORD=your_password
EDI_CLIENT_ID=your_client_id
EDI_CLIENT_SECRET=your_client_secret
EDI_PARTITION=opendes
EDI_PLATFORM_URL=https://edi.aws.amazon.com
```

### 2. Deploy Bedrock AgentCore Agent (If Not Done)

```bash
cd edicraft-agent
make install
make deploy
# Save the Agent ID and Alias ID from output
```

### 3. Restart Amplify Sandbox

```bash
# Stop current sandbox (Ctrl+C)
npx ampx sandbox
# Wait for "Deployed" message
```

### 4. Run Automated Tests

```bash
node tests/manual/test-edicraft-deployment.js
```

### 5. Manual Testing in Web UI

Open the web application and test these queries:

1. **Basic Routing Test:**
   ```
   Show me wellbore data in minecraft
   ```

2. **Wellbore Visualization:**
   ```
   Get wellbore data from well001 and visualize it in minecraft
   ```

3. **Horizon Surface:**
   ```
   Render the horizon surface in minecraft
   ```

4. **Priority Test (well log + minecraft):**
   ```
   Show me well log data in minecraft
   ```

## Test Coverage

### ✅ Automated Tests

- [x] Deployment verification
- [x] Environment variable validation
- [x] Agent routing patterns
- [x] Agent execution flow
- [x] Error handling categories
- [x] Thought step structure

### 🧪 Manual Tests Required

- [ ] Agent routing in web UI
- [ ] Wellbore visualization request
- [ ] Horizon surface rendering
- [ ] Player position tracking
- [ ] Error handling with invalid credentials
- [ ] Thought steps display in chat
- [ ] Minecraft server visualization verification

## Expected Results

### Successful Deployment

```
✅ EDIcraft agent Lambda function found
✅ All environment variables configured
✅ Agent execution completes successfully
✅ Thought steps present in response
```

### Successful Routing

- Minecraft queries route to EDIcraft agent
- Agent switcher shows "EDIcraft" selected
- No confusion with other agents (petrophysics, renewable)

### Successful Execution

- Loading indicator appears
- Thought steps display showing:
  - "Connecting to OSDU platform..."
  - "Retrieving wellbore data..."
  - "Transforming coordinates..."
  - "Building in Minecraft..."
- Success message with Minecraft coordinates
- No artifacts in web UI (visualization is in Minecraft)

### Successful Error Handling

- Missing config: Clear error with list of missing variables
- Connection errors: User-friendly message with troubleshooting steps
- Auth failures: Helpful guidance on credential verification
- Agent not deployed: Link to deployment guide

## Troubleshooting

### Issue: Environment Variables Not Set

**Symptom:** Test shows "NOT CONFIGURED" for variables

**Solution:**
1. Edit `.env.local` with actual values
2. Restart sandbox: `npx ampx sandbox`
3. Wait for deployment to complete
4. Re-run tests

### Issue: Agent Not Deployed

**Symptom:** "Agent not deployed" error

**Solution:**
1. Follow `edicraft-agent/DEPLOYMENT_GUIDE.md`
2. Run `cd edicraft-agent && make deploy`
3. Copy Agent ID and Alias ID to `.env.local`
4. Restart sandbox

### Issue: Minecraft Connection Failed

**Symptom:** "Connection refused" error

**Solution:**
1. Verify server is running: `telnet edicraft.nigelgardiner.com 49000`
2. Check RCON password is correct
3. Verify firewall allows connection from Lambda

### Issue: OSDU Authentication Failed

**Symptom:** "Authentication failed" error

**Solution:**
1. Verify credentials in `.env.local`
2. Check platform URL is correct
3. Try generating new OAuth credentials
4. Confirm user has necessary permissions

## Files Created/Modified

### Test Files
- `tests/manual/test-edicraft-deployment.js` - Automated deployment test
- `tests/manual/setup-edicraft-credentials.sh` - Interactive credential setup
- `tests/manual/EDICRAFT_VALIDATION_GUIDE.md` - Comprehensive validation guide
- `tests/manual/TASK_14_QUICK_REFERENCE.md` - This file

### Configuration
- `.env.local` - Environment variables (user must configure)

## Validation Checklist

Use this checklist to track validation progress:

### Deployment
- [ ] Lambda function deployed
- [ ] Environment variables configured
- [ ] IAM permissions granted
- [ ] Bedrock AgentCore agent deployed

### Routing
- [ ] Minecraft queries route correctly
- [ ] Priority handling works (well log + minecraft)
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

### User Experience
- [ ] Queries are intuitive
- [ ] Responses are clear
- [ ] Errors are helpful
- [ ] Workflow is smooth

## Next Steps

After validation is complete:

1. **If all tests pass:**
   - Mark task as complete
   - Document any findings
   - Proceed to Task 15 (Documentation)

2. **If tests fail:**
   - Review CloudWatch logs
   - Check troubleshooting section
   - Fix issues and re-test
   - Do not proceed until all tests pass

## Resources

- **Deployment Guide:** `edicraft-agent/DEPLOYMENT_GUIDE.md`
- **Credential Guide:** `edicraft-agent/FIND_CREDENTIALS.md`
- **Validation Guide:** `tests/manual/EDICRAFT_VALIDATION_GUIDE.md`
- **Requirements:** `.kiro/specs/fix-edicraft-agent-integration/requirements.md`
- **Design:** `.kiro/specs/fix-edicraft-agent-integration/design.md`

## CloudWatch Logs

To view Lambda logs:

```bash
# Get function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text)

# View recent logs
aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow
```

## Performance Targets

- **Cold Start:** < 30 seconds
- **Warm Response:** < 10 seconds
- **OSDU Data Retrieval:** < 5 seconds
- **Minecraft Build:** < 3 seconds
- **Total End-to-End:** < 15 seconds (warm)

## Success Criteria

Task 14 is complete when:

✅ All automated tests pass
✅ Minecraft queries route correctly
✅ Agent execution completes successfully
✅ Thought steps display in chat interface
✅ Error handling provides helpful messages
✅ Minecraft visualizations appear correctly
✅ OSDU data integration works
✅ User validates the fix works end-to-end

## User Validation Required

**This task requires user validation before marking complete.**

The user must:
1. Run automated tests
2. Test in web UI with Minecraft queries
3. Verify thought steps display
4. Check Minecraft server for visualizations
5. Confirm the integration works end-to-end

**Do not mark this task complete until user confirms validation.**
