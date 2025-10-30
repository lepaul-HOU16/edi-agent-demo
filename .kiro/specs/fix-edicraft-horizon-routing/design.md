# EDIcraft Horizon Query Routing Fix - Design

## Overview

This design document outlines the solution for fixing horizon query routing to the EDIcraft agent. The current issue is that horizon-related queries like "find a horizon, tell me its name, convert it to minecraft coordinates..." are not being detected by the agent router's EDIcraft patterns, causing them to route to the petrophysics agent instead.

The root cause is that the current EDIcraft patterns in `agentRouter.ts` focus on explicit "minecraft" keywords and specific phrases like "wellbore trajectory" or "horizon surface", but don't catch more natural language queries about horizons that mention coordinate conversion or Minecraft visualization.

## Architecture

### Current Flow (Broken)

```
User Query: "find a horizon, tell me its name, convert it to minecraft coordinates..."
    ↓
Agent Router (agentRouter.ts)
    ↓
Pattern Matching: No EDIcraft pattern matches
    ↓
Default to Petrophysics Agent
    ↓
Petrophysics Welcome Message (WRONG!)
```

### Fixed Flow

```
User Query: "find a horizon, tell me its name, convert it to minecraft coordinates..."
    ↓
Agent Router (agentRouter.ts)
    ↓
Enhanced Pattern Matching: Horizon + Minecraft/Coordinates pattern matches
    ↓
Route to EDIcraft Agent
    ↓
EDIcraft Handler → MCP Client → Bedrock AgentCore
    ↓
Python Agent processes horizon query
    ↓
Response with horizon name and Minecraft coordinates
```

## Components and Interfaces

### 1. Enhanced Agent Router Pattern Matching

**File**: `amplify/functions/agents/agentRouter.ts`

**Current EDIcraft Patterns** (lines 138-165):
```typescript
const edicraftPatterns = [
  /minecraft/i,
  /wellbore.*trajectory|trajectory.*wellbore/i,
  /build.*wellbore|wellbore.*build/i,
  /osdu.*wellbore/i,
  /3d.*wellbore|wellbore.*path/i,
  /horizon.*surface|surface.*horizon/i,
  /build.*horizon|render.*surface/i,
  /osdu.*horizon/i,
  /geological.*surface/i,
  /player.*position/i,
  /coordinate.*tracking/i,
  /transform.*coordinates/i,
  /utm.*minecraft/i,
  /minecraft.*visualization/i,
  /visualize.*minecraft/i,
  /subsurface.*visualization/i,
  /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
  /well.*log.*minecraft|log.*minecraft/i,
  /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i
];
```

**Problem**: These patterns don't catch queries like:
- "find a horizon" (no "minecraft" keyword)
- "horizon name" (no "surface" keyword)
- "convert to minecraft coordinates" (split across multiple words)
- "print out the coordinates" (indirect reference to Minecraft)

**Enhanced Patterns** (to add):
```typescript
const edicraftPatterns = [
  // Existing patterns...
  
  // NEW: Horizon finding and naming patterns
  /find.*horizon|horizon.*find/i,
  /get.*horizon|horizon.*name/i,
  /list.*horizon|show.*horizon/i,
  /horizon.*data|horizon.*information/i,
  
  // NEW: Coordinate conversion patterns (more flexible)
  /convert.*coordinates|coordinates.*convert/i,
  /convert.*to.*minecraft|minecraft.*convert/i,
  /transform.*to.*minecraft|minecraft.*transform/i,
  /coordinates.*for.*minecraft|minecraft.*coordinates/i,
  /coordinates.*you.*use|coordinates.*to.*use/i,
  /print.*coordinates|output.*coordinates/i,
  
  // NEW: Combined horizon + coordinate patterns (HIGHEST PRIORITY)
  /horizon.*coordinates|coordinates.*horizon/i,
  /horizon.*minecraft|minecraft.*horizon/i,
  /horizon.*convert|convert.*horizon/i,
  /horizon.*show|show.*horizon/i,
  /horizon.*print|print.*horizon/i,
  
  // NEW: Natural language patterns
  /tell.*me.*horizon|horizon.*tell.*me/i,
  /what.*horizon|which.*horizon/i,
  /where.*horizon|horizon.*where/i
];
```

