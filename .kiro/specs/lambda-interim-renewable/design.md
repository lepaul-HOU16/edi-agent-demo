# Design Document - Lambda-Based Interim Renewable Solution

## Overview

This design document outlines a simplified Lambda-based architecture for renewable energy analysis that works TODAY without waiting for AWS Bedrock AgentCore GA. The solution uses the SAME Python tools from the renewable demo but replaces the complex multi-agent orchestration framework with simple Lambda function calls.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EDI Platform (Frontend)                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Chat UI     │───▶│ Agent Router │───▶│ Renewable    │     │
│  │  Component   │    │              │    │ Client       │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                   │              │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │ AWS SDK
                                                    │
┌───────────────────────────────────────────────────┼─────────────┐
│                    AWS Lambda Functions           │              │
│                                                   ▼              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         TypeScript Orchestrator Lambda                 │    │
│  │  - Parses user query                                   │    │
│  │  - Determines which tool(s) to call                    │    │
│  │  - Invokes Python tool Lambdas                         │    │
│  │  - Aggregates results                                  │    │
│  │  - Formats as EDI artifacts                            │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       │ Invokes via AWS SDK                      │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Python Tool Lambdas (from demo)                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │    │
│  │  │ Terrain  │  │  Layout  │  │Simulation│  │Report │ │    │
│  │  │ Analysis │  │  Optimizer│  │  Engine  │  │ Gen   │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────┘ │    │
│  │                                                         │    │
│  │  Each Lambda contains:                                 │    │
│  │  - Actual Python code from renewable demo              │    │
│  │  - GIS utilities, py-wake, visualization_utils         │    │
│  │  - NREL API integration                                │    │
│  │  - Folium/matplotlib generation                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   AWS Services        │
                    │  - S3 (Storage)       │
                    │  - Bedrock (AI)       │
                    │  - SSM (Config)       │
                    └───────────────────────┘
```

### Key Difference from AgentCore Approach

| Aspect | AgentCore Approach | Lambda Approach |
|--------|-------------------|-----------------|
| **Orchestration** | Multi-agent framework (Strands/LangGraph) | Simple TypeScript function |
| **Tool Execution** | AgentCore runtime invokes tools | Lambda invokes Lambda |
| **Deployment** | Requires AgentCore GA | Works TODAY with standard Lambda |
| **Complexity** | High (agent framework) | Low (function calls) |
| **Python Tools** | ✅ Same renewable demo code | ✅ Same renewable demo code |
| **Data Quality** | ✅ Real NREL/GIS data | ✅ Real NREL/GIS data |
| **Visualizations** | ✅ Real Folium/matplotlib | ✅ Real Folium/matplotlib |
| **Migration Path** | N/A | Easy upgrade to AgentCore later |

## Components and Interfaces

### 1. TypeScript Orchestrator Lambda

**Location**: `amplify/functions/renewableOrchestrator/`

**Purpose**: Simple orchestration logic that replaces multi-agent framework

**Handler**:
```typescript
// handler.ts
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

interface OrchestratorRequest {
  query: string;
  userId: string;
  sessionId: string;
}

interface OrchestratorResponse {
  success: boolean;
  message: string;
  artifacts: Artifact[];
  thoughtSteps: ThoughtStep[];
}

export async function handler(event: OrchestratorRequest): Promise<OrchestratorResponse> {
  const lambdaClient = new LambdaClient({});
  
  // Parse query to determine intent
  const intent = parseIntent(event.query);
  
  // Call appropriate Python tool Lambda(s)
  const results = await callToolLambdas(lambdaClient, intent, event.query);
  
  // Format results as EDI artifacts
  const artifacts = formatArtifacts(results);
  
  return {
    success: true,
    message: generateResponseMessage(results),
    artifacts,
    thoughtSteps: generateThoughtSteps(intent, results)
  };
}

