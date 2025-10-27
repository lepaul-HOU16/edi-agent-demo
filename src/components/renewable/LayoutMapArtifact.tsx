/**
 * LayoutMapArtifact Component
 * 
 * Renders wind farm layout artifacts from the renewable energy backend.
 * Displays interactive Leaflet maps with turbine positions and layout metrics.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Alert, Button } from '@cloudscape-design/components';
import 'leaflet/dist/leaflet.css';
import { ActionButtons } from './ActionButtons';
import { WorkflowCTAButtons } from './WorkflowCTAButtons';

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
    completedSteps?: string[];
    metadata?: {
      algorithm?: string;
      algorithm_proof?: string;
      constraints_applied?: number;
      terrain_features_considered?: string[];
      placement_decisions?: Array<{
        turbine_id: string;
        position: [number, number];
        avoided_features: string[];
        wind_exposure_score: number;
        placement_reason: string;
      }>;
      layout_metadata?: {
        total_turbines?: number;
        site_area_km2?: number;
        available_area_km2?: number;
        average_spacing_m?: number;
      };
    };
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
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  // Debug logging to track renders
  console.log('🗺️ LayoutMapArtifact RENDER:', {
    projectId: data.projectId,
    turbineCount: data.turbineCount,
    hasMapHtml: !!data.mapHtml,
    hasGeojson: !!data.geojson,
    hasMetadata: !!data.metadata,
    algorithm: data.metadata?.algorithm,
    algorithmProof: data.metadata?.algorithm_proof,
    constraintsApplied: data.metadata?.constraints_applied,
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

    // DEFENSIVE VALIDATION: Check all required data before initialization
    
    // Validation 1: Check GeoJSON exists
    if (!data.geojson) {
      const errorMsg = 'GeoJSON data is missing - cannot render map';
      console.error('[LayoutMap] Validation failed:', errorMsg);
      setRenderError(errorMsg);
      return;
    }

    // Validation 2: Check GeoJSON has features array
    if (!data.geojson.features || !Array.isArray(data.geojson.features)) {
      const errorMsg = 'GeoJSON features array is missing or invalid';
      console.error('[LayoutMap] Validation failed:', errorMsg);
      setRenderError(errorMsg);
      return;
    }

    // Validation 3: Check features array is not empty
    if (data.geojson.features.length === 0) {
      const errorMsg = 'GeoJSON features array is empty - no features to display';
      console.error('[LayoutMap] Validation failed:', errorMsg);
      setRenderError(errorMsg);
      return;
    }

    // Validation 4: Check map container ref exists
    if (!mapRef.current) {
      const errorMsg = 'Map container ref is null - DOM element not ready';
      console.error('[LayoutMap] Validation failed:', errorMsg);
      setRenderError(errorMsg);
      return;
    }

    // Validation 5: Check container dimensions
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      const errorMsg = `Map container has no dimensions (width: ${rect.width}, height: ${rect.height})`;
      console.error('[LayoutMap] Validation failed:', errorMsg);
      setRenderError(errorMsg);
      return;
    }

    console.log('[LayoutMap] All validations passed:', {
      featureCount: data.geojson.features.length,
      containerWidth: rect.width,
      containerHeight: rect.height
    });

    // Clear any previous render errors
    setRenderError(null);

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
        // Find the first turbine feature (not building/road/etc)
        const firstTurbine = data.geojson.features.find(
          (f: any) => f.properties?.type === 'turbine' && f.geometry?.type === 'Point'
        );
        
        if (firstTurbine && firstTurbine.geometry && firstTurbine.geometry.coordinates) {
          centerLat = firstTurbine.geometry.coordinates[1];
          centerLng = firstTurbine.geometry.coordinates[0];
          console.log('[LayoutMap] Map center from turbine:', { centerLat, centerLng });
        } else {
          // Fallback: use first feature with Point geometry
          const firstPoint = data.geojson.features.find((f: any) => f.geometry?.type === 'Point');
          if (firstPoint && firstPoint.geometry && firstPoint.geometry.coordinates) {
            centerLat = firstPoint.geometry.coordinates[1];
            centerLng = firstPoint.geometry.coordinates[0];
            console.log('[LayoutMap] Map center from first point:', { centerLat, centerLng });
          } else {
            console.error('[LayoutMap] No Point features found in geojson!');
            setRenderError('No turbine positions found in layout data');
            initializingRef.current = false;
            return;
          }
        }
      } else {
        console.error('[LayoutMap] No features in geojson!');
        setRenderError('No features found in layout data');
        initializingRef.current = false;
        return;
      }

      // Create map with all interactions enabled
      let map;
      try {
        // Check one more time before creating map
        if (!mapRef.current) {
          console.error('[LayoutMap] mapRef.current is null before map creation!');
          initializingRef.current = false;
          return;
        }

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
          zoomAnimation: false, // Disable zoom animation to prevent _leaflet_pos errors
          fadeAnimation: false, // Disable fade animation
          markerZoomAnimation: false, // Disable marker zoom animation
        });

        mapInstanceRef.current = map;
        initializingRef.current = false; // Initialization complete
        console.log('[LayoutMap] Map initialization complete');
      } catch (error) {
        const errorMsg = `Failed to create Leaflet map: ${error instanceof Error ? error.message : String(error)}`;
        console.error('[LayoutMap] Error creating map:', error);
        setRenderError(errorMsg);
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

      // Separate terrain features from turbine features
      // CRITICAL: Turbines might not have type='turbine', they might just have turbine_id
      const turbineFeatures = data.geojson.features.filter((f: any) => 
        f.properties?.type === 'turbine' || 
        f.properties?.turbine_id !== undefined ||
        f.geometry?.type === 'Point'  // Turbines are always points
      );
      const terrainFeatures = data.geojson.features.filter((f: any) => 
        !turbineFeatures.includes(f)
      );

      console.log('[LayoutMap] Feature breakdown:', {
        total: data.geojson.features.length,
        terrain: terrainFeatures.length,
        turbines: turbineFeatures.length,
        firstTurbine: turbineFeatures[0]?.properties,
        firstTerrain: terrainFeatures[0]?.properties
      });

      // STEP 1: Render terrain features first (perimeter, roads, buildings, water)
      const terrainLayers: any[] = [];
      
      terrainFeatures.forEach((feature: any) => {
        const featureType = feature.properties?.type || 'unknown';
        const geometry = feature.geometry;
        
        try {
          if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            // Render polygons (buildings, water bodies, perimeter)
            let style: any = {
              fillOpacity: 0.3,
              weight: 2
            };
            
            // Apply feature-specific styling
            if (featureType === 'building') {
              style.fillColor = '#ff0000';
              style.color = '#cc0000';
              style.fillOpacity = 0.3;
            } else if (featureType === 'water') {
              style.fillColor = '#0000ff';
              style.color = '#0000cc';
              style.fillOpacity = 0.4;
            } else if (featureType === 'perimeter') {
              style.fillColor = 'transparent';
              style.color = '#00ff00';  // Green color
              style.weight = 3;
              style.dashArray = '10, 5';
              style.fillOpacity = 0;
              style.interactive = false;  // CRITICAL: Don't capture clicks
            } else {
              // Default polygon style
              style.fillColor = '#cccccc';
              style.color = '#999999';
              style.fillOpacity = 0.2;
            }
            
            const layer = L.geoJSON(feature, {
              style: style
            }).addTo(map);
            
            // Add popup with feature info (but NOT for perimeter - it blocks interaction)
            if (featureType !== 'perimeter') {
              layer.bindPopup(`
                <div style="padding: 8px; font-family: 'Amazon Ember', Arial, sans-serif;">
                  <div style="font-size: 14px; font-weight: bold; color: #0972d3; margin-bottom: 4px;">
                    ${featureType.charAt(0).toUpperCase() + featureType.slice(1)}
                  </div>
                  <div style="font-size: 12px; color: #545b64;">
                    ${feature.properties?.name || 'Terrain feature'}
                  </div>
                </div>
              `);
            }
            
            terrainLayers.push(layer);
            
          } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
            // Render lines (roads)
            let style: any = {
              weight: 2,
              opacity: 0.7
            };
            
            if (featureType === 'road') {
              style.color = '#666666';
              style.weight = 3;
            } else {
              style.color = '#999999';
            }
            
            const layer = L.geoJSON(feature, {
              style: style
            }).addTo(map);
            
            // Add popup with feature info
            layer.bindPopup(`
              <div style="padding: 8px; font-family: 'Amazon Ember', Arial, sans-serif;">
                <div style="font-size: 14px; font-weight: bold; color: #0972d3; margin-bottom: 4px;">
                  ${featureType.charAt(0).toUpperCase() + featureType.slice(1)}
                </div>
                <div style="font-size: 12px; color: #545b64;">
                  ${feature.properties?.name || 'Terrain feature'}
                </div>
              </div>
            `);
            
            terrainLayers.push(layer);
          }
        } catch (error) {
          console.error('[LayoutMap] Error rendering terrain feature:', error, feature);
        }
      });

      console.log('[LayoutMap] Rendered terrain layers:', terrainLayers.length);

      console.log('[LayoutMap] Rendered terrain layers:', terrainLayers.length);

      // STEP 2: Render turbine markers on top of terrain features
      const markers: any[] = [];
      turbineFeatures.forEach((feature: any, index: number) => {
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

      // Fit bounds to show all features (terrain + turbines)
      const allLayers = [...terrainLayers, ...markers];
      if (allLayers.length > 0) {
        const group = L.featureGroup(allLayers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      } else if (markers.length > 0) {
        // Fallback: fit to turbines only if no terrain layers
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

      // Add legend for terrain features if any exist
      if (terrainFeatures.length > 0) {
        const LegendControl = L.Control.extend({
          options: {
            position: 'bottomright'
          },
          
          onAdd: function() {
            const div = L.DomUtil.create('div', 'info legend');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '4px';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            div.style.fontSize = '12px';
            div.style.lineHeight = '18px';
            
            let html = '<div style="font-weight: bold; margin-bottom: 8px;">Map Legend</div>';
            
            // Check which feature types exist
            const hasBuildings = terrainFeatures.some((f: any) => f.properties?.type === 'building');
            const hasRoads = terrainFeatures.some((f: any) => f.properties?.type === 'road');
            const hasWater = terrainFeatures.some((f: any) => f.properties?.type === 'water');
            const hasPerimeter = terrainFeatures.some((f: any) => f.properties?.type === 'perimeter');
            
            if (hasBuildings) {
              html += '<div style="margin-bottom: 4px;"><span style="display: inline-block; width: 16px; height: 12px; background-color: rgba(255,0,0,0.3); border: 1px solid #cc0000; margin-right: 6px;"></span>Buildings</div>';
            }
            if (hasRoads) {
              html += '<div style="margin-bottom: 4px;"><span style="display: inline-block; width: 16px; height: 2px; background-color: #666666; margin-right: 6px; vertical-align: middle;"></span>Roads</div>';
            }
            if (hasWater) {
              html += '<div style="margin-bottom: 4px;"><span style="display: inline-block; width: 16px; height: 12px; background-color: rgba(0,0,255,0.4); border: 1px solid #0000cc; margin-right: 6px;"></span>Water</div>';
            }
            if (hasPerimeter) {
              html += '<div style="margin-bottom: 4px;"><span style="display: inline-block; width: 16px; height: 12px; border: 2px dashed #333333; margin-right: 6px;"></span>Perimeter</div>';
            }
            
            html += '<div style="margin-top: 8px;"><span style="display: inline-block; width: 16px; height: 16px; margin-right: 6px;">📍</span>Turbines</div>';
            
            div.innerHTML = html;
            return div;
          }
        });
        
        new LegendControl().addTo(map);
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
        try {
          // Stop any ongoing animations before removing
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('[LayoutMap] Error during cleanup:', error);
        }
        mapInstanceRef.current = null;
      }
      initializingRef.current = false; // Reset initialization flag on cleanup
    };
  }, [data.projectId]); // Only depend on projectId to prevent re-renders

  // Comprehensive error boundary - catch any rendering errors
  try {
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
        {/* Workflow CTA Buttons - Guide user through workflow */}
        <WorkflowCTAButtons
          completedSteps={data.completedSteps || ['terrain', 'layout']}
          projectId={data.projectId}
          onAction={handleActionClick}
        />
        
        {/* Algorithm Metadata Display */}
        {data.metadata && (
          <Alert
            type="info"
            header="Intelligent Placement Algorithm"
          >
            <SpaceBetween size="s">
              <Box>
                <strong>Algorithm:</strong> {data.metadata.algorithm || 'unknown'}
              </Box>
              {data.metadata.algorithm_proof && (
                <Box variant="small" color="text-body-secondary">
                  <strong>Verification:</strong> {data.metadata.algorithm_proof}
                </Box>
              )}
              {data.metadata.constraints_applied !== undefined && (
                <Box>
                  <strong>Constraints Applied:</strong> {data.metadata.constraints_applied} terrain features
                </Box>
              )}
              {data.metadata.terrain_features_considered && data.metadata.terrain_features_considered.length > 0 && (
                <Box>
                  <strong>Features Considered:</strong> {data.metadata.terrain_features_considered.join(', ')}
                </Box>
              )}
              {data.metadata.layout_metadata && (
                <Box variant="small" color="text-body-secondary">
                  Site area: {data.metadata.layout_metadata.site_area_km2?.toFixed(2)} km² | 
                  Average spacing: {data.metadata.layout_metadata.average_spacing_m}m
                </Box>
              )}
            </SpaceBetween>
          </Alert>
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

        {/* Terrain Features Summary */}
        {data.geojson && (() => {
          const terrainFeatures = data.geojson.features?.filter((f: any) => 
            f.properties?.type !== 'turbine'
          ) || [];
          
          if (terrainFeatures.length > 0) {
            const buildings = terrainFeatures.filter((f: any) => f.properties?.type === 'building').length;
            const roads = terrainFeatures.filter((f: any) => f.properties?.type === 'road').length;
            const water = terrainFeatures.filter((f: any) => f.properties?.type === 'water').length;
            const other = terrainFeatures.length - buildings - roads - water;
            
            return (
              <Box>
                <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
                  Terrain Features on Map
                </Box>
                <ColumnLayout columns={4} variant="text-grid">
                  {buildings > 0 && (
                    <div>
                      <Box variant="small">Buildings</Box>
                      <div>{buildings}</div>
                    </div>
                  )}
                  {roads > 0 && (
                    <div>
                      <Box variant="small">Roads</Box>
                      <div>{roads}</div>
                    </div>
                  )}
                  {water > 0 && (
                    <div>
                      <Box variant="small">Water Bodies</Box>
                      <div>{water}</div>
                    </div>
                  )}
                  {other > 0 && (
                    <div>
                      <Box variant="small">Other Features</Box>
                      <div>{other}</div>
                    </div>
                  )}
                </ColumnLayout>
              </Box>
            );
          }
          return null;
        })()}

        {/* Interactive Layout Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Farm Layout Map
          </Box>
          
          {/* Show error alert if rendering failed */}
          {renderError && (
            <Alert
              type="error"
              header="Map Rendering Error"
              action={
                <Button
                  onClick={() => {
                    setRenderError(null);
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
              }
            >
              <div style={{ marginBottom: '8px' }}>
                Failed to display layout map: {renderError}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                This may be due to missing data or a temporary rendering issue. 
                Try reloading the page or re-running the layout optimization.
              </div>
            </Alert>
          )}
          
          {/* Show fallback UI if GeoJSON is missing or empty */}
          {!renderError && (!data.geojson || !data.geojson.features || data.geojson.features.length === 0) && (
            <Alert
              type="warning"
              header="Map Data Unavailable"
            >
              <div style={{ marginBottom: '8px' }}>
                Layout map cannot be displayed because GeoJSON features are missing.
              </div>
              {data.turbineCount > 0 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  However, {data.turbineCount} turbines were calculated. 
                  Try re-running the layout optimization to generate map data.
                </div>
              )}
              {data.turbineCount === 0 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  No turbine positions were calculated. Please run the layout optimization again.
                </div>
              )}
            </Alert>
          )}
          
          {/* Render map only if validations pass and no errors */}
          {!renderError && data.geojson && data.geojson.features && data.geojson.features.length > 0 && (
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
          )}
        </Box>

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
  } catch (error) {
    // Catch any rendering errors and display user-friendly error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[LayoutMapArtifact] Rendering error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      projectId: data?.projectId,
      turbineCount: data?.turbineCount,
      timestamp: new Date().toISOString()
    });

    // Set error state if not already set
    if (!hasError) {
      setHasError(true);
    }

    return (
      <Container
        header={
          <Header variant="h2">
            Layout Map Error
          </Header>
        }
      >
        <Alert
          type="error"
          header="Failed to Render Layout Map"
          action={
            <Button
              onClick={() => {
                console.log('[LayoutMapArtifact] User clicked reload button');
                setHasError(false);
                setRenderError(null);
                window.location.reload();
              }}
              iconName="refresh"
            >
              Reload Page
            </Button>
          }
        >
          <SpaceBetween size="s">
            <Box>
              An unexpected error occurred while rendering the layout map component.
            </Box>
            <Box variant="small" color="text-body-secondary">
              <strong>Error:</strong> {errorMessage}
            </Box>
            <Box variant="small" color="text-body-secondary">
              This may be a temporary issue. Try reloading the page or re-running the layout optimization.
              If the problem persists, please contact support with the error details above.
            </Box>
          </SpaceBetween>
        </Alert>
      </Container>
    );
  }
};

export default LayoutMapArtifact;
