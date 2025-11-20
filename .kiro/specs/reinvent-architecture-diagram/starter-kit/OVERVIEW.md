# AWS Energy Insights Starter Kit - Overview

## What is This?

A complete, production-ready starter kit for building AI-powered agent platforms using AWS services. This kit provides everything you need to create sophisticated conversational AI applications with specialized agents, tool integrations, and rich visualizations.

## Who is This For?

- **Developers** building AI agent applications
- **Solutions Architects** designing agent platforms
- **Workshop Attendees** learning AWS AI services
- **Teams** needing a quick start for agent development

## What's Included?

### 1. Complete Infrastructure (CDK)
- Cognito authentication
- API Gateway with JWT authorization
- Lambda functions for agents and tools
- DynamoDB for data persistence
- S3 for artifact storage
- CloudWatch monitoring and alarms

### 2. Three Example Agents
- **Weather Agent** - External API integration
- **Calculator Agent** - Pure TypeScript logic
- **Data Analysis Agent** - Python tools with visualizations

### 3. Development Tools
- Automated deployment scripts
- Testing utilities
- Monitoring scripts
- Cost estimation tools

### 4. Comprehensive Documentation
- Quick start guide (15 minutes)
- Step-by-step agent development guide
- Architecture documentation
- Troubleshooting guides

## Quick Stats

- **Setup Time:** 15 minutes
- **Lines of Code:** ~3,000
- **Example Agents:** 3
- **AWS Services:** 7
- **Documentation Pages:** 4
- **Scripts:** 3

## Architecture

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
└──────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────┐
│    Data Layer (DynamoDB + S3)            │
└──────────────────────────────────────────┘
```

## Key Features

### 🚀 Quick Start
- Deploy in 15 minutes
- Automated setup scripts
- Pre-configured infrastructure

### 🔒 Security
- JWT authentication
- IAM least privilege
- Encryption at rest and in transit

### 📊 Monitoring
- CloudWatch dashboards
- Pre-configured alarms
- Detailed logging

### 💰 Cost Optimized
- Pay-per-use pricing
- Lifecycle policies
- Estimated ~$185/month for 1,000 users

### 🔧 Extensible
- Easy to add new agents
- Modular architecture
- Clear patterns

### 📚 Well Documented
- Comprehensive guides
- Code examples
- Best practices

## Getting Started

### Prerequisites
- AWS Account
- Node.js 18+
- AWS CLI configured
- AWS CDK CLI

### Installation

```bash
# 1. Clone
git clone <repo-url>
cd aws-energy-insights-starter-kit

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env

# 4. Deploy
npm run bootstrap
npm run deploy:dev

# 5. Test
npm run create-user
npm run test-agent "What's the weather in Seattle?"
```

## Example Queries

### Weather Agent
```
"What's the weather in Seattle?"
"Show me the forecast for New York"
```

### Calculator Agent
```
"Calculate 10 + 5"
"Calculate compound interest on $10,000 at 5% for 10 years"
"What is 25% of 200?"
```

### Data Analysis Agent
```
"Analyze the sales data in sales-2024.csv"
"Show me statistics for my-data.csv"
"Create visualizations for the dataset"
```

## Project Structure

```
starter-kit/
├── README.md                 # Main documentation
├── QUICK-START.md           # 15-minute guide
├── OVERVIEW.md              # This file
├── .env.example             # Environment template
├── package.json             # NPM configuration
│
├── cdk/                     # Infrastructure
│   ├── lib/
│   │   └── main-stack.ts   # CDK stack
│   └── lambda-functions/
│       ├── chat/           # Chat handler
│       │   └── agents/     # Agent implementations
│       ├── authorizer/     # JWT authorizer
│       └── tools/          # Tool Lambdas
│
├── examples/                # Example agents
│   ├── weather-agent/
│   ├── calculator-agent/
│   └── data-analysis-agent/
│
├── scripts/                 # Utilities
│   ├── deploy.sh
│   └── test-agent.js
│
└── docs/                    # Documentation
    └── adding-agents.md
```

## Cost Breakdown

For 1,000 users with 10 queries/user/day:

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| API Gateway | 300K requests | $1.05 |
| Lambda | 300K invocations | $25.00 |
| DynamoDB | 600K writes, 1.2M reads | $1.50 |
| S3 | 100 GB storage | $2.50 |
| Bedrock | 300K requests | $150.00 |
| CloudWatch | Logs and metrics | $5.00 |
| **Total** | | **~$185/month** |

## Common Use Cases

### 1. Customer Support Bot
- Natural language understanding
- Knowledge base integration
- Ticket creation

### 2. Data Analysis Platform
- CSV/Excel file analysis
- Statistical computations
- Visualization generation

### 3. Business Intelligence Assistant
- Query databases
- Generate reports
- Trend analysis

### 4. DevOps Assistant
- Infrastructure queries
- Log analysis
- Deployment automation

### 5. Research Assistant
- Literature search
- Data processing
- Report generation

## Customization

### Add Your Own Agent

1. Copy an example agent
2. Modify the logic
3. Update intent patterns
4. Deploy and test

See `docs/adding-agents.md` for detailed guide.

### Integrate External APIs

1. Add API credentials to `.env`
2. Create tool Lambda
3. Call from agent
4. Handle responses

### Add Visualizations

1. Generate artifacts in tool Lambda
2. Store in S3
3. Create React component
4. Register renderer

## Support

- **Documentation:** See `docs/` directory
- **Examples:** See `examples/` directory
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file

## Acknowledgments

Built for AWS re:Invent 2025 chalk talk presentation.

Based on production architecture from AWS Energy Data Insights platform.

## Next Steps

1. ✅ Deploy the starter kit
2. ✅ Test example agents
3. 📝 Read the documentation
4. 🔧 Create your first agent
5. 🚀 Deploy to production

## Resources

- [Quick Start Guide](QUICK-START.md)
- [Adding Agents Guide](docs/adding-agents.md)
- [Architecture Documentation](README.md#architecture-overview)
- [Example Agents](examples/)

---

**Ready to build AI agents? Let's go! 🚀**
