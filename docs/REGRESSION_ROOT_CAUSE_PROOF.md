# Regression Root Cause - Proof

## The Exact Error

When testing the windrose Lambda directly:

```bash
aws lambda invoke \
  --function-name amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH \
  --payload '{"query":"test"}' \
  /tmp/test.json

cat /tmp/test.json
```

**Result:**
```json
{
  "errorMessage": "Unable to import module 'handler': No module named 'numpy'",
  "errorType": "Runtime.ImportModuleError",
  "requestId": "...",
  "stackTrace": []
}
```

## Why This Caused "Text Only" Response

### The Flow

1. **User query**: "Analyze wind patterns"
2. **Agent Router**: Detects renewable pattern → routes to RenewableProxyAgent
3. **RenewableProxyAgent**: Calls renewableOrchestrator Lambda
4. **Orchestrator**: Detects wind_rose intent → calls windrose Lambda
5. **Windrose Lambda**: **FAILS** with ImportModuleError
6. **Orchestrator**: Catches error, returns generic message
7. **Frontend**: Receives message but NO artifacts
8. **User sees**: "Wind rose analysis complete for (35.067482, -101.395466)"

### The Code Path

```typescript
// amplify/functions/renewableOrchestrator/handler.ts
const result = await invokeLambdaWithRetry(functionName, payload);
// result = { error: "ImportModuleError: No module named 'numpy'" }

results.push(result);
// results = [{ success: false, error: "..." }]

const artifacts = formatArtifacts(results);
// artifacts = [] (no successful results to format)

const message = generateResponseMessage(intent, results);
// message = "Wind rose analysis completed successfully." (generic fallback)

return {
  success: true,  // ← Orchestrator succeeded (Lambda was called)
  message,        // ← Generic message
  artifacts,      // ← Empty array (no artifacts)
  ...
};
```

## Why Environment Variable Wasn't the Issue

The environment variable WAS set:
```bash
$ aws lambda get-function-configuration \
    --function-name amplify-digitalassistant--renewableOrchestratorlam-RFITIc9ID5Si \
    --query "Environment.Variables.RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME"

"amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH"
```

The orchestrator COULD call the windrose Lambda.

The windrose Lambda just FAILED when it tried to import numpy.

## Why This Wasn't Obvious

1. **No error in UI** - User just saw text message
2. **No error in orchestrator logs** - Orchestrator handled the error gracefully
3. **Success: true** - Orchestrator returned success (it successfully called the Lambda)
4. **Generic message** - "Wind rose analysis complete" looked like it worked

The ONLY way to find this was to:
1. Test the windrose Lambda DIRECTLY
2. See the ImportModuleError
3. Realize dependencies were missing

## The Fix

Add Lambda Layer with numpy/matplotlib/scipy:

```typescript
// amplify/backend.ts
const renewableDemoLayer = new lambda.LayerVersion(backend.stack, 'RenewableDemoLayer', {
  code: lambda.Code.fromAsset(join(__dirname, 'layers/renewableDemo/renewable-demo-layer.zip')),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
  description: 'Python dependencies for renewable energy tools'
});

const windroseLambda = backend.renewableWindroseTool.resources.lambda as lambda.Function;
windroseLambda.addLayers(renewableDemoLayer);
```

## After Fix

```bash
aws lambda invoke \
  --function-name amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH \
  --payload '{"query":"test"}' \
  /tmp/test.json

cat /tmp/test.json
```

**Expected Result:**
```json
{
  "statusCode": 200,
  "body": "{\"success\": true, \"type\": \"wind_rose_analysis\", \"data\": {...}}"
}
```

No ImportModuleError.
Artifacts returned.
Frontend renders WindRoseArtifact.
User sees visualization.

## Lesson Learned

**Always test Lambdas directly after deployment.**

Don't assume:
- "Lambda exists" = "Lambda works"
- "Orchestrator returns success" = "Tool Lambda succeeded"
- "Text message returned" = "Feature is working"

Always verify:
```bash
# Test Lambda directly
aws lambda invoke --function-name <lambda> --payload '{}' /tmp/test.json

# Check for errors
cat /tmp/test.json | grep -i error

# If ImportModuleError → missing dependencies
# If success: true → working correctly
```

---

**Root cause: Missing Python dependencies (numpy, matplotlib, scipy)**

**Solution: Lambda Layer with dependencies**

**Status: Fixed, ready to deploy**
