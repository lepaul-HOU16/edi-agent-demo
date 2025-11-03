/**
 * Wake Visualization Chart Component
 * 
 * Interactive wake effect visualization showing turbine interactions,
 * wake patterns, and downstream impacts using Plotly.js.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Box, 
  SpaceBetween, 
  Button, 
  Select, 
  Toggle, 
  ColumnLayout,
  Container,
  Header,
  Badge,
  Slider
} from '@cloudscape-design/components';
import { 
  WakeAnalysisData,
  WakeVisualizationData,
  TurbinePosition,
  WakeField,
  TurbineLayout,
  WindResourceData
} from '../../types/wakeData';

// Plotly.js imports
let Plotly: any;
if (typeof window !== 'undefined') {
  import('plotly.js').then((PlotlyModule) => {
    Plotly = PlotlyModule.default;
  });
}

interface WakeVisualizationChartProps {
  wakeData: WakeAnalysisData;
  height?: number;
  onExport?: (format: string, data: any) => void;
  interactive?: boolean;
  onTurbineSelect?: (turbineId: string) => void;
  selectedTurbineId?: string;
}

interface ViewMode {
  value: 'wake_field' | 'velocity_deficit' | 'turbulence' | 'power_loss' | 'interactions';
  label: string;
}

interface WindDirectionOption {
  value: number;
  label: string;
}

const WakeVisualizationChart: React.FC<WakeVisualizationChartProps> = ({
  wakeData,
  height = 600,
  onExport,
  interactive = true,
  onTurbineSelect,
  selectedTurbineId
}) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>({ value: 'wake_field', label: 'Wake Field' });
  const [selectedWindDirection, setSelectedWindDirection] = useState<WindDirectionOption>({ value: 270, label: '270° (W)' });
  const [showTurbineLabels, setShowTurbineLabels] = useState(true);
  const [showWakeBoundaries, setShowWakeBoundaries] = useState(true);
  const [wakeOpacity, setWakeOpacity] = useState(0.6);
  const [isLoading, setIsLoading] = useState(true);

  // View mode options
  const viewModeOptions: ViewMode[] = [
    { value: 'wake_field', label: 'Wake Field' },
    { value: 'velocity_deficit', label: 'Velocity Deficit' },
    { value: 'turbulence', label: 'Turbulence' },
    { value: 'power_loss', label: 'Power Loss' },
    { value: 'interactions', label: 'Turbine Interactions' }
  ];

  // Wind direction options (based on available data)
  const windDirectionOptions: WindDirectionOption[] = useMemo(() => {
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    return directions.map(dir => ({
      value: dir,
      label: `${dir}° (${getDirectionLabel(dir)})`
    }));
  }, []);

  // Process wake visualization data
  const visualizationData = useMemo(() => {
    return processWakeVisualizationData(
      wakeData,
      viewMode.value,
      selectedWindDirection.value
    );
  }, [wakeData, viewMode, selectedWindDirection]);

  // Create Plotly chart
  useEffect(() => {
    if (!Plotly || !plotRef.current || !visualizationData) return;

    const createWakePlot = async () => {
      setIsLoading(true);
      
      try {
        const traces = createWakeTraces(
          visualizationData,
          viewMode.value,
          showTurbineLabels,
          showWakeBoundaries,
          wakeOpacity,
          selectedTurbineId
        );
        
        const layout = createWakeLayout(
          wakeData.turbineLayout,
          viewMode.value,
          height
        );
        
        const plotConfig = {
          responsive: true,
          displayModeBar: interactive,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: `wake_analysis_${viewMode.value}`,
            height: height,
            width: height * 1.2,
            scale: 2
          }
        };

        await Plotly.newPlot(plotRef.current, traces, layout, plotConfig);
        
        // Add click handler for turbine selection
        if (interactive && onTurbineSelect) {
          plotRef.current.on('plotly_click', (data: any) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0];
              if (point.customdata && point.customdata.turbineId) {
                onTurbineSelect(point.customdata.turbineId);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error creating wake plot:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createWakePlot();
  }, [
    visualizationData, 
    viewMode, 
    showTurbineLabels, 
    showWakeBoundaries, 
    wakeOpacity, 
    selectedTurbineId,
    interactive,
    onTurbineSelect,
    height
  ]);

  // Handle export
  const handleExport = (format: string) => {
    if (!Plotly || !plotRef.current) return;

    if (format === 'png' || format === 'svg') {
      Plotly.downloadImage(plotRef.current, {
        format: format,
        filename: `wake_analysis_${viewMode.value}`,
        height: height,
        width: height * 1.2,
        scale: 2
      });
    } else if (format === 'json' && onExport) {
      onExport(format, {
        wakeData,
        visualizationData,
        viewMode: viewMode.value,
        windDirection: selectedWindDirection.value,
        metadata: {
          exportedAt: new Date().toISOString(),
          turbineCount: wakeData.turbineLayout.turbines.length,
          totalCapacity: wakeData.turbineLayout.totalCapacity
        }
      });
    }
  };

  return (
    <SpaceBetween size="m">
      {/* Visualization Controls */}
      <Container
        header={
          <Header 
            variant="h3" 
            description="Customize wake visualization parameters"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color="blue">
                  {wakeData.turbineLayout.turbines.length} Turbines
                </Badge>
                <Badge color="green">
                  {wakeData.turbineLayout.totalCapacity.toFixed(1)} MW
                </Badge>
                <Badge color={getWakeEfficiencyBadgeColor(wakeData.results.overallMetrics.wakeEfficiency)}>
                  {wakeData.results.overallMetrics.wakeEfficiency.toFixed(1)}% Efficiency
                </Badge>
              </SpaceBetween>
            }
          >
            Wake Visualization Controls
          </Header>
        }
      >
        <ColumnLayout 
          columns={{ default: 4, xxs: 1, xs: 2, s: 2, m: 3, l: 4 }} 
          variant="text-grid"
        >
          <div>
            <Box variant="awsui-key-label">Visualization Type</Box>
            <Select
              selectedOption={viewMode}
              onChange={({ detail }) => setViewMode(detail.selectedOption as ViewMode)}
              options={viewModeOptions}
              expandToViewport
            />
          </div>
          <div>
            <Box variant="awsui-key-label">Wind Direction</Box>
            <Select
              selectedOption={selectedWindDirection}
              onChange={({ detail }) => setSelectedWindDirection(detail.selectedOption as WindDirectionOption)}
              options={windDirectionOptions}
              expandToViewport
            />
          </div>
          <div>
            <Box variant="awsui-key-label">Display Options</Box>
            <SpaceBetween size="xs">
              <Toggle
                checked={showTurbineLabels}
                onChange={({ detail }) => setShowTurbineLabels(detail.checked)}
              >
                Turbine Labels
              </Toggle>
              <Toggle
                checked={showWakeBoundaries}
                onChange={({ detail }) => setShowWakeBoundaries(detail.checked)}
              >
                Wake Boundaries
              </Toggle>
            </SpaceBetween>
          </div>
          <div>
            <Box variant="awsui-key-label">Wake Opacity</Box>
            <Slider
              value={wakeOpacity}
              onChange={({ detail }) => setWakeOpacity(detail.value)}
              min={0.1}
              max={1.0}
              step={0.1}
              tickMarks
            />
          </div>
        </ColumnLayout>
      </Container>

      {/* Wake Visualization Plot */}
      <div
        ref={plotRef}
        style={{
          width: '100%',
          height: `${height}px`,
          border: '1px solid #e9ebed',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}
      />

      {/* Export Controls */}
      <Container
        header={
          <Header variant="h3">
            Export Options
          </Header>
        }
      >
        <SpaceBetween direction="horizontal" size="s">
          <Button
            variant="normal"
            iconName="download"
            onClick={() => handleExport('png')}
            disabled={isLoading}
          >
            Export PNG
          </Button>
          <Button
            variant="normal"
            iconName="download"
            onClick={() => handleExport('svg')}
            disabled={isLoading}
          >
            Export SVG
          </Button>
          {onExport && (
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleExport('json')}
              disabled={isLoading}
            >
              Export Data
            </Button>
          )}
        </SpaceBetween>
      </Container>

      {/* Wake Analysis Summary */}
      <Container
        header={
          <Header variant="h3">
            Wake Analysis Summary
          </Header>
        }
      >
        <ColumnLayout 
          columns={{ default: 4, xxs: 1, xs: 2, s: 2, m: 4 }} 
          variant="text-grid"
        >
          <div>
            <Box variant="small">Total Wake Loss</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d13212' }}>
              {wakeData.results.overallMetrics.totalWakeLoss.toFixed(1)}%
            </div>
          </div>
          <div>
            <Box variant="small">Average Wake Loss</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d13212' }}>
              {wakeData.results.overallMetrics.averageWakeLoss.toFixed(1)}%
            </div>
          </div>
          <div>
            <Box variant="small">Energy Yield Reduction</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d13212' }}>
              {(wakeData.results.overallMetrics.energyYieldReduction / 1000).toFixed(1)} GWh/yr
            </div>
          </div>
          <div>
            <Box variant="small">Wake Efficiency</Box>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: wakeData.results.overallMetrics.wakeEfficiency > 90 ? '#037f0c' : 
                     wakeData.results.overallMetrics.wakeEfficiency > 85 ? '#0073bb' : '#d13212'
            }}>
              {wakeData.results.overallMetrics.wakeEfficiency.toFixed(1)}%
            </div>
          </div>
        </ColumnLayout>
      </Container>
    </SpaceBetween>
  );
};

