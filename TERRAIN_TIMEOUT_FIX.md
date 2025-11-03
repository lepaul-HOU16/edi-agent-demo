# Terrain Analysis Timeout Fix

## Problem
Users were experiencing "Execution timed out" errors when requesting terrain analysis for layout optimization. The timeout was occurring because:

1. **Large search radius**: Default 5km radius queries too much OSM data
2. **Slow OSM API**: Overpass API can take 25-30 seconds for complex queries
3. **Multiple retries**: 3 retry attempts with exponential backoff added more time
4. **Lambda timeout**: Total execution time exceeded Lambda's timeout limit

## Root Cause
The terrain analysis Lambda was making comprehensive OSM queries that could take 30+ seconds:
- Query timeout: 25 seconds
- HTTP timeout: 30 seconds  
- 3 retry attempts with backoff
- Total possible time: 90+ seconds

## Solution Implemented

### 1. Reduced Search Radius (terrain/handler.py)
```python
# CRITICAL: Reduce radius to prevent timeout
if radius_km > 3.0:
    logger.warning(f"⚠️ Reducing radius from {radius_km}km to 3.0km to prevent timeout")
    radius_km = 3.0
```

**Impact**: Smaller area = fewer features = faster query

### 2. Reduced OSM Query Timeout (osm_client.py)
```python
# Before
self.timeout = 30
query = f"""[out:json][timeout:25][maxsize:536870912];"""
out geom 1000;

# After  
self.timeout = 15  # Reduced from 30 to 15 seconds
query = f"""[out:json][timeout:12][maxsize:536870912];"""
out geom 500;  # Reduced from 1000 to 500 features
```

**Impact**: Fail faster if OSM is slow, return fewer features

### 3. Reduced Retry Attempts (osm_client.py)
```python
# Before
self.retry_config = RetryConfig(max_attempts=3, backoff_factor=2.0)

# After
self.retry_config = RetryConfig(max_attempts=2, backoff_factor=1.5)
```

**Impact**: Less time spent retrying failed requests

## Expected Behavior

### Before Fix
- Request with 5km radius
- OSM query takes 25-30 seconds
- 3 retry attempts if it fails
- Total time: 30-90+ seconds
- Result: **TIMEOUT ERROR**

### After Fix
- Request with 5km radius → automatically reduced to 3km
- OSM query takes 10-15 seconds
- 2 retry attempts if it fails
- Fallback to synthetic data if all attempts fail
- Total time: 10-25 seconds
- Result: **SUCCESS with real or fallback data**

## Testing

Run the test to verify the fix:

```bash
node tests/test-terrain-timeout-fix.js
```

Expected output:
```
✅ Terrain analysis completed in 12.5s
✅ TIMEOUT PROTECTION WORKING: Radius reduced from 5.0km to 3.0km
✅ PERFORMANCE GOOD: Completed in 12.5s (< 20s threshold)
✅ Using real OSM data (preferred)
```

## Deployment

The fix is in the code and will be deployed with the next sandbox restart:

```bash
# Stop current sandbox (Ctrl+C)
npx ampx sandbox
```

## Monitoring

Watch CloudWatch logs for these indicators:

### Success Indicators
```
⚠️ Reducing radius from 5.0km to 3.0km to prevent timeout
✅ Query successful on https://overpass-api.de/api/interpreter, got 150 elements
📊 Query completed in 12.34s
```

### Fallback Indicators (acceptable)
```
❌ OSM API error: Query timeout - area too large or complex
🔄 No cached data available, using synthetic fallback
🚨 CREATING SYNTHETIC FALLBACK DATA due to: OSM API Error: Query timeout
```

## Trade-offs

### What We Gained
- ✅ No more timeout errors
- ✅ Faster response times (10-15s vs 30-90s)
- ✅ Better user experience
- ✅ Graceful fallback to synthetic data

### What We Lost
- ⚠️ Smaller search area (3km vs 5km)
- ⚠️ Fewer features returned (500 max vs 1000 max)
- ⚠️ Less comprehensive terrain data

### Why This Is Acceptable
- 3km radius still covers ~28 km² area (plenty for initial analysis)
- 500 features is sufficient for terrain constraints
- Users can request multiple analyses for larger areas
- Synthetic fallback ensures system never completely fails

## Future Improvements

1. **Caching**: Cache OSM data in S3/DynamoDB to avoid repeated queries
2. **Progressive Loading**: Start with small radius, expand if time permits
3. **Async Processing**: Move to async Lambda for longer execution time
4. **Pre-computed Data**: Pre-fetch terrain data for common locations

## Related Files

- `amplify/functions/renewableTools/terrain/handler.py` - Main terrain handler
- `amplify/functions/renewableTools/osm_client.py` - OSM API client
- `tests/test-terrain-timeout-fix.js` - Validation test

## Status

- [x] Code changes implemented
- [x] Test created
- [ ] Deployed to sandbox
- [ ] User validation

## Next Steps

1. Deploy the fix (restart sandbox)
2. Run the test to verify
3. Ask user to try terrain analysis again
4. Monitor CloudWatch logs for any remaining issues
