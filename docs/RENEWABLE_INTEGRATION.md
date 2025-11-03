# Renewable Energy Integration

## Overview

The EDI Platform now includes renewable energy analysis capabilities through integration with a Python-based multi-agent system deployed on AWS Bedrock AgentCore. This integration enables users to perform wind farm site analysis, layout design, wake simulation, and report generation directly from the chat interface.

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
                                                    │ HTTPS
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

### Component Overview

#### Frontend Components

1. **Chat Interface** (`src/app/chat/`)
   - User input and message display
   - Artifact rendering
   - Thought step visualization

2. **Agent Router** (`amplify/functions/agents/agentRouter.ts`)
   - Detects renewable energy queries
   - Routes to appropriate agent
   - Handles response formatting

3. **Integration Layer** (`src/services/renewable-integration/`)
   - `config.ts`: Configuration management
   - `types.ts`: TypeScript type definitions
   - `renewableClient.ts`: HTTP client for AgentCore
   - `responseTransformer.ts`: Response transformation

4. **Renewable Proxy Agent** (`amplify/functions/agents/renewableProxyAgent.ts`)
   - Bridges EDI Platform and Python backend
   - Handles AgentCore communication
   - Maps thought steps
   - Error handling

5. **UI Components** (`src/components/renewable/`)
   - `TerrainMapArtifact.tsx`: Terrain analysis maps
   - `LayoutMapArtifact.tsx`: Wind farm layout maps
   - `SimulationChartArtifact.tsx`: Performance charts
   - `ReportArtifact.tsx`: Executive reports

#### Backend Components

1. **AgentCore Runtime**
   - Hosts multi-agent system
   - Manages agent orchestration
   - Provides invoke endpoint

2. **Python Agents**
   - Terrain Analysis Agent
   - Layout Design Agent
   - Wake Simulation Agent
   - Report Generation Agent

3. **MCP Server**
   - NREL wind resource data
   - Turbine specifications database
   - GIS analysis tools
   - Visualization utilities

## Data Flow

### Complete Workflow

```
User Query
    ↓
Chat Interface
    ↓
Agent Router (Pattern Detection)
    ↓
Renewable Proxy Agent
    ↓
RenewableClient (HTTP Request)
    ↓
AWS Bedrock AgentCore
    ↓
Multi-Agent System (Python)
    ↓
MCP Server (Tools & Data)
    ↓
AgentCore Response
    ↓
ResponseTransformer
    ↓
EDI Platform Artifacts
    ↓
UI Components (Rendering)
    ↓
User Sees Results
```

### Example: Terrain Analysis Flow

1. **User Input**: "Analyze terrain for wind farm at 35.067482, -101.395466"

2. **Agent Router**: Detects renewable query pattern

3. **Renewable Proxy Agent**: Forwards to AgentCore

4. **AgentCore**: Invokes Terrain Analysis Agent

5. **Terrain Agent**: 
   - Fetches USGS elevation data
   - Analyzes terrain features
   - Identifies exclusion zones
   - Calculates suitability score
   - Generates Folium map

6. **Response**: Returns terrain analysis with map HTML

7. **ResponseTransformer**: Converts to EDI artifact format

8. **TerrainMapArtifact**: Renders interactive map

9. **User**: Sees terrain map with suitability score

## Features

### 1. Terrain Analysis

**Capabilities**:
- USGS elevation data analysis
- Slope and aspect calculation
- Exclusion zone identification (water bodies, protected areas, etc.)
- Site suitability scoring
- Risk assessment (environmental, regulatory, technical)

**Output**:
- Interactive Folium map with multiple tile layers
- Suitability score (0-100%)
- Coordinates and site information
- Exclusion zones list with details
- Risk assessment metrics

**Example Query**:
```
Analyze terrain for wind farm at 35.067482, -101.395466
```

### 2. Layout Design

**Capabilities**:
- Turbine placement optimization
- Spacing calculations (downwind/crosswind)
- Capacity planning
- Layout type selection (Grid, Random, Optimized)
- Wind direction consideration

**Output**:
- Interactive map with turbine positions
- Turbine count and total capacity
- Layout information (type, wind angle, spacing)
- Turbine positions summary
- GeoJSON data for further analysis

**Example Query**:
```
Create a 30MW wind farm layout at those coordinates
```

### 3. Wake Simulation

**Capabilities**:
- PyWake simulation engine
- Wake loss calculations
- Annual Energy Production (AEP) estimation
- Capacity factor calculation
- Performance optimization recommendations

