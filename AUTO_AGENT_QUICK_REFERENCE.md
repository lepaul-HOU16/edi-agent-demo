# Auto Agent Quick Reference Guide

## What is the Auto Agent?

The Auto agent is the **intelligent routing system** that:
- Analyzes user queries
- Classifies intent
- Routes to the appropriate specialized agent

**Location**: `cdk/lambda-functions/chat/agents/agentRouter.ts`

## How It Works

### 1. Query Analysis

When a user sends a message with `selectedAgent: 'auto'`, the router:

```typescript
// Check if explicit agent selection
if (sessionContext?.selectedAgent && sessionContext.selectedAgent !== 'auto') {
  agentType = sessionContext.selectedAgent; // Use explicit selection
} else {
  agentType = this.determineAgentType(message); // Auto-detect
}
```

### 2. Intent Classification

The `determineAgentType()` method uses **priority-based pattern matching**:

**Priority Order**:
1. **EDIcraft** - Minecraft/OSDU visualization
2. **Maintenance** - Equipment monitoring
3. **Weather** - Weather queries (routes to General)
4. **Renewable** - Wind farm workflows
5. **Catalog** - Geographic searches
6. **Petrophysics** - Well data analysis
7. **General** - Default fallback

### 3. Agent Routing

Routes to the appropriate agent:

```typescript
switch (agentType) {
  case 'edicraft':
    result = await this.edicraftAgent.processMessage(message);
    break;
  case 'maintenance':
    result = await this.maintenanceAgent.processMessage(message, sessionContext);
    break;
  case 'petrophysics':
    result = await this.petrophysicsAgent.processMessage(message, sessionContext);
    break;
  case 'renewable':
    result = await this.renewableAgent.processQuery(message, conversationHistory, sessionContext);
    break;
  case 'general':
  default:
    result = await this.generalAgent.processQuery(message, sessionContext);
    break;
}
```

## Pattern Matching Examples

### EDIcraft Patterns

```typescript
/minecraft/i
/clear.*minecraft|minecraft.*clear/i
/wellbore.*trajectory|trajectory.*wellbore/i
/horizon.*surface|surface.*horizon/i
/build.*wellbore|wellbore.*build/i
```

**Example Queries**:
- "Clear the Minecraft environment"
- "Build wellbore trajectory for WELL-123"
- "Show horizon surface in Minecraft"

### Maintenance Patterns

```typescript
/equipment.*failure|failure.*equipment/
/preventive.*maintenance|preventative.*maintenance/
/equipment.*status|status.*equipment/
/maintenance.*history|maintenance.*records/
```

**Example Queries**:
- "Show equipment status for all wells"
- "Predict equipment failure for pump-001"
- "Maintenance history for compressor-005"

### Renewable Patterns

```typescript
/wind.*farm|wind.*turbine|turbine.*layout/
/renewable.*energy|clean.*energy/
/terrain.*analysis|analyze.*terrain/
/layout.*optimization|turbine.*spacing/
```

**Example Queries**:
- "Analyze terrain for wind farm"
- "Create turbine layout optimization"
- "Wind resource assessment for site"

### Petrophysics Patterns

```typescript
/well-\d+|WELL-\d+/
/analyze.*well|well.*analysis/
/calculate.*(porosity|shale|saturation)/
/log.*curves?|well.*logs?/
```

**Example Queries**:
- "Analyze well WELL-001"
- "Calculate porosity for WELL-002"
- "Show log curves for WELL-003"

### General Knowledge Patterns

```typescript
/weather.*in|temperature.*in|forecast.*for/
/regulation.*regarding|law.*about/
/^(what|how|why|when|where)\s+(is|are|was|were)/
/^(hi|hello|hey|good morning)/
```

**Example Queries**:
- "What is the weather in Malaysia?"
- "Tell me about EU AI regulations"
- "Hello, how are you?"
- "What is the latest news?"

## Configuration

### Agent Initialization

