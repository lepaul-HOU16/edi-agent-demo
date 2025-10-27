# Design Document

## Overview

This design addresses the critical routing bug where terrain analysis queries are incorrectly matched by the project listing handler. The fix involves making regex patterns more specific and adding proper validation to prevent false matches.

## Architecture

### Current Flow (Broken)
```
User: "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
  ↓
RenewableProxyAgent.processQuery()
  ↓
Orchestrator Handler
  ↓
ProjectListHandler.isProjectListQuery() → TRUE (INCORRECT!)
  ↓
Returns list of 34 projects (WRONG!)
```

### Fixed Flow
```
User: "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
  ↓
RenewableProxyAgent.processQuery()
  ↓
Orchestrator Handler
  ↓
ProjectListHandler.isProjectListQuery() → FALSE (CORRECT!)
  ↓
IntentRouter.parseIntent() → terrain_analysis
  ↓
Calls terrain tool Lambda
  ↓
Returns terrain analysis results (CORRECT!)
```

## Components and Interfaces

### 1. ProjectListHandler Pattern Fixes

**File:** `amplify/functions/shared/projectListHandler.ts`

**Current Problematic Patterns:**
```typescript
static isProjectListQuery(query: string): boolean {
  const patterns = [
    /list.*my.*projects?/i,  // TOO BROAD - matches "Analyze terrain at..."
    /show.*my.*projects?/i,  // TOO BROAD
    /what.*projects?.*do.*i.*have/i,  // TOO BROAD
    // ... more patterns
  ];
  return patterns.some(pattern => pattern.test(query));
}
```

**Fixed Patterns with Word Boundaries:**
```typescript
static isProjectListQuery(query: string): boolean {
  const patterns = [
    // Use word boundaries \b to ensure exact word matches
    /\blist\b.*\bmy\b.*\bprojects?\b/i,
    /\bshow\b.*\bmy\b.*\bprojects?\b/i,
    /\bwhat\b.*\bprojects?\b.*\bdo\b.*\bi\b.*\bhave\b/i,
    /\bmy\b.*\brenewable\b.*\bprojects?\b/i,
    /\ball\b.*\bmy\b.*\bprojects?\b/i,
    /\bview\b.*\bprojects?\b/i,
    /\bsee\b.*\bmy\b.*\bprojects?\b/i
  ];
  
  // Additional safety check: reject if query contains action verbs
  const actionVerbs = ['analyze', 'optimize', 'simulate', 'generate', 'create', 'run', 'perform'];
  const lowerQuery = query.toLowerCase();
  const hasActionVerb = actionVerbs.some(verb => lowerQuery.includes(verb));
  
  if (hasActionVerb) {
    console.log('[ProjectListHandler] Query contains action verb, not a list query');
    return false;
  }
  
  return patterns.some(pattern => pattern.test(query));
}
```

**Key Changes:**
1. Add `\b` word boundaries around all keywords
2. Add safety check to reject queries with action verbs
3. Add logging for debugging

### 2. Project Details Pattern Fixes

**Current Problematic Pattern:**
```typescript
static isProjectDetailsQuery(query: string): { isMatch: boolean; projectName?: string } {
  const patterns = [
    /show.*project\s+([a-z0-9-]+)/i,  // Could match too broadly
    // ... more patterns
  ];
}
```

**Fixed Pattern:**
```typescript
static isProjectDetailsQuery(query: string): { isMatch: boolean; projectName?: string } {
  const patterns = [
    /\bshow\b.*\bproject\b\s+([a-z0-9-]+)/i,
    /\bdetails\b.*\bfor\b.*\bproject\b\s+([a-z0-9-]+)/i,
    /\bproject\b\s+([a-z0-9-]+).*\bdetails\b/i,
    /\bview\b.*\bproject\b\s+([a-z0-9-]+)/i,
    /\binfo\b.*\babout\b.*\bproject\b\s+([a-z0-9-]+)/i,
    /\bstatus\b.*\bof\b.*\bproject\b\s+([a-z0-9-]+)/i
  ];
  
  // Additional safety check: must explicitly mention "project"
  if (!query.toLowerCase().includes('project')) {
    return { isMatch: false };
  }
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return {
        isMatch: true,
        projectName: match[1]
      };
    }
  }
  
  return { isMatch: false };
}
```

### 3. Orchestrator Handler Order

**File:** `amplify/functions/renewableOrchestrator/handler.ts`

**Current Order (Problematic):**
```typescript
// Check project list BEFORE intent detection
if (ProjectListHandler.isProjectListQuery(event.query)) {
  // Returns project list
}

// Then check intent
const intent = await parseIntent(event.query, event.context);
```

