# Agent Landing Pages - Environment Variables Setup Guide

This guide provides detailed instructions for configuring environment variables required for the agent landing pages feature, with special focus on the EDIcraft agent integration.

## Overview

The agent landing pages feature introduces five specialized AI agents:
- **Auto Agent**: Intelligent query routing
- **Petrophysics Agent**: Well log analysis
- **Maintenance Agent**: Equipment monitoring
- **Renewable Energy Agent**: Wind farm analysis
- **EDIcraft Agent**: Minecraft-based subsurface visualization

This document focuses on the environment variables required for the EDIcraft agent, which requires additional configuration for Minecraft server connectivity and OSDU platform integration.

## Environment Variables

### EDIcraft Minecraft Server Configuration

#### MINECRAFT_HOST
- **Description**: Hostname or IP address of the Minecraft server running EDIcraft visualization
- **Required**: Yes (for EDIcraft agent)
- **Default**: `edicraft.nigelgardiner.com`
- **Example**: `edicraft.nigelgardiner.com` or `192.168.1.100`
- **Usage**: Used to establish connection to the Minecraft server for rendering subsurface data

```bash
MINECRAFT_HOST=edicraft.nigelgardiner.com
```

#### MINECRAFT_RCON_PORT
- **Description**: Port number for Minecraft RCON (Remote Console) access
- **Required**: Yes (for EDIcraft agent)
- **Default**: `49000`
- **Example**: `49000`
- **Usage**: RCON port for sending commands to the Minecraft server

```bash
MINECRAFT_RCON_PORT=49000
```

#### MINECRAFT_RCON_PASSWORD
- **Description**: Password for authenticating with Minecraft RCON
- **Required**: Yes (for EDIcraft agent)
- **Security**: Keep this secure and do not commit to version control
- **Example**: `your_secure_password_here`
- **Usage**: Authentication credential for RCON commands

```bash
MINECRAFT_RCON_PASSWORD=your_secure_password_here
```

**Security Note**: Store this password securely. In production environments, use AWS Secrets Manager or similar secret management services.

### OSDU Platform Credentials

The EDIcraft agent requires OSDU platform credentials to access subsurface data (wellbores, horizons, geological surfaces).

#### EDI_USERNAME
- **Description**: Username for OSDU platform authentication
- **Required**: Yes (for EDIcraft agent)
- **Example**: `user@company.com`

```bash
EDI_USERNAME=user@company.com
```

#### EDI_PASSWORD
- **Description**: Password for OSDU platform authentication
- **Required**: Yes (for EDIcraft agent)
- **Security**: Keep secure, do not commit to version control

```bash
EDI_PASSWORD=your_secure_password
```

#### EDI_CLIENT_ID
- **Description**: OAuth client ID for OSDU platform API access
- **Required**: Yes (for EDIcraft agent)
- **Example**: `client-id-12345`

```bash
EDI_CLIENT_ID=client-id-12345
```

#### EDI_CLIENT_SECRET
- **Description**: OAuth client secret for OSDU platform API access
- **Required**: Yes (for EDIcraft agent)
- **Security**: Keep secure, do not commit to version control

```bash
EDI_CLIENT_SECRET=your_client_secret
```

#### EDI_PARTITION
- **Description**: OSDU data partition name
- **Required**: Yes (for EDIcraft agent)
- **Example**: `opendes`

```bash
EDI_PARTITION=opendes
```

#### EDI_PLATFORM_URL
- **Description**: Base URL for the OSDU platform API
- **Required**: Yes (for EDIcraft agent)
- **Example**: `https://your-osdu-platform.com`

```bash
EDI_PLATFORM_URL=https://your-osdu-platform.com
```

### MCP Server Configuration

#### MCP_SERVER_URL
- **Description**: URL for the Model Context Protocol server (optional, for external MCP server)
- **Required**: No (MCP servers can run locally via Kiro configuration)
- **Default**: `http://localhost:8000/mcp`
- **Example**: `http://localhost:8000/mcp` or `https://mcp-server.company.com/mcp`

```bash
MCP_SERVER_URL=http://localhost:8000/mcp
```

**Note**: The EDIcraft MCP server is configured in `.kiro/settings/mcp.json` and runs locally by default. This environment variable is only needed if using an external MCP server deployment.

## Setup Instructions

### Step 1: Copy Environment Template

Copy the example environment file to create your local configuration:

```bash
cp .env.example .env.local
```

### Step 2: Configure Minecraft Server Access

