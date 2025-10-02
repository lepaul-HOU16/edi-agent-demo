import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  ProgressBar,
  Badge,
  Table,
  Box,
  ColumnLayout,
  KeyValuePairs,
  Alert,
  LineChart,
  BarChart,
  PieChart,
  Button,
  Select,
  Toggle
} from '@cloudscape-design/components';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface TurbinePosition {
  id: string;
  x: number;
  y: number;
  elevation: number;
  windSpeed: number;
  efficiency: number;
  status?: string;
}

interface SpacingAnalysis {
  averageSpacing: number;
  minimumSpacing: number;
  maximumSpacing: number;
  optimalSpacing: number;
  compliancePercentage: number;
}

interface CapacityCalculation {
  totalTurbines: number;
  turbineCapacity: number;
  totalCapacity: number;
  expectedAnnualOutput: number;
  capacityFactor: number;
}

interface WindFarmLayoutData {
  title?: string;
  subtitle?: string;
  targetCapacity?: string;
  turbineModel?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  layout?: {
    turbineCount?: string;
    spacing?: string;
    totalCapacity?: string;
    estimatedAEP?: string;
  };
  siteId?: string;
  siteName?: string;
  turbinePositions?: TurbinePosition[];
  spacingAnalysis?: SpacingAnalysis;
  capacityCalculation?: CapacityCalculation;
  layoutEfficiency?: number;
  wakeAnalysis?: {
    totalWakeLoss: number;
    averageWakeLoss: number;
    criticalInteractions: number;
  };
  complianceStatus?: {
    setbackCompliance: boolean;
    spacingCompliance: boolean;
    environmentalCompliance: boolean;
  };
  optimizationMetrics?: {
    energyYieldOptimization: number;
    wakeMinimization: number;
    spatialEfficiency: number;
  };
}

interface WindFarmLayoutComponentProps {
  data: WindFarmLayoutData;
}

// Safe number validation and conversion utility
const safeNumber = (value: any, fallback: number): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

// Safe coordinate validation
const validateCoordinates = (lat: any, lng: any): { lat: number; lng: number } => {
  const safeLat = safeNumber(lat, 32.7767);
  const safeLng = safeNumber(lng, -96.7970);
  
  // Validate coordinate ranges
  const validLat = Math.max(-90, Math.min(90, safeLat));
  const validLng = Math.max(-180, Math.min(180, safeLng));
  
  return { lat: validLat, lng: validLng };
};

// Mock data generators with stable seeding
const generateTurbinePositions = (count: number, centerLat: number, centerLng: number, seed: number = 42) => {
  const positions = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  const spacing = 0.002;
  
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    positions.push({
      id: `T${String(i + 1).padStart(3, '0')}`,
      x: safeNumber(centerLng + (col - gridSize/2) * spacing, -96.7970),
      y: safeNumber(centerLat + (row - gridSize/2) * spacing, 32.7767),
      elevation: safeNumber(150 + seededRandom() * 50, 150),
      windSpeed: safeNumber(7.5 + seededRandom() * 2, 8),
      efficiency: safeNumber(75 + seededRandom() * 20, 80),
      status: seededRandom() > 0.1 ? 'operational' : 'maintenance'
    });
  }
  return positions;
};

const generateSpacingData = (turbineCount: number, seed: number = 42) => {
  const spacings = [];
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  for (let i = 0; i < turbineCount - 1; i++) {
    spacings.push({
      turbineA: `T${String(i + 1).padStart(3, '0')}`,
      turbineB: `T${String(i + 2).padStart(3, '0')}`,
      distance: safeNumber(250 + seededRandom() * 100, 300),
      direction: safeNumber(seededRandom() * 360, 180),
      compliant: seededRandom() > 0.2
    });
  }
  return spacings;
};

const generateWindRoseData = (seed: number = 42) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  return directions.map(dir => ({
    direction: dir,
    frequency: safeNumber(seededRandom() * 20 + 5, 12),
    avgSpeed: safeNumber(seededRandom() * 5 + 8, 10)
  }));
};

