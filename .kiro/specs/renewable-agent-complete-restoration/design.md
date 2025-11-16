# Design Document: Renewable Energy Agent Complete Restoration

## Overview

This design preserves the original **Strands Agents + AgentCore architecture** from the workshop with performance optimizations to address timeout issues. The system will provide intelligent AI reasoning, multi-agent workflows, and comprehensive visualizations matching the original demo.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js/React)                      │
│                                                                   │
│  • Chat interface with streaming support                         │
│  • Project dashboard with direct GraphQL mutations               │
│  • Artifact viewers (maps, charts, PDFs)                         │
│  • Progress polling for async operations                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ GraphQL API / Lambda Invoke
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Orchestrator Lambda (TypeScript)                         │
│         amplify/functions/renewableOrchestrator/                 │
│                                                                   │
│  Components:                                                      │
│  • Intent detection & routing                                    │
│  • Parameter validation & enrichment                             │
│  • Async invocation with request tracking                        │
│  • Project lifecycle management                                  │
│  • Session context management                                    │
│  • Progress polling endpoint                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Async Lambda Invoke
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│      Strands Agents Lambda (Python Docker)                       │
│      amplify/functions/renewableAgents/                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AgentCore Runtime (bedrock-agentcore)                     │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Strands Agent Framework                             │ │ │
│  │  │                                                       │ │ │
│  │  │  Agents:                                             │ │ │
│  │  │  • terrain_agent.py                                  │ │ │
│  │  │  • layout_agent.py                                   │ │ │
│  │  │  • simulation_agent.py                               │ │ │
│  │  │  • report_agent.py                                   │ │ │
│  │  │  • multi_agent.py (LangGraph orchestration)         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  MCP Client ──────► MCP Server (wind_farm_mcp_server.py)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Storage:                                                         │
│  • DynamoDB: Progress tracking, session context                  │
│  • S3: All artifacts (GeoJSON, HTML, PNG, PDF, JSON)            │
└─────────────────────────────────────────────────────────────────┘
```


### Component Responsibilities

#### Frontend Components

**Chat Interface** (`src/components/ChatMessage.tsx`)
- Display user messages and AI responses
- Show streaming progress updates during async operations
- Render artifacts inline (maps, charts, PDFs)
- Poll for progress updates every 5 seconds
- Handle timeout and error states

**Project Dashboard** (`src/components/renewable/ProjectDashboard.tsx`)
- Display all renewable energy projects in table format
- Direct GraphQL mutations for operations (no conversation messages):
  - `deleteRenewableProject(projectId: ID!)`
  - `renameRenewableProject(projectId: ID!, newName: String!)`
  - `exportRenewableProject(projectId: ID!)`
- Real-time updates via GraphQL subscriptions
- Inline editing for project names
- Modal for project details

**Artifact Viewers**
- `TerrainMapViewer.tsx`: Display boundaries.html with Leaflet
- `LayoutMapViewer.tsx`: Display layout_map_1.png with zoom/pan
- `SimulationChartsViewer.tsx`: Display all 9 simulation charts in grid
- `ReportViewer.tsx`: Display PDF with download option

#### Orchestrator Lambda

**Intent Router** (`IntentRouter.ts`)
- Classify user queries into intents: terrain_analysis, layout_optimization, wake_simulation, report_generation, complete_workflow
- Extract parameters: latitude, longitude, radius_km, turbine_model, target_capacity_mw
- Confidence scoring for ambiguous queries

**Async Invocation Handler** (`strandsAgentHandler.ts`)
- Invoke Strands Agents Lambda with `InvocationType: 'Event'`
- Generate unique request ID
- Write initial progress to DynamoDB
- Return immediately with polling instructions
- Handle timeout and throttling errors

**Progress Polling** (`progressHandler.ts`)
- Query DynamoDB for request status
- Return current progress steps and artifacts
- Support status: 'in_progress', 'complete', 'error'

**Project Lifecycle Manager** (`projectLifecycleManager.ts`)
- Create, read, update, delete projects
- Generate human-readable project names
- Check for duplicate projects
- Manage S3 file operations

#### Strands Agents Lambda

**Agent Initialization** (`lambda_handler.py`)
- Load AgentCore runtime: `BedrockAgentCoreApp()`
- Initialize Strands Agents with BedrockModel
- Connect to MCP server via stdio transport
- Implement lazy loading for heavy dependencies
- Pool Bedrock client connections

**Terrain Agent** (`terrain_agent.py`)
- Fetch OSM data via Overpass API
- Calculate buffer zones for all features
- Generate GeoJSON with features + buffers
- Create Folium map with buffer visualization
- Generate static PNG with matplotlib
- Save artifacts to S3

**Layout Agent** (`layout_agent.py`)
- Load terrain boundaries from S3
- Fetch turbine specs from turbine-models
- Execute layout algorithm (grid/offset/spiral/greedy)
- Check turbine conflicts with buffer zones
- Generate GeoJSON with terrain + turbines
- Create maps showing terrain + turbines + spacing
- Save artifacts to S3

**Simulation Agent** (`simulation_agent.py`)
- Load layout from S3
- Fetch wind data from NREL API
- Run PyWake simulation with Bastankhah-Gaussian
- Calculate AEP, wake losses, capacity factor
- Generate 9 charts with matplotlib/seaborn
- Save simulation results and charts to S3

**Report Agent** (`report_agent.py`)
- Load all project data from S3
- Generate 6 additional charts (spider, heatmap, financial, etc.)
- Assemble markdown content with all sections
- Embed all images (terrain, layout, 9 simulation, 6 report charts)
- Generate PDF with WeasyPrint
- Save report to S3

**Multi-Agent Orchestrator** (`multi_agent.py`)
- Create LangGraph StateGraph
- Define workflow: terrain → layout → simulation → report
- Maintain shared state across agents
- Update progress in DynamoDB after each step
- Handle errors and rollback

**MCP Server** (`MCP_Server/wind_farm_mcp_server.py`)
- Implement MCP protocol with stdio transport
- Provide tools:
  - `get_wind_data(lat, lon, year)`: Fetch NREL wind data
  - `get_turbine_specs(model)`: Fetch turbine specifications
  - `calculate_wake_losses(layout, wind)`: PyWake calculations
  - `validate_layout(layout, boundaries)`: Check conflicts
  - `generate_wind_rose(wind_data)`: Create wind rose chart


## Data Models

### DynamoDB Tables

**AgentProgress Table**
```typescript
{
  requestId: string (PK)
  status: 'in_progress' | 'complete' | 'error'
  steps: Array<{
    step: string
    message: string
    elapsed: number
    timestamp: number
  }>
  artifacts: Array<{
    type: string
    url: string
    metadata: object
  }>
  message: string
  createdAt: number
  updatedAt: number
  expiresAt: number (TTL: 24 hours)
}
```

**SessionContext Table**
```typescript
{
  sessionId: string (PK)
  active_project: string | null
  project_history: string[]
  last_intent: string
  last_parameters: object
  createdAt: number
  updatedAt: number
  expiresAt: number (TTL: 24 hours)
}
```

### S3 Storage Structure

```
renewable/
├── terrain/
│   └── {project_id}/
│       ├── boundaries.geojson
│       ├── boundaries.html
│       └── boundaries.png
├── layout/
│   └── {project_id}/
│       ├── turbine_layout.geojson
│       ├── layout_map_1.png
│       └── layout_final.png
├── simulation/
│   └── {project_id}/
│       ├── simulation_summary.json
│       ├── wake_map.png
│       ├── aep_distribution.png
│       ├── aep_per_turbine.png
│       ├── wake_losses.png
│       ├── wind_rose.png
│       ├── wind_speed_distribution.png
│       ├── aep_vs_windspeed.png
│       └── power_curve.png
└── report/
    └── {project_id}/
        ├── wind_farm_report.pdf
        ├── spider_chart.png
        ├── performance_heatmap.png
        ├── financial_projections.png
        ├── economic_impact.png
        ├── risk_matrix.png
        └── timeline_gantt.png