**Keep Current Order (It's Actually Correct):**

The current order is correct - we SHOULD check for project management queries first. The problem is the patterns are too broad. Once we fix the patterns, the order is fine.

### 4. Enhanced Logging

Add detailed logging to help debug routing decisions:

```typescript
static isProjectListQuery(query: string): boolean {
  console.log('[ProjectListHandler] Testing query:', query);
  
  const patterns = [
    // ... patterns
  ];
  
  // Test each pattern individually for debugging
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(query)) {
      console.log(`[ProjectListHandler] ✅ Matched pattern ${i + 1}:`, patterns[i].source);
      
      // Safety check for action verbs
      const actionVerbs = ['analyze', 'optimize', 'simulate', 'generate', 'create', 'run', 'perform'];
      const lowerQuery = query.toLowerCase();
      const hasActionVerb = actionVerbs.some(verb => lowerQuery.includes(verb));
      
      if (hasActionVerb) {
        console.log('[ProjectListHandler] ❌ Rejected: Query contains action verb');
        return false;
      }
      
      return true;
    }
  }
  
  console.log('[ProjectListHandler] ❌ No patterns matched');
  return false;
}
```

## Data Models

No data model changes required. This is purely a pattern matching fix.

## Error Handling

### False Positive Detection

If a query is incorrectly routed to project listing:
1. Log the query and matched pattern
2. Log the action verb that should have prevented the match
3. Return helpful error message suggesting the correct query format

### False Negative Detection

If a legitimate project list query is not matched:
1. Log the query and all tested patterns
2. Suggest alternative phrasings that would match

## Testing Strategy

### Unit Tests

**File:** `tests/unit/test-project-list-handler-patterns.test.ts`

```typescript
describe('ProjectListHandler Pattern Matching', () => {
  describe('isProjectListQuery', () => {
    it('should match legitimate project list queries', () => {
      const validQueries = [
        'list my projects',
        'show my renewable projects',
        'what projects do I have',
        'view my projects',
        'see all my projects'
      ];
      
      validQueries.forEach(query => {
        expect(ProjectListHandler.isProjectListQuery(query)).toBe(true);
      });
    });
    
    it('should NOT match terrain analysis queries', () => {
      const terrainQueries = [
        'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
        'analyze terrain at 40.7128, -74.0060',
        'perform terrain analysis for location 51.5074, -0.1278'
      ];
      
      terrainQueries.forEach(query => {
        expect(ProjectListHandler.isProjectListQuery(query)).toBe(false);
      });
    });
    
    it('should NOT match other renewable energy queries', () => {
      const renewableQueries = [
        'optimize layout for my project',
        'run wake simulation',
        'generate comprehensive report',
        'create wind farm layout'
      ];
      
      renewableQueries.forEach(query => {
        expect(ProjectListHandler.isProjectListQuery(query)).toBe(false);
      });
    });
  });
  
  describe('isProjectDetailsQuery', () => {
    it('should match project details queries with project name', () => {
      const result = ProjectListHandler.isProjectDetailsQuery('show project claude-texas-wind-farm-10');
      expect(result.isMatch).toBe(true);
      expect(result.projectName).toBe('claude-texas-wind-farm-10');
    });
    
    it('should NOT match queries without "project" keyword', () => {
      const result = ProjectListHandler.isProjectDetailsQuery('show claude-texas-wind-farm-10');
      expect(result.isMatch).toBe(false);
    });
  });
});
```

### Integration Tests

**File:** `tests/integration/test-orchestrator-routing.test.ts`

```typescript
describe('Orchestrator Routing', () => {
  it('should route terrain analysis to terrain tool', async () => {
    const event = {
      query: 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
      context: {},
      sessionId: 'test-session'
    };
    
    const response = await handler(event);
    
    expect(response.success).toBe(true);
    expect(response.metadata.toolsUsed).toContain('terrain_analysis');
    expect(response.artifacts.length).toBeGreaterThan(0);
  });
  
  it('should route project list query to project list handler', async () => {
    const event = {
      query: 'list my renewable projects',
      context: {},
      sessionId: 'test-session'
    };
    
    const response = await handler(event);
    
    expect(response.success).toBe(true);
    expect(response.metadata.toolsUsed).toContain('project_list');
  });
});
```

### End-to-End Tests

**File:** `tests/e2e/test-terrain-analysis-routing.test.ts`

```typescript
describe('Terrain Analysis E2E', () => {
  it('should perform terrain analysis when explicitly requested', async () => {
    // Simulate user selecting Renewables Agent and submitting query
    const query = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
    
    // Call through RenewableProxyAgent
    const proxyAgent = new RenewableProxyAgent();
    const response = await proxyAgent.processQuery(query, [], {
      chatSessionId: 'test-session',
      userId: 'test-user'
    });
    
    // Verify correct routing
    expect(response.success).toBe(true);
    expect(response.artifacts.length).toBeGreaterThan(0);
    expect(response.artifacts[0].type).toBe('terrain_analysis');
    expect(response.message).not.toContain('projects that match');
  });
});
```

## Implementation Plan

### Phase 1: Fix Patterns (Immediate)
1. Update `ProjectListHandler.isProjectListQuery()` with word boundaries
2. Add action verb safety check
3. Update `ProjectListHandler.isProjectDetailsQuery()` with word boundaries
4. Add enhanced logging

### Phase 2: Add Tests (Immediate)
1. Create unit tests for pattern matching
2. Create integration tests for orchestrator routing
3. Create E2E tests for full flow

### Phase 3: Validation (Before Deployment)
1. Run all tests
2. Test manually with problematic query
3. Test with legitimate project list queries
4. Verify no regressions

## Deployment Considerations

### Rollout Strategy
1. Deploy pattern fixes to sandbox
2. Test with real queries
3. Monitor CloudWatch logs for routing decisions
4. Deploy to production after validation

### Rollback Plan
If patterns are too restrictive:
1. Revert to previous patterns
2. Add more specific patterns incrementally
3. Test each pattern individually

### Monitoring
- Monitor CloudWatch logs for pattern match/reject decisions
- Track routing success rate
- Alert on unexpected routing patterns

## Success Criteria

1. ✅ "Analyze terrain at coordinates X, Y" routes to terrain analysis
2. ✅ "list my projects" routes to project listing
3. ✅ No false positives (terrain queries matched as project list)
4. ✅ No false negatives (project list queries not matched)
5. ✅ All tests pass
6. ✅ CloudWatch logs show correct routing decisions
