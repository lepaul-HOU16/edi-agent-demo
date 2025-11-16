# Multi-Well Correlation Workflow Design

## Overview

This design implements an interactive multi-well correlation workflow that enables geoscientists to visualize data availability, assess quality, and perform correlation analysis with economic calculations. The workflow is conversational and maintains context across multiple steps.

## Architecture

### Component Overview

```
User Query
    ↓
Agent Router → Petrophysics Agent
    ↓
Intent Detection (multi_well_correlation, data_matrix, data_quality)
    ↓
Petrophysics Calculator Lambda
    ↓
    ├─ Data Matrix Generator
    ├─ Data Quality Assessor  
    ├─ Correlation Analyzer
    └─ NPV Calculator
    ↓
Artifacts (Interactive Visualizations)
    ↓
Frontend Components
```

### Data Flow

1. **User initiates workflow** → Natural language query
2. **Agent detects intent** → Routes to appropriate handler
3. **Calculator performs analysis** → Accesses LAS files from S3
4. **Generates artifacts** → Interactive visualizations
5. **Frontend renders** → User can click and explore
6. **Context maintained** → Next steps suggested

## Components and Interfaces

### 1. Intent Detection Patterns

Add new patterns to `enhancedStrandsAgent.ts`:

```typescript
// Data matrix patterns
/data.*matrix|matrix.*plot|show.*available.*data/i
/what.*data.*available|data.*coverage/i

// Data quality patterns  
/data.*quality|quality.*assessment|check.*data/i
/show.*well.*\w+-\d+|analyze.*well.*\w+-\d+/i

// Correlation patterns
/run.*correlation|correlate.*wells?/i
/multi.*well.*correlation|cross.*well/i
```

### 2. Petrophysics Calculator Lambda Extensions

Add new tools to `handler.py`:

#### Tool: `generate_data_matrix`

```python
def generate_data_matrix(well_names: List[str]) -> Dict:
    """
    Generate data availability matrix for all wells
    
    Returns:
    {
        'wells': ['WELL-001', 'WELL-002', ...],
        'curves': ['GR', 'RHOB', 'NPHI', ...],
        'matrix': [[completeness_percentages]],
        'artifact': {
            'messageContentType': 'data_matrix',
            'data': {...}
        }
    }
    """
```

#### Tool: `assess_well_data_quality`

```python
def assess_well_data_quality(well_name: str) -> Dict:
    """
    Detailed data quality assessment for a single well
    
    Returns:
    {
        'well_name': 'WELL-001',
        'curves': {
            'GR': {
                'completeness': 0.95,
                'outliers': [...],
                'gaps': [...]
            }
        },
        'artifact': {
            'messageContentType': 'data_quality_plot',
            'logData': {...},
            'annotations': [...]
        }
    }
    """
```

#### Tool: `run_correlation_analysis`

```python
def run_correlation_analysis(
    well_names: List[str],
    cutoffs: Dict = None
) -> Dict:
    """
    Multi-well correlation with net pay calculation
    
    Parameters:
    - well_names: List of wells to correlate
    - cutoffs: {
        'porosity_min': 0.12,
        'vsh_max': 0.35,
        'sw_max': 0.50
      }
    
    Returns:
    {
        'zones': [
            {
                'name': 'Zone A',
                'wells': {
                    'WELL-001': {
                        'top': 2400,
                        'bottom': 2425,
                        'net_pay': 18,
                        'avg_porosity': 0.15,
                        'npv': 2300000
                    }
                }
            }
        ],
        'cutoffs_used': {...},
        'artifact': {
            'messageContentType': 'correlation_report',
            'data': {...}
        }
    }
    """
```

### 3. Frontend Artifact Components

#### DataMatrixComponent.tsx

```typescript
interface DataMatrixProps {
  wells: string[];
  curves: string[];
  matrix: number[][];
  onWellClick: (wellName: string) => void;
}

// Renders interactive heatmap
// Click on well → triggers data quality request
```

