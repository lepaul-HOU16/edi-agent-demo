# Tasks 2 & 3 Complete: Lambda Integration for Strands Agents

## What We Built

### 1. Lambda Handler (`lambda_handler.py`)
Created a proper Lambda wrapper that:
- Initializes all Strands Agents once per container (warm start optimization)
- Routes requests to appropriate agent (terrain, layout, simulation, report, or multi-agent)
- Extracts artifacts from agent responses
- Handles errors gracefully
- Returns properly formatted responses

### 2. Dependencies (`requirements.txt`)
Added ALL required packages:
- `strands-agents` - Core agent framework
- `strands-agents-tools` - Agent tools
- `bedrock-agentcore` - AgentCore integration
- `boto3` - AWS SDK
- `mcp` - Model Context Protocol
- `py-wake` - Wind farm simulation
- `geopandas`, `shapely` - Geospatial analysis
- `matplotlib`, `folium`, `plotly` - Visualization
- And more...

### 3. Amplify Resource (`resource.ts`)
Defined the Lambda function with:
- Python 3.12 runtime
- 15-minute timeout (agents need time)
- 3GB memory (PyWake simulations are heavy)
- Bedrock model configuration
- Environment variables for agents

### 4. Backend Integration (`backend.ts`)
Added to Amplify backend:
- Imported `renewableAgentsFunction`
- Added to `defineBackend()` 
- Granted **Bedrock permissions** for Claude 3.7 Sonnet
- Granted **S3 permissions** for artifact storage
- Set environment variables (S3 bucket name, model ID, etc.)

## Key Features

### Intelligent Agent Routing
```python
if agent_type == 'multi':
    response = _agent_graph(full_query)  # Multi-agent orchestration
elif agent_type == 'terrain':
    response = _terrain_agent_instance(full_query)  # Terrain analysis
elif agent_type == 'layout':
    response = _layout_agent_instance(full_query)  # Layout optimization
# ... etc
```

### Artifact Extraction
Automatically extracts artifacts from agent responses:
- S3 URLs for maps, layouts, simulations
- Project IDs from response footers
- Artifact types (terrain, layout, wind_rose, etc.)

### Warm Start Optimization
Agents initialized once per Lambda container:
```python
_agent_graph = None  # Global variable
def initialize_agents():
    global _agent_graph
    if _agent_graph is not None:
        return  # Reuse existing agents
    # Initialize once...
```

## Permissions Granted

### Bedrock Access
```typescript
actions: [
  'bedrock:InvokeModel',
  'bedrock:InvokeModelWithResponseStream'
],
resources: [
  'arn:aws:bedrock:*::foundation-model/us.anthropic.claude-3-7-sonnet-*'
]
```

### S3 Access
```typescript
actions: [
  's3:GetObject',
  's3:PutObject',
  's3:ListBucket',
  's3:DeleteObject'
]
```

## Environment Variables Set

- `AWS_REGION`: us-west-2
- `BEDROCK_MODEL_ID`: us.anthropic.claude-3-7-sonnet-20250219-v1:0
- `RENEWABLE_S3_BUCKET`: Amplify storage bucket name
- `GET_INFO_LOGS`: true (enable agent logging)
- `DISABLE_CALLBACK_HANDLER`: false (enable callbacks)

## What This Enables

### Before (WRONG):
```python
# Direct function call - no intelligence
def handler(event, context):
    lat = event['latitude']
    lon = event['longitude']
    result = create_grid_layout(lat, lon, 30)  # Always grid!
    return result
```

### After (CORRECT):
```python
# Strands Agent with intelligence
def handler(event, context):
    query = event['query']  # "Create a 30MW wind farm..."
    response = layout_agent(query)  # Agent decides algorithm!
    return response
```

The agent reads its system prompt and decides:
- Which layout algorithm to use (grid, greedy, spiral, offset-grid)
- Whether to auto-relocate turbines
- Whether to explore alternative sites
- How to handle constraints

## Next Steps

### Task 4: Update Tool Handlers
Now we need to update the existing tool handlers to call the Strands Agent instead of direct functions:

1. **Terrain handler** → Call `renewableAgentsFunction` with `agent: 'terrain'`
2. **Layout handler** → Call `renewableAgentsFunction` with `agent: 'layout'`
3. **Simulation handler** → Call `renewableAgentsFunction` with `agent: 'simulation'`
4. **Report handler** → Call `renewableAgentsFunction` with `agent: 'report'`

Or better yet:

### Task 2 (Alternative): Replace Orchestrator
Replace the TypeScript orchestrator entirely with a call to the multi-agent system:
- Call `renewableAgentsFunction` with `agent: 'multi'`
- Let the multi-agent graph handle the entire workflow
- Terrain → Layout → Simulation → Report all orchestrated by agents

## Status

✅ Task 1: Complete - All agent files copied
✅ Task 2: Complete - Orchestrator approach defined
✅ Task 3: Complete - Lambda integration done
⏳ Task 4: Ready - Update handlers to use agents
⏳ Task 5-9: Pending

## Testing

To test locally:
```bash
cd amplify/functions/renewableAgents
python lambda_handler.py
```

To deploy:
```bash
npx ampx sandbox
```

The Strands Agent system is now ready to be invoked from Lambda!
