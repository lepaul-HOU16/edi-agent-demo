/**
 * Responsive Wind Rose Container
 * 
 * Provides responsive design patterns and consistent Cloudscape styling
 * for wind rose visualizations across different screen sizes.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Grid,
  Button,
  Toggle,
  Select,
  FormField
} from '@cloudscape-design/components';
import WindRoseAnalysisVisualization from './WindRoseAnalysisVisualization';
import { WindResourceData, SeasonalWindData } from '../../types/windData';

interface ResponsiveWindRoseContainerProps {
  windData: WindResourceData;
  seasonalData?: SeasonalWindData;
  isLoading?: boolean;
  error?: string;
  onExport?: (format: string, data: any) => void;
  onAnalysisComplete?: (results: any) => void;
}

interface ViewportSize {
  width: number;
  height: number;
  breakpoint: 'xs' | 's' | 'm' | 'l' | 'xl';
}

const ResponsiveWindRoseContainer: React.FC<ResponsiveWindRoseContainerProps> = ({
  windData,
  seasonalData,
  isLoading = false,
  error,
  onExport,
  onAnalysisComplete
}) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 1200,
    height: 800,
    breakpoint: 'l'
  });
  const [compactMode, setCompactMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState<{ value: string; label: string }>({
    value: 'standard',
    label: 'Standard Layout'
  });

  // Update viewport size on window resize
  useEffect(() => {
    const updateViewportSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let breakpoint: ViewportSize['breakpoint'] = 'l';
      if (width < 576) breakpoint = 'xs';
      else if (width < 768) breakpoint = 's';
      else if (width < 992) breakpoint = 'm';
      else if (width < 1200) breakpoint = 'l';
      else breakpoint = 'xl';

      setViewportSize({ width, height, breakpoint });
      setCompactMode(width < 768);
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Layout mode options
  const layoutModeOptions = [
    { value: 'standard', label: 'Standard Layout' },
    { value: 'compact', label: 'Compact Layout' },
    { value: 'dashboard', label: 'Dashboard Layout' },
    { value: 'presentation', label: 'Presentation Mode' }
  ];

  // Get responsive chart height based on viewport
  const getChartHeight = () => {
    switch (viewportSize.breakpoint) {
      case 'xs': return 300;
      case 's': return 400;
      case 'm': return 500;
      case 'l': return 600;
      case 'xl': return 700;
      default: return 500;
    }
  };

  // Get responsive grid columns
  const getGridColumns = () => {
    if (layoutMode.value === 'compact' || compactMode) {
      return 1;
    }
    
    switch (viewportSize.breakpoint) {
      case 'xs':
      case 's': return 1;
      case 'm': return 2;
      case 'l':
      case 'xl': return layoutMode.value === 'dashboard' ? 3 : 2;
      default: return 2;
    }
  };

  // Get container variant based on layout mode
  const getContainerVariant = () => {
    switch (layoutMode.value) {
      case 'presentation': return 'full-page';
      case 'dashboard': return 'stacked';
      default: return 'default';
    }
  };

  return (
    <Container
      variant={getContainerVariant() as any}
      header={
        <Header
          variant="h1"
          description={`Responsive wind rose analysis optimized for ${viewportSize.breakpoint.toUpperCase()} screens (${viewportSize.width}×${viewportSize.height})`}
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <FormField label="Layout Mode">
                <Select
                  selectedOption={layoutMode}
                  onChange={({ detail }) => setLayoutMode(detail.selectedOption)}
                  options={layoutModeOptions}
                />
              </FormField>
              <Toggle
                checked={compactMode}
                onChange={({ detail }) => setCompactMode(detail.checked)}
              >
                Compact Mode
              </Toggle>
            </SpaceBetween>
          }
        >
          Wind Rose Analysis
        </Header>
      }
    >
      <SpaceBetween size={compactMode ? 's' : 'l'}>
        {/* Responsive Layout Information */}
        {layoutMode.value === 'dashboard' && (
          <Box>
            <Grid
              gridDefinition={[
                { colspan: { default: 12, xs: 12, s: 6, m: 4, l: 3, xl: 2 } },
                { colspan: { default: 12, xs: 12, s: 6, m: 4, l: 3, xl: 2 } },
                { colspan: { default: 12, xs: 12, s: 12, m: 4, l: 6, xl: 8 } }
              ]}
            >
              <Box>
                <Box variant="awsui-key-label">Viewport</Box>
                <div>{viewportSize.breakpoint.toUpperCase()}</div>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Dimensions</Box>
                <div>{viewportSize.width}×{viewportSize.height}</div>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Layout</Box>
                <div>{layoutMode.label} ({getGridColumns()} columns)</div>
              </Box>
            </Grid>
          </Box>
        )}

        {/* Main Wind Rose Visualization */}
        <Grid
          gridDefinition={[
            { 
              colspan: { 
                default: 12, 
                xs: 12, 
                s: 12, 
                m: layoutMode.value === 'compact' ? 12 : 8,
                l: layoutMode.value === 'dashboard' ? 8 : 9,
                xl: layoutMode.value === 'dashboard' ? 9 : 10
              } 
            },
            { 
              colspan: { 
                default: 12, 
                xs: 12, 
                s: 12, 
                m: layoutMode.value === 'compact' ? 12 : 4,
                l: layoutMode.value === 'dashboard' ? 4 : 3,
                xl: layoutMode.value === 'dashboard' ? 3 : 2
              } 
            }
          ]}
        >
          {/* Wind Rose Chart */}
          <WindRoseAnalysisVisualization
            windData={windData}
            seasonalData={seasonalData}
            isLoading={isLoading}
            error={error}
            onExport={onExport}
            onAnalysisComplete={onAnalysisComplete}
          />

          {/* Responsive Sidebar */}
          <Container
            header={
              <Header variant="h3">
                Quick Stats
              </Header>
            }
          >
            <SpaceBetween size="s">
              <Box>
                <Box variant="awsui-key-label">Mean Speed</Box>
                <div style={{ fontSize: compactMode ? '14px' : '16px', fontWeight: 'bold' }}>
                  {windData.statistics.meanWindSpeed.toFixed(1)} m/s
                </div>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Power Density</Box>
                <div style={{ fontSize: compactMode ? '14px' : '16px', fontWeight: 'bold' }}>
                  {windData.statistics.powerDensity.toFixed(0)} W/m²
                </div>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Data Quality</Box>
                <div style={{ fontSize: compactMode ? '14px' : '16px', fontWeight: 'bold' }}>
                  {windData.qualityMetrics.completeness.toFixed(0)}%
                </div>
              </Box>
              
              {!compactMode && (
                <>
                  <Box>
                    <Box variant="awsui-key-label">Measurement Period</Box>
                    <div style={{ fontSize: '12px' }}>
                      {new Date(windData.timeRange.startDate).toLocaleDateString()} - {new Date(windData.timeRange.endDate).toLocaleDateString()}
                    </div>
                  </Box>
                  <Box>
                    <Box variant="awsui-key-label">Total Hours</Box>
                    <div style={{ fontSize: '12px' }}>
                      {windData.timeRange.totalHours.toLocaleString()}
                    </div>
                  </Box>
                </>
              )}
            </SpaceBetween>
          </Container>
        </Grid>

        {/* Responsive Actions */}
        <Box>
          <SpaceBetween 
            direction={compactMode ? 'vertical' : 'horizontal'} 
            size="s"
          >
            <Button
              variant="primary"
              iconName="download"
              fullWidth={compactMode}
            >
              Export Analysis
            </Button>
            <Button
              variant="normal"
              iconName="share"
              fullWidth={compactMode}
            >
              Share Results
            </Button>
            <Button
              variant="normal"
              iconName="settings"
              fullWidth={compactMode}
            >
              Customize View
            </Button>
          </SpaceBetween>
        </Box>

        {/* Responsive Footer */}
        <Box 
          variant="small" 
          color="text-body-secondary"
          textAlign={compactMode ? 'center' : 'left'}
        >
          Optimized for {viewportSize.breakpoint.toUpperCase()} screens • 
          Layout: {layoutMode.label} • 
          Chart Height: {getChartHeight()}px
        </Box>
      </SpaceBetween>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 576px) {
          .wind-rose-container {
            padding: 8px;
          }
        }
        
        @media (min-width: 577px) and (max-width: 768px) {
          .wind-rose-container {
            padding: 12px;
          }
        }
        
        @media (min-width: 769px) and (max-width: 992px) {
          .wind-rose-container {
            padding: 16px;
          }
        }
        
        @media (min-width: 993px) {
          .wind-rose-container {
            padding: 20px;
          }
        }
        
        .responsive-chart {
          width: 100%;
          height: auto;
          min-height: 300px;
        }
        
        .compact-stats {
          font-size: 12px;
        }
        
        .standard-stats {
          font-size: 14px;
        }
      `}</style>
    </Container>
  );
};

export default ResponsiveWindRoseContainer;