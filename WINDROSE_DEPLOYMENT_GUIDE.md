# WindRose UI Fixes - Deployment Guide

## Quick Start

```bash
# 1. Restart sandbox to deploy backend changes
npx ampx sandbox

# 2. Wait for deployment (5-10 minutes)
# Watch for "Deployed" message

# 3. Validate fixes
node tests/validate-windrose-fixes.js

# 4. Test in UI
# Open chat interface and run: "analyze wind rose at 30.2672, -97.7431"
```

## Detailed Steps

### Step 1: Pre-Deployment Checklist

- [x] Backend changes made to `amplify/functions/renewableTools/simulation/handler.py`
- [x] Frontend changes made to `src/components/renewable/WindRoseArtifact.tsx`
- [x] TypeScript compilation passes (no errors)
- [x] Validation test script created
- [ ] Sandbox is running

### Step 2: Deploy Backend Changes

The backend changes require restarting the Amplify sandbox:

```bash
# Stop current sandbox (if running)
# Press Ctrl+C in the terminal running sandbox

# Start sandbox with function logs
npx ampx sandbox --stream-function-logs
```

**What to watch for:**
- CloudFormation stack updates
- Lambda function deployments
- "Deployed" message in console
- No deployment errors

**Expected output:**
```
[Sandbox] Deploying...
[Sandbox] Updating Lambda functions...
[Sandbox] renewable-simulation-simple: Deployed
[Sandbox] Deployed
```

**Deployment time:** 5-10 minutes

### Step 3: Verify Deployment

Check that the Lambda function was updated:

```bash
# Get Lambda function info
aws lambda get-function \
  --function-name renewable-simulation-simple \
  --query 'Configuration.LastModified' \
  --output text

# Should show recent timestamp
```

### Step 4: Run Validation Tests

```bash
# Run automated validation
node tests/validate-windrose-fixes.js
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
🧪 WINDROSE UI FIXES VALIDATION
═══════════════════════════════════════════════════════════

✅ Found simulation Lambda: renewable-simulation-simple

📋 Test 1: Plotly Format Validation
   ✅ plotlyWindRose object present
   ✅ plotlyWindRose.data array present (12 traces)
   ✅ plotlyWindRose.layout object present
   ✅ plotlyWindRose.statistics present
   ✅ Data source: NREL Wind Toolkit
   ✅ Data year: 2023
   ✅ No legacy windRoseData array

📋 Test 2: Duplicate Title Check
   ✅ Single title field (correct)
   ✅ No subtitle field
   ✅ No titles in visualizations

═══════════════════════════════════════════════════════════
✅ ALL VALIDATIONS PASSED
WindRose UI fixes are working correctly!
═══════════════════════════════════════════════════════════
```

### Step 5: Manual UI Testing

1. **Open Chat Interface:**
   ```
   http://localhost:3000/chat/[session-id]
   ```

2. **Test Wind Rose Analysis:**
   ```
   User query: "analyze wind rose at 30.2672, -97.7431"
   ```

3. **Verify:**
   - ✅ Plotly wind rose chart displays
   - ✅ Chart is interactive (hover, zoom)
   - ✅ No duplicate titles
   - ✅ Statistics display correctly
   - ✅ No console errors
   - ✅ No "Visualization Unavailable" message

4. **Check Browser Console:**
   ```
   Open DevTools (F12)
   Check Console tab
   Should see: "✅ Wind rose response prepared with Plotly format"
   Should NOT see: Any errors
   ```

### Step 6: Test Error Handling

1. **Test Invalid Coordinates:**
   ```
   User query: "analyze wind rose"
   (without coordinates)
   ```

2. **Verify:**
   - ✅ Error message displays
   - ✅ Page doesn't crash
   - ✅ Error is helpful and actionable

### Step 7: Test Wake Simulation

