# PM Feedback: Use Real NREL Data Instead of Mock Data

## Issue Identified

The PM of the Renewables Team correctly identified that the current implementation is **generating mock/synthetic wind data** instead of using **real NREL Wind Toolkit API data**.

### Current Problem

**Location:** `amplify/functions/renewableTools/simulation/handler.py` (lines 536-558)

```python
# WRONG - Using mock data
wind_data = {
    'speeds': np.random.weibull(2, 1000) * 15,
    'directions': np.random.uniform(0, 360, 1000)
}
```

This is also happening in:
- `amplify/functions/renewableTools/matplotlib_generator.py` (line 84-86)
- Multiple fallback scenarios throughout the codebase

### Correct Approach (From Workshop Materials)

**Location:** `agentic-ai-for-renewable-site-design-mainline/workshop-assets/MCP_Server/wind_farm_mcp_server.py`

```python
# CORRECT - Using real NREL API
def fetch_wind_data(latitude, longitude, year=2023):
    """Fetch wind data from NREL API"""
    api_key = get_nrel_api_key()
    
    nrel_api_url = (
        f'http://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv?'
        f'api_key={api_key}&'
        f'wkt=POINT({longitude} {latitude})&'
        f'attributes=wind_speed,wind_direction&'
        f'names={year}&'
        f'utc=false&'
        f'leap_day=false&'
        f'interval=60&'
        f'email=user@example.com'
    )
    
    response = requests.post(nrel_api_url, headers=headers, timeout=120)
    return response.text
```

## What Needs to Be Fixed

### 1. Create NREL Wind Data Client

**File to create:** `amplify/functions/renewableTools/nrel_wind_client.py`

Based on the workshop implementation, we need:
- Function to get NREL API key from AWS Secrets Manager or environment variable
- Function to fetch wind data from NREL Wind Toolkit API
- Function to process CSV data into usable format
- Proper error handling and fallbacks

### 2. Update All Wind Data Generation Points

**Files to update:**
1. `amplify/functions/renewableTools/simulation/handler.py`
   - Replace mock data generation with NREL API calls
   - Lines 536-558 need complete rewrite

2. `amplify/functions/renewableTools/matplotlib_generator.py`
   - Replace mock data in wind rose generation (lines 84-86)
   - Remove all `np.random` wind data generation

3. Any other locations using synthetic wind data

### 3. Add NREL API Key Configuration

**Required:**
- Store NREL API key in AWS Secrets Manager: `nrel/api_key`
- Or set environment variable: `NREL_API_KEY`
- Get free API key from: https://developer.nrel.gov/signup/

### 4. Follow Labs Workflow Exactly

The PM emphasized: **"The labs need to be adhered to more strictly"**

This means:
- Use the exact same data sources as the workshop
- Follow the same workflow steps
- Maintain the same output format
- Don't deviate from the established patterns

## NREL Wind Toolkit API Details

### API Endpoint
```
http://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv
```

### Parameters
- `api_key`: NREL API key (required)
- `wkt`: Location as WKT POINT (longitude, latitude)
- `attributes`: wind_speed, wind_direction
- `names`: Year (e.g., 2023)
- `utc`: false (use local time)
- `leap_day`: false
- `interval`: 60 (hourly data)
- `email`: User email

### Data Format
Returns CSV with columns:
- Timestamp
- Wind Speed (m/s) at multiple heights (10m, 40m, 60m, 80m, 100m, 120m, 140m, 160m, 200m)
- Wind Direction (degrees) at multiple heights

### Processing
1. Parse CSV (skip first row - metadata)
2. Extract wind speed and direction at appropriate height (typically 100m for wind turbines)
3. Convert to numpy arrays for analysis
4. Calculate statistics (mean, max, prevailing direction, etc.)

## Implementation Priority

### HIGH PRIORITY - Must Fix Immediately

1. **Wind Rose Data** - Currently using 100% mock data
   - Users see synthetic wind patterns
   - Not representative of actual site conditions
   - Violates PM requirement for real data

2. **Wake Simulation** - Using mock wind data for calculations
   - Affects energy production estimates
   - Impacts economic analysis
   - Critical for decision-making

### MEDIUM PRIORITY

3. **Seasonal Analysis** - Mock seasonal patterns
4. **Dashboard Data** - Some charts use synthetic data

## Testing Requirements

After implementing NREL API integration:

1. **Verify Real Data Fetching**
   ```python
   # Test that we're getting real NREL data
   wind_data = fetch_nrel_wind_data(35.067482, -101.395466)
   assert 'source' in wind_data
   assert wind_data['source'] == 'NREL Wind Toolkit'
   assert len(wind_data['speeds']) == 8760  # One year of hourly data
   ```

2. **Compare with Workshop Output**
   - Run same coordinates through workshop notebook
   - Run same coordinates through our implementation
   - Verify outputs match

3. **Validate Wind Rose**
   - Wind rose should show actual prevailing wind direction for location
   - Speed distribution should match NREL data
   - Not random/synthetic patterns

## PM's Key Points

1. **"Not using NREL data"** ✅ Confirmed - using np.random instead
2. **"Propensity to generate mock data"** ✅ Confirmed - multiple locations
3. **"Labs need to be adhered to more strictly"** ✅ Need to follow workshop pattern
4. **"Same output at the least and same workflow"** ✅ Must match workshop implementation

## Action Items

- [ ] Create `nrel_wind_client.py` based on workshop implementation
- [ ] Add NREL API key to AWS Secrets Manager
- [ ] Update `simulation/handler.py` to use real NREL data
- [ ] Update `matplotlib_generator.py` to use real NREL data
- [ ] Remove all `np.random` wind data generation
- [ ] Test with actual NREL API
- [ ] Verify output matches workshop notebooks
- [ ] Document NREL API usage in code
- [ ] Add error handling for API failures
- [ ] Implement caching to avoid excessive API calls

## References

- **Workshop Implementation:** `agentic-ai-for-renewable-site-design-mainline/workshop-assets/MCP_Server/wind_farm_mcp_server.py`
- **NREL Wind Toolkit API:** https://developer.nrel.gov/docs/wind/wind-toolkit/
- **NREL API Signup:** https://developer.nrel.gov/signup/
- **Workshop Notebooks:** `agentic-ai-for-renewable-site-design-mainline/workshop-assets/*.ipynb`

## Conclusion

The PM is absolutely correct. We need to:
1. Stop generating mock wind data
2. Use the real NREL Wind Toolkit API
3. Follow the workshop implementation exactly
4. Maintain the same workflow and output format

This is a critical fix that affects the accuracy and credibility of all wind farm analyses.

---

**Status:** 🔴 CRITICAL - Must fix before production deployment
**Owner:** Development Team
**Reviewer:** PM of Renewables Team
