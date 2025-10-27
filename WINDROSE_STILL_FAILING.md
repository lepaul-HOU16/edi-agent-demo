# Wind Rose Still Failing - Next Steps

## What We Fixed
✅ Added `wind_rose_analysis` to parameter validation
✅ Added debug logging to orchestrator and frontend

## What's Still Broken
❌ Wind rose query returns "Tool execution failed"

## Possible Causes

### 1. Intent Not Being Detected
**Check:** Is the query being classified as `wind_rose_analysis`?

**Test in browser console:**
Look for orchestrator logs showing intent detection

### 2. Wrong Lambda Being Called
**Check:** Is wind rose being routed to simulation Lambda?

Wind rose should go to: `RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME`

### 3. Backend Lambda Failing
**Check:** Python errors in simulation Lambda

Common issues:
- Import error: `plotly_wind_rose_generator` not found
- Missing dependencies: numpy, plotly
- Timeout: Lambda taking too long
- Memory: Out of memory

### 4. Missing Action Parameter
**Check:** Does simulation Lambda know to generate wind rose?

The Lambda needs an `action` parameter:
```json
{
  "action": "wind_rose_analysis",
  "latitude": 35.067482,
  "longitude": -101.395466
}
```

## Immediate Debug Steps

### Step 1: Check Browser Console
Open browser console and run query:
```
show me a wind rose for 35.067482, -101.395466
```

Look for:
```
🌹 Orchestrator wind_rose_analysis mapping: { ... }
```

If you DON'T see this, the query isn't reaching the orchestrator properly.

### Step 2: Check CloudWatch Logs

```bash
# Find orchestrator Lambda
aws lambda list-functions | grep -i orchestrator

# Tail logs
aws logs tail /aws/lambda/[orchestrator-name] --follow

# Look for:
# - Intent detection: "wind_rose_analysis"
# - Parameter validation: "Required Parameters: latitude, longitude"
# - Tool invocation: "Calling wind_rose_analysis tool"
```

### Step 3: Check Simulation Lambda Logs

```bash
# Find simulation Lambda
aws lambda list-functions | grep -i simulation

# Tail logs
aws logs tail /aws/lambda/[simulation-name] --follow

# Look for:
# - "action: wind_rose_analysis"
# - "Creating Plotly wind rose data"
# - Python errors or tracebacks
```

### Step 4: Test Backend Directly

Create a test script to call simulation Lambda directly:

```javascript
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({});

async function testWindRose() {
  const payload = {
    action: 'wind_rose_analysis',
    latitude: 35.067482,
    longitude: -101.395466,
    project_id: 'test-wind-rose'
  };
  
  const command = new InvokeCommand({
    FunctionName: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambda.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

testWindRose();
```

## Most Likely Issue

Based on the error "Tool execution failed", the most likely issue is:

**The simulation Lambda is being called but failing internally**

This could be:
1. **Missing `action` parameter** - Lambda doesn't know to generate wind rose
2. **Python import error** - `plotly_wind_rose_generator` not loading
3. **Missing dependencies** - numpy, plotly not installed in Lambda
4. **Timeout** - Lambda timing out before completing

## Quick Fixes to Try

### Fix 1: Check Lambda Timeout
```bash
aws lambda get-function-configuration \
  --function-name [simulation-lambda-name] \
  --query "Timeout"

# If less than 60 seconds, increase it:
aws lambda update-function-configuration \
  --function-name [simulation-lambda-name] \
  --timeout 120
```

### Fix 2: Check Lambda Memory
```bash
aws lambda get-function-configuration \
  --function-name [simulation-lambda-name] \
  --query "MemorySize"

# If less than 512MB, increase it:
aws lambda update-function-configuration \
  --function-name [simulation-lambda-name] \
  --memory-size 1024
```

### Fix 3: Check Environment Variables
```bash
aws lambda get-function-configuration \
  --function-name [simulation-lambda-name] \
  --query "Environment.Variables"

# Should have:
# - RENEWABLE_S3_BUCKET
# - Any other required vars
```

## What to Share for Further Debugging

1. **Browser console output** - Full console logs from query
2. **Orchestrator logs** - Last 50 lines from CloudWatch
3. **Simulation logs** - Last 50 lines from CloudWatch
4. **Error message** - Exact error text shown to user

## Scripts Created

- `tests/check-windrose-backend.sh` - Check backend Lambda status
- `tests/debug-windrose-error.sh` - Check orchestrator errors
- `tests/debug-windrose-flow.js` - Test complete flow

Run these to gather diagnostic information.

## Next Actions

1. **Run query in browser** - Note exact error
2. **Check browser console** - Look for debug logs
3. **Check CloudWatch logs** - Both orchestrator and simulation
4. **Share findings** - Post logs here for analysis

The fix is close - we just need to identify which specific step is failing.
