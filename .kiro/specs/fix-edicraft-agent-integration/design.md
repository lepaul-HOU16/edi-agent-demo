# EDIcraft Agent Integration Fix - Design

## Overview

This design document outlines the architecture and implementation approach for fixing the EDIcraft agent integration. The current implementation is a stub that returns preview messages. The goal is to connect the Lambda-based handler to the actual Bedrock AgentCore deployment that runs the Python-based agent.py from the EDIcraft-main repository.

The EDIcraft agent enables subsurface data visualization in Minecraft by connecting OSDU platform data to a Minecraft server via RCON protocol. The agent handles wellbore trajectory visualization, horizon surface rendering, coordinate transformation, and player position tracking.

## Architecture

### High-Level Flow

```
User Query
    ↓
Chat Interface (Next.js)
    ↓
Agent Router (agentRouter.ts)
    ↓
EDIcraft Handler (Lambda)
    ↓
MCP Client (mcpClient.ts)
    ↓
Bedrock AgentCore Runtime (Python agent.py)
    ↓
[OSDU Platform] ← → [Minecraft Server via RCON]
    ↓
Response with thought steps
    ↓
Chat Interface displays result
```

### Component Responsibilities

1. **Agent Router** - Routes Minecraft/OSDU queries to EDIcraft agent
2. **EDIcraft Handler** - Lambda entry point, error handling, response formatting
3. **MCP Client** - Manages communication with Bedrock AgentCore runtime
4. **Bedrock AgentCore** - Executes Python agent.py with MCP tools
5. **Python Agent** - Connects to OSDU and Minecraft, performs operations

## Components and Interfaces

### 1. Agent Router Enhancement

**File**: `amplify/functions/agents/agentRouter.ts`

**Current State**: Routes to renewable agent incorrectly

**Required Changes**:
- Add EDIcraft-specific pattern matching
- Priority handling for "well log" + "minecraft" queries
- Logging for debugging routing decisions

**Interface**:
```typescript
interface AgentRouterResult {
  agentType: 'edicraft' | 'renewable' | 'petrophysics' | 'maintenance' | 'auto';
  confidence: number;
  matchedPatterns: string[];
}
```

**Pattern Matching Logic**:
- Primary patterns: minecraft, wellbore trajectory, horizon surface, build wellbore
- OSDU patterns: osdu wellbore, osdu horizon
- Coordinate patterns: player position, coordinate tracking, transform coordinates, utm minecraft
- Visualization patterns: subsurface visualization, 3d wellbore, geological surface, minecraft visualization
- Combined patterns: well log + minecraft (priority over petrophysics)

### 2. EDIcraft Handler Refactoring

**File**: `amplify/functions/edicraftAgent/handler.ts`

**Current State**: Stub implementation with preview responses

**Required Changes**:
- Remove stub logic from edicraftAgent.ts wrapper
- Implement actual Bedrock AgentCore invocation
- Add comprehensive error categorization
- Add environment variable validation
- Add structured logging

**Interface**:
```typescript
interface EDIcraftHandlerEvent {
  arguments: {
    userId: string;
    message: string;
    sessionId?: string;
  };
  identity: {
    sub: string;
  };
}

interface EDIcraftHandlerResponse {
  success: boolean;
  message: string;
  artifacts: any[]; // Always empty - visualization in Minecraft
  thoughtSteps: ThoughtStep[];
  connectionStatus: 'connected' | 'error' | 'pending';
  error?: string;
}

interface ThoughtStep {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
}
```

### 3. MCP Client Implementation

**File**: `amplify/functions/edicraftAgent/mcpClient.ts`

**Current State**: Placeholder with Lambda invoke attempt

**Required Changes**:
- Implement proper Bedrock AgentCore Runtime invocation
- Handle streaming responses from agent
- Parse agent response structure
- Extract thought steps from agent execution
- Add retry logic with exponential backoff
- Add connection testing capability

**Interface**:
```typescript
interface EDIcraftConfig {
  // Minecraft connection
  minecraftHost: string;
  minecraftPort: number;
  rconPassword: string;
  
  // OSDU platform
  ediUsername: string;
  ediPassword: string;
  ediClientId: string;
  ediClientSecret: string;
  ediPartition: string;
  ediPlatformUrl: string;
  
  // AWS configuration
  bedrockAgentId: string;
  bedrockAgentAliasId: string;
  region: string;
}

interface BedrockAgentResponse {
  completion: string;
  trace?: {
    orchestrationTrace?: {
      observation?: {
        actionGroupInvocationOutput?: {
          text: string;
        };
      };
    };
  };
}
```

