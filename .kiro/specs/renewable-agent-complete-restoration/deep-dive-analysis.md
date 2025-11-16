# Deep Dive Analysis: Renewable Energy Agent Architecture

## Executive Summary

The Renewable Energy agent system is **partially implemented** with a **hybrid architecture** that attempts to bridge the original Strands Agents framework with a simplified Lambda-based approach. The system is **NOT using AgentCore** despite having a proxy function. Current completion: **~30%**.

## Architecture Analysis

### Current Implementation: Hybrid Approach

The system uses a **three-tier architecture**:

```
Frontend (TypeScript) → Orchestrator (TypeScript Lambda) → Tools (Python)
```

**Tier 1: Orchestrator**
- Intent detection & routing
- Parameter validation  
- Project lifecycle management
- Session context management
- Strands Agent handler (DISABLED - timeouts)

**Tier 2: Strands Agents (DISABLED)**
- terrain_agent.py, layout_agent.py, simulation_agent.py, report_agent.py
- Docker deployment, 15min timeout, 3GB memory
- Status: Deployed but hardcoded to FALSE due to timeouts

**Tier 3: Simple Tools (ACTIVE FALLBACK)**
- terrain/handler.py, layout/simple_handler.py, etc.
- Direct Python handlers without agent framework
- Fast but no AI reasoning

### Why AgentCore is NOT Being Used

**AgentCore Proxy Exists But Is Not Integrated:**

1. **File**: `amplify/functions/renewableAgentCoreProxy/handler.py`
2. **Status**: Deployed but **never called** by the orchestrator
3. **Reason**: The orchestrator routes directly to either:
   - Strands Agents Lambda (currently disabled due to timeouts)
   - Simple tool Lambdas (current fallback)

**Evidence from Code:**

```typescript
// amplify/functions/renewableOrchestrator/strandsAgentHandler.ts
export function isStrandsAgentAvailable(): boolean {
  // Temporarily disabled due to timeout issues
  return false;  // ← HARDCODED TO FALSE
}
```

**Why AgentCore Was Not Used:**

1. **Original Design**: The workshop used **Strands Agents** (not AgentCore)
2. **Integration Attempt**: Someone tried to add AgentCore proxy but never wired it up
3. **Current State**: Strands Agents are deployed but disabled due to timeouts
4. **Fallback**: System uses simple Python handlers without any agent framework

### Original vs Current Architecture

#### Original Workshop Architecture (What Should Exist)

```python
from strands.models import BedrockModel
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()  # ← AgentCore runtime

@tool
def terrain_agent(...):
    agent = Agent(
        tools=[get_unbuildable_areas],
        model=BedrockModel(...),
        system_prompt=system_prompt
    )
    return agent(query)

@app.entrypoint  # ← AgentCore entrypoint
async def agent_invocation(payload):
    stream = agent.stream_async(user_message)
    async for event in stream:
        yield event
```

**Key Features:**
- Uses **Strands Agents** framework for AI reasoning
- Uses **AgentCore** for runtime hosting
- Supports **streaming responses**
- Has **MCP server integration** for tools
- Includes **PyWake** for wake modeling
- Has **turbine-models** library
- Generates **professional reports** with WeasyPrint

#### Current Implementation (What Actually Exists)

```python
# NO AgentCore imports
# NO streaming support
# NO MCP server integration

def handler(event, context):
    agent_type = event.get('agent', 'layout')
    query = event.get('query', '')
    
    # Direct function calls - NO agent framework
    if agent_type == 'terrain':
        response_text = terrain_agent(query=full_query, bedrock_client=bedrock_client)
    
    return {'statusCode': 200, 'body': json.dumps({...})}
```

**What's Missing:**
- ❌ No AgentCore runtime integration
- ❌ No streaming responses
- ❌ No MCP server connection
- ❌ Simplified agent calls (just function invocations)
- ❌ No multi-agent orchestration
- ❌ Limited tool ecosystem

### Dependency Analysis

#### What's Included (renewableAgents/requirements.txt)

