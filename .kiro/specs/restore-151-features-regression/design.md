# Design Document

## Overview

This design addresses the complete restoration and enhancement of the renewable energy capabilities within the AWS Energy Data Insights platform. The solution encompasses fixing the 151 features regression, implementing the full renewable energy demo workflow with advanced visualizations, establishing proper intent detection, and creating a cohesive user experience using progressive disclosure patterns with the Cloudscape design system.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDI Platform Frontend                        │
├─────────────────────────────────────────────────────────────────┤
│  Chat Interface with Progressive Disclosure                     │
│  ├── Intent Detection Engine (Fixed)                           │
│  ├── Renewable Workflow Orchestrator                           │
│  └── Cloudscape UI Components                                  │
├─────────────────────────────────────────────────────────────────┤
│  Renewable Energy Visualization Suite                          │
│  ├── Terrain Analysis (151+ Features)                          │
│  ├── Wind Rose Analysis                                        │
│  ├── Wake Analysis                                             │
│  ├── Layout Optimization                                       │
│  └── Site Suitability Scoring                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
├─────────────────────────────────────────────────────────────────┤
│  Renewable Agent Orchestrator                                  │
│  ├── Intent Classification Service                             │
│  ├── Terrain Analysis Service (OSM Integration)                │
│  ├── Wind Analysis Service                                     │
│  ├── Layout Optimization Service                               │
│  └── Visualization Generation Service                          │
├─────────────────────────────────────────────────────────────────┤
│  External Data Sources                                         │
│  ├── OpenStreetMap Overpass API (Real Data)                   │
│  ├── Wind Resource Databases                                  │
│  ├── Terrain Elevation Services                               │
│  └── Regulatory Constraint Databases                          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Intent Detection Engine (Critical Fix)

**Purpose**: Correctly route renewable energy queries to appropriate analysis tools

**Current Problem**: All renewable prompts route to terrain analysis
**Solution**: Implement specific pattern matching for each renewable analysis type

**Interface Design**:
```typescript
interface RenewableIntentClassifier {
  classifyIntent(query: string): RenewableAnalysisType;
  getConfidenceScore(query: string, intent: RenewableAnalysisType): number;
  suggestAlternatives(query: string): RenewableAnalysisType[];
}

enum RenewableAnalysisType {
  TERRAIN_ANALYSIS = 'terrain_analysis',
  WIND_ROSE_ANALYSIS = 'wind_rose_analysis', 
  WAKE_ANALYSIS = 'wake_analysis',
  LAYOUT_OPTIMIZATION = 'layout_optimization',
  SITE_SUITABILITY = 'site_suitability',
  COMPREHENSIVE_ASSESSMENT = 'comprehensive_assessment'
}
```

**Pattern Matching Strategy**:
```typescript
const intentPatterns = {
  terrain_analysis: [
    /terrain.*analysis/i,
    /site.*terrain/i,
    /topography/i,
    /elevation.*profile/i,
    /osm.*features/i,
    /buildings.*roads.*water/i
  ],
  wind_rose_analysis: [
    /wind.*rose/i,
    /wind.*direction/i,
    /wind.*speed.*distribution/i,
    /prevailing.*wind/i,
    /seasonal.*wind/i
  ],
  wake_analysis: [
    /wake.*effect/i,
    /turbine.*interaction/i,
    /wake.*modeling/i,
    /downstream.*impact/i,
    /wake.*loss/i
  ],
  layout_optimization: [
    /layout.*optimization/i,
    /turbine.*placement/i,
    /spacing.*optimization/i,
    /array.*design/i,
    /optimal.*layout/i
  ],
  site_suitability: [
    /site.*suitability/i,
    /feasibility.*analysis/i,
    /site.*assessment/i,
    /development.*potential/i,
    /overall.*scoring/i
  ]
};
```

### 2. Terrain Analysis Service (151+ Features Restoration)

**Purpose**: Restore full OpenStreetMap integration with comprehensive terrain feature overlays

**Key Components**:
- **OSM Client**: Enhanced error handling and retry logic
- **Feature Processor**: Geometry validation and classification
- **Visualization Generator**: HTML map generation with overlays
- **Fallback Handler**: Clear synthetic data labeling when needed

**Data Flow**:
```
User Query → Intent Detection → Terrain Service → OSM Client → Feature Processing → Map Generation → UI Rendering
```

