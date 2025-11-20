# New Agent Integration Guide

## Overview

This guide provides a complete step-by-step process for integrating new AI agents into the AWS Energy Data Insights platform. Whether you're adding a new domain-specific agent or extending existing functionality, this guide will walk you through the entire process.

## Quick Navigation

- [Decision Tree](#decision-tree) - Choose between Agent vs Tool Lambda
- [Step-by-Step Guide](#step-by-step-integration) - Complete integration process
- [Code Templates](#code-templates) - Ready-to-use code snippets
- [Checklist](#integration-checklist) - Verification checklist
- [Examples](#example-integrations) - Real-world examples
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Decision Tree

### Should I Create an Agent or a Tool Lambda?

```
Start: What are you building?
    │
    ├─→ Conversational AI with natural language understanding?
    │   └─→ CREATE AN AGENT
    │       Examples: Maintenance Agent, EDIcraft Agent
    │
    ├─→ Specialized computation or data processing?
    │   └─→ CREATE A TOOL LAMBDA
    │       Examples: Terrain Analysis, Wake Simulation
    │
    ├─→ Multi-step workflow with multiple tools?
    │   └─→ CREATE AN ORCHESTRATOR + TOOL LAMBDAS
    │       Examples: Renewable Energy Orchestrator
    │
    └─→ Simple data retrieval or calculation?
        └─→ ADD TO EXISTING AGENT
            Examples: New petrophysics calculation
```

### Detailed Decision Matrix

| Criteria | Agent | Tool Lambda | Orchestrator |
|----------|-------|-------------|--------------|
| **Natural Language Processing** | ✅ Yes | ❌ No | ✅ Yes |
| **Conversational Context** | ✅ Yes | ❌ No | ✅ Yes |
| **Multiple Tool Coordination** | ⚠️ Limited | ❌ No | ✅ Yes |
| **Long-running Processing** | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **Specialized Computation** | ❌ No | ✅ Yes | ⚠️ Via Tools |
| **User Intent Detection** | ✅ Yes | ❌ No | ✅ Yes |
| **Thought Step Generation** | ✅ Yes | ❌ No | ✅ Yes |
| **Typical Timeout** | 60s | 300s | 300s |
| **Typical Memory** | 512 MB | 2048 MB | 1024 MB |

## Step-by-Step Integration

### Phase 1: Planning and Design

#### Step 1.1: Define Your Agent's Purpose

**Questions to Answer:**
- What domain does this agent serve?
- What types of queries will it handle?
- What data sources does it need?
- What outputs will it generate?
- Does it need specialized tools?

**Example: Geology Agent**
```
Domain: Geological interpretation
Queries: "Analyze fault patterns", "Identify depositional environments"
Data Sources: Seismic data, well logs, geological maps
Outputs: Interpretation reports, cross-sections, maps
Tools: Seismic processing, facies classification
```

#### Step 1.2: Design Intent Detection Patterns

Create regex patterns that will route queries to your agent:

```typescript
// Example patterns for Geology Agent
const geologyPatterns = [
  /geolog(y|ical)/i,
  /fault.*pattern/i,
  /depositional.*environment/i,
  /facies.*analysis/i,
  /seismic.*interpretation/i,
  /structural.*analysis/i
];
```

**Best Practices:**
- Use specific patterns to avoid false positives
- Include domain-specific terminology
- Add exclusion patterns if needed
- Test patterns against sample queries

#### Step 1.3: Define Artifact Types

Specify what visualizations or data your agent will return:

```typescript
// Example artifact types
interface GeologyArtifact {
  type: 'geological_interpretation' | 'fault_map' | 'facies_log';
  data: {
    messageContentType: string;
    title: string;
    content: any;
    metadata?: {
      wellName?: string;
      depthRange?: [number, number];
      confidence?: number;
    };
  };
}
```

### Phase 2: Backend Implementation

#### Step 2.1: Create Agent Class

**Location:** `cdk/lambda-functions/chat/agents/yourAgent.ts`

See [Code Templates](#agent-class-template) for complete template.

**Key Components:**
1. Extend `BaseEnhancedAgent`
2. Implement `processMessage()` method
3. Generate thought steps
4. Handle errors gracefully
5. Return structured response

#### Step 2.2: Register with Agent Router

**File:** `cdk/lambda-functions/chat/agents/agentRouter.ts`

```typescript
import { YourAgent } from './yourAgent';

export class AgentRouter {
  private yourAgent: YourAgent;
  
  constructor() {
    // ... existing agents
    this.yourAgent = new YourAgent();
  }
  
  private determineAgentType(message: string): AgentType {
    // Add your patterns at appropriate priority
    if (this.matchesPatterns(message, yourPatterns)) {
      return 'your_agent';
    }
    // ... existing patterns
  }
  
  async routeQuery(message: string, context?: SessionContext) {
    const agentType = this.determineAgentType(message);
    
    switch (agentType) {
      case 'your_agent':
        return await this.yourAgent.processMessage(message);
      // ... existing cases
    }
  }
}
```

#### Step 2.3: Create Tool Lambda (If Needed)

**Location:** `cdk/lambda-functions/your-tool/`

**For Python Tools:**
```
your-tool/
├── handler.py          # Lambda entry point
├── requirements.txt    # Python dependencies
├── tools/
│   ├── __init__.py
│   └── your_tool.py   # Tool implementation
└── tests/
    └── test_tool.py   # Unit tests
```

**For TypeScript Tools:**
```
your-tool/
├── handler.ts         # Lambda entry point
├── tool.ts           # Tool implementation
├── types.ts          # Type definitions
└── tests/
    └── tool.test.ts  # Unit tests
```

See [Code Templates](#tool-lambda-template) for complete templates.

#### Step 2.4: Configure Infrastructure (CDK)

**File:** `cdk/lib/main-stack.ts`

```typescript
// 1. Define the Lambda function
const yourToolFunction = new lambda.Function(this, 'YourToolFunction', {
  functionName: 'your-tool',
  runtime: lambda.Runtime.PYTHON_3_12, // or NODEJS_20_X
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/your-tool')),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024,
  environment: {
    STORAGE_BUCKET: storageBucket.bucketName,
    // Add other environment variables
  },
});

// 2. Grant permissions
storageBucket.grantReadWrite(yourToolFunction);

// 3. Allow chat Lambda to invoke
yourToolFunction.grantInvoke(chatFunction.function);

// 4. Add environment variable to chat Lambda
chatFunction.addEnvironment(
  'YOUR_TOOL_FUNCTION_NAME',
  yourToolFunction.functionName
);
```

### Phase 3: Frontend Implementation

#### Step 3.1: Create Artifact Component

**Location:** `src/components/artifacts/YourArtifact.tsx`

See [Code Templates](#artifact-component-template) for complete template.

**Key Features:**
- Responsive design
- Loading states
- Error handling
- Data visualization
- Export functionality

#### Step 3.2: Register Artifact Renderer

**File:** `src/components/ChatMessage.tsx`

```typescript
import { YourArtifact } from './artifacts/YourArtifact';

const renderArtifact = (artifact: any) => {
  switch (artifact.type) {
    case 'your_artifact_type':
      return <YourArtifact artifact={artifact} />;
    // ... existing cases
    default:
      return <div>Unknown artifact type: {artifact.type}</div>;
  }
};
```

#### Step 3.3: Add Type Definitions

**File:** `src/types/artifacts.ts`

```typescript
export interface YourArtifact {
  type: 'your_artifact_type';
  data: {
    messageContentType: 'your_artifact_type';
    title: string;
    content: any;
    metadata?: Record<string, any>;
  };
}

// Add to union type
export type Artifact = 
  | TerrainArtifact 
  | LayoutArtifact 
  | YourArtifact
  | ...;
```

### Phase 4: Testing and Validation

#### Step 4.1: Unit Tests

**Backend Tests:**
```typescript
// cdk/lambda-functions/chat/agents/__tests__/yourAgent.test.ts
describe('YourAgent', () => {
  it('should detect intent correctly', () => {
    const agent = new YourAgent();
    const result = agent.detectIntent('your test query');
    expect(result).toBe('your_intent');
  });
  
  it('should process message and return artifacts', async () => {
    const agent = new YourAgent();
    const result = await agent.processMessage('test query');
    expect(result.success).toBe(true);
    expect(result.artifacts).toHaveLength(1);
  });
});
```

**Frontend Tests:**
```typescript
// src/components/artifacts/__tests__/YourArtifact.test.tsx
describe('YourArtifact', () => {
  it('should render artifact data', () => {
    const artifact = { type: 'your_artifact_type', data: {...} };
    render(<YourArtifact artifact={artifact} />);
    expect(screen.getByText('Expected Content')).toBeInTheDocument();
  });
});
```

#### Step 4.2: Integration Tests

```bash
# Test agent routing
node tests/test-agent-routing.js

# Test tool invocation
node tests/test-your-tool.js

# Test end-to-end flow
node tests/test-your-agent-e2e.js
```

#### Step 4.3: Manual Testing

1. **Deploy to sandbox:**
   ```bash
   npx ampx sandbox
   ```

2. **Test in UI:**
   - Open chat interface
   - Send test queries
   - Verify artifacts render
   - Check console for errors

3. **Verify CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/chat --follow
   ```

### Phase 5: Documentation and Deployment

#### Step 5.1: Document Your Agent

Create documentation in `docs/agents/your-agent.md`:

```markdown
# Your Agent

## Purpose
[What this agent does]

## Supported Queries
- Query type 1
- Query type 2

## Example Usage
\`\`\`
User: "your example query"
Agent: [Expected response]
\`\`\`

## Artifacts Generated
- Artifact type 1: Description
- Artifact type 2: Description

## Configuration
- Environment variables
- Required permissions
- Dependencies
```

#### Step 5.2: Update Main Documentation

Add your agent to:
- `README.md` - Feature list
- `docs/architecture.md` - Architecture diagram
- `docs/api-reference.md` - API documentation

#### Step 5.3: Deploy to Production

```bash
# 1. Run all tests
npm test

# 2. Build CDK
npm run build

# 3. Review changes
cdk diff

# 4. Deploy
cdk deploy --profile prod

# 5. Verify deployment
node tests/verify-deployment.js

# 6. Smoke tests
node tests/smoke-test-your-agent.js
```

## Integration Checklist

Use this checklist to ensure complete integration:

### Planning Phase
- [ ] Agent purpose clearly defined
- [ ] Intent detection patterns designed
- [ ] Artifact types specified
- [ ] Data sources identified
- [ ] Tool requirements determined

### Backend Implementation
- [ ] Agent class created and extends BaseEnhancedAgent
- [ ] processMessage() method implemented
- [ ] Thought steps generated
- [ ] Error handling implemented
- [ ] Agent registered in AgentRouter
- [ ] Intent detection patterns added
- [ ] Routing case added to routeQuery()
- [ ] Tool Lambda created (if needed)
- [ ] CDK infrastructure configured
- [ ] IAM permissions granted
- [ ] Environment variables set

### Frontend Implementation
- [ ] Artifact component created
- [ ] Component handles loading states
- [ ] Component handles errors
- [ ] Artifact renderer registered
- [ ] Type definitions added
- [ ] Responsive design implemented

### Testing
- [ ] Unit tests written for agent
- [ ] Unit tests written for tool (if applicable)
- [ ] Unit tests written for component
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Manual testing completed
- [ ] CloudWatch logs verified

### Documentation
- [ ] Agent documentation created
- [ ] Main documentation updated
- [ ] Code comments added
- [ ] Example queries documented
- [ ] Troubleshooting guide created

### Deployment
- [ ] All tests passing
- [ ] CDK synthesizes without errors
- [ ] Changes reviewed with cdk diff
- [ ] Deployed to dev environment
- [ ] Smoke tests pass in dev
- [ ] Deployed to production
- [ ] Smoke tests pass in production
- [ ] Monitoring configured
- [ ] Alerts configured

## Code Templates

See the following files for complete code templates:
- [Agent Class Template](./templates/agent-template.ts)
- [Tool Lambda Template (Python)](./templates/tool-template-python.py)
- [Tool Lambda Template (TypeScript)](./templates/tool-template-typescript.ts)
- [Artifact Component Template](./templates/artifact-component-template.tsx)
- [Test Template](./templates/test-template.ts)

## Example Integrations

### Example 1: Simple Agent (No Tools)

**Use Case:** General knowledge agent that answers questions using Bedrock

**Components:**
- Agent class with Bedrock integration
- No tool Lambdas needed
- Simple text responses

**Implementation Time:** 2-4 hours

### Example 2: Agent with Single Tool

**Use Case:** Petrophysics agent with calculation tool

**Components:**
- Agent class for intent detection
- Tool Lambda for calculations
- Visualization component for results

**Implementation Time:** 1-2 days

### Example 3: Complex Orchestrator

**Use Case:** Renewable energy agent with multiple tools

**Components:**
- Proxy agent for routing
- Orchestrator Lambda
- Multiple tool Lambdas (terrain, layout, simulation, report)
- Multiple visualization components

**Implementation Time:** 1-2 weeks

## Troubleshooting

### Common Issues

#### Issue: Agent not receiving queries

**Symptoms:**
- Queries go to general agent instead
- Intent detection not working

**Solutions:**
1. Check pattern matching in `determineAgentType()`
2. Verify patterns are specific enough
3. Check pattern priority order
4. Add logging to see which patterns match

#### Issue: Tool Lambda timeout

**Symptoms:**
- Lambda execution exceeds timeout
- Incomplete results

**Solutions:**
1. Increase timeout in CDK configuration
2. Implement async processing pattern
3. Optimize tool computation
4. Break into smaller operations

#### Issue: Artifacts not rendering

**Symptoms:**
- "Visualization Unavailable" message
- Console errors about unknown artifact type

**Solutions:**
1. Verify artifact type matches renderer
2. Check artifact structure matches interface
3. Verify renderer is registered in ChatMessage.tsx
4. Check for console errors in browser

#### Issue: Permission denied errors

**Symptoms:**
- Lambda can't access S3/DynamoDB
- Access denied errors in CloudWatch

**Solutions:**
1. Verify IAM permissions in CDK
2. Check resource ARNs are correct
3. Verify Lambda role has required policies
4. Test permissions with AWS CLI

#### Issue: Environment variables not set

**Symptoms:**
- Lambda can't find other Lambdas
- Configuration errors

**Solutions:**
1. Verify environment variables in CDK
2. Restart sandbox after CDK changes
3. Check Lambda configuration in AWS Console
4. Verify variable names match code

### Debug Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/your-function --follow

# Test Lambda directly
aws lambda invoke \
  --function-name your-function \
  --payload '{"test": "data"}' \
  response.json

# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name your-function

# List environment variables
aws lambda get-function-configuration \
  --function-name your-function \
  --query "Environment.Variables"
```

## Best Practices

### Agent Design
1. **Single Responsibility**: Each agent should handle one domain
2. **Clear Intent Patterns**: Use specific, unambiguous patterns
3. **Graceful Degradation**: Handle errors without breaking user experience
4. **Thought Steps**: Always provide transparency into reasoning
5. **Consistent Responses**: Use standard response format

### Tool Design
1. **Idempotent**: Same input should produce same output
2. **Stateless**: Don't rely on external state
3. **Error Handling**: Return structured errors, not exceptions
4. **Logging**: Log inputs, outputs, and errors
5. **Performance**: Optimize for speed and memory

### Frontend Design
1. **Loading States**: Always show loading indicators
2. **Error States**: Display helpful error messages
3. **Responsive**: Work on all screen sizes
4. **Accessible**: Follow WCAG guidelines
5. **Performance**: Lazy load heavy components

## Support and Resources

- **Documentation**: `/docs`
- **Examples**: `/examples`
- **Tests**: `/tests`
- **Architecture Diagrams**: `.kiro/specs/reinvent-architecture-diagram/diagrams/`
- **IAM Reference**: `.kiro/specs/reinvent-architecture-diagram/iam-reference-cards/`

## Next Steps

After completing integration:

1. **Monitor Performance**: Watch CloudWatch metrics
2. **Gather Feedback**: Collect user feedback
3. **Iterate**: Improve based on usage patterns
4. **Optimize**: Tune performance and costs
5. **Document Learnings**: Update this guide with lessons learned

---

**Questions or Issues?**

If you encounter problems not covered in this guide, please:
1. Check CloudWatch logs for detailed errors
2. Review existing agent implementations
3. Consult the architecture documentation
4. Test with simplified inputs to isolate issues
