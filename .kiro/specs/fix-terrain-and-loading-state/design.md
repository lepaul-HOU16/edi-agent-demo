# Design Document

## Overview

This design establishes a systematic approach to debugging and fixing two critical, recurring issues:
1. Terrain map showing 60 features instead of 151
2. "Analyzing" popup not dismissing, requiring page reload

The design prioritizes **root cause identification** over quick fixes, **comprehensive logging** over assumptions, and **thorough testing** over speed.

## Architecture

### Investigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Investigation Layers                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: UI Observation                                     │
│  ├─ Browser console logs                                     │
│  ├─ React DevTools state inspection                          │
│  ├─ Network tab analysis                                     │
│  └─ Visual behavior observation                              │
│                                                               │
│  Layer 2: Frontend State                                     │
│  ├─ Component state tracking                                 │
│  ├─ Props flow analysis                                      │
│  ├─ Context value inspection                                 │
│  └─ State update timing                                      │
│                                                               │
│  Layer 3: Data Pipeline                                      │
│  ├─ API request construction                                 │
│  ├─ Response parsing                                         │
│  ├─ Data transformation                                      │
│  └─ Data filtering                                           │
│                                                               │
│  Layer 4: Backend Processing                                 │
│  ├─ Lambda execution logs                                    │
│  ├─ Parameter validation                                     │
│  ├─ External API calls                                       │
│  └─ Response construction                                    │
│                                                               │
│  Layer 5: Root Cause                                         │
│  └─ Identified through systematic analysis                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: TerrainMapArtifact Component                   │
│ ├─ Set loading state: true                               │
│ ├─ Log: "Starting terrain analysis"                      │
│ └─ Call API                                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ API Route: /api/renewable/terrain                        │
│ ├─ Log: "Request received", params                       │
│ ├─ Validate parameters                                   │
│ └─ Forward to Lambda                                      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Lambda: renewableOrchestrator                            │
│ ├─ Log: "Orchestrator invoked", params                   │
│ ├─ Route to terrain tool                                 │
│ └─ Call terrain Lambda                                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Lambda: renewableTools/terrain                           │
│ ├─ Log: "Terrain analysis starting", params              │
│ ├─ Fetch OSM data                                         │
│ ├─ Log: "OSM data fetched", feature_count                │
│ ├─ Process features                                       │
│ ├─ Log: "Features processed", feature_count              │
│ └─ Return response                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Lambda: renewableOrchestrator (return)                   │
│ ├─ Log: "Terrain response received", feature_count       │
│ ├─ Format response                                        │
│ └─ Return to API                                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ API Route: /api/renewable/terrain (return)               │
│ ├─ Log: "Response received", feature_count               │
│ ├─ Transform response                                     │
│ └─ Return to frontend                                     │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend: TerrainMapArtifact Component (response)        │
│ ├─ Log: "Response received", feature_count               │
│ ├─ Parse response                                         │
│ ├─ Log: "Data parsed", feature_count                     │
│ ├─ Update state with data                                │
│ ├─ Log: "State updated", feature_count                   │
│ ├─ Set loading state: false                              │
│ ├─ Log: "Loading state cleared"                          │
│ └─ Render map                                             │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Map Rendered │
│ 151 Features │
└──────────────┘
```

## Components and Interfaces

### 1. Enhanced Logging System

#### LoggingService Interface
```typescript
interface LoggingService {
  // Component lifecycle logging
  logComponentMount(componentName: string, props: any): void;
  logComponentUpdate(componentName: string, prevState: any, newState: any): void;
  logComponentUnmount(componentName: string): void;
  
  // State management logging
  logStateChange(componentName: string, stateName: string, before: any, after: any): void;
  
  // Data flow logging
  logDataReceived(componentName: string, source: string, data: any, count?: number): void;
  logDataTransformed(componentName: string, operation: string, input: any, output: any): void;
  logDataFiltered(componentName: string, criteria: any, before: number, after: number): void;
  
  // API logging
  logApiRequest(endpoint: string, params: any): void;
  logApiResponse(endpoint: string, response: any, duration: number): void;
  logApiError(endpoint: string, error: any): void;
  
  // Feature count tracking
  logFeatureCount(location: string, count: number, context?: any): void;
}
```

#### Implementation
```typescript
// src/utils/renewable/TerrainDebugLogger.ts
export class TerrainDebugLogger implements LoggingService {
  private prefix = '[TERRAIN_DEBUG]';
  
