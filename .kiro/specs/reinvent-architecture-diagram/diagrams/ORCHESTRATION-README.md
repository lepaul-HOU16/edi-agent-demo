# Multi-Agent Orchestration Pattern

## Overview

This document describes the multi-agent orchestration pattern used in the AWS Energy Data Insights platform for coordinating complex, multi-step renewable energy analyses.

## Architecture Components

### Visual Diagrams

1. **[Orchestrator Architecture](./09-orchestrator-architecture.mmd)** - High-level component diagram
2. **[Tool Invocation Sequence](./10-tool-invocation-sequence.mmd)** - Decision flow for tool selection
3. **[Project Lifecycle State Machine](./11-project-lifecycle-state-machine.mmd)** - State transitions
4. **[Async Processing Timing](./12-async-processing-timing.mmd)** - Detailed timing diagram

## Key Patterns

### 1. Proxy Pattern

The Renewable Proxy Agent acts as a gateway between the Chat Lambda and the Orchestrator:

```typescript
// Renewable Proxy Agent
class RenewableProxyAgent {
  async processQuery(message: string, context?: SessionContext) {
    // Validate input
    const validation = this.validateInput(message);
    if (!validation.valid) {
      return this.errorResponse(validation.error);
    }
    
    // Invoke orchestrator asynchronously
    await this.invokeOrchestratorAsync({
      message,
      sessionId: context?.sessionId,
      userId: context?.userId
    });
    
    // Return immediate "processing" response
    return {
      success: true,
      message: "Analysis in Progress...",
      processing: true,
      thoughtSteps: [
        {
          type: 'execution',
          title: 'Starting Analysis',
          summary: 'Initiating renewable energy analysis workflow'
        }
      ]
    };
  }
}
```

**Benefits:**
- Decouples chat interface from long-running processes
- Enables async processing without API Gateway timeouts
- Provides immediate feedback to users
- Simplifies error handling

### 2. Intent-Based Routing

The orchestrator uses pattern matching to determine which tools to invoke:

```typescript
class IntentRouter {
  parseIntent(message: string): Intent {
    const lowerMessage = message.toLowerCase();
    
    // Terrain analysis patterns
    if (this.matchesAny(lowerMessage, [
      /terrain.*analysis/,
      /analyze.*terrain/,
      /site.*assessment/,
      /land.*use/
    ])) {
      return { type: 'terrain_analysis', confidence: 0.95 };
    }
    
    // Layout optimization patterns
    if (this.matchesAny(lowerMessage, [
      /layout.*optimization/,
      /optimize.*layout/,
      /turbine.*placement/,
      /site.*layout/
    ])) {
      return { type: 'layout_optimization', confidence: 0.95 };
    }
    
    // Wake simulation patterns
    if (this.matchesAny(lowerMessage, [
      /wake.*simulation/,
      /wake.*loss/,
      /energy.*production/,
      /capacity.*factor/
    ])) {
      return { type: 'wake_simulation', confidence: 0.95 };
    }
    
    // Report generation patterns
    if (this.matchesAny(lowerMessage, [
      /generate.*report/,
      /create.*report/,
      /summary.*report/,
      /project.*report/
    ])) {
      return { type: 'report_generation', confidence: 0.95 };
    }
    
    // Wind rose patterns
    if (this.matchesAny(lowerMessage, [
      /wind.*rose/,
      /wind.*direction/,
      /wind.*distribution/
    ])) {
      return { type: 'wind_rose', confidence: 0.95 };
    }
    
    // Multi-tool patterns
    if (this.matchesAny(lowerMessage, [
      /complete.*analysis/,
      /full.*assessment/,
      /comprehensive.*study/
    ])) {
      return { 
        type: 'multi_tool',
        tools: ['terrain', 'layout', 'simulation', 'report'],
        confidence: 0.90
      };
    }
    
    return { type: 'unknown', confidence: 0.0 };
  }
}
```