function parseIntent(query: string): RenewableIntent {
  // Simple pattern matching (no complex NLP needed)
  if (/terrain|analyze.*site|suitability/i.test(query)) {
    return { type: 'terrain_analysis', params: extractCoordinates(query) };
  }
  if (/layout|turbine.*placement|design/i.test(query)) {
    return { type: 'layout_optimization', params: extractLayoutParams(query) };
  }
  if (/simulation|wake|performance|aep/i.test(query)) {
    return { type: 'wake_simulation', params: extractSimParams(query) };
  }
  if (/report|summary|executive/i.test(query)) {
    return { type: 'report_generation', params: {} };
  }
  
  // Default: terrain analysis
  return { type: 'terrain_analysis', params: extractCoordinates(query) };
}

async function callToolLambdas(
  client: LambdaClient,
  intent: RenewableIntent,
  query: string
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  // Call the appropriate Python tool Lambda
  switch (intent.type) {
    case 'terrain_analysis':
      const terrainResult = await invokeLambda(client, 'renewableTerrainTool', {
        coordinates: intent.params.coordinates,
        query
      });
      results.push(terrainResult);
      break;
      
    case 'layout_optimization':
      const layoutResult = await invokeLambda(client, 'renewableLayoutTool', {
        coordinates: intent.params.coordinates,
        capacity: intent.params.capacity,
        query
      });
      results.push(layoutResult);
      break;
      
    case 'wake_simulation':
      const simResult = await invokeLambda(client, 'renewableSimulationTool', {
        layoutId: intent.params.layoutId,
        query
      });
      results.push(simResult);
      break;
      
    case 'report_generation':
      const reportResult = await invokeLambda(client, 'renewableReportTool', {
        projectId: intent.params.projectId,
        query
      });
      results.push(reportResult);
      break;
  }
  
  return results;
}

async function invokeLambda(
  client: LambdaClient,
  functionName: string,
  payload: any
): Promise<ToolResult> {
  const command = new InvokeCommand({
    FunctionName: process.env[`${functionName.toUpperCase()}_FUNCTION_NAME`],
    Payload: JSON.stringify(payload)
  });
  
  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  
  return result;
}
```

### 2. Python Tool Lambdas

**Location**: `amplify/functions/renewableTools/`

**Purpose**: Wrap the renewable demo's actual Python tools in Lambda handlers

#### Terrain Analysis Lambda

```python
# amplify/functions/renewableTools/terrain/handler.py
import json
import sys
import os

# Add demo code to Python path
sys.path.insert(0, '/opt/python/renewable-demo')

# Import ACTUAL renewable demo code
from exploratory.terrain_analysis import analyze_terrain_suitability
from exploratory.visualization_utils import create_terrain_map
from exploratory.gis_utils import fetch_elevation_data, fetch_land_use_data

def handler(event, context):
    """
    Wraps the renewable demo's terrain analysis tool
    """
    try:
        coordinates = event['coordinates']
        lat, lng = coordinates['lat'], coordinates['lng']
        
        # Call ACTUAL renewable demo functions
        elevation_data = fetch_elevation_data(lat, lng, radius_km=5)
        land_use_data = fetch_land_use_data(lat, lng, radius_km=5)
        
        suitability = analyze_terrain_suitability(
            elevation_data,
            land_use_data,
            lat,
            lng
        )
        
        # Generate ACTUAL Folium map from demo
        terrain_map_html = create_terrain_map(
            lat, lng,
            elevation_data,
            land_use_data,
            suitability
        )
        
        # Store map in S3
        s3_url = store_in_s3(terrain_map_html, 'terrain-map.html')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'terrain_analysis',
                'data': {
                    'coordinates': {'lat': lat, 'lng': lng},
                    'suitabilityScore': suitability['overall_score'],
                    'exclusionZones': suitability['exclusion_zones'],
                    'mapHtml': terrain_map_html,
                    's3Url': s3_url,
                    'metrics': {
                        'avgElevation': elevation_data['avg_elevation'],
                        'slopeVariance': elevation_data['slope_variance'],
                        'suitableArea': suitability['suitable_area_km2']
                    }
                }
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
```

#### Layout Optimization Lambda

```python
# amplify/functions/renewableTools/layout/handler.py
import json
import sys
sys.path.insert(0, '/opt/python/renewable-demo')

