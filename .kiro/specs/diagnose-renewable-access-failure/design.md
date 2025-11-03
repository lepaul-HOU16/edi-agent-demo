# Design Document

## Overview

This design addresses the fundamental "access issue" error that persists despite extensive orchestrator flow fixes. The approach is to systematically diagnose the entire request path from frontend to backend, identifying the exact point where access is denied, and implementing fixes at that specific layer.

## Architecture

### Current Request Flow (Suspected Failure Points Marked)

```
User Query
  ↓
Frontend (React) [✓ Likely OK]
  ↓
GraphQL/AppSync [❓ SUSPECT: Authorization?]
  ↓
lightweightAgent Lambda [❓ SUSPECT: Invocation permissions?]
  ↓
AgentRouter [❓ SUSPECT: Routing logic?]
  ↓
RenewableProxyAgent [❓ SUSPECT: Lambda invocation?]
  ↓
renewableOrchestrator Lambda [❓ SUSPECT: Not deployed?]
  ↓
Tool Lambdas (terrain, etc.) [❓ SUSPECT: Not accessible?]
```

### Diagnostic Strategy

We'll test each layer independently, starting from the bottom (Lambda deployment) and working up to the frontend:

1. **Layer 1: Lambda Deployment** - Verify Lambdas exist in AWS
2. **Layer 2: IAM Permissions** - Verify roles can invoke Lambdas
3. **Layer 3: Direct Invocation** - Test Lambda invocation via AWS SDK
4. **Layer 4: Environment Variables** - Verify function names are set
5. **Layer 5: GraphQL Schema** - Verify query definitions and resolvers
6. **Layer 6: Authentication** - Verify user tokens and authorization
7. **Layer 7: End-to-End** - Test full flow with comprehensive logging

## Components and Interfaces

### 1. Deployment Verification Script

**Purpose**: Verify all renewable energy Lambdas are deployed and accessible

**Location**: `scripts/verify-renewable-deployment.ts`

**Interface**:
```typescript
interface DeploymentStatus {
  lambdaName: string;
  exists: boolean;
  arn?: string;
  runtime?: string;
  lastModified?: string;
  environmentVariables?: Record<string, string>;
  error?: string;
}

interface DeploymentReport {
  allDeployed: boolean;
  lambdas: DeploymentStatus[];
  missingLambdas: string[];
  recommendations: string[];
}

async function verifyRenewableDeployment(): Promise<DeploymentReport>;
```

**Implementation**:
```typescript
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

async function checkLambdaExists(functionName: string): Promise<DeploymentStatus> {
  const client = new LambdaClient({});
  try {
    const response = await client.send(new GetFunctionCommand({
      FunctionName: functionName
    }));
    
    return {
      lambdaName: functionName,
      exists: true,
      arn: response.Configuration?.FunctionArn,
      runtime: response.Configuration?.Runtime,
      lastModified: response.Configuration?.LastModified,
      environmentVariables: response.Configuration?.Environment?.Variables
    };
  } catch (error) {
    return {
      lambdaName: functionName,
      exists: false,
      error: error.message
    };
  }
}
```

### 2. IAM Permission Checker

**Purpose**: Verify IAM roles have correct Lambda invocation permissions

**Location**: `scripts/verify-iam-permissions.ts`

**Interface**:
```typescript
interface PermissionCheck {
  roleName: string;
  targetLambda: string;
  hasPermission: boolean;
  policyStatements?: any[];
  error?: string;
}

interface PermissionReport {
  allPermissionsCorrect: boolean;
  checks: PermissionCheck[];
  missingPermissions: string[];
  recommendations: string[];
}

async function verifyIAMPermissions(): Promise<PermissionReport>;
```

**Key Checks**:
1. lightweightAgent role → renewableOrchestrator invocation
2. renewableOrchestrator role → tool Lambda invocations
3. renewableProxyAgent role → AgentCore proxy invocation

### 3. Direct Lambda Invocation Tester

**Purpose**: Test Lambda invocation directly via AWS SDK, bypassing GraphQL

**Location**: `scripts/test-direct-lambda-invocation.ts`

**Interface**:
```typescript
interface InvocationResult {
  success: boolean;
  statusCode?: number;
  payload?: any;
  error?: string;
  duration: number;
  requestId?: string;
}

async function testDirectInvocation(
  functionName: string,
  payload: any
): Promise<InvocationResult>;
```