// Helper function to process wake visualization data
function processWakeVisualizationData(
  wakeData: WakeAnalysisData,
  viewMode: string,
  windDirection: number
): any {
  const { turbineLayout, results } = wakeData;
  
  // Filter wake fields for selected wind direction
  const relevantWakeFields = results.wakeVisualization.wakeFields.filter(
    field => Math.abs(field.windDirection - windDirection) < 22.5
  );

  switch (viewMode) {
    case 'wake_field':
      return {
        turbines: turbineLayout.turbines,
        wakeFields: relevantWakeFields,
        type: 'wake_field'
      };
    
    case 'velocity_deficit':
      return {
        turbines: turbineLayout.turbines,
        velocityField: relevantWakeFields.map(field => field.velocityField),
        type: 'velocity_deficit'
      };
    
    case 'turbulence':
      return {
        turbines: turbineLayout.turbines,
        turbulenceField: relevantWakeFields.map(field => field.turbulenceField),
        type: 'turbulence'
      };
    
    case 'power_loss':
      return {
        turbines: turbineLayout.turbines.map(turbine => ({
          ...turbine,
          powerLoss: results.turbineResults.find(r => r.turbineId === turbine.id)?.powerReduction || 0
        })),
        type: 'power_loss'
      };
    
    case 'interactions':
      return {
        turbines: turbineLayout.turbines,
        interactions: results.wakeVisualization.turbineInteractions,
        type: 'interactions'
      };
    
    default:
      return {
        turbines: turbineLayout.turbines,
        wakeFields: relevantWakeFields,
        type: 'wake_field'
      };
  }
}

