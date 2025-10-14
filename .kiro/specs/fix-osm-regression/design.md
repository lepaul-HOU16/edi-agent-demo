# Design Document

## Overview

This design addresses the regression where the renewable energy terrain analysis system has fallen back to synthetic data instead of using real OpenStreetMap integration. The system previously worked with 151 real terrain features but now shows only 3 synthetic features.

## Architecture

### Root Cause Analysis

The regression is likely caused by one or more of the following issues:

1. **Python Syntax Error**: Duplicate `except Exception` blocks in the terrain handler
2. **Import Failures**: Missing dependencies or import path issues for the OSM client
3. **Lambda Environment Issues**: Runtime environment problems preventing async HTTP requests
4. **API Connectivity**: Network connectivity issues with Overpass API endpoints
5. **Error Handling Logic**: Premature fallback to synthetic data due to error handling bugs

### Solution Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Lambda         │    │   OSM Overpass  │
│   Component     │───▶│   Terrain        │───▶│   API           │
│                 │    │   Handler        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   OSM Client     │
                       │   - Async HTTP   │
                       │   - Retry Logic  │
                       │   - Data Validation │
                       └──────────────────┘
```

## Components and Interfaces

### 1. Terrain Handler Lambda Function

**Purpose**: Main entry point for terrain analysis requests

**Key Fixes Needed**:
- Remove duplicate `except Exception` blocks (syntax error)
- Improve error logging to identify specific failure points
- Add dependency validation checks
- Implement progressive fallback strategy

**Interface**:
```python
def handler(event, context):
    # Input: latitude, longitude, radius_km
    # Output: GeoJSON with real terrain features
```

### 2. OSM Client Module

**Purpose**: Handle real-time queries to OpenStreetMap Overpass API

**Current State**: Implementation exists and appears correct
**Validation Needed**: 
- Verify async/await compatibility in Lambda environment
- Test network connectivity to Overpass API endpoints
- Validate response parsing and error handling

**Interface**:
```python
async def query_terrain_features(lat, lon, radius_km) -> Dict
def query_osm_terrain_sync(lat, lon, radius_km) -> Dict  # Sync wrapper
```

### 3. Data Processing Pipeline

**Purpose**: Transform OSM data into wind farm analysis format

**Components**:
- Feature classification (buildings, roads, water, etc.)
- Geometry validation and processing
- Wind impact assessment
- Setback distance calculations

### 4. Error Handling and Fallback System

**Purpose**: Provide graceful degradation when real data unavailable

**Design Principles**:
- Real data should be the primary path
- Fallback should be clearly labeled and logged
- Error messages should be specific and actionable
- Progressive fallback: real data → cached data → synthetic data

## Data Models

### Real OSM Feature Structure

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon|LineString|Point",
    "coordinates": [[lon, lat], ...]
  },
  "properties": {
    "feature_type": "building|highway|water|power_infrastructure",
    "osm_id": "12345",
    "osm_type": "way|relation",
    "tags": {"building": "residential", "name": "..."},
    "data_source": "openstreetmap_real",
    "reliability": "high",
    "wind_impact": "high_turbulence|moderate_turbulence|...",
    "setback_distance_m": 500,
    "exclusion_reason": "Noise and safety setback requirements"
  }
}
```

### Metadata Structure

```json
{
  "source": "openstreetmap",
  "query_location": {"lat": 40.7128, "lon": -74.0060},
  "query_radius_km": 5.0,
  "query_time": "2024-01-15T10:30:00Z",
  "feature_count": 151,
  "feature_statistics": {
    "building": 45,
    "highway": 12,
    "water": 3,
    "power_infrastructure": 2
  },
  "data_quality": {
    "completeness": "high",
    "accuracy": "community_verified",
    "freshness": "real_time"
  }
}
```

## Error Handling

### Error Classification and Response

