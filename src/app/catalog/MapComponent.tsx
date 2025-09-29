'use client';

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from 'maplibre-gl-draw';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { area } from '@turf/area';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css';

interface PolygonFilter {
  id: string;
  geometry: GeoJSON.Polygon;
  name?: string;
  metadata?: any;
  createdAt: Date;
  area?: number; // in square kilometers
}

interface MapComponentProps {
  mapColorScheme: 'Light' | 'Dark';
  onPolygonCreate: (polygon: PolygonFilter) => void;
  onPolygonDelete: (deletedIds: string[]) => void;
  onPolygonUpdate: (updatedPolygon: PolygonFilter) => void;
}

export interface MapComponentRef {
  updateMapData: (geoJsonData: any) => void;
  fitBounds: (bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }) => void;
  toggleWeatherLayer: (layerType: string, visible: boolean) => void;
  getWeatherLayers: () => string[];
}

const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(({
  mapColorScheme,
  onPolygonCreate,
  onPolygonDelete,
  onPolygonUpdate
}, ref) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // AWS configuration for Amazon Location Service
  const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const style = "Standard";

  // Simple source and layer IDs
  const WELLS_SOURCE_ID = 'wells';
  const WELLS_LAYER_ID = 'wells-layer';
  
  // Weather layer IDs
  const WEATHER_LAYERS = {
    temperature: { sourceId: 'weather-temperature', layerId: 'temperature-layer' },
    precipitation: { sourceId: 'weather-precipitation', layerId: 'precipitation-layer' },
    wind: { sourceId: 'weather-wind', layerId: 'wind-layer' },
    pressure: { sourceId: 'weather-pressure', layerId: 'pressure-layer' },
    humidity: { sourceId: 'weather-humidity', layerId: 'humidity-layer' }
  };

  // Polygon event handlers with debugging
  const handlePolygonCreate = useCallback((e: any) => {
    console.log('🗺️ MAP COMPONENT: Polygon create event triggered');
    console.log('🗺️ Event data:', e);
    
    const polygonData = e.features[0];
    const polygonId = `polygon-${Date.now()}`;
    
    console.log('🗺️ Creating polygon with ID:', polygonId);
    console.log('🗺️ Polygon geometry:', polygonData.geometry);
    
    const newPolygon: PolygonFilter = {
      id: polygonId,
      geometry: polygonData.geometry,
      name: `Area ${Date.now()}`,
      createdAt: new Date(),
      area: area(polygonData.geometry) / 1000000 // Convert to km²
    };
    
    console.log('🗺️ Calling onPolygonCreate with:', newPolygon);
    onPolygonCreate(newPolygon);
    
    // Check if wells are still on map after polygon creation
    setTimeout(() => {
      if (mapRef.current) {
        const wellsSource = mapRef.current.getSource(WELLS_SOURCE_ID);
        console.log('🗺️ Wells source after polygon creation:', !!wellsSource);
        if (wellsSource) {
          const data = (wellsSource as any)._data;
          console.log('🗺️ Wells data after polygon creation:', data?.features?.length || 0, 'features');
        }
      }
    }, 100);
  }, [onPolygonCreate]);

  const handlePolygonDeleteEvent = useCallback((e: any) => {
    const deletedIds = e.features.map((f: any) => f.id);
    onPolygonDelete(deletedIds);
  }, [onPolygonDelete]);

  const handlePolygonUpdateEvent = useCallback((e: any) => {
    const updatedFeature = e.features[0];
    const updatedPolygon: PolygonFilter = {
      id: updatedFeature.id,
      geometry: updatedFeature.geometry,
      name: `Area ${updatedFeature.id}`,
      createdAt: new Date(),
      area: area(updatedFeature.geometry) / 1000000 // Convert to km²
    };
    onPolygonUpdate(updatedPolygon);
  }, [onPolygonUpdate]);

  // Function to render weather layers on the map
  const renderWeatherLayers = useCallback((weatherLayers: any, weatherFeatures: any[]) => {
    if (!mapRef.current) return;
    
    console.log('🌤️ Rendering weather layers:', Object.keys(weatherLayers));
    
    // Group weather features by layer type
    const featuresByLayer: { [key: string]: any[] } = {};
    weatherFeatures.forEach(feature => {
      const layerType = feature.properties?.layer;
      if (layerType) {
        if (!featuresByLayer[layerType]) {
          featuresByLayer[layerType] = [];
        }
        featuresByLayer[layerType].push(feature);
      }
    });
    
    // Render each weather layer
    Object.entries(weatherLayers).forEach(([layerType, config]: [string, any]) => {
      if (layerType === 'additional') {
        // Handle additional layers for progressive disclosure
        Object.entries(config).forEach(([additionalType, additionalConfig]: [string, any]) => {
          renderSingleWeatherLayer(additionalType, additionalConfig, featuresByLayer[additionalType] || []);
        });
      } else {
        renderSingleWeatherLayer(layerType, config, featuresByLayer[layerType] || []);
      }
    });
  }, []);

  // Function to render a single weather layer
  const renderSingleWeatherLayer = useCallback((layerType: string, config: any, features: any[]) => {
    if (!mapRef.current || !features.length) return;
    
    console.log(`🌤️ Rendering ${layerType} layer with ${features.length} features`);
    
    const layerIds = WEATHER_LAYERS[layerType as keyof typeof WEATHER_LAYERS];
    if (!layerIds) {
      console.warn(`Unknown weather layer type: ${layerType}`);
      return;
    }
    
    const { sourceId, layerId } = layerIds;
    
    // Create GeoJSON for this weather layer
    const layerGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features
    };
    
    // Remove existing layer and source if they exist
    if (mapRef.current.getLayer(layerId)) {
      mapRef.current.removeLayer(layerId);
    }
    if (mapRef.current.getSource(sourceId)) {
      mapRef.current.removeSource(sourceId);
    }
    
    // Add weather source
    mapRef.current.addSource(sourceId, {
      type: 'geojson',
      data: layerGeoJSON
    });
    
    // Configure layer style based on weather type
    let layerStyle: any;
    
    if (layerType === 'temperature') {
      layerStyle = {
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'temperature'],
            24, 0,
            32, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 4
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, 'rgba(103, 169, 207, 0.6)',
            0.4, 'rgba(209, 229, 240, 0.7)',
            0.6, 'rgba(253, 219, 199, 0.8)',
            0.8, 'rgba(239, 138, 98, 0.9)',
            1, 'rgba(178, 24, 43, 1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 20,
            9, 60
          ],
          'heatmap-opacity': config.visible ? 0.8 : 0
        }
      };
    } else if (layerType === 'precipitation') {
      layerStyle = {
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation'],
            0, 0,
            25, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,
            9, 2
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(135, 206, 235, 0)',
            0.2, 'rgba(70, 130, 180, 0.4)',
            0.4, 'rgba(30, 144, 255, 0.6)',
            0.6, 'rgba(0, 0, 255, 0.7)',
            0.8, 'rgba(139, 0, 255, 0.8)',
            1, 'rgba(255, 20, 147, 0.9)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 15,
            9, 40
          ],
          'heatmap-opacity': config.visible ? 0.7 : 0
        }
      };
    } else {
      // Default style for other weather types as heatmap for more continuous appearance
      layerStyle = {
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': 0.6,
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,
            9, 1.5
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(68, 114, 196, 0)',
            0.5, 'rgba(68, 114, 196, 0.5)',
            1, 'rgba(68, 114, 196, 0.8)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 10,
            9, 30
          ],
          'heatmap-opacity': config.visible ? 0.6 : 0
        }
      };
    }
    
    // Add the layer
    mapRef.current.addLayer(layerStyle);
    
    console.log(`✅ Added ${layerType} layer with visibility: ${config.visible}`);
  }, []);

  // Function to render wells layer
  const renderWellsLayer = useCallback((geoJsonData: any) => {
    if (!mapRef.current) return;
    
    console.log('📍 Rendering wells layer with', geoJsonData.features.length, 'features');
    
    // Simple approach: check if source exists, update or create
    const wellsSource = mapRef.current.getSource(WELLS_SOURCE_ID);
    if (wellsSource) {
      // Update existing source
      (wellsSource as maplibregl.GeoJSONSource).setData(geoJsonData);
      console.log('Updated existing wells source');
    } else {
      // Add new source and layer
      mapRef.current.addSource(WELLS_SOURCE_ID, {
        type: 'geojson',
        data: geoJsonData
      });
      
      // Add simple circle layer
      mapRef.current.addLayer({
        id: WELLS_LAYER_ID,
        type: 'circle',
        source: WELLS_SOURCE_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#FF0000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.8
        }
      });
      
      console.log('Added new wells source and layer');
      
      // Add click event for wells layer
      mapRef.current.on('click', WELLS_LAYER_ID, (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        
        const coordinates = e.lngLat;
        const properties = e.features[0].properties;
        const name = properties?.name || 'Unnamed Well';
        
        // Create simple popup
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <h3>${name}</h3>
          ${properties ? Object.entries(properties)
            .filter(([key]) => key !== 'name')
            .slice(0, 5) // Show only first 5 properties
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('') : 'No additional metadata available'}
        `;
        
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setDOMContent(popupContent)
          .addTo(mapRef.current!);
      });
      
      // Change cursor on hover
      mapRef.current.on('mouseenter', WELLS_LAYER_ID, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        }
      });
      
      mapRef.current.on('mouseleave', WELLS_LAYER_ID, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      });
    }
  }, []);

  // Function to toggle weather layer visibility
  const toggleWeatherLayer = useCallback((layerType: string, visible: boolean) => {
    if (!mapRef.current) return;
    
    const layerIds = WEATHER_LAYERS[layerType as keyof typeof WEATHER_LAYERS];
    if (!layerIds) {
      console.warn(`Unknown weather layer type: ${layerType}`);
      return;
    }
    
    const { layerId } = layerIds;
    
    if (mapRef.current.getLayer(layerId)) {
      console.log(`🌤️ Toggling ${layerType} layer visibility:`, visible);
      
      // All weather layers now use heatmap rendering
      const opacity = layerType === 'temperature' ? 0.8 : 
                    layerType === 'precipitation' ? 0.7 : 0.6;
      mapRef.current.setPaintProperty(layerId, 'heatmap-opacity', visible ? opacity : 0);
    }
  }, []);

  // Function to get available weather layers
  const getWeatherLayers = useCallback((): string[] => {
    if (!mapRef.current) return [];
    
    return Object.keys(WEATHER_LAYERS).filter(layerType => {
      const layerIds = WEATHER_LAYERS[layerType as keyof typeof WEATHER_LAYERS];
      return mapRef.current!.getLayer(layerIds.layerId);
    });
  }, []);

  // Function to update weather control UI
  const updateWeatherControl = useCallback((weatherLayers: any) => {
    const weatherControlDiv = document.getElementById('weather-control');
    if (!weatherControlDiv) return;
    
    const availableLayers = Object.keys(weatherLayers).filter(key => key !== 'additional');
    const additionalLayers = weatherLayers.additional ? Object.keys(weatherLayers.additional) : [];
    const allLayers = [...availableLayers, ...additionalLayers];
    
    if (allLayers.length > 0) {
      // Show weather control
      weatherControlDiv.style.display = 'block';
      
      // Create weather control content
      const content = `
        <button class="maplibregl-ctrl-icon weather-toggle-btn" aria-label="Toggle Weather Layers" title="Weather Layers">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 14a2 2 0 100-4 2 2 0 000 4zM14 10a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm2 1v10h8V5H6z" clip-rule="evenodd"/>
            <circle cx="10" cy="3" r="1"/>
            <circle cx="10" cy="17" r="1"/>
          </svg>
        </button>
        <div class="weather-layers-panel" style="display: none;">
          ${allLayers.map(layerType => {
            const isVisible = weatherLayers[layerType]?.visible || 
                            (weatherLayers.additional && weatherLayers.additional[layerType]?.visible);
            const displayName = layerType.charAt(0).toUpperCase() + layerType.slice(1);
            
            return `
              <div class="weather-layer-item">
                <label class="weather-layer-label">
                  <input 
                    type="checkbox" 
                    data-layer="${layerType}" 
                    ${isVisible ? 'checked' : ''}
                  />
                  <span>${displayName}</span>
                </label>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      weatherControlDiv.innerHTML = content;
      
      // Add event listeners
      const toggleBtn = weatherControlDiv.querySelector('.weather-toggle-btn') as HTMLElement;
      const panel = weatherControlDiv.querySelector('.weather-layers-panel') as HTMLElement;
      const checkboxes = weatherControlDiv.querySelectorAll('input[type="checkbox"]');
      
      toggleBtn?.addEventListener('click', () => {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        toggleBtn.classList.toggle('active', !isVisible);
      });
      
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const layerType = target.dataset.layer;
          if (layerType) {
            toggleWeatherLayer(layerType, target.checked);
          }
        });
      });
      
    } else {
      // Hide weather control
      weatherControlDiv.style.display = 'none';
      weatherControlDiv.innerHTML = '';
    }
  }, [toggleWeatherLayer]);

  // Update map data function - enhanced for weather support
  const updateMapData = useCallback((geoJsonData: any) => {
    if (!mapRef.current || !geoJsonData || geoJsonData.type !== 'FeatureCollection') {
      console.error('Invalid map or data for updateMapData');
      return;
    }

    console.log('Updating map with search results:', geoJsonData.features.length, 'features');
    
    // Check if this is a weather maps query
    const isWeatherQuery = geoJsonData.metadata?.queryType === 'weatherMaps';
    const hasWeatherLayers = geoJsonData.weatherLayers && Object.keys(geoJsonData.weatherLayers).length > 0;
    
    if (isWeatherQuery && hasWeatherLayers) {
      console.log('🌤️ Detected weather maps query - rendering weather overlays');
      console.log('🔍 Weather layers available:', Object.keys(geoJsonData.weatherLayers));
      
      // Update weather control
      updateWeatherControl(geoJsonData.weatherLayers);
      
      // Separate wells and weather features
      const wellFeatures = geoJsonData.features.filter((f: any) => 
        f.properties?.type === 'My Wells' || 
        f.properties?.category === 'personal' ||
        !f.properties?.type?.startsWith('weather_')
      );
      
      const weatherFeatures = geoJsonData.features.filter((f: any) => 
        f.properties?.type?.startsWith('weather_')
      );
      
      console.log('📊 Feature breakdown:', {
        wells: wellFeatures.length,
        weather: weatherFeatures.length,
        total: geoJsonData.features.length
      });
      
      // Render wells first
      if (wellFeatures.length > 0) {
        const wellsGeoJSON = {
          type: 'FeatureCollection',
          features: wellFeatures
        };
        renderWellsLayer(wellsGeoJSON);
      }
      
      // Render weather layers
      if (weatherFeatures.length > 0) {
        renderWeatherLayers(geoJsonData.weatherLayers, weatherFeatures);
      }
      
      // EARLY RETURN - don't process as general wells data
      return;
      
    } else {
      // Standard wells-only rendering - show disabled weather control
      const weatherControlDiv = document.getElementById('weather-control');
      if (weatherControlDiv) {
        weatherControlDiv.style.display = 'block';
        weatherControlDiv.innerHTML = `
          <button class="maplibregl-ctrl-icon weather-toggle-btn disabled" 
                  aria-label="Weather Layers (No weather data available)" 
                  title="Weather Layers - Submit weather query to enable"
                  disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
              <path d="M6 14a2 2 0 100-4 2 2 0 000 4zM14 10a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm2 1v10h8V5H6z" clip-rule="evenodd"/>
              <circle cx="10" cy="3" r="1"/>
              <circle cx="10" cy="17" r="1"/>
            </svg>
          </button>
        `;
      }
      
      console.log('📍 Standard wells query - rendering well markers');
      renderWellsLayer(geoJsonData);
    }
    
    // Function to fit bounds to all wells
    const fitBoundsToWells = () => {
      if (geoJsonData.features.length > 0) {
        try {
          const coordinates = geoJsonData.features.map((feature: any) => feature.geometry.coordinates);
          console.log('Well coordinates for bounds:', coordinates);
          
          if (coordinates.length === 1) {
            // Single well - just center on it
            mapRef.current!.setCenter(coordinates[0]);
            mapRef.current!.setZoom(8);
            console.log('Centered map on single well at', coordinates[0]);
          } else {
            // Multiple wells - fit bounds
            const bounds = coordinates.reduce((bounds: maplibregl.LngLatBounds, coord: [number, number]) => {
              return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
            
            console.log('Calculated bounds:', bounds.toArray());
            
            mapRef.current!.fitBounds(bounds, { 
              padding: 100,
              maxZoom: 10,
              duration: 1000  // Smooth animation
            });
            console.log('Executed fitBounds with animation for', geoJsonData.features.length, 'wells');
          }
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    };
    
    // Simple approach: check if source exists, update or create
    const wellsSource = mapRef.current.getSource(WELLS_SOURCE_ID);
    if (wellsSource) {
      // Update existing source
      (wellsSource as maplibregl.GeoJSONSource).setData(geoJsonData);
      console.log('Updated existing wells source');
      
      // Fit bounds after data update with a slight delay
      setTimeout(fitBoundsToWells, 200);
    } else {
      // Add new source and layer
      mapRef.current.addSource(WELLS_SOURCE_ID, {
        type: 'geojson',
        data: geoJsonData
      });
      
      // Add simple circle layer
      mapRef.current.addLayer({
        id: WELLS_LAYER_ID,
        type: 'circle',
        source: WELLS_SOURCE_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#FF0000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.8
        }
      });
      
      console.log('Added new wells source and layer');
      
      // Add click event for wells layer
      mapRef.current.on('click', WELLS_LAYER_ID, (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        
        const coordinates = e.lngLat;
        const properties = e.features[0].properties;
        const name = properties?.name || 'Unnamed Well';
        
        // Create simple popup
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <h3>${name}</h3>
          ${properties ? Object.entries(properties)
            .filter(([key]) => key !== 'name')
            .slice(0, 5) // Show only first 5 properties
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('') : 'No additional metadata available'}
        `;
        
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setDOMContent(popupContent)
          .addTo(mapRef.current!);
      });
      
      // Change cursor on hover
      mapRef.current.on('mouseenter', WELLS_LAYER_ID, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        }
      });
      
      mapRef.current.on('mouseleave', WELLS_LAYER_ID, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      });
      
      // Wait for source to load, then fit bounds
      mapRef.current.on('sourcedata', function sourcedataHandler(e) {
        if (e.sourceId === WELLS_SOURCE_ID && e.isSourceLoaded) {
          console.log('Wells source fully loaded, fitting bounds');
          fitBoundsToWells();
          // Remove listener after first use
          mapRef.current!.off('sourcedata', sourcedataHandler);
        }
      });
    }
  }, []);

  // Fit bounds function
  const fitBounds = useCallback((bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }) => {
    if (!mapRef.current) {
      console.error('Map not available for fitBounds');
      return;
    }

    try {
      const mapBounds = new maplibregl.LngLatBounds(
        [bounds.minLon, bounds.minLat],
        [bounds.maxLon, bounds.maxLat]
      );
      
      mapRef.current.fitBounds(mapBounds, { 
        padding: 100,
        maxZoom: 10,
        duration: 1000
      });
      
      console.log('✅ Successfully fitted bounds:', bounds);
    } catch (error) {
      console.error('❌ Error fitting bounds:', error);
    }
  }, []);

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    updateMapData,
    fitBounds,
    toggleWeatherLayer,
    getWeatherLayers
  }), [updateMapData, fitBounds, toggleWeatherLayer, getWeatherLayers]);

  useEffect(() => {
    const mapContainer = document.getElementById("map");
    if (mapContainer && !mapRef.current) {
      
      // Create new map instance using default Amazon Location Service implementation
      mapRef.current = new maplibregl.Map({
        container: "map",
        style: `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`,
        center: [106.9, 10.2], // Center on Vietnamese territorial waters
        zoom: 5,
      });

      // Add controls
      mapRef.current.addControl(new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
      }), 'top-right');
      mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
      
      // Add weather control (always visible, shows disabled state when no weather layers)
      const weatherControlDiv = document.createElement('div');
      weatherControlDiv.className = 'maplibregl-ctrl maplibregl-ctrl-group weather-control';
      weatherControlDiv.id = 'weather-control';
      weatherControlDiv.style.display = 'block'; // Always visible
      
      // Initialize with default disabled state
      weatherControlDiv.innerHTML = `
        <button class="maplibregl-ctrl-icon weather-toggle-btn disabled" 
                aria-label="Weather Layers (No weather data available)" 
                title="Weather Layers - Submit weather query to enable"
                disabled>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
            <path d="M6 14a2 2 0 100-4 2 2 0 000 4zM14 10a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm2 1v10h8V5H6z" clip-rule="evenodd"/>
            <circle cx="10" cy="3" r="1"/>
            <circle cx="10" cy="17" r="1"/>
          </svg>
        </button>
      `;
      
      class WeatherControl {
        onAdd(map: maplibregl.Map) {
          return weatherControlDiv;
        }
        
        onRemove() {
          if (weatherControlDiv.parentNode) {
            weatherControlDiv.parentNode.removeChild(weatherControlDiv);
          }
        }
      }
      
      mapRef.current.addControl(new WeatherControl() as any, 'top-left');
      
      // Initialize MapLibre Draw
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        styles: [
          // Polygon fill - MAXIMUM VISIBILITY FOR COMPLETED POLYGONS
          {
            "id": "gl-draw-polygon-fill-inactive",
            "type": "fill",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
              "fill-color": "#ff6600", // Bright orange
              "fill-opacity": 0.4 // Much more visible
            }
          },
          // Polygon fill when active/drawing
          {
            "id": "gl-draw-polygon-fill-active",
            "type": "fill",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
              "fill-color": "#ff6600", // Same bright orange
              "fill-opacity": 0.5 // Very visible when drawing
            }
          },
          // Polygon outline - MAXIMUM VISIBILITY FOR COMPLETED POLYGONS
          {
            "id": "gl-draw-polygon-stroke-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#ff6600", // Bright orange
              "line-width": 4, // Thick for maximum visibility
              "line-opacity": 1 // Fully opaque
            }
          },
          // Polygon outline when active
          {
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#ff6600",
              "line-width": 4,
              "line-opacity": 1
            }
          }
        ]
      });

      mapRef.current.addControl(drawRef.current as any, 'top-left');

      // Wait for the map to load before setup
      mapRef.current.on('load', () => {
        console.log('Map loaded successfully - wells will only appear when searched');
        
        // Add polygon event listeners
        mapRef.current!.on('draw.create', handlePolygonCreate);
        mapRef.current!.on('draw.delete', handlePolygonDeleteEvent);
        mapRef.current!.on('draw.update', handlePolygonUpdateEvent);
      });
      
      // Ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 100);
    }
    
    return () => {
      // Clean up map when component unmounts
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapColorScheme, handlePolygonCreate, handlePolygonDeleteEvent, handlePolygonUpdateEvent]);

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '0 0 16px 16px' }} />
    </div>
  );
});

export default MapComponent;
