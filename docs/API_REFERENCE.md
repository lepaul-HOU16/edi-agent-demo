# API Reference - Petrophysical Analysis System

## Overview

This document provides comprehensive API reference for the Professional Petrophysical Analysis System, covering all services, components, and interfaces.

## Core Services

### PetrophysicsCalculationEngine

The main calculation engine providing industry-standard petrophysical calculations.

#### Constructor
```typescript
new PetrophysicsCalculationEngine(config?: Partial<CalculationEngineConfig>)
```

#### Methods

##### `loadWellData(wellData: WellLogData): ValidationResult`
Loads and validates well log data.

**Parameters:**
- `wellData`: Complete well log data structure

**Returns:**
- `ValidationResult`: Validation status with errors and warnings

**Example:**
```typescript
const engine = new PetrophysicsCalculationEngine();
const validation = engine.loadWellData(wellData);

if (validation.isValid) {
  console.log('Well data loaded successfully');
} else {
  console.error('Validation errors:', validation.errors);
}
```

##### `validateCalculationParameters(method: string, parameters: CalculationParameters): ValidationResult`
Validates calculation parameters for a specific method.

**Parameters:**
- `method`: Calculation method name
- `parameters`: Parameter values to validate

**Returns:**
- `ValidationResult`: Parameter validation results

##### `calculateStatistics(data: number[], nullValue?: number): StatisticalSummary`
Calculates comprehensive statistics for a data array.

**Parameters:**
- `data`: Array of numerical values
- `nullValue`: Value to treat as null (default: -999.25)

**Returns:**
- `StatisticalSummary`: Complete statistical analysis

### PetrophysicsWorkflowOrchestrator

Orchestrates complete petrophysical analysis workflows.

#### Constructor
```typescript
new PetrophysicsWorkflowOrchestrator(config?: Partial<WorkflowConfig>)
```

#### Methods

##### `startCompleteWorkflow(wells, parameters, reportTemplates, exportFormats): Promise<WorkflowResult>`
Executes a complete petrophysical analysis workflow.

**Parameters:**
- `wells`: Array of WellLogData
- `parameters`: CalculationParameters
- `reportTemplates`: Array of template IDs
- `exportFormats`: Array of export format strings

**Returns:**
- `Promise<WorkflowResult>`: Complete workflow results

**Example:**
```typescript
const orchestrator = new PetrophysicsWorkflowOrchestrator();

const result = await orchestrator.startCompleteWorkflow(
  wells,
  { matrixDensity: 2.65, fluidDensity: 1.0, a: 1.0, m: 2.0, n: 2.0 },
  ['formation_evaluation', 'completion_design'],
  ['PDF', 'Excel', 'LAS']
);

console.log('Workflow completed:', result.state.status);
console.log('Generated reports:', result.reports.length);
```

##### `getWorkflowState(workflowId: string): WorkflowState | undefined`
Retrieves current workflow state.

##### `cancelWorkflow(workflowId: string): void`
Cancels an active workflow.

##### `getPerformanceReport(): any`
Gets comprehensive performance metrics.

## Calculation Services

### PorosityCalculator

Provides various porosity calculation methods.

#### Methods

##### `calculateDensityPorosity(rhobData, matrixDensity, fluidDensity): CalculationResult`
Calculates density porosity using bulk density log.

**Formula:** `φ = (ρma - ρb) / (ρma - ρf)`

**Parameters:**
- `rhobData`: Bulk density values
- `matrixDensity`: Matrix density (g/cc)
- `fluidDensity`: Fluid density (g/cc)

##### `calculateNeutronPorosity(nphiData, parameters): CalculationResult`
Calculates neutron porosity with environmental corrections.

### ShaleVolumeCalculator

Calculates shale volume using various methods.

#### Methods

##### `calculateLarionov(grData, grClean, grShale, age): CalculationResult`
Larionov shale volume calculation.

**Formula (Tertiary):** `Vsh = 0.083 * (2^(3.7 * IGR) - 1)`

**Parameters:**
- `grData`: Gamma ray values
- `grClean`: Clean sand GR value
- `grShale`: Shale GR value
- `age`: 'tertiary' or 'mesozoic'

##### `calculateClavier(grData, grClean, grShale): CalculationResult`
Clavier shale volume method.

### SaturationCalculator

Water saturation calculations using various equations.

#### Methods

##### `calculateArchie(rtData, porosityData, rw, a, m, n): CalculationResult`
Archie equation for water saturation.

**Formula:** `Sw = ((a * Rw) / (φ^m * Rt))^(1/n)`

**Parameters:**
- `rtData`: True resistivity values
- `porosityData`: Porosity values
- `rw`: Formation water resistivity
- `a`: Tortuosity factor
- `m`: Cementation exponent
- `n`: Saturation exponent