**Feature Classification Enhancement**:
```python
class TerrainFeatureClassifier:
    def classify_features(self, osm_elements: List[Dict]) -> List[TerrainFeature]:
        """Enhanced classification for wind farm planning"""
        classifications = {
            'buildings': self._classify_buildings,
            'transportation': self._classify_transportation,
            'water_bodies': self._classify_water,
            'power_infrastructure': self._classify_power,
            'protected_areas': self._classify_protected,
            'industrial_zones': self._classify_industrial
        }
        
    def _calculate_wind_impact(self, feature: TerrainFeature) -> WindImpactAssessment:
        """Calculate wind flow impact for each feature"""
        return WindImpactAssessment(
            turbulence_factor=self._get_turbulence_factor(feature),
            setback_distance=self._get_required_setback(feature),
            exclusion_reason=self._get_exclusion_reason(feature)
        )
```

### 3. Progressive Disclosure Workflow Orchestrator

**Purpose**: Guide users through renewable energy analysis with progressive complexity

**Workflow Design**:
```typescript
interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  nextSteps: WorkflowStep[];
  prerequisites: string[];
  callToAction: CallToActionConfig;
}

interface CallToActionConfig {
  position: 'bottom' | 'inline';
  buttons: ActionButton[];
  guidance: string;
}

const renewableWorkflow: WorkflowStep[] = [
  {
    id: 'site_selection',
    title: 'Site Selection & Initial Assessment',
    component: SiteSelectionComponent,
    nextSteps: ['terrain_analysis', 'wind_resource_assessment'],
    callToAction: {
      position: 'bottom',
      buttons: [
        { label: 'Analyze Terrain', action: 'terrain_analysis' },
        { label: 'Assess Wind Resource', action: 'wind_resource' }
      ],
      guidance: 'Start with terrain analysis to understand site constraints, or assess wind resource for energy potential.'
    }
  },
  {
    id: 'terrain_analysis',
    title: 'Terrain & Constraint Analysis',
    component: TerrainAnalysisComponent,
    nextSteps: ['wind_rose_analysis', 'layout_optimization'],
    callToAction: {
      position: 'bottom',
      buttons: [
        { label: 'Analyze Wind Patterns', action: 'wind_rose_analysis' },
        { label: 'Optimize Layout', action: 'layout_optimization' }
      ],
      guidance: 'Now that you understand terrain constraints, analyze wind patterns or proceed to layout optimization.'
    }
  }
  // ... additional workflow steps
];
```

### 4. Advanced Visualization Suite

**Purpose**: Implement all renewable energy visualization capabilities with Cloudscape integration

#### Wind Rose Analysis Component
```typescript
interface WindRoseVisualizationProps {
  windData: WindResourceData;
  location: GeographicLocation;
  timeRange: DateRange;
  onAnalysisComplete: (results: WindRoseResults) => void;
}

const WindRoseVisualization: React.FC<WindRoseVisualizationProps> = ({
  windData,
  location,
  timeRange,
  onAnalysisComplete
}) => {
  return (
    <Container>
      <Header variant="h2">Wind Rose Analysis</Header>
      <SpaceBetween direction="vertical" size="l">
        <WindRoseChart data={windData} />
        <WindStatisticsTable data={windData} />
        <Box float="right">
          <SpaceBetween direction="horizontal" size="s">
            <Button onClick={() => exportResults()}>Export Results</Button>
            <Button variant="primary" onClick={() => proceedToWakeAnalysis()}>
              Analyze Wake Effects
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  );
};
```

#### Wake Analysis Component
```typescript
interface WakeAnalysisProps {
  turbineLayout: TurbineLayout;
  windData: WindResourceData;
  terrainData: TerrainData;
}

const WakeAnalysisVisualization: React.FC<WakeAnalysisProps> = ({
  turbineLayout,
  windData,
  terrainData
}) => {
  return (
    <Container>
      <Header variant="h2">Wake Effect Analysis</Header>
      <SpaceBetween direction="vertical" size="l">
        <WakeVisualizationChart 
          layout={turbineLayout}
          windData={windData}
          terrainData={terrainData}
        />
        <WakeImpactMetrics layout={turbineLayout} />
        <ProgressiveDisclosure>
          <WakeOptimizationRecommendations />
        </ProgressiveDisclosure>
        <Box float="right">
          <SpaceBetween direction="horizontal" size="s">
            <Button onClick={() => optimizeLayout()}>Optimize Layout</Button>
            <Button variant="primary" onClick={() => generateReport()}>
              Generate Report
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  );
};
```

### 5. Layout Optimization Service

**Purpose**: Provide turbine layout optimization with spacing recommendations