#### DataQualityPlotComponent.tsx

```typescript
interface DataQualityPlotProps {
  wellName: string;
  logData: {
    depth: number[];
    curves: Record<string, number[]>;
  };
  annotations: Array<{
    depth_range: [number, number];
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Renders log plot with Plotly
// Highlights quality issues with colored zones
// Shows annotations on hover
```

#### CorrelationReportComponent.tsx

```typescript
interface CorrelationReportProps {
  zones: Array<{
    name: string;
    wells: Record<string, ZoneData>;
  }>;
  cutoffs: Record<string, number>;
  totalNPV: number;
}

// Renders professional report
// Tables showing zone-by-zone results
// Summary statistics and NPV
```

## Data Models

### Data Matrix Artifact

```typescript
{
  messageContentType: 'data_matrix',
  wells: string[],
  curves: string[],
  matrix: number[][],  // completeness percentages
  metadata: {
    total_wells: number,
    total_curves: number,
    overall_completeness: number
  }
}
```

### Data Quality Artifact

```typescript
{
  messageContentType: 'data_quality_plot',
  wellName: string,
  logData: {
    depth: number[],
    GR: number[],
    RHOB: number[],
    NPHI: number[],
    // ... other curves
  },
  annotations: Array<{
    depth_range: [number, number],
    curve: string,
    issue: string,
    severity: 'low' | 'medium' | 'high',
    description: string
  }>,
  summary: {
    overall_quality: 'excellent' | 'good' | 'fair' | 'poor',
    completeness: number,
    outlier_count: number,
    gap_count: number
  }
}
```

### Correlation Report Artifact

```typescript
{
  messageContentType: 'correlation_report',
  wells: string[],
  zones: Array<{
    name: string,
    wells: Record<string, {
      top_depth: number,
      bottom_depth: number,
      gross_thickness: number,
      net_pay: number,
      avg_porosity: number,
      avg_saturation: number,
      npv: number
    }>
  }>,
  cutoffs: {
    porosity_min: number,
    vsh_max: number,
    sw_max: number
  },
  summary: {
    total_net_pay: number,
    total_npv: number,
    zone_count: number
  }
}
```

## Error Handling

- **Missing data**: Gracefully handle wells with incomplete data
- **Invalid cutoffs**: Use industry-standard defaults if not specified
- **Calculation failures**: Provide clear error messages
- **No zones identified**: Inform user and suggest adjusting cutoffs

## Testing Strategy

1. **Unit tests**: Test each calculation function independently
2. **Integration tests**: Test full workflow end-to-end
3. **Data validation**: Test with all 24 wells
4. **Edge cases**: Test with missing curves, bad data
5. **Performance**: Ensure matrix generation completes in < 5 seconds

## Implementation Phases

### Phase 1: Data Matrix (MVP)
- Implement `generate_data_matrix` tool
- Create DataMatrixComponent
- Add intent detection patterns
- Test with all 24 wells

### Phase 2: Data Quality
- Implement `assess_well_data_quality` tool
- Create DataQualityPlotComponent
- Add click handling in matrix
- Test quality assessment

### Phase 3: Correlation Analysis
- Implement `run_correlation_analysis` tool
- Add zone identification logic
- Add net pay calculation
- Create CorrelationReportComponent

### Phase 4: NPV Calculation
- Add economic parameters
- Implement NPV calculation
- Add configurable assumptions
- Test with realistic scenarios

## Performance Considerations

- **Matrix generation**: Cache results for 5 minutes
- **LAS file reading**: Read once, analyze multiple times
- **Calculation optimization**: Vectorize operations with numpy
- **Artifact size**: Limit data points in visualizations to prevent DynamoDB issues

## Security Considerations

- Validate well names to prevent injection
- Sanitize user-provided cutoff values
- Limit number of wells in correlation (max 10)
- Rate limit expensive operations