**Test Cases**:
```typescript
// Test 1: Health check
await testDirectInvocation('renewableOrchestrator', {
  query: '__health_check__'
});

// Test 2: Minimal terrain query
await testDirectInvocation('renewableOrchestrator', {
  query: 'analyze terrain at 40.7128,-74.0060',
  conversationHistory: []
});

// Test 3: Direct terrain tool invocation
await testDirectInvocation('renewableTerrain', {
  latitude: 40.7128,
  longitude: -74.0060,
  radius_km: 5,
  project_id: 'test-project'
});
```

### 4. Environment Variable Validator

**Purpose**: Verify all Lambda functions have correct environment variables

**Location**: `scripts/verify-environment-variables.ts`

**Interface**:
```typescript
interface EnvVarCheck {
  lambdaName: string;
  requiredVars: string[];
  actualVars: Record<string, string>;
  missingVars: string[];
  isValid: boolean;
}

interface EnvVarReport {
  allValid: boolean;
  checks: EnvVarCheck[];
  recommendations: string[];
}

async function verifyEnvironmentVariables(): Promise<EnvVarReport>;
```

**Required Variables**:
```typescript
const REQUIRED_ENV_VARS = {
  lightweightAgent: [
    'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME'
  ],
  renewableOrchestrator: [
    'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
    'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
    'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
    'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
  ],
  renewableProxyAgent: [
    'AGENTCORE_PROXY_FUNCTION_NAME'
  ]
};
```

### 5. GraphQL Schema Validator

**Purpose**: Verify GraphQL schema has correct query definitions and resolvers

**Location**: `scripts/verify-graphql-schema.ts`

**Interface**:
```typescript
interface SchemaCheck {
  queryName: string;
  exists: boolean;
  resolverType?: string;
  resolverFunction?: string;
  authorizationMode?: string;
  isValid: boolean;
}

interface SchemaReport {
  allValid: boolean;
  checks: SchemaCheck[];
  recommendations: string[];
}

async function verifyGraphQLSchema(): Promise<SchemaReport>;
```

**Checks**:
1. `invokeRenewableAgent` query exists
2. Query is connected to correct Lambda resolver
3. Authorization allows authenticated users
4. Return type matches expected structure

### 6. Authentication Flow Tracer

**Purpose**: Trace authentication tokens through the request flow

**Location**: `amplify/functions/agents/authenticationTracer.ts`

**Interface**:
```typescript
interface AuthTrace {
  step: string;
  timestamp: number;
  authenticated: boolean;
  userId?: string;
  tokenPresent: boolean;
  authMode?: string;
  error?: string;
}

function traceAuthentication(event: any): AuthTrace[];
```

**Implementation**:
```typescript
export function traceAuthentication(event: any): AuthTrace[] {
  const traces: AuthTrace[] = [];
  
  // Check AppSync identity
  traces.push({
    step: 'AppSync Identity',
    timestamp: Date.now(),
    authenticated: !!event.identity,
    userId: event.identity?.sub,
    tokenPresent: !!event.identity?.claims,
    authMode: event.identity?.sourceIp ? 'IAM' : 'Cognito'
  });
  
  // Check request context
  traces.push({
    step: 'Request Context',
    timestamp: Date.now(),
    authenticated: !!event.requestContext?.authorizer,
    userId: event.requestContext?.authorizer?.claims?.sub,
    tokenPresent: !!event.requestContext?.authorizer?.claims
  });
  
  return traces;
}
```

### 7. Comprehensive Diagnostic Script

**Purpose**: Run all diagnostic checks and provide a complete report

**Location**: `scripts/diagnose-renewable-access.ts`

**Interface**:
```typescript
interface DiagnosticReport {
  timestamp: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  deployment: DeploymentReport;
  permissions: PermissionReport;
  environmentVariables: EnvVarReport;
  schema: SchemaReport;
  invocationTests: InvocationResult[];
  rootCause?: string;
  recommendations: string[];
}

async function runComprehensiveDiagnostics(): Promise<DiagnosticReport>;
```

**Execution Flow**:
```typescript
async function runComprehensiveDiagnostics(): Promise<DiagnosticReport> {
  console.log('🔍 Starting comprehensive renewable energy diagnostics...\n');
  
  // Step 1: Check deployment
  console.log('1️⃣ Checking Lambda deployment...');
  const deployment = await verifyRenewableDeployment();
  
  // Step 2: Check IAM permissions
  console.log('2️⃣ Checking IAM permissions...');
  const permissions = await verifyIAMPermissions();
  
  // Step 3: Check environment variables
  console.log('3️⃣ Checking environment variables...');
  const envVars = await verifyEnvironmentVariables();
  
  // Step 4: Check GraphQL schema
  console.log('4️⃣ Checking GraphQL schema...');
  const schema = await verifyGraphQLSchema();
  
  // Step 5: Test direct invocations
  console.log('5️⃣ Testing direct Lambda invocations...');
  const invocationTests = await testAllInvocations();
  
  // Analyze results and determine root cause
  const rootCause = analyzeResults({
    deployment,
    permissions,
    envVars,
    schema,
    invocationTests
  });
  
  return {
    timestamp: Date.now(),
    overallStatus: determineStatus(rootCause),
    deployment,
    permissions,
    environmentVariables: envVars,
    schema,
    invocationTests,
    rootCause,
    recommendations: generateRecommendations(rootCause)
  };
}
```

