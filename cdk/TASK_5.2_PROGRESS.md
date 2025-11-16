# Task 5.2: Migrate Chat/Agent Orchestration - Progress Report

## Status: IN PROGRESS

## What Was Completed

### 1. File Migration
- ✅ Copied all agent files from `amplify/functions/agents/` to `cdk/lambda-functions/chat/agents/`
- ✅ Copied shared utilities from `amplify/functions/shared/` to `cdk/lambda-functions/chat/shared/`
- ✅ Copied utils directory to `cdk/lambda-functions/chat/utils/`
- ✅ Fixed import paths to work with new directory structure

### 2. CDK Stack Configuration
- ✅ Added chat Lambda function to `cdk/lib/main-stack.ts`
- ✅ Configured environment variables:
  - `STORAGE_BUCKET`
  - `AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME`
  - `AMPLIFY_DATA_CHATSESSION_TABLE_NAME`
  - `AMPLIFY_DATA_PROJECT_TABLE_NAME`
  - `AMPLIFY_DATA_AGENTPROGRESS_TABLE_NAME`
  - `AMPLIFY_DATA_SESSIONCONTEXT_TABLE_NAME`
  - `S3_BUCKET`
- ✅ Granted DynamoDB permissions (read/write to all chat tables)
- ✅ Granted S3 permissions (read/write to storage bucket)
- ✅ Granted Bedrock permissions (InvokeModel, InvokeModelWithResponseStream)
- ✅ Added API route: `POST /api/chat/message` with Cognito authorizer
- ✅ Configured 5-minute timeout and 1GB memory for agent processing

### 3. Handler Wrapper
- ✅ Chat handler already exists at `cdk/lambda-functions/chat/handler.ts`
- ✅ Converts API Gateway events to AppSync format
- ✅ Calls existing agent handler
- ✅ Returns response in API Gateway format

## Current Issues

### Missing Dependencies
The agent code has many dependencies that need to be resolved:

1. **Tools Directory** (`amplify/functions/tools/`)
   - `petrophysicsTools.ts` - Core petrophysical calculations
   - `webBrowserTool.ts` - Web browsing capability
   - `globalDirectoryScanner.ts` - File system scanning
   - Other specialized tools

2. **EDIcraft Agent Dependencies**
   - `edicraftAgent/handler.js` - Minecraft integration handler
   - `edicraftAgent/mcpClient.js` - MCP client for EDIcraft

3. **Maintenance Agent Dependencies**
   - `handlers/equipmentStatusHandler.ts`
   - `handlers/failurePredictionHandler.ts`
   - `handlers/maintenancePlanningHandler.ts`
   - `handlers/inspectionScheduleHandler.ts`
   - `handlers/maintenanceHistoryHandler.ts`
   - `handlers/assetHealthHandler.ts`
   - `handlers/preventiveMaintenanceHandler.ts`

4. **LangChain Dependencies**
   - `@langchain/aws` - AWS Bedrock integration
   - `@langchain/core/messages` - Message types
   - Other LangChain packages

5. **TypeScript Compilation Errors**
   - Implicit 'any' types in several files
   - Missing type declarations

## Next Steps

### Option 1: Complete Migration (Comprehensive)
1. Copy all tools from `amplify/functions/tools/` to `cdk/lambda-functions/chat/tools/`
2. Copy EDIcraft agent dependencies
3. Copy maintenance agent handlers
4. Install missing npm packages in CDK project
5. Fix all TypeScript compilation errors
6. Build and deploy

**Estimated Time:** 2-3 hours
**Risk:** High complexity, many dependencies

### Option 2: Minimal Viable Migration (Recommended)
1. Create a simplified agent handler that only supports core functionality
2. Disable optional agents (EDIcraft, Maintenance) temporarily
3. Focus on petrophysics and general knowledge agents
4. Add other agents incrementally after core is working

**Estimated Time:** 30-60 minutes
**Risk:** Lower, incremental approach

### Option 3: Hybrid Approach (Balanced)
1. Keep existing Amplify agents running in parallel
2. Migrate only the chat message routing to CDK
3. Have CDK Lambda invoke Amplify Lambda functions for agent processing
4. Gradually migrate agents one by one

**Estimated Time:** 1-2 hours
**Risk:** Medium, requires Lambda-to-Lambda invocation

## Recommendation

I recommend **Option 2: Minimal Viable Migration** because:

1. **Faster to working state** - Can have basic chat working quickly
2. **Lower risk** - Fewer dependencies to manage
3. **Incremental** - Can add agents back one at a time
4. **Testable** - Can verify each piece works before adding more

The core chat functionality (petrophysics + general knowledge) is the most critical. Other agents (EDIcraft, Maintenance, Renewable) can be added back after the core is stable.

## Files Modified

- `cdk/lib/main-stack.ts` - Added chat Lambda configuration
- `cdk/lambda-functions/chat/handler.ts` - Already exists, no changes needed
- `cdk/lambda-functions/chat/agents/` - Copied all agent files
- `cdk/lambda-functions/chat/shared/` - Copied shared utilities
- `cdk/lambda-functions/chat/utils/` - Copied utility functions

## Environment Variables Required

```typescript
{
  STORAGE_BUCKET: storageBucket.bucketName,
  AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: chatMessageTable.tableName,
  AMPLIFY_DATA_CHATSESSION_TABLE_NAME: chatSessionTable.tableName,
  AMPLIFY_DATA_PROJECT_TABLE_NAME: projectTable.tableName,
  AMPLIFY_DATA_AGENTPROGRESS_TABLE_NAME: agentProgressTable.tableName,
  AMPLIFY_DATA_SESSIONCONTEXT_TABLE_NAME: sessionContextTable.tableName,
  S3_BUCKET: storageBucket.bucketName,
}
```

## IAM Permissions Required

```typescript
// DynamoDB
- chatMessageTable: ReadWrite
- chatSessionTable: ReadWrite
- projectTable: Read
- agentProgressTable: ReadWrite
- sessionContextTable: ReadWrite

// S3
- storageBucket: Read/Write

// Bedrock
- bedrock:InvokeModel
- bedrock:InvokeModelWithResponseStream
```

## API Route

```
POST /api/chat/message
Authorization: Cognito JWT
Timeout: 300 seconds
Memory: 1024 MB

Request Body:
{
  "chatSessionId": "string",
  "message": "string",
  "foundationModelId": "string" (optional),
  "userId": "string" (optional),
  "agentType": "auto" | "petrophysics" | "maintenance" | "renewable" | "edicraft" (optional)
}

Response:
{
  "success": boolean,
  "message": string,
  "data": {
    "artifacts": array,
    "thoughtSteps": array,
    "sourceAttribution": array,
    "agentUsed": string
  }
}
```

## Testing Plan

Once dependencies are resolved:

1. **Build Test**
   ```bash
   npm run build --prefix cdk
   ```

2. **Deploy Test**
   ```bash
   npm run deploy --prefix cdk
   ```

3. **Integration Test**
   - Send test message via API Gateway
   - Verify agent processes message
   - Verify response includes artifacts
   - Verify DynamoDB records created

4. **End-to-End Test**
   - Test from frontend UI
   - Verify full chat workflow
   - Verify artifacts render correctly

## Notes

- The agent code is complex with many interdependencies
- A phased migration approach is recommended
- Core functionality should be prioritized over optional features
- Each agent can be migrated and tested independently
