# Design Document - Renewable Energy Integration

## Overview

This design document outlines the architecture for integrating the AWS renewable energy demo (`agentic-ai-for-renewable-site-design-mainline`) into the EDI Platform. The design follows a **zero-modification** approach to the demo code, using a lightweight integration layer to connect the EDI Platform UI to the deployed renewable backend.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EDI Platform (Frontend)                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Chat UI     │───▶│ Agent Router │───▶│ Integration  │     │
│  │  Component   │    │              │    │    Layer     │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                   │              │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                                                    │ HTTP/HTTPS
                                                    │
┌───────────────────────────────────────────────────┼─────────────┐
│              AWS Bedrock AgentCore                │              │
│                                                   ▼              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Renewable Energy Multi-Agent System            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │    │
│  │  │ Terrain  │─▶│  Layout  │─▶│Simulation│─▶│Report │ │    │
│  │  │  Agent   │  │  Agent   │  │  Agent   │  │ Agent │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────┘ │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │         MCP Server (wind_farm_mcp_server.py)     │ │    │
│  │  │  - NREL Wind Data                                 │ │    │
│  │  │  - Turbine Specifications                         │ │    │
│  │  │  - GIS Tools                                      │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   AWS Services        │
                    │  - S3 (Storage)       │
                    │  - Bedrock (Models)   │
                    │  - Cognito (Auth)     │
                    └───────────────────────┘
```

### Component Breakdown

#### 1. EDI Platform Frontend (Existing)
- **Chat UI Component**: Existing chat interface where users type queries
- **Agent Router**: Routes queries to appropriate agents (petrophysical, renewable, etc.)
- **Integration Layer**: NEW - Lightweight HTTP client to call AgentCore

#### 2. Renewable Backend (Demo - Unmodified)
- **AgentCore Runtime**: Hosts the multi-agent system
- **Strands Agents**: Terrain, Layout, Simulation, Report agents
- **MCP Server**: Provides tools for wind data, turbine specs, GIS operations
- **Visualization Utils**: Folium maps and matplotlib charts

#### 3. AWS Services
- **S3**: Stores generated maps, layouts, and reports
- **Bedrock**: Provides Claude 3.7 Sonnet for agent reasoning
- **Cognito**: EDI Platform's user pool for authentication

## Components and Interfaces

### 1. Integration Layer

**Location**: `src/services/renewable-integration/`

**Purpose**: Lightweight HTTP client that forwards renewable queries to AgentCore and transforms responses.

**Files**:
```
src/services/renewable-integration/
├── renewableClient.ts          # HTTP client for AgentCore
├── responseTransformer.ts      # Transforms AgentCore responses to EDI artifacts
├── types.ts                    # TypeScript types for renewable data
└── config.ts                   # Configuration (endpoint URL, auth)
```

**Interface**:
```typescript
// renewableClient.ts
export class RenewableClient {
  private agentCoreEndpoint: string;
  private cognitoToken: string;

  constructor(config: RenewableConfig) {
    this.agentCoreEndpoint = config.endpoint;
    this.cognitoToken = config.token;
  }

  async invokeAgent(prompt: string): Promise<AgentCoreResponse> {
    // Call AgentCore invoke endpoint
    // Handle streaming responses (SSE)
    // Return structured response
  }
}

// responseTransformer.ts
export class ResponseTransformer {
  transformToEDIArtifact(agentResponse: AgentCoreResponse): EDIArtifact {
    // Transform AgentCore response to EDI Platform artifact format
    // Extract Folium maps, matplotlib charts, GeoJSON data
    // Return artifact ready for UI rendering
  }
}
```

### 2. Agent Router Updates

**Location**: `amplify/functions/agents/agentRouter.ts`

**Changes**: Minimal - add renewable pattern detection

**Pattern Detection**:
```typescript
// Add to existing pattern matching
const renewablePatterns = [
  /wind\s+farm/i,
  /turbine/i,
  /renewable\s+energy/i,
  /terrain.*wind/i,
  /layout.*optimization/i,
  /wake.*simulation/i,
  /wind.*resource/i
];

function isRenewableQuery(query: string): boolean {
  return renewablePatterns.some(pattern => pattern.test(query));
}

// In routing logic
if (isRenewableQuery(message)) {
  return await routeToRenewableBackend(message);
}
```

### 3. Renewable Proxy Agent

**Location**: `amplify/functions/agents/renewableProxyAgent.ts`

**Purpose**: Thin proxy that delegates to the renewable backend

**Implementation**:
```typescript
export class RenewableProxyAgent {
  private client: RenewableClient;