  logFeatureCount(location: string, count: number, context?: any) {
    console.log(`${this.prefix} Feature Count at ${location}:`, {
      count,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  logStateChange(componentName: string, stateName: string, before: any, after: any) {
    console.log(`${this.prefix} [${componentName}] State Change:`, {
      stateName,
      before,
      after,
      timestamp: new Date().toISOString()
    });
  }
  
  // ... other methods
}
```

### 2. Feature Count Tracker

#### Purpose
Track feature count at every step of the data pipeline to identify where features are lost.

#### Interface
```typescript
interface FeatureCountTracker {
  trackCount(stage: string, count: number, data?: any): void;
  getCountHistory(): CountHistoryEntry[];
  validateCount(expected: number): ValidationResult;
}

interface CountHistoryEntry {
  stage: string;
  count: number;
  timestamp: string;
  data?: any;
}

interface ValidationResult {
  isValid: boolean;
  expected: number;
  actual: number;
  discrepancy?: number;
  lostAt?: string;
}
```

#### Implementation
```typescript
// src/utils/renewable/FeatureCountTracker.ts
export class FeatureCountTracker {
  private history: CountHistoryEntry[] = [];
  
  trackCount(stage: string, count: number, data?: any) {
    const entry = {
      stage,
      count,
      timestamp: new Date().toISOString(),
      data
    };
    this.history.push(entry);
    console.log('[FEATURE_COUNT_TRACKER]', entry);
  }
  
  getCountHistory(): CountHistoryEntry[] {
    return this.history;
  }
  
  validateCount(expected: number): ValidationResult {
    const lastEntry = this.history[this.history.length - 1];
    const isValid = lastEntry.count === expected;
    
    if (!isValid) {
      // Find where count dropped
      const lostAt = this.findCountDrop(expected);
      return {
        isValid: false,
        expected,
        actual: lastEntry.count,
        discrepancy: expected - lastEntry.count,
        lostAt
      };
    }
    
    return { isValid: true, expected, actual: lastEntry.count };
  }
  
  private findCountDrop(expected: number): string {
    for (let i = 0; i < this.history.length - 1; i++) {
      const current = this.history[i];
      const next = this.history[i + 1];
      
      if (current.count === expected && next.count < expected) {
        return `Between ${current.stage} and ${next.stage}`;
      }
    }
    return 'Unknown';
  }
}
```

### 3. Loading State Manager

#### Purpose
Manage loading state with comprehensive logging and error handling.

#### Interface
```typescript
interface LoadingStateManager {
  startLoading(operation: string): void;
  completeLoading(operation: string, success: boolean): void;
  isLoading(): boolean;
  getLoadingHistory(): LoadingHistoryEntry[];
}

interface LoadingHistoryEntry {
  operation: string;
  action: 'start' | 'complete';
  success?: boolean;
  timestamp: string;
  duration?: number;
}
```

#### Implementation
```typescript
// src/utils/renewable/LoadingStateManager.ts
export class LoadingStateManager {
  private loading: boolean = false;
  private history: LoadingHistoryEntry[] = [];
  private startTime: number | null = null;
  
  startLoading(operation: string) {
    this.loading = true;
    this.startTime = Date.now();
    
    const entry: LoadingHistoryEntry = {
      operation,
      action: 'start',
      timestamp: new Date().toISOString()
    };
    
    this.history.push(entry);
    console.log('[LOADING_STATE_MANAGER] Loading started:', entry);
  }
  
  completeLoading(operation: string, success: boolean) {
    this.loading = false;
    const duration = this.startTime ? Date.now() - this.startTime : undefined;
    this.startTime = null;
    
    const entry: LoadingHistoryEntry = {
      operation,
      action: 'complete',
      success,
      timestamp: new Date().toISOString(),
      duration
    };
    
    this.history.push(entry);
    console.log('[LOADING_STATE_MANAGER] Loading completed:', entry);
  }
  
  isLoading(): boolean {
    return this.loading;
  }
  
  getLoadingHistory(): LoadingHistoryEntry[] {
    return this.history;
  }
}
```

### 4. Enhanced TerrainMapArtifact Component

#### Key Changes
1. Integrate FeatureCountTracker
2. Integrate LoadingStateManager
3. Add comprehensive logging at every step
4. Add state validation
5. Add error boundaries

#### Component Structure
```typescript
// src/components/renewable/TerrainMapArtifact.tsx
export const TerrainMapArtifact: React.FC<Props> = ({ artifact }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const logger = useRef(new TerrainDebugLogger());
  const countTracker = useRef(new FeatureCountTracker());
  const loadingManager = useRef(new LoadingStateManager());
  
  useEffect(() => {
    logger.current.logComponentMount('TerrainMapArtifact', { artifact });
    return () => {
      logger.current.logComponentUnmount('TerrainMapArtifact');
    };
  }, []);
  
  const fetchTerrainData = async () => {
    try {
      // Start loading
      loadingManager.current.startLoading('terrain_analysis');
      setLoading(true);
      logger.current.logStateChange('TerrainMapArtifact', 'loading', false, true);
      
      // Make API call
      logger.current.logApiRequest('/api/renewable/terrain', params);
      const startTime = Date.now();
      const response = await fetch('/api/renewable/terrain', { ... });
      const duration = Date.now() - startTime;
      
      // Log response
      const responseData = await response.json();
      logger.current.logApiResponse('/api/renewable/terrain', responseData, duration);
      
      // Track feature count from response
      const rawFeatureCount = responseData.features?.length || 0;
      countTracker.current.trackCount('API_RESPONSE', rawFeatureCount, responseData);
      
      // Parse data
      const parsedData = parseTerrainData(responseData);
      const parsedFeatureCount = parsedData.features?.length || 0;
      countTracker.current.trackCount('AFTER_PARSING', parsedFeatureCount, parsedData);
      
      // Update state
      setData(parsedData);
      logger.current.logStateChange('TerrainMapArtifact', 'data', null, parsedData);
      
      // Complete loading
      setLoading(false);
      logger.current.logStateChange('TerrainMapArtifact', 'loading', true, false);
      loadingManager.current.completeLoading('terrain_analysis', true);
      
      // Validate feature count
      const validation = countTracker.current.validateCount(151);
      if (!validation.isValid) {
        console.error('[TERRAIN_DEBUG] Feature count validation failed:', validation);
      }
      
    } catch (error) {
      logger.current.logApiError('/api/renewable/terrain', error);
      setError(error);
      setLoading(false);
      loadingManager.current.completeLoading('terrain_analysis', false);
    }
  };
  
  // Render with logging
  useEffect(() => {
    if (data) {
      const renderFeatureCount = data.features?.length || 0;
      countTracker.current.trackCount('BEFORE_RENDER', renderFeatureCount, data);
    }
  }, [data]);
  
  return (
    <div>
      {loading && <LoadingIndicator />}
      {error && <ErrorDisplay error={error} />}
      {data && <TerrainMap data={data} />}
    </div>
  );
};
```

## Data Models

### TerrainAnalysisData
```typescript
interface TerrainAnalysisData {
  features: TerrainFeature[];
  metadata: {
    totalFeatures: number;
    featureTypes: Record<string, number>;
    bounds: GeoBounds;
    timestamp: string;
  };
}

interface TerrainFeature {
  id: string;
  type: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}
```

### LoadingState
```typescript
interface LoadingState {
  isLoading: boolean;
  operation: string | null;
  startTime: number | null;
  error: Error | null;
}
```

## Error Handling

### Error Categories
1. **Network Errors**: API call failures
2. **Data Errors**: Invalid or missing data
3. **State Errors**: State update failures
4. **Rendering Errors**: Component rendering failures

### Error Handling Strategy
```typescript
class TerrainErrorHandler {
  handleError(error: Error, context: ErrorContext) {
    // Log error with full context
    console.error('[TERRAIN_ERROR]', {
      error,
      context,
      timestamp: new Date().toISOString(),
      stackTrace: error.stack
    });
    
    // Categorize error
    const category = this.categorizeError(error);
    
    // Clear loading state
    this.clearLoadingState();
    
    // Show user-friendly error
    this.showErrorMessage(category);
    
    // Report to monitoring
    this.reportError(error, context, category);
  }
  
  private clearLoadingState() {
    // Ensure loading state is always cleared on error
    console.log('[TERRAIN_ERROR] Clearing loading state');
  }
}
```

## Testing Strategy

### Level 1: Unit Tests

#### FeatureCountTracker Tests
```typescript
describe('FeatureCountTracker', () => {
  it('should track feature counts at each stage', () => {
    const tracker = new FeatureCountTracker();
    tracker.trackCount('STAGE_1', 151);
    tracker.trackCount('STAGE_2', 151);
    
    const history = tracker.getCountHistory();
    expect(history).toHaveLength(2);
    expect(history[0].count).toBe(151);
  });
  
  it('should identify where features are lost', () => {
    const tracker = new FeatureCountTracker();
    tracker.trackCount('STAGE_1', 151);
    tracker.trackCount('STAGE_2', 60);
    
    const validation = tracker.validateCount(151);
    expect(validation.isValid).toBe(false);
    expect(validation.lostAt).toContain('STAGE_1 and STAGE_2');
  });
});
```

#### LoadingStateManager Tests
```typescript
describe('LoadingStateManager', () => {
  it('should manage loading state lifecycle', () => {
    const manager = new LoadingStateManager();
    
    manager.startLoading('test');
    expect(manager.isLoading()).toBe(true);
    
    manager.completeLoading('test', true);
    expect(manager.isLoading()).toBe(false);
  });
  
  it('should track loading history', () => {
    const manager = new LoadingStateManager();
    
    manager.startLoading('test');
    manager.completeLoading('test', true);
    
    const history = manager.getLoadingHistory();
    expect(history).toHaveLength(2);
    expect(history[0].action).toBe('start');
    expect(history[1].action).toBe('complete');
  });
});
```

### Level 2: Integration Tests

#### TerrainMapArtifact Integration Tests
```typescript
describe('TerrainMapArtifact Integration', () => {
  it('should fetch, parse, and render terrain data', async () => {
    const { getByTestId } = render(<TerrainMapArtifact artifact={mockArtifact} />);
    
    // Verify loading state shows
    expect(getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByTestId('terrain-map')).toBeInTheDocument();
    });
    
    // Verify loading state cleared
    expect(queryByTestId('loading-indicator')).not.toBeInTheDocument();
    
    // Verify feature count
    const map = getByTestId('terrain-map');
    expect(map).toHaveAttribute('data-feature-count', '151');
  });
  
  it('should handle errors and clear loading state', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    const { getByTestId, queryByTestId } = render(<TerrainMapArtifact artifact={mockArtifact} />);
    
    // Wait for error
    await waitFor(() => {
      expect(getByTestId('error-display')).toBeInTheDocument();
    });
    
    // Verify loading state cleared
    expect(queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
});
```

### Level 3: End-to-End Tests

#### Complete User Workflow Test
```typescript
describe('Terrain Analysis E2E', () => {
  it('should complete full terrain analysis workflow', async () => {
    // 1. User requests terrain analysis
    await page.click('[data-testid="analyze-terrain-button"]');
    
    // 2. Verify loading indicator shows
    await page.waitForSelector('[data-testid="loading-indicator"]');
    
    // 3. Wait for analysis to complete
    await page.waitForSelector('[data-testid="terrain-map"]', { timeout: 30000 });
    
    // 4. Verify loading indicator dismissed
    const loadingIndicator = await page.$('[data-testid="loading-indicator"]');
    expect(loadingIndicator).toBeNull();
    
    // 5. Verify 151 features displayed
    const featureCount = await page.$eval(
      '[data-testid="feature-count"]',
      el => el.textContent
    );
    expect(featureCount).toBe('151');
    
    // 6. Verify no reload required
    const url = page.url();
    expect(url).not.toContain('reload');
  });
});
```

### Level 4: Regression Tests

#### Feature Preservation Tests
```typescript
describe('Regression Tests', () => {
  it('should not break other renewable features', async () => {
    // Test wind analysis still works
    // Test layout optimization still works
    // Test report generation still works
  });
  
  it('should preserve 151 feature count after code changes', async () => {
    // This test should be run after ANY change to terrain code
  });
});
```

## Deployment Validation

### Pre-Deployment Checklist
```
□ All unit tests pass
□ All integration tests pass
□ All e2e tests pass
□ All regression tests pass
□ Feature count verified locally (151)
□ Loading state verified locally
□ No console errors
□ No TypeScript errors
```

### Post-Deployment Checklist
```
□ Deploy to staging/sandbox
□ Test in deployed environment
□ Check CloudWatch logs for errors
□ Verify feature count in deployed environment (151)
□ Verify loading state in deployed environment
□ Test complete user workflow
□ Verify no regressions
□ Get user validation
```

## Success Metrics

### Feature Count Success
- ✅ Raw API response contains 151 features
- ✅ After parsing, 151 features remain
- ✅ After filtering, 151 features remain
- ✅ Map renders 151 features
- ✅ Feature count tracker shows no loss

### Loading State Success
- ✅ Loading state sets to true on request
- ✅ Loading state clears on success
- ✅ Loading state clears on error
- ✅ Loading state clears on timeout
- ✅ Results display immediately after loading clears
- ✅ No page reload required

### Code Quality Success
- ✅ Comprehensive logging at every step
- ✅ All tests pass
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ No regressions
- ✅ User validates fixes work
