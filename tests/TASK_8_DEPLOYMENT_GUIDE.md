# Task 8: Deploy and Validate Fix - Deployment Guide

## Overview

This guide covers deploying the layout optimization persistence fix and validating it works correctly.

## Current Status

✅ **Code Implementation**: Complete (Tasks 1-7)
- Parameter validator enhanced with context awareness
- Orchestrator flow reordered to load context before validation
- Error messages enhanced with helpful guidance
- Validation logging improved
- All unit tests passing
- All integration tests passing
- All E2E tests passing

⏳ **Deployment**: Ready to deploy
- Changes made to:
  - `amplify/functions/renewableOrchestrator/handler.ts`
  - `amplify/functions/renewableOrchestrator/parameterValidator.ts`
  - `amplify/functions/shared/errorMessageTemplates.ts`

## Deployment Options

### Option 1: Automated Deployment (Recommended)

Run the automated deployment script:

```bash
./scripts/deploy-layout-optimization-fix.sh
```

This script will:
1. Check if sandbox is running (will ask you to stop it if so)
2. Start sandbox deployment
3. Monitor deployment progress
4. Wait for "Deployed" message
5. Run automated validation tests
6. Report results

**Time Required**: 10-15 minutes

---

### Option 2: Manual Deployment

If you prefer manual control:

#### Step 1: Stop Current Sandbox (if running)
```bash
# Find sandbox process
ps aux | grep "ampx sandbox"

# Stop it (Ctrl+C in the terminal where it's running)
```

#### Step 2: Start Sandbox
```bash
npx ampx sandbox --stream-function-logs
```

#### Step 3: Wait for Deployment
Watch for this message:
```
✅ Deployed
```

This typically takes 5-10 minutes.

#### Step 4: Verify Deployment
```bash
node tests/check-deployment-status.js
```

Expected output:
```
✅ Found orchestrator: [function-name]
✅ All environment variables set
✅ Code is recent
✅ Deployment looks good - ready for testing
```

#### Step 5: Run Validation Tests
```bash
node tests/validate-layout-optimization-fix.js
```

Expected output:
```
✅ ALL TESTS PASSED - Fix is working correctly!
```

---

## Validation Tests

### Automated Tests

The validation script tests:

1. **Terrain Analysis** - Establishes project context
2. **Layout Optimization with Context** - Auto-fills coordinates
3. **Layout Optimization without Context** - Shows helpful error
4. **Explicit Coordinates Override** - Explicit params take precedence
5. **CloudWatch Logs** - Verifies context usage is logged

Run with:
```bash
node tests/validate-layout-optimization-fix.js
```

---

### Manual UI Testing

Follow the guide in `tests/LAYOUT_OPTIMIZATION_FIX_UI_TEST_GUIDE.md`

#### Quick Test:

1. Open chat interface
2. Send: `analyze terrain at 35.067482, -101.395466`
3. Wait for completion
4. Send: `optimize layout` (no coordinates)
5. **Expected**: Should succeed without asking for coordinates

---

## Troubleshooting

### Issue: Deployment Fails

**Symptoms:**
- Sandbox crashes during deployment
- TypeScript compilation errors
- CDK synthesis errors

**Solutions:**
1. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

2. Check for syntax errors in modified files:
   ```bash
   node -c amplify/functions/renewableOrchestrator/handler.ts
   ```

3. Review deployment logs:
   ```bash
   tail -100 /tmp/sandbox-deploy.log
   ```

---

### Issue: Validation Tests Fail

**Symptoms:**
- Tests report failures
- Coordinates not auto-filled
- Error messages not helpful

**Solutions:**

1. **Check Deployment Status:**
   ```bash
   node tests/check-deployment-status.js
   ```

2. **Check CloudWatch Logs:**
   - Go to AWS Console → CloudWatch → Log Groups
   - Find `/aws/lambda/[stack]-renewableOrchestrator-[hash]`
   - Look for recent errors

