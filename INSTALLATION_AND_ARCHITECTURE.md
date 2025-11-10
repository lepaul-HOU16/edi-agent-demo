# AWS Energy Data Insights Platform - Installation & Architecture Guide

**Version:** 2.0  
**Last Updated:** January 2025  
**Target Audience:** Development teams taking over this project

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Architecture](#platform-architecture)
3. [Technology Stack](#technology-stack)
4. [Installation Guide](#installation-guide)
5. [Agent Integration Pattern](#agent-integration-pattern)
6. [Current Agent Implementations](#current-agent-implementations)
7. [Known Issues & Workarounds](#known-issues--workarounds)
8. [Development Workflow](#development-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### What This Platform Does

AWS Energy Data Insights is a **multi-agent AI platform** for subsurface energy data analysis. It provides:

- **Conversational AI** for petrophysical analysis, well data exploration, and reservoir engineering
- **Specialized Agents** for maintenance planning, Minecraft-based visualization (EDIcraft), and renewable energy site design
- **Professional Visualizations** using Plotly.js, AWS Cloudscape, and custom React components
- **Real Data Integration** with S3, OSDU platform, and NREL Wind Toolkit
- **Chain of Thought** transparency showing agent reasoning process

### Platform Status

**✅ Working Features:**
- Petrophysical analysis (porosity, shale volume, saturation calculations)
- Well data discovery and multi-well correlation
- Professional Cloudscape UI components
- Chain of thought visualization
- OSDU search integration
- Agent progress tracking with polling

**⚠️ In Progress:**
- EDIcraft agent (Minecraft visualization) - deployment issues
- Renewable energy agents - needs testing
- Collection system - partially implemented

**❌ Known Broken:**
- Some renewable energy visualizations (terrain, layout)
- MCP server cold starts (2-3 minute delay)
- EDIcraft horizon interpolation

---


## Platform Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Chat Canvas  │  │  Catalog     │  │ Collections  │              │
│  │ (Agent UI)   │  │  (Map View)  │  │ (Data Mgmt)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                    GraphQL (AppSync)                                 │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                    Backend (AWS Amplify Gen 2)                       │
│                            │                                          │
│  ┌─────────────────────────▼──────────────────────────────┐         │
│  │         Agent Router (enhancedStrandsAgent)             │         │
│  │  - Intent detection                                     │         │
│  │  - Agent selection                                      │         │
│  │  - Response formatting                                  │         │
│  └─────┬──────────┬──────────┬──────────┬─────────────────┘         │
│        │          │          │          │                            │
│  ┌─────▼────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────────┐                 │
│  │Petrophys │ │Maint. │ │EDIcraft│ │ Renewable  │                 │
│  │  Agent   │ │Agent  │ │ Agent  │ │   Agents   │                 │
│  └─────┬────┘ └───┬───┘ └───┬────┘ └─────┬──────┘                 │
│        │          │          │            │                          │
│  ┌─────▼──────────▼──────────▼────────────▼──────┐                 │
│  │           Tool Layer (MCP Tools)                │                 │
│  │  - Petrophysics Calculator (Python)             │                 │
│  │  - OSDU Proxy                                   │                 │
│  │  - Renewable Tools (Terrain, Layout, etc.)     │                 │
│  │  - EDIcraft Tools (RCON, Horizon, Wellbore)    │                 │
│  └─────┬──────────┬──────────┬────────────┬───────┘                 │
│        │          │          │            │                          │
│  ┌─────▼────┐ ┌──▼────┐ ┌───▼────┐ ┌────▼─────┐                   │
│  │    S3    │ │DynamoDB│ │ OSDU  │ │Minecraft │                   │
│  │ Storage  │ │ Tables │ │Platform│ │  Server  │                   │
│  └──────────┘ └────────┘ └────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend Layer
- **Framework:** Next.js 14 with App Router
- **UI Libraries:** AWS Cloudscape, Material-UI, Plotly.js
- **State Management:** AWS Amplify client-side state
- **Key Pages:**
  - `/chat/[chatSessionId]` - Main agent canvas
  - `/catalog` - Data catalog with map view
  - `/collections/[collectionId]` - Collection management

#### Backend Layer (AWS Amplify Gen 2)
- **API:** GraphQL via AWS AppSync
- **Database:** DynamoDB (ChatMessage, ChatSession, AgentProgress tables)
- **Storage:** S3 for artifacts, LAS files, reports
- **Auth:** AWS Cognito User Pools

#### Agent Layer
- **Base Class:** `BaseEnhancedAgent` - Provides verbose thought step generation
- **Router:** `enhancedStrandsAgent` - Routes requests to specialized agents
- **Specialized Agents:**
  - Petrophysics Agent (well log analysis)
  - Maintenance Agent (equipment monitoring)
  - EDIcraft Agent (Minecraft visualization)
  - Renewable Agents (wind farm design)

#### Tool Layer
- **MCP Tools:** Model Context Protocol for extensible tool integration
- **Python Tools:** Petrophysics calculations, renewable energy analysis
- **TypeScript Tools:** OSDU proxy, catalog search, data retrieval

---


## Technology Stack

### Frontend Technologies
```json
{
  "framework": "Next.js 14.2.33",
  "runtime": "React 18.2.0",
  "ui_libraries": [
    "@cloudscape-design/components@3.0.1025",
    "@mui/material@6.3.1",
    "plotly.js@3.1.0"
  ],
  "styling": ["tailwindcss@3.4.1", "sass@1.89.2"],
  "state": "aws-amplify@6.12.0"
}
```

### Backend Technologies
```json
{
  "platform": "AWS Amplify Gen 2",
  "runtime": "Node.js 20.x (Lambda)",
  "python_runtime": "Python 3.12 (Lambda)",
  "database": "DynamoDB",
  "storage": "S3",
  "api": "GraphQL (AppSync)",
  "auth": "Cognito User Pools"
}
```

### AI/ML Stack
```json
{
  "models": [
    "Claude 3.5 Sonnet (us.anthropic.claude-3-5-sonnet-20241022-v2:0)",
    "Claude 3.7 Sonnet (us.anthropic.claude-3-7-sonnet-20250219-v1:0)"
  ],
  "frameworks": [
    "AWS Bedrock",
    "Bedrock AgentCore",
    "Strands Agents"
  ],
  "tools": "Model Context Protocol (MCP)"
}
```

### Key Dependencies

**Critical Production Dependencies:**
- `aws-amplify` - AWS services integration
- `@aws-sdk/client-s3` - S3 file operations
- `@aws-sdk/client-lambda` - Lambda invocations
- `@aws-sdk/client-bedrock-agent-runtime` - Bedrock agent calls
- `@cloudscape-design/components` - Professional UI components
- `plotly.js` - Scientific visualizations
- `react-plotly.js` - React wrapper for Plotly

**Development Dependencies:**
- `aws-cdk-lib@2.189.1` - Infrastructure as code
- `typescript@5.7.2` - Type safety
- `jest@30.1.3` - Testing framework

---


## Installation Guide

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **Node.js** 20.x or later
3. **Python** 3.12 (for Python Lambda functions)
4. **AWS CLI** configured with credentials
5. **Git** for version control

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd digital-assistant

# Install Node.js dependencies
npm install

# Install Python dependencies (for local development)
pip install -r requirements-deployment.txt
```

### Step 2: Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your values
nano .env.local
```

**Required Environment Variables:**

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=<your-account-id>

# Amplify Configuration
AMPLIFY_APP_ID=<your-app-id>
AMPLIFY_BRANCH=main

# S3 Storage
S3_BUCKET=<your-bucket-name>

# Bedrock Models
AGENT_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0

# OSDU Platform (Optional)
OSDU_API_URL=https://community.opensubsurface.org
OSDU_API_KEY=<your-api-key>

# EDIcraft Agent (Optional)
BEDROCK_AGENT_ID=<your-agent-id>
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
MINECRAFT_HOST=<minecraft-server-host>
MINECRAFT_PORT=49001
MINECRAFT_RCON_PASSWORD=<rcon-password>

# NREL Wind Toolkit (Optional)
NREL_API_KEY=<your-nrel-api-key>
```

### Step 3: Deploy Backend (Sandbox)

```bash
# Start Amplify sandbox (development environment)
npx ampx sandbox

# This will:
# 1. Deploy all Lambda functions
# 2. Create DynamoDB tables
# 3. Set up S3 buckets
# 4. Configure AppSync GraphQL API
# 5. Stream function logs to console
```

**Expected Output:**
```
[Sandbox] Deploying...
[Sandbox] ✅ Deployed: data
[Sandbox] ✅ Deployed: auth
[Sandbox] ✅ Deployed: storage
[Sandbox] ✅ Deployed: agentFunction
[Sandbox] ✅ Deployed: renewableOrchestrator
[Sandbox] Sandbox ready!
```

### Step 4: Start Frontend Development Server

```bash
# In a new terminal (keep sandbox running)
npm run dev

# Frontend will be available at:
# http://localhost:3000
```

### Step 5: Verify Installation

1. **Open browser:** Navigate to `http://localhost:3000`
2. **Sign up/Sign in:** Create a test account
3. **Test basic query:** Type "list wells" in the chat
4. **Expected result:** Should see list of available wells

---


## Agent Integration Pattern

### Overview: How to Add a New Agent

This platform has evolved a **scalable, comprehensive pattern** for integrating new AI agents. Despite early challenges, we've developed a robust system that allows new agents to be added with minimal friction.

### The Agent Integration Lifecycle

```
1. Define Agent Purpose
   ↓
2. Create Agent Handler
   ↓
3. Implement Tool Functions
   ↓
4. Register in Backend
   ↓
5. Add Frontend Components
   ↓
6. Test & Deploy
```

### Step-by-Step: Adding a New Agent

#### Step 1: Define Agent Purpose

**Questions to Answer:**
- What specific domain does this agent handle?
- What tools/APIs does it need access to?
- What artifacts (visualizations, reports) will it generate?
- What user workflows will it support?

**Example:** Maintenance Agent
- **Domain:** Equipment monitoring and maintenance planning
- **Tools:** Well equipment data, maintenance schedules, sensor data
- **Artifacts:** Maintenance reports, equipment health dashboards
- **Workflows:** Predictive maintenance, equipment diagnostics

#### Step 2: Create Agent Handler

**Location:** `amplify/functions/<agentName>/`

**File Structure:**
```
amplify/functions/maintenanceAgent/
├── handler.ts          # Lambda entry point
├── maintenanceStrandsAgent.ts  # Agent logic
├── resource.ts         # Lambda configuration
└── tools/              # Agent-specific tools
    ├── equipmentTools.ts
    └── maintenanceTools.ts
```

**Handler Template (`handler.ts`):**

```typescript
import { AppSyncResolverEvent } from 'aws-lambda';
import { MyCustomAgent } from './myCustomAgent.js';

type MyAgentResponse = {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
};

export const handler = async (
  event: AppSyncResolverEvent<any>, 
  context: any
): Promise<MyAgentResponse> => {
  console.log('=== MY CUSTOM AGENT INVOKED ===');
  
  try {
    // Extract user ID
    const userId = event.arguments.userId || 
      (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");

    // Get S3 bucket from environment
    const s3Bucket = process.env.S3_BUCKET || '';
    
    // Initialize agent
    const agent = new MyCustomAgent(
      event.arguments.foundationModelId, 
      s3Bucket
    );
    
    // Process message
    const response = await agent.processMessage(event.arguments.message);
    
    // Return response
    return {
      success: response.success,
      message: response.message || 'No response generated',
      artifacts: response.artifacts || [],
      thoughtSteps: response.thoughtSteps || []
    };

  } catch (error) {
    console.error('=== MY AGENT ERROR ===', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      artifacts: [],
      thoughtSteps: []
    };
  }
};
```

---


**Agent Logic Template (`myCustomAgent.ts`):**

```typescript
import { BaseEnhancedAgent, VerboseThoughtStep } from '../agents/BaseEnhancedAgent';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export class MyCustomAgent extends BaseEnhancedAgent {
  private modelId: string;
  private s3Client: S3Client;
  private s3Bucket: string;

  constructor(modelId?: string, s3Bucket?: string) {
    super(true); // Enable verbose logging
    
    this.modelId = modelId || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.s3Bucket = s3Bucket || process.env.S3_BUCKET || '';
    this.s3Client = new S3Client({ region: 'us-east-1' });
    
    console.log('MyCustomAgent initialized');
  }

  /**
   * Main message processing method
   */
  async processMessage(message: string): Promise<any> {
    console.log('Processing message:', message);
    
    // Clear previous thought steps
    this.clearThoughtSteps();
    
    try {
      // STEP 1: Intent Detection
      const intentStep = this.addThoughtStep(
        'intent_detection',
        'Analyzing User Request',
        'Determining what the user wants to accomplish',
        { query: message }
      );
      
      const intent = this.detectIntent(message);
      
      this.completeThoughtStep(intentStep.id, {
        details: JSON.stringify({ intent })
      });
      
      // STEP 2: Data Retrieval
      const dataStep = this.addThoughtStep(
        'data_retrieval',
        'Fetching Required Data',
        'Retrieving data from S3 and other sources',
        { dataSource: 'S3', bucket: this.s3Bucket }
      );
      
      const data = await this.fetchData(intent);
      
      this.completeThoughtStep(dataStep.id, {
        details: JSON.stringify({ recordCount: data.length })
      });
      
      // STEP 3: Processing
      const processStep = this.addThoughtStep(
        'calculation',
        'Processing Data',
        'Applying business logic and calculations',
        { method: intent.method }
      );
      
      const results = await this.processData(data, intent);
      
      this.completeThoughtStep(processStep.id, {
        details: JSON.stringify({ resultsCount: results.length })
      });
      
      // STEP 4: Generate Artifacts
      const artifactStep = this.addThoughtStep(
        'completion',
        'Generating Visualizations',
        'Creating interactive artifacts for display',
        { artifactType: 'chart' }
      );
      
      const artifacts = await this.generateArtifacts(results);
      
      this.completeThoughtStep(artifactStep.id, {
        details: JSON.stringify({ artifactCount: artifacts.length })
      });
      
      // Return response with thought steps
      return {
        success: true,
        message: this.formatResponse(results),
        artifacts: artifacts,
        thoughtSteps: this.getThoughtSteps()
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error thought step
      const errorStep = this.addThoughtStep(
        'error',
        'Error Occurred',
        'An error occurred during processing',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        artifacts: [],
        thoughtSteps: this.getThoughtSteps()
      };
    }
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): any {
    const query = message.toLowerCase();
    
    // Simple pattern matching
    if (query.includes('analyze')) {
      return { type: 'analyze', method: 'comprehensive' };
    } else if (query.includes('report')) {
      return { type: 'report', method: 'summary' };
    } else {
      return { type: 'general', method: 'default' };
    }
  }

  /**
   * Fetch data from S3 or other sources
   */
  private async fetchData(intent: any): Promise<any[]> {
    // Implement data fetching logic
    return [];
  }

  /**
   * Process data according to intent
   */
  private async processData(data: any[], intent: any): Promise<any[]> {
    // Implement processing logic
    return [];
  }

  /**
   * Generate artifacts (visualizations, reports)
   */
  private async generateArtifacts(results: any[]): Promise<any[]> {
    // Implement artifact generation
    return [];
  }

  /**
   * Format response message
   */
  private formatResponse(results: any[]): string {
    return `Analysis complete. Found ${results.length} results.`;
  }
}
```

---


**Resource Configuration (`resource.ts`):**

```typescript
import { defineFunction } from '@aws-amplify/backend';

export const myCustomAgentFunction = defineFunction({
  name: 'myCustomAgent',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  resourceGroupName: 'data',
  environment: {
    // Static environment variables
    AGENT_MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    // Dynamic variables set in backend.ts
  }
});
```

#### Step 3: Register Agent in Backend

**File:** `amplify/backend.ts`

```typescript
// 1. Import the agent function
import { myCustomAgentFunction } from './functions/myCustomAgent/resource';

// 2. Register in defineBackend
const backend = defineBackend({
  auth,
  data,
  storage,
  // ... other functions
  myCustomAgentFunction,  // Add your agent here
});

// 3. Add IAM permissions
backend.myCustomAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`
    ]
  })
);

// 4. Add Bedrock permissions (if using AI models)
backend.myCustomAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['bedrock:InvokeModel*'],
    resources: [
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`
    ]
  })
);

// 5. Add environment variables
backend.myCustomAgentFunction.addEnvironment(
  'S3_BUCKET',
  backend.storage.resources.bucket.bucketName
);

// 6. Export function name as CloudFormation output
new CfnOutput(backend.stack, 'MyCustomAgentFunctionName', {
  value: backend.myCustomAgentFunction.resources.lambda.functionName,
  description: 'My Custom Agent Lambda function name',
  exportName: 'MyCustomAgentFunctionName'
});

console.log('✅ My Custom Agent configured');
```

#### Step 4: Add GraphQL Mutation

**File:** `amplify/data/resource.ts`

```typescript
// 1. Import the agent function
import { myCustomAgentFunction } from '../functions/myCustomAgent/resource';

// 2. Add mutation to schema
export const schema = a.schema({
  // ... existing models
  
  invokeMyCustomAgent: a.mutation()
    .arguments({
      chatSessionId: a.id().required(),
      message: a.string().required(),
      foundationModelId: a.string(),
      userId: a.string(),
    })
    .returns(a.customType({
      success: a.boolean().required(),
      message: a.string().required(),
      artifacts: a.json().array(),
      thoughtSteps: a.json().array()
    }))
    .handler(a.handler.function(myCustomAgentFunction))
    .authorization((allow) => [allow.authenticated()]),
});

// 3. Export the function
export { myCustomAgentFunction };
```

---


#### Step 5: Add Frontend Integration

**Create Agent Landing Page:**

**File:** `src/components/agent-landing-pages/MyCustomAgentLanding.tsx`

```typescript
import React from 'react';
import { Container, Header, SpaceBetween, Button } from '@cloudscape-design/components';

interface MyCustomAgentLandingProps {
  onPromptSelect: (prompt: string) => void;
}

export const MyCustomAgentLanding: React.FC<MyCustomAgentLandingProps> = ({ 
  onPromptSelect 
}) => {
  const preloadedPrompts = [
    {
      title: "Analyze Equipment Health",
      description: "Get comprehensive health analysis for all equipment",
      prompt: "Analyze equipment health across all wells"
    },
    {
      title: "Generate Maintenance Report",
      description: "Create detailed maintenance planning report",
      prompt: "Generate maintenance report for next quarter"
    },
    {
      title: "Predict Failures",
      description: "Identify equipment at risk of failure",
      prompt: "Predict equipment failures in the next 30 days"
    }
  ];

  return (
    <Container
      header={
        <Header variant="h1">
          🔧 My Custom Agent
        </Header>
      }
    >
      <SpaceBetween size="l">
        <div>
          <p>
            I'm your AI assistant for [describe agent purpose]. 
            I can help you with:
          </p>
          <ul>
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
        </div>

        <div>
          <Header variant="h3">Quick Start Prompts</Header>
          <SpaceBetween size="s">
            {preloadedPrompts.map((prompt, index) => (
              <Button
                key={index}
                onClick={() => onPromptSelect(prompt.prompt)}
                variant="normal"
              >
                {prompt.title}
              </Button>
            ))}
          </SpaceBetween>
        </div>
      </SpaceBetween>
    </Container>
  );
};
```

**Add Agent Switcher Integration:**

**File:** `src/components/AgentSwitcher.tsx`

```typescript
// Add your agent to the agent list
const agents = [
  { id: 'auto', name: 'Auto-Select', icon: '🤖' },
  { id: 'petrophysics', name: 'Petrophysics', icon: '🔬' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧' },
  { id: 'edicraft', name: 'EDIcraft', icon: '🎮' },
  { id: 'renewable', name: 'Renewable Energy', icon: '🌬️' },
  { id: 'mycustom', name: 'My Custom Agent', icon: '⚡' },  // Add here
];
```

**Add Message Component (if needed):**

**File:** `src/components/messageComponents/MyCustomResponseComponent.tsx`

```typescript
import React from 'react';

interface MyCustomResponseProps {
  artifact: any;
}

export const MyCustomResponseComponent: React.FC<MyCustomResponseProps> = ({ 
  artifact 
}) => {
  return (
    <div className="my-custom-response">
      <h3>{artifact.title}</h3>
      {/* Render your custom visualization */}
      <div>{JSON.stringify(artifact.data)}</div>
    </div>
  );
};
```

**Register Component in ChatMessage:**

**File:** `src/components/ChatMessage.tsx`

```typescript
import { MyCustomResponseComponent } from './messageComponents/MyCustomResponseComponent';

// In the artifact rendering section:
case 'my_custom_artifact_type':
  return <MyCustomResponseComponent artifact={artifact} />;
```

---


#### Step 6: Test & Deploy

**Create Test File:**

**File:** `tests/test-my-custom-agent.js`

```javascript
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testMyCustomAgent() {
  const client = new LambdaClient({ region: 'us-east-1' });
  
  const payload = {
    arguments: {
      chatSessionId: 'test-session-123',
      message: 'Analyze equipment health',
      userId: 'test-user',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
    },
    identity: {
      sub: 'test-user'
    }
  };
  
  const command = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant-myCustomAgent-<hash>',
    Payload: JSON.stringify(payload)
  });
  
  try {
    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('✅ Test Result:', JSON.stringify(result, null, 2));
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Artifacts:', result.artifacts?.length || 0);
    console.log('Thought Steps:', result.thoughtSteps?.length || 0);
    
    return result.success;
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  }
}

testMyCustomAgent();
```

**Run Tests:**

```bash
# Test Lambda directly
node tests/test-my-custom-agent.js

# Test through GraphQL
npm run test:graphql

# Test in browser
npm run dev
# Navigate to http://localhost:3000/chat/new
# Select "My Custom Agent" from agent switcher
# Type test message
```

**Deploy to Production:**

```bash
# Stop sandbox
Ctrl+C

# Deploy to production
npx ampx pipeline-deploy --branch main --app-id <your-app-id>

# Verify deployment
aws lambda list-functions | grep myCustomAgent
```

---

### Key Patterns & Best Practices

#### 1. Always Extend BaseEnhancedAgent

```typescript
export class MyAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }
}
```

**Benefits:**
- Automatic thought step generation
- Consistent logging
- Error handling
- Performance metrics

#### 2. Use Thought Steps for Transparency

```typescript
// Start a step
const step = this.addThoughtStep(
  'data_retrieval',
  'Fetching Well Data',
  'Retrieving LAS files from S3',
  { wellName: 'WELL-001', bucket: 's3-bucket' }
);

// Do work...
const data = await fetchData();

// Complete the step
this.completeThoughtStep(step.id, {
  details: JSON.stringify({ recordCount: data.length })
});
```

#### 3. Handle Errors Gracefully

```typescript
try {
  // Do work
} catch (error) {
  this.errorThoughtStep(step.id, error, {
    context: 'Additional error context'
  });
  
  return {
    success: false,
    message: `Error: ${error.message}`,
    thoughtSteps: this.getThoughtSteps()
  };
}
```

#### 4. Generate Artifacts for Visualization

```typescript
const artifacts = [{
  type: 'my_custom_chart',
  title: 'Equipment Health Dashboard',
  data: {
    chartType: 'bar',
    values: [1, 2, 3, 4, 5],
    labels: ['A', 'B', 'C', 'D', 'E']
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    dataSource: 'S3'
  }
}];

return {
  success: true,
  message: 'Analysis complete',
  artifacts: artifacts,
  thoughtSteps: this.getThoughtSteps()
};
```

---


## Current Agent Implementations

### 1. Petrophysics Agent (Enhanced Strands Agent)

**Status:** ✅ Fully Working

**Purpose:** Professional petrophysical analysis of well log data

**Location:** `amplify/functions/agents/enhancedStrandsAgent.ts`

**Capabilities:**
- Porosity calculations (density, neutron, effective, total)
- Shale volume analysis (Larionov, Clavier methods)
- Water saturation (Archie equation)
- Multi-well correlation
- Data quality assessment
- Formation evaluation workflows

**Key Features:**
- Extends `BaseEnhancedAgent` for verbose thought steps
- MCP tool integration for calculations
- Professional SPE/API standard responses
- Interactive Cloudscape visualizations

**Example Usage:**
```
"Calculate porosity for WELL-001 using density method"
"Perform multi-well correlation for WELL-001, WELL-002, WELL-003"
"Analyze data quality for WELL-001"
```

**Artifacts Generated:**
- `cloudscape_porosity_display` - Interactive porosity charts
- `cloudscape_shale_volume_display` - Shale volume analysis
- `cloudscape_multi_well_correlation` - Correlation panels
- `cloudscape_data_quality_display` - Quality metrics

---

### 2. Maintenance Agent

**Status:** ✅ Working (Needs More Testing)

**Purpose:** Equipment monitoring and predictive maintenance

**Location:** `amplify/functions/maintenanceAgent/`

**Capabilities:**
- Equipment health monitoring
- Maintenance schedule planning
- Sensor data analysis
- Predictive failure detection
- Maintenance report generation

**Key Features:**
- Workflow tracking with audit trail
- Equipment health scoring
- Alert generation
- Professional maintenance reports

**Example Usage:**
```
"Analyze equipment health for all wells"
"Generate maintenance report for next quarter"
"Identify equipment at risk of failure"
```

**Artifacts Generated:**
- `maintenance_report` - Comprehensive maintenance plans
- `equipment_health_dashboard` - Health metrics visualization
- `alert_summary` - Critical alerts and recommendations

---

### 3. EDIcraft Agent

**Status:** ⚠️ Partially Working (Deployment Issues)

**Purpose:** Minecraft-based 3D visualization of subsurface data

**Location:** `amplify/functions/edicraftAgent/`

**Capabilities:**
- Wellbore trajectory visualization in Minecraft
- Horizon surface rendering
- OSDU platform integration
- Player position tracking
- Coordinate transformation (UTM ↔ Minecraft)

**Key Features:**
- Bedrock AgentCore integration
- RCON protocol for Minecraft commands
- Deterministic intent classification
- Hybrid routing (direct tool calls + LLM)

**Known Issues:**
- Horizon interpolation needs fixing
- Cold start delays (2-3 minutes)
- Environment variable configuration complexity

**Example Usage:**
```
"Build wellbore trajectory for WELL-001"
"Visualize horizon surface in Minecraft"
"Track my player position"
```

**Artifacts Generated:**
- None (visualization occurs in Minecraft world)

**Deployment Guide:** See `edicraft-agent/DEPLOYMENT_GUIDE.md`

---

### 4. Renewable Energy Agents

**Status:** ⚠️ Needs Testing

**Purpose:** Wind farm site design and layout optimization

**Location:** `amplify/functions/renewableAgents/`

**Capabilities:**
- Terrain analysis with OSM data
- Wind resource assessment (NREL Wind Toolkit)
- Turbine layout optimization (py-wake)
- Wake simulation
- Energy production forecasting
- Professional report generation

**Key Features:**
- Strands Agents framework
- Docker-based Lambda for py-wake
- Real NREL wind data integration
- Project persistence with DynamoDB
- AWS Location Service for geocoding

**Known Issues:**
- Some visualizations not rendering
- Needs comprehensive testing
- Cold start delays for Docker Lambda

**Example Usage:**
```
"Analyze wind farm site at coordinates 35.0, -101.4"
"Optimize turbine layout for maximum energy production"
"Generate wind rose for site analysis"
```

**Artifacts Generated:**
- `wind_farm_terrain_analysis` - Terrain suitability maps
- `wind_farm_layout_optimization` - Optimized turbine positions
- `wind_rose_visualization` - Wind direction/speed analysis
- `wind_farm_report` - Comprehensive site assessment

---


## Known Issues & Workarounds

### Critical Issues

#### 1. MCP Server Cold Starts (2-3 Minute Delay)

**Problem:** First request to MCP server takes 2-3 minutes due to Lambda cold start

**Root Cause:** 
- Python Lambda with heavy dependencies (pandas, numpy, scipy)
- No provisioned concurrency configured
- Large deployment package size

**Workaround:**
```typescript
// Enable provisioned concurrency in backend.ts
const ENABLE_PROVISIONED_CONCURRENCY = true;

if (ENABLE_PROVISIONED_CONCURRENCY) {
  const version = lambdaFunction.currentVersion;
  const alias = new lambda.Alias(backend.stack, 'ProvisionedAlias', {
    aliasName: 'provisioned',
    version: version,
    provisionedConcurrentExecutions: 1
  });
}
```

**Cost:** ~$32.85/month for 1 warm instance

**Status:** Optional feature, disabled by default

---

#### 2. EDIcraft Horizon Interpolation Broken

**Problem:** Horizon surfaces not rendering correctly in Minecraft

**Root Cause:**
- Y-level calculation issues
- Interpolation algorithm needs refinement
- Coordinate transformation errors

**Workaround:**
- Use wellbore trajectories instead of horizons
- Manual horizon building in Minecraft
- Fix in progress: `tests/test-horizon-interpolation-fix.py`

**Status:** ⚠️ In Progress

---

#### 3. Renewable Energy Visualizations Not Rendering

**Problem:** Terrain and layout visualizations show "Visualization Unavailable"

**Root Cause:**
- HTML artifacts too large for DynamoDB (>400KB)
- S3 storage not properly configured
- Artifact retrieval failures

**Workaround:**
```python
# Reduce HTML size by simplifying visualizations
fig.update_layout(
    template='simple_white',  # Simpler template
    showlegend=False,  # Remove legend
    margin=dict(l=20, r=20, t=40, b=20)  # Smaller margins
)

# Store in S3 instead of DynamoDB
s3_key = f'renewable-artifacts/{artifact_id}.html'
s3_client.put_object(
    Bucket=bucket_name,
    Key=s3_key,
    Body=html_content,
    ContentType='text/html'
)
```

**Status:** ⚠️ Needs Implementation

---

### Minor Issues

#### 4. Amplify Sandbox Deployment Delays

**Problem:** Sandbox takes 5-10 minutes to deploy changes

**Workaround:**
- Use `--stream-function-logs` to see progress
- Deploy only changed functions
- Use local testing before deploying

```bash
# Test locally first
node tests/test-my-function.js

# Then deploy
npx ampx sandbox
```

---

#### 5. TypeScript Compilation Errors in Production

**Problem:** Build fails with TypeScript errors

**Workaround:**
```json
// tsconfig.json - Disable strict mode temporarily
{
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true
  }
}
```

**Note:** This is a temporary workaround. Fix type errors properly in production.

---

#### 6. Environment Variables Not Updating

**Problem:** Changes to `.env.local` not reflected in Lambda

**Root Cause:** Amplify Gen 2 requires sandbox restart for env var changes

**Solution:**
```bash
# Stop sandbox
Ctrl+C

# Restart sandbox
npx ampx sandbox

# Verify environment variables
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query "Environment.Variables"
```

---

### Regression Protection

**CRITICAL:** This project has experienced multiple regressions. Follow these rules:

1. **Never change working code without testing**
2. **Always restart sandbox after backend changes**
3. **Verify environment variables after deployment**
4. **Test end-to-end after every change**
5. **Protect working features with regression tests**

See `.kiro/steering/avoid-massive-regressions.md` for detailed guidelines.

---


## Development Workflow

### Daily Development Cycle

```bash
# 1. Start sandbox (if not already running)
npx ampx sandbox

# 2. Start frontend dev server (in new terminal)
npm run dev

# 3. Make code changes
# Edit files in src/ or amplify/

# 4. Test changes
# Frontend changes: Hot reload automatic
# Backend changes: Requires sandbox restart

# 5. Commit changes
git add .
git commit -m "feat: add new feature"
git push
```

### Backend Development

**When to Restart Sandbox:**
- Changes to `amplify/backend.ts`
- Changes to `amplify/data/resource.ts`
- Changes to Lambda function code
- Changes to environment variables
- Changes to IAM permissions

**Testing Backend Changes:**

```bash
# Test Lambda directly
node tests/test-my-function.js

# Check CloudWatch logs
aws logs tail /aws/lambda/<function-name> --follow

# Test GraphQL mutation
npm run test:graphql
```

### Frontend Development

**Hot Reload Works For:**
- React component changes
- CSS/styling changes
- Page routing changes

**Requires Page Refresh:**
- GraphQL schema changes
- Environment variable changes
- Amplify configuration changes

**Testing Frontend Changes:**

```bash
# Run Jest tests
npm test

# Run specific test
npm run test:specific -- MyComponent.test.tsx

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Adding New Features

**Step-by-Step Process:**

1. **Create Spec** (Optional but recommended)
   ```bash
   # Create spec directory
   mkdir -p .kiro/specs/my-new-feature
   
   # Create requirements
   touch .kiro/specs/my-new-feature/requirements.md
   
   # Create design
   touch .kiro/specs/my-new-feature/design.md
   
   # Create tasks
   touch .kiro/specs/my-new-feature/tasks.md
   ```

2. **Implement Backend**
   - Create Lambda function
   - Add to `backend.ts`
   - Add GraphQL mutation
   - Test Lambda directly

3. **Implement Frontend**
   - Create React components
   - Add to routing
   - Test in browser

4. **Write Tests**
   - Unit tests for functions
   - Integration tests for workflows
   - E2E tests for user flows

5. **Deploy**
   - Test in sandbox
   - Deploy to production
   - Verify in production

---

### Git Workflow

**Branch Strategy:**

```
main (production)
  ↓
develop (staging)
  ↓
feature/my-feature (development)
```

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(petrophysics): add shale volume calculation

- Implement Larionov tertiary method
- Add Clavier method
- Create Cloudscape visualization component

Closes #123
```

---


## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  (Few, Slow, Expensive)
        └─────────────┘
       ┌───────────────┐
       │Integration Tests│  (Some, Medium Speed)
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │  (Many, Fast, Cheap)
      └─────────────────┘
```

### Unit Tests

**Location:** `tests/` or co-located with source files

**Framework:** Jest + React Testing Library

**Example:**

```typescript
// tests/petrophysicsCalculator.test.ts
import { calculatePorosity } from '../amplify/functions/petrophysicsCalculator/handler';

describe('Porosity Calculation', () => {
  it('should calculate density porosity correctly', () => {
    const result = calculatePorosity({
      method: 'density',
      rhob: 2.35,
      matrixDensity: 2.65,
      fluidDensity: 1.0
    });
    
    expect(result.porosity).toBeCloseTo(0.18, 2);
  });
  
  it('should handle invalid inputs', () => {
    expect(() => {
      calculatePorosity({ method: 'density', rhob: null });
    }).toThrow('Invalid input');
  });
});
```

**Run Unit Tests:**

```bash
npm test
npm run test:coverage
```

---

### Integration Tests

**Location:** `tests/`

**Purpose:** Test interaction between components

**Example:**

```javascript
// tests/test-agent-mcp-integration.js
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testAgentMCPIntegration() {
  const client = new LambdaClient({ region: 'us-east-1' });
  
  // Test 1: Agent invokes MCP tool
  const agentResponse = await invokeAgent({
    message: 'Calculate porosity for WELL-001'
  });
  
  expect(agentResponse.success).toBe(true);
  expect(agentResponse.artifacts).toHaveLength(1);
  expect(agentResponse.artifacts[0].type).toBe('cloudscape_porosity_display');
  
  // Test 2: MCP tool returns valid data
  const mcpResponse = await invokeMCPTool({
    tool: 'calculate_porosity',
    parameters: { wellName: 'WELL-001', method: 'density' }
  });
  
  expect(mcpResponse.porosity).toBeDefined();
  expect(mcpResponse.porosity).toBeGreaterThan(0);
  expect(mcpResponse.porosity).toBeLessThan(1);
}
```

**Run Integration Tests:**

```bash
node tests/test-agent-mcp-integration.js
node tests/test-osdu-catalog-integration.js
```

---

### End-to-End Tests

**Location:** `tests/`

**Purpose:** Test complete user workflows

**Example:**

```javascript
// tests/test-complete-workflow.js
const puppeteer = require('puppeteer');

async function testCompleteWorkflow() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 1. Navigate to app
  await page.goto('http://localhost:3000');
  
  // 2. Sign in
  await page.type('#username', 'test@example.com');
  await page.type('#password', 'TestPassword123!');
  await page.click('#sign-in-button');
  await page.waitForNavigation();
  
  // 3. Create new chat
  await page.click('#new-chat-button');
  await page.waitForSelector('#chat-input');
  
  // 4. Send message
  await page.type('#chat-input', 'Calculate porosity for WELL-001');
  await page.click('#send-button');
  
  // 5. Wait for response
  await page.waitForSelector('.ai-message', { timeout: 30000 });
  
  // 6. Verify artifact rendered
  const artifact = await page.$('.cloudscape-porosity-display');
  expect(artifact).toBeTruthy();
  
  // 7. Verify thought steps visible
  const thoughtSteps = await page.$$('.thought-step');
  expect(thoughtSteps.length).toBeGreaterThan(0);
  
  await browser.close();
}
```

**Run E2E Tests:**

```bash
npm run test:e2e
```

---

### Testing Checklist

**Before Committing:**
- [ ] All unit tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Manual testing in browser
- [ ] Check CloudWatch logs for errors

**Before Deploying:**
- [ ] All integration tests pass
- [ ] E2E tests pass
- [ ] Regression tests pass
- [ ] Performance acceptable
- [ ] No console errors in browser

**After Deploying:**
- [ ] Smoke tests pass in production
- [ ] CloudWatch logs clean
- [ ] No user-reported errors
- [ ] Monitoring dashboards green

---


## Deployment Guide

### Sandbox Deployment (Development)

**Purpose:** Temporary cloud environment for development and testing

**Command:**
```bash
npx ampx sandbox
```

**What It Does:**
- Creates temporary AWS resources
- Deploys all Lambda functions
- Sets up DynamoDB tables
- Configures S3 buckets
- Streams function logs to console

**When to Use:**
- Local development
- Testing changes
- Debugging issues

**Limitations:**
- Resources are temporary
- Deleted when sandbox stops
- Not suitable for production

---

### Production Deployment

**Method 1: Amplify Console (Recommended)**

1. **Connect Repository:**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect GitHub repository
   - Select branch (main)

2. **Configure Build Settings:**
   ```yaml
   # amplify.yml
   version: 1
   backend:
     phases:
       build:
         commands:
           - npm ci
           - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Set Environment Variables:**
   - Go to App Settings → Environment variables
   - Add all required variables from `.env.local.example`
   - Save and redeploy

4. **Deploy:**
   - Push to main branch
   - Amplify automatically builds and deploys
   - Monitor build logs in console

**Method 2: CLI Deployment**

```bash
# Deploy backend
npx ampx pipeline-deploy --branch main --app-id <your-app-id>

# Deploy frontend
npm run build
aws s3 sync .next s3://<your-bucket>/ --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

---

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Secrets stored in AWS Secrets Manager
- [ ] IAM permissions verified
- [ ] CloudWatch alarms configured

**During Deployment:**
- [ ] Monitor build logs
- [ ] Check for deployment errors
- [ ] Verify Lambda functions deployed
- [ ] Verify DynamoDB tables created
- [ ] Verify S3 buckets configured

**Post-Deployment:**
- [ ] Run smoke tests
- [ ] Check CloudWatch logs
- [ ] Verify frontend loads
- [ ] Test critical user workflows
- [ ] Monitor error rates
- [ ] Check performance metrics

---

### Rollback Procedure

**If Deployment Fails:**

1. **Identify Issue:**
   ```bash
   # Check CloudWatch logs
   aws logs tail /aws/lambda/<function-name> --follow
   
   # Check Amplify build logs
   # Go to Amplify Console → Build history
   ```

2. **Rollback to Previous Version:**
   ```bash
   # Revert Git commit
   git revert HEAD
   git push
   
   # Or rollback in Amplify Console
   # Go to App → Deployments → Select previous deployment → Redeploy
   ```

3. **Verify Rollback:**
   ```bash
   # Test critical workflows
   node tests/test-smoke.js
   
   # Check error rates
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Errors \
     --dimensions Name=FunctionName,Value=<function-name> \
     --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

---

### Environment-Specific Configuration

**Development (Sandbox):**
```bash
# .env.local
NODE_ENV=development
AMPLIFY_BRANCH=sandbox
LOG_LEVEL=debug
```

**Staging:**
```bash
# .env.staging
NODE_ENV=staging
AMPLIFY_BRANCH=develop
LOG_LEVEL=info
```

**Production:**
```bash
# .env.production
NODE_ENV=production
AMPLIFY_BRANCH=main
LOG_LEVEL=error
```

---


## Troubleshooting

### Common Issues

#### Issue 1: "Cannot find module" Error

**Symptom:**
```
Error: Cannot find module '@aws-sdk/client-s3'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify installation
npm list @aws-sdk/client-s3
```

---

#### Issue 2: Lambda Function Not Found

**Symptom:**
```
ResourceNotFoundException: Function not found
```

**Solution:**
```bash
# Verify function exists
aws lambda list-functions | grep <function-name>

# If not found, redeploy
npx ampx sandbox

# Verify environment variables
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query "Environment.Variables"
```

---

#### Issue 3: GraphQL Mutation Fails

**Symptom:**
```
GraphQL error: Unauthorized
```

**Solution:**
```bash
# Check authentication
# Verify user is signed in
# Check Cognito user pool

# Verify IAM permissions
# Check Lambda execution role has necessary permissions

# Check AppSync authorization
# Verify mutation has correct authorization rules
```

---

#### Issue 4: Artifacts Not Rendering

**Symptom:**
- "Visualization Unavailable" message
- Blank artifact area

**Solution:**
```typescript
// Check artifact structure
console.log('Artifact:', JSON.stringify(artifact, null, 2));

// Verify artifact type is registered
// In ChatMessage.tsx:
case 'my_artifact_type':
  return <MyArtifactComponent artifact={artifact} />;

// Check S3 permissions
// Verify user can read from S3 bucket

// Check artifact size
// DynamoDB has 400KB limit
// Use S3 for large artifacts
```

---

#### Issue 5: Thought Steps Not Showing

**Symptom:**
- Chain of thought panel empty
- No thought steps in response

**Solution:**
```typescript
// Verify agent extends BaseEnhancedAgent
export class MyAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }
}

// Verify thought steps are returned
return {
  success: true,
  message: 'Response',
  artifacts: [],
  thoughtSteps: this.getThoughtSteps() // Must include this
};

// Check frontend component
// Verify ChainOfThoughtDisplay is rendered
<ChainOfThoughtDisplay thoughtSteps={thoughtSteps} />
```

---

### Debugging Tools

#### CloudWatch Logs

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/<function-name> --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/<function-name> \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Get specific log stream
aws logs get-log-events \
  --log-group-name /aws/lambda/<function-name> \
  --log-stream-name <stream-name>
```

#### Lambda Testing

```bash
# Invoke Lambda directly
aws lambda invoke \
  --function-name <function-name> \
  --payload '{"arguments":{"message":"test"}}' \
  response.json

# View response
cat response.json | jq .
```

#### DynamoDB Inspection

```bash
# Scan table
aws dynamodb scan \
  --table-name ChatMessage-<hash> \
  --limit 10

# Get specific item
aws dynamodb get-item \
  --table-name ChatMessage-<hash> \
  --key '{"id":{"S":"<message-id>"}}'
```

#### S3 Inspection

```bash
# List objects
aws s3 ls s3://<bucket-name>/

# Download artifact
aws s3 cp s3://<bucket-name>/artifacts/<artifact-id>.html ./

# Check object metadata
aws s3api head-object \
  --bucket <bucket-name> \
  --key artifacts/<artifact-id>.html
```

---

### Performance Optimization

#### Lambda Cold Starts

**Problem:** First request takes 2-3 minutes

**Solutions:**

1. **Provisioned Concurrency:**
   ```typescript
   // backend.ts
   const alias = new lambda.Alias(backend.stack, 'ProvisionedAlias', {
     aliasName: 'provisioned',
     version: version,
     provisionedConcurrentExecutions: 1
   });
   ```

2. **Reduce Package Size:**
   ```bash
   # Remove unnecessary dependencies
   npm prune --production
   
   # Use Lambda layers for common dependencies
   # See amplify/layers/
   ```

3. **Optimize Imports:**
   ```typescript
   // Instead of:
   import * as AWS from 'aws-sdk';
   
   // Use:
   import { S3Client } from '@aws-sdk/client-s3';
   ```

#### Frontend Performance

**Problem:** Slow page loads

**Solutions:**

1. **Code Splitting:**
   ```typescript
   // Use dynamic imports
   const MyComponent = dynamic(() => import('./MyComponent'), {
     loading: () => <p>Loading...</p>
   });
   ```

2. **Lazy Load Plotly:**
   ```typescript
   // Only load when needed
   const Plot = dynamic(() => import('react-plotly.js'), {
     ssr: false
   });
   ```

3. **Optimize Images:**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image 
     src="/image.png" 
     width={500} 
     height={300} 
     alt="Description"
   />
   ```

---

### Getting Help

**Internal Resources:**
- `.kiro/steering/` - Development guidelines
- `docs/` - Detailed documentation
- `tests/` - Example implementations

**External Resources:**
- [AWS Amplify Gen 2 Docs](https://docs.amplify.aws/gen2/)
- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [Next.js Docs](https://nextjs.org/docs)
- [Cloudscape Design System](https://cloudscape.design/)

**Support Channels:**
- GitHub Issues
- AWS Support (if applicable)
- Team Slack/Discord

---

## Appendix

### File Structure Reference

```
digital-assistant/
├── .kiro/
│   ├── specs/              # Feature specifications
│   └── steering/           # Development guidelines
├── amplify/
│   ├── backend.ts          # Main backend configuration
│   ├── data/
│   │   └── resource.ts     # GraphQL schema
│   ├── functions/
│   │   ├── agents/         # Agent implementations
│   │   ├── edicraftAgent/  # EDIcraft agent
│   │   ├── maintenanceAgent/ # Maintenance agent
│   │   ├── renewableAgents/ # Renewable energy agents
│   │   └── petrophysicsCalculator/ # Petrophysics tools
│   ├── auth/               # Cognito configuration
│   └── storage/            # S3 configuration
├── src/
│   ├── app/                # Next.js pages
│   │   ├── chat/           # Chat canvas
│   │   ├── catalog/        # Data catalog
│   │   └── collections/    # Collection management
│   ├── components/
│   │   ├── agent-landing-pages/ # Agent landing pages
│   │   ├── cloudscape/     # Cloudscape components
│   │   ├── messageComponents/ # Message renderers
│   │   ├── AgentSwitcher.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChainOfThoughtDisplay.tsx
│   └── utils/              # Utility functions
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── package.json
├── tsconfig.json
└── .env.local.example
```

---

### Glossary

**Amplify Gen 2:** AWS Amplify's second generation, code-first approach to building full-stack applications

**AppSync:** AWS managed GraphQL service

**Artifact:** Visualization or data object generated by an agent (charts, reports, etc.)

**BaseEnhancedAgent:** Abstract base class providing verbose thought step generation for all agents

**Bedrock:** AWS service for accessing foundation models (Claude, etc.)

**Bedrock AgentCore:** AWS service for building AI agents with tools and workflows

**Chain of Thought:** Transparent display of agent reasoning process via thought steps

**Cloudscape:** AWS design system for professional enterprise UIs

**DynamoDB:** AWS NoSQL database service

**EDIcraft:** Minecraft-based 3D visualization system for subsurface data

**Lambda:** AWS serverless compute service

**MCP (Model Context Protocol):** Protocol for extensible tool integration with AI agents

**OSDU:** Open Subsurface Data Universe platform

**Petrophysics:** Analysis of rock and fluid properties in subsurface formations

**S3:** AWS object storage service

**Strands Agents:** Framework for building AI agents with tools

**Thought Step:** Individual step in agent's reasoning process, displayed to user for transparency

---

## Conclusion

This platform represents a comprehensive, scalable architecture for multi-agent AI systems in the energy domain. While there are known issues and areas for improvement, the core patterns are solid and have been battle-tested through multiple agent integrations.

**Key Takeaways:**

1. **Agent Integration is Streamlined:** Follow the 6-step pattern to add new agents
2. **BaseEnhancedAgent is Your Friend:** Always extend it for consistent behavior
3. **Thought Steps are Critical:** Users need transparency into agent reasoning
4. **Test Everything:** Regressions are expensive, testing is cheap
5. **Amplify Gen 2 Requires Restarts:** Don't forget to restart sandbox after backend changes

**Next Steps for New Team:**

1. Set up development environment
2. Run through installation guide
3. Test existing agents
4. Fix known issues (prioritize by impact)
5. Add new agents as needed
6. Improve documentation as you learn

Good luck! 🚀

---

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team  
**Questions?** See "Getting Help" section above