# Import ACTUAL renewable demo code
from exploratory.layout_optimization import optimize_turbine_layout
from exploratory.visualization_utils import create_layout_map
from exploratory.turbine_specs import get_turbine_specifications

def handler(event, context):
    """
    Wraps the renewable demo's layout optimization tool
    """
    try:
        coordinates = event['coordinates']
        capacity_mw = event.get('capacity', 30)  # Default 30MW
        
        lat, lng = coordinates['lat'], coordinates['lng']
        
        # Get ACTUAL turbine specs from demo
        turbine_spec = get_turbine_specifications('default')
        
        # Call ACTUAL layout optimization from demo
        layout = optimize_turbine_layout(
            lat, lng,
            target_capacity_mw=capacity_mw,
            turbine_spec=turbine_spec,
            exclusion_zones=event.get('exclusionZones', [])
        )
        
        # Generate ACTUAL Folium map from demo
        layout_map_html = create_layout_map(
            lat, lng,
            layout['turbine_positions'],
            turbine_spec
        )
        
        # Store in S3
        s3_url = store_in_s3(layout_map_html, 'layout-map.html')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'layout_optimization',
                'data': {
                    'turbineCount': len(layout['turbine_positions']),
                    'totalCapacity': layout['total_capacity_mw'],
                    'turbinePositions': layout['turbine_positions'],
                    'mapHtml': layout_map_html,
                    'geojson': layout['geojson'],
                    's3Url': s3_url
                }
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
```

#### Wake Simulation Lambda

```python
# amplify/functions/renewableTools/simulation/handler.py
import json
import sys
sys.path.insert(0, '/opt/python/renewable-demo')

# Import ACTUAL renewable demo code
from exploratory.wake_simulation import run_wake_simulation
from exploratory.visualization_utils import create_wake_map, create_performance_chart
from exploratory.wind_data import fetch_nrel_wind_data

def handler(event, context):
    """
    Wraps the renewable demo's wake simulation tool
    """
    try:
        layout = event['layout']
        coordinates = layout['coordinates']
        
        # Fetch REAL NREL wind data
        wind_data = fetch_nrel_wind_data(
            coordinates['lat'],
            coordinates['lng']
        )
        
        # Run ACTUAL py-wake simulation from demo
        simulation_results = run_wake_simulation(
            layout['turbine_positions'],
            wind_data,
            layout['turbine_spec']
        )
        
        # Generate ACTUAL visualizations from demo
        wake_map_html = create_wake_map(
            layout['turbine_positions'],
            simulation_results['wake_losses']
        )
        
        performance_chart_base64 = create_performance_chart(
            simulation_results['monthly_production']
        )
        
        # Store in S3
        s3_url_map = store_in_s3(wake_map_html, 'wake-map.html')
        s3_url_chart = store_in_s3(performance_chart_base64, 'performance-chart.png')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'wake_simulation',
                'data': {
                    'performanceMetrics': {
                        'annualEnergyProduction': simulation_results['aep_gwh'],
                        'capacityFactor': simulation_results['capacity_factor'],
                        'wakeLosses': simulation_results['wake_loss_percent']
                    },
                    'chartImages': {
                        'wakeMap': wake_map_html,
                        'performanceChart': performance_chart_base64
                    },
                    's3Urls': {
                        'wakeMap': s3_url_map,
                        'performanceChart': s3_url_chart
                    }
                }
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
```

### 3. Lambda Layer with Renewable Demo Code

**Location**: `amplify/layers/renewableDemo/`

**Purpose**: Package the renewable demo's Python code as a Lambda layer

**Structure**:
```
amplify/layers/renewableDemo/
├── python/
│   └── renewable-demo/
│       ├── exploratory/
│       │   ├── terrain_analysis.py      # From demo
│       │   ├── layout_optimization.py   # From demo
│       │   ├── wake_simulation.py       # From demo
│       │   ├── visualization_utils.py   # From demo
│       │   ├── gis_utils.py            # From demo
│       │   ├── wind_data.py            # From demo
│       │   └── turbine_specs.py        # From demo
│       └── requirements.txt
└── build.sh
```

**Build Script**:
```bash
#!/bin/bash
# amplify/layers/renewableDemo/build.sh

