# AWS re:Invent Chalk Talk Handout
## Building Multi-Agent AI Systems with AWS Bedrock

---

## Quick Reference

### Starter Kit Access
**GitHub Repository**: https://github.com/[your-repo]/aws-agentcore-starter-kit

**QR Code**: [Scan to access repository]

```
█████████████████████████████
█████████████████████████████
████ ▄▄▄▄▄ █▀█ █▄█ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ █ █   █ ████
████ █▄▄▄█ █▀ █▀▄█ █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄▀ ▀▄█▄▄▄▄▄▄▄████
████ ▄▀▄  ▄ ▄▀▄▀▄▄ ▀▄█▄▀▄████
████▄▄ ▄▀▄▄▀▄▄▀▄▀▄▄▀▄▀▄▀▄████
████ ▄▄▄▄▄ █▄█▄▀▄▄▀▄▀▄▀▄▄████
████ █   █ █▄▀▄▀▄▀▄▀▄▀▄▀▄████
████ █▄▄▄█ █▀▄▀▄▀▄▀▄▀▄▀▄▀████
████▄▄▄▄▄▄▄█▄▄▄▄▄▄▄▄▄▄▄▄▄████
█████████████████████████████
```

### Community Support
- **Slack**: [slack-invite-url]
- **Email**: support@example.com
- **Office Hours**: Wednesdays 2-3 PM PT

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  React/Next.js → CloudFront → S3                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    API Layer                             │
│  API Gateway → Lambda Authorizer → Cognito             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Agent Layer                            │
│  Agent Router → Specialized Agents                      │
│  (Petrophysics, Renewable, Maintenance, General)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Orchestration Layer                         │
│  Orchestrator → Tool Lambdas                            │
│  (Terrain, Layout, Simulation, Report)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Data Layer                             │
│  DynamoDB (Messages, Sessions) + S3 (Artifacts)         │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    AI Layer                              │
│  AWS Bedrock (Claude 3.5 Sonnet)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Key Patterns

### 1. Agent Router Pattern

**Purpose**: Route queries to appropriate specialized agents

**Implementation**:
```typescript
class AgentRouter {
  private determineAgentType(message: string): AgentType {
    // Priority-based pattern matching
    if (this.matchesPatterns(message, edicraftPatterns)) {
      return 'edicraft';
    }
    if (this.matchesPatterns(message, renewablePatterns)) {
      return 'renewable';
    }
    if (this.matchesPatterns(message, petrophysicsPatterns)) {
      return 'petrophysics';
    }
    return 'general';
  }
}
```

**Key Points**:
- Priority-based matching
- Simple regex patterns
- Easy to extend
- Fallback to general agent

---

### 2. Async Processing Pattern

**Purpose**: Handle operations exceeding API Gateway timeout (29s)

**Implementation**:
```typescript
const TIMEOUT_MS = 25000;

try {
  response = await Promise.race([
    agentHandler(event),
    timeoutPromise
  ]);
} catch (error) {
  if (error.message === 'PROCESSING_TIMEOUT') {
    // Self-invoke asynchronously
    await lambdaClient.send(new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event',
      Payload: JSON.stringify(asyncPayload)
    }));
    
    return { processing: true };
  }
}
```

**Frontend Polling**:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const messages = await fetchMessages(sessionId);
    if (messages.length > previousCount) {
      setMessages(messages);
      if (messages[messages.length - 1].responseComplete) {
        clearInterval(interval);
      }
    }
  }, 2000);
}, [sessionId]);
```

---

### 3. Thought Steps Pattern

**Purpose**: Provide transparency into agent reasoning

**Interface**:
```typescript
interface ThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 
        'tool_selection' | 'execution' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'in_progress' | 'complete' | 'error';
  confidence?: number;
}
```

**Benefits**:
- User trust
- Debugging aid
- Professional appearance
- Real-time updates

---

## IAM Permissions Quick Reference

### Lambda Authorizer
```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:DescribeUserPool",
    "cognito-idp:DescribeUserPoolClient"
  ],
  "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
}
```

### Chat Lambda
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:Query",
    "s3:GetObject",
    "s3:PutObject",
    "bedrock:InvokeModel",
    "lambda:InvokeFunction"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/ChatMessage-*",
    "arn:aws:s3:::storage-bucket/*",
    "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-*",
    "arn:aws:lambda:*:*:function:*-calculator"
  ]
}
```

### Orchestrator Lambda
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:Query",
    "s3:PutObject",
    "lambda:InvokeFunction"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/SessionContext-*",
    "arn:aws:s3:::storage-bucket/*",
    "arn:aws:lambda:*:*:function:*-tools-*"
  ]
}
```

### Tool Lambda
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject"
  ],
  "Resource": "arn:aws:s3:::storage-bucket/*"
}
```

---

## Quick Start Guide

### 1. Clone Repository
```bash
git clone https://github.com/[repo]/aws-agentcore-starter-kit
cd aws-agentcore-starter-kit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure AWS
```bash
aws configure
# Enter your AWS credentials
```

### 4. Deploy
```bash
npm run deploy
```

### 5. Test
```bash
npm run test
```

### 6. Access Application
```bash
# URL will be output after deployment
open https://[your-cloudfront-url]
```

---

## Adding a New Agent

### Step 1: Create Agent Class
```typescript
// agents/myNewAgent.ts
import { BaseEnhancedAgent } from './BaseEnhancedAgent';