  async processQuery(message: string): Promise<RouterResponse> {
    // Forward to AgentCore
    const agentResponse = await this.client.invokeAgent(message);
    
    // Transform response
    const artifacts = ResponseTransformer.transformToEDIArtifact(agentResponse);
    
    // Return in EDI Platform format
    return {
      success: true,
      message: agentResponse.message,
      artifacts: artifacts,
      agentUsed: 'renewable_energy',
      thoughtSteps: agentResponse.thoughtSteps
    };
  }
}
```

### 4. UI Components for Renewable Artifacts

**Location**: `src/components/renewable/`

**Purpose**: Render renewable-specific artifacts (maps, charts, reports)

**Files**:
```
src/components/renewable/
├── TerrainMapArtifact.tsx      # Renders Folium terrain maps
├── LayoutMapArtifact.tsx       # Renders Folium layout maps
├── SimulationChartArtifact.tsx # Renders matplotlib simulation charts
├── ReportArtifact.tsx          # Renders executive reports
└── types.ts                    # TypeScript types for artifacts
```

**Artifact Rendering**:
```typescript
// TerrainMapArtifact.tsx
export function TerrainMapArtifact({ artifact }: { artifact: TerrainArtifact }) {
  // artifact.mapHtml contains Folium-generated HTML
  return (
    <div className="terrain-map-container">
      <h3>{artifact.title}</h3>
      <iframe
        srcDoc={artifact.mapHtml}
        style={{ width: '100%', height: '600px', border: 'none' }}
        title="Terrain Analysis Map"
      />
      <div className="terrain-summary">
        <p>Suitability Score: {artifact.suitabilityScore}%</p>
        <p>Exclusion Zones: {artifact.exclusionZones.length}</p>
      </div>
    </div>
  );
}
```

### 5. Artifact Type Registry

**Location**: `src/components/artifacts/ArtifactRenderer.tsx`

**Changes**: Add renewable artifact types to existing registry

```typescript
// Add to existing artifact type mapping
const artifactComponents = {
  // Existing types
  'log_visualization': LogVisualizationArtifact,
  'well_correlation': WellCorrelationArtifact,
  
  // NEW: Renewable types
  'wind_farm_terrain_analysis': TerrainMapArtifact,
  'wind_farm_layout': LayoutMapArtifact,
  'wind_farm_simulation': SimulationChartArtifact,
  'wind_farm_report': ReportArtifact,
};
```

## Data Models

### AgentCore Request/Response

```typescript
// Request to AgentCore
interface AgentCoreRequest {
  prompt: string;
  sessionId?: string;
  userId?: string;
}

// Response from AgentCore
interface AgentCoreResponse {
  message: string;
  artifacts: AgentCoreArtifact[];
  thoughtSteps: ThoughtStep[];
  projectId: string;
  status: 'success' | 'error';
}

// Artifact from AgentCore
interface AgentCoreArtifact {
  type: 'terrain' | 'layout' | 'simulation' | 'report';
  data: {
    mapHtml?: string;           // Folium HTML
    chartImage?: string;        // Base64 matplotlib image
    geojson?: GeoJSON;          // GeoJSON data
    metrics?: Record<string, any>;
  };
  metadata: {
    projectId: string;
    timestamp: string;
    s3Url?: string;
  };
}
```

### EDI Platform Artifacts

```typescript
// Terrain Analysis Artifact
interface TerrainArtifact {
  messageContentType: 'wind_farm_terrain_analysis';
  title: string;
  projectId: string;
  coordinates: { lat: number; lng: number };
  suitabilityScore: number;
  exclusionZones: ExclusionZone[];
  mapHtml: string;              // Folium HTML
  s3Url?: string;
}

// Layout Artifact
interface LayoutArtifact {
  messageContentType: 'wind_farm_layout';
  title: string;
  projectId: string;
  turbineCount: number;
  totalCapacity: number;
  turbinePositions: TurbinePosition[];
  mapHtml: string;              // Folium HTML
  geojson: GeoJSON;
  s3Url?: string;
}

// Simulation Artifact
interface SimulationArtifact {
  messageContentType: 'wind_farm_simulation';
  title: string;
  projectId: string;
  performanceMetrics: {
    annualEnergyProduction: number;
    capacityFactor: number;
    wakeLosses: number;
  };
  chartImages: {
    wakeMap: string;            // Base64 image
    performanceChart: string;   // Base64 image
  };
  s3Url?: string;
}

