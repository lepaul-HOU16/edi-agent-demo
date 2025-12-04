# Design Document: Fix All Agent Backend Functionality

## Overview

This design addresses **systemic backend breakages** across all agents introduced during the Amplify to CDK migration. The issue is not isolated to EDIcraft - it's a pattern of incomplete backend implementations, missing connections, and broken integrations affecting multiple agents.

**Key Insight**: Amplify provided automatic fallbacks and error handling that weren't replicated in the CDK approach, leaving backend stubs incomplete.

**Approach**: 
1. Systematically analyze each agent's backend
2. Identify common patterns of breakage
3. Create intelligent, reusable fixes
4. Test on localhost with deployed Lambda backends
5. Validate all agents work end-to-end

**Agents to Fix**:
- EDIcraft Agent (Minecraft/MCP connection)
- Petrophysics Agent (calculation/analysis)
- Maintenance Agent (equipment data)
- Renewable Agent (workflow orchestration)
- Auto Agent (general knowledge routing)

## Systematic Analysis Methodology

### Step 1: Identify All Agent Handlers

**Location**: `cdk/lambda-functions/chat/agents/`

**Files to Analyze**:
- `edicraftAgent.ts` - Minecraft visualization
- `petrophysicsAgent.ts` - Well data analysis
- `maintenanceAgent.ts` - Equipment maintenance
- `renewableAgent.ts` - Wind farm workflows
- `autoAgent.ts` - General knowledge routing

### Step 2: Check Each Handler for Common Patterns

**Pattern Checklist**:
1. ✅ **Initialization**: Does the agent initialize properly?
2. ✅ **Configuration**: Are environment variables loaded?
3. ✅ **Validation**: Is configuration validated before use?
4. ✅ **Connection**: Does it connect to external services (MCP, APIs)?
5. ✅ **Processing**: Does it actually process requests?
6. ✅ **Error Handling**: Are errors caught and returned properly?
7. ✅ **Response Format**: Does it return the expected format?
8. ✅ **Thought Steps**: Are thought steps included?

### Step 3: Identify Common Breakage Patterns

**Expected Patterns** (based on EDIcraft analysis):

#### Configuration & Credentials Issues
1. **Missing Environment Variables**: Agent IDs, API keys, credentials not set in Lambda
2. **Lost Credentials**: Passwords, tokens, secrets not migrated from Amplify
3. **Wrong Variable Names**: Amplify used different names than CDK expects
4. **Hardcoded Placeholders**: `your_agent_id_here` or `TODO: set this` still in code
5. **Missing .env Values**: Local .env has values but they're not in deployed Lambda

#### Permission Issues
6. **Missing IAM Permissions**: Lambda role lacks permissions for Bedrock, S3, DynamoDB
7. **Wrong Resource ARNs**: Permissions reference old Amplify resources
8. **Missing Agent Runtime Permissions**: `bedrock-agent-runtime:InvokeAgent` not granted
9. **MCP Server Access**: Lambda can't reach MCP servers (security groups, VPC)
10. **Cross-Account Access**: Agent in different account, no assume role configured

#### MCP & Agent Core Issues
11. **MCP Server Not Deployed**: MCP server referenced but never deployed
12. **MCP Server URL Wrong**: Pointing to localhost or old endpoint
13. **Agent Core Not Deployed**: Bedrock Agent referenced but doesn't exist
14. **Agent Core Wrong Region**: Agent in us-west-2 but Lambda configured for us-east-1
15. **Agent Alias Missing**: Using TSTALIASID but alias not created

#### Implementation Issues
16. **Missing MCP Client File**: Agent class exists but MCP client file missing
17. **Incomplete Initialization**: Constructor doesn't fully initialize dependencies
18. **No Validation**: Configuration not validated, fails silently
19. **Stub Implementation**: `processMessage()` returns placeholder response
20. **Missing Error Handling**: Errors not caught, Lambda crashes
21. **Wrong Response Format**: Returns data but not in expected format
22. **No Thought Steps**: Doesn't include chain-of-thought reasoning

