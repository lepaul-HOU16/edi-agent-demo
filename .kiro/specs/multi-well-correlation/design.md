# Multi-Well Correlation Workflow - Technical Design

## Architecture Overview

The multi-well correlation workflow extends the existing petrophysics agent with three new interactive artifacts and enhanced calculation capabilities.

```
┌─────────────────────┐
│   Chat Interface    │
│  (User Queries)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Agent Router      │
│  (Intent Detection) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Petrophysics Agent             │
│  - Data matrix request          │
│  - Well detail request          │
│  - Correlation request          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  MCP Petrophysical Analysis     │
│  - list_wells()                 │
│  - get_well_info()              │
│  - assess_well_data_quality()   │
│  - calculate_porosity()         │
│  - calculate_shale_volume()     │
│  - calculate_saturation()       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  New Calculation Functions      │
│  - calculate_net_pay()          │
│  - correlate_wells()            │
│  - calculate_npv()              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Artifact Generation            │
│  - DataMatrixArtifact           │
│  - WellDataQualityArtifact      │
│  - CorrelationAnalysisArtifact  │
└─────────────────────────────────┘
```

## Component Design

### 1. Agent Intent Detection

**Location**: `cdk/lambda-functions/chat/agents/agentRouter.ts`

Add new intent patterns for correlation workflow:

```typescript
// New patterns to add
{
  pattern: /data\s+matrix|available\s+data|show.*wells.*curves/i,
  intent: 'data_matrix_visualization',
  agent: 'petrophysics'
},
{
  pattern: /data\s+quality|check.*well|assess.*data/i,
  intent: 'well_data_quality',
  agent: 'petrophysics'
},
{
  pattern: /correlat(e|ion)|net\s+pay|reservoir\s+zones/i,
  intent: 'multi_well_correlation',
  agent: 'petrophysics'
}
```

### 2. Petrophysics Agent Enhancement

**Location**: `cdk/lambda-functions/chat/agents/petrophysicsAgent.ts`

