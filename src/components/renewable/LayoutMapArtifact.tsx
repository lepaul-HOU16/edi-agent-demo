/**
 * LayoutMapArtifact Component
 * 
 * Renders wind farm layout artifacts from the renewable energy backend.
 * Displays interactive Leaflet maps with turbine positions and layout metrics.
 */

import React, { useEffect, useRef } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout } from '@cloudscape-design/components';
import 'leaflet/dist/leaflet.css';
import { ActionButtons } from './ActionButtons';

interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}

interface LayoutArtifactProps {
  data: {
    messageContentType: 'wind_farm_layout';
    title: string;
    subtitle?: string;
    projectId: string;
    turbineCount: number;
    totalCapacity: number;
    turbinePositions: Array<{
      lat: number;
      lng: number;
      id?: string;
    }>;
    mapHtml?: string;
    mapUrl?: string;
    geojson?: any;
    layoutType?: string;
    windAngle?: number;
    spacing?: {
      downwind: number;
      crosswind: number;
    };
    // Enhanced visualization data
    visualizations?: {
      interactive_map?: string;
      validation_chart?: string;
      spacing_analysis?: string;
    };
    s3Url?: string;
  };
  actions?: ActionButton[];  // Contextual action buttons from orchestrator
  onFollowUpAction?: (action: string) => void;
}

