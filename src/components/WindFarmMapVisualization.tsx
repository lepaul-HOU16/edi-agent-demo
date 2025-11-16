
import React, { useEffect, useRef, useCallback, useState } from 'react';
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

interface WindFarmMapVisualizationProps {
  turbineData: TurbinePosition[];
  coordinates: { lat: number; lng: number };
  selectedView: '2d' | '3d';
  isTransitioning: boolean;
  onMapReady: () => void;
  onMapError: (error: string) => void;
}

// Safe number validation utility
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

const WindFarmMapVisualization: React.FC<WindFarmMapVisualizationProps> = ({
  turbineData,
  coordinates,
  selectedView,
  isTransitioning,
  onMapReady,
  onMapError
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Track if map style is loaded
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
  
  // AWS configuration for Amazon Location Service
  const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const style = "Standard";
  
  // Layer IDs
  const TURBINES_SOURCE_ID = 'wind-turbines';
  const TURBINES_LAYER_ID = 'turbines-layer';

  // Function to render turbines layer
  const renderTurbinesLayer = useCallback((data: TurbinePosition[]) => {
    if (!mapRef.current || !data.length) return;
    
    console.log('🌪️ Rendering turbines layer with', data.length, 'turbines');
    
    // Create properly validated GeoJSON
    const turbinesGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.map((turbine) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [safeNumber(turbine.x, -96.7970), safeNumber(turbine.y, 32.7767)]
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
    
    // Clean up existing layers
    if (mapRef.current.getLayer(TURBINES_LAYER_ID)) {
      mapRef.current.removeLayer(TURBINES_LAYER_ID);
    }
    if (mapRef.current.getSource(TURBINES_SOURCE_ID)) {
      mapRef.current.removeSource(TURBINES_SOURCE_ID);
    }
    
    // Add turbines source
    mapRef.current.addSource(TURBINES_SOURCE_ID, {
      type: 'geojson',
      data: turbinesGeoJSON
    });
    
    // Add turbines layer with ultra-safe expressions for strings and nulls
    mapRef.current.addLayer({
      id: TURBINES_LAYER_ID,
      type: 'circle',
      source: TURBINES_SOURCE_ID,
      paint: {
        'circle-radius': selectedView === '3d' ? 12 : 8,
        'circle-color': [
          'case',
          ['>', ['to-number', ['coalesce', ['get', 'efficiency'], '80']], 90], '#4ade80',
          ['>', ['to-number', ['coalesce', ['get', 'efficiency'], '80']], 75], '#facc15',
          '#f87171'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });
    
    // Add interactivity
    mapRef.current.on('click', TURBINES_LAYER_ID, (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      
      const coordinates = e.lngLat;
      const properties = e.features[0].properties;
      const turbineId = properties?.id || 'Unknown';
      
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #ff6600;">🌪️ ${turbineId}</h3>
          <div style="font-size: 12px; line-height: 1.4;">
            <p style="margin: 3px 0;"><strong>Efficiency:</strong> ${safeNumber(properties?.efficiency, 80).toFixed(1)}%</p>
            <p style="margin: 3px 0;"><strong>Wind Speed:</strong> ${safeNumber(properties?.windSpeed, 8).toFixed(1)} m/s</p>
            <p style="margin: 3px 0;"><strong>Elevation:</strong> ${safeNumber(properties?.elevation, 150).toFixed(1)} m</p>
            <p style="margin: 3px 0;"><strong>Status:</strong> ${properties?.status || 'operational'}</p>
            <p style="margin: 3px 0;"><strong>Coordinates:</strong> ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}</p>
          </div>
        </div>
      `;
      
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setDOMContent(popupContent)
        .addTo(mapRef.current!);
    });
    
    mapRef.current.on('mouseenter', TURBINES_LAYER_ID, () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      }
    });
    
    mapRef.current.on('mouseleave', TURBINES_LAYER_ID, () => {
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
      }
    });
    
    console.log('✅ Turbines layer rendered successfully');
  }, [selectedView]);

  // Toggle 3D functionality with robust terrain fallbacks
  const toggle3D = useCallback((enabled: boolean) => {
    if (!mapRef.current || !mapStyleLoaded) return;
    
    console.log('🏔️ Toggling 3D mode:', enabled);
    
    try {
      if (enabled) {
        // Try to add terrain source with multiple fallbacks
        if (!mapRef.current.getSource('terrain-source')) {
          try {
            // First try AWS terrain tiles
            mapRef.current.addSource('terrain-source', {
              type: 'raster-dem',
              tiles: [`https://maps.geo.${REGION}.amazonaws.com/v2/tiles/terrain/{z}/{x}/{y}?key=${apiKey}`],
              tileSize: 512,
              maxzoom: 14
            });
            console.log('✅ AWS terrain source added');
          } catch (awsError) {
            console.warn('⚠️ AWS terrain failed, trying fallback...');
            // Fallback to OpenStreetMap terrain
            try {
              mapRef.current.addSource('terrain-source', {
                type: 'raster-dem',
                tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
                tileSize: 256,
                maxzoom: 15,
                encoding: 'terrarium'
              });
              console.log('✅ Fallback terrain source added');
            } catch (fallbackError) {
              console.warn('⚠️ All terrain sources failed, 3D view only');
            }
          }
        }
        
        // Try to set terrain with error handling
        try {
          mapRef.current.setTerrain({ source: 'terrain-source', exaggeration: 2.5 });
          console.log('✅ 3D terrain enabled with exaggeration');
        } catch (terrainError) {
          console.warn('⚠️ Terrain rendering not available, using perspective 3D only');
          // Continue with 3D camera view even without terrain
        }
        
        // Enhanced 3D perspective (works with or without terrain)
        mapRef.current.easeTo({
          pitch: 75,
          bearing: -30,
          zoom: Math.min(mapRef.current.getZoom() + 0.3, 15),
          duration: 1500
        });
        
        console.log('🏔️ Enhanced 3D mode activated');
      } else {
        // Complete 3D reset
        try {
          mapRef.current.setTerrain(null);
          console.log('🌍 Terrain disabled');
        } catch (error) {
          console.warn('⚠️ No terrain to disable');
        }
        
        // Complete reset to 2D view
        mapRef.current.easeTo({
          pitch: 0,
          bearing: 0,
          zoom: mapRef.current.getZoom() - 0.3,
          duration: 1500
        });
        
        console.log('📐 2D flat view restored');
      }
      
      // Update turbine layer styling
      if (mapRef.current.getLayer(TURBINES_LAYER_ID)) {
        mapRef.current.setPaintProperty(TURBINES_LAYER_ID, 'circle-radius', enabled ? 14 : 10);
        mapRef.current.setPaintProperty(TURBINES_LAYER_ID, 'circle-stroke-width', enabled ? 3 : 2);
      }
    } catch (error) {
      console.error('❌ Error toggling 3D mode:', error);
      // Even if there's an error, try to at least change the camera perspective
      try {
        mapRef.current.easeTo({
          pitch: enabled ? 60 : 0,
          bearing: enabled ? -20 : 0,
          duration: 1500
        });
        console.log('📹 Fallback to camera perspective only');
      } catch (fallbackError) {
        console.error('❌ All 3D operations failed');
      }
    }
  }, [REGION, apiKey, mapStyleLoaded]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      console.log('🗺️ Initializing wind farm map...');
      
      try {
        mapRef.current = new maplibregl.Map({
          container: mapContainerRef.current,
          style: `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=Light`,
          center: [coordinates.lng, coordinates.lat],
          zoom: 12,
        });

        mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
        mapRef.current.addControl(new maplibregl.ScaleControl({
          maxWidth: 200,
          unit: 'metric'
        }), 'top-right');

        mapRef.current.on('load', () => {
          console.log('✅ Wind farm map loaded successfully');
          setMapStyleLoaded(true);
          onMapReady();
        });

        mapRef.current.on('styledata', () => {
          if (mapRef.current && mapRef.current.isStyleLoaded()) {
            console.log('✅ Wind farm map style loaded');
            setMapStyleLoaded(true);
          }
        });

        mapRef.current.on('error', (e) => {
          console.error('❌ Map error:', e);
          onMapError('Failed to load map');
        });
        
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        onMapError('Failed to initialize map');
      }
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [REGION, apiKey, style, coordinates.lng, coordinates.lat, onMapReady, onMapError]);

  // Update turbines when data changes AND map style is loaded
  useEffect(() => {
    if (mapRef.current && turbineData.length > 0 && mapStyleLoaded) {
      renderTurbinesLayer(turbineData);
    }
  }, [turbineData, renderTurbinesLayer, mapStyleLoaded]);

  // Handle view changes
  useEffect(() => {
    const is3D = selectedView === '3d';
    toggle3D(is3D);
  }, [selectedView, toggle3D]);

  return (
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
  );
};

export default WindFarmMapVisualization;
