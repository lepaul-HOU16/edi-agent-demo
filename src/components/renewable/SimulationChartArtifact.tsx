/**
 * Enhanced SimulationChartArtifact Component
 * 
 * Renders comprehensive wind farm simulation artifacts with rich visualizations
 * including wind roses, wake analysis, performance charts, and interactive maps.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, Button, ButtonDropdown } from '@cloudscape-design/components';
import { VisualizationDataParser, VisualizationData, CategorizedVisualizations } from '../../utils/VisualizationDataParser';
import VisualizationRenderer from './VisualizationRenderer';
import { SafeVisualizationWrapper } from './VisualizationErrorBoundary';
import { WorkflowCTAButtons } from './WorkflowCTAButtons';

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
    chartImages?: {
      wakeMap?: string;
      performanceChart?: string;
    };
    // Enhanced visualization data from backend
    visualizations?: {
      wake_map?: string;
      wind_rose?: string;
      performance_charts?: string[];
      monthly_production?: string;
      wake_deficit_heatmap?: string;
      wake_analysis?: string;
      seasonal_analysis?: string;
      variability_analysis?: string;
      wake_heat_map?: string;
      complete_report?: string;
      export_package?: string;
    };
    mapHtml?: string;
    performanceByDirection?: Array<{
      direction: number;
      production: number;
    }>;
    optimizationRecommendations?: string[];
    s3Url?: string;
  };
  onFollowUpAction?: (action: string) => void;
}

const SimulationChartArtifact: React.FC<SimulationArtifactProps> = ({ data, onFollowUpAction }) => {
  const { performanceMetrics } = data;
  
  // Parse all available visualizations from backend response
  const visualizationData: VisualizationData = VisualizationDataParser.parseVisualizationData(data);
  const availableVisualizations = VisualizationDataParser.getAvailableVisualizations(visualizationData);
  const categorizedVisualizations: CategorizedVisualizations = VisualizationDataParser.organizeVisualizationsByCategory(visualizationData);
  const visualizationCount = VisualizationDataParser.getVisualizationCount(visualizationData);

  const handleFollowUpAction = (action: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(action);
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Comprehensive wake simulation analysis with ${visualizationCount} visualizations`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="green">
                {performanceMetrics.annualEnergyProduction.toFixed(0)} MWh/year
              </Badge>
              <Badge color="blue">
                CF: {(performanceMetrics.capacityFactor * 100).toFixed(1)}%
              </Badge>
              <Badge color={performanceMetrics.wakeLosses > 0.08 ? 'red' : performanceMetrics.wakeLosses > 0.05 ? 'grey' : 'green'}>
                Wake: {(performanceMetrics.wakeLosses * 100).toFixed(1)}%
              </Badge>
              {visualizationData.complete_report && (
                <Button
                  variant="primary"
                  iconName="download"
                  onClick={() => window.open(visualizationData.complete_report, '_blank')}
                >
                  Download Report
                </Button>
              )}
            </SpaceBetween>
          }
        >
          {data.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Workflow CTA Buttons - Guide user through workflow */}
        <WorkflowCTAButtons
          completedSteps={['terrain', 'layout', 'simulation']}
          projectId={data.projectId}
          onAction={handleFollowUpAction}
        />
        
        {/* Enhanced Call-to-Actions for Wake Simulation */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Advanced Analysis Options
          </Box>
          <SpaceBetween direction="vertical" size="s">
            <div>
              <Box variant="small" color="text-body-secondary" margin={{ bottom: 'xs' }}>
                Complete your wind farm analysis with these recommended actions:
              </Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  onClick={() => handleFollowUpAction('Generate comprehensive executive report with all analysis results')}
                >
                  Generate Executive Report
                </Button>
                <Button
                  onClick={() => handleFollowUpAction('Optimize turbine layout based on wake analysis results')}
                >
                  Optimize Layout
                </Button>
                <Button
                  onClick={() => handleFollowUpAction('Compare this scenario with alternative layouts')}
                >
                  Compare Scenarios
                </Button>
              </SpaceBetween>
            </div>
            
            <div>
              <Box variant="small" color="text-body-secondary" margin={{ bottom: 'xs' }}>
                Advanced analysis and export options:
              </Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => handleFollowUpAction('Perform detailed financial analysis and ROI calculation')}
                >
                  Financial Analysis
                </Button>
                <Button
                  onClick={() => handleFollowUpAction('Generate environmental impact assessment report')}
                >
                  Environmental Impact
                </Button>
                <ButtonDropdown
                  items={[
                    { id: 'export-pdf', text: 'Export PDF Report', description: 'Complete analysis in PDF format' },
                    { id: 'export-excel', text: 'Export Excel Data', description: 'Raw data and calculations' },
                    { id: 'export-presentation', text: 'Export Presentation', description: 'Executive summary slides' },
                    { id: 'export-technical', text: 'Export Technical Report', description: 'Detailed engineering report' }
                  ]}
                  onItemClick={({ detail }) => {
                    switch (detail.id) {
                      case 'export-pdf':
                        handleFollowUpAction('Export complete analysis as PDF report');
                        break;
                      case 'export-excel':
                        handleFollowUpAction('Export analysis data to Excel spreadsheet');
                        break;
                      case 'export-presentation':
                        handleFollowUpAction('Create executive presentation with key findings');
                        break;
                      case 'export-technical':
                        handleFollowUpAction('Generate detailed technical engineering report');
                        break;
                    }
                  }}
                >
                  Export Options
                </ButtonDropdown>
              </SpaceBetween>
            </div>
          </SpaceBetween>
        </Box>

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

        {/* Wind Resource Analysis */}
        {VisualizationDataParser.hasVisualizationsInCategory(categorizedVisualizations, 'wind_analysis') && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Wind Resource Analysis
            </Box>
            <SpaceBetween size="m">
              {categorizedVisualizations.wind_analysis.wind_rose && (
                <SafeVisualizationWrapper
                  title="Wind Rose Analysis"
                  fallbackMessage="Wind rose diagram showing directional patterns"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.wind_analysis.wind_rose}
                    title="Wind Rose Diagram"
                    description="Directional wind patterns and frequency distribution showing optimal turbine orientation"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
              {categorizedVisualizations.wind_analysis.seasonal_analysis && (
                <SafeVisualizationWrapper
                  title="Seasonal Wind Analysis"
                  fallbackMessage="Seasonal wind pattern analysis"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.wind_analysis.seasonal_analysis}
                    title="Seasonal Wind Analysis"
                    description="Monthly and seasonal wind pattern variations affecting energy production"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
              {categorizedVisualizations.wind_analysis.variability_analysis && (
                <SafeVisualizationWrapper
                  title="Wind Resource Variability"
                  fallbackMessage="Long-term wind resource trends"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.wind_analysis.variability_analysis}
                    title="Wind Resource Variability"
                    description="Long-term wind resource trends and inter-annual variability analysis"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
            </SpaceBetween>
          </Box>
        )}

        {/* Performance Analysis Charts */}
        {VisualizationDataParser.hasVisualizationsInCategory(categorizedVisualizations, 'performance_analysis') && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Performance Analysis
            </Box>
            <SpaceBetween size="m">
              {categorizedVisualizations.performance_analysis.performance_charts?.map((chartUrl, index) => (
                <SafeVisualizationWrapper
                  key={index}
                  title={`Performance Analysis ${index + 1}`}
                  fallbackMessage="Performance analysis chart"
                >
                  <VisualizationRenderer
                    imageUrl={chartUrl}
                    title={`Performance Analysis ${index + 1}`}
                    description="Turbine performance metrics, capacity factors, and production analysis"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              ))}
              {categorizedVisualizations.performance_analysis.monthly_production && (
                <SafeVisualizationWrapper
                  title="Monthly Production Analysis"
                  fallbackMessage="Monthly energy production patterns"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.performance_analysis.monthly_production}
                    title="Monthly Production Analysis"
                    description="Monthly energy production patterns and seasonal variations"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
              {categorizedVisualizations.performance_analysis.capacity_factor_analysis && (
                <SafeVisualizationWrapper
                  title="Capacity Factor Analysis"
                  fallbackMessage="Capacity factor distribution analysis"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.performance_analysis.capacity_factor_analysis}
                    title="Capacity Factor Analysis"
                    description="Capacity factor distribution and statistical analysis"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
            </SpaceBetween>
          </Box>
        )}

        {/* Wake Analysis */}
        {VisualizationDataParser.hasVisualizationsInCategory(categorizedVisualizations, 'wake_analysis') && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Wake Analysis
            </Box>
            <SpaceBetween size="m">
              {categorizedVisualizations.wake_analysis.wake_heat_map && (
                <SafeVisualizationWrapper
                  title="Wake Heat Map"
                  fallbackMessage="Interactive wake deficit visualization"
                >
                  <VisualizationRenderer
                    htmlContent={data.mapHtml}
                    imageUrl={categorizedVisualizations.wake_analysis.wake_heat_map}
                    title="Wake Heat Map"
                    description="Interactive wake deficit visualization with turbine interactions and energy loss patterns"
                    category="map"
                    height="500px"
                  />
                </SafeVisualizationWrapper>
              )}
              {categorizedVisualizations.wake_analysis.wake_analysis && (
                <SafeVisualizationWrapper
                  title="Wake Deficit Analysis"
                  fallbackMessage="Wake deficit patterns and energy loss analysis"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.wake_analysis.wake_analysis}
                    title="Wake Deficit Analysis"
                    description="Wake deficit patterns, energy loss analysis, and turbine interaction effects"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
              {categorizedVisualizations.wake_analysis.wake_deficit_heatmap && (
                <SafeVisualizationWrapper
                  title="Wake Deficit Heat Map"
                  fallbackMessage="Detailed wake deficit heat map"
                >
                  <VisualizationRenderer
                    imageUrl={categorizedVisualizations.wake_analysis.wake_deficit_heatmap}
                    title="Wake Deficit Heat Map"
                    description="Detailed wake deficit heat map showing spatial distribution of energy losses"
                    category="chart"
                  />
                </SafeVisualizationWrapper>
              )}
            </SpaceBetween>
          </Box>
        )}

        {/* Interactive Maps */}
        {categorizedVisualizations.interactive_maps.interactive_map && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Interactive Analysis Map
            </Box>
            <SafeVisualizationWrapper
              title="Interactive Wind Farm Map"
              fallbackMessage="Interactive map with turbine locations and analysis overlays"
            >
              <VisualizationRenderer
                htmlContent={data.mapHtml}
                imageUrl={categorizedVisualizations.interactive_maps.interactive_map}
                title="Interactive Wind Farm Map"
                description="Interactive map with turbine locations, wake analysis overlays, and site characteristics"
                category="map"
                height="600px"
              />
            </SafeVisualizationWrapper>
          </Box>
        )}

        {/* Fallback for legacy chart display */}
        {!availableVisualizations.length && (
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
              {data.visualizations?.wake_analysis || data.chartImages?.wakeMap ? (
                <img
                  src={data.visualizations?.wake_analysis || data.chartImages?.wakeMap}
                  alt="Wake Analysis Chart"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              ) : (
                <div style={{ color: '#666' }}>
                  <div>📊 Advanced Visualizations</div>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    Rich visualizations are being generated by the backend
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
                    Wind rose, wake analysis, and performance charts will appear here
                  </div>
                </div>
              )}
            </div>
          </Box>
        )}

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

        {/* Analysis Summary with Key Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Analysis Summary
          </Box>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="small">Performance Rating</Box>
              <div style={{ 
                color: performanceMetrics.capacityFactor > 0.4 ? '#0972d3' : 
                       performanceMetrics.capacityFactor > 0.3 ? '#ff9900' : '#d13212' 
              }}>
                {performanceMetrics.capacityFactor > 0.4 ? 'Excellent' : 
                 performanceMetrics.capacityFactor > 0.3 ? 'Good' : 'Below Average'}
              </div>
            </div>
            <div>
              <Box variant="small">Wake Impact</Box>
              <div style={{ 
                color: performanceMetrics.wakeLosses < 0.05 ? '#0972d3' : 
                       performanceMetrics.wakeLosses < 0.08 ? '#ff9900' : '#d13212' 
              }}>
                {performanceMetrics.wakeLosses < 0.05 ? 'Low' : 
                 performanceMetrics.wakeLosses < 0.08 ? 'Moderate' : 'High'}
              </div>
            </div>
            <div>
              <Box variant="small">Optimization Potential</Box>
              <div style={{ color: '#0972d3' }}>
                {performanceMetrics.wakeLosses > 0.08 ? 'High' : 
                 performanceMetrics.wakeLosses > 0.05 ? 'Moderate' : 'Low'}
              </div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Project ID */}
        <Box variant="small" color="text-body-secondary">
          Project ID: {data.projectId} | Simulation completed at {new Date().toLocaleString()}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default SimulationChartArtifact;
