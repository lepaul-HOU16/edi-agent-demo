# Chain of Thought Streaming - Troubleshooting Runbook

## Quick Reference Guide

This runbook provides step-by-step troubleshooting procedures for common Chain of Thought streaming issues.

## Issue 1: Multiple Thinking Indicators

### Symptoms
- Two or more "Thinking" indicators (purple gradient with bouncing dots) appear simultaneously
- Indicators overlap or appear in different locations
- UI looks cluttered during processing

### Diagnosis

**Step 1: Identify rendering components**
```bash
grep -r "ThinkingIndicator" src/components/
```

**Step 2: Check for duplicate rendering logic**
```bash
# Look for multiple components rendering ThinkingIndicator
grep -B 5 -A 5 "<ThinkingIndicator" src/components/
```

**Step 3: Check state management**
```bash
# Look for multiple isWaiting/isLoading states
grep -r "isWaiting\|isLoading\|isProcessing" src/
```

### Solution

**Fix: Remove duplicate indicator rendering**

1. Choose ONE component to own the indicator (usually parent/container)
2. Remove indicator from child components
3. Use props to control visibility

```typescript
// Parent component (ChatInterface) - OWNS indicator
{isWaitingForResponse && <ThinkingIndicator />}

// Child component (ChainOfThoughtDisplay) - NO indicator
{thoughtSteps.length > 0 && (
  <div className="chain-of-thought">
    {thoughtSteps.map(step => <ThoughtStep {...step} />)}
  </div>
)}
```

### Verification

1. Start local dev: `npm run dev`
2. Send test query
3. Count indicators in browser DevTools:
```javascript
document.querySelectorAll('[class*="thinking"]').length
// Should be 1
```
4. Deploy and test in production

### Files to Check
- `src/components/ChainOfThoughtDisplay.tsx`
- `src/components/ChatInterface.tsx`
- `src/components/ThinkingIndicator.tsx`

---

## Issue 2: Persistent Thinking Indicators

### Symptoms
- Thinking indicator remains visible after response completes
- Indicator appears on page reload even when no processing is happening
- Stale indicators accumulate over time

### Diagnosis

**Step 1: Check DynamoDB for streaming messages**
```bash
./check-dynamodb-streaming-messages.sh
```

Expected: Zero messages with `role='ai-stream'` after responses complete

**Step 2: Check if cleanup is implemented**
```bash
grep -r "cleanupStreamingMessages" cdk/lambda-functions/
```

**Step 3: Check CloudWatch logs for cleanup**
```bash
./check-cloudwatch-errors.sh | grep -i cleanup
```

**Step 4: Check frontend filtering**
```bash
grep -r "ai-stream" src/pages/ChatPage.tsx
```

### Solution

**Fix 1: Implement backend cleanup**

```typescript
// File: cdk/lambda-functions/shared/thoughtStepStreaming.ts

export async function cleanupStreamingMessages(
  sessionId: string,
  userId: string
): Promise<{ deleted: number; errors: string[] }> {
  // Query for streaming messages
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME!,
    KeyConditionExpression: 'sessionId = :sessionId',
    FilterExpression: 'userId = :userId AND #role = :role',
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: {
      ':sessionId': sessionId,
      ':userId': userId,
      ':role': 'ai-stream'
    }
  };
  
  const result = await dynamodb.query(params).promise();
  
  // Delete each streaming message
  let deleted = 0;
  const errors: string[] = [];
  
  for (const item of result.Items || []) {
    try {
      await dynamodb.delete({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
          sessionId: item.sessionId,
          timestamp: item.timestamp
        }
      }).promise();
      deleted++;
    } catch (error) {
      errors.push(`Failed to delete: ${error.message}`);
    }
  }
  
  return { deleted, errors };
}
```

**Fix 2: Call cleanup after response**

```typescript
// File: cdk/lambda-functions/chat/handler.ts

// After storing final response
await storeMessage(sessionId, userId, finalResponse);

// Cleanup streaming messages
const cleanupResult = await cleanupStreamingMessages(sessionId, userId);
console.log(`🧹 Cleaned up ${cleanupResult.deleted} streaming messages`);
```

**Fix 3: Add frontend filtering**

