# Design Document

## Overview

This design addresses the broken multi-well correlation workflow by implementing a dedicated handler in the Enhanced Strands Agent. The current issue is that multi-well correlation requests are being misrouted to the single well info handler, resulting in single-well dashboards instead of correlation analysis.

## Architecture

### Current Flow (Broken)
```
User Query: "multi-well correlation for WELL-001, WELL-002, WELL-003"
    ↓
detectUserIntent() → Detects 'multi_well_correlation' intent
    ↓
processMessage() → Routes to case 'multi_well_correlation'
    ↓
executeMultiWellCorrelationAnalysis() → METHOD DOES NOT EXIST
    ↓
Falls through to default/well_info handler
    ↓
Returns single well dashboard for WELL-001 only
```

### Fixed Flow (Target)
```
User Query: "multi-well correlation for WELL-001, WELL-002, WELL-003"
    ↓
detectUserIntent() → Detects 'multi_well_correlation' intent
    ↓
processMessage() → Routes to case 'multi_well_correlation'
    ↓
handleMultiWellCorrelation() → NEW DEDICATED HANDLER
    ↓
Extract well names → [WELL-001, WELL-002, WELL-003]
    ↓
Validate wells exist and have required data
    ↓
Call MCP tool or generate correlation analysis
    ↓
Return artifacts with correlation visualizations
```

## Components and Interfaces

### 1. Intent Detection Enhancement

**Location:** `amplify/functions/agents/enhancedStrandsAgent.ts` - `detectUserIntent()` method

**Current State:** Intent detection patterns exist but may need refinement

**Changes Needed:**
- Verify multi-well correlation patterns are comprehensive
- Ensure patterns don't conflict with other intents
- Add well name extraction for multi-well scenarios

**Pattern Examples:**
```typescript
{
  type: 'multi_well_correlation',
  test: () => this.matchesAny(query, [
    'multi.?well.*correlation',
    'multiwell.*correlation',
    'correlation.*analysis',
    'well.*correlation',
    'correlation panel',
    'normalized.*log.*correlations',
    'cross.*well.*correlation',
    'wells.*well-\\d+.*well-\\d+.*well-\\d+' // Multiple wells mentioned
  ]),
  requiresWell: false
}
```

### 2. Multi-Well Correlation Handler

**Location:** `amplify/functions/agents/enhancedStrandsAgent.ts` - New method `handleMultiWellCorrelation()`

**Method Signature:**
```typescript
private async handleMultiWellCorrelation(
  message: string, 
  wellNames?: string[]
): Promise<any>
```

**Implementation Steps:**

1. **Extract Well Names**
   - Parse message for well name patterns (WELL-001, WELL-002, etc.)
   - If wellNames parameter provided, use those
   - If no wells found, return helpful error message

2. **Validate Wells**
   - Check that at least 2 wells are specified
   - Verify each well exists using listWellsTool
   - Check that wells have required log curves (GR, RHOB, NPHI, resistivity)

3. **Retrieve Well Data**
   - For each well, call getWellInfoTool to get available curves
   - Identify common curves across all wells
   - Prepare data for correlation analysis

4. **Generate Correlation Analysis**
   - Option A: Call existing MCP tool if available
   - Option B: Generate correlation artifact directly
   - Include normalized log data, correlation lines, statistics

5. **Return Response**
   - Success: Return artifacts with correlation visualizations
   - Failure: Return helpful error message with guidance

### 3. Well Name Extraction Utility

**Location:** `amplify/functions/agents/enhancedStrandsAgent.ts` - New method `extractMultipleWellNames()`

**Method Signature:**
```typescript
private extractMultipleWellNames(message: string): string[]
```

**Implementation:**
```typescript
private extractMultipleWellNames(message: string): string[] {
  const wellPattern = /WELL-\d{3}/gi;
  const matches = message.match(wellPattern);
  
  if (!matches) {
    return [];
  }
  
  // Remove duplicates and normalize to uppercase
  const uniqueWells = [...new Set(matches.map(w => w.toUpperCase()))];
  
  console.log('Extracted well names:', uniqueWells);
  return uniqueWells;
}
```

### 4. Correlation Artifact Structure

**Artifact Type:** `multi_well_correlation_analysis`