**Algorithm Design**:
```python
class LayoutOptimizer:
    def optimize_layout(
        self,
        site_boundary: Polygon,
        terrain_constraints: List[TerrainFeature],
        wind_data: WindResourceData,
        turbine_specs: TurbineSpecification
    ) -> OptimizedLayout:
        """
        Multi-objective optimization considering:
        - Energy yield maximization
        - Wake loss minimization  
        - Terrain constraint avoidance
        - Regulatory setback compliance
        """
        
        # Generate candidate positions
        candidate_positions = self._generate_candidate_grid(site_boundary)
        
        # Filter by constraints
        valid_positions = self._filter_by_constraints(
            candidate_positions, 
            terrain_constraints
        )
        
        # Optimize using genetic algorithm
        optimized_layout = self._genetic_optimization(
            valid_positions,
            wind_data,
            turbine_specs
        )
        
        return OptimizedLayout(
            turbine_positions=optimized_layout,
            energy_yield=self._calculate_energy_yield(optimized_layout),
            wake_losses=self._calculate_wake_losses(optimized_layout),
            constraint_compliance=self._validate_constraints(optimized_layout)
        )
```

### 6. Site Suitability Scoring System

**Purpose**: Comprehensive site assessment with professional scoring methodology

**Scoring Framework**:
```typescript
interface SuitabilityScoring {
  overall_score: number; // 0-100
  component_scores: {
    wind_resource: number;
    terrain_suitability: number;
    grid_connectivity: number;
    environmental_impact: number;
    regulatory_compliance: number;
    economic_viability: number;
  };
  risk_factors: RiskFactor[];
  recommendations: string[];
}

class SuitabilityAssessment {
  calculateSuitability(
    windData: WindResourceData,
    terrainData: TerrainData,
    constraints: ConstraintData
  ): SuitabilityScoring {
    // Weighted scoring algorithm
    const weights = {
      wind_resource: 0.30,
      terrain_suitability: 0.25,
      grid_connectivity: 0.15,
      environmental_impact: 0.15,
      regulatory_compliance: 0.10,
      economic_viability: 0.05
    };
    
    // Calculate component scores and overall weighted score
  }
}
```

## Data Models

### Enhanced Terrain Feature Model
```typescript
interface TerrainFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: {
    feature_type: TerrainFeatureType;
    osm_id: string;
    name: string;
    tags: Record<string, string>;
    wind_impact: WindImpactAssessment;
    setback_requirements: SetbackRequirements;
    exclusion_zone: GeoJSON.Polygon;
    data_source: 'openstreetmap' | 'synthetic_fallback';
    reliability: 'high' | 'medium' | 'low';
  };
}

interface WindImpactAssessment {
  turbulence_factor: number; // 0-1 scale
  wake_influence: 'high' | 'medium' | 'low';
  flow_disruption: FlowDisruptionPattern;
  recommended_setback_m: number;
}
```

### Renewable Analysis Result Model
```typescript
interface RenewableAnalysisResult {
  analysis_type: RenewableAnalysisType;
  location: GeographicLocation;
  timestamp: string;
  results: {
    visualizations: VisualizationArtifact[];
    metrics: AnalysisMetrics;
    recommendations: Recommendation[];
    next_steps: WorkflowStep[];
  };
  data_quality: DataQualityAssessment;
}
```

## Error Handling

### Comprehensive Error Recovery Strategy

```typescript
class RenewableAnalysisErrorHandler {
  handleAnalysisError(error: AnalysisError, context: AnalysisContext): ErrorResponse {
    switch (error.type) {
      case 'OSM_API_ERROR':
        return this.handleOSMError(error, context);
      case 'INTENT_DETECTION_ERROR':
        return this.handleIntentError(error, context);
      case 'VISUALIZATION_ERROR':
        return this.handleVisualizationError(error, context);
      case 'DATA_QUALITY_ERROR':
        return this.handleDataQualityError(error, context);
    }
  }
  
  private handleOSMError(error: OSMError, context: AnalysisContext): ErrorResponse {
    // Log specific OSM error details
    logger.error('OSM API Error', {
      endpoint: error.endpoint,
      status_code: error.status_code,
      query: context.query,
      location: context.location
    });
    
    // Attempt fallback strategies
    if (error.status_code === 429) {
      return this.scheduleRetryWithBackoff(context);
    }
    
    if (error.status_code >= 500) {
      return this.tryAlternativeEndpoint(context);
    }
    
    // Final fallback with clear labeling
    return this.createSyntheticFallback(context, error.message);
  }
}
```

### Progressive Fallback Strategy

1. **Primary**: Real OSM data with full feature set (151+ features)
2. **Secondary**: Cached OSM data from previous successful queries
3. **Tertiary**: Reduced feature set with essential constraints only
4. **Final**: Clearly labeled synthetic data with error explanation

## Testing Strategy