1. **Run Complete Workflow:**
   ```
   1. "analyze terrain at 30.2672, -97.7431"
   2. "optimize turbine layout"
   3. "run wake simulation"
   ```

2. **Verify:**
   - ✅ All artifacts load
   - ✅ No duplicate titles in wake analysis
   - ✅ Visualizations display correctly
   - ✅ No console errors

## Troubleshooting

### Issue: Sandbox Won't Start

**Symptoms:**
- Sandbox fails to deploy
- CloudFormation errors

**Solutions:**
```bash
# Check for syntax errors
npx tsc --noEmit

# Check Python syntax
python3 -m py_compile amplify/functions/renewableTools/simulation/handler.py

# Clear CDK cache
rm -rf node_modules/.cache

# Restart sandbox
npx ampx sandbox
```

### Issue: Lambda Permission Errors

**Symptoms:**
- "The role defined for the function cannot be assumed by Lambda"

**Solutions:**
- Wait for full deployment (can take 10 minutes)
- Check IAM roles in AWS Console
- Restart sandbox

### Issue: Plotly Chart Not Displaying

**Symptoms:**
- "Visualization Unavailable" message
- Blank chart area

**Solutions:**
1. Check browser console for errors
2. Verify `plotlyWindRose` data in response:
   ```javascript
   // In browser console
   console.log(artifactData.plotlyWindRose);
   ```
3. Check Lambda logs:
   ```bash
   aws logs tail /aws/lambda/renewable-simulation-simple --follow
   ```

### Issue: Duplicate Titles Still Appearing

**Symptoms:**
- Multiple "Wind Rose Analysis" titles
- Cluttered UI

**Solutions:**
1. Verify backend changes deployed:
   ```bash
   aws lambda get-function --function-name renewable-simulation-simple \
     --query 'Configuration.LastModified'
   ```
2. Clear browser cache
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: TypeScript Errors

**Symptoms:**
- Red squiggly lines in VS Code
- Build errors

**Solutions:**
```bash
# Check for type errors
npx tsc --noEmit

# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

## Rollback Procedure

If critical issues occur:

```bash
# 1. Revert code changes
git checkout HEAD~1 amplify/functions/renewableTools/simulation/handler.py
git checkout HEAD~1 src/components/renewable/WindRoseArtifact.tsx

# 2. Restart sandbox
npx ampx sandbox

# 3. Verify rollback
node tests/validate-windrose-fixes.js
```

## Success Criteria

Before considering deployment complete, verify:

- [ ] Sandbox deployed successfully
- [ ] Validation tests pass
- [ ] Wind rose charts display in UI
- [ ] No duplicate titles
- [ ] No console errors
- [ ] Error handling works
- [ ] Wake simulation works
- [ ] User can complete full workflow

## Monitoring

After deployment, monitor:

1. **CloudWatch Logs:**
   ```bash
   aws logs tail /aws/lambda/renewable-simulation-simple --follow
   ```

2. **Error Rate:**
   - Check for increased errors
   - Monitor visualization failures

3. **User Feedback:**
   - Test with actual users
   - Gather feedback on visualization quality

## Next Steps

After successful deployment:

1. **Document:**
   - Update user documentation
   - Add screenshots of working visualizations

2. **Monitor:**
   - Watch for any issues
   - Track visualization success rate

3. **Optimize:**
   - Consider performance improvements
   - Add more comprehensive tests

4. **Iterate:**
   - Gather user feedback
   - Plan future enhancements

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review CloudWatch logs
3. Check browser console for errors
4. Review `WINDROSE_UI_FIXES_APPLIED.md` for implementation details
5. Contact development team

## Related Documents

- `WINDROSE_UI_FIX_PLAN.md` - Comprehensive fix plan
- `WINDROSE_UI_FIXES_APPLIED.md` - Detailed changes made
- `tests/validate-windrose-fixes.js` - Validation test script
- `.kiro/specs/fix-windrose-ui-and-plotly/` - Full spec documentation