const WindFarmLayoutComponent: React.FC<WindFarmLayoutComponentProps> = ({ data }) => {
  // UI State - Only controls what shows/hides in UI
  const [selectedView, setSelectedView] = useState('2d');
  const [showWindRose, setShowWindRose] = useState(true);
  const [showWakeAnalysis, setShowWakeAnalysis] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Map instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // AWS Location Service configuration
  const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const style = "Standard";
  
  // Check if we have the new simplified format or legacy detailed format
  const isSimplifiedFormat = !data.capacityCalculation && data.layout;
  
  // Validate and extract coordinates with proper error handling
  const safeCoordinates = useMemo(() => {
    try {
      return validateCoordinates(data.coordinates?.lat, data.coordinates?.lng);
    } catch (error) {
      console.warn('Invalid coordinates provided, using defaults:', error);
      return { lat: 32.7767, lng: -96.7970 };
    }
  }, [data.coordinates?.lat, data.coordinates?.lng]);
  
  // Generate turbine count with proper validation and clamping
  const turbineCount = useMemo(() => {
    try {
      const countStr = data.layout?.turbineCount?.toString() || '8';
      const numericOnly = countStr.replace(/[^\d]/g, '');
      const parsed = parseInt(numericOnly);
      const validated = !isNaN(parsed) && parsed > 0 ? parsed : 8;
      return Math.max(1, Math.min(validated, 50)); // Clamp between 1-50
    } catch (error) {
      console.warn('Invalid turbine count, using default:', error);
      return 8;
    }
  }, [data.layout?.turbineCount]);

  // Generate stable mock data using useMemo with consistent seed
  const mockTurbines = useMemo(() => {
    try {
      return generateTurbinePositions(turbineCount, safeCoordinates.lat, safeCoordinates.lng, 42);
    } catch (error) {
      console.warn('Error generating turbine positions:', error);
      return [];
    }
  }, [turbineCount, safeCoordinates.lat, safeCoordinates.lng]);

  const mockSpacingData = useMemo(() => {
    try {
      return generateSpacingData(turbineCount, 123);
    } catch (error) {
      console.warn('Error generating spacing data:', error);
      return [];
    }
  }, [turbineCount]);
  
  const windRoseData = useMemo(() => {
    try {
      return generateWindRoseData(456);
    } catch (error) {
      console.warn('Error generating wind rose data:', error);
      return [];
    }
  }, []);

  // Stable chart data with proper error handling
  const pieChartData = useMemo(() => {
    try {
      return windRoseData.map(item => ({ 
        title: item.direction || 'N', 
        value: Math.max(0, Math.round(safeNumber(item.frequency, 10) * 100) / 100)
      }));
    } catch (error) {
      console.warn('Error generating pie chart data:', error);
      return [{ title: 'N', value: 10 }];
    }
  }, [windRoseData]);

  const barChartSeries = useMemo(() => {
    try {
      return [{
        title: "Average Wind Speed",
        type: "bar" as const,
        data: windRoseData.map(item => ({ 
          x: item.direction || 'N', 
          y: Math.max(0, Math.round(safeNumber(item.avgSpeed, 8) * 100) / 100)
        }))
      }];
    } catch (error) {
      console.warn('Error generating bar chart data:', error);
      return [{ title: "Wind Speed", type: "bar" as const, data: [{ x: 'N', y: 8 }] }];
    }
  }, [windRoseData]);

  const lineChartSeries = useMemo(() => {
    try {
      return [{
        title: "Turbine Efficiency (%)",
        type: "line" as const,
        data: mockTurbines.slice(0, 12).map((t, i) => ({ 
          x: i, 
          y: Math.max(0, Math.min(100, Math.round(safeNumber(t.efficiency, 80) * 100) / 100))
        }))
      }];
    } catch (error) {
      console.warn('Error generating line chart data:', error);
      return [{ title: "Efficiency", type: "line" as const, data: [{ x: 0, y: 80 }] }];
    }
  }, [mockTurbines]);

  // Handle both simplified and detailed data formats with safe access
  const layoutOverviewItems = useMemo(() => {
    try {
      if (isSimplifiedFormat) {
        return [
          { label: 'Site Location', value: `${safeCoordinates.lat.toFixed(4)}, ${safeCoordinates.lng.toFixed(4)}` },
          { label: 'Target Capacity', value: data.targetCapacity || 'N/A' },
          { label: 'Turbine Model', value: data.turbineModel || 'N/A' },
          { label: 'Turbine Count', value: turbineCount.toString() },
          { label: 'Spacing', value: data.layout?.spacing || '9D x 3D' },
          { label: 'Total Capacity', value: data.layout?.totalCapacity || data.targetCapacity || 'TBD' },
          { label: 'Estimated AEP', value: data.layout?.estimatedAEP || 'TBD' }
        ];
      } else {
        return [
          { label: 'Site Name', value: data.siteName || 'N/A' },
          { label: 'Total Turbines', value: safeNumber(data.capacityCalculation?.totalTurbines, turbineCount).toString() },
          { label: 'Total Capacity', value: data.capacityCalculation?.totalCapacity ? `${safeNumber(data.capacityCalculation.totalCapacity, 30)} MW` : 'N/A' },
          { label: 'Layout Efficiency', value: data.layoutEfficiency ? `${safeNumber(data.layoutEfficiency, 85)}%` : 'N/A' },
          { label: 'Expected Annual Output', value: data.capacityCalculation?.expectedAnnualOutput ? `${safeNumber(data.capacityCalculation.expectedAnnualOutput, 100000).toLocaleString()} MWh` : 'N/A' },
          { label: 'Capacity Factor', value: data.capacityCalculation?.capacityFactor ? `${safeNumber(data.capacityCalculation.capacityFactor, 35)}%` : 'N/A' }
        ];
      }
    } catch (error) {
      console.warn('Error generating layout overview items:', error);
      return [{ label: 'Status', value: 'Data Error' }];
    }
  }, [isSimplifiedFormat, safeCoordinates, turbineCount, data]);

  // Simple view toggle handler - NO MAP OPERATIONS
  const handleViewToggle = useCallback((view: string) => {
    if (view === selectedView) return;
    
    setIsTransitioning(true);
    setSelectedView(view);
    
    // Simple map view change - just pitch adjustment
    if (mapInstanceRef.current && isMapReady) {
      try {
        if (view === '3d') {
          mapInstanceRef.current.easeTo({
            pitch: 45,
            bearing: 15,
            duration: 800
          });
        } else {
          mapInstanceRef.current.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 800
          });
        }
      } catch (error) {
        console.warn('View change failed:', error);
      }
    }
    
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [selectedView, isMapReady]);

  // Clean up function
  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (error) {
        console.warn('Map cleanup error:', error);
      }
      mapInstanceRef.current = null;
    }
    setIsMapReady(false);
    setMapError(null);
  }, []);

  // Simple map initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      setMapError(null);
      
      const mapColorScheme = 'Light';
      
      mapInstanceRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`,
        center: [safeCoordinates.lng, safeCoordinates.lat],
        zoom: 12,
        maxZoom: 18,
        minZoom: 8
      });

      mapInstanceRef.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map failed to load properly');
      });

      mapInstanceRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
      mapInstanceRef.current.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }), 'top-right');

      mapInstanceRef.current.on('load', () => {
        try {
          if (!mapInstanceRef.current) return;
          
          setIsMapReady(true);

          // Add simple turbine markers
          const validTurbines = mockTurbines.filter(turbine => {
            return typeof turbine.x === 'number' && typeof turbine.y === 'number' &&
                   !isNaN(turbine.x) && !isNaN(turbine.y) && 
                   isFinite(turbine.x) && isFinite(turbine.y);
          });

          if (validTurbines.length === 0) return;

          const turbineGeoJSON: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: validTurbines.map(turbine => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [safeNumber(turbine.x, safeCoordinates.lng), safeNumber(turbine.y, safeCoordinates.lat)]
              },
              properties: {
                id: turbine.id || 'T001',
                efficiency: safeNumber(turbine.efficiency, 80),
                windSpeed: safeNumber(turbine.windSpeed, 8),
                elevation: safeNumber(turbine.elevation, 150),
                status: turbine.status || 'operational'
              }
            }))
          };

          mapInstanceRef.current.addSource('turbines', {
            type: 'geojson',
            data: turbineGeoJSON
          });

          mapInstanceRef.current.addLayer({
            id: 'turbines-layer',
            type: 'circle',
            source: 'turbines',
            paint: {
              'circle-radius': 8,
              'circle-color': '#0073bb',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

          // Add click events
          mapInstanceRef.current.on('click', 'turbines-layer', (e) => {
            if (!e.features || e.features.length === 0) return;
            
            const coordinates = e.lngLat;
            const properties = e.features[0].properties;
            
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px;">${properties?.id || 'Turbine'}</h3>
                <div style="font-size: 12px;">
                  <p style="margin: 2px 0;"><strong>Efficiency:</strong> ${safeNumber(properties?.efficiency, 80).toFixed(1)}%</p>
                  <p style="margin: 2px 0;"><strong>Wind Speed:</strong> ${safeNumber(properties?.windSpeed, 8).toFixed(1)} m/s</p>
                  <p style="margin: 2px 0;"><strong>Elevation:</strong> ${safeNumber(properties?.elevation, 150).toFixed(1)} m</p>
                  <p style="margin: 2px 0;"><strong>Status:</strong> ${properties?.status || 'Operational'}</p>
                </div>
              </div>
            `;
            
            new maplibregl.Popup()
              .setLngLat(coordinates)
              .setDOMContent(popupContent)
              .addTo(mapInstanceRef.current!);
          });

          mapInstanceRef.current.on('mouseenter', 'turbines-layer', () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.getCanvas().style.cursor = 'pointer';
            }
          });

          mapInstanceRef.current.on('mouseleave', 'turbines-layer', () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.getCanvas().style.cursor = '';
            }
          });
          
        } catch (error) {
          console.error('Error during map load:', error);
          setMapError('Failed to initialize map features');
        }
      });

    } catch (error) {
      console.error('Failed to create map:', error);
      setMapError('Failed to create map instance');
    }

    return cleanupMap;
  }, [safeCoordinates.lat, safeCoordinates.lng, mockTurbines, cleanupMap]);

  // Interactive Layout Map Component - WITH CONTROLS IN HEADER
  const LayoutMapVisualization = () => (
    <Container>
      <Header 
        variant="h2"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Toggle
              onChange={({ detail }) => setShowWindRose(detail.checked)}
              checked={showWindRose}
            >
              Wind Rose
            </Toggle>
            <Toggle
              onChange={({ detail }) => setShowWakeAnalysis(detail.checked)}
              checked={showWakeAnalysis}
            >
              Wake Analysis
            </Toggle>
            <Select
              selectedOption={{ label: selectedView.toUpperCase(), value: selectedView }}
              onChange={({ detail }) => {
                if (detail.selectedOption) {
                  handleViewToggle(detail.selectedOption.value);
                }
              }}
              options={[
                { label: '2D', value: '2d' },
                { label: '3D', value: '3d' }
              ]}
              ariaLabel="View mode"
            />
          </div>
        }
      >
        Interactive Wind Farm Layout ({selectedView.toUpperCase()})
        {selectedView === '3d' && <Badge color="blue">3D Mode</Badge>}
        {isTransitioning && <Badge color="grey">Transitioning...</Badge>}
      </Header>
      
      <Box margin={{ top: 'l' }}>
        {mapError ? (
          <Alert
            statusIconAriaLabel="Error"
            type="error"
            header="Map Loading Error"
          >
            {mapError}. The map visualization is temporarily unavailable, but you can still view the turbine data in the tables below.
          </Alert>
        ) : (
          <div 
            ref={mapContainerRef}
            style={{ 
              height: '400px', 
              width: '100%', 
              border: '2px solid #e1e8ed',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}
          />
        )}
        
        {isTransitioning && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              textAlign: 'center',
              zIndex: 1000
            }}
          >
            <Badge color="blue">
              Transitioning to {selectedView.toUpperCase()} view...
            </Badge>
          </div>
        )}
      </Box>
      
      <Alert
        statusIconAriaLabel="Info"
        header="Wind Farm Site Details"
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="strong">📍 Location</Box>
            <Box variant="span">{safeCoordinates.lat.toFixed(4)}, {safeCoordinates.lng.toFixed(4)}</Box>
          </div>
          <div>
            <Box variant="strong">🌪️ Turbines</Box>
            <Box variant="span">{turbineCount} units</Box>
          </div>
          <div>
            <Box variant="strong">📏 Spacing</Box>
            <Box variant="span">{data.layout?.spacing || '9D x 3D'}</Box>
          </div>
          <div>
            <Box variant="strong">⚡ Capacity</Box>
            <Box variant="span">{data.layout?.totalCapacity || data.targetCapacity}</Box>
          </div>
        </ColumnLayout>
      </Alert>
    </Container>
  );

  const tabs = [
    {
      label: 'Layout Overview',
      id: 'overview',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <LayoutMapVisualization />
          
          <Container>
            <KeyValuePairs columns={2} items={layoutOverviewItems} />
          </Container>

          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="h3">Layout Efficiency</Box>
              <ProgressBar
                value={85}
                additionalInfo="85%"
                description="Optimized turbine placement efficiency"
              />
            </div>
            <div>
              <Box variant="h3">Wake Loss Minimization</Box>
              <ProgressBar
                value={92}
                additionalInfo="8% total wake loss"
                description="Reduced wake interference"
              />
            </div>
            <div>
              <Box variant="h3">Site Utilization</Box>
              <ProgressBar
                value={78}
                additionalInfo="78% of buildable area"
                description="Efficient land use"
              />
            </div>
          </ColumnLayout>

          {showWindRose && (
            <Container>
              <Header variant="h2">
                Wind Resource Analysis
                <Badge color="blue">Wind Rose Active</Badge>
              </Header>
              <ColumnLayout columns={2}>
                <div>
                  <PieChart
                    data={pieChartData}
                    ariaLabel="Wind direction frequency distribution"
                    size="medium"
                    hideFilter
                    i18nStrings={{
                      legendAriaLabel: "Legend",
                      chartAriaRoleDescription: "Pie chart showing wind direction distribution"
                    }}
                  />
                </div>
                <div>
                  <BarChart
                    series={barChartSeries}
                    xDomain={windRoseData.map(item => item.direction)}
                    yDomain={[0, 15]}
                    i18nStrings={{
                      legendAriaLabel: "Legend",
                      chartAriaRoleDescription: "Bar chart showing average wind speeds by direction",
                      xTickFormatter: (value) => value.toString(),
                      yTickFormatter: (value) => `${value} m/s`
                    }}
                    ariaLabel="Wind speed by direction"
                    height={200}
                  />
                </div>
              </ColumnLayout>
            </Container>
          )}

          {showWakeAnalysis && (
            <Container>
              <Header variant="h2">
                Wake Analysis
                <Badge color="green">Wake Analysis Active</Badge>
              </Header>
              <Alert
                statusIconAriaLabel="Info"
                header="Wake Effect Analysis"
              >
                <ColumnLayout columns={3} variant="text-grid">
                  <div>
                    <Box variant="strong">Total Wake Loss</Box>
                    <Box variant="span">8.2%</Box>
                  </div>
                  <div>
                    <Box variant="strong">Average Wake Loss</Box>
                    <Box variant="span">4.1%</Box>
                  </div>
                  <div>
                    <Box variant="strong">Critical Interactions</Box>
                    <Box variant="span">3 turbine pairs</Box>
                  </div>
                </ColumnLayout>
                <Box margin={{ top: 's' }}>
                  <p>Wake analysis shows minimal interference between turbines due to optimized spacing and prevailing wind direction alignment.</p>
                </Box>
              </Alert>
            </Container>
          )}

          {isSimplifiedFormat && (
            <Alert
              statusIconAriaLabel="Info"
              header="Wind Farm Layout Visualization"
            >
              The interactive map above shows the preliminary wind farm layout with turbine positions. 
              Each turbine marker can be clicked for detailed information about efficiency, wind speed, and operational status.
            </Alert>
          )}
        </SpaceBetween>
      )
    },
    {
      label: 'Turbine Positions',
      id: 'positions',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header 
              variant="h2"
              actions={
                <Button variant="primary" iconName="download">
                  Export Coordinates
                </Button>
              }
            >
              Turbine Position Analysis
            </Header>
            
            <ColumnLayout columns={2}>
              <div>
                <LineChart
                  series={lineChartSeries}
                  xDomain={mockTurbines.slice(0, 12).map((_, i) => i)}
                  yDomain={[60, 100]}
                  i18nStrings={{
                    legendAriaLabel: "Legend",
                    chartAriaRoleDescription: "Line chart showing turbine efficiency",
                    xTickFormatter: (value) => `T${Number(value)+1}`,
                    yTickFormatter: (value) => `${value}%`
                  }}
                  ariaLabel="Turbine efficiency chart"
                  height={250}
                />
              </div>
              <div>
                <BarChart
                  series={[{
                    title: "Wind Speed (m/s)",
                    type: "bar" as const,
                    data: mockTurbines.slice(0, 12).map((t, i) => ({ 
                      x: i, 
                      y: Math.max(0, Math.round(safeNumber(t.windSpeed, 8) * 100) / 100)
                    }))
                  }]}
                  xDomain={mockTurbines.slice(0, 12).map((_, i) => i)}
                  yDomain={[0, 12]}
                  i18nStrings={{
                    legendAriaLabel: "Legend",
                    chartAriaRoleDescription: "Bar chart showing wind speeds by turbine",
                    xTickFormatter: (value) => `T${Number(value)+1}`,
                    yTickFormatter: (value) => `${value} m/s`
                  }}
                  ariaLabel="Wind speed by turbine"
                  height={250}
                />
              </div>
            </ColumnLayout>
          </Container>
          
          <Container>
            <Table
              columnDefinitions={[
                {
                  id: 'id',
                  header: 'Turbine ID',
                  cell: (item: TurbinePosition) => item.id || 'N/A',
                  sortingField: 'id'
                },
                {
                  id: 'coordinates',
                  header: 'Coordinates',
                  cell: (item: TurbinePosition) => `${safeNumber(item.y, 0).toFixed(4)}, ${safeNumber(item.x, 0).toFixed(4)}`
                },
                {
                  id: 'elevation',
                  header: 'Elevation (m)',
                  cell: (item: TurbinePosition) => safeNumber(item.elevation, 0).toFixed(1)
                },
                {
                  id: 'windSpeed',
                  header: 'Wind Speed (m/s)',
                  cell: (item: TurbinePosition) => safeNumber(item.windSpeed, 0).toFixed(1)
                },
                {
                  id: 'efficiency',
                  header: 'Efficiency (%)',
                  cell: (item: TurbinePosition) => safeNumber(item.efficiency, 0).toFixed(1)
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (item: TurbinePosition) => (
                    <Badge color={item.status === 'operational' ? 'green' : 'grey'}>
                      {item.status || 'operational'}
                    </Badge>
                  )
                }
              ]}
              items={mockTurbines}
              loadingText="Loading turbine positions..."
              sortingDisabled={false}
              variant="borderless"
              stickyHeader
              header={
                <Header
                  counter={`(${mockTurbines.length})`}
                  description="Detailed position data for all turbines"
                >
                  Turbine Position Data
                </Header>
              }
            />
          </Container>
        </SpaceBetween>
      )
    },
    {
      label: 'Spacing Analysis',
      id: 'spacing',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Turbine Spacing Compliance</Header>
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="strong">Average Spacing</Box>
                <Box variant="span">
                  {mockSpacingData.length > 0 
                    ? `${(mockSpacingData.reduce((sum, item) => sum + safeNumber(item.distance, 300), 0) / mockSpacingData.length).toFixed(0)}m`
                    : '300m'
                  }
                </Box>
              </div>
              <div>
                <Box variant="strong">Minimum Spacing</Box>
                <Box variant="span">
                  {mockSpacingData.length > 0
                    ? `${Math.min(...mockSpacingData.map(item => safeNumber(item.distance, 300))).toFixed(0)}m`
                    : '250m'
                  }
                </Box>
              </div>
              <div>
                <Box variant="strong">Maximum Spacing</Box>
                <Box variant="span">
                  {mockSpacingData.length > 0
                    ? `${Math.max(...mockSpacingData.map(item => safeNumber(item.distance, 300))).toFixed(0)}m`
                    : '350m'
                  }
                </Box>
              </div>
              <div>
                <Box variant="strong">Compliance Rate</Box>
                <Box variant="span">
                  {mockSpacingData.length > 0
                    ? `${Math.round((mockSpacingData.filter(item => item.compliant).length / mockSpacingData.length) * 100)}%`
                    : '95%'
                  }
                </Box>
              </div>
            </ColumnLayout>
          </Container>
          
          <Container>
            <Table
              columnDefinitions={[
                {
                  id: 'turbineA',
                  header: 'From Turbine',
                  cell: (item: any) => item.turbineA || 'T001',
                  sortingField: 'turbineA'
                },
                {
                  id: 'turbineB',
                  header: 'To Turbine',
                  cell: (item: any) => item.turbineB || 'T002',
                  sortingField: 'turbineB'
                },
                {
                  id: 'distance',
                  header: 'Distance (m)',
                  cell: (item: any) => safeNumber(item.distance, 300).toFixed(1),
                  sortingField: 'distance'
                },
                {
                  id: 'direction',
                  header: 'Direction (°)',
                  cell: (item: any) => safeNumber(item.direction, 180).toFixed(1)
                },
                {
                  id: 'compliant',
                  header: 'Compliant',
                  cell: (item: any) => (
                    <Badge color={item.compliant ? 'green' : 'red'}>
                      {item.compliant ? 'Yes' : 'No'}
                    </Badge>
                  )
                }
              ]}
              items={mockSpacingData}
              loadingText="Loading spacing analysis..."
              sortingDisabled={false}
              variant="borderless"
              stickyHeader
              header={
                <Header
                  counter={`(${mockSpacingData.length})`}
                  description="Inter-turbine spacing measurements and compliance status"
                >
                  Spacing Measurements
                </Header>
              }
            />
          </Container>

          <Alert
            statusIconAriaLabel="Info"
            header="Spacing Requirements"
          >
            <p>
              Turbine spacing requirements are typically 3-5 rotor diameters (3D-5D) in the cross-wind direction 
              and 7-10 rotor diameters (7D-10D) in the prevailing wind direction to minimize wake effects 
              and maximize energy production.
            </p>
          </Alert>
        </SpaceBetween>
      )
    }
  ];

  return (
    <Container>
      <Header
        variant="h1"
        description={data.subtitle || "Interactive wind farm layout optimization and analysis"}
      >
        {data.title || 'Wind Farm Layout Analysis'}
      </Header>

      <Tabs
        tabs={tabs}
        ariaLabel="Wind farm layout analysis tabs"
      />
    </Container>
  );
};

export default WindFarmLayoutComponent;