**Structure:**
```typescript
interface MultiWellCorrelationArtifact {
  messageContentType: 'multi_well_correlation_analysis';
  title: string;
  subtitle: string;
  wells: string[];
  correlationData: {
    normalizedLogs: {
      gammaRay: Array<{well: string, depth: number[], values: number[]}>;
      resistivity: Array<{well: string, depth: number[], values: number[]}>;
      porosity: Array<{well: string, depth: number[], values: number[]}>;
    };
    correlationLines: Array<{
      name: string;
      depths: {[wellName: string]: number};
      confidence: number;
    }>;
    reservoirZones: Array<{
      name: string;
      topDepths: {[wellName: string]: number};
      bottomDepths: {[wellName: string]: number};
      averageProperties: {
        porosity: number;
        shaleVolume: number;
      };
    }>;
  };
  statistics: {
    totalWells: number;
    commonCurves: string[];
    depthRange: {min: number, max: number};
    correlationQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  visualizations: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}
```

## Data Models

### Well Correlation Data
```typescript
interface WellCorrelationData {
  wellName: string;
  depth: number[];
  gammaRay: number[];
  resistivity: number[];
  density: number[];
  neutron: number[];
  normalizedGR: number[];  // Normalized 0-1
  normalizedRES: number[]; // Normalized 0-1
  normalizedPHI: number[]; // Normalized 0-1
}
```

### Correlation Line
```typescript
interface CorrelationLine {
  id: string;
  name: string;
  type: 'formation_top' | 'reservoir_zone' | 'geological_marker';
  depths: Map<string, number>; // wellName -> depth
  confidence: number; // 0-1
  description: string;
}
```

## Error Handling

### Error Scenarios

1. **No Wells Specified**
   - Message: "Please specify at least 2 wells for correlation analysis. Example: 'multi-well correlation for WELL-001, WELL-002, WELL-003'"
   - Include list of available wells

2. **Only One Well Specified**
   - Message: "Multi-well correlation requires at least 2 wells. You specified: [WELL-001]. Please add more wells."
   - Suggest similar wells from the dataset

3. **Wells Don't Exist**
   - Message: "The following wells were not found: [WELL-999]. Available wells: [WELL-001, WELL-002, ...]"
   - List valid well names

4. **Missing Required Curves**
   - Message: "Cannot perform correlation - wells are missing required log curves. WELL-001: missing GR. WELL-002: missing RHOB."
   - Specify which wells lack which curves

5. **MCP Tool Failure**
   - Message: "Correlation analysis failed due to a technical error. Please try again or contact support."
   - Log detailed error for debugging

## Testing Strategy

### Unit Tests

1. **Intent Detection Tests**
   - Test multi-well correlation pattern matching
   - Test well name extraction
   - Test conflict with other intents

2. **Handler Tests**
   - Test with valid multiple wells
   - Test with no wells specified
   - Test with one well only
   - Test with non-existent wells
   - Test with wells missing data

3. **Artifact Generation Tests**
   - Test artifact structure
   - Test data normalization
   - Test correlation line generation

### Integration Tests

1. **End-to-End Flow**
   - Send multi-well correlation query
   - Verify correct handler is called
   - Verify artifacts are generated
   - Verify frontend can render artifacts

2. **Preloaded Prompt #2 Test**
   - Test exact preloaded prompt text
   - Verify it routes to multi-well correlation
   - Verify it returns correlation artifacts
   - Verify no single-well dashboard is returned

### Manual Testing

1. **User Workflow Test**
   - User sends: "create comprehensive multi-well correlation analysis for wells WELL-001, WELL-002, WELL-003, WELL-004, WELL-005"
   - Expected: Correlation panel with 5 wells
   - Actual: Should match expected

2. **Error Handling Test**
   - User sends: "multi-well correlation"
   - Expected: Helpful message listing available wells
   - Actual: Should match expected

## Implementation Plan

### Phase 1: Handler Implementation (Core Fix)
1. Create `handleMultiWellCorrelation()` method
2. Implement well name extraction
3. Add validation logic
4. Wire up to processMessage() switch statement

### Phase 2: Artifact Generation
1. Define artifact structure
2. Implement data retrieval for multiple wells
3. Generate normalized log data
4. Create correlation statistics

### Phase 3: Error Handling
1. Add validation for well count
2. Add validation for well existence
3. Add validation for required curves
4. Implement helpful error messages

### Phase 4: Testing & Validation
1. Test with preloaded prompt #2
2. Test error scenarios
3. Verify artifacts render in frontend
4. User acceptance testing

## Success Criteria

1. ✅ Preloaded prompt #2 returns multi-well correlation artifacts (not single well dashboard)
2. ✅ Multi-well correlation queries route to correct handler
3. ✅ Artifacts contain correlation data for all specified wells
4. ✅ Error messages are helpful and actionable
5. ✅ Frontend can render correlation visualizations
6. ✅ No regressions in other workflows (single well analysis still works)