```typescript
export class PetrophysicsAgent {
  async processMessage(message: string, context: ChatContext): Promise<AgentResponse> {
    const intent = this.detectIntent(message);
    
    switch (intent) {
      case 'data_matrix_visualization':
        return await this.generateDataMatrix();
      
      case 'well_data_quality':
        const wellName = this.extractWellName(message, context);
        return await this.generateWellDataQuality(wellName);
      
      case 'multi_well_correlation':
        const wells = this.extractWellNames(message, context);
        return await this.performCorrelation(wells);
      
      default:
        return await this.handleGeneralQuery(message);
    }
  }

  private async generateDataMatrix(): Promise<AgentResponse> {
    // Call MCP to get all wells
    const wells = await this.mcpClient.call('list_wells', {});
    
    // For each well, get available curves
    const matrixData = await Promise.all(
      wells.map(async (well) => {
        const info = await this.mcpClient.call('get_well_info', { well_name: well });
        return {
          wellName: well,
          curves: info.available_curves,
          completeness: info.data_completeness
        };
      })
    );
    
    // Generate artifact
    return {
      message: `Data matrix generated for ${wells.length} wells`,
      artifacts: [{
        type: 'data_matrix',
        data: {
          wells: matrixData,
          curveTypes: this.getAllCurveTypes(matrixData)
        }
      }]
    };
  }

  private async generateWellDataQuality(wellName: string): Promise<AgentResponse> {
    // Get comprehensive data quality assessment
    const quality = await this.mcpClient.call('assess_well_data_quality', {
      well_name: wellName
    });
    
    // Get curve data for plotting
    const curves = ['GR', 'RHOB', 'NPHI', 'RT'];
    const curveData = await Promise.all(
      curves.map(curve => 
        this.mcpClient.call('get_curve_data', {
          well_name: wellName,
          curves: [curve]
        })
      )
    );
    
    return {
      message: `Data quality assessment complete for ${wellName}`,
      artifacts: [{
        type: 'well_data_quality',
        data: {
          wellName,
          quality,
          curves: curveData,
          issues: this.formatQualityIssues(quality)
        }
      }]
    };
  }

  private async performCorrelation(wells: string[]): Promise<AgentResponse> {
    // Calculate petrophysical properties for each well
    const wellData = await Promise.all(
      wells.map(async (well) => {
        const [porosity, vsh, sw] = await Promise.all([
          this.mcpClient.call('calculate_porosity', {
            well_name: well,
            method: 'effective'
          }),
          this.mcpClient.call('calculate_shale_volume', {
            well_name: well,
            method: 'larionov_tertiary'
          }),
          this.mcpClient.call('calculate_saturation', {
            well_name: well,
            method: 'archie'
          })
        ]);
        
        return { well, porosity, vsh, sw };
      })
    );
    
    // Calculate net pay using cutoffs
    const cutoffs = {
      porosity: 0.12,
      vsh: 0.35,
      sw: 0.50
    };
    
    const netPayResults = this.calculateNetPay(wellData, cutoffs);
    const npvResults = this.calculateNPV(netPayResults);
    
    return {
      message: this.formatCorrelationSummary(netPayResults, npvResults),
      artifacts: [{
        type: 'correlation_analysis',
        data: {
          wells: wellData,
          cutoffs,
          netPay: netPayResults,
          npv: npvResults,
          zones: this.identifyZones(wellData, cutoffs)
        }
      }]
    };
  }

  private calculateNetPay(wellData: any[], cutoffs: any): any[] {
    return wellData.map(({ well, porosity, vsh, sw }) => {
      const zones = [];
      let currentZone = null;
      
      for (let i = 0; i < porosity.depth.length; i++) {
        const isReservoir = 
          porosity.values[i] > cutoffs.porosity &&
          vsh.values[i] < cutoffs.vsh &&
          sw.values[i] < cutoffs.sw;
        
        if (isReservoir) {
          if (!currentZone) {
            currentZone = {
              topDepth: porosity.depth[i],
              bottomDepth: porosity.depth[i],
              avgPorosity: porosity.values[i],
              avgVsh: vsh.values[i],
              avgSw: sw.values[i],
              count: 1
            };
          } else {
            currentZone.bottomDepth = porosity.depth[i];
            currentZone.avgPorosity += porosity.values[i];
            currentZone.avgVsh += vsh.values[i];
            currentZone.avgSw += sw.values[i];
            currentZone.count++;
          }
        } else if (currentZone) {
          // End of zone
          currentZone.avgPorosity /= currentZone.count;
          currentZone.avgVsh /= currentZone.count;
          currentZone.avgSw /= currentZone.count;
          currentZone.netPay = currentZone.bottomDepth - currentZone.topDepth;
          zones.push(currentZone);
          currentZone = null;
        }
      }
      
      return { well, zones, totalNetPay: zones.reduce((sum, z) => sum + z.netPay, 0) };
    });
  }

  private calculateNPV(netPayResults: any[]): any[] {
    // Simplified NPV calculation
    const assumptions = {
      oilPrice: 70, // $/bbl
      recoveryFactor: 0.30,
      discountRate: 0.10,
      productionYears: 20
    };
    
    return netPayResults.map(({ well, zones, totalNetPay }) => {
      const npvByZone = zones.map(zone => {
        // Simplified: NPV = Net Pay * Porosity * (1 - Sw) * Recovery * Oil Price
        const oilInPlace = zone.netPay * zone.avgPorosity * (1 - zone.avgSw);
        const recoverableOil = oilInPlace * assumptions.recoveryFactor;
        const revenue = recoverableOil * assumptions.oilPrice;
        
        // Apply discount factor
        const npv = revenue / Math.pow(1 + assumptions.discountRate, 5);
        
        return {
          zone: `${zone.topDepth}-${zone.bottomDepth}m`,
          npv: npv * 1000000 // Convert to millions
        };
      });
      
      return {
        well,
        totalNPV: npvByZone.reduce((sum, z) => sum + z.npv, 0),
        zoneNPV: npvByZone
      };
    });
  }
}
```

### 3. Frontend Artifacts

#### 3.1 Data Matrix Artifact

**Location**: `src/components/petrophysics/DataMatrixArtifact.tsx`

```typescript
import React from 'react';
import { Container, Table, Box, Badge } from '@cloudscape-design/components';

interface DataMatrixArtifactProps {
  data: {
    wells: Array<{
      wellName: string;
      curves: string[];
      completeness: Record<string, number>;
    }>;
    curveTypes: string[];
  };
  onWellClick: (wellName: string) => void;
}

export const DataMatrixArtifact: React.FC<DataMatrixArtifactProps> = ({ data, onWellClick }) => {
  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'green';
    if (completeness >= 70) return 'blue';
    if (completeness >= 50) return 'grey';
    return 'red';
  };

  return (
    <Container header={<h3>Data Availability Matrix</h3>}>
      <Table
        columnDefinitions={[
          {
            id: 'well',
            header: 'Well Name',
            cell: (item) => (
              <Box
                color="text-link"
                cursor="pointer"
                onClick={() => onWellClick(item.wellName)}
              >
                {item.wellName}
              </Box>
            )
          },
          ...data.curveTypes.map(curve => ({
            id: curve,
            header: curve,
            cell: (item) => {
              const completeness = item.completeness[curve] || 0;
              return completeness > 0 ? (
                <Badge color={getCompletenessColor(completeness)}>
                  {completeness.toFixed(0)}%
                </Badge>
              ) : (
                <Badge color="red">N/A</Badge>
              );
            }
          }))
        ]}
        items={data.wells}
        variant="embedded"
      />
    </Container>
  );
};
```

