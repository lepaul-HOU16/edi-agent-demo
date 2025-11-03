# Design Document

## Overview

This design addresses the parameter validation timing issue in the renewable orchestrator that prevents natural conversational workflows. The core problem is that parameter validation occurs before project context is loaded, causing "missing parameter" errors even when the information exists in the active project.

## Architecture

### Current Flow (Broken)
```
1. Parse intent from query
2. Validate parameters ❌ (fails here - no coordinates)
3. Load project context (too late)
4. Auto-fill parameters from project (never reached)
5. Call tool Lambda
```

### New Flow (Fixed)
```
1. Parse intent from query
2. Resolve project context
3. Load project data from S3
4. Merge project data into intent parameters
5. Validate parameters ✅ (now has coordinates)
6. Call tool Lambda
```

## Components and Interfaces

### 1. Enhanced Parameter Validator

**File:** `amplify/functions/renewableOrchestrator/parameterValidator.ts`

**Changes:**
- Add `projectContext` parameter to `validateParameters()`
- Check project context for missing required parameters before marking them as errors
- Add `canSatisfyFromContext()` helper function

**New Interface:**
```typescript
interface ProjectContext {
  projectName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
}

function validateParameters(
  intent: RenewableIntent,
  projectContext?: ProjectContext
): ParameterValidationResult;

function canSatisfyFromContext(
  param: string,
  intentType: string,
  projectContext?: ProjectContext
): boolean;
```

**Logic:**
```typescript
// For layout_optimization requiring latitude/longitude
if (intentType === 'layout_optimization') {
  if (!intent.params.latitude && projectContext?.coordinates?.latitude) {
    // Can be satisfied from context - don't mark as missing
    warnings.push('Using coordinates from active project');
  } else if (!intent.params.latitude) {
    // Cannot be satisfied - mark as missing
    missingRequired.push('latitude');
  }
}
```

### 2. Orchestrator Flow Reordering

**File:** `amplify/functions/renewableOrchestrator/handler.ts`

**Changes:**
- Move project resolution and data loading BEFORE parameter validation
- Pass project context to parameter validator
- Merge project data into intent params before validation

**New Flow:**
```typescript
// Step 1: Parse intent
const intent = await parseIntent(event.query, event.context);

// Step 2: Resolve project name (MOVED UP)
const projectResolver = new ProjectResolver(projectStore);
const sessionContext = await sessionContextManager.getContext(sessionId);
const resolveResult = await projectResolver.resolve(event.query, sessionContext);
const projectName = resolveResult.projectName || 
  await projectNameGenerator.generateFromQuery(event.query);

// Step 3: Load project data (MOVED UP)
let projectData = null;
let projectContext: ProjectContext = {};
if (projectName) {
  projectData = await projectStore.load(projectName);
  if (projectData) {
    projectContext = {
      projectName,
      coordinates: projectData.coordinates,
      terrain_results: projectData.terrain_results,
      layout_results: projectData.layout_results,
      simulation_results: projectData.simulation_results
    };
    
    // Auto-fill parameters from project context
    if (!intent.params.latitude && projectData.coordinates) {
      intent.params.latitude = projectData.coordinates.latitude;
      intent.params.longitude = projectData.coordinates.longitude;
      console.log('✅ Auto-filled coordinates from project context');
    }
  }
}

// Step 4: Validate parameters (NOW HAS COMPLETE CONTEXT)
const paramValidation = validateParameters(intent, projectContext);
```

### 3. Enhanced Error Messages

**File:** `amplify/functions/shared/errorMessageTemplates.ts`

**New Functions:**
```typescript
static formatMissingContextError(
  intentType: string,
  missingParams: string[],
  activeProject?: string
): string {
  const suggestions: Record<string, string> = {
    layout_optimization: 
      "To optimize layout, either:\n" +
      "• Provide coordinates: 'optimize layout at 35.067482, -101.395466'\n" +
      "• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'",
    
    wake_simulation:
      "To run wake simulation, first:\n" +
      "• Create a layout: 'optimize layout'\n" +
      "• Or specify a project: 'run wake simulation for project-name'",
    
    report_generation:
      "To generate a report, first:\n" +
      "• Complete terrain analysis and layout optimization\n" +
      "• Or specify a project: 'generate report for project-name'"
  };
  
  let message = `Missing required information: ${missingParams.join(', ')}.\n\n`;
  message += suggestions[intentType] || 'Please provide the required parameters.';
  
  if (activeProject) {
    message += `\n\nActive project: ${activeProject}`;
  }
  
  return message;
}
```