```

### GeoJSON Schemas

**Terrain Boundaries (boundaries.geojson)**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], ...]]
      },
      "properties": {
        "feature_type": "building" | "water" | "highway" | "railway" | "power_infrastructure" | "forest" | "protected_area",
        "name": "string",
        "osm_id": "string",
        "tags": {},
        "wind_impact": "high_turbulence" | "moderate_turbulence" | "low_turbulence" | "smooth_flow",
        "required_setback_m": number,
        "buffer_width_m": number,
        "data_source": "osm" | "generated",
        "reliability": "high" | "medium" | "low",
        "is_buffer": boolean
      }
    }
  ],
  "metadata": {
    "project_id": "string",
    "center": {"lat": number, "lon": number},
    "radius_km": number,
    "feature_count": number,
    "feature_statistics": {},
    "generated_at": "ISO8601"
  }
}
```

**Turbine Layout (turbine_layout.geojson)**
```json
{
  "type": "FeatureCollection",
  "features": [
    // All terrain features from boundaries.geojson
    {
      "type": "Feature",
      "geometry": {"type": "Polygon", "coordinates": [...]},
      "properties": {
        "feature_type": "building",
        "buffer_width_m": 500,
        "is_buffer": true
      }
    },
    // Turbine points
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [lon, lat]
      },
      "properties": {
        "type": "turbine",
        "turbine_id": "T001",
        "turbine_model": "IEA_Reference_3.4MW_130",
        "capacity_MW": 3.4,
        "hub_height_m": 110,
        "rotor_diameter_m": 130,
        "marker-color": "#0000ff",
        "marker-symbol": "wind-turbine"
      }
    }
  ],
  "metadata": {
    "project_id": "string",
    "turbine_count": number,
    "total_capacity_mw": number,
    "algorithm": "grid" | "offset_grid" | "spiral" | "greedy",
    "spacing_d": number,
    "skipped_turbines": number,
    "buildable_area_km2": number,
    "exclusion_area_km2": number
  }
}
```

