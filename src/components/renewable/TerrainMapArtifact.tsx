/**
 * TerrainMapArtifact Component
 * 
 * Renders terrain analysis artifacts from the renewable energy backend.
 * Displays GeoJSON features on an interactive map with metrics.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Table, Pagination, Button, ButtonDropdown } from '@cloudscape-design/components';
import 'leaflet/dist/leaflet.css';

// Custom CSS to hide popup tip and style popups + fix table header padding
const popupStyles = `
  /* Hide ALL popup tip elements with maximum specificity */
  .leaflet-popup-tip-container,
  .leaflet-popup-tip,
  .leaflet-container .leaflet-popup-tip-container,
  .leaflet-container .leaflet-popup-tip {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    width: 0 !important;
    opacity: 0 !important;
  }
  
  /* Remove margin that tip would normally occupy */
  .leaflet-popup-content-wrapper {
    margin-bottom: 0 !important;
  }
  
  /* Target custom popup class specifically */
  .custom-popup .leaflet-popup-tip-container,
  .custom-popup .leaflet-popup-tip {
    display: none !important;
  }
  
  /* Nuclear option - hide any element that looks like a tip */
  [class*="tip"]:not([class*="tooltip"]) {
    display: none !important;
  }
  
  /* Fix table header padding to align with cells */
  .awsui_header-cell_18582_1lj47_173:first-child {
    padding-left: 16px !important;
  }
  /* Alternative selector in case class names differ */
  th.awsui_header-cell_18582_1lj47_173:first-of-type {
    padding-left: 16px !important;
  }
  /* Generic fallback */
  table thead th:first-child {
    padding-left: 16px !important;
  }