### 4. Context-Aware Parameter Requirements

**File:** `amplify/functions/renewableOrchestrator/parameterValidator.ts`

**New Logic:**
```typescript
const CONTEXT_SATISFIABLE_PARAMS: Record<string, Record<string, string[]>> = {
  layout_optimization: {
    coordinates: ['latitude', 'longitude'],
    terrain: ['terrain_results']
  },
  wake_simulation: {
    layout: ['layout_results'],
    coordinates: ['latitude', 'longitude']
  },
  report_generation: {
    all_results: ['terrain_results', 'layout_results']
  }
};

function canSatisfyFromContext(
  param: string,
  intentType: string,
  projectContext?: ProjectContext
): boolean {
  if (!projectContext) return false;
  
  const satisfiable = CONTEXT_SATISFIABLE_PARAMS[intentType];
  if (!satisfiable) return false;
  
  // Check if this parameter can be satisfied by context
  for (const [contextKey, params] of Object.entries(satisfiable)) {
    if (params.includes(param)) {
      // Check if context has the required data
      if (contextKey === 'coordinates' && projectContext.coordinates) {
        return true;
      }
      if (contextKey === 'terrain' && projectContext.terrain_results) {
        return true;
      }
      if (contextKey === 'layout' && projectContext.layout_results) {
        return true;
      }
      if (contextKey === 'all_results' && 
          projectContext.terrain_results && 
          projectContext.layout_results) {
        return true;
      }
    }
  }
  
  return false;
}
```

## Data Models

### ProjectContext Interface
```typescript
interface ProjectContext {
  projectName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: {
    features: any[];
    analysis: any;
  };
  layout_results?: {
    turbines: any[];
    layout: any;
  };
  simulation_results?: {
    wake_analysis: any;
    energy_production: any;
  };
  report_results?: {
    report_url: string;
    summary: any;
  };
}
```

### Enhanced ParameterValidationResult
```typescript
interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidValues: string[];
  satisfiedByContext: string[]; // NEW: params satisfied by project context
  contextUsed: boolean; // NEW: whether context was used
}
```

## Error Handling

### Missing Context Scenarios

**Scenario 1: No Active Project**
```
User: "optimize layout"
System: "Missing required information: latitude, longitude.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'"
```

**Scenario 2: Active Project Without Coordinates**
```
User: "optimize layout"
System: "Active project 'west-texas-site' doesn't have coordinates yet.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'"
```

**Scenario 3: Successful Context Use**
```
User: "optimize layout"
System: "✅ Using coordinates from active project 'west-texas-site'
[Proceeds with layout optimization]"
```

### Validation Failure Logging

Enhanced CloudWatch logging:
```json
{
  "level": "ERROR",
  "category": "PARAMETER_VALIDATION",
  "requestId": "req-123",
  "intentType": "layout_optimization",
  "validation": {
    "isValid": false,
    "missingRequired": ["latitude", "longitude"],
    "satisfiedByContext": [],
    "contextUsed": false
  },
  "projectContext": {
    "hasActiveProject": false,
    "hasCoordinates": false
  },
  "providedParameters": {},
  "timestamp": "2025-01-16T10:30:00Z"
}
```

## Testing Strategy

### Unit Tests

**File:** `tests/unit/test-parameter-validation-with-context.test.ts`

