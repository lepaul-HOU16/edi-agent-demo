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

  // Polygon event handlers
  const handlePolygonCreate = useCallback((e: any) => {
    const polygonData = e.features[0];
    const polygonId = `polygon-${Date.now()}`;
    
    const newPolygon: PolygonFilter = {
      id: polygonId,
      geometry: polygonData.geometry,
      name: `Area ${Date.now()}`,
      createdAt: new Date(),
      area: area(polygonData.geometry) / 1000000 // Convert to km²
    };
    
    onPolygonCreate(newPolygon);
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

  // Update map data function
  const updateMapData = useCallback((geoJsonData: any) => {
    if (!mapRef.current || !geoJsonData || geoJsonData.type !== 'FeatureCollection') {
      console.error('Invalid map or data for updateMapData');
      return;
    }

    console.log('Updating map with search results:', geoJsonData.features.length, 'features');
    
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

  // Expose updateMapData function to parent
  useImperativeHandle(ref, () => ({
    updateMapData
  }), [updateMapData]);

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
      
      // Initialize MapLibre Draw
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        styles: [
          // Polygon fill
          {
            "id": "gl-draw-polygon-fill-inactive",
            "type": "fill",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
              "fill-color": "#3bb2d0",
              "fill-opacity": 0.2
            }
          },
          // Polygon fill when active
          {
            "id": "gl-draw-polygon-fill-active",
            "type": "fill",
            "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
              "fill-color": "#fbb03b",
              "fill-opacity": 0.3
            }
          },
          // Polygon outline
          {
            "id": "gl-draw-polygon-stroke-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#3bb2d0",
              "line-width": 2
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
              "line-color": "#fbb03b",
              "line-width": 2
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
