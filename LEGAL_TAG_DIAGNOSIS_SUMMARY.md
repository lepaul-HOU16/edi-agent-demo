# Legal Tag Retrieval Issue - Diagnosis Summary

## Problem Description
The legal tags page shows "0 tags" even though legal tags have been created. The console shows the error:
```
Primary query failed, trying fallback {queryType: 'primary', error: 'Unknown response structure: ["listLegalTags"]'}
```

## Root Cause Analysis

### 1. GraphQL Schema is Correct
- Backend testing confirmed that both `getLegalTags` and `listLegalTags` operations exist
- Schema introspection shows the correct structure with proper arguments
- The GraphQL endpoint is responding correctly

### 2. Authentication Issue Identified
- API key authentication works for basic queries but **fails for legal tag operations**
- Error: "Not Authorized to access getLegalTags/listLegalTags on type Query"
- This suggests the frontend needs to use **Cognito JWT tokens**, not API keys

### 3. Response Structure Mismatch
- The error `"Unknown response structure: ["listLegalTags"]"` indicates the response normalizer is receiving an unexpected format
- The normalizer expects either:
  - `response.listLegalTags.items` (connection format)
  - `response.getLegalTags.items` (connection format)
  - Direct array format
- But it's getting something that has `listLegalTags` as a key but not in the expected structure

### 4. GraphQL Response Processing
- The `graphqlRequest` method returns `result.data` (extracts the data field from GraphQL response)
- So the normalizer receives the data portion directly, not the full GraphQL response
- This should be correct, but the structure might still be wrong

## Diagnostic Steps Added

I've added diagnostic logging to:

1. **osduApiService.js** - `_executeLegalTagQuery` method:
   - Logs the raw GraphQL response structure
   - Shows response keys and data structure

2. **responseNormalizer.ts** - `normalizeLegalTagResponse` method:
   - Logs the input to the normalizer
   - Shows detailed information about unknown response structures

## Next Steps to Fix

### Step 1: Test with Proper Authentication
1. Extract JWT tokens from a logged-in browser session
2. Use the `test-legal-tag-with-jwt.js` script to test with proper Cognito authentication
3. Compare the response structure with what the frontend expects

### Step 2: Fix Response Structure Handling
Based on the test results, update the response normalizer to handle the actual response format.

### Step 3: Update Frontend Queries
If needed, update the GraphQL queries to match the actual backend schema.

## Testing Scripts Created

1. **`frontend-uxpin/test-legal-tag-with-jwt.js`** - Tests legal tag queries with JWT authentication
2. **`backend/tools/get-browser-tokens.js`** - Helper to extract JWT tokens from browser
3. **`frontend-uxpin/test-legal-tag-schema.js`** - General GraphQL schema testing

## How to Test

1. **Get JWT tokens from browser:**
   ```bash
   node backend/tools/get-browser-tokens.js
   ```

2. **Test with JWT authentication:**
   ```bash
   # In browser console on legal tags page:
   console.log(window.__OIDC_TOKENS__)
   
   # Then run:
   ID_TOKEN="eyJ..." ACCESS_TOKEN="eyJ..." node frontend-uxpin/test-legal-tag-with-jwt.js
   ```

3. **Check diagnostic logs:**
   - Open the legal tags page in browser
   - Check browser console for diagnostic logs starting with "🔍 DIAGNOSTIC"
   - Look for the actual response structure

## Expected Resolution

Once we see the actual response structure with proper authentication, we can:
1. Update the response normalizer to handle the correct format
2. Fix any GraphQL query issues
3. Ensure proper error handling for authentication failures

The issue is likely a combination of:
- Authentication method mismatch (API key vs JWT)
- Response structure not matching frontend expectations
- Possible GraphQL query structure issues

## Files Modified

- `frontend-uxpin/src/services/osduApiService.js` - Added diagnostic logging
- `frontend-uxpin/src/utils/responseNormalizer.ts` - Added diagnostic logging
- `.kiro/specs/legal-tag-retrieval-fix/requirements.md` - Added new requirement for schema mismatch
- `.kiro/specs/legal-tag-retrieval-fix/design.md` - Added new phase for schema resolution
- `.kiro/specs/legal-tag-retrieval-fix/tasks.md` - Added new tasks for fixing the issue