// Report Artifact
interface ReportArtifact {
  messageContentType: 'wind_farm_report';
  title: string;
  projectId: string;
  executiveSummary: string;
  recommendations: string[];
  reportHtml: string;
  s3Url?: string;
}
```

## Error Handling

### Error Scenarios

1. **AgentCore Unavailable**
   - Catch connection errors
   - Display user-friendly message: "Renewable energy service is temporarily unavailable"
   - Log error for debugging

2. **Authentication Failure**
   - Catch 401/403 errors
   - Prompt user to re-authenticate
   - Retry with refreshed token

3. **Agent Execution Error**
   - AgentCore returns error status
   - Display agent's error message to user
   - Provide guidance on how to fix (e.g., "Please provide coordinates in format: lat, lng")

4. **Visualization Generation Error**
   - Folium/matplotlib fails to generate output
   - Display text-only results
   - Log error and notify user that visualization is unavailable

### Error Handling Implementation

```typescript
export class RenewableClient {
  async invokeAgent(prompt: string): Promise<AgentCoreResponse> {
    try {
      const response = await fetch(this.agentCoreEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cognitoToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError('Authentication failed');
        }
        throw new AgentCoreError(`AgentCore returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Handle auth error
        throw error;
      } else if (error instanceof TypeError) {
        // Network error
        throw new ConnectionError('Unable to connect to renewable energy service');
      } else {
        // Unknown error
        throw new AgentCoreError('Unexpected error occurred');
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **RenewableClient Tests**
   - Test successful AgentCore invocation
   - Test error handling (network, auth, server errors)
   - Test response parsing

2. **ResponseTransformer Tests**
   - Test transformation of terrain artifacts
   - Test transformation of layout artifacts
   - Test transformation of simulation artifacts
   - Test handling of missing/malformed data

3. **Agent Router Tests**
   - Test renewable pattern detection
   - Test routing to renewable proxy
   - Test fallback to other agents

### Integration Tests

1. **End-to-End Flow**
   - User types renewable query
   - Query routed to renewable backend
   - Response transformed and displayed
   - Artifacts rendered correctly

2. **Visualization Rendering**
   - Folium maps display correctly
   - Matplotlib charts display correctly
   - Interactive map features work (zoom, pan, layers)

3. **Error Scenarios**
   - Backend unavailable
   - Invalid query format
   - Visualization generation failure

### Manual Testing

1. **Test Queries**
   ```
   - "Analyze terrain for wind farm at 35.067482, -101.395466"
   - "Create a 30MW wind farm layout at those coordinates"
   - "Run wake simulation for the layout"
   - "Generate executive report"
   ```

2. **Validation Checklist**
   - [ ] Query detected as renewable
   - [ ] Routed to renewable backend
   - [ ] AgentCore invoked successfully
   - [ ] Response received and parsed
   - [ ] Artifacts transformed correctly
   - [ ] Maps display with correct tile layers
   - [ ] Charts display with correct data
   - [ ] Thought steps visible in UI
   - [ ] Error handling works correctly

## Deployment Strategy

### Phase 1: Deploy Renewable Backend

**Steps**:
1. Navigate to `agentic-ai-for-renewable-site-design-mainline/workshop-assets/`
2. Configure environment variables:
   ```bash
   export AWS_REGION=us-west-2
   export AWS_PROFILE=edi-platform
   ```
3. Configure S3 storage via SSM:
   ```bash
   aws ssm put-parameter \
     --name "/wind-farm-assistant/s3-bucket-name" \
     --value "edi-platform-renewable-assets" \
     --type "String"
   
   aws ssm put-parameter \
     --name "/wind-farm-assistant/use-s3-storage" \
     --value "true" \
     --type "String"
   ```
4. Run deployment script:
   ```bash
   ./deploy-to-agentcore.sh
   ```
5. Note the AgentCore endpoint URL from deployment output

### Phase 2: Remove Incorrect TypeScript Code

**Files to Remove**:
- `amplify/functions/agents/renewableEnergyAgent.ts`
- `amplify/functions/tools/renewableTerrainAnalysisTool.ts`
- `amplify/functions/tools/renewableLayoutOptimizationTool.ts`
- `amplify/functions/tools/renewableSimulationTool.ts`

**Files to Keep** (for reference/documentation):
- Move to `docs/deprecated/renewable-typescript-attempt/`

### Phase 3: Implement Integration Layer

**Steps**:
1. Create `src/services/renewable-integration/` directory
2. Implement `RenewableClient` class
3. Implement `ResponseTransformer` class
4. Add configuration management
5. Write unit tests

### Phase 4: Update Agent Router

**Steps**:
1. Add renewable pattern detection to `agentRouter.ts`
2. Create `renewableProxyAgent.ts`
3. Update routing logic to call proxy agent
4. Test routing with sample queries

### Phase 5: Implement UI Components

**Steps**:
1. Create `src/components/renewable/` directory
2. Implement artifact components (Terrain, Layout, Simulation, Report)
3. Update `ArtifactRenderer.tsx` to register new types
4. Test rendering with sample artifacts

### Phase 6: Integration Testing

**Steps**:
1. Deploy frontend changes
2. Test end-to-end flow with real queries
3. Validate visualizations display correctly
4. Test error scenarios
5. Performance testing

### Phase 7: Documentation

**Steps**:
1. Document AgentCore endpoint configuration
2. Document environment variables
3. Document sample queries
4. Document troubleshooting steps
5. Update README with renewable integration details

## Configuration Management

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm
NEXT_PUBLIC_RENEWABLE_ENABLED=true

# Backend (SSM Parameters)
/wind-farm-assistant/s3-bucket-name=edi-platform-renewable-assets
/wind-farm-assistant/use-s3-storage=true
/wind-farm-assistant/agentcore-endpoint=<endpoint-url>
```

### Configuration File

```typescript
// src/services/renewable-integration/config.ts
export interface RenewableConfig {
  enabled: boolean;
  agentCoreEndpoint: string;
  s3Bucket: string;
  region: string;
}

export function getRenewableConfig(): RenewableConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED === 'true',
    agentCoreEndpoint: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
    s3Bucket: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'us-west-2'
  };
}
```

## Security Considerations

### Authentication
- Use EDI Platform's Cognito tokens for AgentCore authentication
- Tokens passed in Authorization header
- Implement token refresh logic

### Authorization
- AgentCore validates user permissions
- S3 bucket access controlled via IAM roles
- Bedrock model access controlled via IAM policies

### Data Privacy
- User queries logged for debugging (with PII redaction)
- Generated artifacts stored in user-specific S3 prefixes
- Temporary files cleaned up after processing

## Performance Considerations

### Response Times
- AgentCore invocation: 10-30 seconds (multi-agent workflow)
- Visualization generation: 2-5 seconds
- Total user-facing latency: 15-35 seconds

### Optimization Strategies
1. **Streaming Responses**: Use SSE to stream thought steps and partial results
2. **Caching**: Cache turbine specifications and wind data
3. **Async Processing**: Show thought steps while agents work
4. **Progressive Rendering**: Display artifacts as they're generated

### Scalability
- AgentCore handles scaling automatically
- S3 storage scales infinitely
- Frontend caching reduces repeated requests

## Monitoring and Logging

### Metrics to Track
- AgentCore invocation count
- Average response time
- Error rate by type
- Artifact generation success rate
- User query patterns

### Logging Strategy
- Frontend: Log query routing decisions
- Integration Layer: Log AgentCore requests/responses
- Backend: AgentCore provides built-in logging
- Errors: Capture full stack traces for debugging

### Monitoring Tools
- CloudWatch for AgentCore metrics
- X-Ray for distributed tracing
- Frontend analytics for user interactions

## Rollback Plan

### If Integration Fails
1. Disable renewable routing in agent router
2. Return graceful error message to users
3. Investigate logs and fix issues
4. Re-enable after validation

### If Backend Fails
1. AgentCore provides automatic rollback
2. Redeploy previous version if needed
3. Frontend continues to work for non-renewable queries

## Success Metrics

### Technical Metrics
- Zero modifications to demo code ✓
- Integration layer < 500 lines of code ✓
- Response time < 35 seconds ✓
- Error rate < 5% ✓

### User Experience Metrics
- Users can type renewable queries ✓
- Visualizations display correctly ✓
- Thought steps visible ✓
- Error messages clear and actionable ✓

## Future Enhancements

### Phase 2 Features
1. **Project Management**: Save and load wind farm projects
2. **Comparison Tool**: Compare multiple layout options
3. **Export Functionality**: Export reports as PDF
4. **Advanced Visualizations**: 3D terrain views, animated wake simulations

### Phase 3 Features
1. **Real-time Collaboration**: Multiple users working on same project
2. **Cost Optimization**: Financial modeling and ROI calculations
3. **Regulatory Compliance**: Automated permit application generation
4. **Integration with GIS Systems**: Import/export to ArcGIS, QGIS

## Conclusion

This design provides a clean, minimal-code integration of the renewable energy demo into the EDI Platform. By using the demo's backend as-is and creating a lightweight integration layer, we:

1. Avoid breaking the proven renewable demo implementation
2. Minimize code changes and maintenance burden
3. Enable easy updates when the demo is improved
4. Provide a seamless user experience in the EDI Platform UI
5. Maintain separation of concerns between petrophysical and renewable features

The architecture is scalable, maintainable, and follows the principle of "use what works, don't reinvent."