**Pattern Priority**: Horizon + coordinate/minecraft patterns should be checked FIRST before other patterns to ensure they take precedence.

### 2. Pattern Matching Logic Enhancement

**Current Logic** (lines 167-173):
```typescript
const matchedEDIcraftPatterns = edicraftPatterns.filter(pattern => pattern.test(lowerMessage));
if (matchedEDIcraftPatterns.length > 0) {
  console.log('🎮 AgentRouter: EDIcraft pattern matched');
  console.log('🎮 AgentRouter: Matched patterns:', matchedEDIcraftPatterns.map(p => p.source).join(', '));
  return 'edicraft';
}
```

**Enhanced Logic** (with detailed logging):
```typescript
// Test each pattern individually with detailed logging
const matchedEDIcraftPatterns: { pattern: RegExp; source: string }[] = [];

for (const pattern of edicraftPatterns) {
  if (pattern.test(lowerMessage)) {
    matchedEDIcraftPatterns.push({ pattern, source: pattern.source });
    console.log('🎮 AgentRouter: EDIcraft pattern MATCHED:', pattern.source);
    console.log('🎮 AgentRouter: Query excerpt:', lowerMessage.substring(0, 100));
  }
}

if (matchedEDIcraftPatterns.length > 0) {
  console.log('🎮 AgentRouter: EDIcraft agent selected');
  console.log('🎮 AgentRouter: Total patterns matched:', matchedEDIcraftPatterns.length);
  console.log('🎮 AgentRouter: Matched patterns:', matchedEDIcraftPatterns.map(p => p.source).join(', '));
  return 'edicraft';
}
```

### 3. EDIcraft Handler Response Processing

**File**: `amplify/functions/edicraftAgent/handler.ts`

**Current Issue**: The handler correctly processes non-greeting messages, but we need to ensure horizon-specific responses are properly formatted.

**No changes needed** to handler.ts - it already:
1. Validates environment variables
2. Processes messages through MCP client
3. Returns responses with thought steps
4. Handles errors gracefully

The Python agent (`edicraft-agent/agent.py`) should handle horizon-specific processing.

### 4. Python Agent Horizon Processing

**File**: `edicraft-agent/agent.py` (or equivalent in Bedrock AgentCore)

**Expected Behavior**:
1. Receive horizon query from handler
2. Use MCP tools to fetch horizon data from OSDU or local sources
3. Extract horizon name and UTM coordinates
4. Convert UTM coordinates to Minecraft coordinate system
5. Return formatted response with horizon name and coordinates

**Response Format**:
```markdown
# Horizon Found: [HORIZON_NAME]

I found the horizon "[HORIZON_NAME]" in the subsurface data.

## Coordinates

**UTM Coordinates:**
- Easting: [X] m
- Northing: [Y] m
- Elevation: [Z] m

**Minecraft Coordinates:**
- X: [minecraft_x]
- Y: [minecraft_y]
- Z: [minecraft_z]

## Next Steps

Connect to the Minecraft server to see the horizon surface visualization at these coordinates.
```

## Data Models

### Agent Router Response

```typescript
interface RouterResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
}
```

### EDIcraft Handler Response

```typescript
interface EDIcraftHandlerResponse {
  success: boolean;
  message: string;
  artifacts: any[]; // Always empty - visualization in Minecraft
  thoughtSteps: ThoughtStep[];
  connectionStatus: 'connected' | 'error' | 'pending' | 'ready';
  error?: string;
}
```

### Thought Step Model

