# Design: Fix NREL Real Data Integration

## Overview

This design implements real NREL Wind Toolkit API integration, removes all synthetic data generation, and exposes sub-agent reasoning in the chain of thought panel. The implementation will match the workshop code exactly.

---

## Architecture

### Current (BROKEN) Flow
```
User Query → Orchestrator → Tool Lambda → Generate Synthetic Data → Return Mock Data
```

### Fixed Flow
```
User Query → Orchestrator → Tool Lambda → NREL API → Process Real Data → Return Real Data
                                              ↓
                                    Log reasoning steps
                                              ↓
                                    Chain of Thought Panel
```

---

## Components

### 1. NREL Wind Client (Python)

**Location:** `amplify/functions/renewableTools/nrel_wind_client.py`

**Purpose:** Fetch and process real wind data from NREL Wind Toolkit API

**Implementation:**
```python
class NRELWindClient:
    def __init__(self):
        self.api_key = self._get_api_key()
        self.base_url = "http://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv"
    
    def _get_api_key(self) -> str:
        """Get NREL API key from Secrets Manager or environment"""
        # 1. Try environment variable
        # 2. Try AWS Secrets Manager
        # 3. Raise error (NO FALLBACK TO DEMO KEY)
    
    def fetch_wind_data(self, lat: float, lon: float, year: int = 2023) -> str:
        """Fetch wind data CSV from NREL API"""
        # Exact implementation from workshop
    
    def process_wind_data(self, csv_data: str) -> Dict:
        """Process CSV into wind conditions with Weibull fitting"""
        # Exact implementation from workshop
        # Returns: p_wd, a, k, wd_bins, ti, mean_wind_speed, etc.
```

**Key Points:**
- NO synthetic data generation
- NO fallback to mock data
- Raise clear errors if API fails
- Match workshop implementation exactly

### 2. Updated Tool Handlers

**Files to Update:**
- `amplify/functions/renewableTools/simulation/handler.py`
- `amplify/functions/renewableTools/terrain/handler.py`
- Any other handlers using wind data

**Changes:**
```python
# REMOVE all synthetic data generation
# REMOVE wind_client.py with fallbacks
# ADD nrel_wind_client.py import
# USE NRELWindClient for all wind data

from nrel_wind_client import NRELWindClient

def handler(event, context):
    nrel_client = NRELWindClient()
    
    try:
        # Fetch real NREL data
        wind_data = nrel_client.fetch_wind_data(lat, lon, year)
        wind_conditions = nrel_client.process_wind_data(wind_data)
        
        # Add data source to response
        wind_conditions['data_source'] = 'NREL Wind Toolkit'
        wind_conditions['data_year'] = year
        
        return wind_conditions
        
    except Exception as e:
        # Return error - NO SYNTHETIC FALLBACK
        return {
            'error': str(e),
            'message': 'Unable to fetch wind data from NREL API',
            'instructions': 'Please check API key configuration and try again'
        }
```

### 3. Chain of Thought Integration

**Location:** `amplify/functions/renewableOrchestrator/handler.ts`

**Purpose:** Capture and expose sub-agent reasoning steps

**Implementation:**
```typescript
// Add thought steps for NREL API calls
thoughtSteps.push({
  step: stepNumber++,
  action: 'Fetching wind data from NREL Wind Toolkit API',
  status: 'in_progress',
  timestamp: Date.now()
});

// Call tool Lambda
const toolResult = await invokeTool(...);

// Update thought step with result
thoughtSteps[thoughtSteps.length - 1].status = 'completed';
thoughtSteps[thoughtSteps.length - 1].duration = Date.now() - startTime;
thoughtSteps[thoughtSteps.length - 1].details = {
  dataSource: 'NREL Wind Toolkit',
  dataYear: toolResult.data_year,
  dataPoints: toolResult.total_hours
};

// Add processing step
thoughtSteps.push({
  step: stepNumber++,
  action: 'Processing wind data with Weibull distribution fitting',
  status: 'completed',
  duration: processingTime,
  details: {
    sectors: 12,
    method: 'Weibull fitting',
    meanWindSpeed: toolResult.mean_wind_speed
  }
});
```

### 4. Visualization Updates

**Files to Update:**
- `src/components/renewable/PlotlyWindRose.tsx`
- `src/components/renewable/WindRoseArtifact.tsx`

**Changes:**
```typescript
// Add data source label to wind rose
<div className="data-source-label">
  Data Source: NREL Wind Toolkit ({dataYear})
</div>

// Display data quality indicators
{dataQuality && (
  <div className="data-quality">
    <Icon name="status-positive" />
    Real meteorological data from NREL
  </div>
)}
```

### 5. Remove Synthetic Data Code

**Files to DELETE or CLEAN:**
- `amplify/functions/renewableTools/wind_client.py` (has synthetic fallbacks)
- `amplify/functions/renewableTools/simulation/wind_client.py` (has synthetic fallbacks)
- `amplify/functions/renewableTools/terrain/wind_client.py` (has synthetic fallbacks)

**Functions to REMOVE:**
- `_generate_realistic_wind_data()`
- `create_synthetic_wind_fallback()`
- Any function with "mock", "synthetic", or "generate" in wind data context

---