### 8. Enhanced Error Logging

**Purpose**: Add comprehensive error logging at every layer

**Locations**:
- `src/app/api/renewable/invoke/route.ts` - Frontend API route
- `amplify/functions/agents/lightweightAgent.ts` - Agent entry point
- `amplify/functions/agents/renewableProxyAgent.ts` - Proxy agent
- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator

**Implementation Pattern**:
```typescript
try {
  console.log('[RENEWABLE] Step: Invoking orchestrator', {
    functionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
    query: message,
    timestamp: new Date().toISOString(),
    requestId: context.requestId
  });
  
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
    Payload: JSON.stringify({ query: message })
  }));
  
  console.log('[RENEWABLE] Step: Orchestrator response received', {
    statusCode: response.StatusCode,
    payloadSize: response.Payload?.length,
    timestamp: new Date().toISOString(),
    requestId: context.requestId
  });
  
} catch (error) {
  console.error('[RENEWABLE] ERROR: Orchestrator invocation failed', {
    error: error.message,
    errorCode: error.code,
    errorType: error.name,
    stack: error.stack,
    functionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
    timestamp: new Date().toISOString(),
    requestId: context.requestId
  });
  
  throw new Error(`Renewable energy backend access failed: ${error.message}`);
}
```

## Data Models

### DiagnosticReport
```typescript
interface DiagnosticReport {
  timestamp: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  deployment: {
    allDeployed: boolean;
    lambdas: Array<{
      name: string;
      exists: boolean;
      arn?: string;
    }>;
    missingLambdas: string[];
  };
  permissions: {
    allCorrect: boolean;
    checks: Array<{
      role: string;
      target: string;
      hasPermission: boolean;
    }>;
    missingPermissions: string[];
  };
  environmentVariables: {
    allValid: boolean;
    checks: Array<{
      lambda: string;
      missingVars: string[];
    }>;
  };
  schema: {
    allValid: boolean;
    issues: string[];
  };
  invocationTests: Array<{
    test: string;
    success: boolean;
    error?: string;
  }>;
  rootCause?: string;
  recommendations: string[];
}
```

## Error Handling

### Error Categories and Responses

1. **Lambda Not Deployed**
```typescript
{
  category: 'DEPLOYMENT_ERROR',
  message: 'Renewable energy backend is not deployed',
  userMessage: 'Renewable energy features are not currently available. Please contact support.',
  remediation: [
    'Run: npx ampx sandbox',
    'Wait for deployment to complete',
    'Verify all Lambda functions are created'
  ],
  technicalDetails: {
    missingLambdas: ['renewableOrchestrator', 'renewableTerrain']
  }
}
```

2. **Permission Denied**
```typescript
{
  category: 'PERMISSION_ERROR',
  message: 'Access denied to renewable energy backend',
  userMessage: 'Unable to access renewable energy features. Please contact support.',
  remediation: [
    'Check IAM role policies',
    'Verify lambda:InvokeFunction permission',
    'Check resource-based policies'
  ],
  technicalDetails: {
    role: 'lightweightAgentRole',
    targetLambda: 'renewableOrchestrator',
    missingPermission: 'lambda:InvokeFunction'
  }
}
```

3. **Environment Variable Missing**
```typescript
{
  category: 'CONFIGURATION_ERROR',
  message: 'Renewable energy backend is misconfigured',
  userMessage: 'Renewable energy features are temporarily unavailable. Please try again later.',
  remediation: [
    'Set RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable',
    'Redeploy Lambda functions',
    'Verify amplify/backend.ts configuration'
  ],
  technicalDetails: {
    lambda: 'lightweightAgent',
    missingVar: 'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME'
  }
}
```

4. **GraphQL Schema Issue**
```typescript
{
  category: 'SCHEMA_ERROR',
  message: 'Renewable energy query is not defined',
  userMessage: 'Renewable energy features are not available. Please contact support.',
  remediation: [
    'Check amplify/data/resource.ts',
    'Verify invokeRenewableAgent query exists',
    'Redeploy GraphQL schema'
  ],
  technicalDetails: {
    missingQuery: 'invokeRenewableAgent',
    schemaFile: 'amplify/data/resource.ts'
  }
}
```