**Intent Types:**
- `terrain_analysis` - Analyze site terrain and features
- `layout_optimization` - Optimize turbine placement
- `wake_simulation` - Simulate wake effects and energy production
- `report_generation` - Generate comprehensive report
- `wind_rose` - Visualize wind direction distribution
- `multi_tool` - Execute multiple tools in sequence

### 3. Context Management

Session context is persisted across queries to maintain project state:

```typescript
interface SessionContext {
  session_id: string;
  active_project?: string;
  project_state: ProjectState;
  project_data: {
    terrain?: {
      status: 'pending' | 'complete' | 'error';
      s3_key?: string;
      timestamp?: string;
      metadata?: any;
    };
    layout?: {
      status: 'pending' | 'complete' | 'error';
      s3_key?: string;
      timestamp?: string;
      metadata?: any;
    };
    simulation?: {
      status: 'pending' | 'complete' | 'error';
      s3_key?: string;
      timestamp?: string;
      metadata?: any;
    };
    report?: {
      status: 'pending' | 'complete' | 'error';
      s3_key?: string;
      timestamp?: string;
      metadata?: any;
    };
  };
  last_updated: string;
}

class ContextManager {
  async loadContext(sessionId: string): Promise<SessionContext> {
    const item = await dynamodb.getItem({
      TableName: 'SessionContext',
      Key: { session_id: sessionId }
    });
    
    return item.Item || this.createNewContext(sessionId);
  }
  
  async saveContext(context: SessionContext): Promise<void> {
    await dynamodb.putItem({
      TableName: 'SessionContext',
      Item: context
    });
  }
  
  async updateToolStatus(
    sessionId: string,
    tool: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    const context = await this.loadContext(sessionId);
    context.project_data[tool] = {
      status,
      timestamp: new Date().toISOString(),
      metadata
    };
    await this.saveContext(context);
  }
}
```

**Context Benefits:**
- Maintains project state across sessions
- Enables incremental analysis (add tools to existing project)
- Supports project modification (re-run specific tools)
- Provides audit trail of analysis steps

### 4. Progress Tracking

Real-time progress updates enable transparent user experience:

```typescript
interface ThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 
        'execution' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'in_progress' | 'complete' | 'error';
  context?: Record<string, any>;
  confidence?: number;
  duration?: number;
}

class ProgressTracker {
  private steps: ThoughtStep[] = [];
  
  addStep(step: Omit<ThoughtStep, 'id' | 'timestamp'>): string {
    const id = `step_${Date.now()}_${Math.random()}`;
    const thoughtStep: ThoughtStep = {
      id,
      timestamp: Date.now(),
      ...step
    };
    
    this.steps.push(thoughtStep);
    
    // Save to DynamoDB for polling
    await this.saveProgress(thoughtStep);
    
    return id;
  }
  
  updateStep(id: string, updates: Partial<ThoughtStep>): void {
    const step = this.steps.find(s => s.id === id);
    if (step) {
      Object.assign(step, updates);
      if (updates.status === 'complete') {
        step.duration = Date.now() - step.timestamp;
      }
      await this.saveProgress(step);
    }
  }
  
  async saveProgress(step: ThoughtStep): Promise<void> {
    await dynamodb.putItem({
      TableName: 'AgentProgress',
      Item: {
        session_id: this.sessionId,
        step_id: step.id,
        ...step
      }
    });
  }
}
```

**Progress Updates:**
1. Intent Detection - "Understanding your request..."
2. Parameter Extraction - "Extracting location and parameters..."
3. Tool Selection - "Selecting appropriate analysis tools..."
4. Execution - "Running terrain analysis..." (per tool)
5. Completion - "Analysis complete, preparing results..."

### 5. Tool Invocation Pattern

Tools are invoked via Lambda-to-Lambda calls:

