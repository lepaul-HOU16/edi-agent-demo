# Quick Start Guide

Get up and running with the AWS Energy Insights Starter Kit in 15 minutes.

## Prerequisites

- AWS Account
- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK CLI: `npm install -g aws-cdk`

## 1. Clone and Install (2 minutes)

```bash
# Clone repository
git clone <your-repo-url>
cd aws-energy-insights-starter-kit

# Install dependencies
npm install
```

## 2. Configure Environment (3 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your AWS details
# Minimum required:
# - AWS_REGION=us-east-1
# - AWS_ACCOUNT_ID=123456789012
```

## 3. Deploy Infrastructure (8 minutes)

```bash
# Bootstrap CDK (first time only)
npm run bootstrap

# Deploy all stacks
npm run deploy:dev
```

This will create:
- Cognito User Pool for authentication
- API Gateway for HTTP endpoints
- Lambda functions for agents and tools
- DynamoDB tables for data storage
- S3 bucket for artifacts

## 4. Create Test User (1 minute)

```bash
# Create a test user
npm run create-user

# Follow prompts to set username and password
```

## 5. Test Your First Agent (1 minute)

```bash
# Test weather agent
npm run test-agent "What's the weather in Seattle?"

# Test calculator agent
npm run test-agent "Calculate 10 + 5"

# Test with specific agent
npm run test-agent "Calculate compound interest on $10,000 at 5% for 10 years" --agent=calculator
```

## What's Next?

### Add Your Own Agent

```bash
# Copy example agent
cp examples/weather-agent/weatherAgent.ts cdk/lambda-functions/chat/agents/myAgent.ts

# Edit and customize
# See docs/adding-agents.md for detailed guide
```

### Deploy to Production

```bash
npm run deploy:prod
```

### Monitor Your Deployment

```bash
# View logs
npm run logs:dev

# Monitor metrics
npm run monitor:dev
```

## Project Structure

```
starter-kit/
├── cdk/                    # Infrastructure code
│   ├── lib/
│   │   └── main-stack.ts  # Main CDK stack
│   └── lambda-functions/
│       ├── chat/          # Chat handler and agents
│       └── tools/         # Tool Lambda functions
├── examples/              # Example agent implementations
│   ├── weather-agent/
│   ├── calculator-agent/
│   └── data-analysis-agent/
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── .env.example          # Environment template
```

## Common Commands

```bash
# Development
npm run deploy:dev         # Deploy to dev environment
npm run logs:dev          # View dev logs
npm test                  # Run tests

# Production
npm run deploy:prod       # Deploy to production
npm run logs:prod         # View production logs
npm run test:smoke        # Run smoke tests

# Utilities
npm run create-user       # Create Cognito user
npm run test-agent        # Test agent
npm run estimate-cost     # Estimate monthly costs
```

## Architecture Overview

```
User → API Gateway → Lambda Authorizer (JWT)
                  ↓
              Chat Lambda
                  ↓
            Agent Router
         ↙      ↓      ↘
    Agent1  Agent2  Agent3
         ↘      ↓      ↙
         Tool Lambdas
              ↓
      DynamoDB + S3
```

## Example Agents Included

### 1. Weather Agent
Fetches weather data from external API.

**Query:** "What's the weather in Seattle?"

### 2. Calculator Agent
Performs mathematical calculations with step-by-step reasoning.

**Query:** "Calculate compound interest on $10,000 at 5% for 10 years"

### 3. Data Analysis Agent
Analyzes CSV data and generates visualizations.

**Query:** "Analyze the sales data in my-data.csv"

## Troubleshooting

### Deployment Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CDK bootstrap
aws cloudformation describe-stacks --stack-name CDKToolkit

# View detailed error
npm run deploy:dev -- --verbose
```

### Authentication Fails

```bash
# Verify user exists
aws cognito-idp list-users --user-pool-id <your-pool-id>

# Reset password
aws cognito-idp admin-set-user-password \
  --user-pool-id <your-pool-id> \
  --username testuser \
  --password NewPassword123! \
  --permanent
```

### Agent Not Responding

```bash
# Check Lambda logs
npm run logs:dev

# Test Lambda directly
aws lambda invoke \
  --function-name dev-agent-platform-chat \
  --payload '{"body": "{\"message\": \"test\"}"}' \
  response.json
```

## Cost Estimate

For 1,000 users with 10 queries/user/day:

| Service | Monthly Cost |
|---------|--------------|
| Lambda | $25 |
| API Gateway | $1 |
| DynamoDB | $2 |
| S3 | $3 |
| Bedrock | $150 |
| **Total** | **~$185** |

Use `npm run estimate-cost` for detailed breakdown.

## Support

- **Documentation:** See `docs/` directory
- **Issues:** GitHub Issues
- **Examples:** See `examples/` directory

## Next Steps

1. ✅ Deploy the starter kit
2. ✅ Test example agents
3. 📝 Read [Adding Agents Guide](docs/adding-agents.md)
4. 🔧 Create your first custom agent
5. 🚀 Deploy to production

**Happy building! 🚀**
