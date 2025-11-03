/**
 * Performance Analysis Dashboard Component
 * Consolidates energy production, capacity factor, and turbine performance charts
 * Layout: 2x2 grid with summary bar at top
 */

import React, { useMemo } from 'react';
import { Box, Container, Grid, SpaceBetween, Header, ColumnLayout, KeyValuePairs } from '@cloudscape-design/components';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly charts
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
}) as any;

interface PerformanceAnalysisData {
  summary: {
    total_aep_gwh: number;
    capacity_factor: number;
    wake_loss_percent: number;
    number_of_turbines: number;
    total_capacity_mw: number;
    mean_wind_speed: number;
    turbine_model: string;
  };
  monthlyEnergyProduction: {
    months: string[];
    energy_gwh: number[];
  };
  capacityFactorDistribution: {
    turbines: string[];
    capacity_factors: number[];
  };
  turbinePerformanceHeatmap: {
    turbines: string[];
    metrics: string[];  // ['AEP', 'Capacity Factor', 'Wake Loss', 'Availability']
    values: number[][];  // 2D array [turbines x metrics]
  };
  availabilityAndLosses: {
    categories: string[];  // ['Wake Losses', 'Availability Losses', 'Other Losses']
    values: number[];
  };
}

interface PerformanceAnalysisDashboardProps {
  data: PerformanceAnalysisData;
  projectId: string;
  darkMode?: boolean;
}

