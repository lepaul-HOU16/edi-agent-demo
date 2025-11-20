# Visual Step-by-Step Integration Guide

This guide provides visual walkthroughs of the agent integration process with screenshots and diagrams.

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Creating the Agent](#2-creating-the-agent)
3. [Registering with Router](#3-registering-with-router)
4. [Creating Tool Lambda](#4-creating-tool-lambda)
5. [Configuring Infrastructure](#5-configuring-infrastructure)
6. [Building Frontend Component](#6-building-frontend-component)
7. [Testing and Deployment](#7-testing-and-deployment)

---

## 1. Project Setup

### Step 1.1: Verify Project Structure

Your project should have this structure:

```
project-root/
├── cdk/
│   ├── lambda-functions/
│   │   ├── chat/
│   │   │   └── agents/          ← Your agents go here
│   │   └── your-tool/           ← Your tools go here
│   └── lib/
│       └── main-stack.ts        ← Infrastructure config
├── src/
│   ├── components/
│   │   └── artifacts/           ← Frontend components
│   └── types/
│       └── artifacts.ts         ← Type definitions
└── tests/                       ← Test files
```

**Screenshot Placeholder:** `[Project structure in VS Code file explorer]`

### Step 1.2: Check Dependencies

Verify you have required dependencies:

```bash
# Check Node.js version
node --version  # Should be 18.x or 20.x

# Check AWS CDK
cdk --version   # Should be 2.x

# Check Python (if using Python tools)
python3 --version  # Should be 3.12
```

**Screenshot Placeholder:** `[Terminal showing version checks]`

---

## 2. Creating the Agent

### Step 2.1: Create Agent File

Create a new file in `cdk/lambda-functions/chat/agents/`:

```bash
cd cdk/lambda-functions/chat/agents
touch yourAgent.ts
```

**Screenshot Placeholder:** `[VS Code showing new file creation]`

### Step 2.2: Implement Agent Class

Open the file and start with the template:

```typescript
import { BaseEnhancedAgent } from './BaseEnhancedAgent';

export class YourAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }

  async processMessage(message: string): Promise<any> {
    // Your implementation here
  }
}
```

**Screenshot Placeholder:** `[VS Code showing agent class skeleton]`

### Step 2.3: Add Intent Detection

Implement the intent detection logic:

```typescript
private detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (/your.*pattern/.test(lowerMessage)) {
    return 'your_intent';
  }
  
  return 'general';
}
```

**Screenshot Placeholder:** `[VS Code showing intent detection method with syntax highlighting]`

### Step 2.4: Add Thought Steps

Generate thought steps for transparency:

```typescript
const thoughtSteps = [];

thoughtSteps.push({
  id: `step_${Date.now()}`,
  type: 'intent_detection',
  title: 'Analyzing Request',
  summary: 'Understanding user intent',
  status: 'complete'
});
```

**Screenshot Placeholder:** `[VS Code showing thought step generation]`

---

## 3. Registering with Router

### Step 3.1: Open Agent Router

Navigate to `cdk/lambda-functions/chat/agents/agentRouter.ts`

**Screenshot Placeholder:** `[VS Code file explorer with agentRouter.ts highlighted]`

### Step 3.2: Import Your Agent

Add import at the top of the file:

```typescript
import { YourAgent } from './yourAgent';
```

**Screenshot Placeholder:** `[VS Code showing import statement]`

### Step 3.3: Instantiate in Constructor

Add to the constructor:

```typescript
export class AgentRouter {
  private yourAgent: YourAgent;
  
  constructor() {
    // ... existing agents
    this.yourAgent = new YourAgent();
  }
}
```

**Screenshot Placeholder:** `[VS Code showing constructor with new agent]`

### Step 3.4: Add to determineAgentType

Add your patterns:

```typescript
private determineAgentType(message: string): AgentType {
  const lowerMessage = message.toLowerCase();
  
  // Your agent patterns
  const yourPatterns = [
    /pattern1/i,
    /pattern2/i
  ];
  
  if (this.matchesPatterns(lowerMessage, yourPatterns)) {
    return 'your_agent';
  }
  
  // ... existing patterns
}
```

**Screenshot Placeholder:** `[VS Code showing pattern matching logic]`

### Step 3.5: Add Routing Case

Add to the switch statement:

```typescript
async routeQuery(message: string, context?: SessionContext) {
  const agentType = this.determineAgentType(message);
  
  switch (agentType) {
    case 'your_agent':
      return await this.yourAgent.processMessage(message);
    // ... existing cases
  }
}
```

**Screenshot Placeholder:** `[VS Code showing switch statement with new case]`

---

## 4. Creating Tool Lambda

### Step 4.1: Create Tool Directory

```bash
cd cdk/lambda-functions
mkdir your-tool
cd your-tool
```

**Screenshot Placeholder:** `[Terminal showing directory creation]`

### Step 4.2: Create Handler File

For Python:
```bash
touch handler.py
touch requirements.txt
```

For TypeScript:
```bash
touch handler.ts
touch package.json
```

**Screenshot Placeholder:** `[VS Code showing new tool files]`

### Step 4.3: Implement Tool Logic

Python example:

```python
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Your tool logic here
        result = process_data(event)
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_data(event):
    # Your processing logic
    return {'success': True}
```

**Screenshot Placeholder:** `[VS Code showing Python handler implementation]`

### Step 4.4: Add Dependencies

For Python, edit `requirements.txt`:

```
boto3>=1.26.0
numpy>=1.24.0
pandas>=2.0.0
```

**Screenshot Placeholder:** `[VS Code showing requirements.txt]`

---

## 5. Configuring Infrastructure

### Step 5.1: Open CDK Stack

Navigate to `cdk/lib/main-stack.ts`

**Screenshot Placeholder:** `[VS Code showing main-stack.ts]`

### Step 5.2: Define Lambda Function

Add your Lambda function definition:

```typescript
const yourToolFunction = new lambda.Function(this, 'YourToolFunction', {
  functionName: 'your-tool',
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/your-tool')),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024,
  environment: {
    STORAGE_BUCKET: storageBucket.bucketName
  }
});
```

**Screenshot Placeholder:** `[VS Code showing Lambda function definition]`

### Step 5.3: Grant Permissions

Add IAM permissions:

```typescript
// Grant S3 access
storageBucket.grantReadWrite(yourToolFunction);

// Allow chat Lambda to invoke
yourToolFunction.grantInvoke(chatFunction.function);
```

**Screenshot Placeholder:** `[VS Code showing permission grants]`

### Step 5.4: Add Environment Variable

Add function name to chat Lambda:

```typescript
chatFunction.addEnvironment(
  'YOUR_TOOL_FUNCTION_NAME',
  yourToolFunction.functionName
);
```

**Screenshot Placeholder:** `[VS Code showing environment variable addition]`

### Step 5.5: Build and Synthesize

```bash
cd cdk
npm run build
cdk synth
```

**Screenshot Placeholder:** `[Terminal showing successful CDK synth]`

---

## 6. Building Frontend Component

### Step 6.1: Create Component File

```bash
cd src/components/artifacts
touch YourArtifact.tsx
```

**Screenshot Placeholder:** `[VS Code showing new component file]`

### Step 6.2: Implement Component

```typescript
import React from 'react';
import { Container, Box } from '@cloudscape-design/components';

export const YourArtifact: React.FC<{ artifact: any }> = ({ artifact }) => {
  return (
    <Container header={<h3>{artifact.data.title}</h3>}>
      <Box>
        {/* Your visualization here */}
      </Box>
    </Container>
  );
};
```

**Screenshot Placeholder:** `[VS Code showing component implementation]`

### Step 6.3: Register Component

Open `src/components/ChatMessage.tsx` and add:

```typescript
import { YourArtifact } from './artifacts/YourArtifact';

const renderArtifact = (artifact: any) => {
  switch (artifact.type) {
    case 'your_artifact_type':
      return <YourArtifact artifact={artifact} />;
    // ... existing cases
  }
};
```

**Screenshot Placeholder:** `[VS Code showing artifact registration]`

### Step 6.4: Add Type Definitions

Open `src/types/artifacts.ts`:

```typescript
export interface YourArtifact {
  type: 'your_artifact_type';
  data: {
    messageContentType: 'your_artifact_type';
    title: string;
    content: any;
  };
}
```

**Screenshot Placeholder:** `[VS Code showing type definition]`

---

## 7. Testing and Deployment

### Step 7.1: Run Unit Tests

```bash
npm test
```

**Screenshot Placeholder:** `[Terminal showing test results with all tests passing]`

### Step 7.2: Deploy to Sandbox

```bash
npx ampx sandbox
```

**Screenshot Placeholder:** `[Terminal showing sandbox deployment progress]`

### Step 7.3: Wait for Deployment

The deployment process takes 5-10 minutes. You'll see:

```
✓ Deploying resources...
✓ Creating Lambda functions...
✓ Configuring API Gateway...
✓ Setting up permissions...
✓ Deployment complete!
```

**Screenshot Placeholder:** `[Terminal showing successful deployment]`

### Step 7.4: Test in UI

Open the chat interface and test your agent:

**Screenshot Placeholder:** `[Browser showing chat interface]`

Type a test query:

**Screenshot Placeholder:** `[Chat interface with user query entered]`

View the response with artifacts:

**Screenshot Placeholder:** `[Chat interface showing AI response with artifacts]`

### Step 7.5: Check CloudWatch Logs

Open AWS Console → CloudWatch → Log Groups:

**Screenshot Placeholder:** `[AWS Console showing CloudWatch log groups]`

View your Lambda logs:

**Screenshot Placeholder:** `[CloudWatch Logs showing Lambda execution logs]`

### Step 7.6: Verify Artifacts in S3

Open AWS Console → S3 → Your bucket:

**Screenshot Placeholder:** `[AWS S3 Console showing stored artifacts]`

---

## Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Workflow                      │
└─────────────────────────────────────────────────────────────┘

1. CREATE AGENT
   ┌──────────────┐
   │ yourAgent.ts │
   └──────┬───────┘
          │
          ▼
2. REGISTER WITH ROUTER
   ┌──────────────────┐
   │ agentRouter.ts   │
   └──────┬───────────┘
          │
          ▼
3. CREATE TOOL (Optional)
   ┌──────────────┐
   │ handler.py   │
   └──────┬───────┘
          │
          ▼
4. CONFIGURE CDK
   ┌──────────────────┐
   │ main-stack.ts    │
   └──────┬───────────┘
          │
          ▼
5. BUILD FRONTEND
   ┌──────────────────────┐
   │ YourArtifact.tsx     │
   └──────┬───────────────┘
          │
          ▼
6. TEST & DEPLOY
   ┌──────────────────────┐
   │ npx ampx sandbox     │
   └──────┬───────────────┘
          │
          ▼
7. VERIFY
   ┌──────────────────────┐
   │ Test in UI           │
   │ Check CloudWatch     │
   │ Verify S3 artifacts  │
   └──────────────────────┘
```

---

## Common UI Patterns

### Pattern 1: Loading State

**Screenshot Placeholder:** `[UI showing loading spinner with "Analyzing..." text]`

### Pattern 2: Error State

**Screenshot Placeholder:** `[UI showing error message with retry button]`

### Pattern 3: Success with Artifacts

**Screenshot Placeholder:** `[UI showing response text with visualization below]`

### Pattern 4: Thought Steps

**Screenshot Placeholder:** `[UI showing expandable thought steps panel]`

---

## Debugging Visual Guide

### Issue: Agent Not Responding

**Step 1:** Check CloudWatch Logs

**Screenshot Placeholder:** `[CloudWatch showing error in logs]`

**Step 2:** Verify Environment Variables

**Screenshot Placeholder:** `[Lambda configuration showing environment variables]`

**Step 3:** Test Lambda Directly

**Screenshot Placeholder:** `[Lambda test console with test event]`

### Issue: Artifacts Not Rendering

**Step 1:** Check Browser Console

**Screenshot Placeholder:** `[Browser DevTools showing console errors]`

**Step 2:** Verify S3 Permissions

**Screenshot Placeholder:** `[IAM policy showing S3 permissions]`

**Step 3:** Check Artifact Type Matching

**Screenshot Placeholder:** `[VS Code showing artifact type comparison]`

---

## Success Indicators

### ✅ Backend Working

**Screenshot Placeholder:** `[CloudWatch logs showing successful Lambda execution]`

### ✅ Frontend Working

**Screenshot Placeholder:** `[Browser showing rendered artifact]`

### ✅ End-to-End Working

**Screenshot Placeholder:** `[Complete chat interaction with query, response, and artifacts]`

---

## Next Steps

After completing this visual guide:

1. ✅ Review your implementation against screenshots
2. ✅ Test all user workflows
3. ✅ Verify CloudWatch logs are clean
4. ✅ Check S3 artifacts are stored correctly
5. ✅ Document any custom configurations

For more details:
- [Integration Guide](./README.md)
- [Code Templates](./templates/)
- [Examples](./EXAMPLES.md)

---

**Note:** Screenshots marked with `[Placeholder]` should be replaced with actual screenshots from your implementation for use in presentations or documentation.
