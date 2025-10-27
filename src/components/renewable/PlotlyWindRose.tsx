/**
 * Plotly Wind Rose Component
 * Interactive polar bar chart with stacked bars showing wind speed distribution by direction
 * Implements design specifications from renewable-project-persistence spec
 */

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Spinner } from '@cloudscape-design/components';

// Dynamic import for Plotly (client-side only)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px'
    }}>
      <Spinner size="large" />
    </div>
  )
}) as any; // Type assertion for dynamic import

interface PlotlyWindRoseProps {
  data: any[];  // Plotly trace data
  layout?: any;  // Plotly layout config
  projectId: string;
  statistics?: {
    average_speed: number;
    max_speed: number;
    prevailing_direction: string;
    prevailing_frequency: number;
  };
  darkBackground?: boolean;
  dataSource?: string;  // Data source label (e.g., "NREL Wind Toolkit")
  dataYear?: number;    // Data year
  dataQuality?: 'high' | 'medium' | 'low';  // Data quality indicator
}

const PlotlyWindRose: React.FC<PlotlyWindRoseProps> = ({
  data,
  layout: providedLayout,
  projectId,
  statistics,
  darkBackground = true,
  dataSource = 'NREL Wind Toolkit',
  dataYear = 2023,
  dataQuality = 'high'
}) => {
  // Default layout configuration matching design spec
  const defaultLayout = useMemo(() => {
    const bgColor = darkBackground ? '#1a1a1a' : '#ffffff';
    const textColor = darkBackground ? '#ffffff' : '#000000';
    const gridColor = darkBackground ? '#444444' : '#e9ebed';
    
    return {
      title: {
        text: `Wind Rose - ${projectId}`,
        font: {
          size: 18,
          color: textColor,
          family: 'Arial, sans-serif',
          weight: 'bold'
        },
        x: 0.5,
        xanchor: 'center'
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, null],  // Auto-scale
          showticklabels: true,
          ticksuffix: '%',
          gridcolor: gridColor,
          tickfont: { color: textColor, size: 11 },
          showline: true,
          linewidth: 1
        },
        angularaxis: {
          direction: 'clockwise',
          rotation: 90,  // North at top
          gridcolor: gridColor,
          tickfont: { color: textColor, size: 12 },
          showline: true,
          linewidth: 2
        },
        bgcolor: 'rgba(0,0,0,0)'
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      showlegend: true,
      legend: {
        title: { 
          text: 'Wind Speed (m/s)',
          font: { size: 13, color: textColor }
        },
        orientation: 'v',
        x: 1.05,
        y: 0.5,
        font: { color: textColor, size: 11 },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: gridColor,
        borderwidth: 1
      },
      barmode: 'stack',  // Stack bars for each speed range
      height: 600,
      margin: { t: 80, b: 80, l: 60, r: 150 }
    };
  }, [projectId, darkBackground]);

  // Merge provided layout with defaults
  const finalLayout = useMemo(() => {
    if (providedLayout) {
      return {
        ...defaultLayout,
        ...providedLayout,
        polar: {
          ...defaultLayout.polar,
          ...providedLayout.polar
        }
      };
    }
    return defaultLayout;
  }, [defaultLayout, providedLayout]);

  // Add statistics annotation if available
  const layoutWithStats = useMemo(() => {
    if (!statistics) return finalLayout;

    const textColor = darkBackground ? '#ffffff' : '#000000';
    const statsText = `Avg: ${statistics.average_speed.toFixed(1)} m/s | ` +
                     `Max: ${statistics.max_speed.toFixed(1)} m/s | ` +
                     `Prevailing: ${statistics.prevailing_direction} (${statistics.prevailing_frequency.toFixed(1)}%)`;

    return {
      ...finalLayout,
      annotations: [
        ...(finalLayout.annotations || []),
        {
          text: statsText,
          xref: 'paper',
          yref: 'paper',
          x: 0.5,
          y: -0.08,
          xanchor: 'center',
          yanchor: 'top',
          showarrow: false,
          font: {
            size: 12,
            color: textColor
          }
        }
      ]
    };
  }, [finalLayout, statistics, darkBackground]);

  // Export handlers
  const exportToPNG = React.useCallback(() => {
    const plotElement = document.querySelector('.js-plotly-plot') as any;
    if (plotElement && (window as any).Plotly) {
      (window as any).Plotly.toImage(plotElement, {
        format: 'png',
        width: 1200,
        height: 1200,
        scale: 2
      }).then((dataUrl: string) => {
        const link = document.createElement('a');
        link.download = `wind_rose_${projectId}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  }, [projectId]);

  const exportToSVG = React.useCallback(() => {
    const plotElement = document.querySelector('.js-plotly-plot') as any;
    if (plotElement && (window as any).Plotly) {
      (window as any).Plotly.toImage(plotElement, {
        format: 'svg',
        width: 1200,
        height: 1200
      }).then((dataUrl: string) => {
        const link = document.createElement('a');
        link.download = `wind_rose_${projectId}.svg`;
        link.href = dataUrl;
        link.click();
      });
    }
  }, [projectId]);

  const exportToJSON = React.useCallback(() => {
    const exportData = {
      projectId,
      data,
      layout: layoutWithStats,
      statistics,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `wind_rose_data_${projectId}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [projectId, data, layoutWithStats, statistics]);

  // Plotly configuration with export buttons
  const config = useMemo(() => ({
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    modeBarButtonsToAdd: [
      {
        name: 'Export to PNG',
        icon: {
          width: 500,
          height: 600,
          path: 'M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm65.2 199.6c-4.7 4.7-12.3 4.7-17 0L224 287.4l-48.2 48.2c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17l48.2-48.2-48.2-48.2c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l48.2 48.2 48.2-48.2c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L248 263.4l48.2 48.2c4.7 4.7 4.7 12.3 0 17l-7 7z'
        },
        click: exportToPNG
      },
      {
        name: 'Export to SVG',
        icon: {
          width: 500,
          height: 600,
          path: 'M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm65.2 199.6c-4.7 4.7-12.3 4.7-17 0L224 287.4l-48.2 48.2c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17l48.2-48.2-48.2-48.2c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l48.2 48.2 48.2-48.2c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L248 263.4l48.2 48.2c4.7 4.7 4.7 12.3 0 17l-7 7z'
        },
        click: exportToSVG
      },
      {
        name: 'Export Data (JSON)',
        icon: {
          width: 500,
          height: 600,
          path: 'M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm65.2 199.6c-4.7 4.7-12.3 4.7-17 0L224 287.4l-48.2 48.2c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17l48.2-48.2-48.2-48.2c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l48.2 48.2 48.2-48.2c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L248 263.4l48.2 48.2c4.7 4.7 4.7 12.3 0 17l-7 7z'
        },
        click: exportToJSON
      }
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: `wind_rose_${projectId}`,
      height: 1200,
      width: 1200,
      scale: 2
    }
  }), [projectId, exportToPNG, exportToSVG, exportToJSON]);

  // Validate data
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" padding="xxl" color="text-body-secondary">
        <div style={{ 
          backgroundColor: darkBackground ? '#1a1a1a' : '#f9f9f9',
          padding: '40px',
          borderRadius: '8px',
          border: `1px solid ${darkBackground ? '#444' : '#e9ebed'}`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌬️</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#d91515' }}>
            Unable to Fetch Wind Data from NREL API
          </div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            Wind rose visualization requires real meteorological data from NREL Wind Toolkit
          </div>
          <div style={{ 
            fontSize: '13px', 
            padding: '12px', 
            backgroundColor: darkBackground ? '#2a2a2a' : '#ffffff',
            borderRadius: '6px',
            border: `1px solid ${darkBackground ? '#444' : '#e9ebed'}`,
            textAlign: 'left',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Possible causes:</div>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>NREL API key not configured</li>
              <li>API rate limit exceeded</li>
              <li>Coordinates outside NREL coverage area (US only)</li>
              <li>Network connectivity issues</li>
            </ul>
            <div style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '8px' }}>Next steps:</div>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Configure NREL_API_KEY environment variable</li>
              <li>Get a free API key at: <a href="https://developer.nrel.gov/signup/" target="_blank" rel="noopener noreferrer" style={{ color: '#0972d3' }}>developer.nrel.gov/signup</a></li>
              <li>Ensure coordinates are within continental US</li>
            </ol>
          </div>
          <div style={{ 
            marginTop: '16px', 
            padding: '8px 12px', 
            backgroundColor: '#037f0c',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            ✓ NO SYNTHETIC DATA USED - Real NREL data required
          </div>
        </div>
      </Box>
    );
  }

  // Data quality badge color
  const qualityColor = dataQuality === 'high' ? '#037f0c' : dataQuality === 'medium' ? '#f89406' : '#d91515';
  const qualityIcon = dataQuality === 'high' ? '✓' : dataQuality === 'medium' ? '⚠' : '✗';

  return (
    <div style={{ 
      width: '100%', 
      position: 'relative'
    }}>
      {/* Data Source Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: darkBackground ? '#2a2a2a' : '#f9f9f9',
        borderRadius: '8px 8px 0 0',
        border: `1px solid ${darkBackground ? '#444' : '#e9ebed'}`,
        borderBottom: 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: darkBackground ? '#ffffff' : '#000000'
          }}>
            Data Source:
          </span>
          <span style={{
            fontSize: '14px',
            color: darkBackground ? '#aaaaaa' : '#5f6b7a'
          }}>
            {dataSource} ({dataYear})
          </span>
        </div>
        
        {/* Data Quality Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          backgroundColor: qualityColor,
          color: '#ffffff',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          <span>{qualityIcon}</span>
          <span>{dataQuality.toUpperCase()} QUALITY</span>
        </div>
      </div>

      {/* Wind Rose Plot */}
      <div style={{ 
        width: '100%', 
        height: '600px',
        border: `1px solid ${darkBackground ? '#444' : '#e9ebed'}`,
        borderRadius: '0 0 8px 8px',
        backgroundColor: darkBackground ? '#1a1a1a' : '#ffffff',
        padding: '8px',
        overflow: 'hidden'
      }}>
        <Plot
          data={data}
          layout={layoutWithStats}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};

export default PlotlyWindRose;
