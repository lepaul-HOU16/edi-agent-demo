# Design Document

## Overview

This design addresses the missing artifact generation in data quality assessment responses. The solution involves modifying the Python Lambda handler to generate proper artifact structures and creating a new Cloudscape component to visualize the quality metrics.

## Architecture

### Component Interaction Flow

```
User Query: "Assess data quality for WELL-001"
    ↓
EnhancedStrandsAgent (intent detection)
    ↓
Petrophysics Calculator Lambda (assess_well_data_quality)
    ↓
Parse LAS file from S3
    ↓
Calculate completeness for each curve
    ↓
Generate artifact with quality metrics
    ↓
Return {success, message, artifacts}
    ↓
ChatMessage component receives response
    ↓
ArtifactRenderer routes to CloudscapeDataQualityDisplay
    ↓
Display quality metrics with progress bars
```

### Key Design Decisions

1. **Artifact Structure**: Follow the same pattern as porosity/shale/saturation artifacts for consistency
2. **Component Reuse**: Use existing Cloudscape components (Container, ProgressBar, StatusIndicator)
3. **Color Coding**: Use industry-standard thresholds (>90% = good, 50-90% = fair, <50% = poor)
4. **No Breaking Changes**: Maintain backward compatibility by adding artifacts without changing existing fields

## Components and Interfaces

### 1. Backend: Petrophysics Calculator Lambda

#### Modified Function: `assess_well_data_quality()`

**Current Implementation:**
```python
def assess_well_data_quality(params: Dict[str, Any]) -> Dict[str, Any]:
    # ... calculation logic ...
    return {
        'wellName': well_name,
        'overallQuality': 'Good',
        'curves': curve_assessments
    }
```

**New Implementation:**
```python
def assess_well_data_quality(params: Dict[str, Any]) -> Dict[str, Any]:
    # ... calculation logic ...
    
    # Create artifact structure
    artifact = {
        'messageContentType': 'data_quality_assessment',
        'wellName': well_name,
        'overallQuality': overall_quality,
        'curves': curve_assessments,
        'summary': {
            'totalCurves': len(curve_assessments),
            'goodQuality': len([c for c in curve_assessments if c['completeness'] > 90]),
            'fairQuality': len([c for c in curve_assessments if 50 <= c['completeness'] <= 90]),
            'poorQuality': len([c for c in curve_assessments if c['completeness'] < 50])
        }
    }
    
    return {
        'success': True,
        'message': f'Data quality assessment complete for {well_name}',
        'artifacts': [artifact]
    }
```

#### Modified Function: `assess_curve_quality()`

**New Implementation:**
```python
def assess_curve_quality(params: Dict[str, Any]) -> Dict[str, Any]:
    # ... calculation logic ...
    
    artifact = {
        'messageContentType': 'curve_quality_assessment',
        'wellName': well_name,
        'curveName': curve_name,
        'completeness': completeness,
        'totalPoints': total_points,
        'validPoints': valid_points,
        'qualityScore': quality_score,
        'outliers': outlier_info  # If available
    }
    
    return {
        'success': True,
        'message': f'Curve quality assessment complete for {well_name} - {curve_name}',
        'artifacts': [artifact]
    }
```

### 2. Frontend: CloudscapeDataQualityDisplay Component

**File:** `src/components/cloudscape/CloudscapeDataQualityDisplay.tsx`

**Component Structure:**
```typescript
interface DataQualityArtifact {
  messageContentType: 'data_quality_assessment';
  wellName: string;
  overallQuality: string;
  curves: Array<{
    curve: string;
    completeness: number;
    totalPoints: number;
    validPoints: number;
  }>;
  summary?: {
    totalCurves: number;
    goodQuality: number;
    fairQuality: number;
    poorQuality: number;
  };
}

export function CloudscapeDataQualityDisplay({ artifact }: { artifact: DataQualityArtifact }) {
  // Render using Cloudscape components
}
```

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Data Quality Assessment - WELL-001                  │
│ Overall Quality: Good                               │
├─────────────────────────────────────────────────────┤
│ Summary                                             │
│ • Total Curves: 12                                  │
│ • Good Quality (>90%): 8                            │
│ • Fair Quality (50-90%): 3                          │
│ • Poor Quality (<50%): 1                            │
├─────────────────────────────────────────────────────┤
│ Curve Details                                       │
│                                                     │
│ GR                                                  │
│ [████████████████████████] 98.3%                   │
│ 8,895 / 9,049 valid points                         │
│                                                     │
│ RHOB                                                │
│ [████████████████████████] 98.2%                   │
│ 8,884 / 9,049 valid points                         │
│                                                     │
│ VWCL                                                │
│ [████████████░░░░░░░░░░░░] 54.8%                   │
│ 4,955 / 9,049 valid points                         │
│                                                     │
│ FAULT                                               │
│ [█░░░░░░░░░░░░░░░░░░░░░░░] 0.9%                    │
│ 81 / 9,049 valid points                            │
└─────────────────────────────────────────────────────┘
```

### 3. Frontend: Artifact Routing

**File:** `src/components/ChatMessage.tsx` (or `ArtifactRenderer.tsx`)

**Routing Logic:**
```typescript
function renderArtifact(artifact: any) {
  switch (artifact.messageContentType) {
    case 'comprehensive_porosity_analysis':
      return <CloudscapePorosityDisplay artifact={artifact} />;
    case 'comprehensive_shale_analysis':
      return <CloudscapeShaleVolumeDisplay artifact={artifact} />;
    case 'water_saturation_analysis':
      return <CloudscapeSaturationDisplay artifact={artifact} />;
    case 'data_quality_assessment':
      return <CloudscapeDataQualityDisplay artifact={artifact} />;
    case 'curve_quality_assessment':
      return <CloudscapeCurveQualityDisplay artifact={artifact} />;
    default:
      return <DefaultArtifactDisplay artifact={artifact} />;
  }
}
```

## Data Models

### Artifact Data Structure

```typescript
interface DataQualityArtifact {
  messageContentType: 'data_quality_assessment';
  wellName: string;
  overallQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  curves: CurveQuality[];
  summary?: QualitySummary;
}

