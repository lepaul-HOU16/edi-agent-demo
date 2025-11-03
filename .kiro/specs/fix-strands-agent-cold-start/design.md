# Design: Fix Strands Agent Cold Start and Deployment

## Overview

This design addresses the critical issue of Strands Agent deployment and cold start performance. The solution involves:

1. **Immediate Deployment** - Deploy the existing Strands Agent Lambda to AWS
2. **Cold Start Optimization** - Reduce initialization time from 15+ minutes to under 5 minutes
3. **Dependency Optimization** - Minimize Docker image size and lazy-load heavy dependencies
4. **Warm Start Optimization** - Ensure subsequent requests complete in under 30 seconds
5. **Monitoring and Fallback** - Track performance and gracefully degrade if timeouts occur

## Architecture

### Current Architecture (Not Working)

```
User Query
    ↓
Orchestrator
    ↓
Strands Agent Lambda (NOT DEPLOYED)
    ↓
❌ TIMEOUT (Cold start > 15 minutes)
```

### Target Architecture (Working)

```
User Query
    ↓
Orchestrator
    ↓
Strands Agent Lambda (DEPLOYED)
    ↓
Cold Start (< 5 min) → Warm Start (< 30 sec)
    ↓
Bedrock Claude 3.7 Sonnet
    ↓
Agent Tools (PyWake, OSM, NREL)
    ↓
Artifacts → S3
    ↓
Response to User
```

### Fallback Architecture (If Timeout)

```
User Query
    ↓
Orchestrator
    ↓
Strands Agent Lambda
    ↓
❌ TIMEOUT
    ↓
Orchestrator Fallback
    ↓
Direct Tool Lambdas (terrain, layout, simulation)
    ↓
Basic Results (no AI reasoning)
```

## Components and Interfaces

### 1. Strands Agent Lambda (Docker)

**Purpose**: Run Strands Agent system with all dependencies

**Configuration**:
- Runtime: Python 3.12 (Docker)
- Timeout: 15 minutes (900 seconds)
- Memory: 3GB (3008 MB)
- Deployment: Docker image via ECR

**Environment Variables**:
```typescript
{
  BEDROCK_MODEL_ID: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  GET_INFO_LOGS: 'true',
  DISABLE_CALLBACK_HANDLER: 'false',
  USE_LOCAL_MCP: 'false',
  RENEWABLE_S3_BUCKET: '<bucket-name>',
  LAZY_LOAD_PYWAKE: 'true',  // NEW: Lazy load PyWake
  PRELOAD_BEDROCK: 'true',   // NEW: Preload Bedrock connection
}
```

**Interface**:
```typescript
// Input
{
  agent: 'terrain' | 'layout' | 'simulation' | 'report',
  query: string,
  parameters: {
    project_id: string,
    latitude?: number,
    longitude?: number,
    num_turbines?: number,
    capacity_mw?: number,
    // ... other parameters
  }
}

// Output
{
  statusCode: 200 | 400 | 500 | 504,
  body: {
    success: boolean,
    message: string,
    artifacts?: Array<{
      type: string,
      url: string,
      data?: any
    }>,
    thinking?: string,  // Extended thinking from Claude
    performance?: {
      coldStart: boolean,
      initTime: number,
      executionTime: number,
      memoryUsed: number
    }
  }
}
```

### 2. Optimized Dockerfile

**Purpose**: Minimize Docker image size and optimize cold start

**Strategy**:

- Multi-stage build to separate build dependencies from runtime
- Pre-compile Python bytecode
- Use slim base image (python:3.12-slim)
- Cache pip dependencies in Docker layer
- Minimize installed packages

**Dockerfile Structure**:
```dockerfile
# Stage 1: Build dependencies
FROM python:3.12-slim as builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --target=/build/deps -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /var/task
COPY --from=builder /build/deps /var/task
COPY *.py /var/task/
COPY tools/ /var/task/tools/
RUN python -m compileall .
CMD ["lambda_handler.handler"]
```

### 3. Lazy Loading System

**Purpose**: Load heavy dependencies only when needed

**Implementation**:
```python
# lambda_handler.py
import logging

# Lightweight imports (always loaded)
import json
import os
import sys

# Heavy imports (lazy loaded)
_pywake = None
_geopandas = None
_matplotlib = None

def get_pywake():
    global _pywake
    if _pywake is None:
        logger.info("Lazy loading PyWake...")
        import py_wake
        _pywake = py_wake
    return _pywake

def get_geopandas():
    global _geopandas
    if _geopandas is None:
        logger.info("Lazy loading GeoPandas...")
        import geopandas
        _geopandas = geopandas
    return _geopandas
```