#### 3.2 Well Data Quality Artifact

**Location**: `src/components/petrophysics/WellDataQualityArtifact.tsx`

```typescript
import React from 'react';
import { Container, ColumnLayout, Box } from '@cloudscape-design/components';
import Plot from 'react-plotly.js';

interface WellDataQualityArtifactProps {
  data: {
    wellName: string;
    quality: any;
    curves: any[];
    issues: Array<{
      curve: string;
      depth: number;
      issue: string;
    }>;
  };
}

export const WellDataQualityArtifact: React.FC<WellDataQualityArtifactProps> = ({ data }) => {
  // Create log plot with quality annotations
  const traces = data.curves.map((curve, idx) => ({
    x: curve.values,
    y: curve.depth,
    type: 'scatter',
    mode: 'lines',
    name: curve.name,
    xaxis: `x${idx + 1}`,
    line: { width: 1 }
  }));

  // Add annotations for quality issues
  const annotations = data.issues.map(issue => ({
    x: 0.5,
    y: issue.depth,
    xref: 'paper',
    yref: 'y',
    text: `⚠️ ${issue.issue}`,
    showarrow: true,
    arrowhead: 2,
    ax: 40,
    ay: 0
  }));

  const layout = {
    title: `Data Quality: ${data.wellName}`,
    yaxis: { title: 'Depth (m)', autorange: 'reversed' },
    annotations,
    grid: { rows: 1, columns: data.curves.length, pattern: 'independent' },
    height: 800
  };

  return (
    <Container>
      <ColumnLayout columns={2}>
        <Box>
          <h3>Quality Summary</h3>
          <ul>
            <li>Completeness: {data.quality.overall_completeness}%</li>
            <li>Issues Found: {data.issues.length}</li>
            <li>Curves Available: {data.curves.length}</li>
          </ul>
        </Box>
        <Box>
          <h3>Issues</h3>
          <ul>
            {data.issues.map((issue, idx) => (
              <li key={idx}>
                {issue.curve} @ {issue.depth}m: {issue.issue}
              </li>
            ))}
          </ul>
        </Box>
      </ColumnLayout>
      <Plot data={traces} layout={layout} />
    </Container>
  );
};
```

#### 3.3 Correlation Analysis Artifact

**Location**: `src/components/petrophysics/CorrelationAnalysisArtifact.tsx`

```typescript
import React from 'react';
import { Container, Table, ColumnLayout, Box, Header } from '@cloudscape-design/components';

interface CorrelationAnalysisArtifactProps {
  data: {
    wells: any[];
    cutoffs: any;
    netPay: any[];
    npv: any[];
    zones: any[];
  };
}

export const CorrelationAnalysisArtifact: React.FC<CorrelationAnalysisArtifactProps> = ({ data }) => {
  return (
    <Container header={<Header variant="h2">Correlation Analysis Results</Header>}>
      <ColumnLayout columns={2}>
        <Box>
          <h3>Cutoff Values</h3>
          <ul>
            <li>Porosity: &gt; {(data.cutoffs.porosity * 100).toFixed(0)}%</li>
            <li>Shale Volume: &lt; {(data.cutoffs.vsh * 100).toFixed(0)}%</li>
            <li>Water Saturation: &lt; {(data.cutoffs.sw * 100).toFixed(0)}%</li>
          </ul>
        </Box>
        <Box>
          <h3>Summary</h3>
          <ul>
            <li>Wells Analyzed: {data.wells.length}</li>
            <li>Zones Identified: {data.zones.length}</li>
            <li>Total NPV: ${data.npv.reduce((sum, w) => sum + w.totalNPV, 0).toFixed(1)}M</li>
          </ul>
        </Box>
      </ColumnLayout>

      <Box margin={{ top: 'l' }}>
        <h3>Net Pay by Well</h3>
        <Table
          columnDefinitions={[
            { id: 'well', header: 'Well', cell: (item) => item.well },
            { id: 'zones', header: 'Zones', cell: (item) => item.zones.length },
            { id: 'netPay', header: 'Total Net Pay (m)', cell: (item) => item.totalNetPay.toFixed(1) },
            { id: 'npv', header: 'NPV ($M)', cell: (item) => {
              const wellNPV = data.npv.find(n => n.well === item.well);
              return wellNPV ? wellNPV.totalNPV.toFixed(2) : 'N/A';
            }}
          ]}
          items={data.netPay}
          variant="embedded"
        />
      </Box>

      <Box margin={{ top: 'l' }}>
        <h3>Zone Details</h3>
        {data.netPay.map((wellData) => (
          <Box key={wellData.well} margin={{ bottom: 'm' }}>
            <h4>{wellData.well}</h4>
            <Table
              columnDefinitions={[
                { id: 'zone', header: 'Depth Range', cell: (item) => `${item.topDepth}-${item.bottomDepth}m` },
                { id: 'netPay', header: 'Net Pay (m)', cell: (item) => item.netPay.toFixed(1) },
                { id: 'porosity', header: 'Avg Porosity', cell: (item) => (item.avgPorosity * 100).toFixed(1) + '%' },
                { id: 'sw', header: 'Avg Sw', cell: (item) => (item.avgSw * 100).toFixed(1) + '%' }
              ]}
              items={wellData.zones}
              variant="embedded"
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
};
```

