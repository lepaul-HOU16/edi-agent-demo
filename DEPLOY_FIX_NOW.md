# Deploy Wind Rose Fix - Step by Step

## What's Fixed

1. ✅ Lambda Layer added (numpy, matplotlib, scipy)
2. ✅ Handler.py fixed (removed problematic import)
3. ✅ Environment variables configured

## Current Problem

The OLD code is still deployed with the numpy import error.
The NEW code with the fix is NOT deployed yet.

## Deploy the Fix

### Step 1: Stop Current Sandbox (if running)

Press `Ctrl+C` in the terminal where sandbox is running.

### Step 2: Start Sandbox

```bash
npx ampx sandbox
```

### Step 3: Wait for Deployment

Watch for this message:
```
[Sandbox] Deployed
```

This takes 5-10 minutes.

### Step 4: Verify Deployment

```bash
bash scripts/diagnose-current-deployment.sh
```

Expected output:
```
✅ Windrose Lambda works correctly!
```

### Step 5: Test in UI

1. Open your app in browser
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Open chat
4. Type: "Analyze wind patterns for my site"
5. You should see wind rose artifact with metrics

## What Will Happen

After deployment:

1. **Windrose Lambda updated** with fixed handler.py
2. **Lambda Layer attached** with numpy/matplotlib
3. **Numpy imports correctly** from layer
4. **Wind data calculated** using numpy
5. **Artifacts returned** to frontend
6. **WindRoseArtifact renders** with metrics and direction table

## If Still Text-Only After Deployment

1. **Hard refresh browser**: `Cmd+Shift+R`
2. **Clear browser cache**
3. **Check Lambda logs**:
   ```bash
   bash scripts/diagnose-current-deployment.sh
   ```
4. **Verify no import errors** in the output

## Quick Commands

```bash
# Deploy
npx ampx sandbox

# After deployment, verify
bash scripts/diagnose-current-deployment.sh

# Test Lambda directly
bash scripts/test-windrose-now.sh
```

## Success Criteria

✅ No "ImportModuleError" in Lambda response
✅ Lambda returns `success: true`
✅ Response contains `artifacts` array
✅ Artifacts have `wind_rose_analysis` type
✅ Frontend renders WindRoseArtifact
✅ Metrics show non-zero wind speeds

---

**Just run: `npx ampx sandbox`**

That's it. Wait 5-10 minutes, then test.