### 4. Bedrock Connection Pooling

**Purpose**: Reuse Bedrock connections across invocations

**Implementation**:
```python
# Global connection pool (persists across warm starts)
_bedrock_client = None
_bedrock_runtime = None

def get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        logger.info("Initializing Bedrock client...")
        import boto3
        _bedrock_client = boto3.client('bedrock-runtime')
    return _bedrock_client
```

### 5. Performance Monitoring with Progress Updates

**Purpose**: Track cold/warm start performance AND send progress updates to UI

**Implementation**:
```python
import time
import json

# Track initialization time
_init_start_time = time.time()
_init_complete = False

# Progress callback (sent to UI via streaming or polling)
def send_progress(step, message, elapsed_time):
    """Send progress update to UI"""
    progress = {
        'type': 'progress',
        'step': step,
        'message': message,
        'elapsed': elapsed_time,
        'timestamp': time.time()
    }
    logger.info(f"PROGRESS: {json.dumps(progress)}")
    # TODO: Send to UI via WebSocket or polling endpoint
    return progress

def handler(event, context):
    global _init_complete
    
    start_time = time.time()
    is_cold_start = not _init_complete
    progress_updates = []
    
    if is_cold_start:
        # Send progress updates during cold start
        progress_updates.append(send_progress(
            'init', 
            '🚀 Initializing Strands Agent system...', 
            time.time() - start_time
        ))
        
        # Load Bedrock client
        progress_updates.append(send_progress(
            'bedrock', 
            '🤖 Connecting to AWS Bedrock (Claude 3.7 Sonnet)...', 
            time.time() - start_time
        ))
        bedrock_client = get_bedrock_client()
        
        progress_updates.append(send_progress(
            'bedrock_ready', 
            '✅ Bedrock connection established', 
            time.time() - start_time
        ))
        
        # Load agent tools
        progress_updates.append(send_progress(
            'tools', 
            '🔧 Loading agent tools (terrain, layout, simulation)...', 
            time.time() - start_time
        ))
        
        # Initialize agent
        progress_updates.append(send_progress(
            'agent', 
            '🧠 Initializing AI agent with extended thinking...', 
            time.time() - start_time
        ))
        
        init_time = time.time() - start_time
        progress_updates.append(send_progress(
            'ready', 
            f'✅ Agent ready! (initialized in {init_time:.1f}s)', 
            init_time
        ))
        
        logger.info(f"COLD START: {init_time:.2f}s")
        _init_complete = True
    else:
        progress_updates.append(send_progress(
            'warm', 
            '⚡ Using warm agent instance (fast response)', 
            0
        ))
        logger.info("WARM START")
    
    # Agent execution with thinking updates
    progress_updates.append(send_progress(
        'thinking', 
        '💭 Agent analyzing your request...', 
        time.time() - start_time
    ))
    
    # ... agent logic ...
    
    progress_updates.append(send_progress(
        'executing', 
        '⚙️ Executing tools and generating results...', 
        time.time() - start_time
    ))
    
    execution_time = time.time() - start_time
    
    progress_updates.append(send_progress(
        'complete', 
        f'✅ Complete! (total time: {execution_time:.1f}s)', 
        execution_time
    ))
    
    logger.info(f"EXECUTION TIME: {execution_time:.2f}s")
    
    return {
        'performance': {
            'coldStart': is_cold_start,
            'initTime': init_time if is_cold_start else 0,
            'executionTime': execution_time
        },
        'progress': progress_updates  # Include all progress updates
    }
```

### 6. Orchestrator Fallback Logic

**Purpose**: Fall back to direct tools if Strands agent times out

**Implementation**:
```typescript
// amplify/functions/renewableOrchestrator/handler.ts

async function invokeStrandsAgent(params) {
  try {
    const response = await lambda.invoke({
      FunctionName: process.env.RENEWABLE_AGENTS_FUNCTION_NAME,
      Payload: JSON.stringify(params),
      InvocationType: 'RequestResponse'
    }).promise();
    
    return JSON.parse(response.Payload);
  } catch (error) {
    if (error.code === 'TooManyRequestsException' || 
        error.message.includes('timeout')) {
      logger.warn('Strands agent timeout, falling back to direct tools');
      return await fallbackToDirectTools(params);
    }
    throw error;
  }
}

async function fallbackToDirectTools(params) {
  // Call direct tool Lambdas instead
  const toolName = getToolNameForAgent(params.agent);
  return await invokeDirectTool(toolName, params.parameters);
}
```

