/**
 * Wind Rose Chart Component
 * 
 * Interactive wind rose visualization using Plotly.js showing wind speed
 * and direction distributions with seasonal and temporal analysis capabilities.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, SpaceBetween, Button, Select, Toggle, ColumnLayout } from '@cloudscape-design/components';
import { 
  WindResourceData, 
  WindRoseData, 
  WindRoseConfig, 
  SeasonalWindData,
  DEFAULT_WIND_ROSE_CONFIG,
  WIND_DIRECTIONS,
  WindMeasurement,
  DirectionBin,
  SpeedBinData
} from '../../types/windData';

// Plotly.js imports
let Plotly: any;
if (typeof window !== 'undefined') {
  import('plotly.js').then((PlotlyModule) => {
    Plotly = PlotlyModule.default;
  });
}

interface WindRoseChartProps {
  windData: WindResourceData;
  seasonalData?: SeasonalWindData;
  config?: Partial<WindRoseConfig>;
  height?: number;
  onExport?: (format: string, data: any) => void;
  interactive?: boolean;
}

interface ViewMode {
  value: 'annual' | 'seasonal' | 'monthly';
  label: string;
}

interface SeasonOption {
  value: 'all' | 'spring' | 'summer' | 'autumn' | 'winter';
  label: string;
}

const WindRoseChart: React.FC<WindRoseChartProps> = ({
  windData,
  seasonalData,
  config = {},
  height = 500,
  onExport,
  interactive = true
}) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>({ value: 'annual', label: 'Annual' });
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption>({ value: 'all', label: 'All Seasons' });
  const [showFrequency, setShowFrequency] = useState(true);
  const [showSpeed, setShowSpeed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Merge config with defaults
  const windRoseConfig: WindRoseConfig = useMemo(() => ({
    ...DEFAULT_WIND_ROSE_CONFIG,
    ...config
  }), [config]);

  // Process wind data into wind rose format
  const windRoseData: WindRoseData = useMemo(() => {
    return processWindDataToWindRose(windData, windRoseConfig, selectedSeason.value);
  }, [windData, windRoseConfig, selectedSeason]);

  // View mode options
  const viewModeOptions: ViewMode[] = [
    { value: 'annual', label: 'Annual' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'monthly', label: 'Monthly' }
  ];

  // Season options
  const seasonOptions: SeasonOption[] = [
    { value: 'all', label: 'All Seasons' },
    { value: 'spring', label: 'Spring (Mar-May)' },
    { value: 'summer', label: 'Summer (Jun-Aug)' },
    { value: 'autumn', label: 'Autumn (Sep-Nov)' },
    { value: 'winter', label: 'Winter (Dec-Feb)' }
  ];

  // Create Plotly chart
  useEffect(() => {
    if (!Plotly || !plotRef.current || !windRoseData) return;

    const createWindRosePlot = async () => {
      setIsLoading(true);
      
      try {
        const traces = createWindRoseTraces(windRoseData, showFrequency, showSpeed);
        const layout = createWindRoseLayout(windRoseData, windRoseConfig, height);
        const plotConfig = {
          responsive: true,
          displayModeBar: interactive,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: `wind_rose_${windData.location.name || 'analysis'}`,
            height: height,
            width: height,
            scale: 2
          }
        };

        await Plotly.newPlot(plotRef.current, traces, layout, plotConfig);
        
        // Add click handler for interactivity
        if (interactive) {
          plotRef.current.on('plotly_click', (data: any) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0];
              console.log('Wind rose clicked:', {
                direction: point.theta,
                speed: point.r,
                frequency: point.text
              });
            }
          });
        }
      } catch (error) {
        console.error('Error creating wind rose plot:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createWindRosePlot();
  }, [windRoseData, showFrequency, showSpeed, interactive, height, windData.location.name]);

  // Handle export
  const handleExport = (format: string) => {
    if (!Plotly || !plotRef.current) return;

    if (format === 'png' || format === 'svg') {
      Plotly.downloadImage(plotRef.current, {
        format: format,
        filename: `wind_rose_${windData.location.name || 'analysis'}`,
        height: height,
        width: height,
        scale: 2
      });
    } else if (format === 'json' && onExport) {
      onExport(format, {
        windRoseData,
        config: windRoseConfig,
        metadata: {
          exportedAt: new Date().toISOString(),
          location: windData.location,
          timeRange: windData.timeRange
        }
      });
    }
  };

  return (
    <SpaceBetween size="m">
      {/* Responsive Controls */}
      <Container
        header={
          <Header variant="h3" description="Customize your wind rose visualization">
            Chart Controls
          </Header>
        }
      >
        <ColumnLayout 
          columns={{ default: 4, xxs: 1, xs: 2, s: 2, m: 3, l: 4 }} 
          variant="text-grid"
        >
          <div>
            <Box variant="awsui-key-label">View Mode</Box>
            <Select
              selectedOption={viewMode}
              onChange={({ detail }) => setViewMode(detail.selectedOption as ViewMode)}
              options={viewModeOptions}
              disabled={!seasonalData && viewMode.value !== 'annual'}
              expandToViewport
            />
          </div>
          <div>
            <Box variant="awsui-key-label">Season</Box>
            <Select
              selectedOption={selectedSeason}
              onChange={({ detail }) => setSelectedSeason(detail.selectedOption as SeasonOption)}
              options={seasonOptions}
              disabled={viewMode.value === 'annual'}
              expandToViewport
            />
          </div>
          <div>
            <Box variant="awsui-key-label">Display Options</Box>
            <SpaceBetween size="xs">
              <Toggle
                checked={showFrequency}
                onChange={({ detail }) => setShowFrequency(detail.checked)}
              >
                Show Frequency
              </Toggle>
              <Toggle
                checked={showSpeed}
                onChange={({ detail }) => setShowSpeed(detail.checked)}
              >
                Show Speed
              </Toggle>
            </SpaceBetween>
          </div>
          <div>
            <Box variant="awsui-key-label">Export</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                iconName="download"
                onClick={() => handleExport('png')}
                disabled={isLoading}
                size="small"
              >
                PNG
              </Button>
              <Button
                variant="normal"
                iconName="download"
                onClick={() => handleExport('svg')}
                disabled={isLoading}
                size="small"
              >
                SVG
              </Button>
              {onExport && (
                <Button
                  variant="normal"
                  iconName="download"
                  onClick={() => handleExport('json')}
                  disabled={isLoading}
                  size="small"
                >
                  Data
                </Button>
              )}
            </SpaceBetween>
          </div>
        </ColumnLayout>
      </Container>

      {/* Wind Rose Plot */}
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

      {/* Responsive Statistics Summary */}
      <Container
        header={
          <Header variant="h3">
            Wind Resource Statistics
          </Header>
        }
      >
        <ColumnLayout 
          columns={{ default: 4, xxs: 1, xs: 2, s: 2, m: 4 }} 
          variant="text-grid"
        >
          <div>
            <Box variant="small">Mean Wind Speed</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0073bb' }}>
              {windData.statistics.meanWindSpeed.toFixed(1)} m/s
            </div>
          </div>
          <div>
            <Box variant="small">Prevailing Direction</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0073bb' }}>
              {getDirectionLabel(windData.statistics.prevailingDirection)}
            </div>
          </div>
          <div>
            <Box variant="small">Power Density</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0073bb' }}>
              {windData.statistics.powerDensity.toFixed(0)} W/m²
            </div>
          </div>
          <div>
            <Box variant="small">Calm Percentage</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0073bb' }}>
              {windData.statistics.calmPercentage.toFixed(1)}%
            </div>
          </div>
        </ColumnLayout>
      </Container>
    </SpaceBetween>
  );
};