// Helper function to create Plotly traces for wake visualization
function createWakeTraces(
  visualizationData: any,
  viewMode: string,
  showLabels: boolean,
  showBoundaries: boolean,
  opacity: number,
  selectedTurbineId?: string
): any[] {
  const traces: any[] = [];

  // Add turbine positions
  const turbineTrace = createTurbineTrace(
    visualizationData.turbines,
    viewMode,
    showLabels,
    selectedTurbineId
  );
  traces.push(turbineTrace);

  // Add visualization-specific traces
  switch (viewMode) {
    case 'wake_field':
      if (visualizationData.wakeFields) {
        visualizationData.wakeFields.forEach((field: WakeField, index: number) => {
          const wakeTrace = createWakeFieldTrace(field, opacity, showBoundaries);
          traces.push(wakeTrace);
        });
      }
      break;
    
    case 'velocity_deficit':
      if (visualizationData.velocityField) {
        const velocityTrace = createVelocityFieldTrace(visualizationData.velocityField, opacity);
        traces.push(velocityTrace);
      }
      break;
    
    case 'turbulence':
      if (visualizationData.turbulenceField) {
        const turbulenceTrace = createTurbulenceFieldTrace(visualizationData.turbulenceField, opacity);
        traces.push(turbulenceTrace);
      }
      break;
    
    case 'interactions':
      if (visualizationData.interactions) {
        visualizationData.interactions.forEach((interaction: any) => {
          const interactionTrace = createInteractionTrace(interaction, opacity);
          traces.push(interactionTrace);
        });
      }
      break;
  }

  return traces;
}

// Helper function to create turbine trace
function createTurbineTrace(
  turbines: TurbinePosition[],
  viewMode: string,
  showLabels: boolean,
  selectedTurbineId?: string
): any {
  const x = turbines.map(t => t.x);
  const y = turbines.map(t => t.y);
  const colors = turbines.map(t => {
    if (selectedTurbineId && t.id === selectedTurbineId) {
      return '#ff6b6b'; // Highlight selected turbine
    }
    
    switch (viewMode) {
      case 'power_loss':
        const powerLoss = (t as any).powerLoss || 0;
        return powerLoss > 10 ? '#d13212' : powerLoss > 5 ? '#ff9900' : '#037f0c';
      default:
        return '#0073bb';
    }
  });
  
  const sizes = turbines.map(t => {
    const baseSize = 12;
    if (selectedTurbineId && t.id === selectedTurbineId) {
      return baseSize * 1.5;
    }
    return baseSize;
  });

  const text = showLabels ? turbines.map(t => t.id) : undefined;
  const hoverText = turbines.map(t => {
    const wakeEffect = t.wakeEffects;
    return `Turbine: ${t.id}<br>` +
           `Position: (${t.x.toFixed(0)}, ${t.y.toFixed(0)}) m<br>` +
           `Power: ${t.ratedPower} kW<br>` +
           `Wake Deficit: ${wakeEffect.wakeDeficit.toFixed(1)}%<br>` +
           `Power Loss: ${wakeEffect.powerLoss.toFixed(1)}%`;
  });

  return {
    type: 'scatter',
    mode: showLabels ? 'markers+text' : 'markers',
    x: x,
    y: y,
    text: text,
    textposition: 'top center',
    hovertemplate: '%{hovertext}<extra></extra>',
    hovertext: hoverText,
    marker: {
      size: sizes,
      color: colors,
      symbol: 'circle',
      line: {
        width: 2,
        color: '#ffffff'
      }
    },
    customdata: turbines.map(t => ({ turbineId: t.id })),
    name: 'Turbines',
    showlegend: true
  };
}

