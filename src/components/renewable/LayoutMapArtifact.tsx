/**
 * LayoutMapArtifact Component
 * 
 * Renders wind farm layout artifacts from the renewable energy backend.
 * Displays Folium HTML maps with turbine positions and layout metrics.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout } from '@cloudscape-design/components';

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
}

const LayoutMapArtifact: React.FC<LayoutArtifactProps> = ({ data }) => {
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

        {/* Folium Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Farm Layout Map
          </Box>
          <div
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
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
                title="Wind Farm Layout Map"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9f9f9',
                  color: '#666',
                  fontSize: '16px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div>📍 Layout Map</div>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    Map data not available
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
                    Expected: data.mapHtml (Folium HTML)
                  </div>
                </div>
              </div>
            )}
          </div>
        </Box>

        {/* Turbine Positions Summary */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Turbine Positions
          </Box>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {data.turbinePositions.length} turbine positions calculated
            {data.turbinePositions.length > 0 && (
              <span>
                {' '}
                (First: {data.turbinePositions[0].lat.toFixed(6)}, {data.turbinePositions[0].lng.toFixed(6)})
              </span>
            )}
          </div>
        </Box>

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