```typescript
constructor(foundationModelId?: string, s3Bucket?: string) {
  this.generalAgent = new GeneralKnowledgeAgent();
  this.petrophysicsAgent = new EnhancedStrandsAgent(foundationModelId, s3Bucket);
  this.maintenanceAgent = new MaintenanceStrandsAgent(foundationModelId, s3Bucket);
  this.edicraftAgent = new EDIcraftAgent();
  
  // Renewable agent with fallback
  try {
    const renewableConfig = getRenewableConfig();
    if (renewableConfig.enabled !== false) {
      this.renewableAgent = new RenewableProxyAgent();
      this.renewableEnabled = true;
    }
  } catch (error) {
    // Graceful fallback
  }
}
```

### Environment Variables

No specific environment variables needed for the router itself. Each agent has its own configuration requirements.

## Error Handling

### Router-Level Errors

```typescript
try {
  // Route to appropriate agent
  result = await this.someAgent.processMessage(message);
} catch (error) {
  console.error('❌ AgentRouter: Error in routing:', error);
  return {
    success: false,
    message: `Error routing your request: ${error.message}`,
    agentUsed: 'router_error',
    artifacts: []
  };
}
```

### Agent-Specific Errors

Each agent has its own error handling:

```typescript
case 'edicraft':
  try {
    result = await this.edicraftAgent.processMessage(message);
  } catch (error) {
    return {
      success: false,
      message: `EDIcraft agent error: ${error.message}`,
      agentUsed: 'edicraft_error',
      artifacts: []
    };
  }
```

## Logging

### Routing Decisions

```typescript
console.log('🔀 AgentRouter: Routing query:', message.substring(0, 100) + '...');
console.log('🎯 AgentRouter: Auto-detected agent based on message content:', agentType);
```

### Pattern Matching

```typescript
console.log('🔍 AgentRouter: Testing patterns for message:', lowerMessage);
console.log('🎮 AgentRouter: Testing EDIcraft patterns...');
console.log('  ✅ EDIcraft pattern MATCHED:', pattern.source);
```

### Agent Selection

```typescript
console.log('✅ AgentRouter: Explicit agent selection:', agentType);
console.log('🎯 AgentRouter: Auto-detected agent:', agentType);
```

## Testing

### Test File

**Location**: `test-auto-agent-routing.html`

### Running Tests

1. Open `test-auto-agent-routing.html` in browser
2. Click "▶️ Run All Tests"
3. View results and success rate

### Test Coverage

- ✅ EDIcraft routing (3 tests)
- ✅ Maintenance routing (2 tests)
- ✅ Petrophysics routing (2 tests)
- ✅ Renewable routing (2 tests)
- ✅ General knowledge routing (3 tests)

**Total**: 12 test cases

## Common Issues

### Issue: Query Not Routing Correctly

**Solution**: Check pattern matching in `determineAgentType()`

1. Add logging to see which patterns are being tested
2. Verify the query matches expected patterns
3. Check priority order (higher priority patterns tested first)

### Issue: Agent Not Initialized

**Solution**: Check agent initialization in constructor

1. Verify agent is initialized in constructor
2. Check for initialization errors in logs
3. Ensure required configuration is present

### Issue: Error in Routing

**Solution**: Check error handling

1. Look for error logs in CloudWatch
2. Verify agent-specific error handling
3. Check if agent is returning proper error format

## Best Practices

### 1. Pattern Matching

- Use specific patterns before general ones
- Test patterns in priority order
- Add logging for debugging
- Keep patterns maintainable

### 2. Error Handling

- Catch errors at router level
- Provide user-friendly error messages
- Log detailed error information
- Return consistent error format

### 3. Logging

- Log routing decisions
- Log pattern matches
- Log agent selection
- Log errors with context

### 4. Testing

- Test all agent types
- Test edge cases
- Test error scenarios
- Validate routing accuracy

## Quick Commands

### View Router Logs

```bash
# View CloudWatch logs for chat Lambda
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow
```

### Test Routing Locally

```bash
# Start localhost
npm run dev

# Open test file
open test-auto-agent-routing.html
```

### Deploy Changes

```bash
# Deploy Lambda changes
cd cdk
npm run deploy
```

## Summary

The Auto agent is:
- ✅ Fully functional
- ✅ Well-tested
- ✅ Properly documented
- ✅ Production-ready

No fixes needed - it's working as designed!

---

**Last Updated**: 2025-01-XX
**Status**: Production Ready
**Test Coverage**: 12 test cases