## Data Models

### Performance Metrics

```typescript
interface PerformanceMetrics {
  coldStart: boolean;
  initTime: number;        // Seconds
  executionTime: number;   // Seconds
  memoryUsed: number;      // MB
  timestamp: string;
}
```

### Agent Response

```typescript
interface AgentResponse {
  success: boolean;
  message: string;
  artifacts?: Artifact[];
  thinking?: string;
  performance?: PerformanceMetrics;
  fallbackUsed?: boolean;
}
```

## Error Handling

### Timeout Errors

**Scenario**: Lambda exceeds 15-minute timeout

**Handling**:
1. CloudWatch alarm triggers
2. Orchestrator catches timeout exception
3. Falls back to direct tool invocation
4. Returns response with `fallbackUsed: true`
5. UI shows warning: "Advanced AI unavailable, using basic mode"

### Memory Errors

**Scenario**: Lambda exceeds 3GB memory

**Handling**:
1. Lazy loading prevents loading all dependencies at once
2. If memory still exceeded, log detailed memory usage
3. Consider increasing memory to 4GB or 5GB
4. Optimize PyWake usage to reduce memory footprint

### Deployment Errors

**Scenario**: Docker image fails to build or deploy

**Handling**:
1. Check Docker build logs
2. Verify all dependencies in requirements.txt
3. Ensure Dockerfile syntax is correct
4. Check ECR permissions
5. Retry deployment with `--no-cache` flag

## Testing Strategy

### Unit Tests

**Test**: Lazy loading works correctly
```python
def test_lazy_loading():
    # PyWake should not be loaded initially
    assert '_pywake' not in globals()
    
    # Load PyWake
    pywake = get_pywake()
    assert pywake is not None
    
    # Second call should reuse cached instance
    pywake2 = get_pywake()
    assert pywake is pywake2
```

### Integration Tests

**Test**: Cold start completes within 5 minutes
```javascript
test('cold start performance', async () => {
  const startTime = Date.now();
  
  const response = await lambda.invoke({
    FunctionName: 'RenewableAgentsFunction',
    Payload: JSON.stringify({
      agent: 'terrain',
      query: 'Test query',
      parameters: { project_id: 'test' }
    })
  }).promise();
  
  const duration = (Date.now() - startTime) / 1000;
  expect(duration).toBeLessThan(300); // 5 minutes
});
```

### End-to-End Tests

**Test**: Complete workflow with Strands agents
```javascript
test('complete workflow', async () => {
  // 1. Terrain analysis
  const terrain = await invokeAgent('terrain', {...});
  expect(terrain.success).toBe(true);
  
  // 2. Layout optimization
  const layout = await invokeAgent('layout', {...});
  expect(layout.success).toBe(true);
  
  // 3. Wake simulation
  const simulation = await invokeAgent('simulation', {...});
  expect(simulation.success).toBe(true);
  
  // 4. Report generation
  const report = await invokeAgent('report', {...});
  expect(report.success).toBe(true);
});
```

## Deployment Strategy

### Phase 1: Deploy Current Configuration (Immediate)

1. Start sandbox: `npx ampx sandbox`
2. Wait for deployment (10-15 minutes)
3. Verify Lambda deployed
4. Test cold start performance
5. Measure baseline metrics

### Phase 2: Optimize Dockerfile (If Needed)

1. Implement multi-stage build
2. Add lazy loading
3. Pre-compile Python bytecode
4. Rebuild and redeploy
5. Measure improved metrics

### Phase 3: Add Provisioned Concurrency (Optional)

1. Enable 1 provisioned instance
2. Monitor cold start rate (should be 0%)
3. Measure cost impact
4. Decide if worth keeping enabled

## Success Metrics

### Performance Targets

- **Cold Start**: < 5 minutes (currently unknown, likely > 15 min)
- **Warm Start**: < 30 seconds
- **Memory Usage**: < 2.5GB (out of 3GB available)
- **Success Rate**: > 95%
- **Fallback Rate**: < 5%

