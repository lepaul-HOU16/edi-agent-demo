/**
 * Interactive Wind Rose Component
 * Uses Plotly for interactive polar bar chart visualization
 * Matches petro agent patterns with react-plotly.js
 */

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly (matches petro agent pattern)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#666'
    }}>
      Loading interactive wind rose...
    </div>
  )
});

interface WindRoseData {
  direction: string;
  angle: number;
  frequency: number;
  avg_speed: number;
  max_speed: number;
}

interface InteractiveWindRoseProps {
  windRoseData: WindRoseData[];
  projectId: string;
  avgSpeed: number;
  maxSpeed: number;
  prevailingDirection: string;
}

const InteractiveWindRose: React.FC<InteractiveWindRoseProps> = ({
  windRoseData,
  projectId,
  avgSpeed,
  maxSpeed,
  prevailingDirection
}) => {
  // Prepare data for Plotly polar bar chart
  const plotlyData = React.useMemo(() => [{
    type: 'barpolar' as const,
    r: windRoseData.map(d => d.frequency),
    theta: windRoseData.map(d => d.angle),
    marker: {
      color: windRoseData.map(d => d.avg_speed),
      colorscale: 'Viridis',
      showscale: true,
      colorbar: {
        title: {
          text: 'Wind Speed<br>(m/s)',
          side: 'right'
        },
        thickness: 15,
        len: 0.7,
        x: 1.02
      },
      line: {
        color: 'rgba(255, 255, 255, 0.5)',
        width: 1
      }
    },
    hovertemplate: 
      '<b>%{customdata[0]}</b> (%{theta}°)<br>' +
      'Frequency: %{r:.1f}%<br>' +
      'Avg Speed: %{customdata[1]:.1f} m/s<br>' +
      'Max Speed: %{customdata[2]:.1f} m/s<br>' +
      '<extra></extra>',
    customdata: windRoseData.map(d => [d.direction, d.avg_speed, d.max_speed]),
    width: windRoseData.map(() => 360 / windRoseData.length),
    name: 'Wind Rose'
  }], [windRoseData]);

  const layout = React.useMemo(() => ({
    title: {
      text: `Wind Rose - ${projectId}`,
      font: { 
        size: 16, 
        weight: 'bold' as const,
        family: 'Arial, sans-serif'
      },
      x: 0.5,
      xanchor: 'center' as const
    },
    polar: {
      radialaxis: {
        title: {
          text: 'Frequency (%)',
          font: { size: 12 }
        },
        angle: 90,
        ticksuffix: '%',
        showline: true,
        linewidth: 1,
        gridcolor: 'rgba(0, 0, 0, 0.1)'
      },
      angularaxis: {
        direction: 'clockwise' as const,
        rotation: 90,  // North at top
        showline: true,
        linewidth: 2,
        gridcolor: 'rgba(0, 0, 0, 0.1)',
        tickfont: { size: 11 }
      },
      bgcolor: 'rgba(250, 250, 250, 0.5)'
    },
    showlegend: false,
    height: 550,
    margin: { t: 80, b: 60, l: 60, r: 100 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    annotations: [
      {
        text: `Avg: ${avgSpeed.toFixed(1)} m/s | Max: ${maxSpeed.toFixed(1)} m/s | Prevailing: ${prevailingDirection}`,
        xref: 'paper' as const,
        yref: 'paper' as const,
        x: 0.5,
        y: -0.08,
        xanchor: 'center' as const,
        yanchor: 'top' as const,
        showarrow: false,
        font: {
          size: 11,
          color: '#666'
        }
      }
    ]
  }), [projectId, avgSpeed, maxSpeed, prevailingDirection]);

  const config = React.useMemo(() => ({
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png' as const,
      filename: `wind_rose_${projectId}`,
      height: 1200,
      width: 1200,
      scale: 2
    }
  }), [projectId]);

  return (
    <div style={{ 
      width: '100%', 
      height: '550px',
      border: '1px solid #e9ebed',
      borderRadius: '8px',
      backgroundColor: '#fff',
      padding: '8px'
    }}>
      <Plot
        data={plotlyData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default InteractiveWindRose;