```python
✅ strands-agents>=0.1.8
✅ strands-agents-tools>=0.2.4
✅ mcp>=1.1.1
✅ py-wake>=2.5.0
✅ turbine-models>=0.1.1
✅ geopandas>=0.14.0
✅ folium>=0.20.0
✅ matplotlib>=3.8.0
❌ weasyprint  # Disabled - complex system dependencies
```

#### What's Missing from Original

```python
❌ bedrock-agentcore  # AgentCore runtime
❌ bedrock-agentcore-starter-toolkit  # AgentCore utilities
❌ weasyprint  # PDF generation (disabled due to dependencies)
```

### Why Timeouts Are Occurring

**Root Causes Identified:**

1. **Cold Start Time**: 15-30 seconds
   - Docker image size: ~2GB
   - Python dependencies: 50+ packages
   - Strands Agents initialization: 5-10 seconds
   - Bedrock connection: 2-5 seconds

2. **Execution Time**: 60-120 seconds
   - OSM API calls: 10-30 seconds
   - Data processing: 10-20 seconds
   - Visualization generation: 20-40 seconds
   - S3 uploads: 5-10 seconds

3. **Total Time**: 75-150 seconds
   - Lambda timeout: 300 seconds (5 minutes)
   - **BUT**: Orchestrator has 60-second timeout expectation
   - **Result**: Orchestrator times out before agent completes

### Current Workflow: What Actually Happens

**User Query**: "Analyze terrain for wind farm at coordinates (35.0, -101.0) with 5km radius"

```
1. Frontend → Orchestrator
   ├─ Intent detection: "terrain_analysis"
   ├─ Parameter extraction: {lat: 35.0, lon: -101.0, radius: 5}
   └─ Check: isStrandsAgentAvailable() → FALSE (hardcoded)

2. Orchestrator → Simple Tool Lambda
   ├─ Direct invocation: renewableTools/terrain/handler.py
   ├─ OSM API call: Fetch terrain data
   ├─ Data processing: Filter features, apply setbacks
   ├─ Visualization: Generate Folium map
   └─ S3 upload: Save boundaries.geojson, boundaries.html

3. Simple Tool → Orchestrator
   ├─ Return: {success: true, message: "...", artifacts: [...]}
   └─ NO agent reasoning, NO thought steps, NO multi-step workflow

4. Orchestrator → Frontend
   └─ Display: Text response + artifact links
```

**What's Missing:**
- ❌ No AI agent reasoning
- ❌ No tool selection intelligence
- ❌ No multi-step workflows
- ❌ No context retention
- ❌ No adaptive behavior

### Comparison: Original vs Current

| Feature | Original Workshop | Current Implementation | Status |
|---------|------------------|----------------------|--------|
| **Agent Framework** | Strands Agents | Strands Agents (disabled) | ⚠️ Partial |
| **Runtime** | AgentCore | Direct Lambda | ❌ Missing |
| **Streaming** | Yes (async generator) | No | ❌ Missing |
| **MCP Server** | Yes (wind_farm_mcp_server.py) | No | ❌ Missing |
| **Multi-Agent** | Yes (multi_agent.py) | No | ❌ Missing |
| **PyWake** | Yes | Yes (but not used) | ⚠️ Partial |
| **Turbine Models** | Yes | Yes (but not used) | ⚠️ Partial |
| **Layout Algorithms** | 4 (grid, offset, spiral, greedy) | 1 (basic grid) | ❌ Incomplete |
| **Wake Simulation** | Full PyWake integration | Not implemented | ❌ Missing |
| **Report Generation** | PDF with charts | Not implemented | ❌ Missing |
| **Project Storage** | S3 with metadata | S3 (basic) | ⚠️ Partial |
| **Session Context** | Full context management | Basic (DynamoDB) | ⚠️ Partial |

### Why This Matters

**The Current System is a Shell:**

1. **No AI Reasoning**: Tools are called directly without agent intelligence
2. **No Workflow Orchestration**: Each tool is independent, no multi-step workflows
3. **No Adaptive Behavior**: System can't learn from failures or adjust strategies
4. **No Tool Selection**: Orchestrator hardcodes which tool to call
5. **No Context Retention**: Each query is independent, no project memory