```typescript
class ToolInvoker {
  async invokeTool(
    toolName: string,
    params: any
  ): Promise<ToolResult> {
    const functionName = this.getToolFunctionName(toolName);
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse', // Synchronous
      Payload: JSON.stringify(params)
    });
    
    try {
      const response = await this.lambdaClient.send(command);
      const result = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      
      if (result.errorMessage) {
        throw new Error(result.errorMessage);
      }
      
      return result;
    } catch (error) {
      console.error(`Tool invocation failed: ${toolName}`, error);
      throw error;
    }
  }
  
  private getToolFunctionName(toolName: string): string {
    const envVarMap = {
      'terrain': 'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'layout': 'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
      'simulation': 'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'report': 'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
      'windrose': 'RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME'
    };
    
    const envVar = envVarMap[toolName];
    const functionName = process.env[envVar];
    
    if (!functionName) {
      throw new Error(`Tool function not configured: ${toolName}`);
    }
    
    return functionName;
  }
}
```

**Tool Interface:**
```typescript
interface ToolInput {
  action: string;
  parameters: Record<string, any>;
  session_id: string;
  project_name?: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  artifacts?: Artifact[];
  error?: string;
  metadata?: Record<string, any>;
}

interface Artifact {
  type: string;
  data: {
    messageContentType: string;
    title: string;
    s3Key?: string;
    url?: string;
    metadata?: Record<string, any>;
  };
}
```

## Orchestration Flow

### Complete Analysis Flow

```
1. User Query
   ↓
2. Chat Lambda receives request
   ↓
3. Agent Router detects "renewable" intent
   ↓
4. Renewable Proxy Agent validates input
   ↓
5. Proxy invokes Orchestrator asynchronously
   ↓
6. Proxy returns "Processing" response immediately
   ↓
7. Frontend starts polling for updates
   ↓
8. Orchestrator parses intent → "terrain + layout"
   ↓
9. Orchestrator loads session context
   ↓
10. Orchestrator invokes Terrain Tool
    ↓
11. Terrain Tool fetches OSM data
    ↓
12. Terrain Tool generates visualization
    ↓
13. Terrain Tool stores artifact in S3
    ↓
14. Terrain Tool returns results to Orchestrator
    ↓
15. Orchestrator updates progress
    ↓
16. Orchestrator invokes Layout Tool
    ↓
17. Layout Tool runs optimization algorithm
    ↓
18. Layout Tool generates visualization
    ↓
19. Layout Tool stores artifact in S3
    ↓
20. Layout Tool returns results to Orchestrator
    ↓
21. Orchestrator aggregates all results
    ↓
22. Orchestrator formats response with artifacts
    ↓
23. Orchestrator saves to DynamoDB
    ↓
24. Frontend polling detects new message
    ↓
25. Frontend fetches artifacts from S3
    ↓
26. Frontend renders results to user
```

### Error Handling Flow

```
Tool Invocation Error
   ↓
Catch error in Orchestrator
   ↓
Log error details
   ↓
Mark tool as "error" in context
   ↓
Continue with other tools (if any)
   ↓
Return partial results with error indicator
   ↓
User sees: "Terrain analysis complete, layout optimization failed"
```

## State Machine

### Project States

- **Initialized** - Project created, no analysis run
- **TerrainAnalysis** - Terrain analysis in progress
- **TerrainComplete** - Terrain analysis complete
- **LayoutOptimization** - Layout optimization in progress
- **LayoutComplete** - Layout optimization complete
- **WakeSimulation** - Wake simulation in progress
- **SimulationComplete** - Wake simulation complete
- **WindRoseGeneration** - Wind rose generation in progress
- **WindRoseComplete** - Wind rose complete
- **ReportGeneration** - Report generation in progress
- **ProjectComplete** - All analyses complete
- **Error** - Analysis failed

### State Transitions

See [Project Lifecycle State Machine](./11-project-lifecycle-state-machine.mmd) for visual representation.

**Key Transition Rules:**
1. Can only optimize layout after terrain analysis
2. Can only run simulation after layout optimization
3. Can generate report at any "Complete" state
4. Can generate wind rose at any state (independent)
5. Can re-run any analysis from "Complete" states
6. Error state allows retry of failed tool