interface CurveQuality {
  curve: string;
  completeness: number;  // 0-100
  totalPoints: number;
  validPoints: number;
  qualityScore?: 'Good' | 'Fair' | 'Poor';
}

interface QualitySummary {
  totalCurves: number;
  goodQuality: number;   // Count of curves >90%
  fairQuality: number;   // Count of curves 50-90%
  poorQuality: number;   // Count of curves <50%
}
```

### Quality Thresholds

```typescript
const QUALITY_THRESHOLDS = {
  EXCELLENT: 95,  // >= 95%
  GOOD: 90,       // >= 90%
  FAIR: 50,       // >= 50%
  POOR: 0         // < 50%
};

const QUALITY_COLORS = {
  EXCELLENT: 'green',
  GOOD: 'green',
  FAIR: 'yellow',
  POOR: 'red'
};
```

## Error Handling

### Backend Error Scenarios

1. **LAS File Not Found**
   - Return: `{success: false, error: 'LAS file not found for WELL-001'}`
   - No artifacts array

2. **Curve Not Found**
   - Return: `{success: false, error: 'Curve GR not found in WELL-001'}`
   - No artifacts array

3. **S3 Access Error**
   - Return: `{success: false, error: 'Failed to access S3: [details]'}`
   - No artifacts array

4. **Parsing Error**
   - Return: `{success: false, error: 'Failed to parse LAS file: [details]'}`
   - No artifacts array

### Frontend Error Handling

1. **Missing Artifact**
   - Display text-only message
   - Show warning: "Visualization unavailable"

2. **Invalid Artifact Structure**
   - Log error to console
   - Display fallback component with raw data

3. **Rendering Error**
   - Catch with error boundary
   - Display error message with artifact data in expandable section

## Testing Strategy

### Unit Tests

1. **Backend Tests** (`test-data-quality-artifact-generation.py`)
   - Test artifact structure generation
   - Test quality score calculation
   - Test completeness calculation
   - Test error handling

2. **Frontend Tests** (`CloudscapeDataQualityDisplay.test.tsx`)
   - Test component rendering with valid artifact
   - Test progress bar color coding
   - Test quality score display
   - Test error state rendering

### Integration Tests

1. **End-to-End Test** (`test-data-quality-e2e.js`)
   - Send query: "Assess data quality for WELL-001"
   - Verify Lambda returns artifact
   - Verify frontend renders CloudscapeDataQualityDisplay
   - Verify progress bars display correct percentages
   - Verify color coding is correct

### Manual Testing

1. Test with WELL-001 (has good quality data)
2. Test with WELL-002 (has some missing data)
3. Test with WELL-003 (has poor quality curves)
4. Test with non-existent well (error handling)
5. Test with specific curve assessment

## Implementation Notes

### Backward Compatibility

- Keep existing response fields (`wellName`, `overallQuality`, `curves`)
- Add new fields (`success`, `message`, `artifacts`) without breaking existing consumers
- Frontend should handle both old format (text-only) and new format (with artifacts)

### Performance Considerations

- Limit curve data to summary statistics (no full curve data in artifact)
- Use existing LAS parsing logic (no additional S3 calls)
- Render progress bars efficiently (use CSS, not canvas)

### Cloudscape Component Guidelines

- Use `Container` for main layout
- Use `Header` for section titles
- Use `ProgressBar` for completeness visualization
- Use `StatusIndicator` for quality scores
- Use `ColumnLayout` for responsive grid
- Use `KeyValuePairs` for summary statistics

## Migration Path

1. **Phase 1**: Update backend to generate artifacts (backward compatible)
2. **Phase 2**: Create CloudscapeDataQualityDisplay component
3. **Phase 3**: Add artifact routing in ChatMessage
4. **Phase 4**: Test with all wells
5. **Phase 5**: Deploy to production

## Success Criteria

- Data quality queries return artifacts in response
- CloudscapeDataQualityDisplay renders quality metrics
- Progress bars show correct completeness percentages
- Color coding matches quality thresholds
- No regressions in existing petrophysics tools
- Response time < 3 seconds for typical well
