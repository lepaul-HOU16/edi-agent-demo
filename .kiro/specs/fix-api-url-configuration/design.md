# Design Document

## Overview

This design addresses the API URL configuration issue where the deployed frontend uses an incorrect API Gateway URL. The solution modifies the GitHub Actions CI/CD pipeline to automatically fetch the correct API URL from CloudFormation stack outputs, eliminating the need for manually-maintained GitHub secrets and ensuring the frontend always connects to the correct backend.

## Architecture

### Current Architecture (Broken)
```
GitHub Actions Workflow
  ├─ Uses hardcoded secret: VITE_API_URL = "https://hbt1j807qf..." (WRONG)
  ├─ Builds frontend with wrong URL
  └─ Deploys to CloudFront
       └─ Users get ERR_NAME_NOT_RESOLVED
```

### New Architecture (Fixed)
```
GitHub Actions Workflow
  ├─ Deploys CDK backend first
  ├─ Queries CloudFormation for HttpApiUrl output
  ├─ Uses output as VITE_API_URL during frontend build
  └─ Deploys frontend to CloudFront
       └─ Users connect to correct API
```

## Components and Interfaces

### 1. GitHub Actions Workflow Modification

**File:** `.github/workflows/deploy-production.yml`

**Changes:**
- Add step to fetch API URL from CloudFormation before building frontend
- Pass fetched URL to Vite build process
- Add logging for verification

### 2. CloudFormation Stack Output

**File:** `cdk/lib/main-stack.ts`

**Existing Output:**
```typescript
new cdk.CfnOutput(this, 'HttpApiUrl', {
  value: this.httpApi.apiEndpoint,
  description: 'HTTP API Gateway endpoint URL',
});
```

This output already exists and provides the correct API Gateway URL.

### 3. Frontend API Client

**File:** `src/lib/api/client.ts`

**Current Code:**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://t4begsixg2.execute-api.us-east-1.amazonaws.com';
```

**No changes needed** - the fallback URL is already correct for development.

## Data Models

No data model changes required. This is purely a configuration fix.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API URL Retrieval Success
*For any* successful CDK deployment, querying the CloudFormation stack for the `HttpApiUrl` output should return a valid HTTPS URL
**Validates: Requirements 1.1**

### Property 2: Frontend Build Uses Correct URL
*For any* frontend build in CI/CD, the VITE_API_URL environment variable should match the CloudFormation HttpApiUrl output
**Validates: Requirements 1.2**

### Property 3: Localhost Development Unaffected
*For any* local development session using `npm run dev`, API requests should successfully proxy to the backend regardless of VITE_API_URL setting
**Validates: Requirements 3.1, 3.2, 3.3**

## Error Handling

### CloudFormation Query Failure

**Scenario:** CloudFormation stack doesn't exist or query fails

**Handling:**
```yaml
- name: Get API URL from CloudFormation
  id: get-api-url
  run: |
    API_URL=$(aws cloudformation describe-stacks \
      --stack-name ${{ env.STACK_NAME }} \
      --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
      --output text 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
      echo "⚠️  Could not fetch API URL from CloudFormation, using default"
      API_URL="https://t4begsixg2.execute-api.us-east-1.amazonaws.com"
    fi
    
    echo "api-url=$API_URL" >> $GITHUB_OUTPUT
    echo "Using API URL: $API_URL"
```

### Invalid URL Format

**Scenario:** CloudFormation returns malformed URL

**Handling:**
```yaml
- name: Validate API URL
  run: |
    if [[ ! "${{ steps.get-api-url.outputs.api-url }}" =~ ^https:// ]]; then
      echo "❌ Invalid API URL format"
      exit 1
    fi
```

### Build Failure

**Scenario:** Frontend build fails with new URL

**Handling:**
- CI/CD will fail and not deploy broken frontend
- Previous working version remains deployed
- Developers notified via GitHub Actions failure

## Testing Strategy

### Manual Testing

1. **Verify CloudFormation Output:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name EnergyInsights-development \
     --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
     --output text
   ```

2. **Test Localhost Development:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Verify chat functionality works
   ```

3. **Test Deployed Frontend:**
   ```bash
   # After CI/CD deployment
   # Open https://d2hkqpgqguj4do.cloudfront.net
   # Verify chat functionality works
   # Check browser console for API URL
   ```

### Verification Steps

1. Check GitHub Actions logs for API URL being used
2. Verify frontend build includes correct API URL
3. Test deployed application connects to backend
4. Verify no ERR_NAME_NOT_RESOLVED errors

## Implementation Notes

### GitHub Secret Cleanup

After implementing this fix, the `VITE_API_URL` GitHub secret can be deleted as it will no longer be used.

### Deployment Order

The workflow already deploys backend before frontend, which is correct. The new step will fit between these existing jobs:
1. `deploy-backend` (existing)
2. **NEW:** Fetch API URL from CloudFormation
3. `deploy-frontend` (existing, modified to use fetched URL)

### Backward Compatibility

The code fallback URL ensures that:
- Local development works without environment variables
- Manual builds work without CI/CD
- Emergency deployments can use hardcoded URL if needed

## Deployment Strategy

1. Update `.github/workflows/deploy-production.yml`
2. Commit and push to trigger CI/CD
3. Monitor GitHub Actions for successful deployment
4. Verify deployed frontend connects correctly
5. Delete obsolete `VITE_API_URL` GitHub secret

## Rollback Plan

If the fix causes issues:
1. Revert the workflow file commit
2. Push revert to trigger CI/CD
3. Previous workflow will use GitHub secret (even if wrong)
4. Investigate and fix before re-applying

## Success Criteria

- ✅ CI/CD automatically fetches correct API URL
- ✅ Deployed frontend connects to backend without errors
- ✅ No ERR_NAME_NOT_RESOLVED errors in browser console
- ✅ Localhost development continues to work
- ✅ GitHub Actions logs show correct API URL being used
