# EDIcraft Agent Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when deploying and using the EDIcraft agent integration.

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Configuration Issues](#configuration-issues)
3. [Connection Issues](#connection-issues)
4. [Authentication Issues](#authentication-issues)
5. [Execution Issues](#execution-issues)
6. [Performance Issues](#performance-issues)
7. [Integration Issues](#integration-issues)
8. [Demo Enhancement Issues](#demo-enhancement-issues)

---

## Deployment Issues

### Issue: Lambda Function Not Found

**Symptoms:**
- "EDIcraft agent not found" error
- Agent routing fails
- Function not listed in AWS Lambda console

**Possible Causes:**
- Lambda not deployed
- Backend configuration missing
- Deployment failed

**Solutions:**

1. **Verify Lambda is deployed:**
   ```bash
   aws lambda list-functions | grep edicraft
   ```

2. **Check backend.ts includes edicraftAgentFunction:**
   ```typescript
   // amplify/backend.ts should include:
   const backend = defineBackend({
     // ...
     edicraftAgentFunction,
   });
   ```

3. **Redeploy Amplify backend:**
   ```bash
   npx ampx sandbox
   ```
   Wait for "Deployed" message (~5-10 minutes)

4. **Check CloudWatch logs for deployment errors:**
   ```bash
   aws logs tail "/aws/amplify/sandbox" --follow
   ```

### Issue: Bedrock AgentCore Agent Not Deployed

**Symptoms:**
- "Agent not deployed" error message
- Agent invocation fails with "ResourceNotFoundException"
- BEDROCK_AGENT_ID environment variable is empty or invalid

**Possible Causes:**
- Agent not deployed to AWS Bedrock
- Deployment failed
- Wrong AWS region

**Solutions:**

1. **Deploy the Bedrock AgentCore agent:**
   ```bash
   cd edicraft-agent
   make install
   make deploy
   ```

2. **Save the Agent ID and Alias ID from deployment output:**
   ```
   Agent deployed successfully!
   Agent ID: ABCD1234EFGH
   Agent Alias ID: TSTALIASID
   ```

3. **Update .env.local with the IDs:**
   ```bash
   BEDROCK_AGENT_ID=ABCD1234EFGH
   BEDROCK_AGENT_ALIAS_ID=TSTALIASID
   ```

4. **Restart Amplify sandbox to apply changes:**
   ```bash
   # Stop current sandbox (Ctrl+C)
   npx ampx sandbox
   ```

5. **Verify agent exists in AWS:**
   ```bash
   aws bedrock-agent list-agents --region us-east-1
   ```

**See Also:** `edicraft-agent/DEPLOYMENT_GUIDE.md`

### Issue: IAM Permission Denied

**Symptoms:**
- "AccessDeniedException" in CloudWatch logs
- "User is not authorized to perform: bedrock:InvokeAgent"
- Lambda cannot invoke Bedrock agent

**Possible Causes:**
- Lambda execution role lacks permissions
- IAM policy not attached
- Wrong resource ARN

**Solutions:**

1. **Verify IAM permissions in backend.ts:**
   ```typescript
   // amplify/backend.ts should include:
   backend.edicraftAgentFunction.resources.lambda.addToRolePolicy(
     new iam.PolicyStatement({
       actions: ['bedrock:InvokeAgent'],
       resources: ['*'], // Or specific agent ARN
     })
   );
   ```

2. **Check Lambda execution role in AWS Console:**
   - Go to Lambda → Functions → edicraftAgent
   - Click Configuration → Permissions
   - Verify "bedrock:InvokeAgent" permission exists

3. **Manually add permission if needed:**
   ```bash
   aws iam attach-role-policy \
     --role-name <lambda-execution-role> \
     --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
   ```

4. **Redeploy to apply IAM changes:**
   ```bash
   npx ampx sandbox
   ```

---

## Configuration Issues

### Issue: Environment Variables Not Set

**Symptoms:**
- "Missing environment variable" error
- Configuration validation fails
- Agent returns configuration error

**Possible Causes:**
- .env.local not configured
- Sandbox not restarted after configuration
- Variables not passed to Lambda

**Solutions:**

1. **Check .env.local exists and has all required variables:**
   ```bash
   cat .env.local | grep -E "BEDROCK_AGENT_ID|MINECRAFT|EDI_"
   ```

2. **Use the interactive setup script:**
   ```bash
   ./tests/manual/setup-edicraft-credentials.sh
   ```

3. **Or manually edit .env.local:**
   ```bash
   # Required variables:
   BEDROCK_AGENT_ID=your_agent_id
   BEDROCK_AGENT_ALIAS_ID=TSTALIASID
   BEDROCK_REGION=us-east-1
   
   MINECRAFT_HOST=edicraft.nigelgardiner.com
   MINECRAFT_PORT=49000
   MINECRAFT_RCON_PORT=49001
   MINECRAFT_RCON_PASSWORD=your_password
   
   EDI_USERNAME=your_username
   EDI_PASSWORD=your_password
   EDI_CLIENT_ID=your_client_id
   EDI_CLIENT_SECRET=your_client_secret
   EDI_PARTITION=opendes
   EDI_PLATFORM_URL=https://edi.aws.amazon.com
   ```

4. **Restart sandbox to apply changes:**
   ```bash
   # Stop current sandbox (Ctrl+C)
   npx ampx sandbox
   ```

5. **Verify variables are set in Lambda:**
   ```bash
   FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text)
   aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables"
   ```

**See Also:** `edicraft-agent/FIND_CREDENTIALS.md`

### Issue: Invalid Agent ID Format

**Symptoms:**
- "Invalid agent ID" error
- Agent invocation fails with validation error
- BEDROCK_AGENT_ID looks incorrect

**Possible Causes:**
- Typo in agent ID
- Wrong format (should be alphanumeric)
- Copied extra characters

**Solutions:**

1. **Verify agent ID format:**
   - Should be alphanumeric (e.g., "ABCD1234EFGH")
   - No spaces, quotes, or special characters
   - Typically 10-20 characters

2. **Get correct agent ID from AWS:**
   ```bash
   aws bedrock-agent list-agents --region us-east-1 --query "agentSummaries[?agentName=='edicraft'].agentId" --output text
   ```

3. **Update .env.local with correct ID:**
   ```bash
   BEDROCK_AGENT_ID=<correct-id-from-above>
   ```

4. **Restart sandbox:**
   ```bash
   npx ampx sandbox
   ```

---

## Connection Issues

### Issue: Minecraft Server Connection Refused

**Symptoms:**
- "Connection refused" error
- "ECONNREFUSED" in CloudWatch logs
- Cannot connect to Minecraft server

**Possible Causes:**
- Minecraft server is down
- Wrong host or port
- Firewall blocking connection
- RCON not enabled

**Solutions:**

1. **Verify server is running:**
   ```bash
   telnet edicraft.nigelgardiner.com 49000
   ```
   Should connect successfully. Press Ctrl+] then type "quit" to exit.

2. **Check RCON port separately:**
   ```bash
   telnet edicraft.nigelgardiner.com 49001
   ```

3. **Verify RCON is enabled on server:**
   - SSH into Minecraft server
   - Check `server.properties`:
     ```bash
     cat server.properties | grep rcon
     ```
   - Should show:
     ```
     enable-rcon=true
     rcon.port=49001
     rcon.password=<password>
     ```

4. **Check firewall rules:**
   - Ensure ports 49000 and 49001 are open
   - Check AWS Security Groups if server is on AWS
   - Check server firewall (iptables, ufw, etc.)

5. **Test from Lambda's network:**
   - Lambda may be in VPC with different network access
   - Verify Lambda can reach external hosts
   - Check VPC security groups and NACLs

6. **Verify environment variables:**
   ```bash
   # Should match server configuration
   MINECRAFT_HOST=edicraft.nigelgardiner.com
   MINECRAFT_PORT=49000
   MINECRAFT_RCON_PORT=49001
   ```

### Issue: Minecraft Server Timeout

**Symptoms:**
- "Connection timeout" error
- Request hangs for 30+ seconds
- "ETIMEDOUT" in CloudWatch logs

**Possible Causes:**
- Network latency
- Server overloaded
- Firewall dropping packets
- Lambda timeout too short

**Solutions:**

1. **Increase Lambda timeout:**
   ```typescript
   // amplify/functions/edicraftAgent/resource.ts
   export const edicraftAgentFunction = defineFunction({
     timeoutSeconds: 300, // Increase if needed
   });
   ```

2. **Check server load:**
   - SSH into Minecraft server
   - Run `top` or `htop` to check CPU/memory
   - Check Minecraft server logs for errors

3. **Test network latency:**
   ```bash
   ping edicraft.nigelgardiner.com
   ```
   Should have reasonable latency (<100ms)

4. **Check for packet loss:**
   ```bash
   mtr edicraft.nigelgardiner.com
   ```

5. **Verify firewall isn't rate-limiting:**
   - Check server firewall logs
   - Temporarily disable firewall to test (not recommended for production)

---

## Authentication Issues

### Issue: OSDU Authentication Failed

**Symptoms:**
- "Authentication failed" error
- 401 Unauthorized response
- "Invalid credentials" message

**Possible Causes:**
- Wrong username or password
- Expired credentials
- Wrong OAuth client ID/secret
- Wrong platform URL

**Solutions:**

1. **Verify credentials in .env.local:**
   ```bash
   cat .env.local | grep EDI_
   ```

2. **Test credentials manually:**
   ```bash
   curl -X POST https://edi.aws.amazon.com/auth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password" \
     -d "username=$EDI_USERNAME" \
     -d "password=$EDI_PASSWORD" \
     -d "client_id=$EDI_CLIENT_ID" \
     -d "client_secret=$EDI_CLIENT_SECRET"
   ```
   Should return an access token.

3. **Generate new OAuth credentials:**
   - Log into OSDU platform web interface
   - Go to Developer Settings or API Credentials
   - Create new OAuth application
   - Update .env.local with new credentials

4. **Verify platform URL is correct:**
   ```bash
   # Should be accessible
   curl -I https://edi.aws.amazon.com
   ```

5. **Check user permissions:**
   - Ensure user has necessary OSDU permissions
   - Contact OSDU administrator if needed

6. **Restart sandbox after updating credentials:**
   ```bash
   npx ampx sandbox
   ```

**See Also:** `edicraft-agent/FIND_CREDENTIALS.md`

### Issue: RCON Password Incorrect

**Symptoms:**
- "Authentication failed" for Minecraft
- "Invalid password" error
- RCON commands fail

**Possible Causes:**
- Wrong RCON password
- Password changed on server
- Special characters not escaped

**Solutions:**

1. **Verify RCON password on server:**
   ```bash
   # SSH into Minecraft server
   cat server.properties | grep rcon.password
   ```

2. **Test RCON connection manually:**
   ```bash
   # Install mcrcon: brew install mcrcon (Mac) or apt-get install mcrcon (Linux)
   mcrcon -H edicraft.nigelgardiner.com -P 49001 -p <password> "list"
   ```
   Should list online players.

3. **Update .env.local with correct password:**
   ```bash
   MINECRAFT_RCON_PASSWORD=correct_password_here
   ```

4. **Handle special characters:**
   - If password has special characters, ensure they're properly escaped
   - Consider using a simpler password for testing

5. **Restart sandbox:**
   ```bash
   npx ampx sandbox
   ```

---

## Execution Issues

### Issue: Agent Returns Empty Response

**Symptoms:**
- Agent completes but returns no message
- Empty thought steps
- Success: true but no content

**Possible Causes:**
- Response parsing failed
- Bedrock agent returned empty response
- Streaming not handled correctly

**Solutions:**

1. **Check CloudWatch logs for raw response:**
   ```bash
   FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text)
   aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow
   ```

2. **Verify Bedrock agent is working:**
   ```bash
   cd edicraft-agent
   make invoke "test query"
   ```
   Should return a response.

3. **Check response parsing in mcpClient.ts:**
   - Verify streaming is handled correctly
   - Check for errors in chunk processing
   - Ensure text extraction works

4. **Test with simple query:**
   ```
   Show me the configuration
   ```
   Should return agent configuration.

5. **Check for timeout issues:**
   - Increase Lambda timeout if needed
   - Check if agent is taking too long

### Issue: Thought Steps Not Displaying

**Symptoms:**
- No thought steps in chat interface
- Empty thoughtSteps array
- Only final message shows

**Possible Causes:**
- Trace not enabled in Bedrock agent
- Trace parsing failed
- Frontend not rendering thought steps

**Solutions:**

1. **Verify trace is enabled in agent deployment:**
   ```bash
   aws bedrock-agent get-agent --agent-id $BEDROCK_AGENT_ID --query "agent.enableTrace"
   ```
   Should return `true`.

2. **Check trace parsing in mcpClient.ts:**
   - Verify `extractThoughtSteps()` function works
   - Check for errors in trace processing
   - Log raw trace data for debugging

3. **Test thought step structure:**
   ```bash
   node tests/unit/test-edicraft-mcp-client.test.ts
   ```

4. **Verify frontend renders thought steps:**
   - Check browser console for errors
   - Verify ChatMessage component handles thought steps
   - Check CSS isn't hiding thought steps

5. **Enable debug logging:**
   ```typescript
   // In mcpClient.ts
   console.log('Raw trace:', JSON.stringify(trace, null, 2));
   console.log('Extracted thought steps:', thoughtSteps);
   ```

### Issue: Agent Invocation Fails

**Symptoms:**
- "Agent invocation failed" error
- 500 Internal Server Error
- Lambda execution fails

**Possible Causes:**
- Bedrock agent error
- Network issue
- Timeout
- Invalid request

**Solutions:**

1. **Check CloudWatch logs for detailed error:**
   ```bash
   aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow
   ```

2. **Verify agent is in PREPARED state:**
   ```bash
   aws bedrock-agent get-agent --agent-id $BEDROCK_AGENT_ID --query "agent.agentStatus"
   ```
   Should return "PREPARED".

3. **Test agent directly:**
   ```bash
   cd edicraft-agent
   make invoke "test query"
   ```

4. **Check for rate limiting:**
   - Bedrock may have rate limits
   - Wait a few minutes and retry
   - Check AWS Service Quotas

5. **Verify request format:**
   - Check InvokeAgentCommand parameters
   - Ensure sessionId is valid
   - Verify inputText is not empty

---

## Performance Issues

### Issue: Slow Response Time

**Symptoms:**
- Requests take >30 seconds
- User sees long loading times
- Timeout warnings

**Possible Causes:**
- Cold start
- Network latency
- OSDU platform slow
- Minecraft server slow
- Complex query

**Solutions:**

1. **Optimize Lambda configuration:**
   ```typescript
   // Increase memory (also increases CPU)
   export const edicraftAgentFunction = defineFunction({
     memoryMB: 1024, // Increase if needed
   });
   ```

2. **Use provisioned concurrency for production:**
   ```bash
   aws lambda put-provisioned-concurrency-config \
     --function-name $FUNCTION_NAME \
     --provisioned-concurrent-executions 1
   ```

3. **Monitor cold start times:**
   - Check CloudWatch logs for "Init Duration"
   - Consider using Lambda SnapStart (Java only)
   - Keep Lambda warm with scheduled invocations

4. **Optimize OSDU queries:**
   - Cache frequently accessed data
   - Use more specific queries
   - Reduce data transfer

5. **Monitor Minecraft server performance:**
   - Check server TPS (ticks per second)
   - Reduce server load if needed
   - Optimize RCON commands

### Issue: High Lambda Costs

**Symptoms:**
- Unexpected AWS bills
- High Lambda invocation count
- Long execution times

**Possible Causes:**
- Inefficient code
- Too many retries
- Memory over-provisioned
- Not using caching

**Solutions:**

1. **Optimize memory allocation:**
   - Start with 512 MB
   - Monitor actual usage in CloudWatch
   - Adjust based on metrics

2. **Implement caching:**
   - Cache OSDU data in DynamoDB
   - Cache coordinate transformations
   - Use Lambda layers for dependencies

3. **Reduce retry attempts:**
   - Limit to 3 retries maximum
   - Use exponential backoff
   - Fail fast on permanent errors

4. **Monitor and alert:**
   - Set up CloudWatch alarms for costs
   - Track invocation count
   - Monitor execution duration

---

## Integration Issues

### Issue: Agent Routing Incorrect

**Symptoms:**
- Minecraft queries go to wrong agent
- Horizon queries route to petrophysics agent
- EDIcraft agent not selected
- Routing conflicts

**Possible Causes:**
- Pattern matching too broad/narrow
- Priority not configured
- Agent router logic error
- Query structure doesn't match existing patterns

**Solutions:**

1. **Check comprehensive routing documentation:**
   - **[Horizon Routing Patterns](EDICRAFT_HORIZON_ROUTING_PATTERNS.md)** - Full pattern documentation
   - **[Routing Troubleshooting Quick Reference](EDICRAFT_ROUTING_TROUBLESHOOTING_QUICK_REFERENCE.md)** - Quick fixes

2. **Test routing patterns:**
   ```bash
   node tests/unit/test-agent-router-edicraft.test.ts
   node tests/unit/test-agent-router-horizon.test.ts
   ```

3. **Test specific query:**
   ```bash
   node tests/test-edicraft-routing.js "your query here"
   ```

4. **Check CloudWatch logs for pattern matching:**
   ```bash
   aws logs tail /aws/lambda/<router-function> --follow
   ```
   
   Look for:
   ```
   🎮 AgentRouter: Testing EDIcraft patterns...
     ✅ EDIcraft pattern MATCHED: [pattern]
   🎮 AgentRouter: EDIcraft agent selected
   ```

5. **Test horizon-specific queries:**
   ```bash
   ./tests/manual/test-edicraft-horizon-query.sh
   ```

6. **Verify pattern matching in agentRouter.ts:**
   - Verify EDIcraft patterns are defined (35+ patterns)
   - Check priority handling (EDIcraft should be FIRST)
   - Ensure no conflicts with other agents

7. **Test specific queries:**
   ```
   find a horizon
   tell me the horizon name
   convert to minecraft coordinates
   show me wellbore data in minecraft
   ```
   All should route to EDIcraft.

8. **If query not matching any pattern:**
   - See [Adding New Patterns](EDICRAFT_HORIZON_ROUTING_PATTERNS.md#adding-new-patterns)
   - Add pattern to edicraftPatterns array
   - Test and deploy

9. **Verify agent switcher works:**
   - Manually select EDIcraft agent
   - Verify it stays selected
   - Check session context

### Issue: Chat Interface Not Updating

**Symptoms:**
- Response doesn't appear
- Loading indicator stuck
- Page needs refresh

**Possible Causes:**
- State management issue
- WebSocket connection lost
- React rendering error

**Solutions:**

1. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for React errors
   - Check for network errors

2. **Verify API response:**
   - Check Network tab in DevTools
   - Verify response is received
   - Check response format

3. **Test state updates:**
   - Add console.log in ChatMessage component
   - Verify state changes trigger re-render
   - Check for stale closures

4. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Try incognito mode

5. **Restart development server:**
   ```bash
   npm run dev
   ```

---

## Demo Enhancement Issues

### Issue: Clear Button Not Visible

**Symptoms:**
- Clear button doesn't appear in chat interface
- Button is hidden or not rendered
- Only visible when EDIcraft agent is active

**Possible Causes:**
- Wrong agent selected
- Component not loaded
- CSS hiding button
- React rendering issue

**Solutions:**

1. **Verify EDIcraft agent is selected:**
   - Check agent switcher shows "EDIcraft"
   - Try manually selecting EDIcraft agent
   - Refresh page and reselect agent

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for React component errors
   - Check for CSS loading issues

3. **Verify component is loaded:**
   ```javascript
   // In browser console
   document.querySelector('[data-testid="edicraft-controls"]')
   ```
   Should return the controls element.

4. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Try incognito mode

5. **Check component visibility:**
   - Inspect element in DevTools
   - Verify CSS display property
   - Check for z-index issues

### Issue: Clear Button Not Working

**Symptoms:**
- Button clicks don't trigger clear operation
- No response in chat
- Loading state doesn't appear
- Environment not cleared

**Possible Causes:**
- Event handler not attached
- API call failing
- RCON connection issue
- Permission denied

**Solutions:**

1. **Check browser console for errors:**
   - Look for JavaScript errors
   - Check network tab for failed requests
   - Verify API endpoint is correct

2. **Use text command instead:**
   ```
   "Clear the Minecraft environment"
   ```
   If text command works, issue is with button component.

3. **Verify RCON connection:**
   ```bash
   telnet edicraft.nigelgardiner.com 49001
   ```

4. **Check Lambda logs:**
   ```bash
   aws logs tail "/aws/lambda/edicraftAgent" --follow
   ```

5. **Test clear operation directly:**
   ```bash
   node tests/integration/test-edicraft-clear-environment.test.py
   ```

### Issue: Clear Operation Incomplete

**Symptoms:**
- Some structures remain after clear
- Partial clearing
- Response shows fewer blocks cleared than expected
- Terrain accidentally cleared

**Possible Causes:**
- RCON timeout
- Server lag
- Wrong block types specified
- Terrain preservation disabled

**Solutions:**

1. **Check clear response for details:**
   - Look at blocks cleared count
   - Verify terrain preservation status
   - Check for error messages

2. **Run clear operation again:**
   ```
   "Clear the Minecraft environment"
   ```
   May clear remaining structures.

3. **Use selective clearing:**
   ```
   "Clear wellbores"
   "Clear rigs"
   "Clear markers"
   ```

4. **Verify terrain preservation:**
   - Check `preserve_terrain` parameter is True
   - Verify terrain blocks are in preservation list

5. **Check Minecraft server performance:**
   - Server may be lagging
   - Reduce clear area size
   - Wait and retry

### Issue: Time Lock Not Working

**Symptoms:**
- Time continues to change after lock command
- Daylight cycle not disabled
- Night falls during demo
- Time lock response shows success but time changes

**Possible Causes:**
- RCON command failed
- Insufficient permissions
- Server override
- Gamerule not applied

**Solutions:**

1. **Verify time lock response:**
   ```
   ✅ World Time Locked
   Settings:
   - Current Time: Day
   - Daylight Cycle: Disabled
   ```

2. **Check time in Minecraft:**
   ```
   /time query daytime
   /gamerule doDaylightCycle
   ```

3. **Manually lock time:**
   ```
   /time set 6000
   /gamerule doDaylightCycle false
   ```

4. **Verify RCON permissions:**
   - Check server operator status
   - Verify RCON user has gamerule permissions

5. **Check server logs:**
   - Look for gamerule command execution
   - Check for permission errors

### Issue: Invalid Time Value

**Symptoms:**
- "Invalid time value" error
- Time lock fails
- Unrecognized time string

**Possible Causes:**
- Typo in time value
- Unsupported time value
- Wrong format

**Solutions:**

1. **Use supported time values:**
   - day, morning (1000)
   - noon, midday (6000)
   - afternoon (9000)
   - sunset, dusk (12000)
   - night (13000)
   - midnight (18000)

2. **Check spelling:**
   - Use lowercase
   - No extra spaces
   - Exact match required

3. **Try alternative time value:**
   ```
   "Lock time to day"  # Instead of "daytime"
   "Lock time to noon"  # Instead of "midday"
   ```

### Issue: Collection Visualization Fails

**Symptoms:**
- "Collection not found" error
- "No wells in collection" warning
- S3 access denied
- All wells fail to build

**Possible Causes:**
- Wrong collection ID
- S3 permissions missing
- Collection empty
- S3 bucket not accessible

**Solutions:**

1. **Verify collection ID:**
   ```bash
   aws s3 ls s3://bucket-name/collections/
   ```

2. **Check S3 permissions:**
   ```bash
   aws s3 ls s3://bucket-name/collections/collection-id/
   ```

3. **Verify collection structure:**
   ```bash
   aws s3 ls s3://bucket-name/collections/collection-id/ --recursive
   ```
   Should show trajectory files.

4. **Check IAM permissions:**
   - s3:ListBucket
   - s3:GetObject
   - Verify bucket name in policy

5. **Test with single well:**
   ```
   "Build wellbore WELL-001"
   ```
   If single well works, issue is with collection processing.

### Issue: Collection Visualization Slow

**Symptoms:**
- Takes longer than expected
- Progress updates slow
- Timeouts occur
- Some wells fail

**Possible Causes:**
- Large collection size
- Server performance
- Network latency
- S3 throttling

**Solutions:**

1. **Reduce batch size:**
   ```python
   visualize_collection_wells(
       collection_id="collection-123",
       batch_size=3  # Smaller batches
   )
   ```

2. **Increase spacing:**
   ```python
   visualize_collection_wells(
       collection_id="collection-123",
       spacing=75  # More space between wells
   )
   ```

3. **Check server performance:**
   - Monitor server TPS
   - Check CPU/memory usage
   - Reduce server load

4. **Verify S3 performance:**
   - Check S3 request metrics
   - Look for throttling
   - Consider S3 caching

5. **Process in smaller batches:**
   - Visualize subset of wells
   - Process multiple times
   - Combine results

### Issue: Drilling Rigs Not Appearing

**Symptoms:**
- Wellbores built but no rigs
- Rig build fails silently
- Only wellbore trajectory visible
- Signs missing

**Possible Causes:**
- Rig build disabled
- RCON timeout
- Insufficient space
- Block placement failed

**Solutions:**

1. **Check wellbore response:**
   - Should mention "Drilling Rig: Standard style"
   - Look for rig build confirmation

2. **Verify rig location:**
   - Rigs are at wellhead (surface level)
   - Check coordinates from response
   - Teleport to wellhead: `/tp @s X 100 Z`

3. **Check for space conflicts:**
   - Rigs need 5×5 area
   - Check for overlapping structures
   - Increase spacing if needed

4. **Rebuild with rig:**
   ```
   "Build wellbore WELL-007 with drilling rig"
   ```

5. **Check RCON logs:**
   - Look for block placement errors
   - Check for timeout messages

### Issue: Well Names Not Simplified

**Symptoms:**
- Full OSDU IDs shown instead of short names
- Signs show long IDs
- Response uses full IDs
- Difficult to read

**Possible Causes:**
- Name simplifier not working
- OSDU ID format not recognized
- Simplification disabled

**Solutions:**

1. **Check OSDU ID format:**
   - Should match pattern: `osdu:*:WELL-XXX:*`
   - Verify ID structure

2. **Test name simplifier:**
   ```python
   from tools.name_utils import WellNameSimplifier
   simplifier = WellNameSimplifier()
   short_name = simplifier.simplify_name("osdu:work-product--Wellbore:WELL-007:...")
   print(short_name)  # Should print "WELL-007"
   ```

3. **Check for errors in logs:**
   - Look for name simplification errors
   - Verify simplifier is called

4. **Use custom short names:**
   ```python
   simplifier.register_well(
       osdu_id="full-osdu-id",
       short_name="WELL-007"
   )
   ```

### Issue: Demo Reset Requires Confirmation

**Symptoms:**
- Reset command shows warning
- Reset doesn't execute
- Asks for confirmation

**Possible Causes:**
- Safety feature working as designed
- Confirmation not provided
- Wrong command format

**Solutions:**

1. **This is expected behavior:**
   - Demo reset requires confirmation to prevent accidents
   - This is a safety feature, not a bug

2. **Confirm the reset:**
   - Respond "yes" when prompted
   - Or use direct tool call with confirm=True

3. **Use clear instead if appropriate:**
   ```
   "Clear the Minecraft environment"
   ```
   Clear doesn't require confirmation.

### Issue: Collection Context Not Retained

**Symptoms:**
- New canvas doesn't have collection context
- Collection badge missing
- Need to reload collection
- Context lost

**Possible Causes:**
- Created canvas without "Create New Chat" button
- Session context not passed
- Collection ID not inherited
- Frontend routing issue

**Solutions:**

1. **Use "Create New Chat" button:**
   - Don't use browser back button
   - Don't manually navigate to create-new-chat
   - Use the button in chat interface

2. **Verify collection badge in original canvas:**
   - Badge should be visible
   - Shows collection name and count
   - If missing, collection context wasn't loaded

3. **Check URL parameters:**
   - Should include `fromSession` parameter
   - Verify session ID is correct

4. **Manually load collection:**
   - If context lost, reload collection
   - Create new canvas from collection page

5. **Check browser console:**
   - Look for context loading errors
   - Verify API calls succeed

### Issue: Progress Updates Not Showing

**Symptoms:**
- No progress updates during collection visualization
- Only see final response
- Can't track progress
- Appears stuck

**Possible Causes:**
- Streaming not working
- Frontend not rendering updates
- WebSocket issue
- Batch size too large

**Solutions:**

1. **Check browser console:**
   - Look for streaming errors
   - Verify WebSocket connection
   - Check for rendering errors

2. **Verify batch processing:**
   - Progress updates sent per batch
   - Default batch size is 5
   - Larger batches = fewer updates

3. **Check network tab:**
   - Verify progress messages received
   - Look for dropped connections

4. **Reduce batch size:**
   ```python
   visualize_collection_wells(
       collection_id="collection-123",
       batch_size=3  # More frequent updates
   )
   ```

5. **Check Lambda logs:**
   - Verify progress updates are sent
   - Look for streaming errors

---

## Diagnostic Commands

### Check Lambda Status
```bash
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text)
aws lambda get-function --function-name "$FUNCTION_NAME"
```

### View Recent Logs
```bash
aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow
```

### Test Lambda Directly
```bash
aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload '{"arguments":{"message":"test","userId":"test"}}' \
  response.json
cat response.json
```

### Check Environment Variables
```bash
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query "Environment.Variables"
```

### List Bedrock Agents
```bash
aws bedrock-agent list-agents --region us-east-1
```

### Test Minecraft Connection
```bash
telnet edicraft.nigelgardiner.com 49000
telnet edicraft.nigelgardiner.com 49001
```

### Test OSDU Authentication
```bash
curl -X POST https://edi.aws.amazon.com/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=$EDI_USERNAME" \
  -d "password=$EDI_PASSWORD" \
  -d "client_id=$EDI_CLIENT_ID" \
  -d "client_secret=$EDI_CLIENT_SECRET"
```

### Test Clear Environment
```bash
python3 tests/integration/test-edicraft-clear-environment.test.py
```

### Test Time Lock
```bash
python3 tests/integration/test-edicraft-time-lock.test.py
```

### Test Collection Visualization
```bash
python3 tests/integration/test-edicraft-collection-visualization.test.py
```

### Test Drilling Rig Builder
```bash
python3 tests/integration/test-edicraft-drilling-rig.test.py
```

### Test Demo Reset
```bash
python3 tests/test-demo-reset.py
```

### Test Name Simplifier
```bash
python3 tests/test-name-simplifier.py
```

### Test S3 Data Access
```bash
python3 tests/test-s3-data-access.py
```

### Verify Clear Button
```bash
npm test -- tests/unit/test-edicraft-clear-button.test.tsx
```

### Test Collection Context Retention
```bash
node tests/test-collection-context-retention.js
```

---

## Getting Help

### Resources

- **Deployment Guide:** `edicraft-agent/DEPLOYMENT_GUIDE.md`
- **Credential Guide:** `edicraft-agent/FIND_CREDENTIALS.md`
- **Validation Guide:** `tests/manual/EDICRAFT_VALIDATION_GUIDE.md`
- **Requirements:** `.kiro/specs/fix-edicraft-agent-integration/requirements.md`
- **Design:** `.kiro/specs/fix-edicraft-agent-integration/design.md`

### Support Channels

1. **CloudWatch Logs:** Most detailed error information
2. **AWS Support:** For AWS service issues
3. **OSDU Support:** For OSDU platform issues
4. **Minecraft Server Admin:** For server issues

### Reporting Issues

When reporting issues, include:

1. **Error message:** Exact error text
2. **CloudWatch logs:** Recent log entries
3. **Configuration:** Environment variables (redact secrets)
4. **Steps to reproduce:** What you did before the error
5. **Expected behavior:** What should have happened
6. **Actual behavior:** What actually happened

---

## Preventive Measures

### Regular Maintenance

1. **Monitor CloudWatch logs daily**
2. **Check Lambda metrics weekly**
3. **Rotate credentials monthly**
4. **Update dependencies quarterly**
5. **Review costs monthly**

### Best Practices

1. **Always test in sandbox before production**
2. **Keep .env.local updated**
3. **Document any configuration changes**
4. **Use version control for all code**
5. **Set up CloudWatch alarms**

### Security

1. **Never commit credentials to Git**
2. **Use AWS Secrets Manager for production**
3. **Rotate passwords regularly**
4. **Monitor for unauthorized access**
5. **Keep dependencies updated**

---

## Conclusion

This troubleshooting guide covers the most common issues encountered with the EDIcraft agent integration. For issues not covered here, check the CloudWatch logs for detailed error messages and consult the other documentation files.

**Remember:** Most issues are configuration-related. Always verify environment variables and credentials first.