### PermeabilityCalculator

Permeability estimation methods.

#### Methods

##### `calculateTimur(porosityData, swirr): CalculationResult`
Timur permeability correlation.

**Formula:** `k = 0.136 * (φ^4.4) / (Swirr^2)`

## React Components

### LogPlotViewer

Professional log visualization component.

#### Props
```typescript
interface LogPlotViewerProps {
  wellData: WellLogData[];
  tracks: TrackConfig[];
  initialDepthRange?: DepthRange;
  height?: number;
  showDepthScale?: boolean;
  interactive?: boolean;
  showZoomControls?: boolean;
  showCalculationUpdates?: boolean;
  calculationParameters?: CalculationParameters;
  onDepthRangeChange?: (range: DepthRange) => void;
  onParameterChange?: (changes: ParameterChange[]) => void;
}
```

#### Usage
```typescript
<LogPlotViewer
  wellData={wells}
  tracks={trackConfigs}
  height={600}
  showZoomControls={true}
  showCalculationUpdates={true}
  calculationParameters={parameters}
  onParameterChange={handleParameterChange}
/>
```

### PetrophysicsAnalysisWorkflow

Complete workflow management component.

#### Props
```typescript
interface PetrophysicsAnalysisWorkflowProps {
  wells: WellLogData[];
  initialParameters?: CalculationParameters;
  onWorkflowComplete?: (result: WorkflowResult) => void;
  onError?: (error: string) => void;
  enableRealTimeUpdates?: boolean;
  autoStartWorkflow?: boolean;
}
```

#### Usage
```typescript
<PetrophysicsAnalysisWorkflow
  wells={wells}
  initialParameters={defaultParameters}
  onWorkflowComplete={handleComplete}
  enableRealTimeUpdates={true}
/>
```

## Data Types

### Core Interfaces

#### WellLogData
```typescript
interface WellLogData {
  wellName: string;
  wellInfo: WellHeaderInfo;
  curves: LogCurve[];
  depthRange: [number, number];
  dataQuality: QualityAssessment;
  lastModified: Date;
}
```

#### LogCurve
```typescript
interface LogCurve {
  name: string;
  unit: string;
  description: string;
  data: number[];
  nullValue: number;
  quality: CurveQuality;
  apiCode?: string;
}
```

#### CalculationParameters
```typescript
interface CalculationParameters {
  // Porosity parameters
  matrixDensity?: number;
  fluidDensity?: number;
  
  // Archie parameters
  a?: number;  // Tortuosity factor
  m?: number;  // Cementation exponent
  n?: number;  // Saturation exponent
  rw?: number; // Formation water resistivity
  
  // Shale volume parameters
  grClean?: number;
  grShale?: number;
  
  // Additional parameters
  [key: string]: any;
}
```

#### CalculationResults
```typescript
interface CalculationResults {
  wellName: string;
  calculationType: string;
  method: string;
  parameters: CalculationParameters;
  results: CalculationResult;
  statistics: StatisticalSummary;
  qualityMetrics: QualityMetrics;
  timestamp: Date;
}
```

### Workflow Types

#### WorkflowState
```typescript
interface WorkflowState {
  id: string;
  status: 'idle' | 'loading' | 'calculating' | 'generating_report' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  wells: WellLogData[];
  calculations: CalculationResults[];
  reservoirZones: ReservoirZone[];
  completionTargets: CompletionTarget[];
  errors: string[];
  warnings: string[];
}
```

#### WorkflowResult
```typescript
interface WorkflowResult {
  state: WorkflowState;
  reports: GeneratedReport[];
  exportedFiles: { [format: string]: string };
  visualizationData: any;
}
```

## Performance Optimization

### PetrophysicsPerformanceOptimizer

Advanced performance optimization system.

#### Methods

##### `cacheCalculationResult(key: string, result: CalculationResults): void`
Caches calculation results with advanced LRU eviction.

##### `getCachedCalculationResult(key: string): CalculationResults | undefined`
Retrieves cached calculation results.

##### `optimizeWellData(wellData: WellLogData): WellLogData`
Optimizes well data for memory efficiency.

##### `getPerformanceReport(): PerformanceReport`
Gets comprehensive performance metrics.

### Cache Configuration
```typescript
interface CacheConfig {
  maxSize: number;        // Maximum cache entries
  ttl: number;           // Time to live (ms)
  enableCompression: boolean;
  enablePersistence: boolean;
}
```

## Error Handling

### ErrorHandlingSystem

Comprehensive error handling with recovery options.

#### Methods

##### `handleError(error: Error | ErrorDetails, context?: any): Promise<boolean>`
Handles errors with automatic recovery attempts.

