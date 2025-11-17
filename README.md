# AWS Energy Data Insights Platform

**AI-powered platform for subsurface energy data analysis with conversational AI agents and professional petrophysical analysis capabilities.**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- Cognito user account (see [User Management Guide](./docs/cognito-user-management.md))

### Installation

```bash
# Clone repository
git clone <repository-url>
cd edi-agent-demo

# Install dependencies
npm install

# Install CDK dependencies
cd cdk && npm install && cd ..

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### Authentication

All users must authenticate with AWS Cognito to access the platform. See the [Authentication Guide](./docs/authentication-guide.md) for details.

**First-time users:**
1. Contact your administrator to create a Cognito user account
2. You'll receive a temporary password via email
3. Sign in at the application URL
4. Set your permanent password when prompted

**API access:**
All API requests require a valid JWT token. See [API Authentication Documentation](./docs/api-authentication.md) for details.

### Development

```bash
# Start frontend development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### Deployment

#### Manual Deployment

```bash
# Deploy CDK backend
cd cdk
npm run build
cdk deploy

# Deploy frontend to CloudFront
npm run build
aws s3 sync dist/ s3://energyinsights-development-frontend-development/
aws cloudfront create-invalidation --distribution-id E3O1QDG49S3NGP --paths "/*"
```

#### Automated Deployment (CI/CD)

**GitHub Actions** - Automatically deploy on push to main branch:

```bash
# Setup (one-time)
bash scripts/setup-github-actions.sh

# Then just push to main
git push origin main
```

See [GitHub Actions Setup Guide](./docs/GITHUB_ACTIONS_SETUP.md) for details.

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite build system
- AWS Cloudscape Design System
- Material-UI components
- Plotly.js for visualizations

**Backend:**
- AWS CDK (Infrastructure as Code)
- API Gateway (HTTP API)
- Lambda Functions (Node.js 20.x, Python 3.12)
- DynamoDB (data storage)
- S3 (file storage)
- Cognito (authentication)
- CloudFront (CDN)

**AI/ML:**
- AWS Bedrock (Claude 3.5 Sonnet)
- LangGraph agents
- Model Context Protocol (MCP) servers
- Custom petrophysical calculation engines

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront CDN                            │
│              https://d36sq31aqkfe46.cloudfront.net          │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼──────┐
    │ Frontend │          │  API GW    │
    │  (S3)    │          │ (HTTP API) │
    └──────────┘          └─────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │   Lambda Authorizer   │
                    │   (Cognito JWT)       │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐          ┌─────▼──────┐        ┌──────▼──────┐
   │   Chat   │          │  Sessions  │        │  Renewable  │
   │  Lambda  │          │   Lambda   │        │ Orchestrator│
   └────┬─────┘          └─────┬──────┘        └──────┬──────┘
        │                      │                       │
        │              ┌───────┴───────┐              │
        │              │               │              │
   ┌────▼─────┐  ┌────▼─────┐   ┌────▼─────┐  ┌─────▼──────┐
   │ DynamoDB │  │ DynamoDB │   │    S3    │  │  Bedrock   │
   │ChatMessage│  │ Project  │   │ Storage  │  │   Agent    │
   └──────────┘  └──────────┘   └──────────┘  └────────────┘