// Helper function to create wake field trace
function createWakeFieldTrace(field: WakeField, opacity: number, showBoundaries: boolean): any {
  // Create wake cone visualization
  const centerline = field.wakeGeometry.centerline;
  const boundaries = field.wakeGeometry.boundaries;
  
  // Wake cone fill
  const wakeX = [
    ...centerline.map(p => p[0]),
    ...boundaries.upper.map(p => p[0]).reverse(),
    ...boundaries.lower.map(p => p[0])
  ];
  
  const wakeY = [
    ...centerline.map(p => p[1]),
    ...boundaries.upper.map(p => p[1]).reverse(),
    ...boundaries.lower.map(p => p[1])
  ];

  return {
    type: 'scatter',
    mode: 'lines',
    x: wakeX,
    y: wakeY,
    fill: 'toself',
    fillcolor: `rgba(255, 0, 0, ${opacity * 0.3})`,
    line: {
      color: showBoundaries ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0)',
      width: showBoundaries ? 2 : 0
    },
    name: `Wake ${field.turbineId}`,
    showlegend: false,
    hoverinfo: 'skip'
  };
}

// Helper function to create velocity field trace
function createVelocityFieldTrace(velocityFields: any[], opacity: number): any {
  // Simplified velocity field visualization
  // In a real implementation, this would create a contour or heatmap
  return {
    type: 'scatter',
    mode: 'markers',
    x: [0], // Placeholder
    y: [0], // Placeholder
    marker: { size: 0 },
    name: 'Velocity Field',
    showlegend: false,
    hoverinfo: 'skip'
  };
}

// Helper function to create turbulence field trace
function createTurbulenceFieldTrace(turbulenceFields: any[], opacity: number): any {
  // Simplified turbulence field visualization
  return {
    type: 'scatter',
    mode: 'markers',
    x: [0], // Placeholder
    y: [0], // Placeholder
    marker: { size: 0 },
    name: 'Turbulence Field',
    showlegend: false,
    hoverinfo: 'skip'
  };
}

// Helper function to create interaction trace
function createInteractionTrace(interaction: any, opacity: number): any {
  // Create connection lines between interacting turbines
  return {
    type: 'scatter',
    mode: 'lines',
    x: [0, 100], // Placeholder coordinates
    y: [0, 100], // Placeholder coordinates
    line: {
      color: `rgba(255, 165, 0, ${opacity})`,
      width: Math.max(1, interaction.interactionStrength * 5),
      dash: 'dash'
    },
    name: 'Interaction',
    showlegend: false,
    hoverinfo: 'skip'
  };
}

// Helper function to create Plotly layout
function createWakeLayout(layout: TurbineLayout, viewMode: string, height: number): any {
  // Calculate plot bounds based on turbine positions
  const turbines = layout.turbines;
  const xCoords = turbines.map(t => t.x);
  const yCoords = turbines.map(t => t.y);
  
  const xMin = Math.min(...xCoords) - 200;
  const xMax = Math.max(...xCoords) + 500; // Extra space for wake visualization
  const yMin = Math.min(...yCoords) - 200;
  const yMax = Math.max(...yCoords) + 200;

  return {
    title: {
      text: `Wake Analysis - ${viewMode.replace('_', ' ').toUpperCase()}`,
      font: { size: 16 }
    },
    xaxis: {
      title: 'Distance (m)',
      range: [xMin, xMax],
      showgrid: true,
      gridcolor: '#e5e5e5',
      zeroline: false
    },
    yaxis: {
      title: 'Distance (m)',
      range: [yMin, yMax],
      showgrid: true,
      gridcolor: '#e5e5e5',
      zeroline: false,
      scaleanchor: 'x',
      scaleratio: 1
    },
    height: height,
    margin: { t: 50, b: 50, l: 60, r: 50 },
    legend: {
      orientation: 'v',
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: '#E5E5E5',
      borderwidth: 1
    },
    font: { size: 12 },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: '#ffffff'
  };
}

// Helper function to get direction label
function getDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Helper function to get wake efficiency badge color
function getWakeEfficiencyBadgeColor(efficiency: number): 'green' | 'blue' | 'grey' | 'red' {
  if (efficiency >= 90) return 'green';
  if (efficiency >= 85) return 'blue';
  if (efficiency >= 80) return 'grey';
  return 'red';
}

export default WakeVisualizationChart;