export class MyNewAgent extends BaseEnhancedAgent {
  async processMessage(message: string) {
    const thoughtSteps = [];
    
    thoughtSteps.push(this.createThoughtStep(
      'intent_detection',
      'Analyzing Request',
      'Understanding user intent'
    ));
    
    const result = await this.executeDomainLogic(message);
    
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
// agentRouter.ts
import { MyNewAgent } from './myNewAgent';

export class AgentRouter {
  private myNewAgent: MyNewAgent;
  
  constructor() {
    this.myNewAgent = new MyNewAgent();
  }
  
  private determineAgentType(message: string): AgentType {
    const myNewPatterns = [/my.*domain.*keyword/i];
    
    if (this.matchesPatterns(message, myNewPatterns)) {
      return 'mynew';
    }
    // ... existing patterns
  }
}
```

### Step 3: Deploy
```bash
npm run deploy
```

---

## Common Patterns Cheat Sheet

### Pattern Matching
```typescript
const patterns = [
  /calculate.*porosity/i,
  /analyze.*well/i,
  /correlation/i
];

const matches = patterns.some(p => p.test(query));
```

### Tool Invocation
```typescript
const result = await lambdaClient.send(new InvokeCommand({
  FunctionName: process.env.TOOL_FUNCTION_NAME,
  Payload: JSON.stringify({ params })
}));
```

### Artifact Storage
```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: process.env.STORAGE_BUCKET,
  Key: `artifacts/${artifactId}.json`,
  Body: JSON.stringify(artifact),
  ContentType: 'application/json'
}));
```

### Error Handling
```typescript
try {
  const result = await processQuery(query);
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    fallback: 'general_agent'
  };
}
```

---

## Performance Optimization

### Lambda Configuration
- **Memory**: 512MB - 1024MB for most agents
- **Timeout**: 30s for simple, 300s for orchestrators
- **Concurrency**: Set reserved concurrency for critical functions

### DynamoDB
- **On-Demand**: For variable workloads
- **Provisioned**: For predictable workloads
- **GSI**: For query patterns

### S3
- **Lifecycle**: Move old artifacts to Glacier
- **CloudFront**: Cache static artifacts
- **Compression**: Gzip artifacts before storage

---

## Troubleshooting

### Issue: Timeout Errors
**Solution**: Implement async processing pattern

### Issue: High Costs
**Solution**: 
- Reduce Lambda memory
- Optimize Bedrock token usage
- Implement caching

### Issue: Slow Responses
**Solution**:
- Increase Lambda memory
- Optimize database queries
- Add caching layer

### Issue: Authentication Failures
**Solution**:
- Check Cognito configuration
- Verify JWT token format
- Check Lambda authorizer logs

---

## Best Practices

### Security
- ✅ Use least privilege IAM policies
- ✅ Encrypt data at rest and in transit
- ✅ Validate all inputs
- ✅ Implement rate limiting
- ✅ Monitor for anomalies

### Performance
- ✅ Use async processing for long operations
- ✅ Implement caching where appropriate
- ✅ Optimize Lambda memory settings
- ✅ Use connection pooling
- ✅ Monitor cold starts

### Reliability
- ✅ Implement error handling at every layer
- ✅ Use exponential backoff for retries
- ✅ Provide fallback responses
- ✅ Monitor and alert on failures
- ✅ Test failure scenarios

### Cost Optimization
- ✅ Right-size Lambda functions
- ✅ Use on-demand DynamoDB for variable loads
- ✅ Implement S3 lifecycle policies
- ✅ Monitor and optimize Bedrock usage
- ✅ Use CloudWatch Insights for analysis

---

## Resources

### Documentation
- **Starter Kit**: https://github.com/[repo]/aws-agentcore-starter-kit
- **Integration Guide**: [url]/integration-guide
- **IAM Reference**: [url]/iam-reference
- **API Documentation**: [url]/api-docs

### Community
- **Slack**: [slack-url]
- **GitHub Discussions**: [github-discussions-url]
- **Stack Overflow**: Tag `aws-agentcore`

### Support
- **Email**: support@example.com
- **Office Hours**: Wednesdays 2-3 PM PT
- **GitHub Issues**: [github-issues-url]

### Learning
- **Workshop**: [workshop-url]
- **Video Tutorials**: [youtube-url]
- **Blog Posts**: [blog-url]

---

## Cost Estimation

### Typical Query Costs

**Simple Query** (2-3 seconds):
- Lambda: $0.0001
- Bedrock: $0.01
- DynamoDB: $0.0001
- **Total**: ~$0.01

**Complex Query** (30-40 seconds):
- Lambda: $0.001
- Bedrock: $0.03
- DynamoDB: $0.0005
- S3: $0.0001
- **Total**: ~$0.03

**Monthly Estimate** (1000 queries):
- Simple: $10
- Complex: $30
- **Total**: ~$40/month

---

## Next Steps

1. **Deploy Starter Kit**
   - Clone repository
   - Configure AWS credentials
   - Run deployment script

2. **Customize for Your Use Case**
   - Add domain-specific agents
   - Implement custom tools
   - Design artifact types

3. **Test Thoroughly**
   - Unit tests for routing
   - Integration tests for tools
   - End-to-end tests for workflows

4. **Monitor in Production**
   - Set up CloudWatch dashboards
   - Configure alerts
   - Track costs

5. **Join Community**
   - Share your implementation
   - Ask questions
   - Contribute improvements

---

## Contact Information

**Presenter**: [Name]
**Email**: [email]
**GitHub**: [github-profile]
**LinkedIn**: [linkedin-profile]

**Project Repository**: https://github.com/[repo]/aws-agentcore-starter-kit

**Feedback**: [feedback-form-url]

---

## Thank You!

We hope this handout helps you build amazing multi-agent AI systems with AWS Bedrock. Don't hesitate to reach out with questions or share your implementations with the community.

**Happy Building!** 🚀

---

*AWS re:Invent 2025 - Chalk Talk*
*Building Multi-Agent AI Systems with AWS Bedrock and AgentCore*