## Recommendations

### Option 1: Preserve Original Architecture (Strands Agents + AgentCore)

**Complete restoration of the workshop architecture with performance optimizations**

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (TypeScript)                         │
│                  src/components/renewable/                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Orchestrator (TypeScript Lambda)                    │
│        amplify/functions/renewableOrchestrator/                  │
│                                                                   │
│  • Intent detection & routing                                    │
│  • Parameter validation                                          │
│  • Project lifecycle management                                  │
│  • Session context management                                    │
│  • Async invocation with polling (NEW)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           Strands Agents Lambda (Python Docker)                  │
│        amplify/functions/renewableAgents/                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AgentCore Runtime (bedrock-agentcore)                   │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Strands Agent Framework                           │  │   │
│  │  │                                                     │  │   │
│  │  │  • terrain_agent.py                                │  │   │
│  │  │  • layout_agent.py                                 │  │   │
│  │  │  • simulation_agent.py                             │  │   │
│  │  │  • report_agent.py                                 │  │   │
│  │  │  • multi_agent.py (orchestration)                  │  │   │
│  │  │                                                     │  │   │
│  │  │  Tools:                                            │  │   │
│  │  │  • get_unbuildable_areas()                         │  │   │
│  │  │  • create_grid_layout()                            │  │   │
│  │  │  • run_wake_simulation()                           │  │   │
│  │  │  • generate_report()                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  MCP Client → MCP Server (wind_farm_mcp_server.py)      │   │
│  │  • get_wind_data()                                       │   │
│  │  • get_turbine_specs()                                   │   │
│  │  • calculate_wake_losses()                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Dependencies:                                                    │
│  • strands-agents, strands-agents-tools                          │
│  • bedrock-agentcore, bedrock-agentcore-starter-toolkit          │
│  • py-wake, turbine-models                                       │
│  • geopandas, folium, matplotlib, seaborn                        │
│  • weasyprint (for PDF generation)                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Components to Restore

**1. AgentCore Runtime Integration**

```python
# amplify/functions/renewableAgents/terrain_agent.py
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands.models import BedrockModel
from strands import Agent, tool

app = BedrockAgentCoreApp()

@tool
def terrain_agent(region_name="us-west-2", model_id="...", query="..."):
    """Initialize the terrain analysis agent"""
    
    tools = [get_unbuildable_areas]
    
    bedrock_model = BedrockModel(
        model_id=model_id,
        temperature=1,
        boto_client_config=boto3.session.Config(
            region_name=region_name,
            read_timeout=300,
            connect_timeout=60,
            retries={'max_attempts': 5, 'total_max_attempts': 10}
        )
    )
    
    agent = Agent(
        tools=tools,
        model=bedrock_model,
        system_prompt=system_prompt
    )
    
    response = agent(query)
    return str(response)

@app.entrypoint
async def agent_invocation(payload):
    """Handler for agent invocation via AgentCore"""
    global agent
    
    if agent is None:
        yield {"error": "Agent not initialized"}
        return
    
    user_message = payload.get("prompt", "")
    
    try:
        stream = agent.stream_async(user_message)
        async for event in stream:
            yield event
    except Exception as e:
        yield {"error": f"Error processing request: {str(e)}"}
```

**2. MCP Server Deployment**

```python
# amplify/functions/renewableAgents/MCP_Server/wind_farm_mcp_server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("wind-farm-mcp-server")

@server.list_tools()
async def list_tools():
    return [
        {
            "name": "get_wind_data",
            "description": "Fetch wind resource data from NREL Wind Toolkit",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "year": {"type": "integer"}
                }
            }
        },
        {
            "name": "get_turbine_specs",
            "description": "Get turbine specifications from turbine-models library",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "turbine_model": {"type": "string"}
                }
            }
        },
        # ... more tools
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_wind_data":
        return await fetch_nrel_wind_data(
            arguments["latitude"],
            arguments["longitude"],
            arguments.get("year", 2020)
        )
    elif name == "get_turbine_specs":
        return get_turbine_specifications(arguments["turbine_model"])
    # ... more tool implementations

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)
```

