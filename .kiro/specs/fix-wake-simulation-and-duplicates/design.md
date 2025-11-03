# Design Document

## Overview

This design addresses two issues:
1. **Wake Simulation Routing**: Ensure wake simulation requests are properly routed and rendered
2. **Title Deduplication**: Remove duplicate titles from wake simulation responses

## Architecture

### Current Flow (Broken)

```
User Query: "run wake simulation for project X"
    ↓
Orchestrator: Detects wake_simulation intent
    ↓
Simulation Lambda: Generates wake data (NO title field)
    ↓
Orchestrator: Adds title in formatArtifacts
    ↓
Frontend ChatMessage: Maps wake_simulation → SimulationChartArtifact ❌ WRONG
    ↓
User sees: Wrong component or error
```

### Fixed Flow

```
User Query: "run wake simulation for project X"
    ↓
Orchestrator: Detects wake_simulation intent
    ↓
Simulation Lambda: Generates wake data (NO title field)
    ↓
Orchestrator: Adds title ONCE in formatArtifacts
    ↓
Frontend ChatMessage: Maps wake_simulation → WakeAnalysisArtifact ✅ CORRECT
    ↓
User sees: Proper wake analysis with metrics and visualizations
```

## Components and Interfaces

### 1. Frontend Component Mapping Fix

**File**: `src/components/ChatMessage.tsx`

**Current Code** (lines 575-595):
```typescript
// Maps wake_simulation to SimulationChartArtifact (WRONG)
if (parsedArtifact && typeof parsedArtifact === 'object' && 
    (parsedArtifact.messageContentType === 'wake_simulation' ||
     parsedArtifact.data?.messageContentType === 'wake_simulation' ||
     parsedArtifact.type === 'wake_simulation')) {
    const artifactData = parsedArtifact.data || parsedArtifact;
    artifactData.messageContentType = 'wind_farm_simulation';
    return <AiMessageComponent 
        message={message} 
        theme={theme} 
        enhancedComponent={<SimulationChartArtifact 
            data={artifactData} 
            onFollowUpAction={onSendMessage}
        />}
    />;
}
```

**Required Change**:
```typescript
// Map wake_simulation to WakeAnalysisArtifact (CORRECT)
if (parsedArtifact && typeof parsedArtifact === 'object' && 
    (parsedArtifact.messageContentType === 'wake_simulation' ||
     parsedArtifact.data?.messageContentType === 'wake_simulation' ||
     parsedArtifact.type === 'wake_simulation')) {
    console.log('🌊 Rendering WakeAnalysisArtifact for wake simulation');
    const artifactData = parsedArtifact.data || parsedArtifact;
    return <AiMessageComponent 
        message={message} 
        theme={theme} 
        enhancedComponent={<WakeAnalysisArtifact 
            data={artifactData} 
            onFollowUpAction={onSendMessage}
        />}
    />;
}
```

**Import Required**:
```typescript
import WakeAnalysisArtifact from './renewable/WakeAnalysisArtifact';
```

### 2. Title Deduplication in Orchestrator

**File**: `amplify/functions/renewableOrchestrator/handler.ts`

**Current Code** (lines 2280-2305):
```typescript
case 'wake_simulation':
case 'wake_analysis':
  artifact = {
    type: 'wake_simulation',
    data: {
      messageContentType: 'wake_simulation',
      title: result.data.title || `Wake Simulation - ${result.data.projectId}`,
      subtitle: `${result.data.turbineMetrics?.count || 0} turbines, ${result.data.performanceMetrics?.netAEP?.toFixed(2) || 0} GWh/year`,
      projectId: result.data.projectId,
      performanceMetrics: result.data.performanceMetrics,
      turbineMetrics: result.data.turbineMetrics,
      monthlyProduction: result.data.monthlyProduction,
      visualizations: result.data.visualizations,
      windResourceData: result.data.windResourceData,
      chartImages: result.data.chartImages,
      message: result.data.message
    },
    actions
  };
  break;
```

**Analysis**: 
- Backend does NOT provide `result.data.title`
- Orchestrator generates title: `Wake Simulation - ${projectId}`
- This is correct - title is added ONCE

**No change needed** - orchestrator is already correct.

### 3. Backend Response Structure

**File**: `amplify/functions/renewableTools/simulation/handler.py`

**Current Code** (lines 782-800):
```python
response_data = {
    'projectId': project_id,
    'performanceMetrics': {
        'annualEnergyProduction': net_aep_gwh,
        'capacityFactor': capacity_factor,
        'wakeLosses': wake_loss_percent,
        'grossAEP': gross_aep_gwh,
        'netAEP': net_aep_gwh
    },
    'turbineMetrics': {
        'count': num_turbines,
        'totalCapacity': total_capacity,
        'averageWindSpeed': wind_speed
    },
    'monthlyProduction': monthly_production,
    'chartImages': {},
    'dataSource': 'NREL Wind Toolkit',
    'dataYear': 2023,
    'message': f'Simulation completed for {num_turbines} turbines using NREL Wind Toolkit data (2023)'
}
```