const LayoutMapArtifact: React.FC<LayoutArtifactProps> = ({ data, actions, onFollowUpAction }) => {
  const handleActionClick = (query: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(query);
    }
  };
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef<boolean>(false); // Prevent multiple initializations

  // Debug logging to track renders
  console.log('🗺️ LayoutMapArtifact RENDER:', {
    projectId: data.projectId,
    turbineCount: data.turbineCount,
    hasMapHtml: !!data.mapHtml,
    hasGeojson: !!data.geojson,
    timestamp: new Date().toISOString()
  });

  // Initialize Leaflet map with turbine layout
  useEffect(() => {
    console.log('[LayoutMap] useEffect triggered', {
      hasMapRef: !!mapRef.current,
      hasGeojson: !!data.geojson,
      geojsonFeatureCount: data.geojson?.features?.length || 0,
      projectId: data.projectId
    });

    if (!mapRef.current) {
      console.error('[LayoutMap] mapRef.current is null, cannot initialize map');
      return;
    }

    if (!data.geojson) {
      console.error('[LayoutMap] data.geojson is missing, cannot initialize map');
      return;
    }

    // If map already exists or is being initialized, don't recreate it
    if (mapInstanceRef.current || initializingRef.current) {
      console.log('Layout map already exists or is initializing, skipping re-initialization');
      return;
    }

    console.log('[LayoutMap] Starting map initialization for project:', data.projectId);
    initializingRef.current = true; // Mark as initializing

    // Clear container completely
    mapRef.current.innerHTML = '';
    (mapRef.current as any)._leaflet_id = undefined;

    // Reduce delay to minimize chance of unmount before initialization
    const timer = setTimeout(() => {
      console.log('[LayoutMap] Timer fired, checking mapRef...');
      if (!mapRef.current) {
        console.error('[LayoutMap] mapRef.current is null after timer!');
        return;
      }

      console.log('[LayoutMap] Starting Leaflet import...');
      // Dynamically import Leaflet
      import('leaflet').then((L) => {
      console.log('[LayoutMap] Leaflet imported successfully');
      if (!mapRef.current) {
        console.error('[LayoutMap] mapRef.current is null after Leaflet import!');
        return;
      }

      // Fix Leaflet default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Calculate center from turbine positions or use first turbine
      let centerLat = 0;
      let centerLng = 0;
      
      console.log('[LayoutMap] GeoJSON features count:', data.geojson.features?.length || 0);
      
      if (data.geojson.features && data.geojson.features.length > 0) {
        const firstTurbine = data.geojson.features[0];
        centerLat = firstTurbine.geometry.coordinates[1];
        centerLng = firstTurbine.geometry.coordinates[0];
        console.log('[LayoutMap] Map center:', { centerLat, centerLng });
      } else {
        console.error('[LayoutMap] No features in geojson!');
        initializingRef.current = false;
        return;
      }

      // Check container dimensions
      const rect = mapRef.current.getBoundingClientRect();
      console.log('[LayoutMap] Container dimensions:', {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      });

      if (rect.width === 0 || rect.height === 0) {
        console.error('[LayoutMap] Container has no dimensions! Map cannot initialize.');
        initializingRef.current = false;
        return;
      }

      // Create map with all interactions enabled
      let map;
      try {
        map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: 13,
          dragging: true,
          touchZoom: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          zoomControl: true,
          attributionControl: true,
        });

        mapInstanceRef.current = map;
        initializingRef.current = false; // Initialization complete
        console.log('[LayoutMap] Map initialization complete');
      } catch (error) {
        console.error('[LayoutMap] Error creating map:', error);
        initializingRef.current = false;
        return;
      }

      // Explicitly enable dragging (force it)
      if (map.dragging) {
        map.dragging.enable();
      }

      // Add satellite basemap
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri',
          maxZoom: 19,
        }
      );

      // Add OpenStreetMap tiles
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      // Add satellite as default
      satelliteLayer.addTo(map);

      // Add layer control
      L.control.layers(
        {
          'Satellite': satelliteLayer,
          'Street Map': osmLayer,
        },
        {},
        { position: 'topright' }
      ).addTo(map);

      // Add turbine markers using default Leaflet markers (matches Folium/notebook style)
      const markers: any[] = [];
      data.geojson.features.forEach((feature: any, index: number) => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties || {};
        
        // Use default Leaflet marker (blue teardrop) to match notebook visualization
        const marker = L.marker([coords[1], coords[0]])
          .addTo(map)
          .bindPopup(`
            <div style="
              min-width: 200px;
              padding: 12px;
              font-family: 'Amazon Ember', Arial, sans-serif;
            ">
              <div style="font-size: 16px; font-weight: bold; color: #0972d3; margin-bottom: 8px;">
                ${props.turbine_id || `Turbine ${index + 1}`}
              </div>
              <div style="font-size: 13px; color: #545b64;">
                <strong>Capacity:</strong> ${props.capacity_MW || 2.5} MW<br/>
                <strong>Hub Height:</strong> ${props.hub_height_m || 80}m<br/>
                <strong>Rotor Diameter:</strong> ${props.rotor_diameter_m || 100}m<br/>
                <strong>Position:</strong> ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}
              </div>
            </div>
          `, {
            maxWidth: 300,
            className: 'custom-popup'
          });
        
        markers.push(marker);
      });

      // Fit bounds to show all turbines
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

      // Invalidate size after a short delay
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 100);
      }).catch((error) => {
        console.error('[LayoutMap] Error importing Leaflet:', error);
        initializingRef.current = false;
      });
    }, 10); // Reduced delay to 10ms to minimize unmount risk

    return () => {
      console.log('[LayoutMap] Cleanup function called');
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        console.log('[LayoutMap] Removing existing map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initializingRef.current = false; // Reset initialization flag on cleanup
    };
  }, [data.projectId]); // Only depend on projectId to prevent re-renders

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="blue">{data.turbineCount} Turbines</Badge>
              <Badge color="green">{data.totalCapacity} MW</Badge>
            </SpaceBetween>
          }
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Contextual Action Buttons */}
        {actions && actions.length > 0 && (
          <ActionButtons 
            actions={actions} 
            onActionClick={handleActionClick}
          />
        )}
        
        {/* Layout Information */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Turbine Count</Box>
            <div>{data.turbineCount}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Capacity</Box>
            <div>{data.totalCapacity} MW</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Layout Type</Box>
            <div>{data.layoutType || 'Optimized'}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Wind Angle</Box>
            <div>{data.windAngle !== undefined ? `${data.windAngle}°` : 'N/A'}</div>
          </div>
        </ColumnLayout>

        {/* Spacing Information (if available) */}
        {data.spacing && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Turbine Spacing
            </Box>
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="small">Downwind</Box>
                <div>{data.spacing.downwind}D</div>
              </div>
              <div>
                <Box variant="small">Crosswind</Box>
                <div>{data.spacing.crosswind}D</div>
              </div>
            </ColumnLayout>
          </Box>
        )}

        {/* Interactive Layout Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Farm Layout Map
          </Box>
          {/* Always use Leaflet map for now (S3 iframe has access issues) */}
          {data.geojson && data.geojson.features && data.geojson.features.length > 0 ? (
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '500px',
                border: '1px solid #e9ebed',
                borderRadius: '4px',
                position: 'relative',
                zIndex: 0,
                cursor: 'grab',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9f9f9',
                border: '1px dashed #ccc',
                borderRadius: '4px',
              }}
            >
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  📍 Layout Map
                </div>
                <div style={{ fontSize: '14px' }}>
                  No turbine layout data available
                </div>
              </div>
            </div>
          )}
        </Box>

        {/* Turbine Positions Summary - REMOVED OLD SECTION */}
        {data.turbinePositions && data.turbinePositions.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Turbine Positions
            </Box>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {data.turbinePositions.length} turbine positions calculated
              <span>
                {' '}
                (First: {data.turbinePositions[0].lat.toFixed(6)}, {data.turbinePositions[0].lng.toFixed(6)})
              </span>
            </div>
          </Box>
        )}



        {/* Turbine Positions Summary */}
        {data.turbinePositions && data.turbinePositions.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Turbine Positions
            </Box>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {data.turbinePositions.length} turbine positions calculated
              <span>
                {' '}
                (First: {data.turbinePositions[0].lat.toFixed(6)}, {data.turbinePositions[0].lng.toFixed(6)})
              </span>
            </div>
          </Box>
        )}

        {/* Layout Analysis Visualizations */}
        {data.visualizations && Object.keys(data.visualizations).length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Layout Analysis
            </Box>
            <SpaceBetween direction="horizontal" size="m">
              {data.visualizations.validation_chart && (
                <div>
                  <Box variant="small" margin={{ bottom: 'xs' }}>Layout Validation</Box>
                  <img 
                    src={data.visualizations.validation_chart} 
                    alt="Layout Validation Chart"
                    style={{ 
                      maxWidth: '400px', 
                      height: 'auto', 
                      border: '1px solid #e9ebed', 
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              )}
              {data.visualizations.spacing_analysis && (
                <div>
                  <Box variant="small" margin={{ bottom: 'xs' }}>Spacing Analysis</Box>
                  <img 
                    src={data.visualizations.spacing_analysis} 
                    alt="Spacing Analysis Chart"
                    style={{ 
                      maxWidth: '400px', 
                      height: 'auto', 
                      border: '1px solid #e9ebed', 
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              )}
            </SpaceBetween>
          </Box>
        )}

        {/* Project ID */}
        <Box variant="small" color="text-body-secondary">
          Project ID: {data.projectId}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default LayoutMapArtifact;