const PerformanceAnalysisDashboard: React.FC<PerformanceAnalysisDashboardProps> = ({
  data,
  projectId,
  darkMode = true
}) => {
  const bgColor = darkMode ? '#1a1a1a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#000000';
  const gridColor = darkMode ? '#444444' : '#e9ebed';

  // Monthly Energy Production Chart
  const monthlyEnergyChart = useMemo(() => ({
    data: [{
      type: 'bar',
      x: data.monthlyEnergyProduction.months,
      y: data.monthlyEnergyProduction.energy_gwh,
      marker: {
        color: data.monthlyEnergyProduction.energy_gwh,
        colorscale: [
          [0, '#0972d3'],
          [0.5, '#037f0c'],
          [1, '#ffcc00']
        ],
        line: { color: darkMode ? '#444' : '#e9ebed', width: 1 }
      },
      hovertemplate: '<b>%{x}</b><br>Energy: %{y:.2f} GWh<extra></extra>'
    }],
    layout: {
      title: {
        text: 'Monthly Energy Production',
        font: { size: 14, color: textColor, weight: 'bold' }
      },
      xaxis: {
        title: 'Month',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Energy (GWh)',
        gridcolor: gridColor,
        color: textColor
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 320,
      margin: { t: 50, b: 60, l: 60, r: 20 }
    }
  }), [data.monthlyEnergyProduction, darkMode, bgColor, textColor, gridColor]);

  // Capacity Factor Distribution Chart
  const capacityFactorChart = useMemo(() => ({
    data: [{
      type: 'bar',
      x: data.capacityFactorDistribution.turbines,
      y: data.capacityFactorDistribution.capacity_factors.map(cf => cf * 100),
      marker: {
        color: data.capacityFactorDistribution.capacity_factors.map(cf => cf * 100),
        colorscale: [
          [0, '#d13212'],
          [0.5, '#ffcc00'],
          [1, '#037f0c']
        ],
        line: { color: darkMode ? '#444' : '#e9ebed', width: 1 }
      },
      hovertemplate: '<b>%{x}</b><br>Capacity Factor: %{y:.1f}%<extra></extra>'
    }],
    layout: {
      title: {
        text: 'Capacity Factor by Turbine',
        font: { size: 14, color: textColor, weight: 'bold' }
      },
      xaxis: {
        title: 'Turbine',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Capacity Factor (%)',
        gridcolor: gridColor,
        color: textColor,
        range: [0, 100]
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 320,
      margin: { t: 50, b: 60, l: 60, r: 20 }
    }
  }), [data.capacityFactorDistribution, darkMode, bgColor, textColor, gridColor]);

  // Turbine Performance Heatmap
  const performanceHeatmap = useMemo(() => ({
    data: [{
      type: 'heatmap',
      x: data.turbinePerformanceHeatmap.metrics,
      y: data.turbinePerformanceHeatmap.turbines,
      z: data.turbinePerformanceHeatmap.values,
      colorscale: [
        [0, '#d13212'],
        [0.5, '#ffcc00'],
        [1, '#037f0c']
      ],
      hovertemplate: '<b>%{y}</b><br>%{x}: %{z:.2f}<extra></extra>',
      showscale: true,
      colorbar: {
        title: 'Value',
        titleside: 'right',
        tickmode: 'linear',
        tick0: 0,
        dtick: 20,
        len: 0.7,
        x: 1.02
      }
    }],
    layout: {
      title: {
        text: 'Turbine Performance Heatmap',
        font: { size: 14, color: textColor, weight: 'bold' }
      },
      xaxis: {
        title: 'Performance Metric',
        gridcolor: gridColor,
        color: textColor,
        side: 'bottom'
      },
      yaxis: {
        title: 'Turbine',
        gridcolor: gridColor,
        color: textColor,
        autorange: 'reversed'
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 320,
      margin: { t: 50, b: 60, l: 80, r: 100 }
    }
  }), [data.turbinePerformanceHeatmap, darkMode, bgColor, textColor, gridColor]);

  // Availability and Losses Pie Chart
  const availabilityLossesChart = useMemo(() => ({
    data: [{
      type: 'pie',
      labels: data.availabilityAndLosses.categories,
      values: data.availabilityAndLosses.values,
      marker: {
        colors: ['#d13212', '#ff9900', '#ffcc00']
      },
      hovertemplate: '<b>%{label}</b><br>%{value:.1f}%<extra></extra>',
      textinfo: 'label+percent',
      textposition: 'inside',
      textfont: { color: '#ffffff', size: 12 }
    }],
    layout: {
      title: {
        text: 'Availability & Losses Breakdown',
        font: { size: 14, color: textColor, weight: 'bold' }
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1.05,
        y: 0.5,
        font: { color: textColor, size: 11 }
      },
      height: 320,
      margin: { t: 50, b: 20, l: 20, r: 150 }
    }
  }), [data.availabilityAndLosses, darkMode, bgColor, textColor, gridColor]);

  return (
    <Container>
      <SpaceBetween size="l">
        <Header variant="h2">Performance Analysis Dashboard</Header>
        
        {/* Summary Bar */}
        <Box
          padding="m"
          style={{
            border: `1px solid ${gridColor}`,
            borderRadius: '8px',
            backgroundColor: darkMode ? '#232f3e' : '#f9f9f9'
          }}
        >
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Annual Energy Production</Box>
              <Box variant="awsui-value-large" color="text-status-success">
                {data.summary.total_aep_gwh.toFixed(2)} GWh
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Capacity Factor</Box>
              <Box variant="awsui-value-large" color="text-status-info">
                {(data.summary.capacity_factor * 100).toFixed(1)}%
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Wake Losses</Box>
              <Box variant="awsui-value-large" color="text-status-warning">
                {data.summary.wake_loss_percent.toFixed(1)}%
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Number of Turbines</Box>
              <Box variant="awsui-value-large">
                {data.summary.number_of_turbines}
              </Box>
            </div>
          </ColumnLayout>
        </Box>

        {/* 2x2 Grid of Charts */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6 } },
            { colspan: { default: 12, xs: 6 } },
            { colspan: { default: 12, xs: 6 } },
            { colspan: { default: 12, xs: 6 } }
          ]}
        >
          {/* Top Left: Monthly Energy Production */}
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={monthlyEnergyChart.data}
              layout={monthlyEnergyChart.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '320px' }}
            />
          </Box>

          {/* Top Right: Capacity Factor Distribution */}
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={capacityFactorChart.data}
              layout={capacityFactorChart.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '320px' }}
            />
          </Box>

          {/* Bottom Left: Turbine Performance Heatmap */}
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={performanceHeatmap.data}
              layout={performanceHeatmap.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '320px' }}
            />
          </Box>

          {/* Bottom Right: Availability and Losses */}
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={availabilityLossesChart.data}
              layout={availabilityLossesChart.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '320px' }}
            />
          </Box>
        </Grid>

        {/* Additional Details */}
        <Box
          padding="m"
          style={{
            border: `1px solid ${gridColor}`,
            borderRadius: '8px',
            backgroundColor: bgColor
          }}
        >
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: 'Total Capacity',
                value: `${data.summary.total_capacity_mw.toFixed(1)} MW`
              },
              {
                label: 'Mean Wind Speed',
                value: `${data.summary.mean_wind_speed.toFixed(1)} m/s`
              },
              {
                label: 'Turbine Model',
                value: data.summary.turbine_model
              }
            ]}
          />
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default PerformanceAnalysisDashboard;
