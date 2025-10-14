/**
 * GracefulDegradation - Fallback components for when renewable energy visualizations fail
 * 
 * Provides meaningful fallback content and alternative ways to access data
 * when primary visualizations cannot be rendered.
 */

import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Header, 
  SpaceBetween, 
  Alert,
  Table,
  ColumnLayout,
  StatusIndicator
} from '@cloudscape-design/components';

interface FallbackVisualizationProps {
  title: string;
  data?: any;
  error?: string;
  onRetry?: () => void;
  onExportData?: () => void;
  onViewRawData?: () => void;
  alternativeActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'normal';
  }>;
}

/**
 * Generic fallback visualization component
 */
export const FallbackVisualization: React.FC<FallbackVisualizationProps> = ({
  title,
  data,
  error,
  onRetry,
  onExportData,
  onViewRawData,
  alternativeActions = []
}) => {
  const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);

  return (
    <Container>
      <Header
        variant="h3"
        description="Visualization content is temporarily unavailable"
      >
        {title}
      </Header>
      
      <SpaceBetween direction="vertical" size="m">
        <Alert
          statusIconAriaLabel="Warning"
          type="warning"
          header="Visualization Unavailable"
        >
          {error || "The visualization could not be rendered, but you can still access the underlying data and perform alternative actions."}
        </Alert>

        {hasData && (
          <Box>
            <Header variant="h4">Available Actions</Header>
            <SpaceBetween direction="horizontal" size="s">
              {onRetry && (
                <Button
                  variant="primary"
                  iconName="refresh"
                  onClick={onRetry}
                >
                  Retry Visualization
                </Button>
              )}
              {onExportData && (
                <Button
                  variant="normal"
                  iconName="download"
                  onClick={onExportData}
                >
                  Export Data
                </Button>
              )}
              {onViewRawData && (
                <Button
                  variant="normal"
                  iconName="view-full"
                  onClick={onViewRawData}
                >
                  View Raw Data
                </Button>
              )}
              {alternativeActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'normal'}
                  onClick={action.action}
                >
                  {action.label}
                </Button>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {hasData && (
          <DataSummary data={data} title={`${title} Summary`} />
        )}
      </SpaceBetween>
    </Container>
  );
};

/**
 * Data summary component for fallback scenarios
 */
interface DataSummaryProps {
  data: any;
  title: string;
  maxItems?: number;
}

const DataSummary: React.FC<DataSummaryProps> = ({ 
  data, 
  title, 
  maxItems = 10 
}) => {
  if (Array.isArray(data)) {
    return (
      <Box>
        <Header variant="h4">{title}</Header>
        <Box variant="p">
          <StatusIndicator type="success">
            {data.length} data points available
          </StatusIndicator>
        </Box>
        
        {data.length > 0 && typeof data[0] === 'object' && (
          <Table
            columnDefinitions={Object.keys(data[0]).slice(0, 5).map(key => ({
              id: key,
              header: key.charAt(0).toUpperCase() + key.slice(1),
              cell: (item: any) => item[key]?.toString() || 'N/A'
            }))}
            items={data.slice(0, maxItems)}
            loadingText="Loading data"
            empty={
              <Box textAlign="center" color="inherit">
                <b>No data available</b>
              </Box>
            }
          />
        )}
        
        {data.length > maxItems && (
          <Box variant="small" color="text-body-secondary">
            Showing {maxItems} of {data.length} items
          </Box>
        )}
      </Box>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data).slice(0, maxItems);
    
    return (
      <Box>
        <Header variant="h4">{title}</Header>
        <ColumnLayout columns={2} variant="text-grid">
          {entries.map(([key, value]) => (
            <div key={key}>
              <Box variant="awsui-key-label">{key}</Box>
              <div>{String(value)}</div>
            </div>
          ))}
        </ColumnLayout>
        
        {Object.keys(data).length > maxItems && (
          <Box variant="small" color="text-body-secondary">
            Showing {maxItems} of {Object.keys(data).length} properties
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Header variant="h4">{title}</Header>
      <Box variant="p">
        <StatusIndicator type="info">
          Data available: {String(data)}
        </StatusIndicator>
      </Box>
    </Box>
  );
};

/**
 * Specialized fallback components for different visualization types
 */

// Wind Rose Fallback
export const WindRoseFallback: React.FC<{
  windData?: any;
  onRetry?: () => void;
  onExportData?: () => void;
}> = ({ windData, onRetry, onExportData }) => (
  <FallbackVisualization
    title="Wind Rose Analysis"
    data={windData}
    error="Wind rose visualization could not be generated. This may be due to insufficient wind data or processing issues."
    onRetry={onRetry}
    onExportData={onExportData}
    alternativeActions={[
      {
        label: 'View Wind Statistics',
        action: () => console.log('Show wind statistics table'),
        variant: 'normal'
      }
    ]}
  />
);

// Wake Analysis Fallback
export const WakeAnalysisFallback: React.FC<{
  wakeData?: any;
  onRetry?: () => void;
  onExportData?: () => void;
}> = ({ wakeData, onRetry, onExportData }) => (
  <FallbackVisualization
    title="Wake Analysis"
    data={wakeData}
    error="Wake analysis visualization could not be generated. This may be due to complex turbine layouts or processing limitations."
    onRetry={onRetry}
    onExportData={onExportData}
    alternativeActions={[
      {
        label: 'View Wake Summary',
        action: () => console.log('Show wake summary'),
        variant: 'normal'
      },
      {
        label: 'Optimize Layout',
        action: () => console.log('Start layout optimization'),
        variant: 'primary'
      }
    ]}
  />
);

// Terrain Map Fallback
export const TerrainMapFallback: React.FC<{
  terrainData?: any;
  onRetry?: () => void;
  onExportData?: () => void;
}> = ({ terrainData, onRetry, onExportData }) => (
  <FallbackVisualization
    title="Terrain Analysis"
    data={terrainData}
    error="Terrain map could not be rendered. This may be due to map service issues or complex geographic data."
    onRetry={onRetry}
    onExportData={onExportData}
    alternativeActions={[
      {
        label: 'View Feature List',
        action: () => console.log('Show terrain features list'),
        variant: 'normal'
      },
      {
        label: 'Download Map Data',
        action: () => console.log('Download terrain data'),
        variant: 'normal'
      }
    ]}
  />
);

// Layout Optimization Fallback
export const LayoutOptimizationFallback: React.FC<{
  layoutData?: any;
  onRetry?: () => void;
  onExportData?: () => void;
}> = ({ layoutData, onRetry, onExportData }) => (
  <FallbackVisualization
    title="Layout Optimization"
    data={layoutData}
    error="Layout optimization visualization could not be displayed. The optimization results are still available."
    onRetry={onRetry}
    onExportData={onExportData}
    alternativeActions={[
      {
        label: 'View Optimization Results',
        action: () => console.log('Show optimization results'),
        variant: 'primary'
      },
      {
        label: 'Export Layout',
        action: () => console.log('Export layout data'),
        variant: 'normal'
      }
    ]}
  />
);

// Suitability Assessment Fallback
export const SuitabilityAssessmentFallback: React.FC<{
  suitabilityData?: any;
  onRetry?: () => void;
  onExportData?: () => void;
}> = ({ suitabilityData, onRetry, onExportData }) => (
  <FallbackVisualization
    title="Site Suitability Assessment"
    data={suitabilityData}
    error="Suitability assessment visualization could not be rendered. The assessment results are still available."
    onRetry={onRetry}
    onExportData={onExportData}
    alternativeActions={[
      {
        label: 'View Assessment Report',
        action: () => console.log('Show assessment report'),
        variant: 'primary'
      },
      {
        label: 'Compare Sites',
        action: () => console.log('Start site comparison'),
        variant: 'normal'
      }
    ]}
  />
);

/**
 * Progressive loading fallback for slow-loading visualizations
 */
export const ProgressiveLoadingFallback: React.FC<{
  title: string;
  stage: string;
  progress?: number;
  onCancel?: () => void;
}> = ({ title, stage, progress, onCancel }) => (
  <Container>
    <Header variant="h3">{title}</Header>
    
    <SpaceBetween direction="vertical" size="m">
      <Alert
        statusIconAriaLabel="Info"
        type="info"
        header="Loading Visualization"
      >
        <SpaceBetween direction="vertical" size="s">
          <div>
            <strong>Current Stage:</strong> {stage}
          </div>
          
          {progress !== undefined && (
            <div>
              <strong>Progress:</strong> {Math.round(progress)}%
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ebed',
                borderRadius: '4px',
                marginTop: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#0972d3',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '14px', color: '#666' }}>
            Complex visualizations may take a few moments to generate. 
            Thank you for your patience.
          </div>
          
          {onCancel && (
            <div>
              <Button
                variant="normal"
                size="small"
                onClick={onCancel}
              >
                Cancel Loading
              </Button>
            </div>
          )}
        </SpaceBetween>
      </Alert>
    </SpaceBetween>
  </Container>
);

export default FallbackVisualization;