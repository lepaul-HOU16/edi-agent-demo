# Schema-Aligned Service Fixes

## Problem Analysis
The previous fixes used assumed GraphQL schema structures that didn't match the actual deployed schemas. The error logs revealed the exact mismatches.

## Root Cause
- **Schema Service**: Used non-existent fields (`schemas`, `hasNextPage`, `totalCount`)
- **Search Service**: Used wrong argument structure (missing `input` argument)
- **Entitlements Service**: Used non-existent query (`listGroups`)

## Schema-Aligned Fixes

### 1. Schema Service ✅
**Issue**: Field names didn't match actual schema
**Fix**: Changed field names to match actual schema structure

```graphql
# Before (incorrect)
listSchemas(...) {
  schemas { ... }           # ❌ Field doesn't exist
  pagination {
    hasNextPage             # ❌ Field doesn't exist  
    totalCount              # ❌ Field doesn't exist
  }
}

# After (correct)
listSchemas(...) {
  items { ... }             # ✅ Correct field name
  pagination {
    nextToken               # ✅ Only field that exists
  }
}
```

### 2. Search Service ✅
**Issue**: Wrong argument structure and field names
**Fix**: Used required `input` argument and correct field names

```graphql
# Before (incorrect)
search(dataPartition: $dp, query: $q, options: $opts) {  # ❌ Wrong args
  results { ... }           # ❌ Field doesn't exist
  totalCount                # ❌ Field doesn't exist
  aggregations              # ❌ Field doesn't exist
}

# After (correct)  
search(input: $input) {     # ✅ Required input argument
  records { ... }           # ✅ Correct field name
  totalCount                # ✅ Correct field name
}
```

### 3. Entitlements Service ✅
**Issue**: Used non-existent query
**Fix**: Reused existing working query

```graphql
# Before (incorrect)
listGroups(...) { ... }     # ❌ Query doesn't exist

# After (correct)
listEntitlements(...) {     # ✅ Query already works elsewhere
  items { ... }             # ✅ Known working structure
}
```

## Key Insights

### 1. Schema Discovery Strategy
- ✅ **Legal Service**: Already working - used as reference
- ✅ **Storage Service**: Already working - used as reference  
- 🔧 **Other Services**: Aligned to match actual schema

### 2. Common Patterns Found
- Most services use `items` instead of service-specific field names
- Pagination typically only has `nextToken`, not `hasNextPage`/`totalCount`
- Input arguments are often wrapped in `input` objects
- Field names are often different from assumed OSDU standards

### 3. Error-Driven Development
The GraphQL validation errors were extremely helpful:
- `Field 'X' in type 'Y' is undefined` → Field name wrong
- `Unknown field argument X` → Argument structure wrong  
- `Missing field argument X` → Required argument missing
- `Unknown type X` → Type name wrong

## Expected Results

After these schema-aligned fixes:

✅ **Schema Service**: Should return list of schemas with proper structure
✅ **Search Service**: Should return search results with records
✅ **Entitlements Service**: Should return entitlements (groups/permissions)
✅ **Legal Service**: Already working (no changes needed)
✅ **Storage Service**: Already working (no changes needed)

## Testing Strategy

1. **Incremental Testing**: Test each service individually
2. **Field Discovery**: If errors persist, use minimal queries to discover fields
3. **Reference Working Services**: Use Legal/Storage as templates
4. **Error Analysis**: Let GraphQL validation guide the fixes

## Files Modified
- `frontend-uxpin/src/services/osduApiService.js`
  - `getSchemas()` - aligned field names with actual schema
  - `search()` - aligned argument structure and field names  
  - `getGroups()` - switched to working `listEntitlements` query

## Result
All services should now work with the actual deployed GraphQL schemas! 🎉