##### `showProgress(indicator: ProgressIndicator): void`
Shows progress indicator to user.

##### `showUserFeedback(feedback: UserFeedback): void`
Shows user feedback notifications.

### Error Types
```typescript
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ErrorCategory {
  DATA_VALIDATION = 'data_validation',
  CALCULATION = 'calculation',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  EXPORT = 'export',
  VISUALIZATION = 'visualization'
}
```

## Reporting System

### ReportTemplateEngine

Professional report generation system.

#### Methods

##### `generateReport(templateId: string, data: ReportData): GeneratedReport`
Generates report from template and data.

##### `registerTemplate(template: ReportTemplate): void`
Registers custom report template.

### Export Services

#### PDFGenerator
```typescript
generateReport(data: ReportData): Promise<string>
```

#### ExcelExporter
```typescript
exportAnalysisResults(data: ExportData): Promise<string>
```

#### LASExporter
```typescript
exportWithCalculatedCurves(well: WellLogData, calculations: CalculationResults[]): Promise<string>
```

## Validation Framework

### Industry Validation

#### Methods

##### `validateMethodology(method: string, parameters: any): ValidationResult`
Validates calculation methodology against industry standards.

##### `validateBenchmark(results: CalculationResults, benchmarkData: any): ValidationResult`
Compares results against benchmark data.

### Quality Control

#### Methods

##### `assessDataQuality(wellData: WellLogData): QualityAssessment`
Comprehensive data quality assessment.

##### `calculateUncertainty(results: CalculationResults): UncertaintyAnalysis`
Monte Carlo uncertainty analysis.

## Event System

### Workflow Events

The system emits various events for real-time updates:

```typescript
// Progress updates
orchestrator.on('progress', (update: ProgressUpdate) => {
  console.log(`${update.step}: ${update.progress}%`);
});

// Error events
orchestrator.on('workflow_error', ({ workflowId, error }) => {
  console.error(`Workflow ${workflowId} failed:`, error);
});

// Calculation updates
orchestrator.on('calculations_updated', ({ calculations }) => {
  console.log(`Updated ${calculations.length} calculations`);
});
```

### Error Handler Events

```typescript
// Error notifications
errorHandler.on('error', (errorDetails: ErrorDetails) => {
  // Handle error display
});

// User feedback
errorHandler.on('user_feedback', (feedback: UserFeedback) => {
  // Show user notification
});

// Progress indicators
errorHandler.on('progress_start', (progress: ProgressIndicator) => {
  // Show progress indicator
});
```

## Configuration

### System Configuration

```typescript
interface WorkflowConfig {
  enableRealTimeUpdates: boolean;
  autoSaveResults: boolean;
  cacheTimeout: number;
  maxConcurrentCalculations: number;
  enableProgressTracking: boolean;
  enableErrorRecovery: boolean;
  enablePerformanceOptimization: boolean;
  enableLazyLoading: boolean;
  enableMemoryOptimization: boolean;
}
```

### Performance Configuration

```typescript
interface PerformanceConfig {
  cache: {
    maxSize: number;
    ttl: number;
    enableCompression: boolean;
  };
  lazyLoading: {
    chunkSize: number;
    maxConcurrentLoads: number;
  };
  memory: {
    maxMemoryUsage: number;
    enableVirtualization: boolean;
  };
}
```

## Best Practices

### Performance Optimization

1. **Use Caching**: Enable calculation result caching for repeated operations
2. **Lazy Loading**: Load large datasets in chunks
3. **Memory Management**: Enable virtualization for large datasets
4. **Parallel Processing**: Use concurrent calculations within limits

### Error Handling

1. **Graceful Degradation**: Handle errors without stopping the workflow
2. **User Feedback**: Provide clear, actionable error messages
3. **Recovery Options**: Offer automatic and manual recovery actions
4. **Progress Tracking**: Show progress for long-running operations

### Data Quality

1. **Validation**: Always validate input data before processing
2. **Quality Metrics**: Monitor data completeness and quality
3. **Environmental Corrections**: Apply appropriate corrections
4. **Uncertainty Analysis**: Quantify calculation uncertainty

## Examples

### Complete Workflow Example