# Copy renewable demo code
cp -r ../../agentic-ai-for-renewable-site-design-mainline/exploratory python/renewable-demo/

# Install dependencies
pip install -r python/renewable-demo/requirements.txt -t python/

# Create layer zip
zip -r renewable-demo-layer.zip python/
```

### 4. Frontend Integration (Reuse Existing)

The frontend integration remains THE SAME as the AgentCore approach:
- Same `RenewableClient` (just different endpoint)
- Same `ResponseTransformer`
- Same UI components
- Same artifact types

**Only change needed**:
```typescript
// src/services/renewable-integration/config.ts
export function getRenewableConfig(): RenewableConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED === 'true',
    // Lambda orchestrator endpoint instead of AgentCore
    endpoint: process.env.NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT || '',
    s3Bucket: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'us-west-2'
  };
}
```

## Data Models

### Orchestrator Request/Response

```typescript
interface OrchestratorRequest {
  query: string;
  userId: string;
  sessionId: string;
  context?: {
    previousResults?: any;
    projectId?: string;
  };
}

interface OrchestratorResponse {
  success: boolean;
  message: string;
  artifacts: Artifact[];
  thoughtSteps: ThoughtStep[];
  metadata: {
    executionTime: number;
    toolsUsed: string[];
    costs: {
      lambdaInvocations: number;
      bedrockTokens: number;
    };
  };
}
```

### Tool Lambda Request/Response

```typescript
interface ToolRequest {
  query: string;
  parameters: Record<string, any>;
  context?: any;
}

interface ToolResponse {
  success: boolean;
  type: 'terrain_analysis' | 'layout_optimization' | 'wake_simulation' | 'report_generation';
  data: {
    // Tool-specific data
    mapHtml?: string;
    geojson?: any;
    metrics?: Record<string, number>;
    chartImages?: Record<string, string>;
    s3Url?: string;
  };
  error?: string;
}
```

## Error Handling

### Error Scenarios

1. **Lambda Invocation Failure**
   - Catch Lambda SDK errors
   - Retry with exponential backoff
   - Fall back to cached results if available
   - Return user-friendly error message

2. **Python Tool Execution Error**
   - Tool Lambda catches Python exceptions
   - Returns structured error response
   - Orchestrator displays error to user
   - Logs full stack trace for debugging

3. **External API Failure (NREL, USGS)**
   - Tool Lambda catches API errors
   - Falls back to cached/default data
   - Continues with degraded functionality
   - Notifies user of data limitations

4. **Visualization Generation Error**
   - Catch Folium/matplotlib errors
   - Return text-only results
   - Log error for investigation
   - Suggest retry to user

### Error Handling Implementation

```typescript
// Orchestrator error handling
async function callToolLambdas(
  client: LambdaClient,
  intent: RenewableIntent,
  query: string
): Promise<ToolResult[]> {
  try {
    const result = await invokeLambdaWithRetry(client, intent.type, {
      query,
      parameters: intent.params
    });
    
    if (!result.success) {
      throw new ToolExecutionError(result.error);
    }
    
    return [result];
  } catch (error) {
    if (error instanceof ToolExecutionError) {
      // Return partial results with error message
      return [{
        success: false,
        type: intent.type,
        error: `Tool execution failed: ${error.message}`,
        data: {}
      }];
    }
    throw error;
  }
}

