/**
 * Terrain Map Component Example
 * 
 * Simplified example showing the core patterns for rendering terrain analysis artifacts.
 * This is a reference implementation - see src/components/renewable/TerrainMapArtifact.tsx
 * for the full production version.
 */

import React, { useEffect, useRef } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout } from '@cloudscape-design/components';
import 'leaflet/dist/leaflet.css';

interface TerrainMapComponentProps {
  data: {
    title: string;
    subtitle?: string;
    coordinates: { lat: number; lng: number };
    metrics: {
      totalFeatures: number;
      featuresByType: Record<string, number>;
    };
    geojson: {
      type: 'FeatureCollection';
      features: Array<{
        type: 'Feature';
        geometry: any;
        properties: any;
      }>;
    };
  };
}

export const TerrainMapComponent: React.FC<TerrainMapComponentProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !data.geojson) return;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map
      const map = L.map(mapRef.current!, {
        center: [data.coordinates.lat, data.coordinates.lng],
        zoom: 13,
      });

      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Add center marker
      L.marker([data.coordinates.lat, data.coordinates.lng])
        .addTo(map)
        .bindPopup('Analysis Center');

      // Style function for features
      const getFeatureStyle = (featureType: string) => {
        switch (featureType) {
          case 'building':
            return { fillColor: '#DC143C', color: '#8B0000', weight: 1, fillOpacity: 0.6 };
          case 'water':
            return { fillColor: '#4169E1', color: '#00008B', weight: 2, fillOpacity: 0.5 };
          case 'highway':
            return { color: '#FFD700', weight: 2, opacity: 0.8 };
          default:
            return { fillColor: '#D3D3D3', color: '#808080', weight: 1, fillOpacity: 0.2 };
        }
      };

      // Add GeoJSON features
      L.geoJSON(data.geojson, {
        style: (feature) => {
          const featureType = feature?.properties?.feature_type || 'other';
          return getFeatureStyle(featureType);
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindPopup(`
            <div style="padding: 8px;">
              <strong>${props.feature_type || 'Feature'}</strong><br/>
              ${props.name || 'Terrain feature'}
            </div>
          `);
        },
      }).addTo(map);
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle}
          actions={
            <Badge color="blue">{data.metrics.totalFeatures} Features</Badge>
          }
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Metrics */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total Features</Box>
            <div>{data.metrics.totalFeatures}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Buildings</Box>
            <div>{data.metrics.featuresByType.building || 0}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Roads</Box>
            <div>{data.metrics.featuresByType.highway || 0}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Water Bodies</Box>
            <div>{data.metrics.featuresByType.water || 0}</div>
          </div>
        </ColumnLayout>

        {/* Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Terrain Analysis Map
          </Box>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '500px',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
            }}
          />
        </Box>
      </SpaceBetween>
    </Container>
  );
};

/**
 * Key Patterns Demonstrated:
 * 
 * 1. **Dynamic Import**: Leaflet is imported dynamically to avoid SSR issues
 * 2. **Ref Management**: Map instance stored in ref to prevent re-initialization
 * 3. **Cleanup**: Map removed on component unmount
 * 4. **Feature Styling**: Different styles for different feature types
 * 5. **Popups**: Interactive popups with feature information
 * 6. **Cloudscape Integration**: Uses Cloudscape components for consistent UI
 * 
 * Production Considerations:
 * - Add error boundaries for robust error handling
 * - Implement loading states for async operations
 * - Add accessibility features (ARIA labels, keyboard navigation)
 * - Support responsive layouts for mobile devices
 * - Cache map instances to improve performance
 * - Handle edge cases (empty data, invalid coordinates, etc.)
 */

export default TerrainMapComponent;