### Monitoring

**CloudWatch Metrics**:
- `ColdStartDuration`: Time from invocation to first response
- `WarmStartDuration`: Time for subsequent invocations
- `MemoryUsed`: Peak memory consumption
- `TimeoutRate`: Percentage of requests that timeout
- `FallbackRate`: Percentage using direct tools instead of agents

**CloudWatch Alarms**:
- Alert if cold start > 10 minutes
- Alert if warm start > 60 seconds
- Alert if memory > 2.8GB
- Alert if timeout rate > 10%

## Rollback Plan

If Strands agents don't work after deployment:

1. **Immediate**: Orchestrator automatically falls back to direct tools
2. **Short-term**: Disable Strands agent routing in orchestrator
3. **Long-term**: Continue using direct tool Lambdas until agents fixed

**Rollback Command**:
```typescript
// In orchestrator handler
const USE_STRANDS_AGENTS = process.env.ENABLE_STRANDS_AGENTS === 'true';

if (USE_STRANDS_AGENTS) {
  return await invokeStrandsAgent(params);
} else {
  return await invokeDirectTools(params);
}
```

Set `ENABLE_STRANDS_AGENTS=false` to disable agents without redeployment.


## Enhanced Chain-of-Thought Visualization

### Purpose

Show users what's happening during cold starts and agent execution to:
1. **Reduce perceived wait time** - Users see progress instead of blank screen
2. **Build trust** - Users understand the agent is working, not frozen
3. **Debug issues** - Developers see where delays occur
4. **Educate users** - Users learn what the agent is doing

### UI Component: AgentProgressIndicator

**Location**: `src/components/renewable/AgentProgressIndicator.tsx`

**Features**:
- Real-time progress updates during agent execution
- Step-by-step visualization of agent thinking
- Estimated time remaining
- Expandable details for each step
- Visual indicators (spinner, checkmarks, progress bar)

**Implementation**:
```typescript
interface ProgressStep {
  step: string;
  message: string;
  elapsed: number;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
}

export function AgentProgressIndicator({ 
  steps, 
  currentStep, 
  isVisible 
}: {
  steps: ProgressStep[];
  currentStep: string;
  isVisible: boolean;
}) {
  return (
    <div className="agent-progress">
      <div className="progress-header">
        <Spinner />
        <h3>Agent Processing</h3>
      </div>
      
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`step ${step.status}`}
          >
            <div className="step-icon">
              {step.status === 'complete' && '✅'}
              {step.status === 'in_progress' && '⏳'}
              {step.status === 'pending' && '⏸️'}
              {step.status === 'error' && '❌'}
            </div>
            
            <div className="step-content">
              <div className="step-message">{step.message}</div>
              <div className="step-time">{step.elapsed.toFixed(1)}s</div>
            </div>
            
            {step.status === 'in_progress' && (
              <div className="step-details">
                <LinearProgress />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {currentStep === 'thinking' && (
        <div className="thinking-indicator">
          <div className="thinking-animation">
            <span>.</span><span>.</span><span>.</span>
          </div>
          <p>Agent is analyzing your request with extended thinking</p>
        </div>
      )}
    </div>
  );
}
```

### Progress Update Flow

```
User sends query
    ↓
Frontend shows "Initializing agent..."
    ↓
Lambda cold start begins
    ↓
Progress: "🚀 Initializing Strands Agent system..." (0.5s)
    ↓
Progress: "🤖 Connecting to AWS Bedrock..." (2.0s)
    ↓
Progress: "✅ Bedrock connection established" (3.5s)
    ↓
Progress: "🔧 Loading agent tools..." (5.0s)
    ↓
Progress: "🧠 Initializing AI agent..." (8.0s)
    ↓
Progress: "✅ Agent ready!" (10.0s)
    ↓
Progress: "💭 Agent analyzing your request..." (12.0s)
    ↓
Progress: "⚙️ Executing tools..." (45.0s)
    ↓
Progress: "✅ Complete!" (60.0s)
    ↓
Frontend shows results
```

### Extended Thinking Display

**Purpose**: Show Claude's reasoning process in real-time

