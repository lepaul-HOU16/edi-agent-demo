# Design Document

## Overview

This design enhances the user experience across all conversational agents by implementing verbose real-time chain of thought displays, instant input clearing, and ensuring all petrophysics results render in Cloudscape components. The design maintains the existing architecture while adding transparency and responsiveness improvements.

## Architecture

### High-Level Flow

```
User Input → Instant Clear → Agent Processing → Real-Time Thought Steps → Cloudscape Rendering
     ↓              ↓                ↓                    ↓                        ↓
  ChatBox      State Update    Enhanced Agent      Streaming Display      Component Selection
```

### Component Hierarchy

```
ChatPage
├── ChatBox (Input Component)
│   ├── Input Field (Instant Clear)
│   └── Submit Handler
├── ChatMessage (Display Component)
│   ├── ThoughtStepDisplay (Real-Time)
│   ├── ArtifactProcessor
│   └── CloudscapeRenderer
└── Agent Layer
    ├── EnhancedStrandsAgent (Petrophysics)
    ├── GeneralKnowledgeAgent
    ├── MaintenanceAgent
    ├── RenewableProxyAgent
    └── EDIcraftAgent
```

## Components and Interfaces

### 1. Input Clearing Enhancement

**Component:** `ChatBox.tsx` / `CatalogChatBoxCloudscape.tsx`

**Current Behavior:**
- Input clears after message is sent to backend
- Delay of ~200-500ms due to async operations

**Enhanced Behavior:**
```typescript
interface InputClearingConfig {
  clearTiming: 'immediate' | 'after-validation' | 'after-send';
  clearDelay: number; // milliseconds (target: < 50ms)
  maintainFocus: boolean;
  visualFeedback: 'subtle' | 'none';
}

const handleSubmit = async (message: string) => {
  // 1. Validate input (synchronous)
  if (!message.trim()) return;
  
  // 2. Clear input IMMEDIATELY (< 50ms)
  setUserInput('');
  
  // 3. Provide visual feedback
  setSubmitting(true);
  
  // 4. Send message (async, doesn't block UI)
  sendMessageAsync(message);
  
  // 5. Maintain focus for next input
  inputRef.current?.focus();
};
```

**Implementation Details:**
- Use controlled component pattern with immediate state update
- Separate validation from submission
- Use `useRef` for input element to maintain focus
- Add subtle CSS transition for smooth clearing

### 2. Verbose Thought Step Generation

**Component:** All Agent Classes

**Enhanced Thought Step Structure:**
```typescript
interface VerboseThoughtStep {
  id: string;
  type: 'data_access' | 'parsing' | 'calculation' | 'validation' | 'artifact_generation' | 'completion';
  timestamp: number;
  title: string; // Descriptive, not generic
  summary: string; // Detailed explanation
  details?: {
    operation?: string; // Specific operation name
    dataPoints?: number; // Count of data processed
    parameters?: Record<string, any>; // Calculation parameters
    source?: string; // Data source (S3 bucket/key)
    duration?: number; // Operation duration in ms
    metrics?: Record<string, number>; // Quality metrics
    reasoning?: string; // Decision reasoning
  };
  status: 'in_progress' | 'complete' | 'error';
  progress?: number; // 0-100 for long operations
}
```

**Example Thought Steps for Porosity Calculation:**

