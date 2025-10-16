/**
 * Wake Analysis Dashboard Component
 * Consolidates wake heat map and wake analysis charts
 * Layout: 50% map (left), 50% charts in 2x2 grid (right)
 */

import React, { useMemo, useState } from 'react';
import { Box, Container, Grid, SpaceBetween, Header, Tabs } from '@cloudscape-design/components';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly charts
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
}) as any;

interface WakeAnalysisData {
  wakeHeatMap: {
    html: string;  // Folium HTML map
    url?: string;  // S3 URL if stored
  };
  wakeDeficitProfile: {
    distances: number[];  // Distance downwind (m)
    deficits: number[];   // Wake deficit (%)
    directions: string[]; // Wind directions
  };
  turbineInteractionMatrix: {
    turbines: string[];
    interactions: number[][];  // 2D matrix of wake interactions
  };
  wakeLossByDirection: {
    directions: string[];  // 16 compass directions
    losses: number[];      // Wake loss percentage
  };
  summary: {
    total_wake_loss: number;
    max_wake_deficit: number;
    most_affected_turbine: string;
    prevailing_wake_direction: string;
  };
}

interface WakeAnalysisDashboardProps {
  data: WakeAnalysisData;
  projectId: string;
  darkMode?: boolean;
}

const WakeAnalysisDashboard: React.FC<WakeAnalysisDashboardProps> = ({
  data,
  projectId,
  darkMode = true
}) => {
  const bgColor = darkMode ? '#1a1a1a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#000000';
  const gridColor = darkMode ? '#444444' : '#e9ebed';
  const [mapLoaded, setMapLoaded] = useState(false);

  // Wake Deficit Profile Chart
  const wakeDeficitChart = useMemo(() => ({
    data: data.wakeDeficitProfile.directions.map((direction, idx) => ({
      type: 'scatter',
      mode: 'lines',
      name: direction,
      x: data.wakeDeficitProfile.distances,
      y: data.wakeDeficitProfile.deficits,
      line: { width: 2 },
      hovertemplate: `<b>${direction}</b><br>Distance: %{x} m<br>Deficit: %{y:.1f}%<extra></extra>`
    })),
    layout: {
      title: {
        text: 'Wake Deficit Profile',
        font: { size: 13, color: textColor, weight: 'bold' }
      },
      xaxis: {
        title: 'Distance Downwind (m)',
        gridcolor: gridColor,
        color: textColor
      },
      yaxis: {
        title: 'Wake Deficit (%)',
        gridcolor: gridColor,
        color: textColor,
        range: [0, 100]
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, size: 10 },
      showlegend: true,
      legend: {
        x: 1.02,
        y: 1,
        bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 9 }
      },
      height: 280,
      margin: { t: 40, b: 50, l: 50, r: 100 }
    }
  }), [data.wakeDeficitProfile, darkMode, bgColor, textColor, gridColor]);

  // Turbine Interaction Matrix Heatmap
  const interactionMatrixChart = useMemo(() => ({
    data: [{
      type: 'heatmap',
      x: data.turbineInteractionMatrix.turbines,
      y: data.turbineInteractionMatrix.turbines,
      z: data.turbineInteractionMatrix.interactions,
      colorscale: [
        [0, '#037f0c'],
        [0.5, '#ffcc00'],
        [1, '#d13212']
      ],
      hovertemplate: '<b>%{y} → %{x}</b><br>Interaction: %{z:.1f}%<extra></extra>',
      showscale: true,
      colorbar: {
        title: 'Impact (%)',
        titleside: 'right',
        len: 0.6,
        x: 1.02,
        tickfont: { size: 9 }
      }
    }],
    layout: {
      title: {
        text: 'Turbine Interaction Matrix',
        font: { size: 13, color: textColor, weight: 'bold' }
      },
      xaxis: {
        title: 'Affected Turbine',
        gridcolor: gridColor,
        color: textColor,
        tickfont: { size: 9 }
      },
      yaxis: {
        title: 'Source Turbine',
        gridcolor: gridColor,
        color: textColor,
        autorange: 'reversed',
        tickfont: { size: 9 }
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 280,
      margin: { t: 40, b: 50, l: 60, r: 80 }
    }
  }), [data.turbineInteractionMatrix, darkMode, bgColor, textColor, gridColor]);

  // Wake Loss by Direction Polar Chart
  const wakeLossByDirectionChart = useMemo(() => ({
    data: [{
      type: 'barpolar',
      r: data.wakeLossByDirection.losses,
      theta: data.wakeLossByDirection.directions,
      marker: {
        color: data.wakeLossByDirection.losses,
        colorscale: [
          [0, '#037f0c'],
          [0.5, '#ffcc00'],
          [1, '#d13212']
        ],
        line: { color: darkMode ? '#333' : '#e9ebed', width: 1 }
      },
      hovertemplate: '<b>%{theta}</b><br>Wake Loss: %{r:.1f}%<extra></extra>'
    }],
    layout: {
      title: {
        text: 'Wake Loss by Direction',
        font: { size: 13, color: textColor, weight: 'bold' }
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, Math.max(...data.wakeLossByDirection.losses) * 1.1],
          showticklabels: true,
          ticksuffix: '%',
          gridcolor: gridColor,
          tickfont: { size: 9 }
        },
        angularaxis: {
          direction: 'clockwise',
          rotation: 90,
          gridcolor: gridColor,
          tickfont: { size: 9 }
        },
        bgcolor: 'rgba(0,0,0,0)'
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      showlegend: false,
      height: 280,
      margin: { t: 40, b: 20, l: 20, r: 20 }
    }
  }), [data.wakeLossByDirection, darkMode, bgColor, textColor, gridColor]);

  // Summary Statistics Chart
  const summaryChart = useMemo(() => ({
    data: [{
      type: 'indicator',
      mode: 'number+delta',
      value: data.summary.total_wake_loss,
      title: {
        text: 'Total Wake Loss',
        font: { size: 14, color: textColor }
      },
      number: {
        suffix: '%',
        font: { size: 32, color: textColor }
      },
      domain: { x: [0, 1], y: [0, 1] }
    }],
    layout: {
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      height: 280,
      margin: { t: 20, b: 20, l: 20, r: 20 }
    }
  }), [data.summary, darkMode, bgColor, textColor]);

  return (
    <Container>
      <SpaceBetween size="l">
        <Header variant="h2">Wake Analysis Dashboard</Header>
        
        {/* Main Layout: 50% Map, 50% Charts */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6 } },
            { colspan: { default: 12, xs: 6 } }
          ]}
        >
          {/* Left: Wake Heat Map (50%) */}
          <Box
            padding="s"
            style={{
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              backgroundColor: bgColor,
              height: '600px',
              overflow: 'hidden'
            }}
          >
            <SpaceBetween size="xs">
              <Header variant="h3">Wake Heat Map</Header>
              {data.wakeHeatMap.url ? (
                <iframe
                  src={data.wakeHeatMap.url}
                  style={{
                    width: '100%',
                    height: '540px',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                  title="Wake Heat Map"
                  onLoad={() => setMapLoaded(true)}
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: data.wakeHeatMap.html }}
                  style={{
                    width: '100%',
                    height: '540px',
                    overflow: 'auto',
                    borderRadius: '4px'
                  }}
                />
              )}
            </SpaceBetween>
          </Box>

          {/* Right: Charts in 2x2 Grid (50%) */}
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 6 } },
              { colspan: { default: 12, xs: 6 } },
              { colspan: { default: 12, xs: 6 } },
              { colspan: { default: 12, xs: 6 } }
            ]}
          >
            {/* Top Left: Wake Deficit Profile */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={wakeDeficitChart.data}
                layout={wakeDeficitChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>

            {/* Top Right: Turbine Interaction Matrix */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={interactionMatrixChart.data}
                layout={interactionMatrixChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>

            {/* Bottom Left: Wake Loss by Direction */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={wakeLossByDirectionChart.data}
                layout={wakeLossByDirectionChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>

            {/* Bottom Right: Summary Statistics */}
            <Box
              padding="s"
              style={{
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                backgroundColor: bgColor
              }}
            >
              <Plot
                data={summaryChart.data}
                layout={summaryChart.layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '280px' }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Summary Details */}
        <Box
          padding="m"
          style={{
            border: `1px solid ${gridColor}`,
            borderRadius: '8px',
            backgroundColor: darkMode ? '#232f3e' : '#f9f9f9'
          }}
        >
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 3 } },
              { colspan: { default: 12, xs: 3 } },
              { colspan: { default: 12, xs: 3 } },
              { colspan: { default: 12, xs: 3 } }
            ]}
          >
            <div>
              <Box variant="awsui-key-label">Total Wake Loss</Box>
              <Box variant="awsui-value-large" color="text-status-warning">
                {data.summary.total_wake_loss.toFixed(1)}%
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Max Wake Deficit</Box>
              <Box variant="awsui-value-large" color="text-status-error">
                {data.summary.max_wake_deficit.toFixed(1)}%
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Most Affected Turbine</Box>
              <Box variant="awsui-value-large">
                {data.summary.most_affected_turbine}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Prevailing Wake Direction</Box>
              <Box variant="awsui-value-large">
                {data.summary.prevailing_wake_direction}
              </Box>
            </div>
          </Grid>
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default WakeAnalysisDashboard;