async function invokeLambdaWithRetry(
  client: LambdaClient,
  toolType: string,
  payload: any,
  maxRetries: number = 3
): Promise<ToolResult> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await invokeLambda(client, toolType, payload);
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error(`Lambda invocation failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Testing Strategy

### Unit Tests

1. **Orchestrator Tests**
   - Test intent parsing for various queries
   - Test Lambda invocation logic
   - Test error handling and retries
   - Test artifact formatting

2. **Tool Lambda Tests**
   - Test each Python tool wrapper
   - Test error handling in Python code
   - Test S3 storage operations
   - Test response formatting

3. **Integration Tests**
   - Test orchestrator → tool Lambda flow
   - Test with real renewable demo code
   - Test with mock external APIs
   - Test error scenarios

### Manual Testing

**Test Queries**:
```
1. "Analyze terrain for wind farm at 35.067482, -101.395466"
   Expected: Terrain map with suitability score

2. "Create a 30MW wind farm layout at those coordinates"
   Expected: Layout map with turbine positions

3. "Run wake simulation for the layout"
   Expected: Wake map and performance charts

4. "Generate executive report"
   Expected: Comprehensive report with all results
```

## Deployment Strategy

### Phase 1: Create Lambda Layer

```bash
cd amplify/layers/renewableDemo
./build.sh
aws lambda publish-layer-version \
  --layer-name renewable-demo-code \
  --zip-file fileb://renewable-demo-layer.zip \
  --compatible-runtimes python3.12
```

### Phase 2: Deploy Python Tool Lambdas

```typescript
// amplify/functions/renewableTools/terrain/resource.ts
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export const renewableTerrainTool = defineFunction((scope) => {
  const layer = lambda.LayerVersion.fromLayerVersionArn(
    scope,
    'RenewableDemoLayer',
    process.env.RENEWABLE_DEMO_LAYER_ARN!
  );
  
  return new lambda.Function(scope, 'RenewableTerrainTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(30),
    memorySize: 1024,
    layers: [layer],
    environment: {
      S3_BUCKET: process.env.RENEWABLE_S3_BUCKET!,
      NREL_API_KEY: process.env.NREL_API_KEY!
    }
  });
});
```

### Phase 3: Deploy Orchestrator Lambda

```typescript
// amplify/functions/renewableOrchestrator/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const renewableOrchestrator = defineFunction({
  name: 'renewableOrchestrator',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: '<terrain-lambda-name>',
    RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: '<layout-lambda-name>',
    RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: '<simulation-lambda-name>',
    RENEWABLE_REPORT_TOOL_FUNCTION_NAME: '<report-lambda-name>'
  }
});
```

### Phase 4: Grant IAM Permissions

```typescript
// amplify/backend.ts
import { aws_iam as iam } from 'aws-cdk-lib';

// Grant orchestrator permission to invoke tool Lambdas
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      backend.renewableTerrainTool.resources.lambda.functionArn,
      backend.renewableLayoutTool.resources.lambda.functionArn,
      backend.renewableSimulationTool.resources.lambda.functionArn,
      backend.renewableReportTool.resources.lambda.functionArn
    ]
  })
);

// Grant tool Lambdas permission to access S3
[
  backend.renewableTerrainTool,
  backend.renewableLayoutTool,
  backend.renewableSimulationTool,
  backend.renewableReportTool
].forEach(toolLambda => {
  toolLambda.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject'],
      resources: [`${backend.storage.resources.bucket.bucketArn}/*`]
    })
  );
});
```

### Phase 5: Update Frontend Configuration

```bash
# .env.local
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT=<orchestrator-lambda-url>
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=<s3-bucket-name>
```

### Phase 6: Deploy and Test

```bash
# Deploy all changes
npx ampx sandbox