**Output**:
- Wake analysis map (matplotlib)
- Performance charts
- Key metrics (AEP, capacity factor, wake losses)
- Detailed performance data
- Optimization recommendations

**Example Query**:
```
Run wake simulation for the layout
```

### 4. Executive Report

**Capabilities**:
- Comprehensive project summary
- Professional formatting
- Actionable recommendations
- Complete analysis integration

**Output**:
- Executive summary
- Numbered recommendations
- Full detailed report (HTML)
- All previous analysis results
- Professional formatting

**Example Query**:
```
Generate executive report
```

## User Guide

### Getting Started

1. **Navigate to Chat Interface**
   - Open EDI Platform
   - Go to Chat section
   - Sign in with your credentials

2. **Start with Terrain Analysis**
   ```
   Analyze terrain for wind farm at [latitude], [longitude]
   ```
   - Use decimal degrees format
   - Example: 35.067482, -101.395466

3. **Design Layout**
   ```
   Create a [capacity]MW wind farm layout at those coordinates
   ```
   - Specify desired capacity
   - Example: 30MW, 50MW, 100MW

4. **Run Simulation**
   ```
   Run wake simulation for the layout
   ```
   - Analyzes wake effects
   - Estimates energy production

5. **Generate Report**
   ```
   Generate executive report
   ```
   - Comprehensive summary
   - Professional format

### Sample Queries

#### Terrain Analysis
- "Analyze terrain for wind farm at 35.067482, -101.395466"
- "What is the terrain like at coordinates 40.7128, -74.0060?"
- "Assess site suitability for wind farm at [lat], [lng]"

#### Layout Design
- "Create a 30MW wind farm layout at those coordinates"
- "Design a wind farm with 15 turbines"
- "Optimize turbine placement for maximum efficiency"

#### Simulation
- "Run wake simulation for the layout"
- "Calculate annual energy production"
- "What is the capacity factor?"

#### Reporting
- "Generate executive report"
- "Create a summary of the analysis"
- "Prepare a professional report"

### Tips for Best Results

1. **Use Precise Coordinates**
   - Decimal degrees format (e.g., 35.067482, -101.395466)
   - 6 decimal places for accuracy
   - Verify coordinates before analysis

2. **Follow Sequential Workflow**
   - Start with terrain analysis
   - Then design layout
   - Run simulation
   - Generate report

3. **Specify Capacity Clearly**
   - Use MW units (e.g., "30MW")
   - Consider site constraints
   - Typical range: 10-100MW

4. **Review Thought Steps**
   - Monitor agent progress
   - Understand analysis steps
   - Identify any issues early

5. **Interact with Visualizations**
   - Zoom and pan maps
   - Switch tile layers
   - Examine turbine positions
   - Review performance charts

## Visualizations

### Interactive Maps (Folium)

**Features**:
- Multiple tile layers (USGS Topo, USGS Satellite, Esri)
- Zoom and pan controls
- Layer switcher
- Markers and polygons
- Tooltips and popups
- Responsive design

**Terrain Map**:
- Site boundaries
- Exclusion zones (color-coded)
- Elevation contours
- Suitability overlay

**Layout Map**:
- Turbine positions (markers)
- Site boundaries
- Wind rose
- Spacing indicators

### Performance Charts (Matplotlib)

**Wake Analysis Map**:
- Wake deficit visualization
- Turbine positions
- Wind direction
- Color-coded intensity

**Performance Chart**:
- Energy production over time
- Capacity factor trends
- Wake loss analysis
- Optimization potential

## Technical Details

### Integration Layer

**Configuration** (`config.ts`):
- Environment variable management
- Configuration validation
- Default values

**Types** (`types.ts`):
- TypeScript interfaces
- AgentCore request/response types
- EDI Platform artifact types

**Client** (`renewableClient.ts`):
- HTTP communication with AgentCore
- Authentication handling
- Error handling
- Retry logic

**Transformer** (`responseTransformer.ts`):
- AgentCore to EDI artifact conversion
- Data validation
- Graceful degradation

### Proxy Agent

**Responsibilities**:
- Query forwarding
- Response transformation
- Thought step mapping
- Error handling
- Session management

**Error Handling**:
- Connection errors
- Authentication failures
- AgentCore errors
- User-friendly messages

### UI Components

**Design System**: AWS Cloudscape

**Component Structure**:
```typescript
<Container header={<Header>Title</Header>}>
  <SpaceBetween size="l">
    <ColumnLayout columns={3}>
      {/* Metrics */}
    </ColumnLayout>
    <Box>
      {/* Visualization */}
    </Box>
    <Box>
      {/* Additional Info */}
    </Box>
  </SpaceBetween>
</Container>
```

