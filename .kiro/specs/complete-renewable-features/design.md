# Design Document: Complete Renewable Energy Features

## Overview

This design completes the renewable energy feature set by implementing wind rose analysis, wake simulation, and report generation using the **exact same patterns** that work for terrain and layout. The primary goal is to finish incomplete features WITHOUT introducing regressions.

## Architecture

### Core Principle: Pattern Replication

We will replicate the successful patterns from terrain and layout:

1. **Python Lambda Functions** - Same structure as terrain/layout
2. **S3 Storage for Visualizations** - Same storage pattern
3. **Orchestrator Integration** - Same routing mechanism
4. **Frontend Components** - Already exist, just need backend data
5. **Error Handling** - Same graceful degradation

### System Components

```
User Query
    ↓
Orchestrator (handler.ts) - WORKING, NO CHANGES
    ↓
Intent Router - WORKING, NO CHANGES
    ↓
Tool Lambda (Python) - COMPLETE THESE
    ├── Wind Rose (simulation/handler.py)
    ├── Wake Simulation (simulation/handler.py)
    └── Report Generation (report/handler.py)
    ↓
S3 Storage - WORKING, NO CHANGES
    ↓
Frontend Components - EXIST, VALIDATE ONLY
    ├── WindRoseArtifact.tsx
    ├── SimulationChartArtifact.tsx
    └── ReportArtifact.tsx
```

## Components and Interfaces

### 1. Wind Rose Analysis

**Pattern Source:** Original demo matplotlib_generator.py `create_wind_rose()` method

**Implementation:**
- Location: `amplify/functions/renewableTools/simulation/handler.py`
- Action: `wind_rose` (already routed by orchestrator)
- Input: `{latitude, longitude, project_id}`
- Output: Wind rose visualization (PNG) using matplotlib polar plot + statistics

**CRITICAL: Use Original Demo Visualization**
- Use `MatplotlibChartGenerator.create_wind_rose()` from matplotlib_generator.py
- Polar plot with 16 directional bins (22.5° sectors)
- Speed bins: [0, 5, 10, 15, 20, 25, 50] m/s
- Color-coded speed ranges with legend
- Frequency displayed as percentage
- North at top, clockwise direction

**Key Pattern to Replicate:**
```python
# From original demo - EXACT PATTERN TO USE
def handler(event, context):
    params = event.get('parameters', {})
    project_id = params.get('project_id')
    latitude = params.get('latitude')
    longitude = params.get('longitude')
    
    # Use ORIGINAL matplotlib generator
    from matplotlib_generator import MatplotlibChartGenerator
    matplotlib_gen = MatplotlibChartGenerator()
    
    # Prepare wind data (get from wind resource API or use sample)
    wind_data = {
        'speeds': [...],  # Wind speeds in m/s
        'directions': [...]  # Wind directions in degrees
    }
    
    # Generate wind rose using ORIGINAL method
    wind_rose_bytes = matplotlib_gen.create_wind_rose(
        wind_data, 
        f"Wind Rose - {project_id}"
    )
    
    # Save to S3 as PNG
    s3_key = f"renewable/wind_rose/{project_id}/wind_rose.png"
    s3_client.put_object(
        Bucket=bucket, 
        Key=s3_key, 
        Body=wind_rose_bytes,
        ContentType='image/png'
    )
    
    # Return S3 URL
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'type': 'wind_rose',
            'data': {
                'projectId': project_id,
                'coordinates': {'lat': latitude, 'lng': longitude},
                'visualizations': {
                    'wind_rose': f"https://{bucket}.s3.amazonaws.com/{s3_key}"
                },
                'windStatistics': {
                    'averageSpeed': ...,
                    'maxSpeed': ...,
                    'predominantDirection': ...
                }
            }
        })
    }
```

**NO CHANGES TO:**
- Orchestrator routing (already routes `wind_rose` to simulation Lambda)
- Frontend component (WindRoseArtifact.tsx already exists)
- S3 permissions (already configured in backend.ts)

### 2. Wake Simulation

**Pattern Source:** Layout optimization (handler.py)