```typescript
// Step 1: Data Access
{
  id: 'step-1',
  type: 'data_access',
  timestamp: Date.now(),
  title: 'Retrieving Well Log Data',
  summary: 'Fetching LAS file from S3 storage',
  details: {
    operation: 'S3 GetObject',
    source: 's3://bucket/global/well-data/WELL-001.las',
    duration: 234
  },
  status: 'complete'
}

// Step 2: Parsing
{
  id: 'step-2',
  type: 'parsing',
  timestamp: Date.now(),
  title: 'Parsing Well Log Data',
  summary: 'Extracted 5 curves from LAS file with 2,847 depth points',
  details: {
    operation: 'LAS Parser',
    dataPoints: 2847,
    parameters: {
      curves: ['DEPT', 'GR', 'RHOB', 'NPHI', 'RT'],
      depthRange: [1000, 3847]
    }
  },
  status: 'complete'
}

// Step 3: Calculation
{
  id: 'step-3',
  type: 'calculation',
  timestamp: Date.now(),
  title: 'Calculating Density Porosity',
  summary: 'Applying density porosity formula with matrix density 2.65 g/cc and fluid density 1.0 g/cc',
  details: {
    operation: 'Density Porosity Calculation',
    dataPoints: 2847,
    parameters: {
      method: 'density',
      matrixDensity: 2.65,
      fluidDensity: 1.0
    },
    reasoning: 'Selected density method based on available RHOB curve and standard sandstone matrix'
  },
  status: 'complete'
}

// Step 4: Validation
{
  id: 'step-4',
  type: 'validation',
  timestamp: Date.now(),
  title: 'Validating Data Quality',
  summary: 'Data completeness: 94.2%, Outliers detected: 12 points (0.4%)',
  details: {
    operation: 'Quality Assessment',
    metrics: {
      completeness: 94.2,
      outlierCount: 12,
      outlierPercentage: 0.4,
      validPoints: 2682,
      nullPoints: 165
    }
  },
  status: 'complete'
}

// Step 5: Artifact Generation
{
  id: 'step-5',
  type: 'artifact_generation',
  timestamp: Date.now(),
  title: 'Generating Visualization Artifact',
  summary: 'Created porosity log plot with 2,682 valid data points',
  details: {
    operation: 'Artifact Creation',
    dataPoints: 2682,
    parameters: {
      artifactType: 'porosity_calculation',
      includeStatistics: true,
      includeMethodology: true
    }
  },
  status: 'complete'
}
```

### 3. Real-Time Thought Step Streaming

**Component:** `ChatMessage.tsx` and Agent Handlers

**Streaming Architecture:**
```typescript
interface ThoughtStepStream {
  sessionId: string;
  messageId: string;
  steps: VerboseThoughtStep[];
  onStepAdded: (step: VerboseThoughtStep) => void;
  onStepUpdated: (stepId: string, updates: Partial<VerboseThoughtStep>) => void;
}

// Agent-side streaming
class EnhancedStrandsAgent {
  private thoughtStepCallbacks: ((step: VerboseThoughtStep) => void)[] = [];
  
  addThoughtStep(step: VerboseThoughtStep) {
    // Add to internal array
    this.thoughtSteps.push(step);
    
    // Immediately notify all listeners
    this.thoughtStepCallbacks.forEach(callback => callback(step));
    
    // Log for debugging
    console.log('🧠 THOUGHT STEP:', step.title, step.summary);
  }
  
  updateThoughtStep(stepId: string, updates: Partial<VerboseThoughtStep>) {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (step) {
      Object.assign(step, updates);
      this.thoughtStepCallbacks.forEach(callback => callback(step));
    }
  }
}

// Frontend-side display
const ThoughtStepDisplay = ({ steps }: { steps: VerboseThoughtStep[] }) => {
  const [displayedSteps, setDisplayedSteps] = useState<VerboseThoughtStep[]>([]);
  
  useEffect(() => {
    // Animate new steps appearing
    if (steps.length > displayedSteps.length) {
      const newSteps = steps.slice(displayedSteps.length);
      newSteps.forEach((step, index) => {
        setTimeout(() => {
          setDisplayedSteps(prev => [...prev, step]);
        }, index * 100); // Stagger by 100ms
      });
    }
  }, [steps]);
  
  return (
    <div className="thought-steps">
      {displayedSteps.map(step => (
        <ThoughtStepCard key={step.id} step={step} />
      ))}
    </div>
  );
};
```

### 4. Cloudscape Component Rendering

**Component:** `PetrophysicsCloudscapeRenderer.tsx` (new)

