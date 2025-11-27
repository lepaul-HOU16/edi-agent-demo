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
import { useProjectContext, extractProjectFromArtifact } from '../../contexts/ProjectContext';

// Custom CSS to hide popup tip and style popups + fix table header padding + FORCE CONTROLS VISIBLE
const popupStyles = `
  /* FORCE ONLY LEAFLET CONTROLS TO BE VISIBLE, NOT THE ENTIRE MAP */
  .terrain-map-container .leaflet-control-container,
  .terrain-map-container .leaflet-top,
  .terrain-map-container .leaflet-bottom,
  .terrain-map-container .leaflet-left,
  .terrain-map-container .leaflet-right {
    overflow: visible !important;
    z-index: 1000 !important;
  }
  
  .terrain-map-container .leaflet-control {
    overflow: visible !important;
  }
  
  /* FORCE controls to be visible with absolute positioning */
  .terrain-map-container .leaflet-top.leaflet-right {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
    z-index: 1000 !important;
  }
  
  .terrain-map-container .leaflet-control {
    position: relative !important;
    float: none !important;
    clear: both !important;
    margin-bottom: 10px !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
  }
  
  .terrain-map-container .leaflet-control-layers {
    display: block !important;
    width: 200px !important;
    max-width: 200px !important;
  }
  
  .terrain-map-container .leaflet-bar {
    display: block !important;
  }
  
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
  
  /* Fix dark mode Container border flash - wrapper approach */
  .terrain-artifact-dark-mode > div > div {
    border-color: #2a3642 !important;
  }
  
  .terrain-artifact-light-mode > div > div {
    border-color: #d5dbdb !important;
  }
  
  /* FORCE ALL LEAFLET CONTROLS TO BE VISIBLE - NUCLEAR OPTION */
  .leaflet-control,
  .leaflet-bar,
  .leaflet-control-layers,
  .leaflet-control-zoom,
  .leaflet-control-attribution,
  .force-visible-control {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 9999 !important;
    position: relative !important;
    pointer-events: auto !important;
  }
  
  /* Override any parent container that might hide controls */
  .leaflet-top,
  .leaflet-right,
  .leaflet-bottom,
  .leaflet-left {
    display: block !important;
    visibility: visible !important;
    pointer-events: none !important;
    position: absolute !important;
  }
  
  .leaflet-top {
    top: 0 !important;
  }
  
  .leaflet-right {
    right: 0 !important;
  }
  
  .leaflet-bottom {
    bottom: 0 !important;
  }
  
  .leaflet-left {
    left: 0 !important;
  }
  
  .leaflet-top.leaflet-right {
    top: 10px !important;
    right: 10px !important;
  }
  
  .leaflet-top.leaflet-left {
    top: 10px !important;
    left: 10px !important;
  }
  
  .leaflet-bottom.leaflet-right {
    bottom: 0 !important;
    right: 0 !important;
  }
  
  .leaflet-bottom.leaflet-left {
    bottom: 10px !important;
    left: 10px !important;
  }
  
  /* Make sure controls inside containers are visible */
  .leaflet-top > *,
  .leaflet-right > *,
  .leaflet-bottom > *,
  .leaflet-left > * {
    pointer-events: auto !important;
    display: block !important;
    visibility: visible !important;
    margin-bottom: 10px !important;
  }
  
  /* Layer control specific styling */
  .leaflet-control-layers {
    background: white !important;
    border: 2px solid #0972d3 !important;
    border-radius: 4px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
    padding: 10px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    min-width: 180px !important;
  }
  
  .leaflet-control-layers-toggle {
    display: none !important;
  }
  
  .leaflet-control-layers-expanded {
    display: block !important;
    padding: 10px !important;
  }
  
  .leaflet-control-layers-base,
  .leaflet-control-layers-overlays {
    display: block !important;
  }
  
  .leaflet-control-layers-base label,
  .leaflet-control-layers-overlays label {
    padding: 8px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    margin: 4px 0 !important;
    font-size: 14px !important;
  }
  
  .leaflet-control-layers-base label:hover,
  .leaflet-control-layers-overlays label:hover {
    background: rgba(9, 114, 211, 0.1) !important;
    border-radius: 3px !important;
  }
  
  .leaflet-control-layers input[type="radio"],
  .leaflet-control-layers input[type="checkbox"] {
    margin-right: 8px !important;
    cursor: pointer !important;
    width: 16px !important;
    height: 16px !important;
  }
  
  .leaflet-control-layers-separator {
    border-top: 1px solid #ddd !important;
    margin: 8px 0 !important;
  }
  
  /* Zoom control styling */
  .leaflet-control-zoom {
    border: 2px solid rgba(0,0,0,0.2) !important;
    border-radius: 4px !important;
  }
  
  .leaflet-control-zoom a {
    display: block !important;
    width: 30px !important;
    height: 30px !important;
    line-height: 30px !important;
    text-align: center !important;
    background: white !important;
    color: #333 !important;
    font-size: 18px !important;
    font-weight: bold !important;
  }
  
  .leaflet-control-zoom a:hover {
    background: #f4f4f4 !important;
  }
  
  /* Custom buffer control styling */
  .leaflet-bar.leaflet-control {
    background: white !important;
    border: 2px solid rgba(0,0,0,0.2) !important;
    border-radius: 4px !important;
    box-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;
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

const TerrainMapArtifact: React.FC<TerrainArtifactProps> = ({ data: rawData, actions, onFollowUpAction }) => {
  console.log('🗺️ TerrainMapArtifact: COMPONENT RENDERING');
  
  // CRITICAL FIX: Unwrap nested data structure if needed
  // The artifact comes as {type, data: {actual data}, actions}
  // But we need just the actual data
  const data = (rawData as any)?.data || rawData;
  
  // CRITICAL DEBUG: Log the actual data structure received
  console.log('🗺️ TerrainMapArtifact: Received rawData:', rawData);
  console.log('🗺️ TerrainMapArtifact: Unwrapped data:', data);
  console.log('🗺️ TerrainMapArtifact: data keys:', Object.keys(data || {}));
  console.log('🗺️ TerrainMapArtifact: data.metrics:', data?.metrics);
  console.log('🗺️ TerrainMapArtifact: data.geojson:', data?.geojson);
  console.log('🗺️ TerrainMapArtifact: data.mapHtml exists:', !!data?.mapHtml);
  console.log('🗺️ TerrainMapArtifact: data.mapUrl exists:', !!data?.mapUrl);
  console.log('🗺️ TerrainMapArtifact: data.exclusionZones:', data?.exclusionZones);
  console.log('🗺️ TerrainMapArtifact: data.exclusionZones length:', data?.exclusionZones?.length);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const perimeterLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null); // Track current tile layer
  const initializingRef = useRef<boolean>(false); // Prevent multiple initializations
  const renderCountRef = useRef<number>(0); // Track render count
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [showPerimeter, setShowPerimeter] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(document.body.getAttribute('data-awsui-mode') === 'dark');
  const pageSize = 5;

  // Get project context
  const { setActiveProject } = useProjectContext();

  // Log every render to diagnose the flashing
  renderCountRef.current += 1;
  console.log(`[TerrainMap] RENDER #${renderCountRef.current}`, {
    projectId: data.projectId,
    hasMapInstance: !!mapInstanceRef.current,
    isInitializing: initializingRef.current
  });

  // Extract and set project context when data changes
  useEffect(() => {
    // Enhance data with normalized coordinates if available
    const enhancedData = { ...data };
    if (data.coordinates) {
      enhancedData.coordinates = {
        latitude: data.coordinates.lat,
        longitude: data.coordinates.lng
      };
      if (!enhancedData.location) {
        enhancedData.location = `${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lng.toFixed(4)}`;
      }
    }
    
    const projectInfo = extractProjectFromArtifact(enhancedData, 'TerrainMapArtifact');
    if (projectInfo) {
      setActiveProject(projectInfo);
    } else {
      console.warn('⚠️ [TerrainMapArtifact] Failed to extract project information from artifact data');
    }
  }, [data, setActiveProject]);

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
              smoothWheelZoom: true,  // Enable smooth scroll zoom
              smoothSensitivity: 2,   // Higher = more responsive
              boxZoom: true,
              keyboard: true,
              zoomControl: true,
              attributionControl: true,
              zoomDelta: 0.75,        // Larger increments for faster zoom
              zoomSnap: 0.25,         // Balanced fractional zoom levels
              wheelPxPerZoomLevel: 30, // Even less pixels = faster zoom
              zoomAnimation: true,    // Enable smooth zoom animation
              zoomAnimationThreshold: 4, // Always animate zoom
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

          // Add map tiles - use CartoDB for light mode (more reliable than OSM)
          const isDarkMode = document.body.getAttribute('data-awsui-mode') === 'dark';
          const tileUrl = isDarkMode 
            ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
          const attribution = isDarkMode
            ? '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors'
            : '© OpenStreetMap contributors © CARTO';
          
          let osmLayer = L.tileLayer(tileUrl, {
            attribution,
            maxZoom: 19,
            subdomains: 'abcd',
          });

          // Add satellite basemap as alternative option
          const satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: 'Esri',
              maxZoom: 19,
            }
          );

          // Add OSM as default (as requested)
          osmLayer.addTo(map);
          tileLayerRef.current = osmLayer; // Store reference to current tile layer
          console.log('[TerrainMap] OSM layer added as default');
          console.log('[TerrainMap] Tile URL:', tileUrl);
          console.log('[TerrainMap] Dark mode:', isDarkMode);

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
                  console.log('[TerrainMap] Switched to street map');
                } else {
                  // Switch to satellite
                  map.removeLayer(osmLayer);
                  map.addLayer(satelliteLayer);
                  button.innerHTML = '🗺️';
                  isSatellite = true;
                  console.log('[TerrainMap] Switched to satellite');
                }
                return false;
              };
              
              return container;
            }
          });
          
          const satelliteControl = new SatelliteControl();
          map.addControl(satelliteControl);
          console.log('[TerrainMap] Satellite toggle control added');

          // Add custom buffer zones toggle control - ICON ONLY, SAME WIDTH AS ZOOM
          const BufferControl = L.Control.extend({
            options: {
              position: 'topleft'  // BELOW satellite control
            },
            
            onAdd: function() {
              const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              const button = L.DomUtil.create('a', '', container);
              
              // Match zoom button styling EXACTLY - same width, icon only
              button.href = '#';
              button.title = 'Toggle exclusion zone buffers';
              button.innerHTML = '⚠️';
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
              
              button.onclick = function(e) {
                e.preventDefault();
                const buffers = perimeterLayerRef.current;
                if (buffers && buffers.length > 0) {
                  // Check if first buffer is visible
                  const isVisible = map.hasLayer(buffers[0]);
                  
                  if (isVisible) {
                    // Hide all buffers
                    buffers.forEach((buffer: any) => {
                      if (map.hasLayer(buffer)) {
                        map.removeLayer(buffer);
                      }
                    });
                    button.style.opacity = '0.5';
                    console.log('[TerrainMap] Buffer zones hidden');
                  } else {
                    // Show all buffers
                    buffers.forEach((buffer: any) => {
                      if (!map.hasLayer(buffer)) {
                        map.addLayer(buffer);
                      }
                    });
                    button.style.opacity = '1';
                    console.log('[TerrainMap] Buffer zones shown');
                  }
                }
                return false;
              };
              
              return container;
            }
          });
          
          const bufferControl = new BufferControl();
          map.addControl(bufferControl);
          console.log('[TerrainMap] Buffer zones toggle control added');
          
          // DEBUG: Check if controls are actually in the DOM
          setTimeout(() => {
            const allControls = mapRef.current?.querySelectorAll('.leaflet-control');
            console.log('[TerrainMap] ===== CONTROL DEBUG =====');
            console.log('[TerrainMap] Total controls found:', allControls?.length);
            allControls?.forEach((control, index) => {
              console.log(`[TerrainMap] Control ${index}:`, {
                className: control.className,
                display: (control as HTMLElement).style.display,
                visibility: (control as HTMLElement).style.visibility,
                zIndex: (control as HTMLElement).style.zIndex,
                position: (control as HTMLElement).style.position,
                innerHTML: control.innerHTML.substring(0, 100)
              });
            });
            
            const topRight = mapRef.current?.querySelector('.leaflet-top.leaflet-right');
            console.log('[TerrainMap] Top-right container:', {
              exists: !!topRight,
              display: (topRight as HTMLElement)?.style.display,
              visibility: (topRight as HTMLElement)?.style.visibility,
              childCount: topRight?.children.length,
              computedStyle: topRight ? window.getComputedStyle(topRight as HTMLElement).display : 'N/A',
              offsetWidth: (topRight as HTMLElement)?.offsetWidth,
              offsetHeight: (topRight as HTMLElement)?.offsetHeight
            });
            
            // Check each control's computed styles and position
            allControls?.forEach((control, index) => {
              const computed = window.getComputedStyle(control as HTMLElement);
              const rect = (control as HTMLElement).getBoundingClientRect();
              console.log(`[TerrainMap] Control ${index} computed:`, {
                display: computed.display,
                visibility: computed.visibility,
                opacity: computed.opacity,
                zIndex: computed.zIndex,
                position: computed.position,
                top: computed.top,
                right: computed.right,
                width: rect.width,
                height: rect.height,
                isVisible: rect.width > 0 && rect.height > 0
              });
            });
          }, 1000);

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
            // Check if it's a line geometry - don't fill lines
            if (isLine) {
              return {
                color: '#808080',  // Gray line
                weight: 2,
                opacity: 0.6,
                fill: false,
              };
            }
            // Polygon features get filled
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
          
          // DIAGNOSTIC: Log feature types from OSM tags (since backend doesn't type them)
          const featureTypeCounts: Record<string, number> = {};
          const detectedTypes: Record<string, number> = {};
          
          processedGeojson.features.forEach(feature => {
            const backendType = feature.properties?.feature_type || 'unknown';
            const tags = feature.properties?.tags || {};
            
            // Count backend types
            featureTypeCounts[backendType] = (featureTypeCounts[backendType] || 0) + 1;
            
            // Detect actual types from tags
            let detectedType = 'other';
            if (tags.building) detectedType = 'building';
            else if (tags.natural === 'water' || tags.water) detectedType = 'water';
            else if (tags.waterway) detectedType = 'waterway';
            else if (tags.highway) detectedType = 'highway';
            else if (tags.railway) detectedType = 'railway';
            else if (tags.landuse) detectedType = 'landuse';
            else if (tags.amenity) detectedType = 'amenity';
            else if (tags.leisure) detectedType = 'leisure';
            else if (tags.man_made) detectedType = 'man_made';
            
            detectedTypes[detectedType] = (detectedTypes[detectedType] || 0) + 1;
          });
          
          console.log('[TerrainMap] ═══════════════════════════════════════');
          console.log('[TerrainMap] BACKEND FEATURE TYPES (from feature_type):');
          console.log('[TerrainMap] ═══════════════════════════════════════');
          Object.entries(featureTypeCounts).forEach(([type, count]) => {
            console.log(`[TerrainMap]   ${type}: ${count} features`);
          });
          console.log('[TerrainMap] ═══════════════════════════════════════');
          console.log('[TerrainMap] DETECTED TYPES (from OSM tags):');
          console.log('[TerrainMap] ═══════════════════════════════════════');
          Object.entries(detectedTypes).forEach(([type, count]) => {
            console.log(`[TerrainMap]   ${type}: ${count} features`);
          });
          console.log('[TerrainMap] ═══════════════════════════════════════');
          console.log('[TerrainMap] Total features to render:', processedGeojson.features.length);
          
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
          });
          
          // Add visual buffer zones using Turf.js
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
                console.warn('[TerrainMap] Could not create buffer for feature:', e);
              }
            });
          }
        }
      }).addTo(map);
          
          console.log('[TerrainMap] GeoJSON layer added successfully', {
            layerCount: Object.keys((geoJsonLayer as any)._layers).length
          });

          // Store buffer layers for toggle control
          const bufferLayers: any[] = [];
          perimeterLayerRef.current = bufferLayers;

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

  // Handle theme changes for tile layer
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newIsDark = customEvent.detail?.isDark ?? (document.body.getAttribute('data-awsui-mode') === 'dark');
      console.log('[TerrainMap] Theme change event received, newIsDark:', newIsDark);
      
      if (!mapInstanceRef.current) {
        console.log('[TerrainMap] Map not ready yet, skipping tile update');
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
          console.log('[TerrainMap] Removed old tile layer');
        }
        
        // Add new tile layer
        const newTileLayer = L.tileLayer(newTileUrl, {
          attribution: newAttribution,
          maxZoom: 19,
          subdomains: 'abcd',
        });
        newTileLayer.addTo(mapInstanceRef.current);
        tileLayerRef.current = newTileLayer; // Store reference
        console.log('[TerrainMap] Theme changed, tile layer updated to:', newIsDark ? 'dark' : 'light');
      });
      
      // Update isDarkMode state to trigger wrapper class change
      setIsDarkMode(newIsDark);
    };
    
    window.addEventListener('themechange', handleThemeChange);
    console.log('[TerrainMap] Theme change listener registered');
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      console.log('[TerrainMap] Theme change listener removed');
    };
  }, []);

  const handleFollowUpAction = (action: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(action);
    }
  };

  return (
    <div className={isDarkMode ? 'terrain-artifact-dark-mode' : 'terrain-artifact-light-mode'}>
      <Container
          header={
            <Header
              variant="h2"
              description={data.message || 'Real-time terrain analysis using OpenStreetMap data'}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Badge color="green">
                    {data.metrics?.totalFeatures || data.geojson?.features?.length || 0} Features Found
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
          <Box>
            <WorkflowCTAButtons
              completedSteps={['terrain']}
              projectId={data.projectId}
              onAction={handleFollowUpAction}
            />
          </Box>
          
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
        <ColumnLayout columns={4} variant="text-grid" minColumnWidth={150}>
          <div>
            <Box variant="awsui-key-label">Coordinates</Box>
            <div style={{ wordBreak: 'break-word', fontSize: '14px' }}>
              {data.coordinates?.lat?.toFixed(6) || 'N/A'}, {data.coordinates?.lng?.toFixed(6) || 'N/A'}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Features</Box>
            <div>{data.metrics?.totalFeatures || data.geojson?.features?.length || 0}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Analysis Radius</Box>
            <div>{data.metrics?.radiusKm || 5} km</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Data Source</Box>
            <div style={{ wordBreak: 'break-word' }}>OpenStreetMap</div>
          </div>
        </ColumnLayout>

        {/* Feature Breakdown */}
        {data.metrics?.featuresByType && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Feature Breakdown
            </Box>
            <ColumnLayout columns={4} variant="text-grid" minColumnWidth={120}>
              {data.metrics?.featuresByType && Object.entries(data.metrics.featuresByType).map(([type, count]) => (
                <div key={type}>
                  <Box variant="small" color="text-body-secondary" style={{ wordBreak: 'break-word' }}>{type}</Box>
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
              maxWidth: '100%',
              height: '600px',
              border: isDarkMode 
                ? '1px solid #414d5c' 
                : '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
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
                className="terrain-map-container"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  touchAction: 'none',
                  minHeight: '600px',
                  overflow: 'hidden', // Keep map contained
                  borderRadius: '4px',
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
        {data.geojson?.features && data.geojson.features.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Features ({data.geojson.features.length})
            </Box>
            <Table
              columnDefinitions={[
                {
                  id: 'type',
                  header: 'Type',
                  cell: (item: GeoJSONFeature) => {
                    const tags = item.properties?.tags || {};
                    let featureType = item.properties?.feature_type || 'way';
                    
                    // Detect actual type from OSM tags
                    if (tags.building) featureType = 'building';
                    else if (tags.natural === 'water' || tags.water) featureType = 'water';
                    else if (tags.waterway) featureType = 'waterway';
                    else if (tags.highway) featureType = 'highway';
                    else if (tags.railway) featureType = 'railway';
                    else if (tags.landuse) featureType = 'landuse';
                    else if (tags.amenity) featureType = 'amenity';
                    else if (tags.leisure) featureType = 'leisure';
                    else if (tags.man_made) featureType = 'man_made';
                    
                    return (
                      <Box padding={{ left: 's' }}>
                        {featureType}
                      </Box>
                    );
                  },
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
              items={(data.geojson?.features || []).slice(
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

        {/* Project ID and Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box variant="small" color="text-body-secondary">
            Project ID: {data.projectId}
          </Box>
          {data.geojson?.features && data.geojson.features.length > 0 && (
            <Pagination
              currentPageIndex={currentPageIndex}
              pagesCount={Math.ceil((data.geojson?.features?.length || 0) / pageSize)}
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
              ariaLabels={{
                nextPageLabel: 'Next page',
                previousPageLabel: 'Previous page',
                pageLabel: (pageNumber) => `Page ${pageNumber}`,
              }}
            />
          )}
        </div>
      </SpaceBetween>
    </Container>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(TerrainMapArtifact, (prevProps, nextProps) => {
  // Only re-render if projectId changes (new terrain analysis)
  return prevProps.data.projectId === nextProps.data.projectId;
});