**Implementation**:
```typescript
interface ThinkingBlock {
  type: 'thinking';
  content: string;
  timestamp: number;
}

export function ExtendedThinkingDisplay({ 
  thinking 
}: { 
  thinking: ThinkingBlock[] 
}) {
  return (
    <div className="extended-thinking">
      <div className="thinking-header">
        <Brain icon />
        <h4>Agent Reasoning</h4>
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {expanded && (
        <div className="thinking-content">
          {thinking.map((block, index) => (
            <div key={index} className="thinking-block">
              <div className="thinking-timestamp">
                {new Date(block.timestamp).toLocaleTimeString()}
              </div>
              <div className="thinking-text">
                {block.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Streaming Progress Updates

**Option 1: Polling** (Simpler, works with current architecture)

```typescript
// Frontend polls for progress
async function pollProgress(requestId: string) {
  const interval = setInterval(async () => {
    const progress = await fetch(`/api/progress/${requestId}`);
    const data = await progress.json();
    
    updateProgressUI(data.steps);
    
    if (data.status === 'complete') {
      clearInterval(interval);
    }
  }, 1000); // Poll every second
}
```

**Option 2: WebSocket** (Better UX, requires infrastructure)

```typescript
// Frontend connects to WebSocket
const ws = new WebSocket(`wss://api.example.com/progress`);

ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  updateProgressUI(progress);
};

// Lambda sends progress via WebSocket API
await apiGatewayManagementApi.postToConnection({
  ConnectionId: connectionId,
  Data: JSON.stringify(progress)
});
```

**Recommendation**: Start with polling (simpler), upgrade to WebSocket if needed.

### Progress Storage

**Purpose**: Store progress updates so frontend can retrieve them

**Implementation**:
```typescript
// Store progress in DynamoDB
interface ProgressRecord {
  requestId: string;
  steps: ProgressStep[];
  status: 'in_progress' | 'complete' | 'error';
  createdAt: number;
  updatedAt: number;
}

// Lambda writes progress
await dynamodb.put({
  TableName: 'AgentProgress',
  Item: {
    requestId: event.requestId,
    steps: progressUpdates,
    status: 'in_progress',
    updatedAt: Date.now()
  }
});

// Frontend reads progress
const progress = await dynamodb.get({
  TableName: 'AgentProgress',
  Key: { requestId }
});
```

### User Experience Improvements

**Cold Start (First Request)**:
```
User: "Optimize layout at 35.067, -101.395"

UI Shows:
┌─────────────────────────────────────────┐
│ 🚀 Initializing AI Agent System         │
│                                         │
│ ✅ Connecting to Bedrock (3.5s)        │
│ ⏳ Loading agent tools...              │
│ ⏸️ Initializing AI agent               │
│ ⏸️ Analyzing your request              │
│                                         │
│ First request may take 2-3 minutes     │
│ Subsequent requests will be faster     │
└─────────────────────────────────────────┘
```

**Warm Start (Subsequent Requests)**:
```
User: "Run simulation for project test123"

UI Shows:
┌─────────────────────────────────────────┐
│ ⚡ Using Warm Agent Instance            │
│                                         │
│ ✅ Agent ready (0.1s)                  │
│ ⏳ Analyzing your request...           │
│                                         │
│ Expected completion: ~30 seconds       │
└─────────────────────────────────────────┘
```

**Agent Thinking**:
```
┌─────────────────────────────────────────┐
│ 💭 Agent Reasoning (Expand ▼)          │
│                                         │
│ [Expanded]                              │
│ • Analyzing coordinates: 35.067, -101.395│
│ • Checking terrain constraints          │
│ • Evaluating 4 layout algorithms        │
│ • Grid layout: 85% efficiency           │
│ • Greedy layout: 92% efficiency ✓       │
│ • Selecting greedy algorithm            │
│ • Placing 30 turbines...                │
│ • Validating wake effects               │
│ • Generating visualization              │
└─────────────────────────────────────────┘
```

### Benefits

1. **Reduced Perceived Wait Time**: Users see progress, not blank screen
2. **Transparency**: Users understand what's happening
3. **Trust**: Users know the system is working
4. **Debugging**: Developers see where delays occur
5. **Education**: Users learn about agent capabilities
6. **Patience**: Users more willing to wait when they see progress

### Implementation Priority

1. **Phase 1** (Immediate): Add basic progress logging in Lambda
2. **Phase 2** (Next): Add progress storage in DynamoDB
3. **Phase 3** (Next): Add polling endpoint for frontend
4. **Phase 4** (Next): Build AgentProgressIndicator UI component
5. **Phase 5** (Optional): Upgrade to WebSocket for real-time updates