**Artifact Type Mapping:**
```typescript
interface CloudscapeRenderingMap {
  'porosity_calculation': CloudscapePorosityDisplay;
  'shale_volume_calculation': CloudscapeShaleVolumeDisplay;
  'saturation_calculation': CloudscapeSaturationDisplay;
  'data_quality_assessment': CloudscapeDataQualityDisplay;
  'comprehensive_analysis': CloudscapeComprehensiveDisplay;
}

const CloudscapePorosityDisplay = ({ artifact }: { artifact: any }) => {
  return (
    <Container header={<Header variant="h2">Porosity Analysis Results</Header>}>
      <SpaceBetween size="l">
        {/* Statistics Section */}
        <Container header={<Header variant="h3">Statistical Summary</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Mean Porosity</Box>
              <Box variant="awsui-value-large">{artifact.statistics.mean.toFixed(3)}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Std Deviation</Box>
              <Box variant="awsui-value-large">{artifact.statistics.stdDev.toFixed(3)}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Min Value</Box>
              <Box variant="awsui-value-large">{artifact.statistics.min.toFixed(3)}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Max Value</Box>
              <Box variant="awsui-value-large">{artifact.statistics.max.toFixed(3)}</Box>
            </div>
          </ColumnLayout>
        </Container>
        
        {/* Data Quality Section */}
        <Container header={<Header variant="h3">Data Quality</Header>}>
          <ProgressBar
            value={artifact.quality.completeness}
            label="Data Completeness"
            description={`${artifact.quality.validPoints} of ${artifact.quality.totalPoints} points valid`}
          />
        </Container>
        
        {/* Methodology Section */}
        <ExpandableSection headerText="Calculation Methodology" variant="container">
          <SpaceBetween size="s">
            <KeyValuePairs
              columns={2}
              items={[
                { label: 'Method', value: artifact.method },
                { label: 'Matrix Density', value: `${artifact.parameters.matrixDensity} g/cc` },
                { label: 'Fluid Density', value: `${artifact.parameters.fluidDensity} g/cc` },
                { label: 'Standard', value: 'SPE/API RP 40' }
              ]}
            />
          </SpaceBetween>
        </ExpandableSection>
        
        {/* Visualization Section */}
        <Container header={<Header variant="h3">Porosity Log Plot</Header>}>
          <PlotlyChart data={artifact.plotData} />
        </Container>
      </SpaceBetween>
    </Container>
  );
};
```

### 5. Agent Enhancement Pattern

**All agents follow this pattern:**

```typescript
abstract class BaseEnhancedAgent {
  protected thoughtSteps: VerboseThoughtStep[] = [];
  
  protected addThoughtStep(
    type: VerboseThoughtStep['type'],
    title: string,
    summary: string,
    details?: VerboseThoughtStep['details']
  ): VerboseThoughtStep {
    const step: VerboseThoughtStep = {
      id: `step-${Date.now()}-${Math.random()}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      details,
      status: 'in_progress'
    };
    
    this.thoughtSteps.push(step);
    console.log(`🧠 [${this.constructor.name}] ${title}: ${summary}`);
    
    return step;
  }
  
  protected completeThoughtStep(stepId: string, additionalDetails?: any) {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (step) {
      step.status = 'complete';
      if (additionalDetails) {
        step.details = { ...step.details, ...additionalDetails };
      }
    }
  }
  
  protected errorThoughtStep(stepId: string, error: string) {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (step) {
      step.status = 'error';
      step.details = { ...step.details, error };
    }
  }
}
```

## Data Models

### Enhanced Message Schema

```typescript
interface EnhancedMessage {
  id: string;
  role: 'human' | 'ai' | 'tool';
  content: {
    text: string;
  };
  artifacts?: Artifact[];
  thoughtSteps?: VerboseThoughtStep[]; // Enhanced with verbose details
  sourceAttribution?: SourceAttribution[];
  chatSessionId: string;
  createdAt: string;
  responseComplete: boolean;
}
```

### Artifact Schema with Cloudscape Metadata

```typescript
interface CloudscapeArtifact {
  type: string;
  messageContentType: string;
  title: string;
  subtitle?: string;
  data: any;
  renderingHints: {
    componentType: 'table' | 'chart' | 'keyvalue' | 'container' | 'tabs';
    layout: 'single' | 'grid' | 'stacked';
    expandable: boolean;
    defaultExpanded: boolean;
  };
  metadata: {
    dataSource: string; // S3 key or API endpoint
    generatedAt: string;
    dataPoints: number;
    quality: {
      completeness: number;
      confidence: 'high' | 'medium' | 'low';
    };
  };
}
```

## Error Handling

### Thought Step Error Display

```typescript
const ErrorThoughtStep = ({ step }: { step: VerboseThoughtStep }) => {
  return (
    <Alert
      type="error"
      header={step.title}
      dismissible={false}
    >
      <SpaceBetween size="s">
        <Box>{step.summary}</Box>
        {step.details?.error && (
          <ExpandableSection headerText="Error Details" variant="footer">
            <Box variant="code">{step.details.error}</Box>
          </ExpandableSection>
        )}
        {step.details?.reasoning && (
          <Box variant="small">{step.details.reasoning}</Box>
        )}
      </SpaceBetween>
    </Alert>
  );
};
```

### Graceful Degradation

1. **If thought steps fail to generate:** Display generic "Processing..." indicator
2. **If Cloudscape rendering fails:** Fall back to basic HTML rendering
3. **If data source unavailable:** Display clear error with recovery options
4. **If parsing fails:** Show raw data with warning

## Testing Strategy

### Unit Tests

```typescript
describe('VerboseThoughtSteps', () => {
  it('should generate thought step within 100ms', async () => {
    const agent = new EnhancedStrandsAgent();
    const start = Date.now();
    
    agent.addThoughtStep('data_access', 'Test', 'Test summary');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
  
  it('should include all required details', () => {
    const agent = new EnhancedStrandsAgent();
    const step = agent.addThoughtStep(
      'calculation',
      'Test Calculation',
      'Testing',
      { dataPoints: 100, parameters: { test: true } }
    );
    
    expect(step.details?.dataPoints).toBe(100);
    expect(step.details?.parameters).toEqual({ test: true });
  });
});

describe('InputClearing', () => {
  it('should clear input within 50ms', async () => {
    const { getByRole } = render(<ChatBox />);
    const input = getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'test' } });
    
    const start = Date.now();
    fireEvent.submit(input);
    
    await waitFor(() => {
      expect(input.value).toBe('');
      expect(Date.now() - start).toBeLessThan(50);
    });
  });
});

