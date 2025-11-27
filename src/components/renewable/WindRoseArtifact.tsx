/**
 * WindRoseArtifact Component
 * Displays wind rose analysis with client-side Plotly rendering
 */

import React, { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Table, Pagination, Button, Alert } from '@cloudscape-design/components';
import PlotlyWindRose from './PlotlyWindRose';
import { ActionButtons } from './ActionButtons';
import { WorkflowCTAButtons } from './WorkflowCTAButtons';
import { useProjectContext, extractProjectFromArtifact } from '../../contexts/ProjectContext';

// Error Boundary for Plotly visualization
class WindRoseErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WindRose visualization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert type="error" header="Visualization Error">
          Failed to render wind rose chart: {this.state.error?.message || 'Unknown error'}
          <br />
          <small>Please try refreshing the analysis or contact support if the issue persists.</small>
        </Alert>
      );
    }
    return this.props.children;
  }
}

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

interface WindRoseData {
  direction: string;
  angle: number;
  frequency: number;
  avg_speed: number;
  max_speed: number;
}

interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}

interface WindRoseArtifactProps {
  data: {
    messageContentType: 'wind_rose_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    visualizationUrl?: string;
    windRoseUrl?: string;
    mapUrl?: string;
    fallbackVisualization?: string;  // PNG fallback for Plotly visualization
    windRoseData: WindRoseData[];
    windStatistics: {
      averageSpeed: number;
      maxSpeed: number;
      prevailingDirection: string;
      directionCount: number;
    };
    // Plotly wind rose data (new format)
    plotlyWindRose?: {
      data: any[];
      layout: any;
      statistics: {
        average_speed: number;
        max_speed: number;
        prevailing_direction: string;
        prevailing_frequency: number;
      };
      dataSource?: string;  // Data source (e.g., "NREL Wind Toolkit")
      dataYear?: number;    // Data year
      dataQuality?: 'high' | 'medium' | 'low';  // Data quality
    };
    // Legacy format support
    metrics?: {
      avgWindSpeed: number;
      maxWindSpeed: number;
      prevailingDirection: string;
      totalObservations: number;
    };
    windData?: {
      directions: DirectionDetail[];
    };
    // Error information
    error?: {
      code: string;
      message: string;
      instructions?: string;
      details?: any;
    };
  };
  actions?: ActionButton[];  // Contextual action buttons from orchestrator
  onFollowUpAction?: (action: string) => void;
}