**Bedrock AgentCore Invocation**:
- Use `BedrockAgentRuntimeClient` from AWS SDK
- Create `InvokeAgentCommand` with sessionId and inputText
- Process response stream to extract completion text
- Parse trace information for thought steps
- Handle errors and connection failures

### 4. Environment Configuration

**Required Environment Variables**:

```bash
# Bedrock AgentCore
BEDROCK_AGENT_ID=<agent-id>
BEDROCK_AGENT_ALIAS_ID=<alias-id>
BEDROCK_REGION=us-east-1

# Minecraft Server
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=49000
MINECRAFT_RCON_PORT=49001
MINECRAFT_RCON_PASSWORD=<password>

# OSDU Platform
EDI_USERNAME=<username>
EDI_PASSWORD=<password>
EDI_CLIENT_ID=<client-id>
EDI_CLIENT_SECRET=<client-secret>
EDI_PARTITION=<partition>
EDI_PLATFORM_URL=<platform-url>
```

**Validation Strategy**:
- Check all required variables on handler initialization
- Return clear error messages for missing variables
- Validate format of agent ID and alias ID
- Test connectivity before processing requests

## Data Models

### Agent Response Model

```typescript
interface AgentResponse {
  success: boolean;
  message: string;
  artifacts: never[]; // Always empty for EDIcraft
  thoughtSteps: ThoughtStep[];
  connectionStatus: ConnectionStatus;
  error?: string;
}

type ConnectionStatus = 
  | 'connected'      // Successfully connected and executed
  | 'pending'        // Operation in progress
  | 'error'          // Connection or execution error
  | 'not_deployed';  // Agent not deployed yet

interface ThoughtStep {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
  details?: string;
}
```

### Error Model

```typescript
interface EDIcraftError {
  type: ErrorType;
  message: string;
  originalError: string;
  troubleshooting: string[];
}

type ErrorType =
  | 'CONNECTION_REFUSED'  // Minecraft server unreachable
  | 'TIMEOUT'             // Request timeout
  | 'AUTH_FAILED'         // Authentication failure
  | 'OSDU_ERROR'          // OSDU platform error
  | 'AGENT_NOT_DEPLOYED'  // Bedrock agent not deployed
  | 'INVALID_CONFIG'      // Missing/invalid environment variables
  | 'UNKNOWN';            // Unclassified error
```

## Error Handling

### Error Categories and Responses

1. **Connection Refused**
   - Cause: Minecraft server not reachable
   - Response: Server status check instructions
   - Troubleshooting: Verify server running, RCON enabled, firewall rules

2. **Timeout**
   - Cause: Request took too long
   - Response: Network connectivity guidance
   - Troubleshooting: Check network, server load, security groups

3. **Authentication Failed**
   - Cause: Invalid RCON password or OSDU credentials
   - Response: Credential verification instructions
   - Troubleshooting: Verify RCON password, OSDU credentials, permissions

4. **OSDU Error**
   - Cause: OSDU platform access issue
   - Response: Platform connectivity guidance
   - Troubleshooting: Check platform URL, credentials, permissions

5. **Agent Not Deployed**
   - Cause: Bedrock AgentCore not deployed
   - Response: Deployment instructions with link to guide
   - Troubleshooting: Deploy agent using edicraft-agent/DEPLOYMENT_GUIDE.md

6. **Invalid Configuration**
   - Cause: Missing or invalid environment variables
   - Response: List of missing variables
   - Troubleshooting: Set required environment variables in Lambda

### Error Handling Flow

```
Error Occurs
    ↓
Categorize Error Type
    ↓
Generate User-Friendly Message
    ↓
Add Troubleshooting Steps
    ↓
Log Detailed Error
    ↓
Return Structured Error Response
```

## Testing Strategy

### Unit Tests

1. **Agent Router Tests**
   - Test pattern matching for EDIcraft queries
   - Test priority handling for combined patterns
   - Test logging of routing decisions

2. **Handler Tests**
   - Test environment variable validation
   - Test error categorization
   - Test response formatting
   - Test thought step generation

3. **MCP Client Tests**
   - Test Bedrock AgentCore invocation
   - Test response parsing
   - Test error handling
   - Test retry logic

### Integration Tests

1. **End-to-End Flow**
   - Test complete flow from query to response
   - Test with mock Bedrock AgentCore responses
   - Test error scenarios
   - Test thought step extraction

2. **Connection Tests**
   - Test Minecraft server connectivity
   - Test OSDU platform connectivity
   - Test Bedrock AgentCore connectivity