**Simulation Summary (simulation_summary.json)**
```json
{
  "project_id": "string",
  "turbine_count": number,
  "total_capacity_mw": number,
  "gross_aep_gwh": number,
  "net_aep_gwh": number,
  "wake_losses_percent": number,
  "capacity_factor": number,
  "turbine_aep": [
    {"turbine_id": "T001", "aep_gwh": number, "wake_loss_percent": number}
  ],
  "wind_conditions": {
    "mean_wind_speed_ms": number,
    "prevailing_direction_deg": number,
    "weibull_k": number,
    "weibull_a": number
  },
  "simulation_parameters": {
    "wake_model": "Bastankhah-Gaussian",
    "turbulence_intensity": number,
    "air_density_kgm3": number
  },
  "generated_at": "ISO8601"
}
```


## Key Technical Decisions

### 1. Async Invocation Pattern

**Problem**: Strands Agents take 75-150 seconds to execute, but orchestrator expects 60-second responses.

**Solution**: Async invocation with progress polling

```typescript
// Orchestrator invokes agent asynchronously
const command = new InvokeCommand({
  FunctionName: STRANDS_AGENT_FUNCTION_NAME,
  InvocationType: 'Event', // ← Async
  Payload: JSON.stringify({...})
});

await lambda.send(command);

// Return immediately with request ID
return {
  success: true,
  message: 'Analysis started...',
  metadata: {
    requestId: chatSessionId,
    polling: {
      enabled: true,
      interval: 5000,
      maxAttempts: 36
    }
  }
};
```

**Frontend polls for progress:**
```typescript
const pollProgress = async (requestId: string) => {
  const response = await client.graphql({
    query: queries.getRenewableAgentProgress,
    variables: { requestId }
  });
  
  if (response.data.status === 'complete') {
    // Display artifacts
  } else if (response.data.status === 'in_progress') {
    // Continue polling
    setTimeout(() => pollProgress(requestId), 5000);
  }
};
```

### 2. AgentCore Integration

**Original Workshop Pattern:**
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
async def agent_invocation(payload):
    """AgentCore streaming entrypoint"""
    user_message = payload.get("prompt", "")
    
    stream = agent.stream_async(user_message)
    async for event in stream:
        yield event