```typescript
// File: src/pages/ChatPage.tsx

const STALE_MESSAGE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const filteredMessages = messages.filter(msg => {
  if (msg.role === 'ai-stream') {
    const age = Date.now() - msg.timestamp;
    if (age > STALE_MESSAGE_THRESHOLD) {
      console.warn('⚠️ Ignoring stale streaming message', msg);
      return false;
    }
  }
  return true;
});
```

### Verification

1. Send test query
2. Wait for response to complete
3. Check DynamoDB:
```bash
./check-dynamodb-streaming-messages.sh
# Should show 0 streaming messages
```
4. Reload page
5. Verify no stale indicators appear

### Files to Check
- `cdk/lambda-functions/shared/thoughtStepStreaming.ts`
- `cdk/lambda-functions/chat/handler.ts`
- `src/pages/ChatPage.tsx`

---

## Issue 3: Batched Streaming (Not Real-Time)

### Symptoms
- All thought steps appear at once at the end
- No incremental updates during processing
- Steps don't appear every 3-5 seconds

### Diagnosis

**Step 1: Check if using BaseEnhancedAgent**
```bash
grep -r "extends BaseEnhancedAgent" cdk/lambda-functions/chat/agents/
```

**Step 2: Check if operations are awaited**
```bash
grep -r "addThoughtStep\|streamThoughtStep" cdk/lambda-functions/chat/agents/ | grep -v "await"
```

**Step 3: Check method signatures**
```bash
grep -A 3 "streamThoughtStep" cdk/lambda-functions/chat/agents/BaseEnhancedAgent.ts
```

Look for:
- Return type `void` (BAD) vs `Promise<void>` (GOOD)
- Missing `async` keyword (BAD)
- Missing `await` in implementation (BAD)

**Step 4: Add timing logs**
```typescript
console.log('🕐 Step 1 start:', Date.now());
await addStreamingThoughtStep(...);
console.log('🕐 Step 1 complete:', Date.now());
```

Check CloudWatch logs for timing patterns

### Solution

**Option 1: Use direct streaming functions (Recommended)**

```typescript
// File: cdk/lambda-functions/chat/agents/myAgent.ts

import { 
  addStreamingThoughtStep, 
  updateStreamingThoughtStep 
} from '../shared/thoughtStepStreaming';

export class MyAgent {
  async processQuery(query: string): Promise<string> {
    // Direct streaming - properly awaited
    await addStreamingThoughtStep(this.sessionId, this.userId, {
      id: generateId(),
      content: 'Step 1',
      status: 'in-progress'
    });
    
    await doWork1();  // Takes 3-5 seconds
    
    await addStreamingThoughtStep(this.sessionId, this.userId, {
      id: generateId(),
      content: 'Step 2',
      status: 'in-progress'
    });
    
    await doWork2();  // Takes 3-5 seconds
    
    return response;
  }
}
```

**Option 2: Fix BaseEnhancedAgent**

```typescript
// File: cdk/lambda-functions/chat/agents/BaseEnhancedAgent.ts

protected async streamThoughtStep(step: string): Promise<void> {
  await addStreamingThoughtStep(this.sessionId, this.userId, {
    id: this.generateStepId(),
    content: step,
    status: 'in-progress',
    timestamp: Date.now()
  });
}

protected async addThoughtStep(content: string): Promise<void> {
  this.thoughtSteps.push(content);
  await this.streamThoughtStep(content);
}
```

Then update all callers:
```typescript
// Before
this.addThoughtStep('Analyzing...');

// After
await this.addThoughtStep('Analyzing...');
```

### Verification

1. Test locally:
```bash
npm run dev
```

2. Send test query

3. Watch thought steps appear:
- Step 1 appears immediately
- Wait 3-5 seconds
- Step 2 appears
- Wait 3-5 seconds
- Step 3 appears

4. Check timing in CloudWatch logs:
```bash
./check-cloudwatch-errors.sh | grep "🕐"
```

5. Deploy and test in production

### Files to Check
- `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`
- `cdk/lambda-functions/chat/agents/BaseEnhancedAgent.ts`
- `cdk/lambda-functions/shared/thoughtStepStreaming.ts`

---

## Issue 4: Project Context Not Working

### Symptoms
- Workflow buttons don't work
- Actions execute on wrong project
- "Project not found" errors
- Context is undefined in backend

### Diagnosis