3. **Verify Code Deployed:**
   - Check "Last Modified" timestamp
   - Should be within last 15 minutes

4. **Re-run Tests:**
   ```bash
   node tests/validate-layout-optimization-fix.js
   ```

---

### Issue: Environment Variables Missing

**Symptoms:**
```
❌ RENEWABLE_S3_BUCKET: NOT SET
```

**Solutions:**

1. **Restart Sandbox:**
   - Stop current sandbox (Ctrl+C)
   - Start again: `npx ampx sandbox`
   - Wait for full deployment

2. **Check backend.ts:**
   - Verify environment variables are set in `amplify/backend.ts`
   - Look for `addEnvironment()` calls

3. **Verify Deployment:**
   ```bash
   node tests/check-deployment-status.js
   ```

---

### Issue: UI Test Fails

**Symptoms:**
- Still getting "Missing required parameters" error
- Coordinates not auto-filled in UI

**Solutions:**

1. **Check Session ID:**
   - Ensure using same session for terrain + layout
   - Try in same chat window

2. **Check Project Storage:**
   - Verify S3 bucket exists
   - Check project data is saved after terrain analysis

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for errors during layout optimization

4. **Check Network Tab:**
   - Verify API calls are successful
   - Check request/response payloads

---

## Success Criteria

### Deployment Success

✅ Sandbox deployed without errors
✅ Orchestrator Lambda found
✅ All environment variables set
✅ Code timestamp is recent (< 15 minutes)

### Validation Success

✅ Automated tests pass (all 4 tests)
✅ CloudWatch logs show context usage
✅ UI test: Layout optimization succeeds after terrain analysis
✅ UI test: Helpful error shown without context
✅ UI test: Explicit coordinates override context

### User Experience Success

✅ Natural conversational flow
✅ No repeated parameter requests
✅ Helpful error messages
✅ Smooth user experience

---

## Next Steps After Successful Deployment

1. **Test in UI** - Follow UI test guide
2. **Monitor Logs** - Watch CloudWatch for any issues
3. **User Acceptance** - Have user validate the fix
4. **Mark Task Complete** - Update tasks.md

---

## Rollback Plan

If deployment causes issues:

1. **Stop Sandbox:**
   ```bash
   # Ctrl+C in sandbox terminal
   ```

2. **Revert Changes:**
   ```bash
   git checkout HEAD~1 amplify/functions/renewableOrchestrator/
   git checkout HEAD~1 amplify/functions/shared/errorMessageTemplates.ts
   ```

3. **Redeploy:**
   ```bash
   npx ampx sandbox
   ```

4. **Verify Rollback:**
   ```bash
   node tests/check-deployment-status.js
   ```

---

## Files Created for Deployment

- `scripts/deploy-layout-optimization-fix.sh` - Automated deployment script
- `tests/validate-layout-optimization-fix.js` - Automated validation tests
- `tests/check-deployment-status.js` - Deployment status checker
- `tests/LAYOUT_OPTIMIZATION_FIX_UI_TEST_GUIDE.md` - Manual UI testing guide
- `tests/TASK_8_DEPLOYMENT_GUIDE.md` - This guide

---

## Time Estimates

- **Automated Deployment**: 10-15 minutes
- **Manual Deployment**: 10-15 minutes
- **Automated Validation**: 2-3 minutes
- **Manual UI Testing**: 5-10 minutes
- **Total**: 15-30 minutes

---

## Contact

If you encounter issues not covered in this guide:
1. Check CloudWatch logs for detailed error messages
2. Review the troubleshooting section
3. Consult the requirements and design documents
4. Run diagnostic scripts to gather information

---

## Summary

The fix is ready to deploy. All code changes are complete and tested. Follow either the automated or manual deployment process, then run validation tests to confirm everything works correctly.

**Recommended**: Use the automated deployment script for the smoothest experience.

```bash
./scripts/deploy-layout-optimization-fix.sh
```
