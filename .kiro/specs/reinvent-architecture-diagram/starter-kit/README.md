# AWS Energy Data Insights - Starter Kit

A complete starter kit for building AI-powered agent platforms using AWS Bedrock, Lambda, and DynamoDB.

## 🚀 Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS CLI configured with credentials

### 1. Clone and Install

```bash
# Clone this repository
git clone <your-repo-url>
cd aws-energy-insights-starter-kit

# Install dependencies
npm install

# Install Python dependencies for tool Lambdas
cd cdk/lambda-functions/tools/example-tool
pip install -r requirements.txt -t .
cd ../../../..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required variables:
# - AWS_REGION
# - COGNITO_USER_POOL_ID
# - COGNITO_CLIENT_ID
# - BEDROCK_MODEL_ID
```

### 3. Deploy Infrastructure

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy all stacks
cdk deploy --all

# Note the outputs:
# - API Gateway URL
# - Cognito User Pool ID
# - S3 Bucket Name
```

### 4. Test Your Deployment

```bash
# Run integration tests
npm run test:integration

# Test a simple query
node scripts/test-agent.js "What is the weather today?"
```

## 📁 Project Structure

```
starter-kit/
├── cdk/                          # Infrastructure as Code
│   ├── lib/
│   │   ├── main-stack.ts        # Main CDK stack
│   │   ├── auth-stack.ts        # Cognito authentication
│   │   ├── api-stack.ts         # API Gateway
│   │   └── agent-stack.ts       # Agent Lambda functions
│   └── lambda-functions/
│       ├── chat/                # Chat handler
│       │   ├── handler.ts
│       │   └── agents/          # Agent implementations
│       ├── authorizer/          # JWT authorizer
│       └── tools/               # Tool Lambda functions
├── frontend/                     # React frontend (optional)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── examples/                     # Example implementations
│   ├── weather-agent/
│   ├── calculator-agent/
│   └── data-analysis-agent/
├── scripts/                      # Utility scripts
│   ├── test-agent.js
│   ├── create-user.js
│   └── deploy.sh
├── docs/                         # Documentation
│   ├── architecture.md
│   ├── adding-agents.md
│   └── deployment.md
├── .env.example                  # Environment template
├── package.json
└── README.md
```

## 🏗️ Architecture Overview

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         API Gateway + Authorizer        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          Chat Lambda                     │
│  ┌────────────────────────────────────┐ │
│  │      Agent Router                  │ │
│  │  - Intent Detection                │ │
│  │  - Pattern Matching                │ │
│  └────────┬───────────────────────────┘ │
│           │                              │
│     ┌─────┴─────┬──────────┐           │
│     ▼           ▼          ▼           │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │Agent1│  │Agent2│  │Agent3│         │
│  └──┬───┘  └──┬───┘  └──┬───┘         │
└─────┼─────────┼─────────┼──────────────┘
      │         │         │
      ▼         ▼         ▼
┌──────────────────────────────────────────┐
│         Tool Lambda Functions            │
│  - Data Processing                       │
│  - External API Calls                    │
│  - Specialized Computations              │
└──────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────┐
│    Data Layer (DynamoDB + S3)            │
│  - Chat Messages                         │
│  - Session Context                       │
│  - Artifacts                             │
└──────────────────────────────────────────┘
```

## 🤖 Example Agents Included

### 1. Weather Agent
Simple agent that fetches weather data from an external API.

**Use Case**: "What's the weather in Seattle?"

**Files**:
- `examples/weather-agent/weatherAgent.ts`
- `examples/weather-agent/weatherTool.py`

### 2. Calculator Agent
Performs mathematical calculations with step-by-step reasoning.

**Use Case**: "Calculate the compound interest on $10,000 at 5% for 10 years"

**Files**:
- `examples/calculator-agent/calculatorAgent.ts`
- `examples/calculator-agent/calculatorTool.ts`

### 3. Data Analysis Agent
Analyzes CSV data and generates visualizations.

**Use Case**: "Analyze the sales data in my-data.csv"

**Files**:
- `examples/data-analysis-agent/dataAnalysisAgent.ts`
- `examples/data-analysis-agent/dataAnalysisTool.py`

## 📝 Adding Your Own Agent

### Step 1: Create Agent Class

```typescript
// cdk/lambda-functions/chat/agents/myAgent.ts
import { BaseEnhancedAgent } from './BaseEnhancedAgent';

export class MyAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }

  async processMessage(message: string): Promise<any> {
    const thoughtSteps = [];
    
    // Add your logic here
    const result = await this.performAnalysis(message);
    
    return {
      success: true,
      message: result.message,
      artifacts: result.artifacts || [],
      thoughtSteps
    };
  }
}
```

### Step 2: Register with Router

