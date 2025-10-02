import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Container, 
  Header, 
  Grid, 
  Box, 
  SpaceBetween, 
  Badge,
  ColumnLayout,
  Tabs,
  Table,
  ProgressBar,
  Alert,
  Button,
  Toggle,
  Select,
  LineChart,
  BarChart
} from '@cloudscape-design/components';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WindFarmTerrainData {
  messageContentType: string;
  title: string;
  subtitle: string;
  analysisType: string;
  coordinates: { lat: number; lng: number };
  setbackDistance: number;
  exclusionZones: {
    water: boolean;
    buildings: boolean;
    roads: boolean;
    protected: boolean;
  };
  results: {
    buildableArea: string;
    majorConstraints: string[];
    recommendedSetbacks: number;
  };
}

interface WindFarmTerrainComponentProps {
  data: WindFarmTerrainData;
  onSendMessage?: (message: string) => void;
}

const WindFarmTerrainComponent: React.FC<WindFarmTerrainComponentProps> = ({ data, onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedView, setSelectedView] = useState('2d');
  const [showElevationData, setShowElevationData] = useState(true);
  const [showExclusionZones, setShowExclusionZones] = useState(true);
  const [showConstraints, setShowConstraints] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // AWS Location Service configuration
  const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const style = "Standard";

  // Generate mock elevation and terrain data
  const generateElevationData = () => {
    const points = [];
    const centerLat = data.coordinates.lat;
    const centerLng = data.coordinates.lng;
    const radius = 0.01; // Area radius in degrees
    
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const lat = centerLat + distance * Math.cos(angle);
      const lng = centerLng + distance * Math.sin(angle);
      
      points.push({
        lat,
        lng,
        elevation: 150 + Math.random() * 100, // Random elevation between 150-250m
        slope: Math.random() * 30, // Slope in degrees
        aspect: Math.random() * 360, // Aspect in degrees
        landCover: ['grassland', 'forest', 'agricultural', 'barren'][Math.floor(Math.random() * 4)]
      });
    }
    return points;
  };

  // Generate constraint areas
  const generateConstraintAreas = () => {
    const areas = [];
    const centerLat = data.coordinates.lat;
    const centerLng = data.coordinates.lng;
    
    const constraintTypes = ['water', 'buildings', 'roads', 'protected'];
    const constraintColors = ['#0066cc', '#8B4513', '#666666', '#228B22'];
    
    constraintTypes.forEach((type, index) => {
      if (data.exclusionZones[type as keyof typeof data.exclusionZones]) {
        const numAreas = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numAreas; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * 0.008;
          const lat = centerLat + distance * Math.cos(angle);
          const lng = centerLng + distance * Math.sin(angle);
          
          areas.push({
            type,
            center: [lng, lat],
            radius: 0.001 + Math.random() * 0.002,
            color: constraintColors[index],
            setback: data.setbackDistance
          });
        }
      }
    });
    return areas;
  };

  const mockElevationData = generateElevationData();
  const mockConstraintAreas = generateConstraintAreas();

  // Generate terrain analysis charts data
  const elevationHistogram = () => {
    const bins = [
      { range: '150-170m', count: mockElevationData.filter(p => p.elevation >= 150 && p.elevation < 170).length },
      { range: '170-190m', count: mockElevationData.filter(p => p.elevation >= 170 && p.elevation < 190).length },
      { range: '190-210m', count: mockElevationData.filter(p => p.elevation >= 190 && p.elevation < 210).length },
      { range: '210-230m', count: mockElevationData.filter(p => p.elevation >= 210 && p.elevation < 230).length },
      { range: '230-250m', count: mockElevationData.filter(p => p.elevation >= 230 && p.elevation <= 250).length }
    ];
    return bins;
  };

  const slopeDistribution = () => {
    const bins = [
      { range: '0-5°', count: mockElevationData.filter(p => p.slope >= 0 && p.slope < 5).length },
      { range: '5-10°', count: mockElevationData.filter(p => p.slope >= 5 && p.slope < 10).length },
      { range: '10-15°', count: mockElevationData.filter(p => p.slope >= 10 && p.slope < 15).length },
      { range: '15-20°', count: mockElevationData.filter(p => p.slope >= 15 && p.slope < 20).length },
      { range: '20+°', count: mockElevationData.filter(p => p.slope >= 20).length }
    ];
    return bins;
  };

  // Initialize the map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const mapColorScheme = 'Light';
      
      // Create map instance
      mapInstanceRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`,
        center: [data.coordinates.lng, data.coordinates.lat],
        zoom: 13,
      });

      // Add controls
      mapInstanceRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
      mapInstanceRef.current.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }), 'top-right');

      // Wait for map to load
      mapInstanceRef.current.on('load', () => {
        if (!mapInstanceRef.current) return;

        // Add site center marker
        mapInstanceRef.current!.addSource('site-center', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [data.coordinates.lng, data.coordinates.lat]
              },
              properties: {
                title: 'Wind Farm Site Center',
                description: 'Proposed wind farm location'
              }
            }]
          }
        });

        mapInstanceRef.current!.addLayer({
          id: 'site-center-layer',
          type: 'circle',
          source: 'site-center',
          paint: {
            'circle-radius': 8,
            'circle-color': '#ff6600',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9
          }
        });

        // Add site center label
        mapInstanceRef.current!.addLayer({
          id: 'site-center-label',
          type: 'symbol',
          source: 'site-center',
          layout: {
            'text-field': 'Site Center',
            'text-font': ['Open Sans Bold'],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 1]
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        });

        // Initialize overlays based on current toggle states
        if (showElevationData) {
          addElevationDataLayer();
        }
        if (showExclusionZones) {
          addExclusionZonesLayer();
        }
        if (showConstraints) {
          addConstraintsLayer();
        }

        // Add click event for site center
        mapInstanceRef.current!.on('click', 'site-center-layer', (e) => {
          const popupContent = document.createElement('div');
          popupContent.innerHTML = `
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #ff6600;">Wind Farm Site Center</h3>
              <div style="font-size: 12px; line-height: 1.4;">
                <p style="margin: 3px 0;"><strong>Coordinates:</strong> ${data.coordinates.lat.toFixed(6)}, ${data.coordinates.lng.toFixed(6)}</p>
                <p style="margin: 3px 0;"><strong>Setback Distance:</strong> ${data.setbackDistance}m</p>
                <p style="margin: 3px 0;"><strong>Buildable Area:</strong> ${data.results.buildableArea}</p>
                <p style="margin: 3px 0;"><strong>Major Constraints:</strong> ${data.results.majorConstraints.length}</p>
              </div>
            </div>
          `;
          
          new maplibregl.Popup()
            .setLngLat([data.coordinates.lng, data.coordinates.lat])
            .setDOMContent(popupContent)
            .addTo(mapInstanceRef.current!);
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data.coordinates]);

  // Function to safely execute map operations
  const safeMapOperation = (operation: () => void, retryCount = 0) => {
    if (!mapInstanceRef.current) {
      console.warn('Map instance not available');
      return;
    }

    if (mapInstanceRef.current.isStyleLoaded() && mapInstanceRef.current.loaded()) {
      try {
        operation();
      } catch (error) {
        console.error('Map operation failed:', error);
      }
    } else if (retryCount < 3) {
      const retryOperation = () => safeMapOperation(operation, retryCount + 1);
      
      if (!mapInstanceRef.current.isStyleLoaded()) {
        mapInstanceRef.current.once('styledata', retryOperation);
      } else if (!mapInstanceRef.current.loaded()) {
        mapInstanceRef.current.once('data', retryOperation);
      } else {
        setTimeout(retryOperation, 100);
      }
    } else {
      console.warn('Max retries reached for map operation');
    }
  };

  // Function to add elevation data layer
  const addElevationDataLayer = () => {
    safeMapOperation(() => {
      if (mapInstanceRef.current!.getSource('elevation-data')) return;

      const elevationGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: mockElevationData.map((point, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          properties: {
            id: `elev-${index}`,
            elevation: point.elevation,
            slope: point.slope,
            aspect: point.aspect,
            landCover: point.landCover
          }
        }))
      };

      mapInstanceRef.current!.addSource('elevation-data', {
        type: 'geojson',
        data: elevationGeoJSON
      });

      mapInstanceRef.current!.addLayer({
        id: 'elevation-points',
        type: 'circle',
        source: 'elevation-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'elevation'],
            150, 4,
            250, 8
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'elevation'],
            150, '#2E8B57',
            200, '#FFD700',
            250, '#FF6347'
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
    });
  };

  // Function to add exclusion zones layer
  const addExclusionZonesLayer = () => {
    safeMapOperation(() => {
      if (mapInstanceRef.current!.getSource('exclusion-zones')) return;

      const exclusionFeatures = mockConstraintAreas.map((area, index) => {
        const circle = [];
        const numPoints = 32;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const lng = area.center[0] + area.radius * Math.cos(angle);
          const lat = area.center[1] + area.radius * Math.sin(angle);
          circle.push([lng, lat]);
        }

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circle]
          },
          properties: {
            id: `zone-${index}`,
            type: area.type,
            setback: area.setback
          }
        };
      });

      const exclusionGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: exclusionFeatures
      };

      mapInstanceRef.current!.addSource('exclusion-zones', {
        type: 'geojson',
        data: exclusionGeoJSON
      });

      mapInstanceRef.current!.addLayer({
        id: 'exclusion-zones-layer',
        type: 'fill',
        source: 'exclusion-zones',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'type'], 'water'], '#0066cc',
            ['==', ['get', 'type'], 'buildings'], '#8B4513',
            ['==', ['get', 'type'], 'roads'], '#666666',
            ['==', ['get', 'type'], 'protected'], '#228B22',
            '#ff0000'
          ],
          'fill-opacity': 0.3
        }
      });

      mapInstanceRef.current!.addLayer({
        id: 'exclusion-zones-outline',
        type: 'line',
        source: 'exclusion-zones',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'type'], 'water'], '#0066cc',
            ['==', ['get', 'type'], 'buildings'], '#8B4513',
            ['==', ['get', 'type'], 'roads'], '#666666',
            ['==', ['get', 'type'], 'protected'], '#228B22',
            '#ff0000'
          ],
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    });
  };

  // Function to add constraints layer
  const addConstraintsLayer = () => {
    safeMapOperation(() => {
      if (mapInstanceRef.current!.getSource('constraints')) return;

      // Create constraint visualization as buffer zones around exclusion areas
      const constraintFeatures = mockConstraintAreas.map((area, index) => {
        const bufferRadius = area.radius + 0.001; // Add buffer for setback
        const circle = [];
        const numPoints = 32;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const lng = area.center[0] + bufferRadius * Math.cos(angle);
          const lat = area.center[1] + bufferRadius * Math.sin(angle);
          circle.push([lng, lat]);
        }

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circle]
          },
          properties: {
            id: `constraint-${index}`,
            type: area.type,
            setback: area.setback,
            severity: 'medium'
          }
        };
      });

      const constraintsGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: constraintFeatures
      };

      mapInstanceRef.current!.addSource('constraints', {
        type: 'geojson',
        data: constraintsGeoJSON
      });

      mapInstanceRef.current!.addLayer({
        id: 'constraints-layer',
        type: 'line',
        source: 'constraints',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 2,
          'line-dasharray': [3, 3],
          'line-opacity': 0.8
        }
      });
    });
  };

  // Function to add 3D terrain layer
  const add3DTerrainLayer = () => {
    safeMapOperation(() => {
      if (mapInstanceRef.current!.getSource('terrain-3d')) return;

      // Create 3D terrain representation using elevation data
      const terrain3DFeatures = mockElevationData.map((point, index) => {
        const radius = 0.0005;
        const circle = [];
        const numPoints = 8;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const lng = point.lng + radius * Math.cos(angle);
          const lat = point.lat + radius * Math.sin(angle);
          circle.push([lng, lat]);
        }

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circle]
          },
          properties: {
            id: `terrain-${index}`,
            elevation: point.elevation,
            slope: point.slope,
            height: point.elevation,
            baseHeight: 0
          }
        };
      });

      const terrain3DGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: terrain3DFeatures
      };

      mapInstanceRef.current!.addSource('terrain-3d', {
        type: 'geojson',
        data: terrain3DGeoJSON
      });

      mapInstanceRef.current!.addLayer({
        id: 'terrain-3d-layer',
        type: 'fill-extrusion',
        source: 'terrain-3d',
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'elevation'],
            150, '#2E8B57',
            200, '#FFD700',
            250, '#FF6347'
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'baseHeight'],
          'fill-extrusion-opacity': 0.8
        }
      });
    });
  };

  // Update layers when toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (showElevationData) {
      safeMapOperation(() => {
        if (!mapInstanceRef.current!.getLayer('elevation-points')) {
          addElevationDataLayer();
        } else {
          mapInstanceRef.current!.setLayoutProperty('elevation-points', 'visibility', 'visible');
        }
      });
    } else {
      safeMapOperation(() => {
        if (mapInstanceRef.current!.getLayer('elevation-points')) {
          mapInstanceRef.current!.setLayoutProperty('elevation-points', 'visibility', 'none');
        }
      });
    }
  }, [showElevationData]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (showExclusionZones) {
      safeMapOperation(() => {
        if (!mapInstanceRef.current!.getLayer('exclusion-zones-layer')) {
          addExclusionZonesLayer();
        } else {
          mapInstanceRef.current!.setLayoutProperty('exclusion-zones-layer', 'visibility', 'visible');
          mapInstanceRef.current!.setLayoutProperty('exclusion-zones-outline', 'visibility', 'visible');
        }
      });
    } else {
      safeMapOperation(() => {
        if (mapInstanceRef.current!.getLayer('exclusion-zones-layer')) {
          mapInstanceRef.current!.setLayoutProperty('exclusion-zones-layer', 'visibility', 'none');
          mapInstanceRef.current!.setLayoutProperty('exclusion-zones-outline', 'visibility', 'none');
        }
      });
    }
  }, [showExclusionZones]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (showConstraints) {
      safeMapOperation(() => {
        if (!mapInstanceRef.current!.getLayer('constraints-layer')) {
          addConstraintsLayer();
        } else {
          mapInstanceRef.current!.setLayoutProperty('constraints-layer', 'visibility', 'visible');
        }
      });
    } else {
      safeMapOperation(() => {
        if (mapInstanceRef.current!.getLayer('constraints-layer')) {
          mapInstanceRef.current!.setLayoutProperty('constraints-layer', 'visibility', 'none');
        }
      });
    }
  }, [showConstraints]);

  // Interactive Terrain Map Component
  const TerrainMapVisualization = () => (
    <Container>
      <Header 
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="s" alignItems="center">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>View:</span>
              <Select
                selectedOption={{ label: selectedView === '2d' ? '2D Terrain' : '3D Terrain', value: selectedView }}
                onChange={({ detail }) => {
                  const newView = detail.selectedOption.value;
                  if (newView !== selectedView) {
                    setIsTransitioning(true);
                    setSelectedView(newView);
                    
                    if (mapInstanceRef.current) {
                      safeMapOperation(() => {
                        if (newView === '3d') {
                          // Transition to 3D view
                          mapInstanceRef.current!.easeTo({
                            pitch: 45,
                            bearing: 20,
                            zoom: mapInstanceRef.current!.getZoom() + 0.5,
                            duration: 1500
                          });
                          
                          // Add 3D terrain representations
                          add3DTerrainLayer();
                        } else {
                          // Transition back to 2D view
                          mapInstanceRef.current!.easeTo({
                            pitch: 0,
                            bearing: 0,
                            duration: 1500
                          });
                          
                          // Remove 3D terrain layer
                          if (mapInstanceRef.current!.getLayer('terrain-3d-layer')) {
                            mapInstanceRef.current!.removeLayer('terrain-3d-layer');
                          }
                          if (mapInstanceRef.current!.getSource('terrain-3d')) {
                            mapInstanceRef.current!.removeSource('terrain-3d');
                          }
                        }
                        
                        setTimeout(() => setIsTransitioning(false), 1600);
                      });
                    }
                  }
                }}
                options={[
                  { label: '2D Terrain', value: '2d' },
                  { label: '3D Terrain', value: '3d' }
                ]}
                triggerVariant="option"
                disabled={isTransitioning}
              />
            </div>
            <Toggle
              onChange={({ detail }) => setShowElevationData(detail.checked)}
              checked={showElevationData}
            >
              Elevation Data
            </Toggle>
            <Toggle
              onChange={({ detail }) => setShowExclusionZones(detail.checked)}
              checked={showExclusionZones}
            >
              Exclusion Zones
            </Toggle>
            <Toggle
              onChange={({ detail }) => setShowConstraints(detail.checked)}
              checked={showConstraints}
            >
              Constraints
            </Toggle>
          </SpaceBetween>
        }
      >
        Interactive Terrain Analysis ({selectedView.toUpperCase()})
      </Header>
      
      <Box margin={{ top: 'l' }}>
        <div 
          ref={mapContainerRef}
          style={{ 
            height: '500px', 
            width: '100%', 
            border: '2px solid #e1e8ed',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}
        />
        
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
              Transitioning to {selectedView.toUpperCase()} terrain view...
            </Badge>
          </div>
        )}
      </Box>
      
      {/* Terrain Analysis Charts */}
      <ColumnLayout columns={2}>
        <div>
          <Header variant="h3">Elevation Distribution</Header>
          <BarChart
            series={[{
              title: "Points Count",
              type: "bar",
              data: elevationHistogram().map(bin => ({ x: bin.range, y: bin.count }))
            }]}
            xDomain={elevationHistogram().map(bin => bin.range)}
            yDomain={[0, Math.max(...elevationHistogram().map(bin => bin.count)) + 2]}
            i18nStrings={{
              legendAriaLabel: "Legend",
              chartAriaRoleDescription: "Bar chart showing elevation distribution",
              xTickFormatter: (value) => value.toString(),
              yTickFormatter: (value) => `${value} points`
            }}
            ariaLabel="Elevation distribution chart"
            height={200}
          />
        </div>
        
        <div>
          <Header variant="h3">Slope Analysis</Header>
          <BarChart
            series={[{
              title: "Slope Distribution",
              type: "bar",
              data: slopeDistribution().map(bin => ({ x: bin.range, y: bin.count }))
            }]}
            xDomain={slopeDistribution().map(bin => bin.range)}
            yDomain={[0, Math.max(...slopeDistribution().map(bin => bin.count)) + 2]}
            i18nStrings={{
              legendAriaLabel: "Legend",
              chartAriaRoleDescription: "Bar chart showing slope distribution",
              xTickFormatter: (value) => value.toString(),
              yTickFormatter: (value) => `${value} points`
            }}
            ariaLabel="Slope distribution chart"
            height={200}
          />
        </div>
      </ColumnLayout>

      {/* Site Information Overlay */}
      <Alert
        statusIconAriaLabel="Info"
        header="Terrain Analysis Results"
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="strong">📍 Site Location</Box>
            <Box variant="span">{data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}</Box>
          </div>
          <div>
            <Box variant="strong">📊 Data Points</Box>
            <Box variant="span">{mockElevationData.length} elevation readings</Box>
          </div>
          <div>
            <Box variant="strong">🚫 Exclusion Zones</Box>
            <Box variant="span">{mockConstraintAreas.length} identified</Box>
          </div>
          <div>
            <Box variant="strong">⚠️ Constraints</Box>
            <Box variant="span">{data.results.majorConstraints.length} major issues</Box>
          </div>
        </ColumnLayout>
      </Alert>
    </Container>
  );

  const exclusionZoneItems = [
    {
      zone: 'Water Bodies',
      status: data.exclusionZones.water ? 'Active' : 'Inactive',
      setback: `${data.setbackDistance}m`,
      risk: 'High'
    },
    {
      zone: 'Buildings & Structures',
      status: data.exclusionZones.buildings ? 'Active' : 'Inactive', 
      setback: `${data.setbackDistance}m`,
      risk: 'High'
    },
    {
      zone: 'Roads & Infrastructure',
      status: data.exclusionZones.roads ? 'Active' : 'Inactive',
      setback: `${data.setbackDistance}m`,
      risk: 'Medium'
    },
    {
      zone: 'Protected Areas',
      status: data.exclusionZones.protected ? 'Active' : 'Inactive',
      setback: `${data.setbackDistance}m`,
      risk: 'High'
    }
  ];

  const constraintItems = data.results.majorConstraints.map((constraint, index) => ({
    id: index + 1,
    constraint,
    impact: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
    mitigation: 'Increase setback distance'
  }));

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="blue">Terrain Analysis</Badge>
              <Badge color="green">Coordinates: {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}</Badge>
            </SpaceBetween>
          }
        >
          {data.title}
        </Header>
      }
    >
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={[
          {
            label: "Site Overview",
            id: "overview",
            content: (
              <SpaceBetween direction="vertical" size="l">
                <TerrainMapVisualization />
                
                <ColumnLayout columns={2} variant="text-grid">
                  <div>
                    <Box variant="awsui-key-label">Location Coordinates</Box>
                    <Box>
                      <SpaceBetween direction="horizontal" size="s">
                        <Badge>{data.coordinates.lat.toFixed(6)}°N</Badge>
                        <Badge>{data.coordinates.lng.toFixed(6)}°W</Badge>
                      </SpaceBetween>
                    </Box>
                  </div>
                  
                  <div>
                    <Box variant="awsui-key-label">Setback Distance</Box>
                    <Box>
                      <Badge color="blue">{data.setbackDistance}m minimum</Badge>
                    </Box>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Analysis Status</Box>
                    <Box>
                      <Badge color="green">Complete</Badge>
                    </Box>
                  </div>

                  <div>
                    <Box variant="awsui-key-label">Buildable Area</Box>
                    <Box>
                      <Badge color={data.results.buildableArea.includes('TBD') ? 'grey' : 'green'}>
                        {data.results.buildableArea}
                      </Badge>
                    </Box>
                  </div>
                </ColumnLayout>

                {data.results.buildableArea.includes('TBD') && (
                  <Alert type="info" header="Analysis in Progress">
                    Detailed terrain analysis tools are being implemented. This will provide:
                    <ul>
                      <li>Precise buildable area calculations</li>
                      <li>Interactive exclusion zone mapping</li>
                      <li>Topographical constraint analysis</li>
                      <li>Wind resource assessment integration</li>
                    </ul>
                  </Alert>
                )}

                <ColumnLayout columns={2}>
                  <div>
                    <Header variant="h3">Site Suitability</Header>
                    <SpaceBetween direction="vertical" size="s">
                      <div>
                        <Box variant="small">Overall Rating</Box>
                        <ProgressBar 
                          value={75} 
                          additionalInfo="Good for wind development"
                          description="Based on initial assessment"
                        />
                      </div>
                      <div>
                        <Box variant="small">Constraint Complexity</Box>
                        <ProgressBar 
                          value={45} 
                          additionalInfo="Moderate constraints"
                          variant="flash"
                        />
                      </div>
                    </SpaceBetween>
                  </div>

                  <div>
                    <Header variant="h3">Risk Assessment</Header>
                    <SpaceBetween direction="vertical" size="s">
                      <div>
                        <Box variant="small">Environmental Risk</Box>
                        <ProgressBar 
                          value={30} 
                          additionalInfo="Low risk"
                        />
                      </div>
                      <div>
                        <Box variant="small">Development Complexity</Box>
                        <ProgressBar 
                          value={55} 
                          additionalInfo="Medium complexity"
                        />
                      </div>
                    </SpaceBetween>
                  </div>
                </ColumnLayout>
              </SpaceBetween>
            )
          },
          {
            label: "Exclusion Zones",
            id: "exclusions",
            content: (
              <SpaceBetween direction="vertical" size="l">
                <Table
                  columnDefinitions={[
                    {
                      id: "zone",
                      header: "Exclusion Zone Type",
                      cell: item => item.zone,
                      sortingField: "zone"
                    },
                    {
                      id: "status", 
                      header: "Status",
                      cell: item => (
                        <Badge color={item.status === 'Active' ? 'red' : 'grey'}>
                          {item.status}
                        </Badge>
                      )
                    },
                    {
                      id: "setback",
                      header: "Setback Distance",
                      cell: item => item.setback
                    },
                    {
                      id: "risk",
                      header: "Risk Level", 
                      cell: item => (
                        <Badge 
                          color={item.risk === 'High' ? 'red' : item.risk === 'Medium' ? 'blue' : 'green'}
                        >
                          {item.risk}
                        </Badge>
                      )
                    }
                  ]}
                  items={exclusionZoneItems}
                  loadingText="Loading exclusion zones"
                  sortingDisabled
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No exclusion zones configured</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        All areas are available for development.
                      </Box>
                    </Box>
                  }
                  header={
                    <Header
                      counter={`(${exclusionZoneItems.length})`}
                      description="Zones where turbine placement is restricted or prohibited"
                    >
                      Active Exclusion Zones
                    </Header>
                  }
                />
              </SpaceBetween>
            )
          },
          {
            label: "Constraints",
            id: "constraints", 
            content: (
              <SpaceBetween direction="vertical" size="l">
                <Table
                  columnDefinitions={[
                    {
                      id: "constraint",
                      header: "Major Constraint",
                      cell: item => item.constraint,
                      sortingField: "constraint"
                    },
                    {
                      id: "impact",
                      header: "Impact Level",
                      cell: item => (
                        <Badge 
                          color={item.impact === 'High' ? 'red' : item.impact === 'Medium' ? 'blue' : 'green'}
                        >
                          {item.impact}
                        </Badge>
                      )
                    },
                    {
                      id: "mitigation",
                      header: "Mitigation Strategy",
                      cell: item => item.mitigation
                    }
                  ]}
                  items={constraintItems}
                  loadingText="Loading constraints"
                  sortingDisabled
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No major constraints identified</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        Site appears suitable for wind farm development.
                      </Box>
                    </Box>
                  }
                  header={
                    <Header
                      counter={`(${constraintItems.length})`}
                      description="Identified constraints that may impact turbine placement"
                    >
                      Site Constraints
                    </Header>
                  }
                />

                <Alert type="info" header="Next Steps in Wind Farm Development">
                  <SpaceBetween direction="vertical" size="m">
                    <div>Based on this terrain analysis, you can proceed with the following workflow steps:</div>
                    
                    <SpaceBetween direction="vertical" size="s">
                      <Box>
                        <SpaceBetween direction="horizontal" size="s" alignItems="start">
                          <Button
                            variant="primary"
                            iconName="add-plus"
                            onClick={() => {
                              if (onSendMessage) {
                                const message = `Design optimal wind farm layout for ${data.results.buildableArea} buildable area at coordinates ${data.coordinates.lat}, ${data.coordinates.lng} with constraints: ${data.results.majorConstraints.join(', ')}`;
                                onSendMessage(message);
                              }
                            }}
                          >
                            Start Layout Design
                          </Button>
                          <Box>
                            <Box variant="strong">Wind Farm Layout Design</Box>
                            <Box variant="small" color="text-body-secondary">
                              Optimize turbine placement within buildable areas using identified constraints
                            </Box>
                          </Box>
                        </SpaceBetween>
                      </Box>

                      <Box>
                        <SpaceBetween direction="horizontal" size="s" alignItems="start">
                          <Button
                            variant="normal"
                            iconName="search"
                            onClick={() => {
                              if (onSendMessage) {
                                const message = `Request detailed site survey for wind farm at coordinates ${data.coordinates.lat}, ${data.coordinates.lng} to verify terrain constraints and ground conditions`;
                                onSendMessage(message);
                              }
                            }}
                          >
                            Request Site Survey
                          </Button>
                          <Box>
                            <Box variant="strong">Detailed Site Survey</Box>
                            <Box variant="small" color="text-body-secondary">
                              Conduct on-ground verification of terrain constraints and conditions
                            </Box>
                          </Box>
                        </SpaceBetween>
                      </Box>

                      <Box>
                        <SpaceBetween direction="horizontal" size="s" alignItems="start">
                          <Button
                            variant="normal"
                            iconName="status-info"
                            onClick={() => {
                              if (onSendMessage) {
                                const message = `Begin environmental assessment for wind farm development at coordinates ${data.coordinates.lat}, ${data.coordinates.lng} including ecological impact and permit requirements`;
                                onSendMessage(message);
                              }
                            }}
                          >
                            Begin Environmental Assessment
                          </Button>
                          <Box>
                            <Box variant="strong">Environmental Assessment</Box>
                            <Box variant="small" color="text-body-secondary">
                              Evaluate ecological impact, wildlife studies, and permit requirements
                            </Box>
                          </Box>
                        </SpaceBetween>
                      </Box>

                      <Box>
                        <SpaceBetween direction="horizontal" size="s" alignItems="start">
                          <Button
                            variant="normal"
                            iconName="notification"
                            onClick={() => {
                              if (onSendMessage) {
                                const message = `Analyze wind resource patterns and energy generation potential for site at coordinates ${data.coordinates.lat}, ${data.coordinates.lng} with ${data.results.buildableArea} buildable area`;
                                onSendMessage(message);
                              }
                            }}
                          >
                            Analyze Wind Resources
                          </Button>
                          <Box>
                            <Box variant="strong">Wind Resource Analysis</Box>
                            <Box variant="small" color="text-body-secondary">
                              Assess wind patterns, speeds, and energy generation potential
                            </Box>
                          </Box>
                        </SpaceBetween>
                      </Box>
                    </SpaceBetween>

                    <Alert type="success" header="Interactive Workflow">
                      Click any button above to automatically trigger the next step in your wind farm development workflow. 
                      The system will use the terrain analysis results to inform subsequent analyses.
                    </Alert>
                  </SpaceBetween>
                </Alert>
              </SpaceBetween>
            )
          }
        ]}
      />
    </Container>
  );
};

export default WindFarmTerrainComponent;
