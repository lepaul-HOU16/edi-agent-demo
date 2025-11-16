/**
 * Wind Resource Dashboard Component
 * Consolidates wind rose and supporting charts into a cohesive dashboard
 * Layout: 60% wind rose (left), 40% supporting charts (right)
 */

import React, { useMemo, Suspense } from 'react';
import { Box, Container, Grid, SpaceBetween, Header, ColumnLayout, Spinner } from '@cloudscape-design/components';
import PlotlyWindRose from './PlotlyWindRose';

// Dynamic import for Plotly charts
const Plot = React.lazy(() => import('react-plotly.js')) as any;

// Wrapper component for Plot with Suspense
const PlotWithSuspense: React.FC<any> = (props) => (
  <Suspense fallback={<Box textAlign="center" padding="l"><Spinner size="large" /></Box>}>
    <PlotWithSuspense {...props} />
  </Suspense>
);

interface WindResourceData {
  windRoseData: any[];  // Plotly wind rose traces
  windRoseLayout?: any;
  windSpeedDistribution: {
    speeds: number[];
    frequencies: number[];
  };
  seasonalPatterns: {
    months: string[];
    avgSpeeds: number[];
    maxSpeeds: number[];
  };
  monthlyAverages: {
    months: string[];
    speeds: number[];
  };
  variabilityAnalysis: {
    hourly: { hours: number[]; avgSpeeds: number[] };
    daily: { days: string[]; avgSpeeds: number[] };
  };
  statistics?: {
    average_speed: number;
    max_speed: number;
    prevailing_direction: string;
    prevailing_frequency: number;
    weibull_k?: number;
    weibull_a?: number;
  };
}

interface WindResourceDashboardProps {
  data: WindResourceData;
  projectId: string;
  darkMode?: boolean;
}