`;

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    feature_type?: string;
    osm_id?: number;
    tags?: Record<string, any>;
    [key: string]: any;
  };
}

interface TerrainArtifactProps {
  data: {
    messageContentType: 'wind_farm_terrain_analysis';
    title?: string;
    subtitle?: string;
    projectId: string;
    coordinates: { lat: number; lng: number };
    exclusionZones: GeoJSONFeature[];
    metrics: {
      totalFeatures: number;
      featuresByType: Record<string, number>;
      radiusKm?: number;
      [key: string]: any;
    };
    geojson?: {
      type: 'FeatureCollection';
      features: GeoJSONFeature[];
    };
    // Enhanced visualization data
    mapHtml?: string;           // Folium HTML for iframe embedding
    mapUrl?: string;            // S3 URL for the interactive map
    visualizations?: {
      interactive_map?: string;
      elevation_profile?: string;
      slope_analysis?: string;
    };
    message?: string;
  };
  onFollowUpAction?: (action: string) => void;
}

const TerrainMapArtifact: React.FC<TerrainArtifactProps> = ({ data, onFollowUpAction }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 5;

  // Inject popup styles
  useEffect(() => {
    const styleId = 'terrain-map-popup-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = popupStyles;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Initialize Leaflet map - only once per data.projectId
  useEffect(() => {
    console.log('[TerrainMap] useEffect triggered', {
      hasMapRef: !!mapRef.current,
      hasGeojson: !!data.geojson,
      hasMapInstance: !!mapInstanceRef.current,
      projectId: data.projectId,
      geojsonFeatureCount: data.geojson?.features?.length || 0
    });

    if (!mapRef.current) {
      console.warn('[TerrainMap] mapRef.current is null - DOM element not available');
      return;
    }

    if (!data.geojson) {
      console.warn('[TerrainMap] data.geojson is null - no map data available');
      return;
    }
    
    // If map already exists, don't recreate it
    if (mapInstanceRef.current) {
      console.log('[TerrainMap] Map already exists, skipping re-initialization');
      return;
    }

    console.log('[TerrainMap] Starting map initialization...');

    // Clear container completely
    mapRef.current.innerHTML = '';
    (mapRef.current as any)._leaflet_id = undefined;

    // Check container dimensions
    const rect = mapRef.current.getBoundingClientRect();
    console.log('[TerrainMap] Container dimensions:', {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    });

    if (rect.width === 0 || rect.height === 0) {
      console.error('[TerrainMap] Container has no dimensions! Map cannot initialize.');
      return;
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('[TerrainMap] Timer fired, checking mapRef again...');
      
      if (!mapRef.current) {
        console.error('[TerrainMap] mapRef.current is null after timeout');
        return;
      }
      
      console.log('[TerrainMap] Starting dynamic Leaflet import...');
      
      // Dynamically import Leaflet
      import('leaflet')
        .then((L) => {
          console.log('[TerrainMap] Leaflet imported successfully', {
            hasMap: typeof L.map === 'function',
            hasGeoJSON: typeof L.geoJSON === 'function',
            hasMarker: typeof L.marker === 'function',
            hasTileLayer: typeof L.tileLayer === 'function'
          });

          if (!mapRef.current) {
            console.error('[TerrainMap] mapRef.current is null after Leaflet import');
            return;
          }
          
          console.log('[TerrainMap] Fixing Leaflet icon paths...');
          
          // Fix Leaflet default marker icon issue
          try {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            console.log('[TerrainMap] Icon paths fixed successfully');
          } catch (error) {
            console.error('[TerrainMap] Error fixing icon paths:', error);
          }

          console.log('[TerrainMap] Creating Leaflet map instance...', {
            center: [data.coordinates.lat, data.coordinates.lng],
            zoom: 13
          });

          // Create map with explicit dragging enabled
          let map;
          try {
            map = L.map(mapRef.current, {
              center: [data.coordinates.lat, data.coordinates.lng],
              zoom: 13,
              dragging: true,
              touchZoom: true,
              doubleClickZoom: true,
              scrollWheelZoom: true,
              boxZoom: true,
              keyboard: true,
              zoomControl: true,
              attributionControl: true,
            });
            
            console.log('[TerrainMap] Map instance created successfully', {
              hasMap: !!map,
              mapId: (map as any)._leaflet_id,
              draggingEnabled: map.dragging.enabled()
            });
            
            mapInstanceRef.current = map;
            
            // Force enable dragging (sometimes gets disabled)
            map.dragging.enable();
            
            console.log('[TerrainMap] Map created with dragging:', map.dragging.enabled());
          } catch (error) {
            console.error('[TerrainMap] CRITICAL ERROR creating map:', error);
            console.error('[TerrainMap] Error details:', {
              name: (error as Error).name,
              message: (error as Error).message,
              stack: (error as Error).stack
            });
            return;
          }

          console.log('[TerrainMap] Adding tile layers...');

          // Add satellite basemap (matching original notebook)
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

          // Add satellite as default (matching notebook)
          satelliteLayer.addTo(map);
          console.log('[TerrainMap] Satellite layer added');

          // Add layer control to switch between satellite and OSM
          L.control.layers(
            {
              'Satellite': satelliteLayer,
              'Street Map': osmLayer,
            },
            {},
            { position: 'topright' }
          ).addTo(map);
          console.log('[TerrainMap] Layer control added');

          console.log('[TerrainMap] Adding center marker...');

          // Add center marker
          L.marker([data.coordinates.lat, data.coordinates.lng])
            .addTo(map)
            .bindPopup(`
          <div style="
            min-width: 250px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #0972d3;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-family: 'Amazon Ember', 'Helvetica Neue', Arial, sans-serif;
            text-align: center;
          ">
            <div style="font-size: 16px; font-weight: bold; color: #0972d3;">
              Analysis Center
            </div>
            <div style="font-size: 13px; color: #545b64; margin-top: 4px;">
              ${data.coordinates.lat.toFixed(6)}, ${data.coordinates.lng.toFixed(6)}
            </div>
          </div>
        `, {
              maxWidth: 300,
              minWidth: 250,
              className: 'custom-popup'
            });
          
          console.log('[TerrainMap] Center marker added');

          // Style function matching original Folium notebook styling
      const getFeatureStyle = (featureType: string, geometry: any) => {
        const isLine = geometry?.type === 'LineString' || geometry?.type === 'MultiLineString';
        
        switch (featureType) {
          case 'water':
            return {
              fillColor: 'blue',
              color: 'darkblue',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
            };
          case 'highway':
            // Render highways as lines, not filled polygons
            return {
              fillColor: 'none',
              color: 'darkorange',
              weight: isLine ? 3 : 2,
              fillOpacity: 0,  // No fill for highways
              opacity: 1,
              fill: false,  // Explicitly disable fill
            };
          case 'building':
            return {
              fillColor: 'red',
              color: 'darkred',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
            };
          default:
            return {
              fillColor: 'purple',
              color: 'darkviolet',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
            };
        }
      };

          console.log('[TerrainMap] Processing GeoJSON features...', {
            totalFeatures: data.geojson.features.length
          });

          // Pre-process GeoJSON to convert highway polygons to linestrings
          const processedGeojson = {
            ...data.geojson,
            features: data.geojson.features.map(feature => {
          const featureType = feature.properties?.feature_type;
          
          // Convert highway polygons to linestrings
          if (featureType === 'highway' && feature.geometry?.type === 'Polygon') {
            let coords = feature.geometry.coordinates[0];
            
            // Remove duplicate last coordinate if it matches the first (closes the polygon)
            if (coords.length > 1) {
              const first = coords[0];
              const last = coords[coords.length - 1];
              if (first[0] === last[0] && first[1] === last[1]) {
                coords = coords.slice(0, -1); // Remove last coordinate
              }
            }
            
            return {
              ...feature,
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            };
          }
          
          return feature;
        })
      };

          console.log('[TerrainMap] Adding GeoJSON layer to map...');

          // Add GeoJSON features
          const geoJsonLayer = L.geoJSON(processedGeojson, {
        style: (feature) => {
          const featureType = feature?.properties?.feature_type || 'other';
          const geometry = feature?.geometry;
          return getFeatureStyle(featureType, geometry);
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const featureType = props.feature_type || 'Unknown';
          const osmId = props.osm_id || 'N/A';
          const tags = props.tags || {};
          
          // Better display name based on actual feature details
          let displayName = featureType;
          if (featureType === 'highway' && tags.highway) {
            // Show the actual road type instead of generic "highway"
            displayName = tags.highway.charAt(0).toUpperCase() + tags.highway.slice(1) + ' Road';
          } else if (tags.name) {
            displayName = tags.name;
          }
          
          let popupContent = `
            <div style="
              min-width: 300px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.95);
              border: 2px solid #0972d3;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              font-family: 'Amazon Ember', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
            ">
              <div style="font-size: 16px; font-weight: bold; color: #0972d3; margin-bottom: 8px;">
                ${displayName}
              </div>
              <div style="font-size: 13px; color: #545b64;">
                <strong>Type:</strong> ${featureType}<br/>
                <strong>OSM ID:</strong> ${osmId}
          `;
          
          // Add relevant tags (skip highway if already shown in title)
          if (tags.name && displayName !== tags.name) {
            popupContent += `<br/><strong>Name:</strong> ${tags.name}`;
          }
          if (tags.building) {
            popupContent += `<br/><strong>Building Type:</strong> ${tags.building}`;
          }
          if (tags.natural) {
            popupContent += `<br/><strong>Natural Feature:</strong> ${tags.natural}`;
          }
          if (tags.waterway) {
            popupContent += `<br/><strong>Waterway Type:</strong> ${tags.waterway}`;
          }
          
          popupContent += `
              </div>
            </div>
          `;
          
          layer.bindPopup(popupContent, {
            maxWidth: 400,
            minWidth: 300,
            className: 'custom-popup',
            closeButton: false,  // Remove the white X button
            autoPan: false,      // Disable auto-pan
            keepInView: false,   // Don't keep in view
            offset: [0, 0]       // No offset (might remove tip positioning)
          });
            },
          }).addTo(map);
          
          console.log('[TerrainMap] GeoJSON layer added successfully', {
            layerCount: Object.keys((geoJsonLayer as any)._layers).length
          });

          // Wait for map to be fully ready before fitting bounds
          map.whenReady(() => {
            console.log('[TerrainMap] Map is ready, fitting bounds...');
            // Fit map to show all features
            const bounds = geoJsonLayer.getBounds();
            console.log('[TerrainMap] GeoJSON bounds:', {
              isValid: bounds.isValid(),
              bounds: bounds.isValid() ? {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
              } : null
            });

            if (bounds.isValid()) {
              try {
                map.fitBounds(bounds, { 
                  padding: [50, 50],
                  animate: false  // Disable animation to prevent position errors
                });
                console.log('[TerrainMap] Bounds fitted successfully');
              } catch (error) {
                console.error('[TerrainMap] Error fitting bounds:', error);
              }
            } else {
              console.warn('[TerrainMap] Bounds are not valid, skipping fitBounds');
            }
            
            // Invalidate size to ensure proper rendering
            setTimeout(() => {
              try {
                map.invalidateSize();
                console.log('[TerrainMap] Map size invalidated, dragging enabled:', map.dragging.enabled());
                console.log('[TerrainMap] ✅ MAP INITIALIZATION COMPLETE');
              } catch (error) {
                console.error('[TerrainMap] Error invalidating size:', error);
              }
            }, 100);
          });

        })
        .catch((error) => {
          console.error('[TerrainMap] ❌ CRITICAL ERROR: Failed to import Leaflet:', error);
          console.error('[TerrainMap] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        });
    }, 100);

    // Cleanup only on unmount
    return () => {
      console.log('[TerrainMap] Cleanup function called');
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        console.log('[TerrainMap] Removing map instance');
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          console.log('[TerrainMap] Map instance removed successfully');
        } catch (error) {
          console.error('[TerrainMap] Error removing map instance:', error);
        }
      }
    };
  }, [data.projectId]); // Only re-run if projectId changes (new terrain analysis)

  const handleFollowUpAction = (action: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(action);
    }
  };

  return (
    <Container
        header={
          <Header
            variant="h2"
            description={data.message || 'Real-time terrain analysis using OpenStreetMap data'}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color="green">
                  {data.metrics.totalFeatures} Features Found
                </Badge>
              </SpaceBetween>
            }
          >
            {data.title || 'Terrain Analysis'}
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* Follow-up Actions */}
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Next Steps
            </Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => handleFollowUpAction(`Create a 30MW wind farm layout at ${data.coordinates.lat}, ${data.coordinates.lng}`)}
              >
                Create Layout (30MW)
              </Button>
              <ButtonDropdown
                items={[
                  { id: 'layout-50', text: 'Create 50MW Layout' },
                  { id: 'layout-100', text: 'Create 100MW Layout' },
                  { id: 'layout-custom', text: 'Custom Capacity...' },
                  { id: 'turbine-15', text: 'Design with 15 Turbines' },
                  { id: 'turbine-20', text: 'Design with 20 Turbines' },
                  { id: 'turbine-25', text: 'Design with 25 Turbines' },
                ]}
                onItemClick={({ detail }) => {
                  const coords = `${data.coordinates.lat}, ${data.coordinates.lng}`;
                  switch (detail.id) {
                    case 'layout-50':
                      handleFollowUpAction(`Create a 50MW wind farm layout at ${coords}`);
                      break;
                    case 'layout-100':
                      handleFollowUpAction(`Create a 100MW wind farm layout at ${coords}`);
                      break;
                    case 'turbine-15':
                      handleFollowUpAction(`Design a wind farm with 15 turbines at ${coords}`);
                      break;
                    case 'turbine-20':
                      handleFollowUpAction(`Design a wind farm with 20 turbines at ${coords}`);
                      break;
                    case 'turbine-25':
                      handleFollowUpAction(`Design a wind farm with 25 turbines at ${coords}`);
                      break;
                  }
                }}
              >
                More Options
              </ButtonDropdown>
              <Button
                onClick={() => handleFollowUpAction('Generate executive report')}
              >
                Generate Report
              </Button>
            </SpaceBetween>
          </Box>
        {/* Site Information */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Coordinates</Box>
            <div>
              {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Features</Box>
            <div>{data.metrics.totalFeatures}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Analysis Radius</Box>
            <div>{data.metrics.radiusKm || 5} km</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Data Source</Box>
            <div>OpenStreetMap</div>
          </div>
        </ColumnLayout>

        {/* Feature Breakdown */}
        {data.metrics?.featuresByType && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Feature Breakdown
            </Box>
            <ColumnLayout columns={4} variant="text-grid">
              {Object.entries(data.metrics.featuresByType).map(([type, count]) => (
                <div key={type}>
                  <Box variant="small" color="text-body-secondary">{type}</Box>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{count}</div>
                </div>
              ))}
            </ColumnLayout>
          </Box>
        )}

        {/* Interactive Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Interactive Map
          </Box>
          <div
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {data.mapHtml ? (
              <iframe
                srcDoc={data.mapHtml}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Terrain Analysis Map"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  touchAction: 'none',
                }}
              />
            )}
          </div>
        </Box>

        {/* Feature Table with Pagination */}
        {data.exclusionZones && data.exclusionZones.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Features ({data.exclusionZones.length})
            </Box>
            <Table
              columnDefinitions={[
                {
                  id: 'type',
                  header: 'Type',
                  cell: (item: GeoJSONFeature) => (
                    <Box padding={{ left: 's' }}>
                      {item.properties.feature_type || 'Unknown'}
                    </Box>
                  ),
                  minWidth: 120,
                },
                {
                  id: 'osmId',
                  header: 'OSM ID',
                  cell: (item: GeoJSONFeature) => item.properties.osm_id || 'N/A',
                  minWidth: 120,
                },
                {
                  id: 'name',
                  header: 'Name',
                  cell: (item: GeoJSONFeature) => item.properties.tags?.name || '-',
                  minWidth: 150,
                },
                {
                  id: 'details',
                  header: 'Details',
                  cell: (item: GeoJSONFeature) => {
                    const tags = item.properties.tags || {};
                    if (tags.building) return `Building: ${tags.building}`;
                    if (tags.highway) return `Highway: ${tags.highway}`;
                    if (tags.natural) return `Natural: ${tags.natural}`;
                    return '-';
                  },
                  minWidth: 150,
                },
              ]}
              items={data.exclusionZones.slice(
                (currentPageIndex - 1) * pageSize,
                currentPageIndex * pageSize
              )}
              loadingText="Loading features"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No features found</b>
                </Box>
              }
              contentDensity="comfortable"
              pagination={
                <Pagination
                  currentPageIndex={currentPageIndex}
                  pagesCount={Math.ceil(data.exclusionZones.length / pageSize)}
                  onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                  ariaLabels={{
                    nextPageLabel: 'Next page',
                    previousPageLabel: 'Previous page',
                    pageLabel: (pageNumber) => `Page ${pageNumber}`,
                  }}
                />
              }
            />
          </Box>
        )}

        {/* Additional Visualizations */}
        {data.visualizations && Object.keys(data.visualizations).length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Additional Analysis
            </Box>
            <SpaceBetween direction="horizontal" size="s">
              {data.visualizations.elevation_profile && (
                <div>
                  <Box variant="small">Elevation Profile</Box>
                  <img 
                    src={data.visualizations.elevation_profile} 
                    alt="Elevation Profile"
                    style={{ maxWidth: '300px', height: 'auto', border: '1px solid #e9ebed', borderRadius: '4px' }}
                  />
                </div>
              )}
              {data.visualizations.slope_analysis && (
                <div>
                  <Box variant="small">Slope Analysis</Box>
                  <img 
                    src={data.visualizations.slope_analysis} 
                    alt="Slope Analysis"
                    style={{ maxWidth: '300px', height: 'auto', border: '1px solid #e9ebed', borderRadius: '4px' }}
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

export default TerrainMapArtifact;
