# Storage Service Button Fix Summary

## Problem
The "Test Storage Service" button in the API test page was not working because the data partition was being passed incorrectly to the OSDU storage service.

## Root Cause
The issue was that the storage service methods were missing `dataPartition` as GraphQL variables. The OSDU storage service requires BOTH the `data-partition-id` header (for authentication/routing) AND the `dataPartition` GraphQL variable (for the actual query).

## Solution
Fixed the storage service methods in `osduApiService.js` to:

1. **Add dataPartition to GraphQL variables** - The storage service schema requires dataPartition as a field argument
2. **Keep the `data-partition-id` header** - The ServiceConfigManager correctly sets this header for authentication
3. **Use both header and variable** - OSDU storage service needs both for proper operation

## Changes Made

### 1. Fixed TestAPI.tsx
- Fixed undefined `dataPartition` variable references in the storage test case
- Changed all instances to use hardcoded `'osdu'` data partition

### 2. Updated Storage Service Methods in osduApiService.js

#### testStorageHealthCheck()
- ✅ Already correct - no dataPartition in GraphQL variables

#### createStorageRecord()
- ❌ **Before**: Missing dataPartition in GraphQL variables
- ✅ **After**: `mutation CreateRecord($dataPartition: String!, $input: CreateRecordInput!)`

#### getStorageRecord()
- ❌ **Before**: Missing dataPartition in GraphQL variables  
- ✅ **After**: `query GetRecord($id: ID!, $dataPartition: String!)`

#### listStorageRecords()
- ❌ **Before**: Missing dataPartition in GraphQL variables
- ✅ **After**: `query ListRecords($dataPartition: String!, $filter: RecordFilter, $pagination: PaginationInput)`

### 3. Created SimpleStorageTest Component
- Added a simplified test component for easier debugging
- Includes console logging to verify headers are being sent correctly

## How OSDU Authentication Works

### Headers (Required for Authentication)
```javascript
{
  'Authorization': 'Bearer [JWT_ID_TOKEN]',
  'Content-Type': 'application/json',
  'data-partition-id': 'osdu',           // ← Data partition for auth/routing
  'x-access-token': '[JWT_ACCESS_TOKEN]',
  'Accept': 'application/json'
}
```

### GraphQL Queries (Correct Format)
**Important**: The storage service requires BOTH the header AND GraphQL variables!

```graphql
# Health Check (no dataPartition needed)
query { healthCheck }

# Create Record (dataPartition required as variable)
mutation CreateRecord($dataPartition: String!, $input: CreateRecordInput!) {
  createRecord(dataPartition: $dataPartition, input: $input) { id kind }
}

# Get Record (dataPartition required as variable)
query GetRecord($id: ID!, $dataPartition: String!) {
  getRecord(id: $id, dataPartition: $dataPartition) { id kind }
}

# List Records (dataPartition required as variable)
query ListRecords($dataPartition: String!, $filter: RecordFilter, $pagination: PaginationInput) {
  listRecords(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
    records { id kind }
  }
}
```

## Testing

### Browser Console Debugging
When you click the storage service button, you should see:
1. `"🚀 Simple storage test started"` (from SimpleStorageTest)
2. `"Storage service button clicked"` (from main TestAPI)
3. `"testService called with: storage"` (from main TestAPI)
4. `"Testing storage service..."` (from main TestAPI)
5. Network requests to the GraphQL endpoint with proper headers

### Network Tab Verification
Check the browser's Network tab to verify:
- ✅ `data-partition-id: osdu` header is present
- ✅ `Authorization: Bearer [token]` header is present
- ✅ `x-access-token: [token]` header is present
- ✅ GraphQL query does NOT include dataPartition variables

## Files Modified
- `frontend-uxpin/src/components/api-test/TestAPI.tsx`
- `frontend-uxpin/src/services/osduApiService.js`
- `frontend-uxpin/src/components/api-test/SimpleStorageTest.tsx` (new)

## Files Created
- `frontend-uxpin/test-storage-headers.js` (debugging guide)
- `frontend-uxpin/STORAGE_SERVICE_BUTTON_FIX.md` (this file)

## Result
The storage service button should now work correctly and properly communicate with the OSDU backend using the correct header-based authentication approach.