```

**Benefits:**
- Streaming support for real-time progress
- Built-in error handling and retry logic
- AWS-managed runtime with monitoring
- Compatible with Strands Agents framework

### 3. Buffer Zone Calculation

**Approach**: Generate buffer polygons using Shapely

```python
from shapely.geometry import shape, Point, LineString, Polygon
from shapely.ops import unary_union

def calculate_buffer_zones(features, setback_distances):
    """Generate buffer polygons for exclusion zones"""
    buffer_features = []
    
    for feature in features:
        geom = shape(feature['geometry'])
        feature_type = feature['properties']['feature_type']
        buffer_m = setback_distances.get(feature_type, 100)
        
        # Convert meters to degrees (approximate)
        buffer_deg = buffer_m / 111320
        
        # Create buffer polygon
        buffer_geom = geom.buffer(buffer_deg)
        
        buffer_features.append({
            'type': 'Feature',
            'geometry': buffer_geom.__geo_interface__,
            'properties': {
                **feature['properties'],
                'is_buffer': True,
                'buffer_width_m': buffer_m
            }
        })
    
    return buffer_features
```

**Visualization**: Semi-transparent overlays with dashed borders

```python
# Folium styling for buffer zones
folium.GeoJson(
    buffer_geojson,
    style_function=lambda x: {
        'fillColor': '#ff0000',
        'color': '#cc0000',
        'weight': 2,
        'fillOpacity': 0.2,
        'opacity': 0.6,
        'dashArray': '5, 5'
    }
).add_to(map)
```

### 4. Terrain + Turbine Integration

**Key Requirement**: Layout maps must show EXACT SAME terrain as terrain maps, plus turbines.

**Implementation**:
```python
def create_layout_map(project_id):
    """Create layout map with terrain + turbines"""
    
    # 1. Load terrain boundaries (with all features and buffers)
    boundaries = load_from_s3(f'renewable/terrain/{project_id}/boundaries.geojson')
    
    # 2. Create base map with terrain features
    m = folium.Map(location=[center_lat, center_lon], zoom_start=12)
    
    # 3. Add ALL terrain features (same as terrain map)
    for feature in boundaries['features']:
        if feature['properties'].get('is_buffer'):
            # Buffer zone styling
            folium.GeoJson(feature, style_function=buffer_style).add_to(m)
        else:
            # Base feature styling
            folium.GeoJson(feature, style_function=feature_style).add_to(m)
    
    # 4. Add turbines on top
    for turbine in turbines:
        folium.Marker(
            location=[turbine['lat'], turbine['lon']],
            icon=folium.Icon(color='blue', icon='wind-turbine'),
            popup=f"Turbine {turbine['id']}"
        ).add_to(m)
    
    # 5. Save map
    m.save(f'layout_map_1.html')