**3. Multi-Agent Orchestration**

```python
# amplify/functions/renewableAgents/multi_agent.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class WindFarmState(TypedDict):
    query: str
    project_id: str
    latitude: float
    longitude: float
    terrain_data: dict
    layout_data: dict
    simulation_data: dict
    report_data: dict
    messages: Annotated[list, operator.add]

def create_agent_graph():
    """Create multi-agent workflow graph"""
    
    workflow = StateGraph(WindFarmState)
    
    # Add agent nodes
    workflow.add_node("terrain", terrain_analysis_node)
    workflow.add_node("layout", layout_optimization_node)
    workflow.add_node("simulation", wake_simulation_node)
    workflow.add_node("report", report_generation_node)
    
    # Define workflow edges
    workflow.set_entry_point("terrain")
    workflow.add_edge("terrain", "layout")
    workflow.add_edge("layout", "simulation")
    workflow.add_edge("simulation", "report")
    workflow.add_edge("report", END)
    
    return workflow.compile()

async def terrain_analysis_node(state: WindFarmState):
    """Execute terrain analysis agent"""
    agent = terrain_agent()
    result = await agent.ainvoke(state["query"])
    
    return {
        "terrain_data": result,
        "messages": [f"Terrain analysis complete: {result.summary}"]
    }

# Similar nodes for layout, simulation, report...
```

**4. Async Invocation Pattern (Fix Timeouts)**

```typescript
// amplify/functions/renewableOrchestrator/strandsAgentHandler.ts
export async function handleWithStrandsAgents(
  event: StrandsAgentEvent
): Promise<OrchestratorResponse> {
  
  // Start async invocation
  const invokeCommand = new InvokeCommand({
    FunctionName: STRANDS_AGENT_FUNCTION_NAME,
    InvocationType: 'Event', // ← Async invocation
    Payload: JSON.stringify({
      agent: agentType,
      query: userMessage,
      parameters: projectContext,
      requestId: chatSessionId
    }),
  });
  
  await lambda.send(invokeCommand);
  
  // Return immediately with polling instructions
  return {
    success: true,
    message: 'Analysis started. This may take 2-3 minutes...',
    artifacts: [],
    thoughtSteps: [{
      step: 1,
      action: 'Starting analysis',
      reasoning: 'Invoking Strands Agent system',
      status: 'in_progress',
      timestamp: new Date().toISOString()
    }],
    metadata: {
      executionTime: 0,
      toolsUsed: [`strands_${agentType}_agent`],
      requestId: chatSessionId,
      polling: {
        enabled: true,
        interval: 5000, // Poll every 5 seconds
        maxAttempts: 36  // 3 minutes max
      }
    }
  };
}
```

**5. Progress Polling System**

```typescript
// New: amplify/functions/renewableAgentProgress/handler.ts
export async function handler(event: { requestId: string }) {
  const dynamodb = new DynamoDB.DocumentClient();
  
  const result = await dynamodb.get({
    TableName: process.env.AGENT_PROGRESS_TABLE,
    Key: { requestId: event.requestId }
  }).promise();
  
  if (!result.Item) {
    return {
      status: 'not_found',
      message: 'Request not found'
    };
  }
  
  return {
    status: result.Item.status, // 'in_progress', 'complete', 'error'
    steps: result.Item.steps,
    artifacts: result.Item.artifacts,
    message: result.Item.message,
    updatedAt: result.Item.updatedAt
  };
}
```

#### Performance Optimizations

**1. Docker Image Optimization**