1. **Syntax Errors**: Fix immediately (duplicate except blocks)
2. **Import Errors**: Validate dependencies and import paths
3. **Network Errors**: Implement retry logic with multiple endpoints
4. **API Rate Limiting**: Respect rate limits with exponential backoff
5. **Data Validation Errors**: Log and continue with available data
6. **Timeout Errors**: Increase timeout or implement progressive timeout

### Fallback Strategy

```python
try:
    # Primary: Real OSM data
    geojson = query_osm_terrain_sync(lat, lon, radius_km)
    if validate_osm_response(geojson)['is_valid']:
        return process_real_data(geojson)
except ImportError:
    # Dependency issue - log and fallback
    log_error("OSM client import failed")
except OSMAPIError as e:
    # API issue - log specific error
    log_error(f"OSM API error: {e}")
except Exception as e:
    # Unexpected error - log and fallback
    log_error(f"Unexpected error: {e}")

# Fallback to synthetic data with clear labeling
return create_fallback_terrain_data(lat, lon, radius_km, error_reason)
```

## Testing Strategy

### 1. Unit Testing

- Test OSM client with known coordinates
- Validate data parsing and transformation
- Test error handling scenarios
- Verify geometry validation logic

### 2. Integration Testing

- Test full Lambda function execution
- Validate network connectivity to Overpass API
- Test with various geographic locations
- Verify feature count and classification accuracy

### 3. Regression Testing

- Test with coordinates that previously returned 151 features
- Verify no synthetic data when real data is available
- Validate feature statistics and metadata
- Confirm professional analysis capabilities

### 4. Performance Testing

- Measure query response times
- Test with different radius sizes
- Validate timeout handling
- Test concurrent request handling

## Deployment Considerations

### Lambda Environment

- Verify Python runtime version compatibility
- Ensure all dependencies are properly packaged
- Validate network access to external APIs
- Check memory and timeout limits

### Dependencies

- Confirm `aiohttp` is available in Lambda environment
- Validate `asyncio` compatibility
- Check for any missing system libraries
- Verify import path resolution

### Monitoring and Logging

- Add comprehensive logging for debugging
- Monitor API response times and success rates
- Track fallback usage patterns
- Alert on high synthetic data usage

## Success Metrics

### Functional Metrics

- **Feature Count**: Should return 100+ features for typical locations (not 3)
- **Data Source**: Should show "openstreetmap_real" not "synthetic_fallback"
- **Feature Diversity**: Should include buildings, roads, water, power infrastructure
- **Classification Accuracy**: Features should have appropriate wind impact assessments

### Performance Metrics

- **Query Success Rate**: >95% successful real data retrieval
- **Response Time**: <30 seconds for terrain analysis
- **Fallback Rate**: <5% synthetic data usage
- **Error Rate**: <1% unhandled exceptions

### Quality Metrics

- **Data Completeness**: High completeness scores from validation
- **Accuracy**: Community-verified OSM data quality
- **Freshness**: Real-time data from OSM
- **Professional Standards**: Industry-appropriate setback calculations

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. Fix Python syntax error (duplicate except blocks)
2. Add comprehensive error logging
3. Test basic OSM client functionality
4. Validate Lambda environment setup

### Phase 2: Data Validation (Short-term)
1. Test with known coordinates that should return 151 features
2. Verify feature classification and processing
3. Validate metadata and data quality indicators
4. Confirm professional analysis capabilities

### Phase 3: Robustness (Medium-term)
1. Implement comprehensive error handling
2. Add performance monitoring and alerting
3. Optimize query performance and caching
4. Enhance fallback strategies

## Risk Mitigation

### Technical Risks

- **API Availability**: Use multiple Overpass API endpoints
- **Rate Limiting**: Implement respectful retry logic
- **Data Quality**: Validate and filter OSM responses
- **Performance**: Set appropriate timeouts and limits

### Operational Risks

- **Deployment Issues**: Test in staging environment first
- **Monitoring Gaps**: Implement comprehensive logging
- **User Impact**: Provide clear error messages and guidance
- **Regression Prevention**: Add automated testing for real data integration