### Manual Testing

1. **Query Routing**
   - Send Minecraft-related queries
   - Verify routing to EDIcraft agent
   - Check routing logs

2. **Agent Execution**
   - Test wellbore visualization request
   - Test horizon surface request
   - Test player tracking request
   - Verify thought steps in response

3. **Error Scenarios**
   - Test with missing environment variables
   - Test with invalid credentials
   - Test with unreachable Minecraft server
   - Verify error messages are user-friendly

## Implementation Phases

### Phase 1: Agent Router Fix
- Update pattern matching in agentRouter.ts
- Add EDIcraft-specific patterns
- Add priority handling for combined patterns
- Add routing decision logging
- Test routing with various queries

### Phase 2: Environment Configuration
- Define all required environment variables
- Add validation logic in handler
- Create environment variable documentation
- Test with missing/invalid variables

### Phase 3: MCP Client Implementation
- Implement Bedrock AgentCore invocation
- Add response parsing logic
- Add error handling and retry logic
- Test with mock responses

### Phase 4: Handler Refactoring
- Remove stub logic from edicraftAgent.ts
- Integrate MCP client
- Add error categorization
- Add thought step generation
- Test complete flow

### Phase 5: Testing and Validation
- Run unit tests
- Run integration tests
- Perform manual testing
- Validate with user

### Phase 6: Documentation
- Update deployment guide
- Document environment variables
- Create troubleshooting guide
- Document user workflows

## Deployment Considerations

### Prerequisites

1. **Bedrock AgentCore Deployment**
   - Deploy agent.py from EDIcraft-main repository
   - Configure MCP tools for OSDU and Minecraft
   - Obtain agent ID and alias ID
   - Test agent independently

2. **Environment Variables**
   - Set all required variables in Lambda configuration
   - Verify Minecraft server credentials
   - Verify OSDU platform credentials
   - Test connectivity

3. **IAM Permissions**
   - Grant Lambda permission to invoke Bedrock AgentCore
   - Grant Lambda permission to access secrets (if using Secrets Manager)
   - Verify network access to Minecraft server

### Deployment Steps

1. Deploy updated Lambda code
2. Configure environment variables
3. Test agent routing
4. Test agent execution
5. Verify error handling
6. Monitor CloudWatch logs
7. Validate with user

### Rollback Plan

If deployment fails:
1. Revert Lambda code to previous version
2. Restore previous environment variables
3. Verify routing returns to previous behavior
4. Investigate failure cause
5. Fix issues and redeploy

## Security Considerations

1. **Credentials Management**
   - Store sensitive credentials in AWS Secrets Manager
   - Use IAM roles for AWS service access
   - Rotate credentials regularly
   - Never log sensitive information

2. **Network Security**
   - Use VPC for Lambda if Minecraft server is private
   - Configure security groups appropriately
   - Use TLS for OSDU platform communication
   - Validate all input parameters

3. **Error Messages**
   - Don't expose sensitive information in error messages
   - Log detailed errors to CloudWatch only
   - Return user-friendly messages to client
   - Sanitize error messages before returning

## Performance Considerations

1. **Response Time**
   - Target: < 5 seconds for simple queries
   - Target: < 15 seconds for complex operations
   - Implement timeout handling
   - Add retry logic with exponential backoff

2. **Resource Usage**
   - Lambda memory: 512 MB minimum
   - Lambda timeout: 300 seconds
   - Monitor cold start times
   - Optimize response parsing

3. **Scalability**
   - Lambda auto-scales with concurrent requests
   - Bedrock AgentCore handles concurrent sessions
   - Monitor throttling and rate limits
   - Implement request queuing if needed

## Monitoring and Logging

1. **CloudWatch Logs**
   - Log all agent invocations
   - Log routing decisions
   - Log error details
   - Log performance metrics

2. **Metrics**
   - Track success/failure rates
   - Track response times
   - Track error types
   - Track agent routing decisions

3. **Alerts**
   - Alert on high error rates
   - Alert on slow response times
   - Alert on connection failures
   - Alert on authentication failures

## Success Criteria

The implementation is successful when:

1. ✅ Minecraft queries route to EDIcraft agent
2. ✅ Agent invokes Bedrock AgentCore successfully
3. ✅ Responses include actual execution results
4. ✅ Thought steps show real agent execution
5. ✅ Error messages are user-friendly with troubleshooting
6. ✅ All environment variables are validated
7. ✅ Connection failures are handled gracefully
8. ✅ User can visualize data in Minecraft
9. ✅ All tests pass
10. ✅ User validates the fix works end-to-end
