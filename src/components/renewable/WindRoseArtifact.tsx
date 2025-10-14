/**
 * WindRoseArtifact Component
 */

import React, { useState } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Table, Pagination } from '@cloudscape-design/components';

interface DirectionDetail {
  direction: string;
  angle: number;
  frequency: number;
  avg_speed: number;
  speed_distribution: {
    '0-3': number;
    '3-6': number;
    '6-9': number;
    '9-12': number;
    '12+': number;
  };
}

interface WindRoseArtifactProps {
  data: {
    messageContentType: 'wind_rose_analysis';
    title: string;
    projectId: string;
    metrics: {
      avgWindSpeed: number;
      maxWindSpeed: number;
      prevailingDirection: string;
      totalObservations: number;
    };
    windData: {
      directions: DirectionDetail[];
      chartData: {
        directions: string[];
        frequencies: number[];
        speeds: number[];
        speed_distributions: Array<Record<string, number>>;
      };
    };
    visualization?: {
      type: 'image';
      s3_url: string;
      s3_key: string;
    };
  };
}

const WindRoseArtifact: React.FC<WindRoseArtifactProps> = ({ data }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const pageSize = 8;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Professional wind resource analysis with directional frequency distribution"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="blue">
                {data.metrics.avgWindSpeed.toFixed(1)} m/s avg
              </Badge>
              <Badge color="green">
                {data.metrics.prevailingDirection} prevailing
              </Badge>
            </SpaceBetween>
          }
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Avg Wind Speed</Box>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.metrics.avgWindSpeed.toFixed(1)} m/s
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Max Wind Speed</Box>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.metrics.maxWindSpeed.toFixed(1)} m/s
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Prevailing Direction</Box>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.metrics.prevailingDirection}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Observations</Box>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.metrics.totalObservations.toLocaleString()}
            </div>
          </div>
        </ColumnLayout>

        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Rose Diagram
          </Box>
          <div style={{ width: '100%', minHeight: '500px', border: '1px solid #e9ebed', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.visualization?.s3_url ? (
              <>
                {imageLoading && (
                  <div style={{ color: '#666', textAlign: 'center' }}>
                    <div>🔄 Loading wind rose visualization...</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Retrieving matplotlib chart from S3</div>
                  </div>
                )}
                {imageError && (
                  <div style={{ color: '#d13212', textAlign: 'center' }}>
                    <div>⚠️ Error loading wind rose image</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>Image URL: {data.visualization.s3_url}</div>
                  </div>
                )}
                <img src={data.visualization.s3_url} alt="Wind Rose Diagram" style={{ maxWidth: '100%', height: 'auto', display: imageLoading || imageError ? 'none' : 'block' }} onLoad={handleImageLoad} onError={handleImageError} />
              </>
            ) : (
              <div style={{ color: '#666', textAlign: 'center' }}>
                <div>📊 Wind Rose Visualization</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>Visualization not available</div>
              </div>
            )}
          </div>
        </Box>

        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Directional Wind Analysis ({data.windData.directions.length} directions)
          </Box>
          <Table
            columnDefinitions={[
              { id: 'direction', header: 'Direction', cell: (item: DirectionDetail) => (<Box padding={{ left: 's' }}><strong>{item.direction}</strong><Box variant="small" color="text-body-secondary">{item.angle}°</Box></Box>), minWidth: 100 },
              { id: 'frequency', header: 'Frequency', cell: (item: DirectionDetail) => (<div>{item.frequency.toFixed(1)}%<div style={{ width: '100%', height: '4px', backgroundColor: '#e9ebed', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}><div style={{ width: `${item.frequency}%`, height: '100%', backgroundColor: '#0972d3', borderRadius: '2px' }} /></div></div>), minWidth: 120 },
              { id: 'avgSpeed', header: 'Avg Speed', cell: (item: DirectionDetail) => `${item.avg_speed.toFixed(1)} m/s`, minWidth: 100 },
              { id: 'speedDist', header: 'Speed Distribution', cell: (item: DirectionDetail) => (<div style={{ fontSize: '12px' }}><div>0-3 m/s: {item.speed_distribution['0-3'].toFixed(0)}%</div><div>3-6 m/s: {item.speed_distribution['3-6'].toFixed(0)}%</div><div>6-9 m/s: {item.speed_distribution['6-9'].toFixed(0)}%</div><div>9-12 m/s: {item.speed_distribution['9-12'].toFixed(0)}%</div><div>12+ m/s: {item.speed_distribution['12+'].toFixed(0)}%</div></div>), minWidth: 150 },
            ]}
            items={data.windData.directions.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize)}
            loadingText="Loading direction data"
            empty={<Box textAlign="center" color="inherit"><b>No direction data available</b></Box>}
            contentDensity="comfortable"
            pagination={<Pagination currentPageIndex={currentPageIndex} pagesCount={Math.ceil(data.windData.directions.length / pageSize)} onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)} ariaLabels={{ nextPageLabel: 'Next page', previousPageLabel: 'Previous page', pageLabel: (pageNumber) => `Page ${pageNumber}` }} />}
          />
        </Box>

        <Box variant="small" color="text-body-secondary">
          Project ID: {data.projectId}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default WindRoseArtifact;