## Data Models

### NREL Wind Data Response
```python
{
    'p_wd': [0.08, 0.09, ...],  # Probability by direction (12 sectors)
    'a': [8.5, 9.2, ...],         # Weibull scale parameter by sector
    'k': [2.0, 2.1, ...],         # Weibull shape parameter by sector
    'wd_bins': [0, 30, 60, ...],  # Direction bins
    'ti': 0.1,                     # Turbulence intensity
    'mean_wind_speed': 8.7,        # Mean wind speed (m/s)
    'total_hours': 8760,           # Total data points
    'prevailing_wind_direction': 180,  # Prevailing direction (degrees)
    'data_source': 'NREL Wind Toolkit',
    'data_year': 2023,
    'reliability': 'high'
}
```

### Chain of Thought Step (Enhanced)
```typescript
{
  step: number,
  action: string,
  status: 'in_progress' | 'completed' | 'error',
  timestamp: number,
  duration?: number,
  details?: {
    dataSource?: string,
    dataYear?: number,
    dataPoints?: number,
    method?: string,
    [key: string]: any
  }
}
```

---

## Error Handling

### NREL API Errors

**NO SYNTHETIC FALLBACKS** - Return clear errors instead:

```python
# API Key Missing
{
    'error': 'NREL_API_KEY_MISSING',
    'message': 'NREL API key not configured',
    'instructions': 'Set NREL_API_KEY environment variable or configure in AWS Secrets Manager',
    'signup_url': 'https://developer.nrel.gov/signup/'
}

# API Rate Limit
{
    'error': 'NREL_API_RATE_LIMIT',
    'message': 'NREL API rate limit exceeded',
    'instructions': 'Please wait a few minutes and try again',
    'retry_after': 300
}

# API Timeout
{
    'error': 'NREL_API_TIMEOUT',
    'message': 'NREL API request timed out',
    'instructions': 'Please try again. If problem persists, check NREL API status'
}

# Invalid Coordinates
{
    'error': 'INVALID_COORDINATES',
    'message': 'Coordinates outside NREL Wind Toolkit coverage area',
    'instructions': 'NREL data available for US locations only',
    'coverage': 'Continental United States'
}
```

### User-Facing Error Messages

Display errors clearly in the UI:
```
❌ Unable to fetch wind data from NREL API

Reason: API key not configured

Next Steps:
1. Configure NREL_API_KEY environment variable
2. Or set up AWS Secrets Manager with key 'nrel/api_key'
3. Get a free API key at: https://developer.nrel.gov/signup/

No synthetic data will be used. Real NREL data is required for accurate analysis.
```

---

## Testing Strategy

### Unit Tests
- Test NREL API client with mock HTTP responses
- Test Weibull fitting with known data
- Test error handling for all error cases
- Verify NO synthetic data generation exists

### Integration Tests
- Test end-to-end with real NREL API (using test key)
- Verify chain of thought captures all steps
- Verify data source labels display correctly
- Test error scenarios (missing key, rate limit, etc.)

### Validation Tests
- Compare output with workshop implementation
- Verify wind rose matches workshop format
- Confirm no synthetic data in any code path
- Verify PM requirements are met

---

## Deployment

### Environment Variables
```bash
# Required
NREL_API_KEY=your_api_key_here

# Optional (for Secrets Manager)
AWS_REGION=us-east-1
```

### AWS Secrets Manager Setup
```json
{
  "SecretId": "nrel/api_key",
  "SecretString": "{\"api_key\": \"your_api_key_here\"}"
}
```

### Lambda Configuration
- Timeout: 120 seconds (NREL API can be slow)
- Memory: 512 MB (sufficient for data processing)
- Environment: NREL_API_KEY or Secrets Manager access

---

## Migration Plan

### Phase 1: Create NREL Client
1. Create `nrel_wind_client.py` matching workshop code
2. Add unit tests
3. Test with real NREL API

### Phase 2: Remove Synthetic Data
1. Delete all synthetic data generation functions
2. Remove fallback logic
3. Update error handling

### Phase 3: Update Tool Handlers
1. Replace wind_client imports with nrel_wind_client
2. Remove synthetic fallback calls
3. Add proper error handling

### Phase 4: Chain of Thought Integration
1. Add NREL API call thought steps
2. Add data processing thought steps
3. Test visibility in UI

### Phase 5: UI Updates
1. Add data source labels
2. Add data quality indicators
3. Update error displays

### Phase 6: Validation
1. Test complete workflow
2. Compare with workshop implementation
3. Get PM approval

---

## Success Criteria

- ✅ Zero synthetic data generation in production code
- ✅ All wind data from NREL Wind Toolkit API
- ✅ Implementation matches workshop exactly
- ✅ Sub-agent reasoning visible in chain of thought
- ✅ Data source clearly labeled in visualizations
- ✅ Clear error messages (no silent fallbacks)
- ✅ PM approves the fix

---

## References

- Workshop implementation: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/MCP_Server/wind_farm_mcp_server.py`
- NREL Wind Toolkit API: https://developer.nrel.gov/docs/wind/wind-toolkit/
- Steering rules: `.kiro/steering/no-shortcuts-ever.md`, `.kiro/steering/regression-protection.md`
