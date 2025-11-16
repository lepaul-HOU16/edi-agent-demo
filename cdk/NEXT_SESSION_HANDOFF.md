# Next Session Handoff - Task 5.3: Renewable Energy Orchestrator Migration

## Session Context

This document provides everything needed to continue the Amplify to CDK migration in the next session, specifically focusing on Task 5.3: Migrate Renewable Energy Orchestrator.

## Current Status

### ✅ Completed Tasks
- **Task 5.1**: Project management functions - COMPLETE
- **Task 5.2**: Chat/agent orchestration - COMPLETE AND VALIDATED
  - All 5 agent types working
  - Conversation history fixed
  - 3.6MB Lambda deployed
  - Performance: 2.2s response time

### 🔄 Next Task: 5.3 - Migrate Renewable Energy Orchestrator

**Status**: Ready to start
**Priority**: High
**Complexity**: Medium-High

## Task 5.3 Overview

### What Needs to Be Done

Migrate the `renewableOrchestrator` Lambda from Amplify to CDK. This orchestrator:
- Coordinates renewable energy analysis workflows
- Invokes Python tool Lambdas (terrain, layout, simulation, report)
- Uses Strands Agents for intelligent decision-making
- Writes results to DynamoDB
- Manages project context and session state

### Source Files to Migrate

Located in `amplify/functions/renewableOrchestrator/`:
- `handler.ts` - Main orchestrator logic
- `IntentRouter.ts` - Routes queries to appropriate tools
- `parameterValidator.ts` - Validates and applies defaults
- `strandsAgentHandler.ts` - Strands Agent integration
- `RenewableIntentClassifier.ts` - Intent classification
- `types.ts` - TypeScript type definitions

### Current Amplify Lambda

**Function Name**: `amplify-digitalassistant--renewableOrchestratorlam-hYkPb0LWoZnk`

**Environment Variables** (from `amplify/backend.ts`):
```typescript
AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME
SESSION_CONTEXT_TABLE
AWS_LOCATION_PLACE_INDEX
RENEWABLE_AGENTS_FUNCTION_NAME
RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME
RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME
RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME
RENEWABLE_REPORT_TOOL_FUNCTION_NAME
RENEWABLE_S3_BUCKET
```

**IAM Permissions Required**:
1. Lambda invoke for tool Lambdas
2. DynamoDB read/write (ChatMessage, SessionContext tables)
3. AWS Location Service (reverse geocoding)
4. S3 read/write (project data storage)

## Implementation Steps

### Step 1: Copy Orchestrator Files

```bash
mkdir -p cdk/lambda-functions/renewable-orchestrator
cp amplify/functions/renewableOrchestrator/*.ts cdk/lambda-functions/renewable-orchestrator/
# Exclude test files and node_modules
```

### Step 2: Create Handler Wrapper

Create `cdk/lambda-functions/renewable-orchestrator/handler.ts` that:
- Converts API Gateway event to orchestrator format
- Calls existing orchestrator logic
- Returns response in API Gateway format

### Step 3: Update Import Paths

Fix relative imports to work with CDK structure:
- Update `../shared/` imports
- Update `../utils/` imports if needed

### Step 4: Add to CDK Stack

In `cdk/lib/main-stack.ts`, add:

```typescript
// Create renewable orchestrator Lambda
const renewableOrchestratorFunction = new LambdaFunction(this, 'RenewableOrchestratorFunction', {
  functionName: 'renewable-orchestrator',
  description: 'Coordinates renewable energy analysis workflows',
  codePath: 'renewable-orchestrator',
  timeout: 300, // 5 minutes
  memorySize: 1024,
  environment: {
    STORAGE_BUCKET: storageBucket.bucketName,
    AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: chatMessageTable.tableName,
    SESSION_CONTEXT_TABLE: sessionContextTable.tableName,
    RENEWABLE_S3_BUCKET: storageBucket.bucketName,
    // Tool Lambda ARNs will be added after tool Lambdas are migrated
  },
});

// Grant permissions
chatMessageTable.grantReadWriteData(renewableOrchestratorFunction.function);
sessionContextTable.grantReadWriteData(renewableOrchestratorFunction.function);
renewableOrchestratorFunction.grantS3ReadWrite(storageBucket.bucketArn);

// Grant Lambda invoke permissions for tool Lambdas (existing Amplify Lambdas for now)
renewableOrchestratorFunction.function.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:484907533441:function:amplify-digitalassistant--renewableTerrainToollambda*',
      'arn:aws:lambda:us-east-1:484907533441:function:amplify-digitalassistant--renewableLayoutToollambda*',
      'arn:aws:lambda:us-east-1:484907533441:function:amplify-digitalassistant--renewableSimulationToollambda*',
      'arn:aws:lambda:us-east-1:484907533441:function:amplify-digitalassistant--renewableReportToollambda*',
    ],
  })
);

// Add API route
this.httpApi.addRoutes({
  path: '/api/renewable/analyze',
  methods: [apigatewayv2.HttpMethod.POST],
  integration: new apigatewayv2_integrations.HttpLambdaIntegration(
    'RenewableAnalyzeIntegration',
    renewableOrchestratorFunction.function,
    {
      payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
      timeout: cdk.Duration.seconds(29),
    }
  ),
  authorizer: this.authorizer,
});
```

### Step 5: Update Chat Lambda

The chat Lambda's `RenewableProxyAgent` needs to invoke the new CDK orchestrator instead of the Amplify one. Update environment variable in chat Lambda:

```typescript
chatFunction.addEnvironment(
  'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME',
  renewableOrchestratorFunction.functionName
);
```

Grant chat Lambda permission to invoke orchestrator:

```typescript
chatFunction.function.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    resources: [renewableOrchestratorFunction.functionArn],
  })
);
```

### Step 6: Build and Deploy

```bash
npm run build:lambdas --prefix cdk
cd cdk && npx cdk deploy --all --require-approval never
```

### Step 7: Test

Create test script `cdk/test-renewable-orchestrator.js`:

```javascript
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testOrchestrator() {
  const lambda = new LambdaClient({ region: 'us-east-1' });
  
  const testEvent = {
    requestContext: {
      http: { method: 'POST', path: '/api/renewable/analyze' },
      authorizer: {
        jwt: {
          claims: {
            sub: 'test-user-123',
            email: 'test@example.com',
          },
        },
      },
    },
    body: JSON.stringify({
      query: 'Analyze wind farm site at coordinates 35.0, -101.4',
      context: {},
    }),
  };

  const command = new InvokeCommand({
    FunctionName: 'EnergyInsights-development-renewable-orchestrator',
    Payload: JSON.stringify(testEvent),
  });

  const response = await lambda.send(command);
  const payload = JSON.parse(Buffer.from(response.Payload).toString());
  
  console.log('Response:', JSON.stringify(payload, null, 2));
}

testOrchestrator();
```

## Known Challenges

### Challenge 1: Python Tool Lambda Dependencies

The orchestrator invokes Python tool Lambdas that are still in Amplify. Options:
1. **Keep Amplify tool Lambdas** (recommended for now) - Use ARN patterns to invoke
2. **Migrate tool Lambdas** - More complex, requires Python Lambda setup in CDK

**Recommendation**: Keep Amplify tool Lambdas initially, migrate later if needed.

### Challenge 2: Strands Agent Integration

The orchestrator uses `strandsAgentHandler.ts` which may have dependencies on Amplify-specific code. May need to:
- Stub out Strands Agent calls
- Update to work with CDK environment
- Test fallback to direct tool invocation

### Challenge 3: AWS Location Service

The orchestrator uses AWS Location Service for reverse geocoding. Need to:
- Import or create Place Index in CDK
- Grant permissions
- Set environment variable

**Current Place Index**: Check `amplify/backend.ts` for name

## Files to Reference

### Key Documentation
- `cdk/SESSION_SUMMARY.md` - Overall progress
- `cdk/TASK_5.2_COMPLETE.md` - Chat Lambda migration (similar pattern)
- `cdk/TASK_5.1_COMPLETE.md` - Projects Lambda migration (simpler pattern)
- `.kiro/specs/remove-amplify-migration/tasks.md` - Task list