```

### 5. Real Data Only - No Mocks

**Enforcement Strategy**:

```python
def fetch_osm_data(lat, lon, radius_km):
    """Fetch real OSM data - NO FALLBACK TO MOCKS"""
    try:
        response = requests.post(OVERPASS_API_URL, data=query, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        # DO NOT return synthetic data
        raise DataFetchError(
            f"Failed to fetch OSM data: {e}. "
            "Please check your internet connection and try again."
        )

def fetch_nrel_wind_data(lat, lon, year):
    """Fetch real NREL wind data - NO FALLBACK TO MOCKS"""
    try:
        response = requests.get(
            NREL_API_URL,
            params={'lat': lat, 'lon': lon, 'year': year, 'api_key': API_KEY},
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        # DO NOT return synthetic data
        raise DataFetchError(
            f"Failed to fetch NREL wind data: {e}. "
            "Please verify your NREL API key and try again."
        )
```

**Testing with Real Data**:
```python
# Integration tests use real APIs
@pytest.mark.integration
def test_terrain_analysis_real_data():
    """Test with real OSM API"""
    result = terrain_agent.analyze(lat=35.0, lon=-101.0, radius_km=5)
    
    assert result['features'] is not None
    assert len(result['features']) > 0
    assert all(f['properties']['data_source'] == 'osm' for f in result['features'])
    # NO synthetic data allowed

# Unit tests use clearly labeled mocks
@pytest.mark.unit
@patch('terrain_agent.fetch_osm_data')
def test_terrain_processing(mock_fetch):
    """Unit test with CLEARLY LABELED mock data"""
    mock_fetch.return_value = {
        'elements': [
            {'type': 'way', 'tags': {'building': 'yes'}, 'geometry': [...]}
        ],
        '_test_data': True  # ← Clearly labeled as test data
    }
    
    result = terrain_agent.process_osm_data(mock_fetch.return_value)
    assert result is not None
```


## Performance Optimizations

### 1. Docker Image Optimization

**Multi-stage build to reduce image size from 2GB to <1GB:**

```dockerfile
# Stage 1: Builder
FROM python:3.12-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc g++ gfortran \
    libgeos-dev libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/opt/python -r requirements.txt

# Stage 2: Runtime
FROM public.ecr.aws/lambda/python:3.12

# Copy only runtime dependencies
COPY --from=builder /opt/python ${LAMBDA_TASK_ROOT}

# Install minimal runtime libraries
RUN yum install -y geos proj && yum clean all

# Copy application code
COPY *.py ${LAMBDA_TASK_ROOT}/
COPY tools/ ${LAMBDA_TASK_ROOT}/tools/
COPY MCP_Server/ ${LAMBDA_TASK_ROOT}/MCP_Server/

CMD ["lambda_handler.handler"]
```

**Expected Results:**
- Image size: 2GB → 800MB (60% reduction)
- Cold start: 30s → 15s (50% reduction)

### 2. Lazy Loading

**Load heavy dependencies only when needed:**

```python
# lazy_imports.py
_pywake = None
_folium = None
_matplotlib = None
_geopandas = None

def get_pywake():
    """Lazy load PyWake (saves ~5s on cold start)"""
    global _pywake
    if _pywake is None:
        from py_wake import WindFarmModel
        from py_wake.deficit_models import BastankhahGaussian
        _pywake = (WindFarmModel, BastankhahGaussian)
    return _pywake

def get_folium():
    """Lazy load Folium (saves ~2s on cold start)"""
    global _folium
    if _folium is None:
        import folium
        _folium = folium
    return _folium

def get_matplotlib():
    """Lazy load matplotlib (saves ~3s on cold start)"""
    global _matplotlib
    if _matplotlib is None:
        import matplotlib
        matplotlib.use('Agg')  # Non-GUI backend
        import matplotlib.pyplot as plt
        _matplotlib = plt
    return _matplotlib

def get_geopandas():
    """Lazy load geopandas (saves ~2s on cold start)"""
    global _geopandas
    if _geopandas is None:
        import geopandas as gpd
        _geopandas = gpd
    return _geopandas
```

**Usage in agents:**
```python
def run_wake_simulation(layout, wind_data):
    """Only load PyWake when actually running simulation"""
    WindFarmModel, BastankhahGaussian = get_pywake()
    
    # Now use PyWake
    wf_model = WindFarmModel(...)
```

**Expected Results:**
- Cold start without simulation: 15s → 10s (33% reduction)
- Only pay import cost when feature is used

### 3. Connection Pooling

**Reuse Bedrock client across warm invocations:**

```python
_bedrock_client = None
_bedrock_connection_time = 0.0

def get_bedrock_client():
    """Singleton pattern for Bedrock client"""
    global _bedrock_client, _bedrock_connection_time
    
    if _bedrock_client is None:
        connection_start = time.time()
        logger.info("Creating new Bedrock client")
        
        _bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=os.environ.get('AWS_REGION', 'us-west-2'),
            config=boto3.session.Config(
                read_timeout=300,
                connect_timeout=60,
                retries={'max_attempts': 5, 'total_max_attempts': 10}
            )
        )
        
        _bedrock_connection_time = time.time() - connection_start
        logger.info(f"Bedrock client created in {_bedrock_connection_time:.2f}s")
    else:
        logger.info("Reusing existing Bedrock client")
    
    return _bedrock_client
```

**Expected Results:**
- First invocation: 2-5s to create client
- Warm invocations: 0s (reuse existing)
- Saves 2-5s per warm invocation

### 4. Caching Strategy

**Cache expensive API calls:**

```python
import functools
from datetime import datetime, timedelta

@functools.lru_cache(maxsize=100)
def fetch_turbine_specs(turbine_model: str):
    """Cache turbine specs (rarely change)"""
    from turbine_models import get_turbine
    return get_turbine(turbine_model)

# Cache with TTL for wind data
_wind_data_cache = {}

def fetch_nrel_wind_data(lat: float, lon: float, year: int):
    """Cache wind data for 1 hour"""
    cache_key = f"{lat}_{lon}_{year}"
    
    if cache_key in _wind_data_cache:
        cached_data, cached_time = _wind_data_cache[cache_key]
        if datetime.now() - cached_time < timedelta(hours=1):
            logger.info(f"Using cached wind data for {cache_key}")
            return cached_data
    
    # Fetch fresh data
    data = _fetch_nrel_wind_data_impl(lat, lon, year)
    _wind_data_cache[cache_key] = (data, datetime.now())
    
    return data
```

**Expected Results:**
- Turbine specs: 1-2s → 0s (cached)
- Wind data: 10-30s → 0s (cached for 1 hour)
- Significant speedup for repeated queries

### 5. Parallel Processing

**Generate charts in parallel:**

```python
from concurrent.futures import ThreadPoolExecutor
import matplotlib.pyplot as plt

def generate_all_simulation_charts(simulation_data, project_id):
    """Generate 9 charts in parallel"""
    
    chart_generators = [
        ('wake_map.png', lambda: generate_wake_map(simulation_data)),
        ('aep_distribution.png', lambda: generate_aep_distribution(simulation_data)),
        ('aep_per_turbine.png', lambda: generate_aep_per_turbine(simulation_data)),
        ('wake_losses.png', lambda: generate_wake_losses(simulation_data)),
        ('wind_rose.png', lambda: generate_wind_rose(simulation_data)),
        ('wind_speed_distribution.png', lambda: generate_wind_speed_dist(simulation_data)),
        ('aep_vs_windspeed.png', lambda: generate_aep_vs_windspeed(simulation_data)),
        ('power_curve.png', lambda: generate_power_curve(simulation_data)),
    ]
    
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(generator): filename 
            for filename, generator in chart_generators
        }
        
        results = {}
        for future in futures:
            filename = futures[future]
            try:
                fig = future.result()
                # Save to S3
                save_chart_to_s3(fig, project_id, filename)
                results[filename] = 'success'
            except Exception as e:
                logger.error(f"Failed to generate {filename}: {e}")
                results[filename] = 'error'
    
    return results
