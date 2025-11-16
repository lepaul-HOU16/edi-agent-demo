/**
 * Plotly Wind Rose Component
 * Interactive polar bar chart with stacked bars showing wind speed distribution by direction
 * Implements design specifications from renewable-project-persistence spec
 * Responsive to Cloudscape Design dark/light mode
 */

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { Box, Spinner } from '@cloudscape-design/components';
import './PlotlyWindRose.css';

// Dynamic import for Plotly (client-side only)
const Plot = React.lazy(() => import('react-plotly.js')) as any;

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
  dataSource?: string;  // Data source label (e.g., "NREL Wind Toolkit")
  dataYear?: number;    // Data year
  dataQuality?: 'high' | 'medium' | 'low';  // Data quality indicator
}

/**
 * Hook to detect current theme mode from Cloudscape Design
 * Syncs with global theme changes via localStorage and body data-theme attribute
 */
const useThemeMode = (): boolean => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Initial theme detection
    const detectTheme = () => {
      // Check localStorage first (set by layout.tsx)
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      
      // Fallback to body data-theme attribute
      const bodyTheme = document.body.getAttribute('data-theme');
      if (bodyTheme) {
        return bodyTheme === 'dark';
      }
      
      // Fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    setIsDarkMode(detectTheme());

    // Listen for storage events (theme changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode' && e.newValue !== null) {
        setIsDarkMode(e.newValue === 'true');
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = () => {
      setIsDarkMode(detectTheme());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themechange', handleThemeChange);

    // Poll for theme changes (backup mechanism)
    const pollInterval = setInterval(() => {
      const currentTheme = detectTheme();
      setIsDarkMode(prev => {
        if (prev !== currentTheme) {
          return currentTheme;
        }
        return prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
      clearInterval(pollInterval);
    };
  }, []);

  return isDarkMode;
}

const PlotlyWindRose: React.FC<PlotlyWindRoseProps> = ({
  data,
  layout: providedLayout,
  projectId,
  statistics,
  dataSource = 'NREL Wind Toolkit',
  dataYear = 2023,
  dataQuality = 'high'
}) => {
  // Detect current theme mode from Cloudscape Design
  const isDarkMode = useThemeMode();
  
  // Apply theme-aware styling to data traces
  const themedData = useMemo(() => {
    if (!data) return data;
    
    const borderColor = isDarkMode ? '#ffffff' : '#000000';
    
    return data.map(trace => ({
      ...trace,
      marker: {
        ...trace.marker,
        line: {
          ...trace.marker?.line,
          color: borderColor,
          width: trace.marker?.line?.width || 0.5
        }
      }
    }));
  }, [data, isDarkMode]);
  
  // Default layout configuration matching design spec
  const defaultLayout = useMemo(() => {
    const bgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const gridColor = isDarkMode ? '#444444' : '#e9ebed';
    
    return {
      // Use Plotly template to force ALL text colors
      template: {
        layout: {
          font: { color: textColor, family: 'Arial, sans-serif' },
          paper_bgcolor: bgColor,
          plot_bgcolor: bgColor,
          polar: {
            bgcolor: 'rgba(0,0,0,0)',
            radialaxis: {
              gridcolor: gridColor,
              linecolor: gridColor,
              tickfont: { color: textColor }
            },
            angularaxis: {
              gridcolor: gridColor,
              linecolor: gridColor,
              tickfont: { color: textColor }
            }
          },
          legend: {
            font: { color: textColor },
            title: { font: { color: textColor } }
          }
        }
      },
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
          linecolor: gridColor,
          tickfont: { 
            color: textColor, 
            size: 11,
            family: 'Arial, sans-serif'
          },
          showline: true,
          linewidth: 1
        },
        angularaxis: {
          direction: 'clockwise',
          rotation: 90,  // North at top
          gridcolor: gridColor,
          linecolor: gridColor,
          tickfont: { 
            color: textColor, 
            size: 12,
            family: 'Arial, sans-serif'
          },
          showline: true,
          linewidth: 2
        },
        bgcolor: 'rgba(0,0,0,0)'
      },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, family: 'Arial, sans-serif' },
      showlegend: true,
      legend: {
        title: { 
          text: 'Wind Speed (m/s)',
          font: { 
            size: 13, 
            color: textColor,
            family: 'Arial, sans-serif'
          }
        },
        orientation: 'v',
        x: 1.05,
        y: 0.5,
        font: { 
          color: textColor, 
          size: 11,
          family: 'Arial, sans-serif'
        },
        bgcolor: isDarkMode ? 'rgba(26,26,26,0.8)' : 'rgba(255,255,255,0.8)',
        bordercolor: gridColor,
        borderwidth: 1
      },
      barmode: 'stack',  // Stack bars for each speed range
      height: 600,
      margin: { t: 80, b: 80, l: 60, r: 150 }
    };
  }, [projectId, isDarkMode]);

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

    const textColor = isDarkMode ? '#ffffff' : '#000000';
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
  }, [finalLayout, statistics, isDarkMode]);

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

  // Plotly configuration - hide toolbar
  const config = useMemo(() => ({
    responsive: true,
    displayModeBar: false,  // Hide the toolbar completely
    displaylogo: false
  }), []);

  // Validate data
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" padding="xxl" color="text-body-secondary">
        <div style={{ 
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
          padding: '40px',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? '#444' : '#e9ebed'}`
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
            backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
            borderRadius: '6px',
            border: `1px solid ${isDarkMode ? '#444' : '#e9ebed'}`,
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

  return (
    <div 
      className={isDarkMode ? 'plotly-windrose-dark' : 'plotly-windrose-light'}
      style={{ 
        width: '100%', 
        position: 'relative'
      }}
    >
      {/* Wind Rose Plot - No banner, just the plot */}
      <div style={{ 
        width: '100%', 
        height: '600px',
        border: `1px solid ${isDarkMode ? '#444' : '#e9ebed'}`,
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        padding: '8px',
        overflow: 'hidden'
      }}>
        <Suspense fallback={<Box textAlign="center" padding="l"><Spinner size="large" /></Box>}>
          <Plot
            data={themedData}
            layout={layoutWithStats}
            config={config}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default PlotlyWindRose;
