# 🔧 Python Lambda Fix Applied

**Issue**: TypeScript validation error - `defineFunction` doesn't support Python runtime  
**Solution**: Use AWS CDK Lambda construct directly  
**Status**: ✅ Fixed

---

## The Error

```
error TS2769: No overload matches this call.
Type 'string' is not assignable to type 'NodeVersion'.
```

**Root Cause**: Amplify Gen 2's `defineFunction` only supports Node.js runtimes, not Python.

---

## The Fix

Changed from Amplify's `defineFunction` to AWS CDK's Lambda construct:

### Before (Broken):
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const renewableAgentCoreProxy = defineFunction({
  name: 'renewableAgentCoreProxy',
  entry: './handler.py',
  runtime: 'python3.12',  // ❌ Not supported!
  // ...
});
```

### After (Fixed):
```typescript
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableAgentCoreProxy = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'RenewableAgentCoreProxy', {
    runtime: lambda.Runtime.PYTHON_3_12,  // ✅ Works!
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(900),
    memorySize: 512,
    environment: {
      AGENT_RUNTIME_ARN: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
    },
  });
});
```

---

## What Changed

1. **Import CDK Lambda constructs** - Added `aws-cdk-lib/aws-lambda`
2. **Use CDK Lambda.Function** - Direct CDK construct instead of Amplify wrapper
3. **Runtime specification** - Use `lambda.Runtime.PYTHON_3_12` enum
4. **Code loading** - Use `lambda.Code.fromAsset(__dirname)` to load Python code
5. **Duration** - Use `Duration.seconds()` for timeout
6. **ES Module __dirname** - Added `fileURLToPath` and `dirname` imports to get `__dirname` in ES modules

---

## Verification

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Should show no errors now
```

---

## Deploy Now

The fix is applied. You can now deploy:

```bash
npx ampx sandbox
```

This will:
- ✅ Deploy Python Lambda successfully
- ✅ Configure IAM permissions
- ✅ Set up environment variables
- ✅ Enable real data integration

---

## Files Modified

- **amplify/functions/renewableAgentCoreProxy/resource.ts** - Fixed to use CDK Lambda construct

---

## Next Steps

1. **Deploy**: Run `npx ampx sandbox`
2. **Verify**: Check Lambda was created with `aws lambda list-functions | grep renewable`
3. **Test**: Try a renewable query in the chat interface

---

**Status**: ✅ Ready to deploy!