const WindRoseArtifact: React.FC<WindRoseArtifactProps> = ({ data, actions, onFollowUpAction }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 8;
  
  // Get project context
  const { setActiveProject } = useProjectContext();

  // Extract and set project context when data changes
  useEffect(() => {
    // Enhance data with normalized coordinates if available
    const enhancedData: any = { ...data };
    if (data.coordinates) {
      enhancedData.coordinates = {
        latitude: data.coordinates.lat,
        longitude: data.coordinates.lng
      };
      if (!enhancedData.location) {
        enhancedData.location = `${data.coordinates.lat.toFixed(4)}, ${data.coordinates.lng.toFixed(4)}`;
      }
    }
    
    const projectInfo = extractProjectFromArtifact(enhancedData, 'WindRoseArtifact');
    if (projectInfo) {
      setActiveProject(projectInfo);
    } else {
      console.warn('⚠️ [WindRoseArtifact] Failed to extract project information from artifact data');
    }
  }, [data, setActiveProject]);
  
  const handleActionClick = (query: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(query);
    }
  };

  // Export handlers
  const handleExportData = () => {
    const exportData = {
      projectId: data.projectId,
      coordinates: data.coordinates,
      windRoseData: data.windRoseData,
      windStatistics: data.windStatistics,
      plotlyWindRose: data.plotlyWindRose,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `wind_rose_data_${data.projectId}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Use new data structure or fall back to legacy
  const stats = data.windStatistics || data.metrics;
  const windRoseData = data.windRoseData || [];
  const directions = data.windData?.directions || windRoseData;
  
  // Debug logging to track renders and visualization path (after windRoseData is defined)
  console.log('🌹 WindRoseArtifact RENDER:', {
    projectId: data.projectId,
    hasPlotlyData: !!data.plotlyWindRose,
    hasVisualizationUrl: !!(data.visualizationUrl || data.windRoseUrl || data.mapUrl),
    hasWindRoseData: windRoseData.length > 0,
    visualizationPath: data.plotlyWindRose ? 'PLOTLY' : 
                       (data.visualizationUrl || data.windRoseUrl || data.mapUrl) ? 'PNG' :
                       windRoseData.length > 0 ? 'SVG' : 'NONE',
    plotlyDataKeys: data.plotlyWindRose ? Object.keys(data.plotlyWindRose) : [],
    visualizationUrl: data.visualizationUrl || data.windRoseUrl || data.mapUrl,
    timestamp: new Date().toISOString()
  });
  
  // Helper functions to safely access stats
  const getAvgSpeed = () => {
    if (!stats) return 0;
    return 'averageSpeed' in stats ? stats.averageSpeed : stats.avgWindSpeed;
  };
  
  const getMaxSpeed = () => {
    if (!stats) return 0;
    return 'maxSpeed' in stats ? stats.maxSpeed : stats.maxWindSpeed;
  };
  
  const getDirectionCount = () => {
    if (!stats) return windRoseData.length;
    return 'directionCount' in stats ? stats.directionCount : stats.totalObservations;
  };

  // Check for error state
  if (data.error) {
    return (
      <Container
        header={
          <Header
            variant="h2"
            description="Wind resource analysis error"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.title}</span>
              <Badge color="red">Error</Badge>
            </div>
          </Header>
        }
      >
        <SpaceBetween size="l">
          <div style={{
            padding: '32px',
            backgroundColor: '#fef6f6',
            borderRadius: '8px',
            border: '2px solid #d91515'
          }}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d91515', textAlign: 'center', marginBottom: '12px' }}>
              {data.error.message}
            </div>
            {data.error.instructions && (
              <div style={{ 
                fontSize: '14px', 
                color: '#5f6b7a',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                {data.error.instructions}
              </div>
            )}
            
            {/* NREL-specific error guidance */}
            {data.error.code === 'NREL_API_KEY_MISSING' && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ebed',
                marginTop: '16px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Setup Instructions:</div>
                <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
                  <li>Get a free NREL API key at: <a href="https://developer.nrel.gov/signup/" target="_blank" rel="noopener noreferrer" style={{ color: '#0972d3' }}>developer.nrel.gov/signup</a></li>
                  <li>Configure NREL_API_KEY environment variable in Lambda</li>
                  <li>Or set up AWS Secrets Manager with key 'nrel/api_key'</li>
                  <li>Restart the application and try again</li>
                </ol>
              </div>
            )}
            
            {data.error.code === 'NREL_API_RATE_LIMIT' && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ebed',
                marginTop: '16px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Rate Limit Exceeded</div>
                <div style={{ fontSize: '14px' }}>
                  The NREL API has rate limits. Please wait a few minutes and try again.
                  {data.error.details?.retry_after && (
                    <div style={{ marginTop: '8px' }}>
                      Retry after: {data.error.details.retry_after} seconds
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {data.error.code === 'INVALID_COORDINATES' && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ebed',
                marginTop: '16px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Coverage Area</div>
                <div style={{ fontSize: '14px' }}>
                  NREL Wind Toolkit data is only available for locations within the continental United States.
                  Please provide coordinates within the US coverage area.
                </div>
              </div>
            )}
            
            {/* No synthetic data message */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#037f0c',
              color: '#ffffff',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              ✓ NO SYNTHETIC DATA USED - Real NREL data required for accurate analysis
            </div>
          </div>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Professional wind resource analysis with directional frequency distribution"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{data.title}</span>
            {stats && (
              <>
                <Badge color="blue">
                  {getAvgSpeed().toFixed(1)} m/s avg
                </Badge>
                <Badge color="green">
                  {stats.prevailingDirection} prevailing
                </Badge>
              </>
            )}
          </div>
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Workflow CTA Buttons - Guide user through workflow */}
        <WorkflowCTAButtons
          completedSteps={['terrain', 'layout', 'simulation', 'windrose']}
          projectId={data.projectId}
          onAction={handleActionClick}
        />
        
        {/* Legacy Action Buttons (if provided by orchestrator) */}
        {actions && actions.length > 0 && (
          <ActionButtons 
            actions={actions} 
            onActionClick={handleActionClick}
          />
        )}

        {stats && (
          <ColumnLayout columns={4} variant="text-grid" minColumnWidth={150}>
            <div>
              <Box variant="awsui-key-label">Avg Wind Speed</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {getAvgSpeed().toFixed(1)} m/s
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Max Wind Speed</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {getMaxSpeed().toFixed(1)} m/s
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Prevailing Direction</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {stats.prevailingDirection}
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Direction Count</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {getDirectionCount()}
              </div>
            </div>
          </ColumnLayout>
        )}

        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Rose Diagram
          </Box>
          {(() => {
            // Debug logging
            console.log('🌹 WindRoseArtifact rendering decision:', {
              hasPlotlyWindRose: !!data.plotlyWindRose,
              hasVisualizationUrl: !!(data.visualizationUrl || data.windRoseUrl || data.mapUrl),
              hasWindRoseData: windRoseData.length > 0,
              plotlyDataType: data.plotlyWindRose ? typeof data.plotlyWindRose : 'undefined',
              plotlyDataKeys: data.plotlyWindRose ? Object.keys(data.plotlyWindRose) : []
            });
            return null;
          })()}
          {data.plotlyWindRose ? (
            // Use Plotly interactive wind rose (preferred) - auto-detects theme
            <WindRoseErrorBoundary>
              <PlotlyWindRose
                data={data.plotlyWindRose.data}
                layout={data.plotlyWindRose.layout}
                projectId={data.projectId}
                statistics={data.plotlyWindRose.statistics}
                dataSource={data.plotlyWindRose.dataSource}
                dataYear={data.plotlyWindRose.dataYear}
                dataQuality={data.plotlyWindRose.dataQuality}
              />
            </WindRoseErrorBoundary>
          ) : (data.visualizationUrl || data.windRoseUrl || data.mapUrl || data.fallbackVisualization) ? (
            // Fallback to matplotlib PNG
            <div style={{ width: '100%', minHeight: '500px', border: '1px solid #e9ebed', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
              <img 
                src={data.fallbackVisualization || data.visualizationUrl || data.windRoseUrl || data.mapUrl} 
                alt="Wind Rose Diagram" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => {
                  console.error('Failed to load wind rose image:', data.fallbackVisualization || data.visualizationUrl || data.windRoseUrl || data.mapUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<div style="padding: 16px; text-align: center; color: #666;">Failed to load wind rose visualization</div>';
                  }
                }}
              />
            </div>
          ) : windRoseData.length > 0 ? (
            <div style={{ width: '100%', minHeight: '500px', border: '1px solid #e9ebed', borderRadius: '8px', backgroundColor: '#fff', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '400px', height: '400px' }}>
                {/* Compass directions */}
                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold', fontSize: '14px' }}>N</div>
                <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold', fontSize: '14px' }}>S</div>
                <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '14px' }}>W</div>
                <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '14px' }}>E</div>
                
                {/* Circular grid */}
                <svg width="400" height="400" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle cx="200" cy="200" r="180" fill="none" stroke="#e9ebed" strokeWidth="1" />
                  <circle cx="200" cy="200" r="120" fill="none" stroke="#e9ebed" strokeWidth="1" />
                  <circle cx="200" cy="200" r="60" fill="none" stroke="#e9ebed" strokeWidth="1" />
                  
                  {/* Direction lines */}
                  {windRoseData.map((item, index) => {
                    const angle = (item.angle - 90) * (Math.PI / 180);
                    const maxRadius = 180;
                    const barHeight = (item.frequency / Math.max(...windRoseData.map(d => d.frequency))) * maxRadius;
                    const x1 = 200;
                    const y1 = 200;
                    const x2 = 200 + Math.cos(angle) * barHeight;
                    const y2 = 200 + Math.sin(angle) * barHeight;
                    const color = `hsl(${200 + (item.avg_speed / 15) * 60}, 70%, 50%)`;
                    
                    return (
                      <g key={index}>
                        <line 
                          x1={x1} 
                          y1={y1} 
                          x2={x2} 
                          y2={y2} 
                          stroke={color}
                          strokeWidth="12"
                          opacity="0.8"
                        />
                        <circle cx={x2} cy={y2} r="4" fill={color} />
                      </g>
                    );
                  })}
                  
                  {/* Center point */}
                  <circle cx="200" cy="200" r="5" fill="#0972d3" />
                </svg>
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center', color: '#5f6b7a', fontSize: '12px' }}>
                <div>Wind Rose - Directional Frequency Distribution</div>
                <div style={{ marginTop: '4px' }}>Bar length represents frequency, color represents wind speed</div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', minHeight: '500px', border: '1px solid #e9ebed', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', textAlign: 'center' }}>
              <div>
                <div>📊 Wind Rose Visualization</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>No wind data available</div>
              </div>
            </div>
          )}
        </Box>

        {directions.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Directional Wind Analysis ({directions.length} directions)
            </Box>
            <Table
              columnDefinitions={[
                { 
                  id: 'direction', 
                  header: <Box padding={{ left: 's' }} fontWeight="bold">Direction</Box>, 
                  cell: (item: any) => (
                    <Box padding={{ left: 's' }}>
                      <strong>{item.direction}</strong>{' '}
                      <span style={{ fontSize: '12px', color: '#5f6b7a' }}>{item.angle}°</span>
                    </Box>
                  ), 
                  minWidth: 100 
                },
                { 
                  id: 'frequency', 
                  header: 'Frequency', 
                  cell: (item: any) => (
                    <div>
                      {item.frequency.toFixed(1)}%
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#e9ebed', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.frequency}%`, height: '100%', backgroundColor: '#0972d3', borderRadius: '2px' }} />
                      </div>
                    </div>
                  ), 
                  minWidth: 120 
                },
                { 
                  id: 'avgSpeed', 
                  header: 'Avg Speed', 
                  cell: (item: any) => `${item.avg_speed.toFixed(1)} m/s`, 
                  minWidth: 100 
                },
                { 
                  id: 'maxSpeed', 
                  header: 'Max Speed', 
                  cell: (item: any) => `${item.max_speed.toFixed(1)} m/s`, 
                  minWidth: 100 
                },
              ]}
              items={directions.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize)}
              loadingText="Loading direction data"
              empty={<Box textAlign="center" color="inherit"><b>No direction data available</b></Box>}
              contentDensity="comfortable"
              pagination={
                directions.length > pageSize ? (
                  <Pagination 
                    currentPageIndex={currentPageIndex} 
                    pagesCount={Math.ceil(directions.length / pageSize)} 
                    onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)} 
                    ariaLabels={{ 
                      nextPageLabel: 'Next page', 
                      previousPageLabel: 'Previous page', 
                      pageLabel: (pageNumber) => `Page ${pageNumber}` 
                    }} 
                  />
                ) : undefined
              }
            />
          </Box>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <Box variant="small" color="text-body-secondary">
            Project ID: {data.projectId}
          </Box>
          <Button
            iconName="download"
            variant="primary"
            onClick={handleExportData}
          >
            Export Data
          </Button>
        </div>
      </SpaceBetween>
    </Container>
  );
};

export default WindRoseArtifact;