### Key Code Files
- `cdk/lib/main-stack.ts` - CDK stack configuration
- `cdk/lib/constructs/lambda-function.ts` - Reusable Lambda construct
- `cdk/esbuild.config.js` - Build configuration
- `amplify/backend.ts` - Current Amplify configuration (reference)

## Testing Checklist

After migration, verify:
- [ ] Lambda deploys successfully
- [ ] API endpoint accessible
- [ ] Can invoke orchestrator directly
- [ ] Can invoke via chat Lambda (RenewableProxyAgent)
- [ ] Tool Lambdas are invoked correctly
- [ ] DynamoDB writes work
- [ ] S3 operations work
- [ ] Error handling works
- [ ] CloudWatch logs accessible

## Success Criteria

Task 5.3 is complete when:
- ✅ Orchestrator Lambda deployed to CDK
- ✅ API route `/api/renewable/analyze` working
- ✅ Can invoke Python tool Lambdas
- ✅ Chat Lambda can invoke orchestrator
- ✅ All permissions configured
- ✅ Basic test passes
- ✅ No regressions in existing functionality

## Estimated Time

- File migration: 15 minutes
- CDK configuration: 30 minutes
- Permission setup: 15 minutes
- Build and deploy: 10 minutes
- Testing and fixes: 30 minutes
- **Total**: ~1.5-2 hours

## Quick Start Commands

```bash
# 1. Copy files
mkdir -p cdk/lambda-functions/renewable-orchestrator
cp amplify/functions/renewableOrchestrator/*.ts cdk/lambda-functions/renewable-orchestrator/

# 2. Build
npm run build:lambdas --prefix cdk

# 3. Deploy
cd cdk && npx cdk deploy --all --require-approval never

# 4. Test
node cdk/test-renewable-orchestrator.js

# 5. Check logs
aws logs tail /aws/lambda/EnergyInsights-development-renewable-orchestrator --since 5m --follow
```

## Current Deployed Resources

**API Gateway**: `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`

**Lambda Functions**:
- `EnergyInsights-development-projects` (10.8KB)
- `EnergyInsights-development-chat` (3.6MB)
- `EnergyInsights-development-renewable-orchestrator` (to be created)