```

### API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

**Base URL:** `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`

#### Chat & Sessions
- `POST /api/chat/message` - Send chat message to AI agent
- `GET /api/chat/sessions` - List user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `DELETE /api/chat/sessions/{id}` - Delete chat session

#### Renewable Energy
- `POST /api/renewable/analyze` - Analyze renewable energy site
  - Terrain analysis
  - Wind farm layout optimization
  - Wake simulation
  - Wind rose generation

#### Projects & Collections
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection

#### Data Catalog
- `GET /api/catalog/map-data` - Get map visualization data
- `POST /api/catalog/search` - Search catalog

#### OSDU Integration
- `POST /api/osdu/search` - Search OSDU platform

#### Storage
- `GET /api/s3/{key}` - Get file from S3
- `POST /api/s3/{key}` - Upload file to S3
- `DELETE /api/s3/{key}` - Delete file from S3

#### Health & Utilities
- `GET /api/health` - API health check
- `GET /api/utility/info` - Get system information

---

## 🎯 Features

### ✅ Working Features

**Petrophysical Analysis:**
- Porosity calculations (density, neutron, effective, total)
- Shale volume assessment (Larionov, linear, Clavier methods)
- Water saturation (Archie equation)
- Professional log visualization
- Multi-well correlation
- Data quality assessment

**Chat Interface:**
- Conversational AI with Claude 3.5 Sonnet
- Chain of thought transparency
- Artifact rendering (plots, tables, reports)
- Session management
- Message history

**Data Catalog:**
- Interactive map visualization
- Well data discovery
- OSDU platform integration
- Search and filtering

**Renewable Energy:**
- Terrain analysis with OSM data
- Wind farm layout optimization
- Wake simulation
- Wind rose generation
- Professional reporting

### ⚠️ Known Issues

1. **MCP Server Cold Starts:** First request can take 2-3 minutes (Python package installation)
2. **Large Artifact Storage:** Some visualizations exceed DynamoDB limits (using S3 fallback)

---

## 🔧 Development

### Project Structure

```
/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── lib/              # API clients and utilities
│   └── services/         # Business logic
├── cdk/                   # AWS CDK infrastructure
│   ├── lib/              # CDK stack definitions
│   ├── lambda-functions/ # Lambda function code
│   └── bin/              # CDK app entry point
├── tests/                 # Test files
├── docs/                  # Documentation
└── .kiro/                # Kiro configuration
    └── steering/         # Development guidelines
```

### Key Files

- `cdk/lib/main-stack.ts` - Main CDK stack definition
- `cdk/lambda-functions/` - All Lambda function implementations
- `src/lib/api/client.ts` - REST API client
- `src/lib/auth/cognitoAuth.ts` - Authentication logic
- `.env.local` - Environment configuration

### Adding New Features

1. **Add Lambda Function:**
   ```typescript
   // cdk/lambda-functions/my-feature/handler.ts
   export const handler = async (event, context) => {
     // Implementation
   };
   ```

2. **Update CDK Stack:**
   ```typescript
   // cdk/lib/main-stack.ts
   const myFeatureLambda = new lambda.Function(this, 'MyFeature', {
     runtime: lambda.Runtime.NODEJS_20_X,
     handler: 'handler.handler',
     code: lambda.Code.fromAsset('lambda-functions/my-feature'),
   });
   
   httpApi.addRoutes({
     path: '/api/my-feature',
     methods: [apigw.HttpMethod.POST],
     integration: new HttpLambdaIntegration('MyFeatureIntegration', myFeatureLambda),
     authorizer: cognitoAuthorizer,
   });
   ```

3. **Deploy:**
   ```bash
   cd cdk
   npm run build
   cdk deploy
   ```

4. **Add Frontend Integration:**
   ```typescript
   // src/lib/api/myFeature.ts
   import { apiPost } from './client';
   
   export async function analyzeFeature(data: any) {
     return apiPost('/api/my-feature', data);
   }
   ```

### Testing

```bash
# Run frontend tests
npm test

# Run E2E tests
node tests/test-terrain-e2e.js
node tests/test-chat-functionality.js

# Test specific Lambda
aws lambda invoke --function-name EnergyInsights-development-chat \
  --payload '{"message":"test"}' response.json
```

### Monitoring

```bash
# View Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# View API Gateway logs
aws logs tail /aws/apigateway/EnergyInsights-development-http-api --follow

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name EnergyInsights-development
```

---

## 🚢 Deployment

### Prerequisites
- AWS account with appropriate permissions
- AWS CLI configured
- CDK CLI installed

### Deploy Backend

```bash
cd cdk
npm install
npm run build
cdk bootstrap  # First time only
cdk deploy
```

### Deploy Frontend

```bash
# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://energyinsights-development-frontend-development/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3O1QDG49S3NGP \
  --paths "/*"