```

**Expected Results:**
- Sequential: 9 charts × 5s = 45s
- Parallel (4 workers): ~15s (67% reduction)


## Error Handling Strategy

### 1. API Failure Handling

**No fallback to mock data - clear error messages:**

```python
class DataFetchError(Exception):
    """Raised when real data cannot be fetched"""
    pass

def fetch_osm_data_with_retry(lat, lon, radius_km, max_retries=3):
    """Fetch OSM data with exponential backoff"""
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                OVERPASS_API_URL,
                data=build_overpass_query(lat, lon, radius_km),
                timeout=30
            )
            response.raise_for_status()
            return response.json()
            
        except requests.Timeout:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"OSM API timeout, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise DataFetchError(
                    "OpenStreetMap API is not responding. "
                    "Please try again in a few minutes. "
                    "If the problem persists, the OSM Overpass API may be experiencing issues."
                )
                
        except requests.HTTPError as e:
            if e.response.status_code == 429:  # Rate limit
                raise DataFetchError(
                    "OpenStreetMap API rate limit exceeded. "
                    "Please wait a few minutes before trying again."
                )
            elif e.response.status_code >= 500:  # Server error
                raise DataFetchError(
                    f"OpenStreetMap API server error ({e.response.status_code}). "
                    "The service may be temporarily unavailable. Please try again later."
                )
            else:
                raise DataFetchError(
                    f"Failed to fetch terrain data from OpenStreetMap: {e}"
                )
                
        except Exception as e:
            raise DataFetchError(
                f"Unexpected error fetching terrain data: {e}. "
                "Please check your internet connection and try again."
            )
