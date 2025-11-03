/**
 * TerrainMapArtifact Component
 * 
 * Renders terrain analysis artifacts from the renewable energy backend.
 * Displays GeoJSON features on an interactive map with metrics.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Table, Pagination, Button, ButtonDropdown } from '@cloudscape-design/components';
import 'leaflet/dist/leaflet.css';
import { ActionButtons } from './ActionButtons';
import { WorkflowCTAButtons } from './WorkflowCTAButtons';

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

interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
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
  actions?: ActionButton[];  // Contextual action buttons from orchestrator
  onFollowUpAction?: (action: string) => void;
}

const TerrainMapArtifact: React.FC<TerrainArtifactProps> = ({ data, actions, onFollowUpAction }) => {
  console.log('🗺️ TerrainMapArtifact: COMPONENT RENDERING');
  
  // CRITICAL DEBUG: Log the actual data structure received
  console.log('🗺️ TerrainMapArtifact: Received data:', data);
  console.log('🗺️ TerrainMapArtifact: data keys:', Object.keys(data || {}));
  console.log('🗺️ TerrainMapArtifact: data.metrics:', data?.metrics);
  console.log('🗺️ TerrainMapArtifact: data.geojson:', data?.geojson);
  console.log('🗺️ TerrainMapArtifact: data.mapHtml exists:', !!data?.mapHtml);
  console.log('🗺️ TerrainMapArtifact: data.mapUrl exists:', !!data?.mapUrl);
  console.log('🗺️ TerrainMapArtifact: data.exclusionZones:', data?.exclusionZones);
  console.log('🗺️ TerrainMapArtifact: data.exclusionZones length:', data?.exclusionZones?.length);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef<boolean>(false); // Prevent multiple initializations
  const renderCountRef = useRef<number>(0); // Track render count
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 5;

  // Log every render to diagnose the flashing
  renderCountRef.current += 1;
  console.log(`[TerrainMap] RENDER #${renderCountRef.current}`, {
    projectId: data.projectId,
    hasMapInstance: !!mapInstanceRef.current,
    isInitializing: initializingRef.current
  });

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
    console.log('🗺️ [TerrainMap] useEffect STARTED', {
      hasMapHtml: !!data.mapHtml,
      hasMapUrl: !!data.mapUrl,
      hasGeojson: !!data.geojson
    });
    
    // Skip Leaflet initialization if we have pre-rendered HTML
    if (data.mapHtml || data.mapUrl) {
      console.log('[TerrainMap] Using pre-rendered HTML map, skipping Leaflet initialization');
      return;
    }

    console.log('[TerrainMap] useEffect triggered', {
      hasMapRef: !!mapRef.current,
      hasGeojson: !!data.geojson,
      hasMapInstance: !!mapInstanceRef.current,
      isInitializing: initializingRef.current,
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
    
    // If map already exists or is being initialized, don't recreate it
    if (mapInstanceRef.current || initializingRef.current) {
      console.log('[TerrainMap] Map already exists or is initializing, skipping re-initialization');
      return;
    }

    console.log('[TerrainMap] Starting map initialization...');
    initializingRef.current = true; // Mark as initializing

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
      initializingRef.current = false;
      return;
    }

    console.log('[TerrainMap] Starting dynamic Leaflet import...');
    
    // Dynamically import Leaflet (no timeout - immediate initialization)
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
            initializingRef.current = false;
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
            initializingRef.current = false; // Initialization complete
            
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
            initializingRef.current = false;
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
      const getFeatureStyle = (featureType: string, geometry: any, tags: any = {}) => {
        const isLine = geometry?.type === 'LineString' || geometry?.type === 'MultiLineString';
        
        // FIX: Determine actual feature type from OSM tags if feature_type is 'way' or incorrect
        let actualFeatureType = featureType;
        
        if (featureType === 'way' || !featureType || featureType === 'other') {
          // Identify from OSM tags - order matters (most specific first)
          if (tags.highway) {
            actualFeatureType = 'highway';
            console.log('[TerrainMap] Corrected feature type from "way" to "highway"', { highway: tags.highway });
          } else if (tags.railway) {
            actualFeatureType = 'railway';
            console.log('[TerrainMap] Corrected feature type from "way" to "railway"', { railway: tags.railway });
          } else if (tags.waterway) {
            actualFeatureType = 'water';
            console.log('[TerrainMap] Corrected feature type from "way" to "water" (waterway)', { waterway: tags.waterway });
          } else if (tags.natural === 'water') {
            actualFeatureType = 'water';
            console.log('[TerrainMap] Corrected feature type from "way" to "water" (natural)', { tags });
          } else if (tags.building) {
            actualFeatureType = 'building';
            console.log('[TerrainMap] Corrected feature type from "way" to "building"', { tags });
          }
        }
        
        // DIAGNOSTIC LOGGING for water features
        if (actualFeatureType === 'water' || tags?.natural === 'water' || tags?.waterway) {
          console.log('[TerrainMap] Water feature styling:', {
            originalType: featureType,
            actualType: actualFeatureType,
            geometryType: geometry?.type,
            tags,
            isWaterway: !!tags.waterway,
            willApplyBlueFill: actualFeatureType === 'water' && !tags.waterway
          });
        }
        
        switch (actualFeatureType) {
          case 'water':
            // FIX: Waterways (rivers, streams) should be lines, not filled polygons
            if (tags.waterway) {
              console.log('[TerrainMap] ✅ Applying waterway styling (blue line, no fill)', { waterway: tags.waterway });
              return {
                fillColor: 'none',
                color: 'blue',
                weight: isLine ? 3 : 2,
                fillOpacity: 0,  // No fill for waterways
                opacity: 0.8,
                fill: false,  // Explicitly disable fill for rivers/streams
              };
            }
            // Water bodies (lakes, ponds) get filled
            console.log('[TerrainMap] ✅ Applying water body styling (blue fill with 0.4 opacity)');
            return {
              fillColor: 'blue',
              color: 'darkblue',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
              fill: true,  // Explicitly enable fill for water bodies
            };
          case 'highway':
            // Check if it's a path/track/trail (unpaved)
            const highwayType = tags.highway;
            if (highwayType === 'path' || highwayType === 'track' || 
                highwayType === 'footway' || highwayType === 'bridleway' ||
                highwayType === 'cycleway' || highwayType === 'steps') {
              console.log('[TerrainMap] ✅ Applying path/trail styling (brown dashed line)', { highway: highwayType });
              return {
                fillColor: 'none',
                color: '#8B4513',  // Brown color for dirt paths
                weight: 2,
                fillOpacity: 0,
                opacity: 0.7,
                fill: false,
                dashArray: '5, 5',  // Dashed line for unpaved paths
              };
            }
            // Regular paved highways
            console.log('[TerrainMap] ✅ Applying highway styling (orange line)', { highway: highwayType });
            return {
              fillColor: 'none',
              color: 'darkorange',
              weight: isLine ? 3 : 2,
              fillOpacity: 0,  // No fill for highways
              opacity: 1,
              fill: false,  // Explicitly disable fill
            };
          case 'railway':
            console.log('[TerrainMap] ✅ Applying railway styling (gray dashed line)');
            return {
              fillColor: 'none',
              color: '#666666',
              weight: 2,
              fillOpacity: 0,
              opacity: 0.8,
              fill: false,
              dashArray: '8, 4',  // Dashed line for railways
            };
          case 'building':
            console.log('[TerrainMap] ✅ Applying building styling (red fill with 0.4 opacity)');
            return {
              fillColor: 'red',
              color: 'darkred',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
              fill: true,  // Explicitly enable fill
            };
          case 'way':
            // Generic "way" that couldn't be classified - render as line (likely a path/trail)
            console.log('[TerrainMap] ⚠️ Unclassified "way" feature, using brown line styling (likely path/trail)');
            return {
              fillColor: 'none',
              color: '#8B4513',  // Brown for unclassified paths
              weight: 2,
              fillOpacity: 0,
              opacity: 0.6,
              fill: false,  // Don't fill unclassified ways
              dashArray: '5, 5',  // Dashed line
            };
          case 'other':
            // "other" features are often paths/tracks that weren't properly classified
            console.log('[TerrainMap] Styling "other" feature as brown dashed line (likely path/track)');
            return {
              fillColor: 'none',
              color: '#8B4513',  // Brown for paths
              weight: 2,
              fillOpacity: 0,
              opacity: 0.7,
              fill: false,
              dashArray: '5, 5',  // Dashed line
            };
          default:
            console.log('[TerrainMap] Using default styling for feature type:', actualFeatureType);
            return {
              fillColor: 'purple',
              color: 'darkviolet',
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
              fill: true,  // Explicitly enable fill
            };
        }
      };

          console.log('[TerrainMap] Processing GeoJSON features...', {
            totalFeatures: data.geojson.features.length
          });

          // Pre-process GeoJSON to convert highway and waterway polygons to linestrings
          const processedGeojson = {
            ...data.geojson,
            features: data.geojson.features.map(feature => {
          const featureType = feature.properties?.feature_type;
          const tags = feature.properties?.tags || {};
          const isPolygon = feature.geometry?.type === 'Polygon';
          
          // Convert highway polygons to linestrings
          if (featureType === 'highway' && isPolygon) {
            let coords = feature.geometry.coordinates[0];
            
            // Remove duplicate last coordinate if it matches the first (closes the polygon)
            if (coords.length > 1) {
              const first = coords[0];
              const last = coords[coords.length - 1];
              if (first[0] === last[0] && first[1] === last[1]) {
                coords = coords.slice(0, -1); // Remove last coordinate
              }
            }
            
            console.log('[TerrainMap] Converting highway polygon to linestring');
            return {
              ...feature,
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            };
          }
          
          // Convert waterway (river, stream, etc.) polygons to linestrings
          if (tags.waterway && isPolygon) {
            let coords = feature.geometry.coordinates[0];
            
            // Remove duplicate last coordinate if it matches the first (closes the polygon)
            if (coords.length > 1) {
              const first = coords[0];
              const last = coords[coords.length - 1];
              if (first[0] === last[0] && first[1] === last[1]) {
                coords = coords.slice(0, -1); // Remove last coordinate
              }
            }
            
            console.log('[TerrainMap] Converting waterway polygon to linestring', { waterway: tags.waterway });
            return {
              ...feature,
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            };
          }
          
          // Convert generic "way" features that are likely paths/tracks to linestrings
          // These are often unpaved roads, trails, dirt paths that shouldn't be filled polygons
          if (featureType === 'way' && isPolygon) {
            // Check if it's a linear feature (path, track, footway, etc.)
            const isLinearFeature = tags.highway || tags.railway || tags.waterway || 
                                   tags.barrier || tags.man_made === 'pipeline' ||
                                   tags.natural === 'tree_row';
            
            if (isLinearFeature) {
              let coords = feature.geometry.coordinates[0];
              
              // Remove duplicate last coordinate if it matches the first (closes the polygon)
              if (coords.length > 1) {
                const first = coords[0];
                const last = coords[coords.length - 1];
                if (first[0] === last[0] && first[1] === last[1]) {
                  coords = coords.slice(0, -1); // Remove last coordinate
                }
              }
              
              console.log('[TerrainMap] Converting generic "way" polygon to linestring', { 
                tags,
                reason: tags.highway ? 'highway' : tags.railway ? 'railway' : 'other linear feature'
              });
              return {
                ...feature,
                geometry: {
                  type: 'LineString',
                  coordinates: coords
                }
              };
            }
          }
          
          return feature;
        })
      };

          console.log('[TerrainMap] Adding GeoJSON layer to map...');
          
          // DIAGNOSTIC: Log all feature types
          const featureTypeCounts: Record<string, number> = {};
          processedGeojson.features.forEach(feature => {
            const type = feature.properties?.feature_type || 'unknown';
            featureTypeCounts[type] = (featureTypeCounts[type] || 0) + 1;
          });
          console.log('[TerrainMap] Feature type distribution:', featureTypeCounts);
          
          // DIAGNOSTIC: Log sample water features
          const waterFeatures = processedGeojson.features.filter(f => 
            f.properties?.feature_type === 'water' || 
            f.properties?.feature_type === 'way' ||
            f.properties?.tags?.natural === 'water' ||
            f.properties?.tags?.waterway
          );
          console.log('[TerrainMap] Water features found:', waterFeatures.length);
          if (waterFeatures.length > 0) {
            console.log('[TerrainMap] Sample water feature:', {
              featureType: waterFeatures[0].properties?.feature_type,
              geometryType: waterFeatures[0].geometry?.type,
              tags: waterFeatures[0].properties?.tags
            });
          }

          // Add GeoJSON features
          const geoJsonLayer = L.geoJSON(processedGeojson, {
        style: (feature) => {
          const featureType = feature?.properties?.feature_type || 'other';
          const geometry = feature?.geometry;
          const tags = feature?.properties?.tags || {};
          return getFeatureStyle(featureType, geometry, tags);
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          let featureType = props.feature_type || 'Unknown';
          const osmId = props.osm_id || 'N/A';
          const tags = props.tags || {};
          
          // FIX: Correct feature type from OSM tags if it's 'way'
          if (featureType === 'way' || featureType === 'Unknown') {
            if (tags.highway) {
              featureType = 'highway';
            } else if (tags.railway) {
              featureType = 'railway';
            } else if (tags.waterway) {
              featureType = 'water';
            } else if (tags.natural === 'water') {
              featureType = 'water';
            } else if (tags.building) {
              featureType = 'building';
            }
          }
          
          // Better display name based on actual feature details
          let displayName = featureType;
          if (featureType === 'highway' && tags.highway) {
            // Show specific path/trail types
            const highwayType = tags.highway;
            if (highwayType === 'path') {
              displayName = 'Path';
            } else if (highwayType === 'track') {
              displayName = 'Track';
            } else if (highwayType === 'footway') {
              displayName = 'Footway';
            } else if (highwayType === 'cycleway') {
              displayName = 'Cycleway';
            } else if (highwayType === 'bridleway') {
              displayName = 'Bridleway';
            } else if (highwayType === 'steps') {
              displayName = 'Steps';
            } else {
              // Regular roads
              displayName = highwayType.charAt(0).toUpperCase() + highwayType.slice(1) + ' Road';
            }
          } else if (featureType === 'railway' && tags.railway) {
            displayName = tags.railway.charAt(0).toUpperCase() + tags.railway.slice(1);
          } else if (featureType === 'water' && tags.name) {
            displayName = tags.name;
          } else if (featureType === 'water' && tags.waterway) {
            displayName = tags.waterway.charAt(0).toUpperCase() + tags.waterway.slice(1);
          } else if (featureType === 'water' && tags.natural === 'water') {
            displayName = 'Water Body';
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
          initializingRef.current = false;
        });

    // Cleanup only on unmount
    return () => {
      console.log('[TerrainMap] Cleanup function called');
      if (mapInstanceRef.current) {
        console.log('[TerrainMap] Removing map instance');
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          initializingRef.current = false;
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
          {/* Workflow CTA Buttons - Guide user through workflow */}
          <WorkflowCTAButtons
            completedSteps={['terrain']}
            projectId={data.projectId}
            onAction={handleFollowUpAction}
          />
          
          {/* Legacy Action Buttons (if provided by orchestrator) */}
          {actions && actions.length > 0 && (
            <Box>
              <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
                Additional Actions
              </Box>
              <ActionButtons 
                actions={actions} 
                onActionClick={handleFollowUpAction}
              />
            </Box>
          )}
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
            {data.mapHtml || data.mapUrl ? (
              <iframe
                src={data.mapUrl}
                srcDoc={data.mapHtml}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Terrain Analysis Map"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : data.geojson ? (
              <div
                ref={mapRef}
                key={`terrain-map-${data.projectId}`}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  touchAction: 'none',
                  minHeight: '600px', // Prevent collapse during initialization
                }}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No map data available</p>
              </div>
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

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(TerrainMapArtifact, (prevProps, nextProps) => {
  // Only re-render if projectId changes (new terrain analysis)
  return prevProps.data.projectId === nextProps.data.projectId;
});