1. Obtain the Minecraft server hostname/IP from your infrastructure team
2. Obtain the RCON password (set in the Minecraft server's `docker-compose.yml`)
3. Update the following variables in `.env.local`:

```bash
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_RCON_PORT=49000
MINECRAFT_RCON_PASSWORD=your_actual_rcon_password
```

### Step 3: Configure OSDU Platform Credentials

1. Obtain OSDU platform credentials from your platform administrator
2. Update the following variables in `.env.local`:

```bash
EDI_USERNAME=your_username
EDI_PASSWORD=your_password
EDI_CLIENT_ID=your_client_id
EDI_CLIENT_SECRET=your_client_secret
EDI_PARTITION=your_partition
EDI_PLATFORM_URL=https://your-osdu-platform.com
```

### Step 4: Configure MCP Server (Optional)

If using an external MCP server:

```bash
MCP_SERVER_URL=https://your-mcp-server.com/mcp
```

If using local MCP servers (default), no additional configuration needed. The MCP servers are configured in `.kiro/settings/mcp.json`.

### Step 5: Verify Configuration

After setting up environment variables, verify the configuration:

1. **Check environment file exists**:
   ```bash
   ls -la .env.local
   ```

2. **Verify Minecraft server connectivity** (optional):
   ```bash
   nc -zv edicraft.nigelgardiner.com 49000
   ```

3. **Test OSDU platform credentials** (optional):
   ```bash
   curl -X POST "${EDI_PLATFORM_URL}/api/auth/token" \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"${EDI_USERNAME}\",\"password\":\"${EDI_PASSWORD}\"}"
   ```

## MCP Server Configuration

The EDIcraft agent uses the Model Context Protocol (MCP) for tool integration. The MCP server configuration is stored in `.kiro/settings/mcp.json`.

### EDIcraft MCP Server Configuration

```json
{
  "mcpServers": {
    "edicraft": {
      "command": "python",
      "args": ["EDIcraft-main/agent.py"],
      "env": {
        "MINECRAFT_HOST": "edicraft.nigelgardiner.com",
        "MINECRAFT_RCON_PORT": "49000",
        "MINECRAFT_RCON_PASSWORD": "${MINECRAFT_RCON_PASSWORD}",
        "EDI_USERNAME": "${EDI_USERNAME}",
        "EDI_PASSWORD": "${EDI_PASSWORD}",
        "EDI_CLIENT_ID": "${EDI_CLIENT_ID}",
        "EDI_CLIENT_SECRET": "${EDI_CLIENT_SECRET}",
        "EDI_PARTITION": "${EDI_PARTITION}",
        "EDI_PLATFORM_URL": "${EDI_PLATFORM_URL}",
        "BEDROCK_MODEL_ID": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        "REGION": "us-west-2",
        "AGENT_NAME": "edicraft"
      },
      "disabled": false,
      "autoApprove": [
        "show_config",
        "search_wellbores",
        "get_trajectory_coordinates",
        "minecraft_command",
        "list_players",
        "get_player_positions",
        "transform_coordinates",
        "build_wellbore",
        "setup_coordinate_tracking",
        "calculate_trajectory_coordinates",
        "parse_osdu_trajectory_file",
        "build_wellbore_in_minecraft",
        "search_horizons_live",
        "parse_horizon_file",
        "convert_horizon_to_minecraft",
        "download_horizon_data",
        "build_horizon_surface"
      ]
    }
  }
}
```

### Environment Variable Substitution

The MCP server configuration uses `${VARIABLE_NAME}` syntax to reference environment variables from `.env.local`. This allows sensitive credentials to be stored securely outside of the configuration file.

## Production Deployment

### AWS Secrets Manager (Recommended)

For production deployments, store sensitive credentials in AWS Secrets Manager:

1. **Create secrets**:
   ```bash
   aws secretsmanager create-secret \
     --name edicraft/minecraft-rcon-password \
     --secret-string "your_rcon_password"
   
   aws secretsmanager create-secret \
     --name edicraft/osdu-credentials \
     --secret-string '{"username":"user","password":"pass","client_id":"id","client_secret":"secret"}'
   ```

2. **Update Lambda environment variables** to reference secrets:
   ```typescript
   // In amplify/backend.ts
   backend.edicraftAgent.addEnvironment(
     'MINECRAFT_RCON_PASSWORD',
     secretsmanager.Secret.fromSecretNameV2(
       stack,
       'MinecraftPassword',
       'edicraft/minecraft-rcon-password'
     ).secretValue.toString()
   );
   ```

### Environment-Specific Configuration

Use different environment files for different deployment stages:

- `.env.local` - Local development
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Minecraft server

**Solutions**:
1. Verify `MINECRAFT_HOST` is correct
2. Check firewall rules allow access to port 49000
3. Verify RCON is enabled on Minecraft server
4. Test connectivity: `nc -zv edicraft.nigelgardiner.com 49000`

### Authentication Issues

**Problem**: OSDU platform authentication fails

**Solutions**:
1. Verify credentials are correct
2. Check if credentials have expired
3. Verify `EDI_PLATFORM_URL` is correct
4. Check if client ID/secret are valid
5. Verify partition name matches your OSDU instance

### MCP Server Issues

**Problem**: MCP server fails to start

**Solutions**:
1. Check Python is installed: `python --version`
2. Verify `EDIcraft-main/agent.py` exists
3. Check environment variables are set correctly
4. Review MCP server logs in Kiro
5. Verify all required Python dependencies are installed

### Missing Environment Variables

**Problem**: Application fails with "Environment variable not set" error

**Solutions**:
1. Verify `.env.local` file exists
2. Check all required variables are set
3. Restart development server after changing environment variables
4. For production, verify Lambda environment variables are set

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use `.gitignore`** to exclude `.env.local` and `.env.production`
3. **Rotate credentials** regularly
4. **Use AWS Secrets Manager** for production deployments
5. **Limit access** to environment files
6. **Use IAM roles** instead of access keys when possible
7. **Enable MFA** for AWS accounts with access to secrets

## Additional Resources

- [EDIcraft Agent Documentation](../EDIcraft-main/README.md)
- [MCP Server Setup Guide](./MCP_SERVER_SETUP_SUMMARY.md)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [OSDU Platform Documentation](https://community.opengroup.org/osdu)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs for Lambda functions
3. Check MCP server logs in Kiro
4. Contact your infrastructure team for Minecraft server access
5. Contact your OSDU platform administrator for credential issues
