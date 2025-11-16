# Design Document: Complete CDK Migration

## Overview

This design completes the migration from Amplify to CDK by properly integrating the standalone renewable energy tool Lambdas with the CDK renewable orchestrator, verifying all functionality works, and safely shutting down the Amplify sandbox.

## Architecture

### Current State (Hybrid)

```
Frontend (Vite/React)
    ↓ REST API calls
CDK API Gateway
    ↓
CDK Lambda Functions:
  - Chat/Agent (wraps existing agent code)
  - Chat Sessions (CRUD operations)
  - Renewable Orchestrator (routes to tool Lambdas)
    ↓ Lambda.invoke()
Standalone Tool Lambdas:
  - renewable-terrain-simple (Python)
  - renewable-layout-simple (Python)
  - renewable-simulation-simple (Python)
    ↓
DynamoDB Tables (Amplify-created)
S3 Bucket (Amplify-created)
```

### Target State (Pure CDK)

```
Frontend (Vite/React)
    ↓ REST API calls
CDK API Gateway
    ↓
CDK Lambda Functions:
  - Chat/Agent
  - Chat Sessions
  - Renewable Orchestrator
    ↓ Lambda.invoke() with env vars
Standalone Tool Lambdas (properly integrated):
  - renewable-terrain-simple
  - renewable-layout-simple
  - renewable-simulation-simple
    ↓
DynamoDB Tables (imported from Amplify)
S3 Bucket (imported from Amplify)

Amplify Sandbox: DELETED
```

## Components and Interfaces

### 1. Renewable Orchestrator Lambda

**Location:** `cdk/lambda-functions/renewable-orchestrator/handler.ts`

**Current Behavior:**
- Has fallback logic: `process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 'renewable-terrain-simple'`
- Uses fallback names when env vars not set
- Already has Lambda invoke logic

**Required Changes:**
- Update CDK stack to set environment variables
- Update IAM permissions to allow invoking standalone Lambdas
- No code changes needed (fallbacks already work)

### 2. CDK Main Stack

**Location:** `cdk/lib/main-stack.ts`

**Current State:**
- Renewable orchestrator Lambda exists
- Has wildcard IAM permissions for Amplify Lambdas
- Missing environment variables for standalone Lambdas

**Required Changes:**
```typescript
// Add environment variables
renewableOrchestratorFunction.addEnvironment(
  'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
  'renewable-terrain-simple'
);
renewableOrchestratorFunction.addEnvironment(
  'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
  'renewable-layout-simple'
);
renewableOrchestratorFunction.addEnvironment(
  'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
  'renewable-simulation-simple'
);

// Update IAM permissions to specific ARNs
renewableOrchestratorFunction.function.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:484907533441:function:renewable-terrain-simple',
      'arn:aws:lambda:us-east-1:484907533441:function:renewable-layout-simple',
      'arn:aws:lambda:us-east-1:484907533441:function:renewable-simulation-simple',
    ],
  })
);
```

### 3. Frontend API Client

**Location:** `src/lib/api/client.ts`

**Current State:**
- Uses environment variable for API URL
- Includes mock auth token
- Makes REST API calls

**Verification Needed:**
- Confirm API_URL points to CDK API Gateway
- Confirm all API calls succeed
- Confirm no Amplify references remain

### 4. Standalone Tool Lambdas

**Existing Lambdas:**
- `renewable-terrain-simple` - Terrain analysis with OSM data
- `renewable-layout-simple` - Wind turbine layout optimization
- `renewable-simulation-simple` - Wake simulation and wind rose

**No Changes Needed:**
- Already deployed
- Already functional
- Just need proper integration

## Data Models

### Chat Message (DynamoDB)