**Step 1: Check if context is extracted from artifact**
```bash
grep -A 10 "setActiveProject" src/components/renewable/
```

**Step 2: Check if context is included in API request**
```bash
grep -A 10 "projectContext" src/components/renewable/WorkflowCTAButtons.tsx
```

**Step 3: Check if backend receives context**
```bash
./search-cloudwatch-project-context.sh
```

**Step 4: Add comprehensive logging**

```typescript
// Frontend
console.log('🎯 Active project:', activeProject);
console.log('🎯 Sending request with context:', projectContext);

// Backend
console.log('📥 Received body:', body);
console.log('📥 Extracted context:', body.projectContext);
```

### Solution

**Fix 1: Ensure artifact extracts context**

```typescript
// File: src/components/renewable/TerrainMapArtifact.tsx

useEffect(() => {
  if (data?.projectId && data?.projectName) {
    console.log('🎯 Setting active project:', data.projectId);
    setActiveProject({
      projectId: data.projectId,
      projectName: data.projectName,
      location: data.location,
      coordinates: data.coordinates
    });
  }
}, [data, setActiveProject]);
```

**Fix 2: Include context in API request**

```typescript
// File: src/components/renewable/WorkflowCTAButtons.tsx

const handleWorkflowAction = async (action: string) => {
  if (!activeProject) {
    console.error('❌ No active project');
    return;
  }
  
  console.log('🎯 Sending with context:', activeProject);
  
  const response = await sendMessage(message, {
    projectContext: {
      projectId: activeProject.projectId,
      projectName: activeProject.projectName
    }
  });
};
```

**Fix 3: Extract context in backend**

```typescript
// File: cdk/lambda-functions/chat/handler.ts

const projectContext = body.projectContext;

if (projectContext) {
  console.log('📥 Received project context:', projectContext);
  
  if (!projectContext.projectId || !projectContext.projectName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid project context' })
    };
  }
}
```

**Fix 4: Pass context to agent**

```typescript
// File: cdk/lambda-functions/chat/agents/agentRouter.ts

const response = await agent.processQuery(query, {
  sessionId,
  userId,
  projectContext: body.projectContext
});
```

**Fix 5: Add error handling**

```typescript
// File: src/components/renewable/WorkflowCTAButtons.tsx

if (!activeProject) {
  return (
    <Alert type="error" header="No Project Selected">
      Please select a project by viewing a project artifact first.
    </Alert>
  );
}
```

### Verification

1. Load renewable project artifact
2. Check console for context extraction:
```
🎯 Setting active project: project-123
```

3. Click workflow button
4. Check console for API request:
```
🎯 Sending with context: { projectId: 'project-123', ... }
```

5. Check CloudWatch logs:
```bash
./search-cloudwatch-project-context.sh
```

Look for:
```
📥 Received project context: { projectId: 'project-123', ... }
```

6. Verify action executes on correct project

### Files to Check
- `src/components/renewable/TerrainMapArtifact.tsx`
- `src/components/renewable/WorkflowCTAButtons.tsx`
- `src/contexts/ProjectContext.tsx`
- `cdk/lambda-functions/chat/handler.ts`
- `cdk/lambda-functions/chat/agents/agentRouter.ts`

---

## Issue 5: Changes Not Visible in Production

### Symptoms
- Code changes made but not visible in production
- Old version still showing
- Features not working as expected

### Diagnosis

**Step 1: Verify code was deployed**
```bash
git log -1
# Check if latest commit matches what you expect
```

**Step 2: Check deployment logs**
```bash
tail -100 deploy-frontend.log
# Look for errors or warnings
```

**Step 3: Check CloudFront cache**
```bash
aws cloudfront list-invalidations --distribution-id E18FPAPGJR8ZNO
# Check if invalidation was created
```

**Step 4: Hard refresh browser**
- Mac: Cmd+Shift+R
- Windows: Ctrl+Shift+R
- Or open in incognito window

### Solution

**Fix: Deploy frontend**

```bash
# Always deploy frontend after ANY change
./deploy-frontend.sh

# Wait for cache invalidation
echo "Waiting 2 minutes for CloudFront cache..."
sleep 120

# Test in production
open https://d2hkqpgqguj4do.cloudfront.net
```