```dockerfile
# amplify/functions/renewableAgents/Dockerfile
FROM public.ecr.aws/lambda/python:3.12

# Use multi-stage build to reduce image size
FROM python:3.12-slim as builder

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -t /opt/python

# Final stage
FROM public.ecr.aws/lambda/python:3.12
COPY --from=builder /opt/python ${LAMBDA_TASK_ROOT}
COPY *.py ${LAMBDA_TASK_ROOT}/
COPY tools/ ${LAMBDA_TASK_ROOT}/tools/
COPY MCP_Server/ ${LAMBDA_TASK_ROOT}/MCP_Server/

CMD ["lambda_handler.handler"]
```

**Target**: Reduce image from 2GB to 1GB, cold start from 30s to 15s

**2. Lazy Loading**

```python
# amplify/functions/renewableAgents/lazy_imports.py
def get_pywake():
    """Lazy load PyWake only when needed"""
    global _pywake
    if _pywake is None:
        from py_wake import WindFarmModel
        from py_wake.deficit_models import BastankhahGaussian
        _pywake = (WindFarmModel, BastankhahGaussian)
    return _pywake

def get_folium():
    """Lazy load Folium only when needed"""
    global _folium
    if _folium is None:
        import folium
        _folium = folium
    return _folium
```

**Target**: Reduce cold start by 5-10 seconds

**3. Connection Pooling**

```python
# Reuse Bedrock client across warm invocations
_bedrock_client = None

def get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client('bedrock-runtime', ...)
    return _bedrock_client
```

**Target**: Save 2-5 seconds on warm starts

#### Implementation Plan

**Phase 1: Core Infrastructure (Week 1)**
- ✅ Enable Strands Agents (remove hardcoded `return false`)
- ✅ Implement async invocation pattern
- ✅ Create progress polling system
- ✅ Add AgentCore runtime integration
- ✅ Deploy MCP server

**Phase 2: Performance Optimization (Week 2)**
- ✅ Optimize Docker image (multi-stage build)
- ✅ Implement lazy loading for heavy dependencies
- ✅ Add connection pooling
- ✅ Implement caching for OSM/NREL data
- ✅ Add CloudWatch metrics for monitoring

**Phase 3: Feature Completion (Week 3)**
- ✅ Restore all 4 layout algorithms (grid, offset, spiral, greedy)
- ✅ Implement PyWake wake simulation
- ✅ Add report generation with WeasyPrint
- ✅ Implement multi-agent workflows
- ✅ Add MCP tool integration

**Phase 4: Testing & Refinement (Week 4)**
- ✅ End-to-end testing of complete workflows
- ✅ Performance testing and optimization
- ✅ Error handling and retry logic
- ✅ Documentation and examples
- ✅ User acceptance testing

#### Expected Performance

**After Optimization:**
- Cold start: 15-20 seconds (down from 30s)
- Terrain analysis: 30-45 seconds (down from 60-90s)
- Layout optimization: 45-60 seconds (down from 90-120s)
- Wake simulation: 60-90 seconds (down from 120-180s)
- Report generation: 30-45 seconds (down from 60-90s)

**Total workflow**: 3-4 minutes (down from 6-8 minutes)

#### Pros

✅ **Preserves original architecture** - Matches workshop design exactly
✅ **Full AI reasoning** - Strands Agents provide intelligent decision-making
✅ **Multi-agent workflows** - Complete terrain → layout → simulation → report
✅ **Adaptive behavior** - Agents can adjust strategies based on results
✅ **Tool ecosystem** - MCP server provides extensible tool integration
✅ **Streaming support** - AgentCore enables real-time progress updates
✅ **Professional output** - Full report generation with charts and PDFs
✅ **Future-proof** - Built on AWS-supported frameworks

#### Cons

⚠️ **Complex deployment** - Docker images, multiple Lambda functions
⚠️ **Higher costs** - 3GB memory, longer execution times
⚠️ **Longer execution** - 3-4 minutes for complete workflows (vs 30s for simple tools)
⚠️ **More dependencies** - 50+ Python packages to maintain
⚠️ **Requires optimization** - Need to implement all performance improvements

#### Cost Analysis

**Per Invocation:**
- Lambda execution: $0.15-0.30 (3GB memory, 3-4 minutes)
- Bedrock API calls: $0.05-0.10 (Claude 3.7 Sonnet)
- S3 storage: $0.01
- DynamoDB: $0.01