```typescript
import { 
  PetrophysicsWorkflowOrchestrator,
  WellLogData,
  CalculationParameters 
} from './services';

// Initialize orchestrator
const orchestrator = new PetrophysicsWorkflowOrchestrator({
  enableRealTimeUpdates: true,
  enablePerformanceOptimization: true,
  enableErrorRecovery: true
});

// Set up event listeners
orchestrator.on('progress', (update) => {
  console.log(`Progress: ${update.progress}% - ${update.message}`);
});

orchestrator.on('workflow_error', ({ error }) => {
  console.error('Workflow error:', error);
});

// Execute workflow
const wells: WellLogData[] = [/* well data */];
const parameters: CalculationParameters = {
  matrixDensity: 2.65,
  fluidDensity: 1.0,
  a: 1.0,
  m: 2.0,
  n: 2.0,
  rw: 0.1
};

try {
  const result = await orchestrator.startCompleteWorkflow(
    wells,
    parameters,
    ['formation_evaluation'],
    ['PDF', 'Excel']
  );
  
  console.log('Analysis complete!');
  console.log(`Processed ${result.state.wells.length} wells`);
  console.log(`Generated ${result.reports.length} reports`);
  console.log(`Exported to ${Object.keys(result.exportedFiles).length} formats`);
  
} catch (error) {
  console.error('Workflow failed:', error);
}
```

### React Component Example

```typescript
import React from 'react';
import { PetrophysicsAnalysisWorkflow } from './components';

function AnalysisPage() {
  const [wells, setWells] = useState<WellLogData[]>([]);
  
  const handleWorkflowComplete = (result: WorkflowResult) => {
    console.log('Workflow completed:', result);
    // Handle results
  };
  
  const handleError = (error: string) => {
    console.error('Workflow error:', error);
    // Handle error
  };
  
  return (
    <PetrophysicsAnalysisWorkflow
      wells={wells}
      initialParameters={{
        matrixDensity: 2.65,
        fluidDensity: 1.0,
        a: 1.0,
        m: 2.0,
        n: 2.0
      }}
      onWorkflowComplete={handleWorkflowComplete}
      onError={handleError}
      enableRealTimeUpdates={true}
    />
  );
}
```

### Custom Calculation Example

```typescript
import { PorosityCalculator } from './services/calculators';

const calculator = new PorosityCalculator();

// Density porosity calculation
const result = calculator.calculateDensityPorosity(
  rhobData,     // Bulk density values
  2.65,         // Matrix density (g/cc)
  1.0           // Fluid density (g/cc)
);

console.log('Porosity results:', result.values);
console.log('Quality metrics:', result.quality);
console.log('Uncertainty:', result.uncertainty);
```

## Error Codes

### Common Error Codes

| Code | Category | Description | Recovery Actions |
|------|----------|-------------|------------------|
| `DATA_VALIDATION_ERROR` | Data Validation | Invalid or missing curve data | Check LAS file format, verify required curves |
| `CALCULATION_ERROR` | Calculation | Calculation method failed | Verify parameters, try alternative methods |
| `NETWORK_ERROR` | Network | Connection or timeout issues | Check connection, retry operation |
| `MEMORY_ERROR` | Performance | Insufficient memory | Reduce dataset size, enable compression |
| `EXPORT_ERROR` | Export | File generation failed | Check permissions, verify output format |

### Error Severity Levels

- **CRITICAL**: System cannot continue, immediate action required
- **HIGH**: Major functionality impacted, user intervention needed
- **MEDIUM**: Some functionality affected, workarounds available
- **LOW**: Minor issues, system continues normally

## Performance Metrics

### Key Performance Indicators

- **Cache Hit Rate**: Percentage of cached calculation retrievals
- **Average Calculation Time**: Mean time for calculation completion
- **Memory Usage**: Current system memory consumption
- **Queue Length**: Number of pending operations
- **Error Rate**: Percentage of failed operations

### Optimization Recommendations

- **Cache Hit Rate < 70%**: Increase cache size or TTL
- **Calculation Time > 1000ms**: Enable parallelization or optimization
- **Memory Usage > 500MB**: Enable compression or virtualization
- **Queue Length > 10**: Increase concurrent processing limits

## Troubleshooting

### Common Issues

#### "Calculation failed" errors
- **Cause**: Missing required curves or invalid parameters
- **Solution**: Verify input data completeness and parameter ranges

#### "Memory exceeded" warnings
- **Cause**: Large datasets exceeding memory limits
- **Solution**: Enable memory optimization or process in smaller chunks

#### "Export failed" errors
- **Cause**: File system permissions or invalid data
- **Solution**: Check output directory permissions and data validity

### Debug Mode

Enable debug logging:
```typescript
const orchestrator = new PetrophysicsWorkflowOrchestrator({
  enableProgressTracking: true,
  logErrors: true
});
```

## Version History

### v1.0.0 - Initial Release
- Complete workflow integration
- Professional log visualization
- Comprehensive calculation suite
- Advanced reporting system
- Performance optimization
- Error handling framework

### Future Versions
- Machine learning integration
- Cloud-native optimizations
- Mobile responsive design
- Enhanced collaboration features

---

For more detailed information, see the [System Documentation](./PETROPHYSICAL_ANALYSIS_SYSTEM.md).