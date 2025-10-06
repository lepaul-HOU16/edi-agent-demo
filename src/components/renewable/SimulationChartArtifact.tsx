/**
 * SimulationChartArtifact Component
 * 
 * Renders wind farm simulation artifacts from the renewable energy backend.
 * Displays matplotlib chart images and performance metrics.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout } from '@cloudscape-design/components';

interface SimulationArtifactProps {
  data: {
    messageContentType: 'wind_farm_simulation';
    title: string;
    subtitle?: string;
    projectId: string;
    performanceMetrics: {
      annualEnergyProduction: number;
      capacityFactor: number;
      wakeLosses: number;
      wakeEfficiency?: number;
      grossAEP?: number;
      netAEP?: number;
    };
    chartImages: {
      wakeMap?: string;
      performanceChart?: string;
    };
    // Enhanced visualization data
    visualizations?: {
      wake_map?: string;
      wind_rose?: string;
      performance_charts?: string[];
      monthly_production?: string;
      wake_deficit_heatmap?: string;
      wake_analysis?: string;
    };
    performanceByDirection?: Array<{
      direction: number;
      production: number;
    }>;
    optimizationRecommendations?: string[];
    s3Url?: string;
  };
}

const SimulationChartArtifact: React.FC<SimulationArtifactProps> = ({ data }) => {
  const { performanceMetrics } = data;

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="green">
                {performanceMetrics.annualEnergyProduction.toFixed(0)} MWh/year
              </Badge>
              <Badge color="blue">
                CF: {(performanceMetrics.capacityFactor * 100).toFixed(1)}%
              </Badge>
            </SpaceBetween>
          }
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Performance Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Performance Metrics
          </Box>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="small">Annual Energy Production</Box>
              <div>{performanceMetrics.annualEnergyProduction.toFixed(0)} MWh/year</div>
            </div>
            <div>
              <Box variant="small">Capacity Factor</Box>
              <div>{(performanceMetrics.capacityFactor * 100).toFixed(1)}%</div>
            </div>
            <div>
              <Box variant="small">Wake Losses</Box>
              <div>{(performanceMetrics.wakeLosses * 100).toFixed(1)}%</div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Additional Metrics (if available) */}
        {(performanceMetrics.wakeEfficiency !== undefined ||
          performanceMetrics.grossAEP !== undefined ||
          performanceMetrics.netAEP !== undefined) && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Detailed Metrics
            </Box>
            <ColumnLayout columns={3} variant="text-grid">
              {performanceMetrics.wakeEfficiency !== undefined && (
                <div>
                  <Box variant="small">Wake Efficiency</Box>
                  <div>{(performanceMetrics.wakeEfficiency * 100).toFixed(1)}%</div>
                </div>
              )}
              {performanceMetrics.grossAEP !== undefined && (
                <div>
                  <Box variant="small">Gross AEP</Box>
                  <div>{performanceMetrics.grossAEP.toFixed(0)} MWh/year</div>
                </div>
              )}
              {performanceMetrics.netAEP !== undefined && (
                <div>
                  <Box variant="small">Net AEP</Box>
                  <div>{performanceMetrics.netAEP.toFixed(0)} MWh/year</div>
                </div>
              )}
            </ColumnLayout>
          </Box>
        )}

        {/* Wind Rose Diagram */}
        {data.visualizations?.wind_rose && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Wind Resource Analysis
            </Box>
            <div
              style={{
                width: '100%',
                border: '1px solid #e9ebed',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <img
                src={data.visualizations.wind_rose}
                alt="Wind Rose Diagram"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </div>
          </Box>
        )}

        {/* Performance Charts Gallery */}
        {data.visualizations?.performance_charts && data.visualizations.performance_charts.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Performance Analysis
            </Box>
            <SpaceBetween size="m">
              {data.visualizations.performance_charts.map((chartUrl, index) => (
                <div
                  key={index}
                  style={{
                    width: '100%',
                    border: '1px solid #e9ebed',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={chartUrl}
                    alt={`Performance Analysis Chart ${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </div>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Wake Analysis Chart */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wake Analysis
          </Box>
          <div
            style={{
              width: '100%',
              minHeight: '400px',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              padding: '16px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {data.visualizations?.wake_analysis || data.chartImages.wakeMap ? (
              <img
                src={data.visualizations?.wake_analysis || data.chartImages.wakeMap}
                alt="Wake Analysis Chart"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            ) : (
              <div style={{ color: '#666' }}>
                <div>📊 Wake Analysis Chart</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Chart data not available
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
                  Visualization will be generated with enhanced backend
                </div>
              </div>
            )}
          </div>
        </Box>

        {/* Optimization Recommendations */}
        {data.optimizationRecommendations && data.optimizationRecommendations.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Optimization Recommendations
            </Box>
            <SpaceBetween size="xs">
              {data.optimizationRecommendations.map((recommendation, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    borderLeft: '3px solid #0972d3',
                  }}
                >
                  {recommendation}
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

export default SimulationChartArtifact;