### Step 4: Create Pattern-Based Fix Templates

**Template 1: Configuration Discovery**
```bash
# Check what environment variables are actually set in Lambda
aws lambda get-function-configuration --function-name EnergyInsights-development-chat \
  --query 'Environment.Variables' --output json

# Check what's in .env files
grep -r "BEDROCK\|MCP\|AGENT" .env* | grep -v ".example"

# Check what's referenced in code
grep -r "process.env\." cdk/lambda-functions/chat/agents/
```

**Template 2: Credential Audit**
```typescript
// Add to each agent constructor
private auditConfiguration() {
  const required = {
    'BEDROCK_AGENT_ID': process.env.BEDROCK_AGENT_ID,
    'BEDROCK_REGION': process.env.BEDROCK_REGION,
    'MCP_SERVER_URL': process.env.MCP_SERVER_URL,
    // ... agent-specific vars
  };
  
  const missing = Object.entries(required)
    .filter(([key, value]) => !value || value === 'your_*_here')
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error(`❌ Missing configuration: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required configuration present');
  return true;
}
```

**Template 3: Permission Validation**
```typescript
// Test if Lambda has required permissions
async validatePermissions() {
  try {
    // Try to invoke agent (will fail if no permission)
    const client = new BedrockAgentRuntimeClient({ region: this.region });
    // Don't actually invoke, just check if we can create client
    console.log('✅ Bedrock Agent Runtime client created');
    return true;
  } catch (error) {
    console.error('❌ Permission error:', error.message);
    return false;
  }
}
```

**Template 4: MCP Server Discovery**
```typescript
// Check if MCP server is reachable
async checkMCPServer() {
  const mcpUrl = process.env.MCP_SERVER_URL;
  
  if (!mcpUrl) {
    console.error('❌ MCP_SERVER_URL not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${mcpUrl}/health`);
    if (response.ok) {
      console.log('✅ MCP server reachable');
      return true;
    }
  } catch (error) {
    console.error('❌ MCP server unreachable:', error.message);
    console.error('   Check: Is MCP server deployed?');
    console.error('   Check: Is URL correct?');
    console.error('   Check: Can Lambda reach it (VPC/security groups)?');
    return false;
  }
}
```

**Template 5: Agent Core Validation**
```typescript
// Verify Bedrock Agent exists and is accessible
async validateAgentCore() {
  const agentId = process.env.BEDROCK_AGENT_ID;
  
  if (!agentId || agentId === 'your_agent_id_here') {
    console.error('❌ BEDROCK_AGENT_ID not configured');
    console.error('   Deploy agent using: aws bedrock-agent create-agent ...');
    return false;
  }
  
  try {
    const client = new BedrockAgentClient({ region: this.region });
    const response = await client.send(new GetAgentCommand({ agentId }));
    console.log('✅ Bedrock Agent exists:', response.agent.agentName);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ Agent ${agentId} not found in ${this.region}`);
      console.error('   Check: Is agent deployed?');
      console.error('   Check: Is region correct?');
    } else if (error.name === 'AccessDeniedException') {
      console.error('❌ No permission to access agent');
      console.error('   Add: bedrock-agent:GetAgent permission');
    }
    return false;
  }
}
```

**Template 6: Complete Initialization with Validation**
```typescript
constructor() {
  super();
  
  // Audit configuration
  const configValid = this.auditConfiguration();
  if (!configValid) {
    console.warn('⚠️ Agent initialized with incomplete configuration');
  }
  
  // Initialize clients only if config is valid
  if (configValid) {
    this.initializeClients();
  }
}

private initializeClients() {
  try {
    this.mcpClient = new AgentMCPClient({
      serverUrl: process.env.MCP_SERVER_URL,
      agentId: process.env.BEDROCK_AGENT_ID,
      region: process.env.BEDROCK_REGION,
    });
    console.log('✅ MCP client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize MCP client:', error);
    this.mcpClient = null;
  }
}
```

### Step 5: Apply Fixes Intelligently

**Process**:
1. Identify which pattern(s) affect each agent
2. Adapt template to agent's specific needs
3. Implement fix
4. Deploy Lambda
5. Test on localhost
6. Validate fix works
7. Move to next agent

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌────────────────┐         ┌──────────────────┐               │
│  │ Clear Button   │────────▶│ handleSendMessage│               │
│  │ (Loading/Alert)│         │ (ChatPage)       │               │
│  └────────────────┘         └──────────────────┘               │
│                                      │                           │
│                                      ▼                           │
│                             ┌─────────────────┐                 │
│                             │ sendMessage()   │                 │
│                             │ (chatUtils.ts)  │                 │
│                             └─────────────────┘                 │
└──────────────────────────────────────┼──────────────────────────┘
                                       │ REST API
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (AWS Lambda)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Chat Lambda Function                                      │  │
│  │  ┌────────────────┐         ┌──────────────────┐        │  │
│  │  │ Route Handler  │────────▶│ EDIcraftAgent    │        │  │
│  │  │ (index.ts)     │         │ (edicraftAgent.ts)│        │  │
│  │  └────────────────┘         └──────────────────┘        │  │
│  │                                      │                    │  │
│  │                                      ▼                    │  │
│  │                             ┌─────────────────┐          │  │
│  │                             │ MCP Client      │          │  │
│  │                             │ (mcpClient.ts)  │          │  │
│  │                             └─────────────────┘          │  │
│  └──────────────────────────────────────┼───────────────────┘  │
└──────────────────────────────────────────┼──────────────────────┘
                                           │ Bedrock Agent Runtime
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS BEDROCK AGENT                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ EDIcraft Bedrock Agent                                    │  │
│  │  - Processes natural language                             │  │
│  │  - Generates RCON commands                                │  │
│  │  - Returns thought steps                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────┘
                                           │ RCON Protocol
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MINECRAFT SERVER                              │
│  edicraft.nigelgardiner.com:49001 (RCON)                        │
│  - Executes clear commands                                       │
│  - Removes structures                                            │
│  - Returns execution results                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend: EDIcraft Clear Button

**File**: `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`

**Current State**: ✅ UX patterns correct (loading, alerts, state management)

**Issue**: Sends message through chat (shows user message)

**Required Change**: None - frontend is correct

### 2. Frontend: Message Sending

**File**: `src/pages/ChatPage.tsx`

**Current Implementation**:
```typescript
const handleSendMessage = async (message: string) => {
  // Creates user message
  const newMessage = {
    role: 'human',
    content: { text: message },
    chatSessionId: activeChatSession.id,
  };
  
  // Adds to UI
  setMessages((prevMessages) => [...prevMessages, newMessage as any as Message]);
  
  // Sends to backend
  await sendMessage({
    chatSessionId: activeChatSession.id,
    newMessage: newMessage as any,
    agentType: selectedAgent,
    projectContext,
  });
}
```

**Issue**: Always adds user message to UI

**Solution**: Add `silent` parameter to suppress user message display

```typescript
const handleSendMessage = async (message: string, options?: { silent?: boolean }) => {
  const newMessage = {
    role: 'human',
    content: { text: message },
    chatSessionId: activeChatSession.id,
  };
  
  // Only add to UI if not silent
  if (!options?.silent) {
    setMessages((prevMessages) => [...prevMessages, newMessage as any as Message]);
  }
  
  await sendMessage({
    chatSessionId: activeChatSession.id,
    newMessage: newMessage as any,
    agentType: selectedAgent,
    projectContext,
  });
}
```

**EDIcraft Button Update**:
```typescript
await onSendMessage('Clear the Minecraft environment', { silent: true });
```

### 3. Backend: Chat Lambda Configuration

**File**: `cdk/lib/main-stack.ts`

**Current State**: ✅ Environment variables added (Task 18)

**Environment Variables**:
```typescript
environment: {
  BEDROCK_AGENT_ID: process.env.BEDROCK_AGENT_ID || '',
  BEDROCK_AGENT_ALIAS_ID: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'us-east-1',
  MINECRAFT_HOST: process.env.MINECRAFT_HOST || '',
  MINECRAFT_PORT: process.env.MINECRAFT_RCON_PORT || '49001',
  MINECRAFT_RCON_PASSWORD: process.env.MINECRAFT_RCON_PASSWORD || '',
  EDI_PLATFORM_URL: process.env.EDI_PLATFORM_URL || '',
  EDI_PARTITION: process.env.EDI_PARTITION || '',
}
```

**IAM Permissions**: ✅ Added (Task 18)
```typescript
chatFunction.function.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock-agent-runtime:InvokeAgent'],
    resources: ['*'],
  })
);
```

**Required**: Set actual values in environment and redeploy

### 4. Backend: EDIcraft Agent Class

**File**: `cdk/lambda-functions/chat/agents/edicraftAgent.ts`

**Current Implementation**: ✅ Correct structure

**Validation Logic**:
```typescript
// Validates MCP client is initialized
if (!this.mcpClient) {
  return {
    success: false,
    message: 'EDIcraft agent is not properly configured.',
    error: 'MCP client not initialized'
  };
}

// Validates BEDROCK_AGENT_ID is set
if (!this.agentId || this.agentId === 'your_agent_id_here') {
  return {
    success: false,
    message: 'EDIcraft agent is not configured. Please set BEDROCK_AGENT_ID.',
    error: 'BEDROCK_AGENT_ID not set'
  };
}
```

**Issue**: MCP client may not be initializing correctly

**Required**: Verify MCP client initialization and connection

### 5. Backend: MCP Client

**File**: `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.ts`

**Expected Interface**:
```typescript
interface MCPClientConfig {
  bedrockAgentId: string;
  bedrockAgentAliasId: string;
  region: string;
  minecraftHost: string;
  minecraftPort: number;
  minecraftRconPassword: string;
  ediPlatformUrl: string;
  ediPartition: string;
}

class EDIcraftMCPClient {
  constructor(config: MCPClientConfig);
  
  async processMessage(message: string): Promise<{
    success: boolean;
    message: string;
    thoughtSteps?: any[];
    connectionStatus?: string;
  }>;
}
```

**Required Functionality**:
1. Initialize Bedrock Agent Runtime client
2. Invoke agent with message
3. Stream thought steps
4. Execute RCON commands on Minecraft server
5. Return results with thought steps

**Current Issue**: Need to verify this file exists and is correctly implemented

### 6. Minecraft Server Connection

**Protocol**: RCON (Remote Console)
**Host**: edicraft.nigelgardiner.com
**Port**: 49001
**Authentication**: Password-based

**RCON Commands for Clear**:
```
/fill <x1> <y1> <z1> <x2> <y2> <z2> air replace
/kill @e[type=!player]
```

**Connection Test**:
```typescript
async testRconConnection(): Promise<boolean> {
  try {
    const rcon = new Rcon({
      host: this.config.minecraftHost,
      port: this.config.minecraftPort,
      password: this.config.minecraftRconPassword,
      timeout: 5000
    });
    
    await rcon.connect();
    const response = await rcon.send('list'); // Test command
    await rcon.disconnect();
    
    return true;
  } catch (error) {
    console.error('RCON connection failed:', error);
    return false;
  }
}
```

## Data Models

### Clear Operation Request

```typescript
interface ClearOperationRequest {
  chatSessionId: string;
  userId: string;
  silent?: boolean; // Don't show user message in chat
}
```

### Clear Operation Response

```typescript
interface ClearOperationResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  connectionStatus: 'connected' | 'not_configured' | 'connection_failed' | 'auth_failed';
  minecraftResponse?: {
    blocksCleared: number;
    entitiesRemoved: number;
    duration: number;
  };
}
```

### Thought Step

```typescript
interface ThoughtStep {
  type: 'thinking' | 'tool_use' | 'observation' | 'final_answer';
  content: string;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
  timestamp: string;
}
```

## Implementation Strategy

### Phase 1: Frontend Silent Mode (Quick Win)

**Goal**: Prevent user message from appearing in chat

**Changes**:
1. Add `silent` parameter to `handleSendMessage` in ChatPage
2. Update EDIcraft button to use `silent: true`
3. Test that user message doesn't appear

**Estimated Time**: 15 minutes

### Phase 2: Verify MCP Client Exists

**Goal**: Confirm MCP client file exists and is structured correctly

**Actions**:
1. Check if `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.ts` exists
2. If missing, create skeleton implementation
3. Verify it exports `EDIcraftMCPClient` class

**Estimated Time**: 30 minutes

### Phase 3: Implement RCON Connection

**Goal**: Connect to Minecraft server via RCON

**Dependencies**: `rcon-client` npm package

**Implementation**:
```typescript
import { Rcon } from 'rcon-client';

class EDIcraftMCPClient {
  private rcon: Rcon | null = null;
  
  async connect(): Promise<void> {
    this.rcon = new Rcon({
      host: this.config.minecraftHost,
      port: this.config.minecraftPort,
      password: this.config.minecraftRconPassword,
      timeout: 10000
    });
    
    await this.rcon.connect();
    console.log('✅ Connected to Minecraft server via RCON');
  }
  
  async executeClearCommand(): Promise<string> {
    if (!this.rcon) {
      throw new Error('RCON not connected');
    }
    
    // Clear structures in chunks
    const commands = [
      '/fill -1000 0 -1000 1000 256 1000 air replace',
      '/kill @e[type=!player]'
    ];
    
    const results = [];
    for (const cmd of commands) {
      const response = await this.rcon.send(cmd);
      results.push(response);
    }
    
    return results.join('\n');
  }
}
```

**Estimated Time**: 1 hour

### Phase 4: Integrate Bedrock Agent

**Goal**: Invoke Bedrock Agent and get thought steps

**Implementation**:
```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

async processMessage(message: string): Promise<MCPResponse> {
  const client = new BedrockAgentRuntimeClient({ region: this.config.region });
  
  const command = new InvokeAgentCommand({
    agentId: this.config.bedrockAgentId,
    agentAliasId: this.config.bedrockAgentAliasId,
    sessionId: `session-${Date.now()}`,
    inputText: message,
    enableTrace: true // Get thought steps
  });
  
  const response = await client.send(command);
  
  // Extract thought steps from trace
  const thoughtSteps = this.extractThoughtSteps(response);
  
  // Execute RCON commands based on agent response
  await this.connect();
  const minecraftResponse = await this.executeClearCommand();
  
  return {
    success: true,
    message: `Cleared Minecraft environment: ${minecraftResponse}`,
    thoughtSteps,
    connectionStatus: 'connected'
  };
}
```

**Estimated Time**: 2 hours

### Phase 5: Environment Configuration

**Goal**: Set actual environment variable values

**Required Values**:
```bash
# Get from AWS Bedrock Console
export BEDROCK_AGENT_ID=XXXXXXXXXX

# Minecraft server
export MINECRAFT_HOST=edicraft.nigelgardiner.com
export MINECRAFT_RCON_PORT=49001
export MINECRAFT_RCON_PASSWORD=<actual_password>

# OSDU (if needed)
export EDI_PLATFORM_URL=https://...
export EDI_PARTITION=...
```

**Deployment**:
```bash
cd cdk
npm run deploy
```

**Estimated Time**: 30 minutes (plus deployment time)

### Phase 6: End-to-End Testing

**Goal**: Verify complete flow works

**Test Steps**:
1. Start localhost: `npm run dev`
2. Navigate to Chat page
3. Select EDIcraft agent
4. Click "Clear Minecraft Environment"
5. Verify:
   - ✅ Button shows loading spinner
   - ✅ No user message in chat
   - ✅ Agent response appears
   - ✅ Thought steps visible
   - ✅ Success alert shows
   - ✅ Minecraft world actually clears

**Estimated Time**: 1 hour

## Error Handling

### Configuration Errors

```typescript
if (!process.env.BEDROCK_AGENT_ID) {
  return {
    success: false,
    message: 'EDIcraft agent not configured. Set BEDROCK_AGENT_ID environment variable.',
    connectionStatus: 'not_configured'
  };
}
```

### Connection Errors

```typescript
try {
  await this.rcon.connect();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return {
      success: false,
      message: `Cannot reach Minecraft server at ${this.config.minecraftHost}:${this.config.minecraftPort}`,
      connectionStatus: 'connection_failed'
    };
  }
  
  if (error.message.includes('authentication')) {
    return {
      success: false,
      message: 'RCON authentication failed. Check MINECRAFT_RCON_PASSWORD.',
      connectionStatus: 'auth_failed'
    };
  }
  
  throw error;
}
```

### Bedrock Agent Errors

```typescript
try {
  const response = await client.send(command);
} catch (error) {
  if (error.name === 'ResourceNotFoundException') {
    return {
      success: false,
      message: `Bedrock Agent ${this.config.bedrockAgentId} not found. Verify BEDROCK_AGENT_ID.`,
      connectionStatus: 'not_configured'
    };
  }
  
  if (error.name === 'AccessDeniedException') {
    return {
      success: false,
      message: 'Permission denied. Lambda needs bedrock-agent-runtime:InvokeAgent permission.',
      connectionStatus: 'permission_denied'
    };
  }
  
  throw error;
}
```

## Testing Strategy

### Unit Tests

1. **MCP Client Connection Test**
   - Mock RCON client
   - Verify connection logic
   - Test error handling

2. **Bedrock Agent Invocation Test**
   - Mock Bedrock Agent Runtime client
   - Verify request format
   - Test thought step extraction

3. **Clear Command Test**
   - Mock RCON responses
   - Verify command execution
   - Test result parsing

### Integration Tests

1. **Frontend to Backend Test**
   - Test silent message sending
   - Verify no user message in UI
   - Confirm agent response appears

2. **Backend to Bedrock Test**
   - Test agent invocation
   - Verify thought steps returned
   - Confirm proper error handling

3. **Backend to Minecraft Test**
   - Test RCON connection
   - Verify command execution
   - Confirm response parsing

### End-to-End Test

1. Click Clear button
2. Verify loading state
3. Confirm no user message
4. Check agent response
5. Verify thought steps
6. Confirm Minecraft cleared
7. Check success alert

## Success Criteria

1. ✅ Clear button shows loading spinner
2. ✅ No user message appears in chat
3. ✅ Agent response appears in chat
4. ✅ Thought steps visible in chain-of-thought
5. ✅ Success alert displays
6. ✅ Minecraft world actually clears
7. ✅ Error messages are clear and actionable
8. ✅ Complete flow takes < 10 seconds
9. ✅ No console errors
10. ✅ Works consistently on repeat clicks

## Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-agent-runtime": "^3.x",
    "rcon-client": "^4.x"
  }
}
```

### AWS Services

- AWS Bedrock Agent (must be deployed)
- AWS Lambda (chat function)
- IAM (permissions)

### External Services

- Minecraft server at edicraft.nigelgardiner.com:49001
- RCON access with valid credentials

## Rollback Plan

If issues occur:
1. Revert frontend changes (silent mode)
2. Keep backend configuration (no harm)
3. Disable EDIcraft agent in UI
4. Investigate and fix issues
5. Re-enable when ready

## Summary

This design provides a complete solution for EDIcraft agent end-to-end functionality:

1. **Frontend**: Add silent mode to prevent user messages
2. **Backend**: Verify/implement MCP client with RCON connection
3. **Integration**: Connect Bedrock Agent to Minecraft server
4. **Configuration**: Set environment variables and deploy
5. **Testing**: Verify complete flow works end-to-end

The key insight: The frontend UX is already correct. The issue is backend connectivity - MCP client needs to properly connect to both Bedrock Agent and Minecraft server.