**Implementation:**
- Location: `amplify/functions/renewableTools/simulation/handler.py`
- Action: `wake_simulation` (default action)
- Input: `{project_id, layout (from context), wind_speed}`
- Output: Wake heat map + performance metrics

**Key Pattern to Replicate:**
```python
# From layout/handler.py - PROVEN PATTERN
def handler(event, context):
    params = event.get('parameters', {})
    layout = params.get('layout', {})  # From context
    
    # Validate layout exists
    if not layout or not layout.get('features'):
        return error_response('Missing layout data')
    
    # Generate wake analysis
    wake_data = calculate_wake_effects(layout, wind_speed)
    
    # Create visualization
    map_html = create_wake_heat_map(wake_data, layout)
    
    # Save to S3 (SAME PATTERN)
    s3_key = f"renewable/wake/{project_id}/wake_map.html"
    s3_client.put_object(...)
    
    return success_response_with_s3_url(...)
```

**NO CHANGES TO:**
- Orchestrator (already passes layout in context)
- Frontend component (SimulationChartArtifact.tsx exists)
- S3 storage (same bucket, same permissions)

### 3. Report Generation

**Pattern Source:** Terrain + Layout combined

**Implementation:**
- Location: `amplify/functions/renewableTools/report/handler.py`
- Input: `{project_id, terrain_results, layout_results, simulation_results}`
- Output: Comprehensive HTML report with all visualizations

**Key Pattern to Replicate:**
```python
# Combine patterns from terrain and layout
def handler(event, context):
    params = event.get('parameters', {})
    
    # Gather all results from context
    terrain = params.get('terrain_results', {})
    layout = params.get('layout_results', {})
    simulation = params.get('simulation_results', {})
    
    # Generate comprehensive report HTML
    report_html = generate_report(terrain, layout, simulation)
    
    # Save to S3 (SAME PATTERN)
    s3_key = f"renewable/report/{project_id}/report.html"
    s3_client.put_object(...)
    
    return success_response_with_s3_url(...)
```

**NO CHANGES TO:**
- Orchestrator (already configured for report tool)
- Frontend component (ReportArtifact.tsx exists)
- S3 storage (same pattern)

## Data Models

### Wind Rose Data Structure
```typescript
{
  type: 'wind_rose',
  data: {
    projectId: string,
    coordinates: { lat: number, lng: number },
    windStatistics: {
      averageSpeed: number,
      maxSpeed: number,
      predominantDirection: number
    },
    mapUrl: string,  // S3 URL - CRITICAL
    visualizations: {
      wind_rose: string  // S3 URL
    }
  }
}
```

### Wake Simulation Data Structure
```typescript
{
  type: 'wake_simulation',
  data: {
    projectId: string,
    performanceMetrics: {
      annualEnergyProduction: number,
      capacityFactor: number,
      wakeLosses: number
    },
    mapUrl: string,  // S3 URL - CRITICAL
    visualizations: {
      wake_heat_map: string,  // S3 URL
      performance_charts: string[]  // S3 URLs
    }
  }
}
```

### Report Data Structure
```typescript
{
  type: 'report_generation',
  data: {
    projectId: string,
    executiveSummary: string,
    recommendations: string[],
    reportUrl: string,  // S3 URL - CRITICAL
    visualizations: {
      complete_report: string  // S3 URL
    }
  }
}
```

## Error Handling

**Pattern Source:** Terrain error handling

**Replicate Exact Pattern:**
```python
try:
    # Main logic
    result = perform_analysis(...)
    return success_response(result)
    
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    return {
        'statusCode': 500,
        'body': json.dumps({
            'success': False,
            'error': f'Lambda execution error: {str(e)}',
            'errorCategory': 'INTERNAL_ERROR'
        })
    }
```

**NO CHANGES TO:**
- Orchestrator error handling (already robust)
- Frontend error boundaries (already exist)

## Testing Strategy

### Unit Testing (Per Tool)

**Test Pattern (from terrain):**
```bash
# Test wind rose
aws lambda invoke \
  --function-name <wind-rose-lambda> \
  --payload '{"parameters":{"latitude":35.0,"longitude":-101.0,"project_id":"test"}}' \
  response.json

# Verify:
# 1. statusCode: 200
# 2. success: true
# 3. mapUrl exists and is accessible
# 4. No errors in CloudWatch logs
```