# Test with sample queries
# (Use chat interface or API testing tool)
```

## Migration Path to AgentCore

When AgentCore becomes GA, migration is straightforward:

### Step 1: Deploy AgentCore Backend
```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
./deploy-to-agentcore.sh
```

### Step 2: Update Frontend Configuration
```bash
# Change endpoint from Lambda to AgentCore
NEXT_PUBLIC_RENEWABLE_LAMBDA_ENDPOINT=<agentcore-endpoint>
```

### Step 3: Deprecate Lambda Orchestrator
- Keep Python tool Lambdas as backup
- Route traffic to AgentCore
- Monitor for issues
- Remove Lambda orchestrator after validation

### Step 4: Enjoy Enhanced Multi-Agent Orchestration
- AgentCore provides better agent coordination
- More sophisticated reasoning
- Better error recovery
- Same underlying tools and data quality

## Performance Considerations

### Expected Latency

| Operation | Lambda Approach | AgentCore Approach |
|-----------|----------------|-------------------|
| Terrain Analysis | 5-10 seconds | 10-15 seconds |
| Layout Optimization | 8-15 seconds | 15-20 seconds |
| Wake Simulation | 10-20 seconds | 15-25 seconds |
| Report Generation | 3-5 seconds | 5-10 seconds |

Lambda approach is actually FASTER because:
- No multi-agent coordination overhead
- Direct function calls
- Simpler orchestration logic

### Cost Comparison

| Approach | Monthly Cost (1000 queries) |
|----------|----------------------------|
| Lambda | ~$20-30 |
| AgentCore | ~$50-100 |

Lambda approach is more cost-effective for interim solution.

### Optimization Strategies

1. **Lambda Warm-up**: Keep Lambdas warm with scheduled invocations
2. **Caching**: Cache turbine specs, wind data, terrain data
3. **Parallel Execution**: Invoke multiple tool Lambdas in parallel when possible
4. **S3 Optimization**: Use S3 Transfer Acceleration for faster uploads

## Security Considerations

### Authentication
- Use Cognito tokens for Lambda invocation
- Validate tokens in orchestrator Lambda
- Pass user context to tool Lambdas

### Authorization
- IAM roles control Lambda-to-Lambda invocation
- S3 bucket policies control artifact storage
- SSM parameters for sensitive configuration

### Data Privacy
- User queries logged with PII redaction
- Artifacts stored in user-specific S3 prefixes
- Temporary files cleaned up after processing

## Monitoring and Logging

### CloudWatch Metrics
- Lambda invocation count
- Lambda duration
- Lambda errors
- S3 upload success rate

### CloudWatch Logs
- Orchestrator decisions
- Tool Lambda execution logs
- Python error stack traces
- External API call logs

### X-Ray Tracing
- End-to-end request tracing
- Lambda-to-Lambda invocation tracking
- External API call tracking

## Success Metrics

### Technical Metrics
- Lambda cold start < 3 seconds
- Tool execution < 30 seconds
- Error rate < 5%
- Cost < $50/month for typical usage

### User Experience Metrics
- Users can analyze wind farms TODAY
- Real data from NREL/USGS
- Real visualizations from demo code
- Clear error messages
- Smooth migration path to AgentCore

## Conclusion

This Lambda-based interim solution provides:

1. **Immediate Availability**: Works TODAY without AgentCore GA
2. **Real Data**: Uses SAME renewable demo tools and data sources
3. **Simplicity**: Simple orchestration instead of complex multi-agent framework
4. **Cost-Effective**: Lower costs than AgentCore for interim period
5. **Easy Migration**: Clear path to AgentCore when it becomes GA
6. **Same Quality**: Same Python tools = same data quality and visualizations

The key insight: We don't need complex multi-agent orchestration to get real renewable energy analysis. Simple Lambda function calls + proven Python tools = production-quality results TODAY.