5. **Authentication Failure**
```typescript
{
  category: 'AUTH_ERROR',
  message: 'User is not authenticated',
  userMessage: 'Please sign in to use renewable energy features.',
  remediation: [
    'Verify user is signed in',
    'Check Cognito token validity',
    'Refresh authentication token'
  ],
  technicalDetails: {
    authenticated: false,
    tokenPresent: false
  }
}
```

## Testing Strategy

### Phase 1: Deployment Verification
```bash
# Run deployment verification script
npm run verify:renewable-deployment

# Expected output:
# ✅ renewableOrchestrator: Deployed
# ✅ renewableTerrain: Deployed
# ✅ renewableLayout: Deployed
# ✅ renewableSimulation: Deployed
# ✅ renewableReport: Deployed
# ✅ renewableAgentCoreProxy: Deployed
```

### Phase 2: Permission Verification
```bash
# Run permission verification script
npm run verify:renewable-permissions

# Expected output:
# ✅ lightweightAgent → renewableOrchestrator: Allowed
# ✅ renewableOrchestrator → renewableTerrain: Allowed
# ✅ renewableOrchestrator → renewableLayout: Allowed
```

### Phase 3: Direct Invocation Testing
```bash
# Run direct invocation tests
npm run test:renewable-invocation

# Expected output:
# ✅ Health check: Success (200ms)
# ✅ Minimal query: Success (1.2s)
# ✅ Terrain tool: Success (3.5s)
```

### Phase 4: Environment Variable Verification
```bash
# Run environment variable verification
npm run verify:renewable-env-vars

# Expected output:
# ✅ lightweightAgent: All required vars set
# ✅ renewableOrchestrator: All required vars set
```

### Phase 5: Comprehensive Diagnostics
```bash
# Run full diagnostic suite
npm run diagnose:renewable

# Expected output:
# 🔍 Comprehensive Renewable Energy Diagnostics
# 
# 1️⃣ Deployment: ✅ PASSED
# 2️⃣ Permissions: ✅ PASSED
# 3️⃣ Environment Variables: ✅ PASSED
# 4️⃣ GraphQL Schema: ✅ PASSED
# 5️⃣ Direct Invocation: ✅ PASSED
# 
# Overall Status: HEALTHY ✅
```

## Implementation Plan

### Phase 1: Create Diagnostic Scripts (Priority 1)
1. Create deployment verification script
2. Create IAM permission checker
3. Create environment variable validator
4. Create direct invocation tester
5. Create comprehensive diagnostic script

### Phase 2: Add Enhanced Logging (Priority 1)
1. Add authentication tracing to lightweightAgent
2. Add invocation logging to RenewableProxyAgent
3. Add step-by-step logging to orchestrator
4. Add error logging at all layers

### Phase 3: Run Diagnostics (Priority 1)
1. Run deployment verification
2. Run permission verification
3. Run direct invocation tests
4. Run comprehensive diagnostics
5. Identify root cause from results

### Phase 4: Fix Root Cause (Priority 1)
1. Apply fix based on diagnostic results
2. Re-run diagnostics to verify fix
3. Test end-to-end flow
4. Document solution

### Phase 5: Improve Error Messages (Priority 2)
1. Update frontend error handling
2. Add user-friendly error messages
3. Add remediation steps to errors
4. Test error scenarios

## Success Criteria

1. **Diagnostic Script Runs Successfully**: All checks complete without errors
2. **Root Cause Identified**: Diagnostic report clearly identifies the issue
3. **Fix Applied**: The identified issue is resolved
4. **End-to-End Test Passes**: User can successfully run renewable energy queries
5. **Clear Error Messages**: If issues occur, users see helpful error messages

## Rollback Plan

If diagnostics reveal unfixable issues:

1. **Disable Renewable Features**: Add feature flag to disable renewable energy queries
2. **Show Maintenance Message**: Display "Renewable energy features are under maintenance"
3. **Document Issues**: Create detailed issue report for AWS support
4. **Provide Timeline**: Communicate expected resolution time to users

## Performance Considerations

1. **Diagnostic Script Runtime**: Should complete in < 30 seconds
2. **Logging Overhead**: Enhanced logging may add 50-100ms per request
3. **CloudWatch Costs**: Increased logging will increase CloudWatch costs
4. **Caching**: Cache deployment verification results for 5 minutes

## Security Considerations

1. **Credential Exposure**: Don't log AWS credentials or tokens
2. **PII Protection**: Don't log user personal information
3. **Error Details**: Limit error details in user-facing messages
4. **Diagnostic Access**: Restrict diagnostic scripts to authenticated developers