**Repeat for:**
- Wake simulation (with layout data)
- Report generation (with all results)

### Integration Testing

**Test Pattern (from working terrain→layout flow):**
```bash
# 1. Run terrain
# 2. Run layout with terrain context
# 3. Run wake with layout context
# 4. Run report with all context
# 5. Verify each step succeeds
# 6. Verify context is passed correctly
```

### Regression Testing

**CRITICAL - Test BEFORE and AFTER:**
```bash
# Before any changes
./test-terrain.sh  # Must pass
./test-layout.sh   # Must pass

# After changes
./test-terrain.sh  # Must STILL pass
./test-layout.sh   # Must STILL pass
./test-wind-rose.sh  # Must pass
./test-wake.sh     # Must pass
./test-report.sh   # Must pass
```

### UI Validation

**Test Pattern:**
1. Open chat interface
2. Test terrain query → verify 151 features display
3. Test layout query → verify turbines display
4. Test wind rose query → verify chart displays
5. Test wake query → verify heat map displays
6. Test report query → verify report displays

**NO REGRESSIONS ALLOWED:**
- Terrain must show 151 features (not 60)
- Layout must show all turbines
- No "Visualization Unavailable" errors
- No blank maps
- No infinite loading states

## Deployment Strategy

### Phase 1: Validate Current State
```bash
# Ensure terrain and layout work
npm run test:terrain
npm run test:layout
# Both must pass before proceeding
```

### Phase 2: Complete Wind Rose
```bash
# Update simulation/handler.py for wind_rose action
# Deploy
npx ampx sandbox
# Test wind rose only
# Verify terrain and layout still work
```

### Phase 3: Complete Wake Simulation
```bash
# Update simulation/handler.py for wake analysis
# Deploy
npx ampx sandbox
# Test wake simulation
# Verify terrain, layout, wind rose still work
```

### Phase 4: Complete Report Generation
```bash
# Update report/handler.py
# Deploy
npx ampx sandbox
# Test report generation
# Verify all previous features still work
```

### Phase 5: End-to-End Validation
```bash
# Test complete workflow
# Test UI integration
# Run full regression suite
# Deploy to production only if ALL tests pass
```

## Critical Success Factors

### 1. Zero Regressions
- Terrain analysis must continue working exactly as before
- Layout optimization must continue working exactly as before
- 151 features must display (not 60)
- S3 URLs must work
- No new errors introduced

### 2. Pattern Consistency
- Use exact same S3 storage pattern
- Use exact same error handling pattern
- Use exact same response structure
- Use exact same Lambda configuration

### 3. Incremental Deployment
- Deploy one feature at a time
- Test after each deployment
- Verify no regressions after each deployment
- Rollback immediately if any regression detected

### 4. Validation Before Completion
- All unit tests pass
- All integration tests pass
- All regression tests pass
- UI displays all visualizations correctly
- User validates in actual environment

## What NOT to Change

**DO NOT MODIFY:**
1. Orchestrator routing logic (handler.ts) - WORKING
2. Intent detection (IntentRouter.ts) - WORKING
3. Parameter validation - WORKING
4. S3 permissions in backend.ts - WORKING
5. Frontend components (just validate they work) - EXIST
6. Terrain handler.py - WORKING
7. Layout handler.py - WORKING

**ONLY MODIFY:**
1. simulation/handler.py - Complete wind_rose and wake actions
2. report/handler.py - Enhance report generation
3. Add tests for new features
4. Validate UI displays new features

## Rollback Plan

If ANY regression is detected:

```bash
# Immediate rollback
git revert HEAD
npx ampx sandbox

# Verify terrain and layout work again
npm run test:terrain
npm run test:layout

# Fix issue in isolation
# Test thoroughly
# Redeploy
```

## Success Metrics

- ✅ Wind rose displays interactive chart
- ✅ Wake simulation shows heat map
- ✅ Report generation creates comprehensive report
- ✅ Terrain still shows 151 features
- ✅ Layout still shows all turbines
- ✅ No "Visualization Unavailable" errors
- ✅ All S3 URLs accessible
- ✅ Zero CloudWatch errors
- ✅ User validates all features work