```typescript
describe('Parameter Validation with Context', () => {
  test('should accept layout optimization with project coordinates', () => {
    const intent = {
      type: 'layout_optimization',
      params: {},
      confidence: 90
    };
    
    const projectContext = {
      projectName: 'test-project',
      coordinates: { latitude: 35.067482, longitude: -101.395466 }
    };
    
    const result = validateParameters(intent, projectContext);
    expect(result.isValid).toBe(true);
    expect(result.satisfiedByContext).toContain('latitude');
    expect(result.satisfiedByContext).toContain('longitude');
  });
  
  test('should fail layout optimization without coordinates or context', () => {
    const intent = {
      type: 'layout_optimization',
      params: {},
      confidence: 90
    };
    
    const result = validateParameters(intent);
    expect(result.isValid).toBe(false);
    expect(result.missingRequired).toContain('latitude');
    expect(result.missingRequired).toContain('longitude');
  });
  
  test('should prefer explicit coordinates over context', () => {
    const intent = {
      type: 'layout_optimization',
      params: { latitude: 40.0, longitude: -100.0 },
      confidence: 90
    };
    
    const projectContext = {
      coordinates: { latitude: 35.0, longitude: -101.0 }
    };
    
    const result = validateParameters(intent, projectContext);
    expect(result.isValid).toBe(true);
    expect(result.satisfiedByContext).toHaveLength(0);
  });
});
```

### Integration Tests

**File:** `tests/integration/test-layout-optimization-flow.test.ts`

```typescript
describe('Layout Optimization Flow', () => {
  test('should auto-fill coordinates from terrain analysis', async () => {
    // Step 1: Run terrain analysis
    const terrainResponse = await orchestrator.handler({
      query: 'analyze terrain at 35.067482, -101.395466',
      sessionId: 'test-session'
    });
    
    expect(terrainResponse.success).toBe(true);
    const projectName = terrainResponse.metadata.projectName;
    
    // Step 2: Request layout optimization without coordinates
    const layoutResponse = await orchestrator.handler({
      query: 'optimize layout',
      sessionId: 'test-session'
    });
    
    expect(layoutResponse.success).toBe(true);
    expect(layoutResponse.thoughtSteps).toContainEqual(
      expect.objectContaining({
        action: 'Loading project data',
        result: 'Project data loaded'
      })
    );
    expect(layoutResponse.thoughtSteps).toContainEqual(
      expect.objectContaining({
        action: 'Validating parameters',
        result: 'All parameters valid'
      })
    );
  });
});
```

### End-to-End Tests

**File:** `tests/e2e/test-conversational-workflow.test.ts`

```typescript
describe('Conversational Workflow', () => {
  test('should support natural conversation flow', async () => {
    const sessionId = `test-${Date.now()}`;
    
    // User: "analyze terrain at coordinates"
    const step1 = await sendQuery(
      'analyze terrain at 35.067482, -101.395466',
      sessionId
    );
    expect(step1.success).toBe(true);
    
    // User: "optimize layout" (no coordinates)
    const step2 = await sendQuery('optimize layout', sessionId);
    expect(step2.success).toBe(true);
    expect(step2.message).toContain('Using coordinates from');
    
    // User: "run wake simulation" (no layout specified)
    const step3 = await sendQuery('run wake simulation', sessionId);
    expect(step3.success).toBe(true);
    
    // User: "generate report" (no project specified)
    const step4 = await sendQuery('generate report', sessionId);
    expect(step4.success).toBe(true);
  });
});
```

## Deployment Considerations

### Backward Compatibility
- Existing queries with explicit parameters will continue to work
- No changes to tool Lambda interfaces
- No database schema changes required

### Performance Impact
- Project data loading moved earlier in flow (minimal impact)
- Additional context checking in validation (< 1ms overhead)
- No additional S3 calls (already loading project data)

### Rollback Plan
If issues arise:
1. Revert orchestrator handler changes
2. Revert parameter validator changes
3. Keep error message improvements (safe)

### Monitoring
Add CloudWatch metrics:
- `ParameterAutoFillSuccess`: Count of successful auto-fills
- `ParameterAutoFillFailure`: Count of failed auto-fills
- `ContextValidationTime`: Time spent in context-aware validation

## Success Criteria

1. ✅ User can say "optimize layout" after terrain analysis without repeating coordinates
2. ✅ User can say "run wake simulation" after layout optimization without specifying project
3. ✅ User can say "generate report" after completing workflow without specifying project
4. ✅ Clear error messages when context is missing
5. ✅ Explicit parameters still take precedence over context
6. ✅ All existing tests continue to pass
7. ✅ New tests validate context-aware behavior