## Performance Characteristics

### Timing Breakdown

See [Async Processing Timing](./12-async-processing-timing.mmd) for detailed timing diagram.

**Typical Execution Times:**
- Terrain Analysis: 15-25 seconds
- Layout Optimization: 15-20 seconds
- Wake Simulation: 20-30 seconds
- Report Generation: 5-10 seconds
- Wind Rose: 3-5 seconds

**Total Time (Sequential):**
- Single tool: 15-30 seconds
- Two tools: 30-45 seconds
- Three tools: 50-75 seconds
- Full analysis: 60-90 seconds

### Optimization Strategies

1. **Parallel Execution**
   - Run independent tools simultaneously
   - Reduces total time by 40-50%

2. **Caching**
   - Cache OSM data for repeated locations
   - Cache wind data for common coordinates
   - Reduces repeat queries by 80%

3. **Progressive Results**
   - Stream results as each tool completes
   - User sees first results in 15-25 seconds
   - Improves perceived performance

4. **Pre-computation**
   - Pre-fetch common data during idle time
   - Reduces first-request latency by 30%

## Deployment Considerations

### Environment Variables

Each tool Lambda requires configuration:

```bash
# Orchestrator Lambda
RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=renewable-tools-terrain
RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME=renewable-tools-layout
RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME=renewable-tools-simulation
RENEWABLE_REPORT_TOOL_FUNCTION_NAME=renewable-tools-report
RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME=renewable-tools-windrose
RENEWABLE_S3_BUCKET=storage-bucket

# Tool Lambdas
S3_BUCKET=storage-bucket
NREL_API_KEY=<api-key>
```

### IAM Permissions

