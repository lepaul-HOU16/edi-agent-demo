# Design Document: Fix Catalog Layout and OSDU Regression

## Overview

This design addresses two critical issues in the Catalog page:
1. **OSDU Search Regression**: "show me osdu wells" returns "Service Not Configured" error
2. **Prompt Input Border Radius**: Top-right corner has excessive border radius compared to other corners

## Root Cause Analysis

### OSDU Regression
The OSDU Lambda function exists at `cdk/lambda-functions/osdu/handler.ts` but is **not configured in the CDK stack**. The Lambda checks for environment variables `OSDU_API_URL` and `OSDU_API_KEY`, and when they're missing, returns HTTP 503 with "Service Not Configured" error.

**Evidence:**
- Lambda handler exists and is functional
- No CDK configuration in `main-stack.ts`
- No API Gateway routes for `/api/osdu/*`
- Environment variables not set

### Border Radius Issue
The `ExpandablePromptInput` component uses Cloudscape's `PromptInput` component, which has inconsistent border radius styling. The top-right corner appears more rounded than the other three corners.

**Target:** Match the border radius of the response template container (likely 8px or 12px).

## Architecture

### OSDU Lambda Integration

```
Frontend (CatalogPage.tsx)
    ↓
searchCatalog() → /api/catalog/search
    ↓
Catalog Search Lambda
    ↓ (detects OSDU intent)
executeOSDUQuery() → /api/osdu/search
    ↓
OSDU Lambda Handler
    ↓
External OSDU API
```

### Current State
- ❌ OSDU Lambda not in CDK stack
- ❌ No API Gateway routes
- ❌ No environment variables
- ✅ Lambda handler code exists
- ✅ Frontend code exists

## Components and Interfaces

### 1. CDK Stack Configuration

**File:** `cdk/lib/main-stack.ts`

Add OSDU Lambda function with:
- Function name: `${id}-osdu`
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Code path: `lambda-functions/osdu`
- Timeout: 60 seconds (external API calls)
- Memory: 512 MB

**Environment Variables:**
```typescript
{
  OSDU_API_URL: process.env.OSDU_API_URL || '',
  OSDU_API_KEY: process.env.OSDU_API_KEY || '',
  AWS_REGION: this.region
}
```

**API Routes:**
- `POST /api/osdu/search` - Search OSDU wells
- `GET /api/osdu/wells/{id}` - Get specific well details

### 2. Border Radius Fix

**File:** `src/components/ExpandablePromptInput.tsx`

Add CSS override to normalize border radius:

```typescript
'& .awsui-prompt-input': {
  borderRadius: '8px !important', // Match response container
},
'& .awsui-prompt-input__container': {
  borderRadius: '8px !important',
}
```

## Data Models

### OSDU Search Request
```typescript
interface OSDUSearchRequest {
  query: string;
  dataPartition?: string;
  maxResults?: number;
}
```

### OSDU Search Response
```typescript
interface OSDUSearchResponse {
  answer: string;
  recordCount: number;
  records: Array<{
    id: string;
    name: string;
    type: string;
    operator?: string;
    location?: string;
    depth?: string;
    latitude?: number;
    longitude?: number;
  }>;
}
```

## Error Handling

### OSDU Lambda Errors

1. **Missing Configuration (503)**
   - When: `OSDU_API_URL` or `OSDU_API_KEY` not set
   - Response: "OSDU API is not configured"
   - User message: "The OSDU search service is not currently available."

2. **Invalid Query (400)**
   - When: Empty query or invalid maxResults
   - Response: Validation error message
   - User message: "Please provide a valid search query."

3. **API Timeout (504)**
   - When: External OSDU API doesn't respond within 50s
   - Response: "Request timeout"
   - User message: "The OSDU search request timed out."

4. **Network Error (502)**
   - When: Cannot reach OSDU API
   - Response: "Network error"
   - User message: "Unable to reach OSDU service."

### Frontend Error Display

The error is already properly displayed in the UI with:
- ❌ Service Not Configured header
- Query display
- Error message
- Suggestions for resolution
- Alternative action (search local data)

## Testing Strategy

### Unit Tests
- ✅ OSDU Lambda handler (existing tests)
- ✅ Frontend OSDU search flow (existing tests)

### Integration Tests
1. **OSDU Search Flow**
   - Test: "show me osdu wells"
   - Expected: Returns well data or proper error
   - Verify: API call reaches Lambda
   - Verify: Environment variables are set

2. **Border Radius Consistency**
   - Test: Visual inspection of prompt input
   - Expected: All four corners have equal border radius
   - Verify: Matches response container radius

### Manual Testing
1. Start localhost: `npm run dev`
2. Navigate to Catalog page
3. Type "show me osdu wells"
4. Verify: Either returns data OR shows proper "not configured" error (not 404)
5. Inspect prompt input border radius
6. Verify: All corners match

## Deployment Strategy

### Phase 1: CDK Configuration
1. Add OSDU Lambda to `main-stack.ts`
2. Configure environment variables
3. Add API Gateway routes
4. Deploy: `cd cdk && npm run deploy`

### Phase 2: Frontend Fix
1. Update `ExpandablePromptInput.tsx` border radius
2. Test on localhost
3. Commit changes

### Phase 3: Verification
1. Test OSDU search on localhost
2. Verify border radius fix
3. Check CloudWatch logs for OSDU Lambda invocations

## Configuration Requirements

### Environment Variables (CDK)
```bash
# .env or CDK context
OSDU_API_URL=https://your-osdu-api.com/search
OSDU_API_KEY=your-api-key-here
```

### Fallback Behavior
If environment variables are not set:
- Lambda returns 503 "Service Not Configured"
- Frontend displays helpful error message
- User can still search local catalog data

## Success Criteria

1. ✅ OSDU Lambda is deployed and accessible
2. ✅ API Gateway routes `/api/osdu/*` exist
3. ✅ "show me osdu wells" query reaches OSDU Lambda
4. ✅ Proper error message if OSDU API not configured
5. ✅ Prompt input border radius is consistent (all corners equal)
6. ✅ Border radius matches response container
7. ✅ No console errors or warnings

## Notes

- OSDU API credentials are optional - system works without them
- If credentials not provided, users get clear error message
- Local catalog search still works independently
- Border radius fix is purely cosmetic but improves UX consistency
