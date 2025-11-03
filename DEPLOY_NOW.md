# Deploy NREL HTTPS Fix - Quick Start

## TL;DR

1. **Stop sandbox** (Ctrl+C)
2. **Restart:** `npx ampx sandbox`
3. **Wait** 5-10 minutes
4. **Test:** `node tests/test-nrel-https-fix.js`
5. **Done!**

---

## What's Being Fixed

**Problem:** Simulation returns "Tool execution failed"
**Cause:** NREL API requires HTTPS, code uses HTTP
**Fix:** Changed `http://` to `https://` in API URL
**Impact:** All simulation queries will work with real NREL data

---

## Deployment

### Step 1: Stop Sandbox
In the terminal running `npx ampx sandbox`, press **Ctrl+C**

### Step 2: Restart Sandbox
```bash
npx ampx sandbox
```

### Step 3: Wait for Deployment
Watch for this message:
```
✔ Backend deployed successfully
```

Takes 5-10 minutes.

---

## Testing

### Automated Test
```bash
node tests/test-nrel-https-fix.js
```

**Expected output:**
```
✅ SUCCESS! Simulation completed
   Status: 200
   Has artifacts: Yes
✅ NREL HTTPS fix is working!
```

### Manual Test in UI
Query:
```
Generate a wind rose for coordinates 35.067482, -101.395466
```

**Expected result:**
- Wind rose visualization appears
- Shows "Data Source: NREL Wind Toolkit (2023)"
- ~8760 data points
- No errors

---

## If Something Goes Wrong

### Docker Hub Error Again
```bash
./scripts/retry-docker-deployment.sh
```

### Still Getting 403 Error
Check if HTTPS is deployed:
```bash
aws lambda get-function --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text) --query 'Code.Location' --output text | xargs curl -s | grep -o "https://developer.nrel.gov"
```

Should output: `https://developer.nrel.gov`

### Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text) --since 5m
```

Look for:
- ❌ Bad: `Status: 403`
- ✅ Good: `Successfully fetched wind data`

---

## Files Changed

- `amplify/functions/renewableTools/nrel_wind_client.py` (HTTP → HTTPS)

That's it. One line change.

---

## Timeline

- **Fix Applied:** Now
- **Deployment:** 5-10 minutes
- **Testing:** 2 minutes
- **Total:** ~12 minutes

---

**Ready?** Stop sandbox, restart, wait, test. Done!
