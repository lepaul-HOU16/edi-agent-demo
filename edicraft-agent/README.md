# EDIcraft Agent - Bedrock AgentCore Deployment

This directory contains the Python-based Bedrock AgentCore agent that provides Minecraft visualization capabilities for subsurface data from OSDU platforms.

## Overview

The EDIcraft agent connects OSDU platform data to Minecraft for geological exploration, enabling:
- Wellbore trajectory visualization in 3D
- Horizon surface rendering
- Real-time coordinate transformation (UTM to Minecraft)
- Player position tracking
- RCON-based Minecraft server control

## Prerequisites

1. **AWS CLI** configured with credentials
2. **Python 3.9+** installed
3. **Bedrock AgentCore** access in your AWS account
4. **Minecraft Server** with RCON enabled (edicraft.nigelgardiner.com:49000)
5. **OSDU Platform** credentials

## Setup Instructions

### Step 1: Configure Credentials

Edit `config.ini` with your actual credentials:

```ini
# Minecraft Server
MINECRAFT_HOST="edicraft.nigelgardiner.com"
MINECRAFT_RCON_PORT="49000"
MINECRAFT_RCON_PASSWORD="your_actual_rcon_password"

# OSDU Platform
EDI_USERNAME=your_osdu_username
EDI_PASSWORD=your_osdu_password
EDI_CLIENT_ID=your_client_id
EDI_CLIENT_SECRET=your_client_secret
EDI_PARTITION=your_partition_name
EDI_PLATFORM_URL=https://your-osdu-platform.com
```

### Step 2: Install Dependencies

```bash
make install
```

This creates a virtual environment and installs all required Python packages.

### Step 3: Test Locally (Optional)

```bash
make local
```

This runs the agent locally for testing before cloud deployment.

### Step 4: Deploy to AWS

```bash
make deploy
```

This deploys the agent to AWS Bedrock AgentCore. After deployment, you'll receive:
- **Agent ID**: Used to invoke the agent
- **Agent Alias ID**: Used for versioning

**Save these IDs** - you'll need them to configure the Lambda function.

### Step 5: Update Lambda Environment Variables

After deployment, update the Lambda function environment variables in your Amplify backend:

```typescript
// In amplify/backend.ts or amplify/functions/edicraftAgent/resource.ts
backend.edicraftAgentHandler.addEnvironment('BEDROCK_AGENT_ID', 'your-agent-id');
backend.edicraftAgentHandler.addEnvironment('BEDROCK_AGENT_ALIAS_ID', 'your-alias-id');
```

## Available Commands

- `make install` - Create virtualenv and install dependencies
- `make local` - Deploy agent locally for testing
- `make deploy` - Deploy agent to AWS Bedrock AgentCore
- `make invoke "prompt"` - Invoke deployed agent with a prompt

## Agent Capabilities

### Tools Available

1. **search_wellbores()** - Search OSDU for wellbore trajectories
2. **get_trajectory_coordinates(wellbore_id)** - Get trajectory data
3. **minecraft_command(command)** - Execute RCON commands
4. **list_players()** - Get online players
5. **get_player_positions()** - Get player coordinates
6. **transform_coordinates(x, y, z)** - Convert UTM to Minecraft
7. **build_wellbore(coordinates)** - Build wellbore visualization
8. **calculate_trajectory_coordinates()** - Calculate 3D trajectory
9. **search_horizons_live()** - Search OSDU for horizons
10. **build_horizon_surface()** - Build geological surfaces

### Minecraft Coordinate System

- **Ground Level**: Y=100 (surface)
- **Above Ground**: Y>100 (sky)
- **Underground**: Y<100 (subsurface)
- **Wellbores**: Start at Y=100, extend downward
- **Horizons**: Typically Y=30-50 range

## Integration with Web Application

Once deployed, the agent is invoked by the Lambda function at:
- `amplify/functions/edicraftAgent/handler.ts`
- `amplify/functions/edicraftAgent/mcpClient.ts`

The Lambda function uses `BedrockAgentRuntimeClient` to invoke the agent and return results to the web UI.

## Troubleshooting

### Deployment Fails

- Verify AWS credentials are configured
- Check Bedrock AgentCore is enabled in your region
- Ensure you have necessary IAM permissions

### Agent Invocation Fails

- Verify BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID are correct
- Check Lambda function has permissions to invoke Bedrock agents
- Review CloudWatch logs for detailed error messages

### Minecraft Connection Fails

- Verify Minecraft server is running
- Check RCON is enabled in server.properties
- Verify RCON password is correct
- Test network connectivity to edicraft.nigelgardiner.com:49000

### OSDU Authentication Fails

- Verify OSDU credentials are correct
- Check platform URL is accessible
- Ensure user has necessary permissions

## File Structure

```
edicraft-agent/
├── agent.py                 # Main agent with tools
├── config.py               # Configuration loader
├── config.ini              # Credentials (DO NOT COMMIT)
├── config.ini.example      # Template for credentials
├── requirements.txt        # Python dependencies
├── Makefile               # Deployment commands
├── .bedrock_agentcore.yaml # AgentCore configuration
├── tools/                 # Tool implementations
│   ├── osdu_client.py     # OSDU platform integration
│   ├── rcon_tool.py       # Minecraft RCON commands
│   ├── trajectory_tools.py # Wellbore calculations
│   ├── horizon_tools.py   # Horizon processing
│   └── ...
└── README.md              # This file
```

## Security Notes

- **Never commit config.ini** - It contains sensitive credentials
- Store credentials in AWS Secrets Manager for production
- Use IAM roles for Lambda function permissions
- Rotate RCON passwords regularly

## Next Steps

After deploying the agent:

1. Update Lambda environment variables with agent IDs
2. Update `mcpClient.ts` to invoke the real agent
3. Test end-to-end from web UI
4. Monitor CloudWatch logs for errors
5. Verify visualizations appear in Minecraft

## Complete Documentation

For comprehensive documentation, see:

- **[Documentation Index](../docs/EDICRAFT_DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[Environment Variables](../docs/EDICRAFT_ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Troubleshooting Guide](../docs/EDICRAFT_TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues
- **[User Workflows](../docs/EDICRAFT_USER_WORKFLOWS.md)** - Complete user workflows
- **[Validation Guide](../tests/manual/EDICRAFT_VALIDATION_GUIDE.md)** - Testing procedures
- **[Credential Guide](FIND_CREDENTIALS.md)** - How to find credentials

## References

- [Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [OSDU Platform](https://osduforum.org/)
- [Minecraft RCON Protocol](https://wiki.vg/RCON)
- Original Repository: See `README-ORIGINAL.md`
