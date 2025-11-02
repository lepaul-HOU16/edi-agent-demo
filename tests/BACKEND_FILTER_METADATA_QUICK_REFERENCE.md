# Backend Filter Metadata - Quick Reference

## What Was Implemented

The backend now includes filter metadata in responses to help the frontend distinguish between:
- **Fresh searches** (fetching all data from OSDU)
- **Filter operations** (filtering existing data)

## Response Fields

### New Fields in Response

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `isFilterOperation` | `data.isFilterOperation` | boolean | True if this was a filter operation |
| `totalWells` | `data.stats.totalWells` | number | Total wells before filtering (only in filter ops) |
| `isFiltered` | `data.stats.isFiltered` | boolean | True if data is filtered (only in filter ops) |

### Example Responses

**Filter Operation:**
```json
{
  "type": "complete",
  "data": {
    "message": "Found 15 wells matching your query",
    "stats": {
      "wellCount": 15,
      "totalWells": 151,
      "isFiltered": true
    },
    "isFilterOperation": true
  }
}
```

**Fresh Search:**
```json
{
  "type": "complete",
  "data": {
    "message": "Successfully retrieved 151 wells from OSDU",
    "stats": {
      "wellCount": 151
    },
    "isFilterOperation": false
  }
}
```

## Frontend Integration

### Check if Filter Operation
```typescript
if (response.data.isFilterOperation) {
  // This is a filter - use filtered data
  const filteredCount = response.data.stats.wellCount;
  const totalCount = response.data.stats.totalWells;
  console.log(`Showing ${filteredCount} of ${totalCount} wells`);
} else {
  // This is a fresh search - use all data
  const totalCount = response.data.stats.wellCount;
  console.log(`Showing all ${totalCount} wells`);
}
```

### Display Filter Stats
```typescript
const displayStats = response.data.stats.isFiltered
  ? `${response.data.stats.wellCount} of ${response.data.stats.totalWells} total`
  : `${response.data.stats.wellCount} total`;
```

## Detection Logic

The backend detects filter operations by checking:
1. Does the request have `existing_context`?
2. Does `existing_context` have `allWells` data?

If both are true → Filter operation
Otherwise → Fresh search

## Backward Compatibility

✅ **Fully backward compatible**
- Fresh searches don't include filter metadata
- Existing fields unchanged
- New fields are optional/additive
- Frontend can check for field presence

## Testing

Run tests:
```bash
python3 tests/catalog-backend-filter-metadata.test.py
```

Expected output:
```
✅ ALL TESTS PASSED
Passed: 4/4
Failed: 0/4
```

## Files Modified

1. `amplify/functions/catalogSearch/handler.py`
   - Lines ~850-880: Filter detection and metadata addition

2. `amplify/functions/catalogSearch/strands_agent_processor.py`
   - Lines ~920-930: Track original well count
   - Lines ~1000-1010: Add filter metadata to stats
   - Lines ~1200-1210: Add filter metadata in intelligent filtering

## Common Use Cases

### Use Case 1: Show "X of Y" in Table Header
```typescript
const header = response.data.stats.isFiltered
  ? `Wells (${response.data.stats.wellCount} of ${response.data.stats.totalWells})`
  : `Wells (${response.data.stats.wellCount})`;
```

### Use Case 2: Determine Data Storage Strategy
```typescript
if (response.data.isFilterOperation) {
  // Store filtered data separately
  setFilteredData(data);
  setFilterStats({
    filteredCount: response.data.stats.wellCount,
    totalCount: response.data.stats.totalWells,
    isFiltered: true
  });
} else {
  // Store as main data
  setAnalysisData(data);
  setFilteredData(null);
}
```

### Use Case 3: Show Filter Indicator
```typescript
if (response.data.stats.isFiltered) {
  return (
    <Badge color="blue">
      Filtered: {response.data.stats.wellCount} of {response.data.stats.totalWells}
    </Badge>
  );
}
```

## Troubleshooting

### Issue: Filter metadata not present
**Check:**
- Is `existing_context` being sent in the request?
- Does `existing_context` have `allWells` data?
- Is the backend deployed with latest changes?

### Issue: totalWells is undefined
**Check:**
- Is this actually a filter operation? (Check `isFilterOperation`)
- Fresh searches don't have `totalWells` (this is expected)

### Issue: Backward compatibility broken
**Check:**
- Frontend should check for field presence before using
- Use optional chaining: `response.data.stats?.totalWells`
- Provide fallbacks: `totalWells ?? wellCount`

## Next Steps

1. ✅ Backend implementation complete
2. ⏳ Frontend integration (Task 2.2, 4.2, 4.3)
3. ⏳ Table component updates (Task 4.3)
4. ⏳ End-to-end testing (Task 10)

## Questions?

See full documentation:
- `tests/TASK_5_BACKEND_FILTER_METADATA_COMPLETE.md`
- `.kiro/specs/catalog-chat-filtering-and-persistence/design.md`
- `.kiro/specs/catalog-chat-filtering-and-persistence/requirements.md`