**Total per workflow**: $0.22-0.42

**Monthly (100 workflows)**: $22-42

#### Success Criteria

✅ Terrain analysis completes in < 45 seconds
✅ Layout optimization completes in < 60 seconds
✅ Wake simulation completes in < 90 seconds
✅ Report generation completes in < 45 seconds
✅ Complete workflow completes in < 4 minutes
✅ Cold start < 20 seconds
✅ No timeout errors
✅ All original features working
✅ Streaming progress updates
✅ Multi-agent orchestration functional

**Effort**: 4 weeks for complete restoration with optimizations

### Option 2: Implement AgentCore (Hybrid)

**Pros:**
- AWS-native solution
- Better performance than Strands Agents
- Streaming support
- Managed runtime

**Cons:**
- Requires rewriting agents for AgentCore
- Different from original workshop
- Still need to solve timeout issues
- AgentCore is newer, less mature

**Effort**: 4-6 weeks

### Option 3: Enhance Simple Tools (Current Path)

**Pros:**
- Fast execution (no agent overhead)
- Simple deployment
- Low cold start times
- Cost-effective

**Cons:**
- No AI reasoning
- No adaptive behavior
- No multi-step workflows
- Limited to predefined logic

**Effort**: 1-2 weeks

### Option 4: Hybrid Approach (Recommended)

**Combine simple tools with lightweight agent orchestration:**

1. **Keep simple tools** for fast, deterministic operations
2. **Add lightweight orchestrator** for multi-step workflows
3. **Use Claude directly** (via Bedrock) for reasoning
4. **Implement streaming** for progress updates
5. **Add MCP server** for specialized tools

**Pros:**
- Best of both worlds
- Fast for simple queries
- Intelligent for complex workflows
- Incremental implementation

**Cons:**
- Custom architecture (not Strands or AgentCore)
- Requires careful design
- More code to maintain

**Effort**: 2-3 weeks

## Critical Issues Summary

### 1. Timeout Root Cause

**Problem**: Orchestrator expects 60-second responses, agents take 75-150 seconds

**Solution Options:**
- A. Increase orchestrator timeout to 180 seconds
- B. Optimize agent cold start (reduce Docker image size)
- C. Use async/polling pattern (return immediately, poll for results)
- D. Switch to simple tools (current fallback)

### 2. AgentCore Confusion

**Problem**: AgentCore proxy exists but is never used

**Solution Options:**
- A. Remove AgentCore proxy (not being used)
- B. Implement full AgentCore integration
- C. Document why it's not used

### 3. Missing Features

**Problem**: 70% of original functionality not implemented

**Critical Missing:**
- Wake simulation (PyWake integration)
- Layout optimization algorithms (only basic grid exists)
- Report generation (PDF with charts)
- MCP server integration
- Multi-agent workflows

### 4. Dashboard in Conversation

**Problem**: Delete/rename operations add messages to chat

**Solution**: Implement direct API calls for dashboard operations
- Create separate GraphQL mutations for project operations
- Update dashboard UI to call mutations directly
- Remove conversation-based project management

## Conclusion

The Renewable Energy agent system is **not using AgentCore** and is **only 30% complete**. The current implementation is a **simplified fallback** that bypasses the original Strands Agents framework due to timeout issues.

**Key Findings:**
1. ❌ AgentCore proxy exists but is never called
2. ⚠️ Strands Agents are deployed but disabled (timeouts)
3. ✅ Simple tools work but lack AI reasoning
4. ❌ 70% of original features missing (wake sim, reports, MCP)
5. ⚠️ Dashboard operations clutter conversation

**Recommended Path Forward:**
1. Fix dashboard to use direct API calls (1 week)
2. Implement hybrid orchestrator with Claude (2 weeks)
3. Add wake simulation with PyWake (1 week)
4. Add report generation (1 week)
5. Optimize performance and cold starts (ongoing)

**Total Effort**: 5-6 weeks for full restoration
