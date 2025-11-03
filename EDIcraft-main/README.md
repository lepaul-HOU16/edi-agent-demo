# EDIcraft Agent

Subsurface data visualization agent that connects OSDU platform data to Minecraft for geological exploration.

## Setup

Copy config.ini.example to config.ini and set the variables appropriately.

```bash
make install
```

## Deploy & Test

**Local deployment:**
This is an interactive command, which invokes the agent when a prompt is entered.
```bash
make local
```

**Cloud deployment:**
```bash
make deploy
make invoke "Search for horizons and render them"
```

## Available Commands

- `make install` - Create virtualenv and install dependencies
- `make configure` - Configure AWS credentials  
- `make local` - Deploy agent locally with environment variables
- `make deploy` - Deploy agent to cloud with environment variables
- `make invoke 'text'` - Invoke deployed agent

## Configuration

Environment variables are loaded from `config.ini` including:
- EDI (OSDU) authentication credentials
- Minecraft server connection settings
- AWS Bedrock model configuration

## Prerequisites for Cloud Deployment

- AWS CLI configured with credentials
- Permissions for Bedrock, IAM, ECR, and Lambda
- Bedrock AgentCore enabled in your AWS region


# Minecraft Server

Player spawn point is 0,100,0 (Y is vertical)
Ground level is Y=100
Lowest level is Y=-64

Any higher and we're in the clouds. Removing the clouds might be possilble

Clients connect to port 49000
RCON connects on port 49001

To run the server:

copy minecraft-server dir to your server
edit docker-compose.yml to set RCON password
cd minecraft-server on server
docker compose up



Set to permanently day with rcon:

/time set noon
/gamerule doDaylightCycle false

This is set in the docker-compose.yml