### 4. Artifact Registration

**Location**: `src/components/ChatMessage.tsx`

```typescript
// Add to artifact type mapping
const artifactComponents = {
  // ... existing artifacts
  'data_matrix': DataMatrixArtifact,
  'well_data_quality': WellDataQualityArtifact,
  'correlation_analysis': CorrelationAnalysisArtifact,
};
```

## Data Flow

### Workflow 1: Data Matrix Generation

```
User: "Show me the data matrix"
  ↓
Agent Router → Petrophysics Agent
  ↓
MCP: list_wells() → [WELL-001, WELL-002, ...]
  ↓
For each well: MCP: get_well_info(well)
  ↓
Aggregate data → Generate artifact
  ↓
Frontend: Render DataMatrixArtifact
  ↓
User clicks well → Trigger Workflow 2
```

### Workflow 2: Well Data Quality

```
User clicks WELL-001 in matrix
  ↓
Agent: generateWellDataQuality("WELL-001")
  ↓
MCP: assess_well_data_quality(WELL-001)
MCP: get_curve_data(WELL-001, curves)
  ↓
Format quality issues → Generate artifact
  ↓
Frontend: Render WellDataQualityArtifact with log plot
```

### Workflow 3: Correlation Analysis

```
User: "Run correlation on WELL-001, WELL-002, WELL-003"
  ↓
Agent: performCorrelation([WELL-001, WELL-002, WELL-003])
  ↓
For each well:
  MCP: calculate_porosity(well)
  MCP: calculate_shale_volume(well)
  MCP: calculate_saturation(well)
  ↓
Calculate net pay using cutoffs
  ↓
Calculate NPV for each zone
  ↓
Generate artifact with results
  ↓
Frontend: Render CorrelationAnalysisArtifact
```

## Error Handling

- **Missing Wells**: If well doesn't exist, return friendly error message
- **Insufficient Data**: If well lacks required curves, show data gaps in matrix
- **Calculation Failures**: Catch MCP errors and provide fallback responses
- **Invalid Parameters**: Validate cutoff values before running correlation

## Performance Considerations

- **Parallel Processing**: Use Promise.all for multi-well data fetching
- **Caching**: Cache well info and curve data for repeated queries
- **Progressive Loading**: Load matrix first, then fetch detailed data on demand
- **Lazy Rendering**: Only render visible portions of large log plots

## Testing Strategy

1. **Unit Tests**: Test net pay and NPV calculation functions
2. **Integration Tests**: Test MCP tool calls and data aggregation
3. **E2E Tests**: Test complete workflow from chat to artifact rendering
4. **Visual Tests**: Verify artifact rendering with sample data

## Deployment Considerations

- No new Lambda functions required (uses existing petrophysics agent)
- New artifact components need to be bundled in frontend build
- MCP server already has required tools (no changes needed)
- Agent router needs updated intent patterns (minor change)

## Future Enhancements

- Cross-plot visualization showing porosity vs. saturation
- Automated zone correlation across wells
- Customizable cutoff values via UI
- Export correlation results to PDF/Excel
- Integration with economic models for detailed NPV analysis