**Analysis**:
- Backend does NOT include a `title` field ✅ CORRECT
- Title is added by orchestrator only
- No duplication at backend level

**No change needed** - backend is already correct.

### 4. Frontend Component Rendering

**File**: `src/components/renewable/WakeAnalysisArtifact.tsx`

**Current Code** (lines 155-180):
```typescript
<Container
  header={
    <Header
      variant="h2"
      description={data.subtitle || `Wake simulation analysis for ${metrics.turbineCount} turbines`}
      actions={...}
    >
      {data.title}
    </Header>
  }
>
```

**Analysis**:
- Component renders `data.title` in header ONCE ✅ CORRECT
- No duplication in component

**No change needed** - component is already correct.

## Root Cause Analysis

### Wake Simulation Issue

**Problem**: Wake simulation is being mapped to the wrong component

**Location**: `src/components/ChatMessage.tsx` line 585

**Current Behavior**:
- `wake_simulation` → `SimulationChartArtifact` (WRONG)
- Changes messageContentType to `wind_farm_simulation`
- Wrong component doesn't match data structure

**Fix**: Map to `WakeAnalysisArtifact` instead

### Title Duplication Issue

**Investigation Results**:
- ✅ Backend: Does NOT add title (correct)
- ✅ Orchestrator: Adds title ONCE (correct)
- ✅ Component: Renders title ONCE (correct)

**Possible Causes**:
1. **Multiple artifacts returned** - If backend returns multiple artifacts, each would have a title
2. **Message text duplication** - If message text includes title AND artifact has title
3. **Component rendering twice** - React rendering issue

**Need to investigate**:
- Check if multiple artifacts are being created
- Check if message text duplicates the title
- Check browser console for duplicate renders

## Data Models

### Backend Response (simulation/handler.py)
```python
{
  'success': True,
  'type': 'wake_simulation',
  'data': {
    'projectId': str,
    'performanceMetrics': {
      'annualEnergyProduction': float,
      'capacityFactor': float,
      'wakeLosses': float,
      'grossAEP': float,
      'netAEP': float
    },
    'turbineMetrics': {
      'count': int,
      'totalCapacity': float,
      'averageWindSpeed': float
    },
    'monthlyProduction': [float],
    'visualizations': {
      'wake_heat_map': str,
      'wake_analysis': str,
      'performance_charts': [str]
    },
    'windResourceData': {...},
    'message': str
    # NO 'title' field - added by orchestrator
  }
}
```

### Orchestrator Artifact (handler.ts)
```typescript
{
  type: 'wake_simulation',
  data: {
    messageContentType: 'wake_simulation',
    title: string,  // Added by orchestrator
    subtitle: string,  // Generated from metrics
    projectId: string,
    performanceMetrics: {...},
    turbineMetrics: {...},
    monthlyProduction: number[],
    visualizations: {...},
    windResourceData: {...},
    message: string
  },
  actions: ActionButton[]
}
```

### Frontend Props (WakeAnalysisArtifact.tsx)
```typescript
interface WakeAnalysisArtifactProps {
  data: {
    messageContentType: 'wake_simulation';
    title: string;
    subtitle?: string;
    projectId: string;
    performanceMetrics: {...};
    turbineMetrics?: {...};
    monthlyProduction?: number[];
    visualizations?: {...};
    windResourceData?: {...};
    message?: string;
  };
  onFollowUpAction?: (action: string) => void;
}
```

## Testing Strategy

### Unit Tests
1. Test ChatMessage maps wake_simulation to WakeAnalysisArtifact
2. Test WakeAnalysisArtifact renders with wake simulation data
3. Test title appears only once in rendered output

### Integration Tests
1. Test orchestrator formats wake_simulation artifact correctly
2. Test end-to-end flow: query → backend → orchestrator → frontend
3. Test no duplicate titles in complete flow

### Visual Tests
1. Verify wake simulation displays in browser
2. Verify title appears only once
3. Verify all metrics and visualizations display
4. Verify no duplicate content sections

## Implementation Notes

### Why Wake Simulation Fails
The frontend is mapping `wake_simulation` to `SimulationChartArtifact` instead of `WakeAnalysisArtifact`. This causes:
- Wrong component receives data
- Data structure mismatch
- Component fails to render or renders incorrectly

### Title Duplication Investigation
Initial investigation shows:
- Backend: ✅ No title field
- Orchestrator: ✅ Adds title once
- Component: ✅ Renders title once

Need to check:
- Are multiple artifacts being created?
- Is message text duplicating the title?
- Is there a React rendering issue?

### Performance Considerations
- WakeAnalysisArtifact uses dynamic Plotly import (client-side only)
- Component includes monthly production charts
- Visualizations loaded from S3 URLs