```

### 2. Agent Execution Errors

**Structured error responses with remediation steps:**

```python
def handle_agent_error(error: Exception, agent_type: str, context: dict):
    """Convert exceptions to user-friendly error messages"""
    
    error_responses = {
        DataFetchError: {
            'category': 'DATA_FETCH_ERROR',
            'message': str(error),
            'remediation': [
                'Check your internet connection',
                'Verify API keys are configured correctly',
                'Try again in a few minutes',
                'Contact support if the issue persists'
            ]
        },
        ValidationError: {
            'category': 'VALIDATION_ERROR',
            'message': f'Invalid parameters: {error}',
            'remediation': [
                'Check that coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)',
                'Ensure radius is between 1 and 50 km',
                'Verify turbine model name is correct',
                'Review the error message for specific parameter issues'
            ]
        },
        TimeoutError: {
            'category': 'TIMEOUT_ERROR',
            'message': f'{agent_type} agent execution timed out',
            'remediation': [
                'Try reducing the analysis radius',
                'Simplify the query',
                'Try again - the system may be experiencing high load',
                'Contact support if timeouts persist'
            ]
        }
    }
    
    error_type = type(error)
    error_info = error_responses.get(error_type, {
        'category': 'UNKNOWN_ERROR',
        'message': f'Unexpected error in {agent_type} agent: {error}',
        'remediation': [
            'Try your request again',
            'Simplify your query',
            'Contact support with the error details'
        ]
    })
    
    return {
        'success': False,
        'error': error_info['message'],
        'errorCategory': error_info['category'],
        'remediation': error_info['remediation'],
        'context': {
            'agent': agent_type,
            'timestamp': datetime.now().isoformat(),
            **context
        }
    }
```

### 3. Progress Tracking Errors

**Update DynamoDB with error status:**

```python
def write_error_to_dynamodb(request_id: str, error: Exception, context: dict):
    """Write error status to DynamoDB for polling"""
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['AGENT_PROGRESS_TABLE'])
    
    error_info = handle_agent_error(error, context.get('agent_type', 'unknown'), context)
    
    table.put_item(
        Item={
            'requestId': request_id,
            'status': 'error',
            'error': error_info['error'],
            'errorCategory': error_info['errorCategory'],
            'remediation': error_info['remediation'],
            'context': error_info['context'],
            'updatedAt': int(time.time() * 1000),
            'expiresAt': int(time.time()) + (24 * 60 * 60)
        }
    )
```

## Testing Strategy

### 1. Unit Tests

**Test individual functions with mocks (clearly labeled):**

```python
@pytest.mark.unit
@patch('terrain_agent.fetch_osm_data')
def test_buffer_zone_calculation(mock_fetch):
    """Test buffer zone generation with mock OSM data"""
    
    # Clearly labeled test data
    mock_fetch.return_value = {
        'elements': [
            {
                'type': 'way',
                'id': 123,
                'tags': {'building': 'yes'},
                'geometry': [
                    {'lat': 35.0, 'lon': -101.0},
                    {'lat': 35.001, 'lon': -101.0},
                    {'lat': 35.001, 'lon': -101.001},
                    {'lat': 35.0, 'lon': -101.001},
                    {'lat': 35.0, 'lon': -101.0}
                ]
            }
        ],
        '_test_data': True  # ← Clearly labeled
    }
    
    result = calculate_buffer_zones(mock_fetch.return_value, {'building': 500})
    
    assert len(result) == 1
    assert result[0]['properties']['is_buffer'] is True
    assert result[0]['properties']['buffer_width_m'] == 500
```

### 2. Integration Tests

**Test with real APIs:**

```python
@pytest.mark.integration
@pytest.mark.slow
def test_terrain_analysis_end_to_end():
    """Test complete terrain analysis with real OSM API"""
    
    # Use real coordinates
    result = terrain_agent.analyze(
        latitude=35.067482,
        longitude=-101.395466,
        radius_km=5,
        project_id='test_project_123'
    )
    
    # Verify real data
    assert result['success'] is True
    assert len(result['features']) > 0
    assert all(f['properties']['data_source'] == 'osm' for f in result['features'])
    
    # Verify artifacts created
    assert result['artifacts']['boundaries.geojson'] is not None
    assert result['artifacts']['boundaries.html'] is not None
    assert result['artifacts']['boundaries.png'] is not None
    
    # Verify buffer zones
    buffer_features = [f for f in result['features'] if f['properties'].get('is_buffer')]
    assert len(buffer_features) > 0
