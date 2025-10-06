/**
 * TerrainMapArtifact Component
 * 
 * Renders terrain analysis artifacts from the renewable energy backend.
 * Displays Folium HTML maps in an iframe with suitability metrics.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout } from '@cloudscape-design/components';

interface TerrainArtifactProps {
  data: {
    messageContentType: 'wind_farm_terrain_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    coordinates: { lat: number; lng: number };
    suitabilityScore: number;
    exclusionZones: Array<{
      type: string;
      area?: number;
      description?: string;
    }>;
    mapHtml: string;
    riskAssessment?: {
      environmental: number;
      regulatory: number;
      technical: number;
      overall: number;
    };
    s3Url?: string;
  };
}

const TerrainMapArtifact: React.FC<TerrainArtifactProps> = ({ data }) => {
  // Determine suitability badge color
  const getSuitabilityBadge = (score: number) => {
    if (score >= 80) return <Badge color="green">High Suitability ({score}%)</Badge>;
    if (score >= 60) return <Badge color="blue">Moderate Suitability ({score}%)</Badge>;
    if (score >= 40) return <Badge color="grey">Low Suitability ({score}%)</Badge>;
    return <Badge color="red">Poor Suitability ({score}%)</Badge>;
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle}
          actions={getSuitabilityBadge(data.suitabilityScore)}
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Site Information */}
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Coordinates</Box>
            <div>
              {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Suitability Score</Box>
            <div>{data.suitabilityScore}%</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Exclusion Zones</Box>
            <div>{data.exclusionZones.length} identified</div>
          </div>
        </ColumnLayout>

        {/* Risk Assessment (if available) */}
        {data.riskAssessment && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Risk Assessment
            </Box>
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="small">Environmental</Box>
                <div>{data.riskAssessment.environmental}%</div>
              </div>
              <div>
                <Box variant="small">Regulatory</Box>
                <div>{data.riskAssessment.regulatory}%</div>
              </div>
              <div>
                <Box variant="small">Technical</Box>
                <div>{data.riskAssessment.technical}%</div>
              </div>
              <div>
                <Box variant="small">Overall</Box>
                <div>{data.riskAssessment.overall}%</div>
              </div>
            </ColumnLayout>
          </Box>
        )}

        {/* Folium Map */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Terrain Analysis Map
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
          </div>
        </Box>

        {/* Exclusion Zones Summary */}
        {data.exclusionZones.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Exclusion Zones
            </Box>
            <SpaceBetween size="xs">
              {data.exclusionZones.map((zone, index) => (
                <div key={index} style={{ padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <strong>{zone.type}</strong>
                  {zone.area && <span> - {zone.area} km²</span>}
                  {zone.description && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{zone.description}</div>}
                </div>
              ))}
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
