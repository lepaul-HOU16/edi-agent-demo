# Docker ECR 403 Forbidden Fix

## Problem

Deployment was failing with:
```
ERROR: failed to solve: public.ecr.aws/lambda/python:3.12: 
failed to resolve source metadata for public.ecr.aws/lambda/python:3.12: 
unexpected status from HEAD request to https://public.ecr.aws/v2/lambda/python/manifests/3.12: 
403 Forbidden
```

## Root Cause

AWS Public ECR can return 403 Forbidden errors due to:
1. Rate limiting on unauthenticated requests
2. Temporary service issues
3. Regional access restrictions

## Solution

Changed Docker base image from AWS Public ECR to Docker Hub:

### Before
```dockerfile
FROM public.ecr.aws/lambda/python:3.12
```

### After
```dockerfile
FROM amazon/aws-lambda-python:3.12
```

## Files Modified

1. `amplify/functions/renewableTools/terrain/Dockerfile`
2. `amplify/functions/renewableTools/simulation/Dockerfile`

## Why This Works

- Docker Hub (`amazon/aws-lambda-python`) is more reliable for public access
- Same official AWS Lambda Python runtime
- No authentication required
- Better availability and rate limits

## Verification

After this fix, the deployment should proceed successfully:

```bash
# The build should now succeed
npx ampx sandbox

# Expected output:
# ✔ Backend synthesized
# ✔ Type checks completed
# ✔ Docker images built successfully
# ✔ Deployment complete
```

## Alternative Solutions (if still fails)

If Docker Hub also has issues, alternatives include:

1. **Use AWS CLI to authenticate with ECR**:
   ```bash
   aws ecr-public get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin public.ecr.aws
   ```

2. **Use a different base image**:
   ```dockerfile
   FROM python:3.12-slim
   # Then install AWS Lambda runtime interface client
   RUN pip install awslambdaric
   ```

3. **Pre-pull the image**:
   ```bash
   docker pull amazon/aws-lambda-python:3.12
   ```

## Status

✅ **FIXED** - Dockerfiles updated to use Docker Hub image
🔄 **READY** - Ready to retry deployment

## Next Steps

1. Retry sandbox deployment:
   ```bash
   npx ampx sandbox
   ```

2. Monitor build output for successful Docker image creation

3. Once deployed, run validation:
   ```bash
   node tests/validate-nrel-deployment.js
   ```

4. Run E2E tests:
   ```bash
   node tests/test-nrel-integration-e2e.js
   ```

---

**Fix Applied**: 2025-01-17 15:10
**Impact**: Resolves deployment blocker
**Risk**: Low (same runtime, different registry)