```

### 3. Performance Tests

**Verify timeout requirements:**

```python
@pytest.mark.performance
def test_terrain_analysis_performance():
    """Verify terrain analysis completes within 45 seconds"""
    
    start_time = time.time()
    
    result = terrain_agent.analyze(
        latitude=35.067482,
        longitude=-101.395466,
        radius_km=5,
        project_id='perf_test_123'
    )
    
    execution_time = time.time() - start_time
    
    assert result['success'] is True
    assert execution_time < 45, f"Terrain analysis took {execution_time}s (limit: 45s)"
```

### 4. End-to-End Tests

**Test complete workflow:**

```python
@pytest.mark.e2e
@pytest.mark.slow
def test_complete_wind_farm_workflow():
    """Test terrain → layout → simulation → report"""
    
    project_id = f'e2e_test_{int(time.time())}'
    
    # 1. Terrain analysis
    terrain_result = terrain_agent.analyze(
        latitude=35.067482,
        longitude=-101.395466,
        radius_km=5,
        project_id=project_id
    )
    assert terrain_result['success'] is True
    
    # 2. Layout optimization
    layout_result = layout_agent.optimize(
        project_id=project_id,
        turbine_model='IEA_Reference_3.4MW_130',
        target_capacity_mw=30,
        algorithm='offset_grid'
    )
    assert layout_result['success'] is True
    assert layout_result['turbine_count'] > 0
    
    # 3. Wake simulation
    simulation_result = simulation_agent.simulate(
        project_id=project_id
    )
    assert simulation_result['success'] is True
    assert simulation_result['net_aep_gwh'] > 0
    assert len(simulation_result['charts']) == 9
    
    # 4. Report generation
    report_result = report_agent.generate(
        project_id=project_id
    )
    assert report_result['success'] is True
    assert report_result['pdf_url'] is not None
```

## Deployment Strategy

### Phase 1: Infrastructure Setup (Week 1)

1. Enable Strands Agents (remove hardcoded `return false`)
2. Add AgentCore dependencies to requirements.txt
3. Implement async invocation pattern in orchestrator
4. Create AgentProgress DynamoDB table
5. Deploy MCP server within renewableAgents Lambda
6. Update frontend with progress polling

### Phase 2: Performance Optimization (Week 2)

1. Implement Docker multi-stage build
2. Add lazy loading for heavy dependencies
3. Implement connection pooling
4. Add caching for API calls
5. Implement parallel chart generation
6. Performance testing and tuning

### Phase 3: Feature Completion (Week 3)

1. Restore all 4 layout algorithms
2. Implement buffer zone calculation and visualization
3. Integrate PyWake for wake simulation
4. Generate all 9 simulation charts
5. Implement report generation with WeasyPrint
6. Add all 6 report charts
7. Implement multi-agent orchestration with LangGraph

### Phase 4: Testing & Refinement (Week 4)

1. Unit tests for all components
2. Integration tests with real APIs
3. Performance tests for timeout compliance
4. End-to-end workflow tests
5. Error handling validation
6. User acceptance testing
7. Documentation and examples

## Success Metrics

**Performance Targets:**
- Cold start: < 20 seconds
- Terrain analysis: < 45 seconds
- Layout optimization: < 60 seconds
- Wake simulation: < 90 seconds
- Report generation: < 45 seconds
- Complete workflow: < 4 minutes

**Quality Targets:**
- 100% real data (no mocks in production)
- All 17 artifacts generated per workflow
- Buffer zones visible on all maps
- Layout maps = terrain maps + turbines
- Zero timeout errors
- < 5% API failure rate

**User Experience Targets:**
- Progress updates every 5 seconds
- Clear error messages with remediation steps
- Dashboard operations without conversation clutter
- Artifacts viewable inline in chat
- PDF reports downloadable

