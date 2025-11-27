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
import { useProjectContext, extractProjectFromArtifact } from '../../contexts/ProjectContext';

// CSS to force map controls visible WITHOUT bleeding the map
const mapControlStyles = `
  .layout-map-container .leaflet-control-container,
  .layout-map-container .leaflet-top,
  .layout-map-container .leaflet-bottom,
  .layout-map-container .leaflet-left,
  .layout-map-container .leaflet-right {
    overflow: visible !important;
    z-index: 1000 !important;
  }
  
  .layout-map-container .leaflet-control {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 9999 !important;
    overflow: visible !important;
  }
  
  /* FORCE controls to be visible with absolute positioning */
  .layout-map-container .leaflet-top.leaflet-right {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
    z-index: 1000 !important;
  }
  
  .layout-map-container .leaflet-control {
    position: relative !important;
    float: none !important;
    clear: both !important;
    margin-bottom: 10px !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
  }
  
  .layout-map-container .leaflet-control-layers {
    display: block !important;
    width: 200px !important;
    max-width: 200px !important;
  }
  
  .layout-map-container .leaflet-bar {
    display: block !important;
  }
`;

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
  const tileLayerRef = useRef<any>(null); // Track current tile layer
  const initializingRef = useRef<boolean>(false); // Prevent multiple initializations
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(document.body.getAttribute('data-awsui-mode') === 'dark');

  // Get project context
  const { setActiveProject } = useProjectContext();

  // Inject map control styles
  useEffect(() => {
    const styleId = 'layout-map-control-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = mapControlStyles;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Extract and set project context when data changes
  useEffect(() => {
    // Enhance data with turbine position coordinates if available
    const enhancedData = { ...data };
    if (data.turbinePositions && data.turbinePositions.length > 0) {
      const firstTurbine = data.turbinePositions[0];
      enhancedData.coordinates = {
        latitude: firstTurbine.lat,
        longitude: firstTurbine.lng
      };
      if (!enhancedData.location) {
        enhancedData.location = `${firstTurbine.lat.toFixed(4)}, ${firstTurbine.lng.toFixed(4)}`;
      }
    }
    
    const projectInfo = extractProjectFromArtifact(enhancedData, 'LayoutMapArtifact');
    if (projectInfo) {
      setActiveProject(projectInfo);
    } else {
      console.warn('⚠️ [LayoutMapArtifact] Failed to extract project information from artifact data');
    }
  }, [data, setActiveProject]);

  // Debug logging to track renders
  console.log('🗺️ LayoutMapArtifact RENDER:', {
    projectId: data.projectId,
    turbineCount: data.turbineCount,
    hasMapHtml: !!data.mapHtml,
    hasGeojson: !!data.geojson,
    geojsonFeatureCount: data.geojson?.features?.length,
    hasMetadata: !!data.metadata,
    algorithm: data.metadata?.algorithm,
    algorithmProof: data.metadata?.algorithm_proof,
    constraintsApplied: data.metadata?.constraints_applied,
    timestamp: new Date().toISOString()
  });
  
  // CRITICAL DEBUG: Log all features to see what we're getting
  if (data.geojson?.features) {
    console.log('[LayoutMap] ===== GEOJSON FEATURES DEBUG =====');
    console.log('[LayoutMap] Total features:', data.geojson.features.length);
    
    const featureTypes: Record<string, number> = {};
    data.geojson.features.forEach((f: any) => {
      const type = f.properties?.type || f.properties?.feature_type || 'unknown';
      featureTypes[type] = (featureTypes[type] || 0) + 1;
    });
    
    console.log('[LayoutMap] Feature types:', featureTypes);
    console.log('[LayoutMap] First 3 features:', data.geojson.features.slice(0, 3));
    console.log('[LayoutMap] =====================================');
  }

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
          smoothWheelZoom: true,  // Enable smooth scroll zoom
          smoothSensitivity: 2,   // Higher = more responsive
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          zoomControl: true,
          attributionControl: true,
          zoomDelta: 0.75,        // Larger increments for faster zoom
          zoomSnap: 0.25,         // Balanced fractional zoom levels
          wheelPxPerZoomLevel: 30, // Even less pixels = faster zoom
          zoomAnimation: true,    // Enable smooth zoom animation (prevents flashing)
          zoomAnimationThreshold: 4, // Always animate zoom
          fadeAnimation: true,    // Enable fade animation for smoother transitions
          markerZoomAnimation: true, // Enable marker zoom animation
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

      // Add OpenStreetMap tiles - use medium-dark gray tiles for dark mode
      const isDarkMode = document.body.getAttribute('data-awsui-mode') === 'dark';
      const tileUrl = isDarkMode 
        ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      const attribution = isDarkMode
        ? '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors'
        : '© OpenStreetMap contributors';
      
      const osmLayer = L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
        subdomains: 'abcd',
      });

      // Add OSM as default (user preference)
      osmLayer.addTo(map);
      tileLayerRef.current = osmLayer; // Store reference to current tile layer
      console.log('[LayoutMap] OSM layer added');
      console.log('[LayoutMap] Tile URL:', tileUrl);
      console.log('[LayoutMap] Dark mode:', isDarkMode);

      // Create custom satellite toggle control - ICON ONLY, SAME WIDTH AS ZOOM
      const SatelliteControl = L.Control.extend({
        options: {
          position: 'topleft'  // BELOW zoom controls
        },
        
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', '', container);
          
          // Match zoom button styling EXACTLY - same width, icon only
          button.href = '#';
          button.title = 'Toggle satellite view';
          button.innerHTML = '🛰️';
          button.style.width = '30px';
          button.style.height = '30px';
          button.style.lineHeight = '30px';
          button.style.display = 'block';
          button.style.textAlign = 'center';
          button.style.textDecoration = 'none';
          button.style.fontSize = '18px';
          
          // Prevent map interactions when clicking the control
          L.DomEvent.disableClickPropagation(button);
          L.DomEvent.disableScrollPropagation(button);
          
          let isSatellite = false;
          
          button.onclick = function(e) {
            e.preventDefault();
            if (isSatellite) {
              // Switch to street map
              map.removeLayer(satelliteLayer);
              map.addLayer(osmLayer);
              button.innerHTML = '🛰️';
              isSatellite = false;
              console.log('[LayoutMap] Switched to street map');
            } else {
              // Switch to satellite
              map.removeLayer(osmLayer);
              map.addLayer(satelliteLayer);
              button.innerHTML = '🗺️';
              isSatellite = true;
              console.log('[LayoutMap] Switched to satellite');
            }
            return false;
          };
          
          return container;
        }
      });
      
      const satelliteControl = new SatelliteControl();
      map.addControl(satelliteControl);
      console.log('[LayoutMap] Satellite toggle control added');

      // Style function matching TerrainMapArtifact exactly
      const getFeatureStyle = (featureType: string, geometry: any, tags: any = {}) => {
        const isLine = geometry?.type === 'LineString' || geometry?.type === 'MultiLineString';
        
        // CRITICAL FIX: Backend returns ALL features as 'way' without proper typing
        // We MUST determine actual type from OSM tags
        let actualFeatureType = featureType;
        
        // ALWAYS check OSM tags to determine actual feature type (backend doesn't do this)
        if (tags.building) {
          actualFeatureType = 'building';
        } else if (tags.natural === 'water' || tags.water) {
          actualFeatureType = 'water';
        } else if (tags.waterway) {
          actualFeatureType = 'water';
        } else if (tags.highway) {
          actualFeatureType = 'highway';
        } else if (tags.railway) {
          actualFeatureType = 'railway';
        } else if (tags.landuse === 'industrial' || tags.landuse === 'commercial') {
          actualFeatureType = 'landuse';
        } else if (tags.amenity) {
          actualFeatureType = 'amenity';
        } else if (tags.leisure) {
          actualFeatureType = 'leisure';
        } else if (tags.man_made) {
          actualFeatureType = 'man_made';
        } else {
          // Keep as 'way' or 'other' if we can't determine type
          actualFeatureType = featureType === 'way' ? 'other' : featureType;
        }
        
        switch (actualFeatureType) {
          case 'water':
            // Waterways (rivers, streams) should be lines, not filled polygons
            if (tags.waterway) {
              return {
                fillColor: 'none',
                color: '#1E90FF',  // Dodger blue for waterways
                weight: 3,
                fillOpacity: 0,
                opacity: 0.8,
                fill: false,
              };
            }
            // Water bodies (lakes, ponds) get filled
            return {
              fillColor: '#4169E1',  // Royal blue
              color: '#00008B',  // Dark blue border
              weight: 2,
              fillOpacity: 0.5,
              opacity: 0.9,
              fill: true,
            };
          case 'building':
            return {
              fillColor: '#DC143C',  // Crimson red
              color: '#8B0000',  // Dark red border
              weight: 1,
              fillOpacity: 0.6,
              opacity: 0.9,
              fill: true,
            };
          case 'highway':
            const highwayType = tags.highway;
            // Major roads
            if (highwayType === 'motorway' || highwayType === 'trunk' || highwayType === 'primary') {
              return {
                color: '#FF4500',  // Orange-red for major roads
                weight: 4,
                opacity: 0.9,
                fill: false,
              };
            }
            // Secondary roads
            if (highwayType === 'secondary' || highwayType === 'tertiary') {
              return {
                color: '#FFA500',  // Orange for secondary roads
                weight: 3,
                opacity: 0.8,
                fill: false,
              };
            }
            // Paths and trails
            if (highwayType === 'path' || highwayType === 'track' || 
                highwayType === 'footway' || highwayType === 'bridleway' ||
                highwayType === 'cycleway' || highwayType === 'steps') {
              return {
                color: '#8B4513',  // Brown for paths
                weight: 2,
                opacity: 0.7,
                fill: false,
                dashArray: '5, 5',
              };
            }
            // Default roads
            return {
              color: '#FFD700',  // Gold for other roads
              weight: 2,
              opacity: 0.8,
              fill: false,
            };
          case 'railway':
            return {
              color: '#696969',  // Dim gray
              weight: 2,
              opacity: 0.8,
              fill: false,
              dashArray: '8, 4',
            };
          case 'landuse':
            return {
              fillColor: '#DDA0DD',  // Plum for landuse
              color: '#9370DB',  // Medium purple border
              weight: 1,
              fillOpacity: 0.3,
              opacity: 0.7,
              fill: true,
            };
          case 'amenity':
            return {
              fillColor: '#FFB6C1',  // Light pink for amenities
              color: '#FF69B4',  // Hot pink border
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
              fill: true,
            };
          case 'leisure':
            return {
              fillColor: '#90EE90',  // Light green for leisure
              color: '#228B22',  // Forest green border
              weight: 2,
              fillOpacity: 0.4,
              opacity: 0.8,
              fill: true,
            };
          case 'man_made':
            return {
              fillColor: '#A9A9A9',  // Dark gray for man-made
              color: '#2F4F4F',  // Dark slate gray border
              weight: 2,
              fillOpacity: 0.5,
              opacity: 0.8,
              fill: true,
            };
          case 'other':
          default:
            // Minimal styling for unclassified features
            return {
              fillColor: '#D3D3D3',  // Light gray
              color: '#808080',  // Gray border
              weight: 1,
              fillOpacity: 0.2,
              opacity: 0.5,
              fill: true,
            };
        }
      };

      // Pre-process GeoJSON to convert highway and waterway polygons to linestrings
      const processedGeojson = {
        ...data.geojson,
        features: data.geojson.features.map(feature => {
          const featureType = feature.properties?.feature_type || feature.properties?.type;
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
                coords = coords.slice(0, -1);
              }
            }
            
            console.log('[LayoutMap] Converting highway polygon to linestring');
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
                coords = coords.slice(0, -1);
              }
            }
            
            console.log('[LayoutMap] Converting waterway polygon to linestring', { waterway: tags.waterway });
            return {
              ...feature,
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            };
          }
          
          // Convert generic "way" features that are likely paths/tracks to linestrings
          if (featureType === 'way' && isPolygon) {
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
                  coords = coords.slice(0, -1);
                }
              }
              
              console.log('[LayoutMap] Converting generic "way" polygon to linestring', { 
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

      // Separate terrain features from turbine features
      const turbineFeatures = processedGeojson.features.filter((f: any) => 
        f.properties?.type === 'turbine' || 
        f.properties?.turbine_id !== undefined ||
        (f.geometry?.type === 'Point' && !f.properties?.feature_type)  // Points without feature_type are turbines
      );
      const terrainFeatures = processedGeojson.features.filter((f: any) => 
        !turbineFeatures.includes(f)
      );

      console.log('[LayoutMap] Feature breakdown:', {
        total: processedGeojson.features.length,
        terrain: terrainFeatures.length,
        turbines: turbineFeatures.length,
        firstTurbine: turbineFeatures[0]?.properties,
        firstTerrain: terrainFeatures[0]?.properties
      });

      // STEP 1: Render terrain features with exact same styling as TerrainMapArtifact
      const terrainLayers: any[] = [];
      const bufferLayers: any[] = [];
      
      // Add GeoJSON terrain features with proper styling
      if (terrainFeatures.length > 0) {
        const terrainGeoJSON = {
          type: 'FeatureCollection',
          features: terrainFeatures
        };
        
        const geoJsonLayer = L.geoJSON(terrainGeoJSON, {
          style: (feature) => {
            const featureType = feature?.properties?.feature_type || feature?.properties?.type || 'other';
            const geometry = feature?.geometry;
            const tags = feature?.properties?.tags || {};
            return getFeatureStyle(featureType, geometry, tags);
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            let featureType = props.feature_type || props.type || 'Unknown';
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
                displayName = highwayType.charAt(0).toUpperCase() + highwayType.slice(1) + ' Road';
              }
            } else if (featureType === 'water' && tags.name) {
              displayName = tags.name;
            } else if (featureType === 'water' && tags.waterway) {
              displayName = tags.waterway.charAt(0).toUpperCase() + tags.waterway.slice(1);
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
            
            if (tags.name && displayName !== tags.name) {
              popupContent += `<br/><strong>Name:</strong> ${tags.name}`;
            }
            if (tags.building) {
              popupContent += `<br/><strong>Building Type:</strong> ${tags.building}`;
            }
            if (tags.natural) {
              popupContent += `<br/><strong>Natural:</strong> ${tags.natural}`;
            }
            if (tags.waterway) {
              popupContent += `<br/><strong>Waterway:</strong> ${tags.waterway}`;
            }
            
            popupContent += `
                </div>
              </div>
            `;
            
            layer.bindPopup(popupContent, {
              maxWidth: 400,
              className: 'custom-popup'
            });
            
            // Add visual buffer zones using Turf.js (matching TerrainMapArtifact)
            const bufferMeters = feature.properties?.bufferMeters || 0;
            if (bufferMeters > 0) {
              import('@turf/turf').then((turf) => {
                try {
                  // Create buffer polygon around the feature
                  const buffered = turf.buffer(feature as any, bufferMeters / 1000, { units: 'kilometers' });
                  
                  if (buffered) {
                    // Render buffer with tinted color - NON-INTERACTIVE so clicks pass through
                    const bufferLayer = L.geoJSON(buffered, {
                      style: {
                        color: feature.properties?.color || '#FF0000',
                        fillColor: feature.properties?.fillColor || '#FF000020',
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: '5, 5'
                      },
                      interactive: false,  // CRITICAL: Make buffers non-interactive so feature clicks work
                      pane: 'tilePane'     // CRITICAL: Put on tile pane (below overlays) so features are clickable
                    }).addTo(map);
                    
                    // Store buffer layer for toggle control
                    bufferLayers.push(bufferLayer);
                  }
                } catch (e) {
                  console.warn('[LayoutMap] Could not create buffer for feature:', e);
                }
              });
            }
          }
        }).addTo(map);
        
        terrainLayers.push(geoJsonLayer);
      }

      console.log('[LayoutMap] Rendered terrain layers:', terrainLayers.length);

      console.log('[LayoutMap] Rendered terrain layers:', terrainLayers.length);

      // STEP 2: Render turbine markers with labels on top of terrain features
      const markers: any[] = [];
      turbineFeatures.forEach((feature: any, index: number) => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties || {};
        const turbineLabel = props.turbine_id || `T${index + 1}`;
        
        // Create custom icon with label
        const customIcon = L.divIcon({
          className: 'custom-turbine-marker',
          html: `
            <div style="
              position: relative;
              width: 30px;
              height: 30px;
            ">
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 30px;
                height: 30px;
                background-color: #0972d3;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
              <div style="
                position: absolute;
                top: 32px;
                left: 50%;
                transform: translateX(-50%);
                background-color: white;
                color: #0972d3;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                font-family: 'Amazon Ember', Arial, sans-serif;
              ">${turbineLabel}</div>
            </div>
          `,
          iconSize: [30, 50],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15]
        });
        
        const marker = L.marker([coords[1], coords[0]], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="
              min-width: 200px;
              padding: 12px;
              font-family: 'Amazon Ember', Arial, sans-serif;
            ">
              <div style="font-size: 16px; font-weight: bold; color: #0972d3; margin-bottom: 8px;">
                ${turbineLabel}
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

  // Handle theme changes for tile layer
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newIsDark = customEvent.detail?.isDark ?? (document.body.getAttribute('data-awsui-mode') === 'dark');
      console.log('[LayoutMap] Theme change event received, newIsDark:', newIsDark);
      
      if (!mapInstanceRef.current) {
        console.log('[LayoutMap] Map not ready yet, skipping tile update');
        return;
      }
      
      import('leaflet').then((L) => {
        if (!mapInstanceRef.current) return;
        
        const newTileUrl = newIsDark 
          ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        const newAttribution = newIsDark
          ? '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors'
          : '© OpenStreetMap contributors';
        
        // Remove current tile layer if it exists
        if (tileLayerRef.current) {
          mapInstanceRef.current.removeLayer(tileLayerRef.current);
          console.log('[LayoutMap] Removed old tile layer');
        }
        
        // Add new tile layer
        const newTileLayer = L.tileLayer(newTileUrl, {
          attribution: newAttribution,
          maxZoom: 19,
          subdomains: 'abcd',
        });
        newTileLayer.addTo(mapInstanceRef.current);
        tileLayerRef.current = newTileLayer; // Store reference
        console.log('[LayoutMap] Theme changed, tile layer updated to:', newIsDark ? 'dark' : 'light');
      });
    };
    
    window.addEventListener('themechange', handleThemeChange);
    console.log('[LayoutMap] Theme change listener registered');
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      console.log('[LayoutMap] Theme change listener removed');
    };
  }, []);

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
        {(() => {
          const steps = data.completedSteps || ['terrain', 'layout'];
          console.log('[LayoutMap] Workflow CTA - completedSteps:', steps);
          return (
            <WorkflowCTAButtons
              completedSteps={steps}
              projectId={data.projectId}
              onAction={handleActionClick}
            />
          );
        })()}
        
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
        <ColumnLayout columns={4} variant="text-grid" minColumnWidth={150}>
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
              className="layout-map-container"
              style={{
                width: '100%',
                height: '500px',
                border: isDarkMode 
                  ? '1px solid #414d5c' 
                  : '1px solid #e9ebed',
                borderRadius: '4px',
                position: 'relative',
                zIndex: 0,
                cursor: 'grab',
                overflow: 'hidden', // Keep map contained
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