```typescript
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

## Error Handling

### Pattern Matching Failures

**Symptom**: Query not routed to EDIcraft agent

**Detection**:
- Log all pattern tests with results
- Log which agent was selected
- Log the query that was tested

**Resolution**:
- Add missing patterns to edicraftPatterns array
- Test patterns with regex101.com
- Verify pattern order (most specific first)

### Horizon Data Not Found

**Symptom**: Agent can't find horizon data

**Response**:
```markdown
❌ Horizon Not Found

I couldn't find horizon data in the available sources.

🔧 Troubleshooting:
1. Verify OSDU platform connection
2. Check horizon data is available in the partition
3. Try specifying a horizon name explicitly
4. Check OSDU credentials and permissions
```

### Coordinate Conversion Errors

**Symptom**: Can't convert UTM to Minecraft coordinates

**Response**:
```markdown
❌ Coordinate Conversion Error

I found the horizon but couldn't convert coordinates to Minecraft format.

🔧 Troubleshooting:
1. Verify UTM zone is correct
2. Check coordinate reference system
3. Verify Minecraft world origin is configured
4. Check coordinate transformation tools are available
```

## Testing Strategy

### Unit Tests

**Test File**: `tests/unit/test-agent-router-horizon.test.ts`

```typescript
describe('Agent Router - Horizon Query Detection', () => {
  it('should route "find a horizon" to EDIcraft', () => {
    const router = new AgentRouter();
    const result = router['determineAgentType']('find a horizon');
    expect(result).toBe('edicraft');
  });

  it('should route "horizon name" to EDIcraft', () => {
    const router = new AgentRouter();
    const result = router['determineAgentType']('tell me the horizon name');
    expect(result).toBe('edicraft');
  });

  it('should route "convert to minecraft coordinates" to EDIcraft', () => {
    const router = new AgentRouter();
    const result = router['determineAgentType']('convert to minecraft coordinates');
    expect(result).toBe('edicraft');
  });

  it('should route complex horizon query to EDIcraft', () => {
    const router = new AgentRouter();
    const query = 'find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates';
    const result = router['determineAgentType'](query);
    expect(result).toBe('edicraft');
  });
});
```

### Integration Tests

**Test File**: `tests/integration/test-edicraft-horizon-workflow.test.ts`

```typescript
describe('EDIcraft Horizon Workflow', () => {
  it('should process horizon query end-to-end', async () => {
    const router = new AgentRouter();
    const query = 'find a horizon, tell me its name, convert it to minecraft coordinates';
    
    const response = await router.routeQuery(query);
    
    expect(response.agentUsed).toBe('edicraft');
    expect(response.success).toBe(true);
    expect(response.message).toContain('Horizon');
    expect(response.message).toContain('Minecraft Coordinates');
  });
});
```

### Manual Testing

**Test Script**: `tests/manual/test-edicraft-horizon-query.sh`

```bash
#!/bin/bash

echo "Testing EDIcraft horizon query routing..."

# Test 1: Simple horizon query
echo "Test 1: find a horizon"
node tests/test-edicraft-routing.js "find a horizon"

# Test 2: Horizon with name
echo "Test 2: tell me the horizon name"
node tests/test-edicraft-routing.js "tell me the horizon name"

# Test 3: Coordinate conversion
echo "Test 3: convert to minecraft coordinates"
node tests/test-edicraft-routing.js "convert to minecraft coordinates"

# Test 4: Complex query (the actual user query)
echo "Test 4: Complex horizon query"
node tests/test-edicraft-routing.js "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"