const WindResourceDashboard: React.FC<WindResourceDashboardProps> = ({
  data,
  projectId,
  darkMode = true
}) => {
  const bgColor = darkMode ? '#1a1a1a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#000000';
  const gridColor = darkMode ? '#444444' : '#e9ebed';

  // Wind Speed Distribution Chart
  const windSpeedDistChart = useMemo(() => ({
    data: [{
      type: 'bar',
      x: data.windSpeedDistribution.speeds,
      y: data.windSpeedDistribution.frequencies,
      marker: {
        color: '#0972d3',
        line: { color: darkMode ? '#444' : '#e9ebed', width: 1 }
      },
      hovertemplate: '<b>Speed: %{x} m/s</b><br>Frequency: %{y}%<extra></extra>'
    }],
    layout: {
      title: {
        text: 'Wind Speed Distribution',
        font: { size: 14, color: textColor }
      },
      xaxis: {
        title: 'Wind Speed (m/s)',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Frequency (%)',
        gridcolor: gridColor,
        color: textColor
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 280,
      margin: { t: 40, b: 50, l: 50, r: 20 }
    }
  }), [data.windSpeedDistribution, darkMode, bgColor, textColor, gridColor]);

  // Seasonal Patterns Chart
  const seasonalPatternsChart = useMemo(() => ({
    data: [
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Average Speed',
        x: data.seasonalPatterns.months,
        y: data.seasonalPatterns.avgSpeeds,
        line: { color: '#0972d3', width: 2 },
        marker: { size: 8 }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Max Speed',
        x: data.seasonalPatterns.months,
        y: data.seasonalPatterns.maxSpeeds,
        line: { color: '#d13212', width: 2, dash: 'dash' },
        marker: { size: 8 }
      }
    ],
    layout: {
      title: {
        text: 'Seasonal Wind Patterns',
        font: { size: 14, color: textColor }
      },
      xaxis: {
        title: 'Month',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Wind Speed (m/s)',
        gridcolor: gridColor,
        color: textColor
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 }
      },
      height: 280,
      margin: { t: 40, b: 50, l: 50, r: 20 }
    }
  }), [data.seasonalPatterns, darkMode, bgColor, textColor, gridColor]);

  // Monthly Averages Chart
  const monthlyAveragesChart = useMemo(() => ({
    data: [{
      type: 'bar',
      x: data.monthlyAverages.months,
      y: data.monthlyAverages.speeds,
      marker: {
        color: data.monthlyAverages.speeds,
        colorscale: [
          [0, '#ffff00'],
          [0.5, '#ff9900'],
          [1, '#9933ff']
        ],
        line: { color: darkMode ? '#444' : '#e9ebed', width: 1 }
      },
      hovertemplate: '<b>%{x}</b><br>Avg Speed: %{y:.1f} m/s<extra></extra>'
    }],
    layout: {
      title: {
        text: 'Monthly Average Wind Speed',
        font: { size: 14, color: textColor }
      },
      xaxis: {
        title: 'Month',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Wind Speed (m/s)',
        gridcolor: gridColor,
        color: textColor
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 280,
      margin: { t: 40, b: 50, l: 50, r: 20 }
    }
  }), [data.monthlyAverages, darkMode, bgColor, textColor, gridColor]);

  // Variability Analysis Chart (Hourly)
  const variabilityChart = useMemo(() => ({
    data: [{
      type: 'scatter',
      mode: 'lines',
      name: 'Hourly Average',
      x: data.variabilityAnalysis.hourly.hours,
      y: data.variabilityAnalysis.hourly.avgSpeeds,
      line: { color: '#0972d3', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(9, 114, 211, 0.2)'
    }],
    layout: {
      title: {
        text: 'Diurnal Wind Variability',
        font: { size: 14, color: textColor }
      },
      xaxis: {
        title: 'Hour of Day',
        gridcolor: gridColor,
        color: textColor,
        range: [0, 23]
      },
      yaxis: {
        title: 'Wind Speed (m/s)',
        gridcolor: gridColor,
        color: textColor
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 280,
      margin: { t: 40, b: 50, l: 50, r: 20 }
    }
  }), [data.variabilityAnalysis, darkMode, bgColor, textColor, gridColor]);

  return (
    <Container>
      <SpaceBetween size="l">
        <Header variant="h2">Wind Resource Analysis Dashboard</Header>
        
        {/* Main Layout: 60% Wind Rose, 40% Supporting Charts */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 7 } },
            { colspan: { default: 12, xs: 5 } }
          ]}
        >
          {/* Left: Wind Rose (60%) */}
          <Box>
            <PlotlyWindRose
              data={data.windRoseData}
              layout={data.windRoseLayout}
              projectId={projectId}
              statistics={data.statistics}
              darkBackground={darkMode}
            />
          </Box>

          {/* Right: Supporting Charts (40%) */}
          <SpaceBetween size="m">
            {/* Wind Speed Distribution */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={windSpeedDistChart.data}
                layout={windSpeedDistChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>

            {/* Seasonal Patterns */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={seasonalPatternsChart.data}
                layout={seasonalPatternsChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>
          </SpaceBetween>
        </Grid>

        {/* Bottom Row: Monthly Averages and Variability */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6 } },
            { colspan: { default: 12, xs: 6 } }
          ]}
        >
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={monthlyAveragesChart.data}
              layout={monthlyAveragesChart.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '280px' }}
            />
          </Box>

          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <Plot
              data={variabilityChart.data}
              layout={variabilityChart.layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '280px' }}
            />
          </Box>
        </Grid>

        {/* Statistics Summary */}
        {data.statistics && (
          <Box
            padding="m"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor
            }}
          >
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Average Wind Speed</Box>
                <Box variant="awsui-value-large">{data.statistics.average_speed.toFixed(1)} m/s</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Maximum Wind Speed</Box>
                <Box variant="awsui-value-large">{data.statistics.max_speed.toFixed(1)} m/s</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Prevailing Direction</Box>
                <Box variant="awsui-value-large">{data.statistics.prevailing_direction}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Prevailing Frequency</Box>
                <Box variant="awsui-value-large">{data.statistics.prevailing_frequency.toFixed(1)}%</Box>
              </div>
            </ColumnLayout>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default WindResourceDashboard;