```typescript
// cdk/lambda-functions/chat/agents/agentRouter.ts
import { MyAgent } from './myAgent';

export class AgentRouter {
  private myAgent: MyAgent;
  
  constructor() {
    this.myAgent = new MyAgent();
  }
  
  private determineAgentType(message: string): AgentType {
    if (/my.*pattern/i.test(message)) {
      return 'my_agent';
    }
    // ... other patterns
  }
  
  async routeQuery(message: string) {
    const agentType = this.determineAgentType(message);
    
    switch (agentType) {
      case 'my_agent':
        return await this.myAgent.processMessage(message);
      // ... other cases
    }
  }
}
```

### Step 3: Add Tool Lambda (Optional)

```python
# cdk/lambda-functions/tools/my-tool/handler.py
import json

def handler(event, context):
    # Your tool logic here
    params = json.loads(event['body'])
    
    result = perform_computation(params)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'data': result
        })
    }
```

### Step 4: Deploy

```bash
cdk deploy
```

See [docs/adding-agents.md](docs/adding-agents.md) for detailed guide.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AWS_REGION` | AWS region for deployment | Yes | - |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | Yes | - |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | Yes | - |
| `BEDROCK_MODEL_ID` | Bedrock model identifier | Yes | `anthropic.claude-3-5-sonnet-20241022-v2:0` |
| `STORAGE_BUCKET` | S3 bucket for artifacts | No | Auto-created |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `ENABLE_XRAY` | Enable AWS X-Ray tracing | No | `false` |

### CDK Context

```json
{
  "stackName": "MyAgentPlatform",
  "environment": "dev",
  "enableMonitoring": true,
  "lambdaTimeout": 300,
  "lambdaMemory": 1024
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- agents/myAgent.test.ts

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Test complete agent flow
npm run test:integration

# Test specific agent
node scripts/test-agent.js "test query" --agent=weather
```

### Load Testing

```bash
# Run load test
npm run test:load

# Custom load test
artillery run load-test.yml
```

## 📊 Monitoring

### CloudWatch Dashboards

Access pre-configured dashboards:
- **Agent Performance**: Lambda metrics, error rates, latency
- **API Gateway**: Request counts, 4xx/5xx errors
- **DynamoDB**: Read/write capacity, throttling
- **Cost**: Daily cost breakdown by service

### Logs

```bash
# View chat Lambda logs
aws logs tail /aws/lambda/chat --follow

# View specific agent logs
aws logs tail /aws/lambda/chat --follow --filter-pattern "MyAgent"

# View errors only
aws logs tail /aws/lambda/chat --follow --filter-pattern "ERROR"
```

### Alarms

Pre-configured CloudWatch alarms:
- High error rate (>5% in 5 minutes)
- High latency (p95 >10s)
- Lambda throttling
- DynamoDB throttling
- Daily cost >$50

## 🚀 Deployment

### Development

```bash
# Deploy to dev environment
cdk deploy --context environment=dev

# Stream logs
npm run logs:dev
```

### Production

```bash
# Deploy to production
cdk deploy --context environment=prod --require-approval never

# Run smoke tests
npm run test:smoke

# Monitor deployment
npm run monitor:prod
```

### CI/CD

GitHub Actions workflow included:
- Runs tests on PR
- Deploys to dev on merge to `develop`
- Deploys to prod on merge to `main`

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

## 💰 Cost Estimation

**Estimated monthly costs for 1,000 users (10 queries/user/day):**

| Service | Usage | Cost |
|---------|-------|------|
| API Gateway | 300K requests | $1.05 |
| Lambda | 300K invocations | $25.00 |
| DynamoDB | 600K writes, 1.2M reads | $1.50 |
| S3 | 100 GB storage | $2.50 |
| Bedrock | 300K requests | $150.00 |
| CloudWatch | Logs and metrics | $5.00 |
| **Total** | | **~$185/month** |

Use the cost calculator: `node scripts/estimate-cost.js`

## 🔒 Security

### Best Practices Implemented

- ✅ JWT authentication with Cognito
- ✅ HTTPS only (TLS 1.2+)
- ✅ IAM least privilege
- ✅ Encryption at rest (DynamoDB, S3)
- ✅ Encryption in transit
- ✅ Secrets in AWS Secrets Manager
- ✅ CloudTrail audit logging
- ✅ VPC endpoints for private access (optional)

### Security Checklist

- [ ] Rotate Cognito client secrets
- [ ] Review IAM policies quarterly
- [ ] Enable AWS GuardDuty
- [ ] Configure AWS WAF rules
- [ ] Set up AWS Security Hub
- [ ] Enable CloudTrail in all regions
- [ ] Configure S3 bucket policies
- [ ] Review CloudWatch logs for anomalies

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [Adding New Agents](docs/adding-agents.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Performance Tuning](docs/performance.md)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/starter-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/starter-kit/discussions)
- **Email**: support@your-org.com

## 🎯 Next Steps

1. ✅ Deploy the starter kit
2. ✅ Test the example agents
3. ✅ Create your first custom agent
4. ✅ Add your own tool Lambda
5. ✅ Customize the frontend
6. ✅ Set up monitoring and alerts
7. ✅ Deploy to production

**Happy building! 🚀**