// Helper function to process wind data into wind rose format
function processWindDataToWindRose(
  windData: WindResourceData, 
  config: WindRoseConfig,
  season: string = 'all'
): WindRoseData {
  const directionBinSize = 360 / config.directionBins;
  const directionLabels = WIND_DIRECTIONS[config.directionBins as keyof typeof WIND_DIRECTIONS] || WIND_DIRECTIONS[16];
  
  // Filter data by season if specified
  let filteredData = windData.windData;
  if (season !== 'all') {
    filteredData = filterDataBySeason(windData.windData, season);
  }

  // Initialize direction bins
  const directionBins: DirectionBin[] = [];
  
  for (let i = 0; i < config.directionBins; i++) {
    const centerDirection = i * directionBinSize;
    const minDirection = centerDirection - directionBinSize / 2;
    const maxDirection = centerDirection + directionBinSize / 2;
    
    // Initialize speed bins for this direction
    const speedBins: SpeedBinData[] = config.speedBins.map(speedBin => ({
      speedRange: { min: speedBin.min, max: speedBin.max },
      frequency: 0,
      count: 0,
      averageSpeed: 0
    }));

    directionBins.push({
      direction: centerDirection,
      directionRange: { min: minDirection, max: maxDirection },
      label: directionLabels[i] || `${centerDirection}°`,
      speedBins,
      totalFrequency: 0,
      averageSpeed: 0,
      maxSpeed: 0
    });
  }

  // Process wind measurements
  let calmCount = 0;
  const totalCount = filteredData.length;

  filteredData.forEach(measurement => {
    if (measurement.windSpeed < config.calmThreshold) {
      calmCount++;
      return;
    }

    // Find direction bin
    const directionBinIndex = Math.floor(
      ((measurement.windDirection + directionBinSize / 2) % 360) / directionBinSize
    );
    const directionBin = directionBins[directionBinIndex];

    // Find speed bin
    const speedBinIndex = config.speedBins.findIndex(
      bin => measurement.windSpeed >= bin.min && measurement.windSpeed < bin.max
    );
    
    if (speedBinIndex >= 0) {
      const speedBin = directionBin.speedBins[speedBinIndex];
      speedBin.count++;
      speedBin.averageSpeed = (speedBin.averageSpeed * (speedBin.count - 1) + measurement.windSpeed) / speedBin.count;
    }

    // Update direction bin totals
    directionBin.averageSpeed = (directionBin.averageSpeed * directionBin.speedBins.reduce((sum, bin) => sum + bin.count - 1, 0) + measurement.windSpeed) / directionBin.speedBins.reduce((sum, bin) => sum + bin.count, 0);
    directionBin.maxSpeed = Math.max(directionBin.maxSpeed, measurement.windSpeed);
  });

  // Calculate frequencies
  directionBins.forEach(directionBin => {
    const totalBinCount = directionBin.speedBins.reduce((sum, bin) => sum + bin.count, 0);
    directionBin.totalFrequency = (totalBinCount / totalCount) * 100;
    
    directionBin.speedBins.forEach(speedBin => {
      speedBin.frequency = (speedBin.count / totalCount) * 100;
    });
  });

  return {
    directionBins,
    totalObservations: totalCount,
    calmPercentage: (calmCount / totalCount) * 100,
    config,
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: windData.dataSource,
      measurementHeight: windData.measurementHeight,
      location: windData.location,
      timeRange: windData.timeRange,
      qualityScore: windData.qualityMetrics.completeness
    }
  };
}