```

### Environment Variables

Create `.env.local` with:

```bash
# API Configuration
VITE_API_URL=https://hbt1j807qf.execute-api.us-east-1.amazonaws.com

# Cognito Configuration (from CDK outputs)
VITE_USER_POOL_ID=us-east-1_sC6yswGji
VITE_USER_POOL_CLIENT_ID=18m99t0u39vi9614ssd8sf8vmb

# OSDU Configuration
EDI_PLATFORM_URL=https://osdu.vavourak.people.aws.dev
EDI_PARTITION=osdu
```

---

## 📊 Cost Estimation

**Monthly AWS Costs (estimated):**

- API Gateway: ~$3.50 (1M requests)
- Lambda: ~$10 (100K invocations, 512MB, 5s avg)
- DynamoDB: ~$5 (on-demand, 1M reads/writes)
- S3: ~$2 (100GB storage, 1M requests)
- CloudFront: ~$5 (100GB transfer)
- Cognito: Free tier (50K MAU)
- **Total: ~$25-30/month** (light usage)

**Cost Optimization:**
- Use DynamoDB on-demand pricing
- Enable S3 lifecycle policies
- Use CloudFront caching
- Monitor Lambda memory allocation

---

## 🔒 Security

- **Authentication:** AWS Cognito with JWT tokens (see [Authentication Guide](./docs/authentication-guide.md))
- **Authorization:** Lambda authorizer validates all requests
- **Token Security:** Tokens stored in memory, transmitted over HTTPS only
- **Password Policy:** Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **API Security:** CORS configured, HTTPS only, rate limiting enabled
- **Data Encryption:** At rest (S3, DynamoDB) and in transit (TLS)
- **IAM:** Least privilege principle for all Lambda functions
- **Monitoring:** Authentication events logged to CloudWatch

---

## 🐛 Troubleshooting

### Frontend not loading
```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id E3O1QDG49S3NGP

# Check S3 bucket
aws s3 ls s3://energyinsights-development-frontend-development/
```

### API returning 401 Unauthorized
```bash
# Get a valid JWT token
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_sC6yswGji \
  --client-id 18m99t0u39vi9614ssd8sf8vmb \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<user>,PASSWORD=<pass> \
  --region us-east-1

# Test API with token
TOKEN="<id-token-from-above>"
curl -X GET https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN"
```

See [API Authentication Documentation](./docs/api-authentication.md) for more details.

### Lambda function errors
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/<function-name> --follow

# Test Lambda directly
aws lambda invoke --function-name <function-name> \
  --payload '{}' response.json
```

### CDK deployment fails
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name EnergyInsights-development

# Rollback if needed
cdk destroy
cdk deploy
```

---

## 📚 Documentation

### User Documentation
- **[Authentication Guide](./docs/authentication-guide.md)** - How to sign in and use the platform
- **[API Authentication](./docs/api-authentication.md)** - API authentication and usage

### Administrator Documentation
- **[Cognito User Management](./docs/cognito-user-management.md)** - Creating and managing user accounts

### Developer Documentation
- **[INSTALLATION_AND_ARCHITECTURE.md](./INSTALLATION_AND_ARCHITECTURE.md)** - Detailed architecture and setup
- **[.kiro/steering/](./kiro/steering/)** - Development guidelines and best practices
- **[docs/](./docs/)** - Additional documentation and guides

---

## 🤝 Contributing

1. Follow the development guidelines in `.kiro/steering/`
2. Test all changes before committing
3. Update documentation for new features
4. Run regression tests to avoid breaking existing features

---

## 📝 License

[Your License Here]

---

## 🆘 Support

For issues or questions:
1. Check CloudWatch logs
2. Review documentation in `docs/`
3. Check development guidelines in `.kiro/steering/`
4. Contact the development team

---

**Built with AWS CDK, React, and Claude AI** 🚀