### 1. Intent Detection Testing
```typescript
describe('RenewableIntentClassifier', () => {
  test('should route terrain queries to terrain analysis', () => {
    const query = "Analyze terrain for wind farm at coordinates 40.7128, -74.0060";
    const intent = classifier.classifyIntent(query);
    expect(intent).toBe(RenewableAnalysisType.TERRAIN_ANALYSIS);
  });
  
  test('should route wind rose queries to wind analysis', () => {
    const query = "Show me wind rose analysis for this location";
    const intent = classifier.classifyIntent(query);
    expect(intent).toBe(RenewableAnalysisType.WIND_ROSE_ANALYSIS);
  });
  
  test('should not route all renewable queries to terrain', () => {
    const queries = [
      "wind rose analysis",
      "wake effect modeling", 
      "layout optimization",
      "site suitability"
    ];
    
    queries.forEach(query => {
      const intent = classifier.classifyIntent(query);
      expect(intent).not.toBe(RenewableAnalysisType.TERRAIN_ANALYSIS);
    });
  });
});
```

### 2. OSM Integration Testing
```typescript
describe('OSM Integration', () => {
  test('should retrieve 100+ features for typical locations', async () => {
    const result = await osmClient.queryTerrainFeatures(40.7128, -74.0060, 5.0);
    expect(result.features.length).toBeGreaterThan(100);
    expect(result.metadata.data_source).toBe('openstreetmap');
  });
  
  test('should handle API failures gracefully', async () => {
    // Mock API failure
    mockOSMAPI.mockRejectedValue(new OSMAPIError('Service unavailable', 503));
    
    const result = await osmClient.queryTerrainFeatures(40.7128, -74.0060, 5.0);
    expect(result.metadata.data_source).toBe('synthetic_fallback');
    expect(result.metadata.error_reason).toContain('Service unavailable');
  });
});
```

### 3. Visualization Integration Testing
```typescript
describe('Renewable Visualizations', () => {
  test('should render wind rose with real data', () => {
    const windData = generateMockWindData();
    render(<WindRoseVisualization windData={windData} />);
    
    expect(screen.getByText('Wind Rose Analysis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze Wake Effects' })).toBeInTheDocument();
  });
  
  test('should show call-to-action at bottom of visualization', () => {
    render(<TerrainAnalysisComponent />);
    
    const callToAction = screen.getByTestId('call-to-action');
    expect(callToAction).toHaveClass('bottom-positioned');
  });
});
```

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. **Fix Intent Detection**: Implement proper pattern matching for renewable analysis types
2. **Restore OSM Integration**: Fix Lambda function errors and restore 151+ feature retrieval
3. **Fix Terrain Overlays**: Ensure proper rendering of buildings, roads, water bodies

### Phase 2: Core Workflow (Week 2)
1. **Implement Progressive Disclosure**: Create workflow orchestrator with step-by-step guidance
2. **Wind Rose Analysis**: Complete wind rose visualization with Cloudscape integration
3. **Wake Analysis**: Implement wake effect modeling and visualization

### Phase 3: Advanced Features (Week 3)
1. **Layout Optimization**: Implement turbine placement optimization algorithms
2. **Site Suitability**: Create comprehensive scoring system
3. **Call-to-Action Integration**: Add bottom-positioned guidance buttons

### Phase 4: Polish & Validation (Week 4)
1. **Code Quality**: Fix bad patterns consistently across all components
2. **Error Handling**: Implement comprehensive error recovery
3. **End-to-End Testing**: Validate complete demo workflow
4. **Performance Optimization**: Ensure responsive performance

## Success Metrics

### Functional Metrics
- **Feature Count**: 100+ real terrain features for typical locations
- **Intent Accuracy**: >95% correct routing for renewable analysis types
- **Visualization Completeness**: All advanced visualizations (wind rose, wake, layout) functional
- **Workflow Completion**: 100% of demo steps working end-to-end

### User Experience Metrics
- **Progressive Disclosure**: Clear step-by-step guidance with appropriate complexity revelation
- **Call-to-Action Effectiveness**: Users successfully navigate to next steps
- **Error Recovery**: Graceful handling of failures with clear user guidance
- **Design Consistency**: 100% Cloudscape component usage

### Technical Metrics
- **Code Quality**: Zero bad patterns, consistent error handling
- **Performance**: <3s response time for visualizations
- **Reliability**: <1% fallback to synthetic data
- **Maintainability**: Clear separation of concerns, reusable components

## Risk Mitigation

### Technical Risks
- **OSM API Reliability**: Multiple endpoint fallbacks, retry logic, caching
- **Visualization Complexity**: Progressive loading, error boundaries, fallback components
- **Intent Detection Accuracy**: Comprehensive pattern testing, confidence scoring
- **Performance Issues**: Lazy loading, data pagination, optimization

### User Experience Risks
- **Workflow Confusion**: Clear guidance, contextual help, progress indicators
- **Feature Overwhelm**: Progressive disclosure, guided workflows
- **Error Frustration**: Meaningful error messages, recovery suggestions
- **Inconsistent Interface**: Strict Cloudscape adherence, design system validation