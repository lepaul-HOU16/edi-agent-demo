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
- EDIcraft agent not selected
- Routing conflicts

**Possible Causes:**
- Pattern matching too broad/narrow
- Priority not configured
- Agent router logic error

**Solutions:**

1. **Test routing patterns:**
   ```bash
   node tests/unit/test-agent-router-edicraft.test.ts
   ```

2. **Check pattern matching in agentRouter.ts:**
   - Verify EDIcraft patterns are defined
   - Check priority handling
   - Ensure no conflicts with other agents

3. **Test specific queries:**
   ```
   Show me wellbore data in minecraft
   ```
   Should route to EDIcraft.

4. **Enable routing debug logs:**
   ```typescript
   // In agentRouter.ts
   console.log('Matched patterns:', matchedPatterns);
   console.log('Selected agent:', agentType);
   ```

5. **Verify agent switcher works:**
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