describe('CloudscapeRendering', () => {
  it('should render porosity artifact in Cloudscape components', () => {
    const artifact = {
      type: 'porosity_calculation',
      data: { /* test data */ }
    };
    
    const { container } = render(<CloudscapePorosityDisplay artifact={artifact} />);
    
    expect(container.querySelector('[class*="awsui-container"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="awsui-header"]')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Petrophysics Workflow', () => {
  it('should complete porosity calculation with verbose thought steps', async () => {
    const agent = new EnhancedStrandsAgent();
    
    const result = await agent.processMessage('Calculate porosity for WELL-001');
    
    // Verify thought steps
    expect(result.thoughtSteps).toBeDefined();
    expect(result.thoughtSteps.length).toBeGreaterThan(3);
    
    // Verify data access step
    const dataAccessStep = result.thoughtSteps.find(s => s.type === 'data_access');
    expect(dataAccessStep).toBeDefined();
    expect(dataAccessStep.details?.source).toContain('WELL-001.las');
    
    // Verify calculation step
    const calcStep = result.thoughtSteps.find(s => s.type === 'calculation');
    expect(calcStep).toBeDefined();
    expect(calcStep.details?.parameters).toBeDefined();
    
    // Verify artifact
    expect(result.artifacts).toBeDefined();
    expect(result.artifacts[0].type).toBe('porosity_calculation');
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should add thought step overhead < 200ms', async () => {
    const agent = new EnhancedStrandsAgent();
    
    const startWithoutThought = Date.now();
    await agent.processMessageWithoutThoughtSteps('test');
    const durationWithout = Date.now() - startWithoutThought;
    
    const startWithThought = Date.now();
    await agent.processMessage('test');
    const durationWith = Date.now() - startWithThought;
    
    const overhead = durationWith - durationWithout;
    expect(overhead).toBeLessThan(200);
  });
});
```

## Implementation Phases

### Phase 1: Input Clearing (1 day)
- Update ChatBox component with immediate clearing
- Add visual feedback
- Test across all chat interfaces

### Phase 2: Thought Step Enhancement (2 days)
- Update BaseEnhancedAgent class
- Enhance all agent implementations
- Add verbose details to existing thought steps

### Phase 3: Real-Time Streaming (2 days)
- Implement streaming architecture
- Update frontend display components
- Add animation and transitions

### Phase 4: Cloudscape Rendering (3 days)
- Create Cloudscape renderer components
- Map all artifact types
- Implement fallback rendering

### Phase 5: Testing & Validation (2 days)
- Run all example workflows
- Performance testing
- User acceptance testing

## Deployment Considerations

### Backend Changes
- No schema changes required
- Agent code updates only
- Backward compatible with existing messages

### Frontend Changes
- New Cloudscape components
- Enhanced ChatMessage rendering
- Input clearing optimization

### Performance Impact
- Thought step generation: +50-100ms per step
- Total overhead: < 200ms per message
- No impact on data processing time

### Monitoring
- Track thought step generation time
- Monitor input clearing latency
- Log Cloudscape rendering failures
- Track user engagement with thought steps
