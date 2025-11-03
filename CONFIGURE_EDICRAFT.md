# Configure EDIcraft Agent - Quick Start

## Current Status

✅ **Lambda Deployed:** EDIcraft agent is deployed and running  
⚠️ **Configuration Needed:** Environment variables are empty (expected)

## What You Need to Do

The environment variables test failed because the credentials haven't been configured yet. This is **expected** - you need to provide actual credentials.

### Option 1: Interactive Setup (Recommended)

Run the interactive setup script:

```bash
./tests/manual/setup-edicraft-credentials.sh
```

This will prompt you for each credential and automatically update `.env.local`.

### Option 2: Manual Configuration

Edit `.env.local` and fill in the empty values:

```bash
# 1. Deploy Bedrock AgentCore agent (if not done)
cd edicraft-agent
make install
make deploy
# Copy the Agent ID and Alias ID from the output

# 2. Edit .env.local
nano .env.local  # or use your preferred editor

# 3. Fill in these values:
BEDROCK_AGENT_ID=<your_agent_id>
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
MINECRAFT_RCON_PASSWORD=<your_rcon_password>
EDI_USERNAME=<your_username>
EDI_PASSWORD=<your_password>
EDI_CLIENT_ID=<your_client_id>
EDI_CLIENT_SECRET=<your_client_secret>
EDI_PARTITION=<your_partition>
EDI_PLATFORM_URL=<your_platform_url>
```

### Option 3: Skip Configuration (Testing Only)

If you just want to test the routing and error handling without full execution:

```bash
# The current configuration will work for:
# - Testing agent routing
# - Testing error handling
# - Verifying deployment

# It will NOT work for:
# - Actual agent execution
# - Minecraft visualization
# - OSDU data retrieval
```

## Finding Credentials

If you don't have the credentials, see:

- **Bedrock Agent:** `edicraft-agent/DEPLOYMENT_GUIDE.md`
- **All Credentials:** `edicraft-agent/FIND_CREDENTIALS.md`

## After Configuration

1. **Restart the sandbox:**
   ```bash
   npx ampx sandbox
   ```
   Wait for "Deployed" message (~5-10 minutes)

2. **Run tests again:**
   ```bash
   node tests/manual/test-edicraft-deployment.js
   ```
   All tests should pass now.

3. **Test in web UI:**
   - Open the application
   - Try: "Show me wellbore data in minecraft"
   - Verify thought steps display
   - Check Minecraft server for visualization

## Why Environment Variables Failed

The test showed:
```
❌ BEDROCK_AGENT_ID: NOT CONFIGURED
❌ BEDROCK_AGENT_ALIAS_ID: NOT CONFIGURED
❌ MINECRAFT_RCON_PASSWORD: NOT CONFIGURED
❌ EDI_USERNAME: NOT CONFIGURED
... (and others)
```

This is **correct behavior** - these values are intentionally empty until you provide them. The test is working as designed to verify configuration.

## Next Steps

1. Choose a configuration method above
2. Provide the credentials
3. Restart sandbox
4. Re-run tests
5. Validate in web UI

**Task 14 will be complete once you validate the integration works end-to-end with actual credentials.**