**Orchestrator Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:*:*:function:renewable-tools-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/SessionContext",
        "arn:aws:dynamodb:*:*:table/AgentProgress",
        "arn:aws:dynamodb:*:*:table/ChatMessage"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::storage-bucket/renewable-projects/*"
    }
  ]
}
```

**Tool Lambda Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::storage-bucket/renewable-projects/*"
    }
  ]
}
```

## Testing Strategy

### Unit Tests

Test individual components:

```typescript
describe('IntentRouter', () => {
  it('should detect terrain analysis intent', () => {
    const router = new IntentRouter();
    const intent = router.parseIntent('Analyze terrain at 35.0, -101.4');
    expect(intent.type).toBe('terrain_analysis');
    expect(intent.confidence).toBeGreaterThan(0.9);
  });
});

describe('ContextManager', () => {
  it('should load and save context', async () => {
    const manager = new ContextManager();
    const context = await manager.loadContext('session-123');
    context.project_data.terrain = { status: 'complete' };
    await manager.saveContext(context);
    
    const loaded = await manager.loadContext('session-123');
    expect(loaded.project_data.terrain.status).toBe('complete');
  });
});
```

### Integration Tests

Test tool invocation:

```typescript
describe('ToolInvoker', () => {
  it('should invoke terrain tool successfully', async () => {
    const invoker = new ToolInvoker();
    const result = await invoker.invokeTool('terrain', {
      action: 'analyze_terrain',
      parameters: {
        latitude: 35.0,
        longitude: -101.4,
        radius_km: 5
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0].type).toBe('wind_farm_terrain_analysis');
  });
});
```

### End-to-End Tests

Test complete orchestration flow:

```typescript
describe('Renewable Orchestration E2E', () => {
  it('should complete terrain + layout analysis', async () => {
    // Send user query
    const response = await sendChatMessage(
      'Analyze terrain and optimize layout at 35.0, -101.4'
    );
    
    expect(response.processing).toBe(true);
    
    // Poll for completion
    let complete = false;
    let attempts = 0;
    while (!complete && attempts < 30) {
      await sleep(2000);
      const messages = await getMessages(sessionId);
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.role === 'ai' && lastMessage.responseComplete) {
        complete = true;
        
        // Verify artifacts
        expect(lastMessage.artifacts).toHaveLength(2);
        expect(lastMessage.artifacts[0].type).toBe('wind_farm_terrain_analysis');
        expect(lastMessage.artifacts[1].type).toBe('wind_farm_layout_optimization');
      }
      
      attempts++;
    }
    
    expect(complete).toBe(true);
  }, 60000); // 60 second timeout
});
```

## Troubleshooting

### Common Issues

**Issue: Orchestrator can't invoke tool Lambda**
- **Symptom**: Error "Tool function not configured"
- **Cause**: Missing environment variable
- **Solution**: Verify `RENEWABLE_*_TOOL_FUNCTION_NAME` is set

**Issue: Tool invocation times out**
- **Symptom**: Lambda timeout after 300 seconds
- **Cause**: Tool processing takes too long
- **Solution**: Optimize tool algorithm or increase timeout

**Issue: Artifacts not rendering in frontend**
- **Symptom**: "Visualization Unavailable"
- **Cause**: S3 key not accessible or artifact too large
- **Solution**: Verify S3 permissions and artifact size

**Issue: Context not persisting**
- **Symptom**: Each query starts fresh project
- **Cause**: Session ID not passed correctly
- **Solution**: Verify session ID in context parameter

### Debug Commands

```bash
# Check orchestrator logs
aws logs tail /aws/lambda/renewable-orchestrator --follow

# Test tool invocation directly
aws lambda invoke \
  --function-name renewable-tools-terrain \
  --payload '{"action":"analyze_terrain","parameters":{"latitude":35.0,"longitude":-101.4}}' \
  response.json

# Check session context
aws dynamodb get-item \
  --table-name SessionContext \
  --key '{"session_id":{"S":"session-123"}}'

# List S3 artifacts
aws s3 ls s3://storage-bucket/renewable-projects/ --recursive
```

## Future Enhancements

### 1. Parallel Tool Execution

Execute independent tools simultaneously:

```typescript
async executeParallel(tools: string[]): Promise<ToolResult[]> {
  const promises = tools.map(tool => this.invokeTool(tool, params));
  return await Promise.all(promises);
}
```

### 2. Streaming Results

Stream results as each tool completes:

```typescript
async *executeStreaming(tools: string[]): AsyncGenerator<ToolResult> {
  for (const tool of tools) {
    const result = await this.invokeTool(tool, params);
    yield result;
  }
}
```

### 3. Tool Dependency Graph

Define explicit dependencies between tools:

```typescript
const toolGraph = {
  terrain: { dependencies: [] },
  layout: { dependencies: ['terrain'] },
  simulation: { dependencies: ['layout'] },
  report: { dependencies: ['terrain', 'layout', 'simulation'] }
};
```

### 4. Caching Layer

Cache tool results for repeated queries:

```typescript
class ToolCache {
  async getCached(tool: string, params: any): Promise<ToolResult | null> {
    const key = this.generateKey(tool, params);
    return await redis.get(key);
  }
  
  async setCached(tool: string, params: any, result: ToolResult): Promise<void> {
    const key = this.generateKey(tool, params);
    await redis.set(key, result, 'EX', 3600); // 1 hour TTL
  }
}
```

### 5. Cost Optimization

Track and optimize tool invocation costs:

```typescript
class CostTracker {
  async trackInvocation(tool: string, duration: number): Promise<void> {
    const cost = this.calculateCost(tool, duration);
    await this.recordCost(tool, cost);
  }
  
  async getMonthlyReport(): Promise<CostReport> {
    return await this.aggregateCosts();
  }
}
```

## Conclusion

The multi-agent orchestration pattern provides a flexible, scalable architecture for coordinating complex renewable energy analyses. Key benefits include:

- **Modularity**: Each tool is independent and reusable
- **Scalability**: Tools can be scaled independently
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new tools
- **Transparency**: Progress tracking provides user visibility
- **Reliability**: Error handling and retry logic
- **Performance**: Async processing prevents timeouts

This pattern can be adapted for other multi-step workflows beyond renewable energy analysis.