**If backend changes were made**:
```bash
# Deploy backend
cd cdk
npm run deploy
cd ..

# THEN deploy frontend again
./deploy-frontend.sh
```

### Verification

1. Check deployment completed:
```bash
tail -20 deploy-frontend.log
# Should show "Deployment complete"
```

2. Check CloudFront invalidation:
```bash
aws cloudfront get-invalidation \
  --distribution-id E18FPAPGJR8ZNO \
  --id <INVALIDATION_ID>
# Status should be "Completed"
```

3. Test in production:
- Open https://d2hkqpgqguj4do.cloudfront.net
- Hard refresh (Cmd+Shift+R)
- Test the specific feature
- Check browser console for errors

### Files to Check
- `deploy-frontend.sh`
- `deploy-frontend.log`

---

## General Debugging Commands

### Check DynamoDB for streaming messages
```bash
./check-dynamodb-streaming-messages.sh
```

### Check CloudWatch logs for errors
```bash
./check-cloudwatch-errors.sh
```

### Search CloudWatch for project context
```bash
./search-cloudwatch-project-context.sh
```

### Monitor production for 24 hours
```bash
./monitor-production-24h.sh
```

### Test all agents
```bash
node test-all-agents-regression.js
```

### Deploy frontend
```bash
./deploy-frontend.sh
```

### Deploy backend
```bash
cd cdk && npm run deploy
```

---

## Emergency Rollback

### If deployment causes critical issues

**Step 1: Revert code**
```bash
git log -5  # Find last working commit
git revert HEAD  # Or git reset --hard <commit-hash>
```

**Step 2: Deploy reverted version**
```bash
./deploy-frontend.sh
cd cdk && npm run deploy
```

**Step 3: Verify rollback**
```bash
# Test in production
open https://d2hkqpgqguj4do.cloudfront.net
```

**Step 4: Investigate issue**
```bash
# Check logs
./check-cloudwatch-errors.sh

# Check what changed
git diff HEAD~1
```

---

## Monitoring Checklist

### Daily Checks

- [ ] Check CloudWatch for errors
- [ ] Check DynamoDB for streaming message accumulation
- [ ] Verify streaming works for all agents
- [ ] Check for stale indicators
- [ ] Verify project context works

### After Deployment

- [ ] Frontend deployed successfully
- [ ] Backend deployed successfully (if applicable)
- [ ] CloudFront cache invalidated
- [ ] Changes visible in production
- [ ] No errors in browser console
- [ ] No errors in CloudWatch logs
- [ ] All agents working correctly

### Weekly Review

- [ ] Review CloudWatch metrics
- [ ] Check DynamoDB table size
- [ ] Review error patterns
- [ ] Test all four agents
- [ ] Verify cleanup is working
- [ ] Check for performance issues

---

## Contact Information

### Documentation
- Main fixes: `docs/THINKING_INDICATOR_FIXES.md`
- BaseEnhancedAgent issues: `docs/BASE_ENHANCED_AGENT_STREAMING_ISSUES.md`
- Project context: `docs/PROJECT_CONTEXT_USAGE.md`

### Spec Files
- Requirements: `.kiro/specs/fix-critical-thinking-indicator-regressions/requirements.md`
- Design: `.kiro/specs/fix-critical-thinking-indicator-regressions/design.md`
- Tasks: `.kiro/specs/fix-critical-thinking-indicator-regressions/tasks.md`

### Key Files
- Streaming functions: `cdk/lambda-functions/shared/thoughtStepStreaming.ts`
- Chat handler: `cdk/lambda-functions/chat/handler.ts`
- Agent router: `cdk/lambda-functions/chat/agents/agentRouter.ts`
- ChainOfThoughtDisplay: `src/components/ChainOfThoughtDisplay.tsx`
- WorkflowCTAButtons: `src/components/renewable/WorkflowCTAButtons.tsx`

---

## Quick Reference

| Issue | Quick Fix | Verification |
|-------|-----------|--------------|
| Multiple indicators | Remove from ChainOfThoughtDisplay | Count indicators in DOM |
| Persistent indicators | Implement cleanup | Check DynamoDB |
| Batched streaming | Use direct streaming functions | Watch timing |
| Missing context | Add to API request | Check CloudWatch logs |
| Changes not visible | Deploy frontend | Test in production |

**Remember**: Always deploy frontend after ANY change!