```typescript
{
  id: string;
  chatSessionId: string;
  role: 'human' | 'ai';
  content: { text: string };
  artifacts?: any[];
  thoughtSteps?: any[];
  responseComplete: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Chat Session (DynamoDB)

```typescript
{
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Renewable Tool Response

```typescript
{
  success: boolean;
  data?: {
    artifacts: Array<{
      type: string;
      data: any;
    }>;
    message: string;
  };
  error?: string;
}
```

## Error Handling

### Lambda Invocation Errors

**Scenario:** Tool Lambda fails or times out

**Handling:**
```typescript
try {
  const response = await lambda.invoke({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
  });
  
  if (response.FunctionError) {
    throw new Error(`Lambda error: ${response.FunctionError}`);
  }
  
  return JSON.parse(response.Payload);
} catch (error) {
  console.error('Lambda invocation failed:', error);
  return {
    success: false,
    error: `Failed to invoke ${functionName}: ${error.message}`,
  };
}
```

### API Gateway Errors

**Scenario:** Frontend receives 500 error

**Handling:**
- Log full error details in CloudWatch
- Return user-friendly error message
- Include request ID for debugging

### Authentication Errors

**Scenario:** Mock auth token rejected

**Handling:**
- Return 401 with clear message
- Frontend displays auth error
- User can retry or refresh

## Testing Strategy

### Phase 1: Environment Variable Verification

1. Deploy CDK stack with updated env vars
2. Check Lambda configuration in AWS Console
3. Verify all three env vars are set
4. Verify IAM permissions are correct

### Phase 2: Renewable Energy Testing

1. Test terrain analysis via API
2. Test layout optimization via API
3. Test wake simulation via API
4. Verify artifacts are generated
5. Check CloudWatch logs for errors

### Phase 3: Chat and Session Testing

1. Create new chat session
2. Send chat message
3. Verify message saved to DynamoDB
4. Verify AI response returned
5. List all sessions

### Phase 4: File Storage Testing

1. Upload test file
2. List files
3. Download file
4. Delete file
5. Verify S3 operations

### Phase 5: End-to-End Testing

1. Open frontend in browser
2. Test all user workflows
3. Verify no console errors
4. Verify no Amplify references
5. Verify all features work

### Phase 6: Amplify Shutdown

1. Verify all tests pass
2. Stop Amplify sandbox
3. Test all features still work
4. Delete Amplify sandbox stack
5. Verify CDK-only operation

## Deployment Steps

### Step 1: Update CDK Stack

```bash
cd cdk
npm run build
cdk diff
cdk deploy
```

### Step 2: Verify Deployment

```bash
# Check Lambda env vars
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-renewable-orchestrator \
  --query "Environment.Variables"

# Check IAM permissions
aws lambda get-policy \
  --function-name EnergyInsights-development-renewable-orchestrator
```

### Step 3: Test APIs

```bash
# Test terrain analysis
curl -X POST https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/renewable/analyze \
  -H "Authorization: Bearer mock-dev-token-test-user" \
  -H "Content-Type: application/json" \
  -d '{"type":"terrain_analysis","latitude":35.0,"longitude":-101.0}'
```

### Step 4: Update Frontend

```bash
# Verify API URL
cat .env.local

# Build and deploy
npm run build
aws s3 sync dist/ s3://energyinsights-development-frontend-development/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Step 5: Shut Down Amplify

```bash
# Stop sandbox (if running)
# Ctrl+C in terminal

# Delete stack
aws cloudformation delete-stack --stack-name amplify-agentsforenergy-lepaul-sandbox-eca99671d7

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name amplify-agentsforenergy-lepaul-sandbox-eca99671d7
```

## Rollback Plan

If issues occur:

1. **Keep Amplify running** - Don't delete until verified
2. **Revert CDK changes** - `cdk deploy` previous version
3. **Point frontend back** - Update API_URL to Amplify
4. **Investigate issues** - Check CloudWatch logs
5. **Fix and retry** - Address issues before next attempt

## Success Criteria

- ✅ All renewable energy features work via CDK
- ✅ All chat features work via CDK
- ✅ All file storage features work via CDK
- ✅ Frontend has zero Amplify references
- ✅ Amplify sandbox deleted
- ✅ Single backend (CDK only)
- ✅ Lower AWS costs
- ✅ Cleaner architecture
