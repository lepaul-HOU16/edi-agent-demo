# Design Document

## Overview

The Petrophysics Rich Artifacts system transforms the current text-only petrophysics agent responses into professional, interactive visualizations using Cloudscape components and Plotly charts. The design leverages the existing MCP server calculations while adding a comprehensive artifact rendering layer in the frontend. This approach maintains the backend calculation integrity while dramatically improving the user experience through rich visual feedback.

The system builds upon the existing infrastructure: the EnhancedStrandsAgent continues to call MCP tools for calculations, but instead of returning plain text, it structures the results as artifacts with visualization data. The frontend receives these artifacts and renders them using specialized React components that combine Cloudscape design system elements with Plotly charts for professional, industry-standard displays.

## Architecture

### High-Level Architecture

\`\`\`mermaid
graph TB
    subgraph "Frontend Layer"
        Chat[Chat Interface]
        ArtifactRouter[Artifact Router]
        FormationArtifact[Formation Evaluation Artifact]
        PorosityArtifact[Porosity Analysis Artifact]
        ShaleArtifact[Shale Volume Artifact]
        SaturationArtifact[Saturation Analysis Artifact]
        CorrelationArtifact[Multi-Well Correlation Artifact]
        QualityArtifact[Data Quality Artifact]
    end
    
    subgraph "Backend Layer"
        Agent[Enhanced Strands Agent]
        ArtifactBuilder[Artifact Builder]
        MCPTools[MCP Petrophysics Tools]
    end
    
    subgraph "Visualization Libraries"
        Cloudscape[Cloudscape Components]
        Plotly[Plotly.js Charts]
    end
    
    Chat --> ArtifactRouter
    ArtifactRouter --> FormationArtifact
    ArtifactRouter --> PorosityArtifact
    ArtifactRouter --> ShaleArtifact
    ArtifactRouter --> SaturationArtifact
    ArtifactRouter --> CorrelationArtifact
    ArtifactRouter --> QualityArtifact
    
    Agent --> ArtifactBuilder
    ArtifactBuilder --> MCPTools
    
    FormationArtifact --> Cloudscape
    FormationArtifact --> Plotly
    PorosityArtifact --> Cloudscape
    PorosityArtifact --> Plotly
    ShaleArtifact --> Cloudscape
    ShaleArtifact --> Plotly
\`\`\`

### Data Flow

1. **User Query** → Chat interface sends message to backend
2. **Intent Detection** → Agent identifies analysis type (formation evaluation, porosity, etc.)
3. **MCP Tool Calls** → Agent calls appropriate MCP tools for calculations
4. **Artifact Building** → Agent structures results as artifact with visualization data
5. **Response** → Backend returns artifact in response.artifacts array
6. **Artifact Routing** → Frontend routes artifact to appropriate renderer component
7. **Rendering** → Component renders Cloudscape UI + Plotly charts
8. **Display** → User sees rich, interactive visualization in chat

## Components and Interfaces

### 1. Backend Artifact Builder

**Purpose**: Transform MCP calculation results into structured artifacts with visualization data

**Key Components**:
- `ArtifactBuilder`: Base class for building artifacts from MCP results
- `FormationEvaluationArtifactBuilder`: Builds formation evaluation artifacts
- `PorosityArtifactBuilder`: Builds porosity analysis artifacts
- `ShaleVolumeArtifactBuilder`: Builds shale volume artifacts
- `SaturationArtifactBuilder`: Builds saturation analysis artifacts
- `MultiWellCorrelationArtifactBuilder`: Builds correlation artifacts
- `DataQualityArtifactBuilder`: Builds data quality artifacts

**Interfaces**:
\`\`\`typescript
interface Artifact {
  type: string;
  title: string;
  data: any;
  metadata?: {
    wellName?: string;
    timestamp?: string;
    method?: string;
    parameters?: any;
  };
}

interface FormationEvaluationArtifactData {
  wellName: string;
  timestamp: string;
  workflowSteps: WorkflowStep[];
  porosityData: PorosityData;
  shaleVolumeData: ShaleVolumeData;
  saturationData: SaturationData;
  reservoirQuality: ReservoirQualityMetrics;
  dataQuality: DataQualityMetrics;
  methodology: MethodologyDocumentation;
}

interface WorkflowStep {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message?: string;
  duration?: number;
}

interface PorosityData {
  depths: number[];
  densityPorosity: number[];
  neutronPorosity: number[];
  effectivePorosity: number[];
  statistics: StatisticalSummary;
  uncertainty: UncertaintyData;
  dataQuality: {
    completeness: number;
    outliers: number;
  };
}

interface ShaleVolumeData {
  depths: number[];
  gammaRay: number[];
  shaleVolume: number[];
  cleanSandIntervals: CleanSandInterval[];
  statistics: StatisticalSummary;
  cutoffs: {
    grClean: number;
    grShale: number;
  };
  method: string;
}

interface SaturationData {
  depths: number[];
  resistivity: number[];
  waterSaturation: number[];
  hydrocarbonSaturation: number[];
  hydrocarbonZones: HydrocarbonZone[];
  statistics: StatisticalSummary;
  parameters: ArchieParameters;
}

interface StatisticalSummary {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  p10: number;
  p50: number;
  p90: number;
}

interface CleanSandInterval {
  topDepth: number;
  bottomDepth: number;
  thickness: number;
  averagePorosity: number;
  averageShaleVolume: number;
}

interface HydrocarbonZone {
  topDepth: number;
  bottomDepth: number;
  thickness: number;
  averageSaturation: number;
  averagePorosity: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ArchieParameters {
  rw: number;
  a: number;
  m: number;
  n: number;
}
\`\`\`

### 2. Frontend Artifact Renderer Components

**Purpose**: Render artifacts as professional Cloudscape + Plotly visualizations

**Key Components**:
- `ArtifactRenderer`: Routes artifacts to appropriate component
- `FormationEvaluationArtifact`: Renders formation evaluation with tabs
- `PorosityAnalysisArtifact`: Renders porosity depth plots and statistics
- `ShaleVolumeArtifact`: Renders shale volume with clean sand highlighting
- `SaturationAnalysisArtifact`: Renders saturation with hydrocarbon zones
- `MultiWellCorrelationArtifact`: Renders correlation panel
- `DataQualityArtifact`: Renders quality metrics and recommendations

**Component Structure**:
\`\`\`typescript
interface ArtifactRendererProps {
  artifact: Artifact;
  onError?: (error: Error) => void;
}

// Formation Evaluation Artifact Component
const FormationEvaluationArtifact: React.FC<{ data: FormationEvaluationArtifactData }> = ({ data }) => {
  return (
    <Container header={<Header variant="h2">Formation Evaluation: {data.wellName}</Header>}>
      <Tabs
        tabs={[
          {
            label: "Overview",
            id: "overview",
            content: <OverviewTab data={data} />
          },
          {
            label: "Porosity",
            id: "porosity",
            content: <PorosityTab data={data.porosityData} />
          },
          {
            label: "Shale Volume",
            id: "shale",
            content: <ShaleVolumeTab data={data.shaleVolumeData} />
          },
          {
            label: "Water Saturation",
            id: "saturation",
            content: <SaturationTab data={data.saturationData} />
          },
          {
            label: "Reservoir Quality",
            id: "quality",
            content: <ReservoirQualityTab data={data.reservoirQuality} />
          },
          {
            label: "Methodology",
            id: "methodology",
            content: <MethodologyTab data={data.methodology} />
          }
        ]}
      />
    </Container>
  );
};

// Porosity Analysis Artifact Component
const PorosityAnalysisArtifact: React.FC<{ data: PorosityData }> = ({ data }) => {
  return (
    <Container header={<Header variant="h2">Porosity Analysis</Header>}>
      <SpaceBetween size="l">
        <PorosityDepthPlot data={data} />
        <PorosityStatisticsTable statistics={data.statistics} />
        <PorosityHistogram data={data} />
        <DataQualityIndicators quality={data.dataQuality} />
      </SpaceBetween>
    </Container>
  );
};
\`\`\`

### 3. Plotly Chart Components

**Purpose**: Render industry-standard log plots and visualizations

**Key Components**:
- `DepthPlot`: Base component for depth-based plots (inverted Y-axis)
- `PorosityDepthPlot`: Three-curve porosity plot
- `ShaleVolumeDepthPlot`: Shale volume with color fills
- `SaturationDepthPlot`: Saturation with hydrocarbon highlighting
- `CorrelationPanel`: Multi-well correlation display
- `Histogram`: Distribution plots for statistical analysis

**Chart Configuration**:
\`\`\`typescript
interface DepthPlotConfig {
  depths: number[];
  curves: CurveData[];
  fills?: FillConfig[];
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  colorScheme: 'industry' | 'custom';
}

interface CurveData {
  name: string;
  values: number[];
  color: string;
  lineWidth: number;
  showLegend: boolean;
}

interface FillConfig {
  x: number[];
  y: number[];
  fillColor: string;
  opacity: number;
  name: string;
}

// Industry-standard color scheme
const INDUSTRY_COLORS = {
  GR: '#2ca02c',        // Green
  RHOB: '#d62728',      // Red
  NPHI: '#1f77b4',      // Blue
  RT: '#000000',        // Black
  POROSITY: '#ff7f0e',  // Orange/Gold
  SHALE: '#8c564b',     // Brown
  CLEAN_SAND: '#2ca02c',// Green
  WATER: '#1f77b4',     // Blue
  HYDROCARBON: '#2ca02c'// Green
};
\`\`\`

## Data Models

### 1. Artifact Response Model

\`\`\`typescript
interface AgentResponse {
  success: boolean;
  message: string;
  artifacts?: Artifact[];
  thoughtSteps?: ThoughtStep[];
}

interface Artifact {
  type: ArtifactType;
  title: string;
  data: any;
  metadata?: ArtifactMetadata;
}

type ArtifactType = 
  | 'formation_evaluation'
  | 'porosity_analysis'
  | 'shale_volume_analysis'
  | 'saturation_analysis'
  | 'multi_well_correlation'
  | 'data_quality_assessment'
  | 'comprehensive_analysis'
  | 'error';

interface ArtifactMetadata {
  wellName?: string;
  wellNames?: string[];
  timestamp?: string;
  method?: string;
  parameters?: Record<string, any>;
  dataSource?: string;
}
\`\`\`

### 2. Visualization Data Models

\`\`\`typescript
interface ReservoirQualityMetrics {
  netToGross: number;
  averagePorosity: number;
  averagePermeability?: number;
  hydrocarbonSaturation: number;
  payThickness: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  completionRecommendations: string[];
}

interface DataQualityMetrics {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  curveQuality: CurveQualityMetric[];
  completeness: number;
  outliers: number;
  environmentalCorrections: string[];
  recommendations: string[];
}

interface CurveQualityMetric {
  curveName: string;
  completeness: number;
  outliers: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

interface MethodologyDocumentation {
  calculationType: string;
  method: string;
  formula: string;
  parameters: Record<string, any>;
  assumptions: string[];
  limitations: string[];
  industryReferences: string[];
  uncertaintyRange: [number, number];
}
\`\`\`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Artifact Structure Completeness

*For any* artifact returned by the agent, it must have a valid type string, a non-empty title string, and a data object
**Validates: Requirements 8.1**

### Property 2: Artifact Type Correctness

*For any* user request for formation evaluation, porosity, shale volume, saturation, correlation, or data quality, the returned artifact type must match the request type
**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**

### Property 3: Workflow Step Status Validity

*For any* workflow step in a formation evaluation artifact, the status must be one of 'success', 'warning', 'error', or 'pending'
**Validates: Requirements 1.3**

### Property 4: Chart Data Array Length Consistency

*For any* depth plot artifact, the depths array and all curve value arrays (porosity, shale volume, saturation) must have the same length
**Validates: Requirements 1.5, 1.6, 1.7, 2.2, 3.2, 4.2**

### Property 5: Statistical Summary Completeness

*For any* artifact with statistics, the statistics object must include mean, median, min, max, and standard deviation fields
**Validates: Requirements 2.3, 3.4, 4.4**

### Property 6: Porosity Data Completeness

*For any* porosity artifact, the data must include densityPorosity, neutronPorosity, and effectivePorosity arrays
**Validates: Requirements 2.2**

### Property 7: Shale Volume Data Completeness

*For any* shale volume artifact, the data must include gammaRay array, shaleVolume array, and cutoffs object with grClean and grShale values
**Validates: Requirements 3.5, 3.6, 3.7**

### Property 8: Saturation Data Completeness

*For any* saturation artifact, the data must include resistivity array, waterSaturation array, hydrocarbonSaturation array, and Archie parameters (rw, a, m, n)
**Validates: Requirements 4.5, 4.6**

### Property 9: Depth Ordering

*For any* depth array in an artifact, depths must be in ascending order (shallow to deep)
**Validates: Requirements 9.1**

### Property 10: Industry Color Scheme

*For any* chart using industry color scheme, GR curves must be green (#2ca02c), RHOB curves must be red (#d62728), NPHI curves must be blue (#1f77b4), and RT curves must be black (#000000)
**Validates: Requirements 9.2**

### Property 11: Shale Volume Color Fills

*For any* shale volume artifact, shale fills must be brown (#8c564b) and clean sand fills must be green (#2ca02c)
**Validates: Requirements 3.2**

### Property 12: Saturation Color Fills

*For any* saturation artifact, water fills must be blue (#1f77b4) and hydrocarbon fills must be green (#2ca02c)
**Validates: Requirements 4.2**

### Property 13: Artifact Router Mapping

*For any* recognized artifact type (formation_evaluation, porosity_analysis, shale_volume_analysis, saturation_analysis, multi_well_correlation, data_quality_assessment, comprehensive_analysis), the artifact router must route it to a corresponding renderer component
**Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9**

### Property 14: Unrecognized Artifact Fallback

*For any* unrecognized artifact type, the system must display the artifact without crashing and show the raw data
**Validates: Requirements 8.10**

### Property 15: Error Artifact Generation

*For any* MCP tool failure, the agent must return an artifact with type "error" and a non-empty error message
**Validates: Requirements 10.1**

### Property 16: Error Message Suggestions

*For any* error artifact for missing well data, the error message must include suggestions for available wells or valid queries
**Validates: Requirements 10.2, 10.3**

### Property 17: Partial Results Handling

*For any* calculation with missing curves, the system must return partial results with warnings rather than failing completely
**Validates: Requirements 10.5, 10.6**

### Property 18: Interval Depth Validity

*For any* clean sand interval or hydrocarbon zone, topDepth must be less than bottomDepth, and thickness must equal bottomDepth - topDepth
**Validates: Requirements 3.3, 4.3**

### Property 19: Porosity Value Range

*For any* porosity value in an artifact, the value must be between 0 and 1 (0% to 100%)
**Validates: Requirements 2.2**

### Property 20: Saturation Sum Constraint

*For any* depth point in a saturation artifact, waterSaturation + hydrocarbonSaturation must equal 1 (100%)
**Validates: Requirements 4.2**

## Error Handling

### 1. MCP Tool Failures

**Scenario**: MCP tool call fails or returns error

**Handling**:
- Catch error in agent
- Build error artifact with clear message
- Include suggestions for fixing (e.g., "Well WELL-999 not found. Available wells: WELL-001, WELL-002")
- Return artifact with type "error"
- Frontend displays error in Cloudscape Alert component

**Example**:
\`\`\`typescript
try {
  const result = await this.callMCPTool('calculate_porosity', { well_name: wellName });
  return this.buildPorosityArtifact(result);
} catch (error) {
  return {
    success: false,
    message: 'Porosity calculation failed',
    artifacts: [{
      type: 'error',
      title: 'Porosity Calculation Error',
      data: {
        error: error.message,
        wellName,
        suggestions: [
          'Verify well name is correct',
          'Check that well has RHOB and NPHI curves',
          'Try listing available wells first'
        ]
      }
    }]
  };
}
\`\`\`

### 2. Missing Data

**Scenario**: Well exists but missing required curves

**Handling**:
- Proceed with available data
- Mark missing sections with warnings
- Display partial results with Cloudscape Alert warnings
- Include recommendations for data acquisition

**Example**:
\`\`\`typescript
const artifact = {
  type: 'porosity_analysis',
  title: 'Porosity Analysis (Partial)',
  data: {
    ...porosityData,
    warnings: [
      'NPHI curve not available - neutron porosity not calculated',
      'Using density porosity only'
    ]
  }
};
\`\`\`

### 3. Rendering Failures

**Scenario**: Frontend component fails to render artifact

**Handling**:
- Catch error in ArtifactRenderer
- Display fallback UI with raw data
- Log error for debugging
- Show user-friendly error message

**Example**:
\`\`\`typescript
try {
  return <FormationEvaluationArtifact data={artifact.data} />;
} catch (error) {
  console.error('Artifact rendering failed:', error);
  return (
    <Container header={<Header variant="h2">Artifact Display Error</Header>}>
      <Alert type="error">
        Failed to render artifact. Displaying raw data below.
      </Alert>
      <pre>{JSON.stringify(artifact.data, null, 2)}</pre>
    </Container>
  );
}
\`\`\`

### 4. Chart Rendering Failures

**Scenario**: Plotly chart fails to render

**Handling**:
- Catch error in chart component
- Display data in Cloudscape Table as fallback
- Show warning about visualization failure
- Provide download option for raw data

## Testing Strategy

### Unit Testing

**Backend Artifact Builders**:
- Test each builder with valid MCP results
- Test with missing data scenarios
- Test with invalid data (negative porosity, etc.)
- Verify artifact structure matches interface

**Frontend Components**:
- Test each artifact renderer with valid data
- Test with missing optional fields
- Test with edge cases (empty arrays, null values)
- Verify Cloudscape components render correctly

### Integration Testing

**End-to-End Workflows**:
- User query → Agent → MCP → Artifact → Renderer → Display
- Test formation evaluation workflow
- Test porosity analysis workflow
- Test multi-well correlation workflow
- Verify artifacts display correctly in chat

**Error Scenarios**:
- Test with non-existent well names
- Test with missing curves
- Test with MCP server failures
- Verify error artifacts display correctly

### Visual Regression Testing

**Chart Rendering**:
- Capture screenshots of rendered artifacts
- Compare against baseline images
- Verify colors match industry standards
- Check depth axis is inverted
- Verify legends and labels are correct

### Property-Based Testing

**Artifact Structure**:
- Generate random valid artifacts
- Verify all properties hold
- Test with edge cases (single data point, large datasets)
- Verify no crashes with unexpected data

## Implementation Notes

### Backend Changes

1. **Modify EnhancedStrandsAgent**:
   - Replace `formatFormationEvaluationResults()` with `buildFormationEvaluationArtifact()`
   - Replace `formatPorosityResults()` with `buildPorosityArtifact()`
   - Replace all format methods with artifact builders
   - Return artifacts in `response.artifacts` array

2. **Create Artifact Builder Classes**:
   - Extract artifact building logic into separate classes
   - Make builders reusable across different handlers
   - Add validation for artifact data
   - Include metadata (well name, timestamp, method)

### Frontend Changes

1. **Create Artifact Renderer Components**:
   - Build React components for each artifact type
   - Use Cloudscape components for UI structure
   - Use Plotly for charts and visualizations
   - Make components responsive and accessible

2. **Update Chat Interface**:
   - Check for `response.artifacts` array
   - Route artifacts to ArtifactRenderer
   - Display artifacts inline with chat messages
   - Handle multiple artifacts in single response

3. **Add Chart Utilities**:
   - Create reusable Plotly configuration
   - Implement industry color schemes
   - Add depth plot utilities (inverted Y-axis)
   - Create fill utilities for shale/hydrocarbon highlighting

### Deployment Strategy

1. **Phase 1: Backend Artifact Building**
   - Implement artifact builders
   - Update agent to return artifacts
   - Test with existing frontend (artifacts ignored)
   - Deploy backend changes

2. **Phase 2: Frontend Rendering**
   - Implement artifact renderer components
   - Add Plotly charts
   - Test with real artifacts from backend
   - Deploy frontend changes

3. **Phase 3: Polish and Optimization**
   - Add loading states
   - Optimize chart rendering performance
   - Add export/download capabilities
   - Improve error messages

This phased approach allows testing backend changes before frontend is ready, minimizing risk of breaking existing functionality.