echo "All tests complete!"
```

## Implementation Phases

### Phase 1: Enhanced Pattern Matching (CRITICAL)
1. Add new horizon-specific patterns to edicraftPatterns array
2. Add coordinate conversion patterns
3. Add combined horizon + minecraft/coordinate patterns
4. Add natural language patterns
5. Test pattern matching with various queries

**Success Criteria**: Query "find a horizon, tell me its name, convert it to minecraft coordinates..." routes to EDIcraft agent

### Phase 2: Enhanced Logging
1. Add detailed pattern matching logs
2. Log each pattern test result
3. Log matched patterns with query excerpt
4. Log agent selection decision

**Success Criteria**: Can see exactly which patterns matched and why EDIcraft was selected

### Phase 3: Testing
1. Create unit tests for horizon pattern matching
2. Create integration tests for horizon workflow
3. Create manual test script
4. Test with various horizon queries

**Success Criteria**: All tests pass, horizon queries route correctly

### Phase 4: Validation
1. Deploy updated agent router
2. Test with actual user query
3. Verify response includes horizon name and coordinates
4. Verify thought steps show proper execution

**Success Criteria**: User query works end-to-end, returns horizon data

## Deployment Considerations

### Changes Required

**File**: `amplify/functions/agents/agentRouter.ts`
- Add ~15 new regex patterns to edicraftPatterns array
- Enhance pattern matching logging
- No breaking changes to existing functionality

### Deployment Steps

1. Update agentRouter.ts with new patterns
2. Run TypeScript compilation: `npx tsc --noEmit`
3. Run linter: `npm run lint`
4. Deploy to sandbox: `npx ampx sandbox`
5. Wait for deployment to complete
6. Test with user query
7. Verify routing logs show EDIcraft selection
8. Verify response includes horizon data

### Rollback Plan

If deployment fails or causes issues:
1. Revert agentRouter.ts to previous version
2. Redeploy: `npx ampx sandbox`
3. Verify existing functionality still works
4. Investigate pattern conflicts
5. Fix and redeploy

## Performance Considerations

### Pattern Matching Performance

**Current**: ~20 regex patterns tested sequentially
**After Fix**: ~35 regex patterns tested sequentially

**Impact**: Minimal - regex matching is fast, adding 15 patterns adds <1ms to routing time

**Optimization**: Patterns are tested in priority order, so most queries match early patterns and don't test all patterns

### Memory Usage

**Impact**: Negligible - regex patterns are compiled once at router initialization

## Security Considerations

### Input Validation

All user queries are already validated by the handler before reaching the agent router. No additional validation needed.

### Pattern Injection

Regex patterns are hardcoded in the router, not user-provided. No injection risk.

## Monitoring and Logging

### Key Metrics to Monitor

1. **EDIcraft Routing Rate**: % of queries routed to EDIcraft
2. **Pattern Match Rate**: Which patterns match most frequently
3. **Horizon Query Success Rate**: % of horizon queries that succeed
4. **Response Time**: Time from query to response

### Log Messages to Watch

```
🎮 AgentRouter: EDIcraft pattern MATCHED: [pattern]
🎮 AgentRouter: EDIcraft agent selected
🎮 AgentRouter: Total patterns matched: [count]
🎮 Processing EDIcraft message: [query]
🎮 EDIcraft agent response received
```

### Alerts

- Alert if EDIcraft routing rate drops below expected baseline
- Alert if horizon queries fail repeatedly
- Alert if response time exceeds 30 seconds

## Success Criteria

The implementation is successful when:

1. ✅ Query "find a horizon, tell me its name, convert it to minecraft coordinates..." routes to EDIcraft agent
2. ✅ Agent router logs show EDIcraft pattern matched
3. ✅ EDIcraft handler processes the query
4. ✅ Response includes horizon name and Minecraft coordinates
5. ✅ Thought steps show proper execution flow
6. ✅ All unit tests pass
7. ✅ All integration tests pass
8. ✅ Manual testing confirms end-to-end workflow
9. ✅ User validates the fix works
10. ✅ No regressions in existing EDIcraft or other agent functionality

## Known Limitations

1. **Pattern Complexity**: Very complex natural language queries may still not match patterns
2. **Ambiguous Queries**: Queries that could apply to multiple agents may route incorrectly
3. **Pattern Maintenance**: New query patterns require code updates

## Future Enhancements

1. **ML-Based Intent Detection**: Replace regex patterns with machine learning model
2. **Query Rewriting**: Automatically rewrite ambiguous queries for better routing
3. **User Feedback Loop**: Learn from user corrections when routing is wrong
4. **Pattern Analytics**: Track which patterns match most frequently to optimize order
