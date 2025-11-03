# Terrain Query Routing Fix - Deployment Guide

## Overview

This guide covers deploying the terrain query routing fix that prevents terrain analysis queries from being incorrectly matched by project listing patterns.

## What Was Fixed

- Added word boundaries (`\b`) to all pattern matching regex in `ProjectListHandler`
- Added action verb safety check to reject queries with action verbs
- Added enhanced logging for debugging routing decisions
- All unit tests pass (8/8)
- All E2E tests pass (12/12)

## Deployment Steps

### Step 1: Verify Current Sandbox Status

```bash
# Check if sandbox is running
ps aux | grep "ampx sandbox"
```

### Step 2: Deploy Changes

Since the sandbox is already running, the changes should be picked up automatically.
However, to ensure the latest code is deployed:

```bash
# The sandbox auto-deploys on file changes
# Wait for the deployment to complete (watch the sandbox terminal)
```

### Step 3: Verify Deployment

```bash
# Run the deployment verification script
node tests/verify-terrain-routing-deployment.js
```

This script will:
- Find the renewable orchestrator Lambda
- Check Lambda configuration
- Test terrain analysis query routing
- Test project list query routing
- Provide deployment status



### Step 4: Monitor CloudWatch Logs

```bash
# Get the orchestrator Lambda name
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

# Tail the logs
aws logs tail "/aws/lambda/$ORCHESTRATOR" --follow
```

Look for these log messages:
- `[ProjectListHandler] Testing query: ...`
- `[ProjectListHandler] ✅ Matched pattern X`
- `[ProjectListHandler] ❌ Rejected: Query contains action verb`
- `[ProjectListHandler] ❌ No patterns matched`

### Step 5: Test in UI

1. Open the chat interface
2. Test terrain analysis query:
   - "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
   - Expected: Terrain analysis runs, NOT project list
3. Test project list query:
   - "list my renewable projects"
   - Expected: Project list displays, NOT terrain analysis

## Expected Results

### Terrain Analysis Query
- ✅ Routes to terrain tool Lambda
- ✅ Returns terrain analysis artifacts
- ✅ Does NOT return project list
- ✅ CloudWatch logs show: "No patterns matched" or "Rejected: action verb"

### Project List Query
- ✅ Routes to project list handler
- ✅ Returns project list or "no projects" message
- ✅ Does NOT call terrain Lambda
- ✅ CloudWatch logs show: "Matched pattern X"

## Troubleshooting

### Issue: Terrain queries still return project list

**Solution:**
1. Check if sandbox restarted after code changes
2. Verify `projectListHandler.ts` has word boundaries in patterns
3. Check CloudWatch logs to see which pattern matched
4. Restart sandbox manually if needed

### Issue: Project list queries don't work

**Solution:**
1. Check if patterns are too restrictive
2. Verify query contains expected keywords
3. Check CloudWatch logs for pattern matching details
4. Test with exact phrases from patterns

### Issue: Deployment verification fails

**Solution:**
1. Ensure AWS credentials are configured
2. Check Lambda exists: `aws lambda list-functions | grep renewableOrchestrator`
3. Verify Lambda has correct permissions
4. Check CloudWatch logs for errors

## Success Criteria

- ✅ Terrain analysis queries route to terrain tool
- ✅ Project list queries route to project list handler
- ✅ No false positives (terrain → project list)
- ✅ No false negatives (project list → not matched)
- ✅ CloudWatch logs show correct routing decisions
- ✅ All tests pass
- ✅ User can perform terrain analysis successfully

## Rollback Plan

If the fix causes issues:

```bash
# Revert the changes
git checkout HEAD~1 amplify/functions/shared/projectListHandler.ts

# Restart sandbox (if needed)
# Ctrl+C in sandbox terminal, then:
npx ampx sandbox
```

## Next Steps After Deployment

1. Monitor CloudWatch logs for 24 hours
2. Collect user feedback on routing accuracy
3. Track false positive/negative rates
4. Update patterns if needed based on real usage
5. Document any edge cases discovered

## Contact

If you encounter issues with this deployment, check:
- CloudWatch logs for detailed error messages
- Unit test results: `npm test tests/unit/test-project-list-handler-patterns.test.ts`
- E2E test results: `npm test tests/e2e/test-terrain-routing-proxy-agent.test.ts`