**Artifact Types**:
- `wind_farm_terrain_analysis`
- `wind_farm_layout`
- `wind_farm_simulation`
- `wind_farm_report`

## Performance

### Response Times

- **Terrain Analysis**: 10-20 seconds
- **Layout Design**: 15-25 seconds
- **Wake Simulation**: 20-30 seconds
- **Report Generation**: 5-10 seconds

### Optimization

- AgentCore handles scaling automatically
- S3 storage for large artifacts
- Caching for turbine specifications
- Lazy loading for visualizations

## Security

### Authentication

- AWS Cognito user pool
- JWT tokens for AgentCore access
- Token refresh handling

### Authorization

- IAM role-based permissions
- S3 bucket access control
- AgentCore runtime permissions

### Data Privacy

- User queries logged (PII redacted)
- Artifacts stored in user-specific S3 prefixes
- Temporary files cleaned up

## Troubleshooting

### Common Issues

#### "Renewable energy service is temporarily unavailable"

**Cause**: AgentCore endpoint unreachable

**Solution**:
1. Check environment variables
2. Verify AgentCore deployment
3. Test endpoint connectivity
4. Check CloudWatch logs

#### "Authentication failed"

**Cause**: Invalid or expired token

**Solution**:
1. Sign out and sign in again
2. Check Cognito configuration
3. Verify IAM permissions

#### Maps not displaying

**Cause**: Folium HTML rendering issue

**Solution**:
1. Check browser console
2. Verify iframe sandbox attributes
3. Check CORS configuration
4. Try different browser

#### Charts not displaying

**Cause**: Base64 image data issue

**Solution**:
1. Check browser console
2. Verify image data format
3. Check image size
4. Clear browser cache

### Getting Help

1. **Check Documentation**
   - Configuration guide
   - Testing guide
   - Troubleshooting section

2. **Review Logs**
   - Browser console
   - CloudWatch logs
   - AgentCore logs

3. **Run Validation**
   ```bash
   ./scripts/validate-renewable-integration.sh
   ```

4. **Contact Support**
   - Provide error messages
   - Include query and response
   - Share browser console logs

## Limitations

### Current Limitations

1. **Geographic Scope**
   - US locations only (NREL data)
   - Requires valid coordinates

2. **Capacity Range**
   - Typical: 10-100MW
   - Larger projects may require multiple analyses

3. **Turbine Models**
   - Limited to MCP server database
   - Custom turbines not supported

4. **Analysis Depth**
   - Preliminary analysis only
   - Not a substitute for detailed engineering

### Future Enhancements

1. **Global Coverage**
   - International wind data sources
   - Multi-region support

2. **Advanced Features**
   - Financial modeling
   - Grid integration analysis
   - Environmental impact assessment

3. **Collaboration**
   - Multi-user projects
   - Real-time collaboration
   - Version control

4. **Export Options**
   - PDF reports
   - Excel data exports
   - GIS file formats

## Best Practices

### For Users

1. **Start Simple**
   - Begin with terrain analysis
   - Follow sequential workflow
   - Review results before proceeding

2. **Verify Data**
   - Check coordinates
   - Validate capacity requirements
   - Review exclusion zones

3. **Use Visualizations**
   - Interact with maps
   - Examine charts
   - Understand results

4. **Save Results**
   - Download reports
   - Export data
   - Document decisions

### For Developers

1. **Follow Architecture**
   - Use integration layer
   - Don't modify Python backend
   - Maintain separation of concerns

2. **Handle Errors Gracefully**
   - User-friendly messages
   - Detailed logging
   - Graceful degradation

3. **Test Thoroughly**
   - Run validation script
   - Execute integration tests
   - Manual testing

4. **Monitor Performance**
   - Track response times
   - Monitor error rates
   - Check resource usage

## Additional Resources

- [Configuration Guide](./RENEWABLE_CONFIGURATION.md)
- [Testing Guide](./RENEWABLE_INTEGRATION_TESTING_GUIDE.md)
- [Deployment Guide](./RENEWABLE_DEPLOYMENT.md)
- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [PyWake Documentation](https://topfarm.pages.windenergy.dtu.dk/PyWake/)
- [Folium Documentation](https://python-visualization.github.io/folium/)

## Support

For questions, issues, or feature requests:

1. Check documentation first
2. Run validation script
3. Review troubleshooting guide
4. Contact development team

---

**Version**: 1.0  
**Last Updated**: October 3, 2025  
**Status**: Production Ready