// Helper function to filter data by season
function filterDataBySeason(data: WindMeasurement[], season: string): WindMeasurement[] {
  if (season === 'all') return data;

  const seasonMonths: Record<string, number[]> = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
    winter: [12, 1, 2]
  };

  const months = seasonMonths[season];
  if (!months) return data;

  return data.filter(measurement => {
    const date = new Date(measurement.timestamp);
    return months.includes(date.getMonth() + 1);
  });
}

// Helper function to create Plotly traces for wind rose
function createWindRoseTraces(windRoseData: WindRoseData, showFrequency: boolean, showSpeed: boolean): any[] {
  const traces: any[] = [];

  windRoseData.config.speedBins.forEach((speedBin, speedIndex) => {
    const theta: number[] = [];
    const r: number[] = [];
    const text: string[] = [];
    const colors: string[] = [];

    windRoseData.directionBins.forEach(directionBin => {
      const speedBinData = directionBin.speedBins[speedIndex];
      if (speedBinData.count > 0) {
        theta.push(directionBin.direction);
        r.push(showFrequency ? speedBinData.frequency : speedBinData.averageSpeed);
        text.push(
          `Direction: ${directionBin.label}<br>` +
          `Speed: ${speedBin.label}<br>` +
          `Frequency: ${speedBinData.frequency.toFixed(1)}%<br>` +
          `Avg Speed: ${speedBinData.averageSpeed.toFixed(1)} m/s<br>` +
          `Count: ${speedBinData.count}`
        );
        colors.push(speedBin.color);
      }
    });

    if (theta.length > 0) {
      traces.push({
        type: 'scatterpolar',
        mode: 'markers',
        theta: theta,
        r: r,
        text: text,
        hovertemplate: '%{text}<extra></extra>',
        name: speedBin.label,
        marker: {
          color: speedBin.color,
          size: 8,
          opacity: 0.8
        },
        showlegend: true
      });
    }
  });

  return traces;
}

// Helper function to create Plotly layout for wind rose
function createWindRoseLayout(windRoseData: WindRoseData, config: WindRoseConfig, height: number): any {
  return {
    title: {
      text: config.title || 'Wind Rose Analysis',
      font: { size: 16 }
    },
    polar: {
      bgcolor: 'white',
      radialaxis: {
        title: 'Frequency (%)' + (config.showCalm ? ` | Calm: ${windRoseData.calmPercentage.toFixed(1)}%` : ''),
        angle: 90,
        tickangle: 90,
        range: [0, Math.max(...windRoseData.directionBins.map(bin => bin.totalFrequency)) * 1.1]
      },
      angularaxis: {
        theta0: 90,
        direction: 'clockwise',
        tickvals: Array.from({ length: config.directionBins }, (_, i) => i * (360 / config.directionBins)),
        ticktext: WIND_DIRECTIONS[config.directionBins as keyof typeof WIND_DIRECTIONS] || WIND_DIRECTIONS[16]
      }
    },
    height: height,
    margin: { t: 50, b: 50, l: 50, r: 50 },
    legend: {
      orientation: 'v',
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: '#E5E5E5',
      borderwidth: 1
    },
    font: { size: 12 }
  };
}

// Helper function to get direction label from degrees
function getDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return `${directions[index]} (${degrees.toFixed(0)}°)`;
}

export default WindRoseChart;