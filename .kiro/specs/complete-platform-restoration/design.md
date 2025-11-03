# Design Document: Complete Platform Restoration

## Overview

This design systematically addresses all platform regressions by fixing issues in order of dependency. We'll start with the most fundamental issues (chat completion, Lambda deployment) and work up to higher-level functionality (visualizations, end-to-end workflows).

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ChatMessage  │  │ Artifacts    │  │ Visualizations│      │
│  │ Component    │  │ Rendering    │  │ Components    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                    ┌───────▼────────┐                        │
│                    │ amplifyUtils   │                        │
│                    │ (GraphQL/State)│                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   AWS AppSync   │
                    │   (GraphQL API) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ Renewable      │  │ Renewable       │  │ Renewable      │
│ Orchestrator   │  │ Tools           │  │ Terrain        │
│ Lambda         │  │ (Layout/Sim)    │  │ Lambda         │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  S3 + DynamoDB  │
                    │  (Artifacts)    │
                    └─────────────────┘
```

### Critical Data Flow

1. **User Query** → Frontend ChatMessage component
2. **GraphQL Mutation** → AppSync → Lambda function
3. **Lambda Processing** → Tool invocation → Results
4. **Artifact Storage** → S3 (large data) + DynamoDB (metadata)
5. **Response Streaming** → AppSync subscription → Frontend
6. **UI Update** → Loading state removed → Artifacts rendered

## Components and Interfaces

### 1. Chat Completion Fix

**Problem**: `responseComplete` flag not being set, causing stuck loading states

**Design Solution**:
- Ensure `responseComplete: true` is set in ALL response paths
- Add timeout detection (30 seconds max)
- Add error state handling
- Verify GraphQL subscription completes properly

**Files to Modify**:
- `utils/amplifyUtils.ts` - Response completion logic
- `src/components/ChatMessage.tsx` - Loading state management
- `amplify/functions/agents/renewableProxyAgent.ts` - Response formatting

**Interface**:
```typescript
interface ChatMessageResponse {
  role: 'ai';
  content: { text: string };
  chatSessionId: string;
  responseComplete: boolean; // MUST be true
  artifacts?: Artifact[];
}
```

### 2. Renewable Orchestrator Parameter Passing

**Problem**: Coordinates not being passed correctly to layout tool

**Design Solution**:
- Extract coordinates with proper regex: `/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/`
- Map to correct parameter names: `latitude`, `longitude` (not `center_lat`, `center_lon`)
- Validate all required parameters before tool invocation
- Return clear error messages for missing parameters

**Files to Modify**:
- `amplify/functions/renewableOrchestrator/handler.ts` - Parameter extraction
- `amplify/functions/renewableTools/layout/handler.py` - Parameter validation

**Interface**:
```typescript
interface LayoutParameters {
  latitude: number;      // Required
  longitude: number;     // Required
  capacity: number;      // Required (MW)
  optimizeForWake?: boolean;
  optimizeForTerrain?: boolean;
}
```

### 3. Feature Preservation Logic

**Problem**: Optimization sampling feature arrays, reducing 151 → 60 features

**Design Solution**:
- Identify feature arrays by structure (array of objects with `type`, `geometry`, `properties`)
- Only sample coordinate arrays (array of numbers or [lon, lat] pairs)
- Preserve all feature objects intact
- Add validation to ensure feature count matches

**Files to Modify**:
- `utils/s3ArtifactStorage.ts` - Optimization logic
- `src/components/renewable/TerrainMapArtifact.tsx` - Validation

**Logic**:
```typescript
function shouldSampleArray(arr: any[]): boolean {
  // Don't sample if it's a features array
  if (arr.length > 0 && arr[0].type && arr[0].geometry) {
    return false; // This is a features array - preserve it
  }
  
  // Sample coordinate arrays only
  if (arr.length > 1000 && typeof arr[0] === 'number') {
    return true; // Large coordinate array - sample it
  }
  
  return false;
}
```

### 4. Lambda Deployment Strategy

**Problem**: Code changes not being deployed to Lambda functions

**Design Solution**:
- Use `npx ampx sandbox --once` for single deployment
- Verify deployment with CloudWatch logs
- Check function versions after deployment
- Test with new queries (not cached data)

**Deployment Checklist**:
1. Run `npx ampx sandbox --once`
2. Wait for "Deployment completed" message
3. Check CloudWatch for new log streams
4. Test with completely new query
5. Verify results in UI

### 5. Artifact Serialization/Deserialization

**Problem**: Artifacts not rendering due to GraphQL validation errors

**Design Solution**:
- Ensure all artifact data is JSON-serializable
- Remove circular references
- Validate against GraphQL schema
- Handle deserialization errors gracefully

**Files to Modify**:
- `utils/amplifyUtils.ts` - Artifact serialization
- `src/components/ChatMessage.tsx` - Artifact deserialization
- `src/components/renewable/*Artifact.tsx` - Rendering components

**Validation**:
```typescript
function validateArtifact(artifact: any): boolean {
  // Must have required fields
  if (!artifact.type || !artifact.title) return false;
  
  // Must be JSON-serializable
  try {
    JSON.parse(JSON.stringify(artifact));
    return true;
  } catch {
    return false;
  }
}
```

### 6. Error Handling Architecture

**Problem**: Errors not being surfaced to users, causing confusion

**Design Solution**:
- Categorize errors: Parameter, Permission, Timeout, Internal
- Log all errors to CloudWatch with context
- Return user-friendly error messages
- Show error state in UI (not stuck loading)

**Error Categories**:
```typescript
enum ErrorCategory {
  PARAMETER_ERROR = 'Missing or invalid parameters',
  PERMISSION_ERROR = 'Access denied to AWS service',
  TIMEOUT_ERROR = 'Request took too long to complete',
  INTERNAL_ERROR = 'Internal server error',
  VALIDATION_ERROR = 'Data validation failed'
}
```

**Error Response Format**:
```typescript
interface ErrorResponse {
  success: false;
  error: string;           // User-friendly message
  errorCategory: ErrorCategory;
  details?: any;           // For debugging
  requestId: string;       // For CloudWatch lookup
}
```

## Data Models

### Artifact Structure

```typescript
interface Artifact {
  type: string;           // 'terrain_map', 'layout_visualization', etc.
  title: string;          // Display title
  data: any;              // Type-specific data
  metadata?: {
    featureCount?: number;
    projectId?: string;
    timestamp?: string;
  };
}
```

### Terrain Data Model

```typescript
interface TerrainData {
  type: 'FeatureCollection';
  features: Feature[];    // MUST preserve all features
  metadata: {
    bounds: [number, number, number, number];
    center: [number, number];
    featureCount: number;
    projectId: string;
  };
}
```

## Error Handling

### Frontend Error States

1. **Loading State**: Show spinner with "Analyzing your request"
2. **Timeout State**: Show warning after 30 seconds
3. **Error State**: Show error message with retry button
4. **Success State**: Show results with artifacts

### Backend Error Logging

```typescript
// Structured logging format
console.error(JSON.stringify({
  level: 'ERROR',
  requestId: context.requestId,
  errorCategory: 'PARAMETER_ERROR',
  message: 'Missing required parameter: latitude',
  details: { receivedParams: params }
}));
```

## Testing Strategy

### Unit Tests

1. **Parameter Extraction**: Test coordinate regex with various inputs
2. **Feature Preservation**: Test optimization logic with feature arrays
3. **Artifact Validation**: Test serialization/deserialization
4. **Error Handling**: Test all error categories

### Integration Tests

1. **End-to-End Flow**: Send query → receive response → render artifacts
2. **Lambda Invocation**: Test orchestrator → tool invocation
3. **S3 Storage**: Test artifact storage and retrieval
4. **Error Scenarios**: Test timeout, permission errors, invalid parameters

### Manual Testing

1. **Terrain Analysis**: Request terrain at specific coordinates
2. **Layout Creation**: Request 30MW layout at coordinates
3. **Feature Count**: Verify 151 features preserved
4. **Error Messages**: Test with invalid inputs

## Implementation Phases

### Phase 1: Foundation (Critical Path)
1. Fix chat completion (`responseComplete` flag)
2. Fix Lambda deployment process
3. Verify basic query/response flow

### Phase 2: Orchestrator Fixes
1. Fix coordinate extraction regex
2. Fix parameter mapping (latitude/longitude)
3. Add parameter validation
4. Test layout creation

### Phase 3: Feature Preservation
1. Fix optimization logic in s3ArtifactStorage
2. Deploy Lambda with new code
3. Test with new terrain analysis
4. Verify feature count

### Phase 4: Visualization & Error Handling
1. Fix artifact serialization
2. Fix visualization rendering
3. Improve error messages
4. Add timeout detection

### Phase 5: Validation
1. End-to-end testing
2. Error scenario testing
3. Performance validation
4. Documentation update

## Rollback Plan

If any phase fails:
1. Revert specific file changes
2. Redeploy Lambda functions
3. Test with known-good query
4. Document what failed and why

## Success Criteria

- ✅ All queries complete without stuck loading
- ✅ Terrain analysis shows all 151 features
- ✅ Layout creation works with correct coordinates
- ✅ All visualizations render correctly
- ✅ Clear error messages for all failure cases
- ✅ CloudWatch logs show detailed debugging info
- ✅ No regressions in existing functionality

## Monitoring

### CloudWatch Metrics
- Lambda invocation count
- Lambda error rate
- Lambda duration
- DynamoDB read/write units

### Application Metrics
- Query success rate
- Average response time
- Artifact rendering success rate
- Error category distribution

## Documentation Updates

After implementation:
1. Update CRITICAL_ISSUES_SUMMARY.md with resolution
2. Create PLATFORM_RESTORATION_COMPLETE.md
3. Update RENEWABLE_TROUBLESHOOTING.md
4. Document testing procedures
