# EDIcraft Agent Deployment Guide

## Quick Start

This guide walks you through deploying the EDIcraft agent to AWS Bedrock AgentCore.

## Documentation Index

This is the main deployment guide. For other topics, see:

- **[Troubleshooting Guide](../docs/EDICRAFT_TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues
- **[User Workflows](../docs/EDICRAFT_USER_WORKFLOWS.md)** - Complete user workflows from query to visualization
- **[Validation Guide](../tests/manual/EDICRAFT_VALIDATION_GUIDE.md)** - Testing and validation procedures
- **[Credential Guide](FIND_CREDENTIALS.md)** - How to find required credentials
- **[Bedrock AgentCore Deployment](BEDROCK_AGENTCORE_DEPLOYMENT.md)** - Bedrock-specific deployment details
- **[Requirements](../.kiro/specs/fix-edicraft-agent-integration/requirements.md)** - Detailed requirements
- **[Design](../.kiro/specs/fix-edicraft-agent-integration/design.md)** - Architecture and design decisions

## Step 1: Configure Credentials

Edit `config.ini` with your actual values:

```bash
cd edicraft-agent
nano config.ini  # or use your preferred editor
```

### Required Configuration

#### Minecraft Server Settings
```ini
MINECRAFT_HOST="edicraft.nigelgardiner.com"
MINECRAFT_RCON_PORT="49000"
MINECRAFT_RCON_PASSWORD="your_actual_password"
```

#### OSDU Platform Settings
```ini
EDI_USERNAME=your_username
EDI_PASSWORD=your_password
EDI_CLIENT_ID=your_client_id
EDI_CLIENT_SECRET=your_client_secret
EDI_PARTITION=your_partition
EDI_PLATFORM_URL=https://your-osdu-url.com
```

#### AWS Settings (usually defaults are fine)
```ini
REGION="us-west-2"
BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"
```

## Step 2: Install Dependencies

```bash
make install
```

This will:
- Create a Python virtual environment
- Install all required packages
- Configure Bedrock AgentCore

## Step 3: Test Locally (Optional but Recommended)

```bash
make local
```

This starts the agent locally. Try these test prompts:
- "Show me the configuration"
- "List available tools"
- "Search for wellbores"

Press Ctrl+C to stop the local agent.

## Step 4: Deploy to AWS

```bash
make deploy
```

**IMPORTANT**: Save the output! You'll see something like:

```
Agent deployed successfully!
Agent ID: ABCD1234EFGH
Agent Alias ID: TSTALIASID
```

**Copy these IDs** - you need them for the next step.

## Step 5: Update Lambda Configuration

After deployment, you need to configure the Lambda function to use your deployed agent.

### Configure Environment Variables

The EDIcraft agent Lambda requires the following environment variables to be set. These are automatically configured from your local `.env.local` file when you deploy the Amplify backend.

#### Required Environment Variables

**Bedrock AgentCore Configuration:**
- `BEDROCK_AGENT_ID` - Your deployed agent ID (from Step 4)
- `BEDROCK_AGENT_ALIAS_ID` - Your agent alias ID (typically `TSTALIASID`)
- `BEDROCK_REGION` - AWS region (default: `us-east-1`)

**Minecraft Server Configuration:**
- `MINECRAFT_HOST` - Minecraft server hostname (default: `edicraft.nigelgardiner.com`)
- `MINECRAFT_PORT` - Minecraft game port (default: `49000`)
- `MINECRAFT_RCON_PORT` - RCON port (default: `49001`)
- `MINECRAFT_RCON_PASSWORD` - RCON password for server access

**OSDU Platform Configuration:**
- `EDI_USERNAME` - OSDU platform username
- `EDI_PASSWORD` - OSDU platform password
- `EDI_CLIENT_ID` - OSDU OAuth client ID
- `EDI_CLIENT_SECRET` - OSDU OAuth client secret
- `EDI_PARTITION` - OSDU data partition name
- `EDI_PLATFORM_URL` - OSDU platform base URL

### Option A: Configure via .env.local (Recommended)

1. Copy `.env.example` to `.env.local` in your project root:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your values:
   ```bash
   # Bedrock AgentCore (from Step 4 output)
   BEDROCK_AGENT_ID=ABCD1234EFGH
   BEDROCK_AGENT_ALIAS_ID=TSTALIASID
   BEDROCK_REGION=us-east-1

   # Minecraft Server
   MINECRAFT_HOST=edicraft.nigelgardiner.com
   MINECRAFT_PORT=49000
   MINECRAFT_RCON_PORT=49001
   MINECRAFT_RCON_PASSWORD=your_actual_password

   # OSDU Platform
   EDI_USERNAME=your_username
   EDI_PASSWORD=your_password
   EDI_CLIENT_ID=your_client_id
   EDI_CLIENT_SECRET=your_client_secret
   EDI_PARTITION=your_partition
   EDI_PLATFORM_URL=https://your-osdu-url.com
   ```

3. Redeploy your Amplify backend:
   ```bash
   npx ampx sandbox
   ```

The environment variables will be automatically passed to the Lambda function from your `.env.local` file.

### Option B: Update via AWS Console

If you prefer to configure directly in AWS:

1. Go to AWS Lambda console
2. Find the EDIcraft agent function (search for `edicraftAgent`)
3. Go to Configuration → Environment variables
4. Add all required variables listed above

**Note**: This method requires manual updates each time you redeploy.

## Step 6: Update MCP Client Code

The `mcpClient.ts` file needs to be updated to invoke the real agent instead of returning preview messages.

This involves:
1. Using `BedrockAgentRuntimeClient.invokeAgent()`
2. Passing the agent ID and alias ID
3. Streaming the response
4. Parsing the agent output

## Step 7: Test End-to-End

1. Open your web application
2. Select "EDIcraft" agent
3. Try: "get a well log from well001 and show it in minecraft"
4. Verify the agent processes the request
5. Check Minecraft server for visualization

## Verification Checklist

- [ ] config.ini has all credentials filled in
- [ ] `make install` completed successfully
- [ ] `make local` works (optional)
- [ ] `make deploy` completed successfully
- [ ] Agent ID and Alias ID saved
- [ ] Lambda environment variables updated
- [ ] Amplify backend redeployed
- [ ] mcpClient.ts updated to invoke real agent
- [ ] End-to-end test successful

## Troubleshooting

### "Permission denied" during deployment

**Solution**: Ensure your AWS credentials have permissions for:
- Bedrock AgentCore
- IAM role creation
- ECR (Elastic Container Registry)
- Lambda function creation

### "Agent not found" when invoking

**Solution**: 
- Verify BEDROCK_AGENT_ID is correct
- Check the agent was deployed successfully
- Ensure Lambda has permissions to invoke Bedrock agents

### "Connection refused" to Minecraft

**Solution**:
- Verify Minecraft server is running
- Check RCON is enabled
- Test connectivity: `telnet edicraft.nigelgardiner.com 49000`

### "Authentication failed" with OSDU

**Solution**:
- Verify credentials in config.ini
- Check platform URL is correct
- Ensure user has necessary permissions

## Updating the Agent

To update the agent after making changes:

```bash
make deploy
```

The `--auto-update-on-conflict` flag will update the existing agent.

## Invoking the Agent Directly

To test the deployed agent directly:

```bash
make invoke "Search for wellbores in the North Sea"
```

## Monitoring

View agent logs in CloudWatch:
1. Go to CloudWatch console
2. Find log group: `/aws/bedrock/agent/edicraft`
3. View recent invocations

## Cost Considerations

- Bedrock AgentCore charges per invocation
- Claude model charges per token
- Lambda charges per execution
- Minimal costs for testing/development

## Security Best Practices

1. **Never commit config.ini** - It's in .gitignore
2. **Use AWS Secrets Manager** for production credentials
3. **Rotate passwords** regularly
4. **Use IAM roles** instead of access keys where possible
5. **Enable CloudTrail** for audit logging

## Next Steps

After successful deployment:

1. Update the Lambda handler to invoke the real agent
2. Test all agent capabilities
3. Monitor performance and costs
4. Set up alerts for failures
5. Document any custom configurations

## Support

If you encounter issues:
1. Check CloudWatch logs
2. Review Bedrock AgentCore documentation
3. Verify all credentials are correct
4. Test components individually (OSDU, Minecraft, Agent)

## References

- [Bedrock AgentCore Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [OSDU Platform](https://osduforum.org/)
- [Minecraft RCON](https://wiki.vg/RCON)