**DynamoDB Tables** (imported):
- `ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- `ChatSession-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- `Project-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- `AgentProgress`
- `SessionContext`

**S3 Bucket** (imported):
- `amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy`

## Additional Implementation Details

### Shared Dependencies to Copy

The orchestrator depends on several shared modules that need to be copied to CDK:

```bash
# Copy shared modules
cp amplify/functions/shared/projectStore.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/projectNameGenerator.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/sessionContextManager.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/projectResolver.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/errorMessageTemplates.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/actionButtonTypes.ts cdk/lambda-functions/shared/
cp amplify/functions/shared/projectListHandler.ts cdk/lambda-functions/shared/
```

### Orchestrator-Specific Files

```bash
# Copy orchestrator files
cp amplify/functions/renewableOrchestrator/handler.ts cdk/lambda-functions/renewable-orchestrator/
cp amplify/functions/renewableOrchestrator/IntentRouter.ts cdk/lambda-functions/renewable-orchestrator/
cp amplify/functions/renewableOrchestrator/parameterValidator.ts cdk/lambda-functions/renewable-orchestrator/
cp amplify/functions/renewableOrchestrator/strandsAgentHandler.ts cdk/lambda-functions/renewable-orchestrator/
cp amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts cdk/lambda-functions/renewable-orchestrator/
cp amplify/functions/renewableOrchestrator/types.ts cdk/lambda-functions/renewable-orchestrator/
```

### Key Features to Preserve

1. **Strands Agent Integration**: The orchestrator uses Strands Agents for intelligent decision-making with fallback to direct tool invocation
2. **Priority Routing**: Project dashboard queries bypass Strands Agent for faster response
3. **Parameter Validation**: Comprehensive validation with defaults and error messages
4. **Session Context**: Manages project context across conversations
5. **Thought Steps**: Tracks reasoning process for transparency
6. **Action Buttons**: Generates contextual next-step suggestions
7. **Error Handling**: Professional error messages with recovery suggestions

### Environment Variables Mapping

Current Amplify → New CDK:
```typescript
AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME → CHAT_MESSAGE_TABLE_NAME
SESSION_CONTEXT_TABLE → SESSION_CONTEXT_TABLE (same)
AWS_LOCATION_PLACE_INDEX → AWS_LOCATION_PLACE_INDEX (same)
RENEWABLE_AGENTS_FUNCTION_NAME → RENEWABLE_AGENTS_FUNCTION_NAME (keep for now)
RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME → (use ARN pattern)
RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME → (use ARN pattern)
RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME → (use ARN pattern)
RENEWABLE_REPORT_TOOL_FUNCTION_NAME → (use ARN pattern)
RENEWABLE_S3_BUCKET → STORAGE_BUCKET
```

### Handler Wrapper Pattern

The orchestrator handler needs to be wrapped to work with API Gateway:

```typescript
// cdk/lambda-functions/renewable-orchestrator/index.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as orchestratorHandler } from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    
    // Call orchestrator with proper format
    const result = await orchestratorHandler({
      query: body.query,
      context: body.context || {},
      sessionId: body.sessionId,
      userId: userId,
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Orchestrator error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
```

### Testing Strategy

1. **Unit Test**: Test orchestrator logic directly
2. **Integration Test**: Test via API Gateway endpoint
3. **E2E Test**: Test from chat Lambda → orchestrator → tool Lambdas
4. **Regression Test**: Verify all renewable queries still work

### Performance Considerations

- **Bundle Size**: Orchestrator is ~500KB (much smaller than chat Lambda's 3.6MB)
- **Cold Start**: ~2-3 seconds with Strands Agent dependencies
- **Warm Execution**: ~200-500ms for intent routing
- **Tool Invocation**: 5-30 seconds depending on tool (terrain, layout, etc.)

### Potential Issues and Solutions

**Issue 1: Strands Agent Dependencies**
- **Problem**: May have large dependencies
- **Solution**: Use esbuild to bundle and tree-shake

**Issue 2: AWS Location Service**
- **Problem**: Need Place Index for reverse geocoding
- **Solution**: Import existing Place Index or create new one in CDK

**Issue 3: Tool Lambda ARNs**
- **Problem**: ARNs change between deployments
- **Solution**: Use wildcard patterns or pass ARNs as environment variables

**Issue 4: Session Context Table**
- **Problem**: May need GSI for efficient queries
- **Solution**: Verify GSI exists, add if needed

## Notes

- The renewable orchestrator is complex but follows similar patterns to the chat Lambda
- Keep Amplify tool Lambdas for now to reduce scope
- Focus on getting the orchestrator working, optimize later
- Test thoroughly before marking complete
- Document any issues or workarounds
- The orchestrator has priority routing for dashboard queries - preserve this!
- Strands Agent integration is optional (has fallback) - can stub if needed

## Contact/Context

This migration is part of moving from AWS Amplify Gen 2 to pure CDK infrastructure. The goal is to eliminate Amplify dependencies while preserving all functionality.

**Current Progress**: 2 of 4 priority Lambda functions migrated (50%)
**Next Milestone**: Complete all Lambda migrations (Tasks 5.3-5.4)
**Final Goal**: Full CDK deployment with S3/CloudFront frontend

---

**Ready to start Task 5.3 in next session!** 🚀

## Quick Reference: What Works Now

✅ **Projects API**: List, delete, rename projects via `/api/projects/*`
✅ **Chat API**: Send messages, get responses via `/api/chat/message`
✅ **Conversation History**: Fixed GSI index, working perfectly
✅ **Authentication**: Cognito authorizer on all routes
✅ **DynamoDB**: All tables imported and accessible
✅ **S3**: Storage bucket imported and accessible

## What's Next After 5.3

- **Task 5.4**: Migrate catalog functions (catalogMapData, catalogSearch)
- **Phase 3**: Update frontend to use REST APIs instead of GraphQL
- **Phase 4**: Deploy frontend to S3 + CloudFront
- **Phase 5**: Testing and validation
- **Phase 6**: Cutover and decommission Amplify
