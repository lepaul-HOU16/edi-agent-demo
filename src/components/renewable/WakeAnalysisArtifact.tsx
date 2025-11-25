/**
 * Wake Analysis Artifact Component
 * 
 * Displays wake simulation results with heat map visualization and performance metrics.
 * Renders wake deficit analysis, turbine interactions, and energy production impacts.
 */

import React, { useState, useMemo, Suspense } from 'react';
import {
  Container,
  Header,
  Box,
  SpaceBetween,
  Badge,
  ColumnLayout,
  Button,
  Tabs,
  Alert,
  ExpandableSection,
  Spinner
} from '@cloudscape-design/components';
import { WorkflowCTAButtons } from './WorkflowCTAButtons';

// Dynamic import for Plotly (client-side only)
const PlotComponent = React.lazy(() => import('react-plotly.js')) as any;

// Wrapper component for Plot with Suspense
const Plot: React.FC<any> = (props) => (
  <Suspense fallback={<Box textAlign="center" padding="l"><Spinner size="large" /></Box>}>
    <PlotComponent {...props} />
  </Suspense>
);

interface WakeAnalysisArtifactProps {
  data: {
    messageContentType: 'wake_simulation';
    title: string;
    subtitle?: string;
    projectId: string;
    performanceMetrics: {
      annualEnergyProduction?: number;
      netAEP?: number;
      grossAEP?: number;
      capacityFactor: number;
      wakeLosses: number;
      wakeEfficiency?: number;
    };
    turbineMetrics?: {
      count: number;
      totalCapacity: number;
      averageWindSpeed?: number;
    };
    monthlyProduction?: number[];
    visualizations?: {
      wake_heat_map?: string;
      wake_analysis?: string;
      performance_charts?: string[];
      seasonal_analysis?: string;
      variability_analysis?: string;
      wind_rose?: string;
      complete_report?: string;
    };
    windResourceData?: {
      source: string;
      dataYear: number;
      reliability: string;
      meanWindSpeed?: number;
      prevailingDirection?: number;
      dataPoints?: number;
    };
    dataSource?: string;
    dataYear?: number;
    message?: string;
  };
  onFollowUpAction?: (action: string) => void;
}

const WakeAnalysisArtifact: React.FC<WakeAnalysisArtifactProps> = ({ data, onFollowUpAction }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // DEBUG: Log the data structure to see what visualizations are available
  console.log('🔍 [WakeAnalysisArtifact] Received data:', {
    hasVisualizations: !!data.visualizations,
    visualizations: data.visualizations,
    visualizationKeys: data.visualizations ? Object.keys(data.visualizations) : [],
    visualizationValues: data.visualizations ? Object.entries(data.visualizations).map(([key, val]) => ({
      key,
      hasValue: !!val,
      isArray: Array.isArray(val),
      length: Array.isArray(val) ? val.length : undefined,
      preview: typeof val === 'string' ? val.substring(0, 50) + '...' : val
    })) : []
  });
  
  // CRITICAL DEBUG: Log performance_charts specifically
  if (data.visualizations?.performance_charts) {
    console.log('📊 [WakeAnalysisArtifact] performance_charts:', {
      isArray: Array.isArray(data.visualizations.performance_charts),
      length: data.visualizations.performance_charts.length,
      charts: data.visualizations.performance_charts
    });
  } else {
    console.error('❌ [WakeAnalysisArtifact] NO performance_charts found!', {
      visualizations: data.visualizations,
      hasPerformanceCharts: !!data.visualizations?.performance_charts
    });
  }

  // Calculate key metrics with error handling
  const metrics = useMemo(() => {
    try {
      const aep = data.performanceMetrics.netAEP || data.performanceMetrics.annualEnergyProduction || 0;
      const cf = data.performanceMetrics.capacityFactor;
      const wakeLoss = data.performanceMetrics.wakeLosses;
      const wakeEfficiency = data.performanceMetrics.wakeEfficiency || (1 - wakeLoss);
      
      return {
        aep: aep.toFixed(2),
        cf: (cf * 100).toFixed(1),
        wakeLoss: (wakeLoss * 100).toFixed(1),
        wakeEfficiency: (wakeEfficiency * 100).toFixed(1),
        turbineCount: data.turbineMetrics?.count || 0,
        totalCapacity: data.turbineMetrics?.totalCapacity?.toFixed(1) || '0',
        avgWindSpeed: data.turbineMetrics?.averageWindSpeed?.toFixed(1) || 
                      data.windResourceData?.meanWindSpeed?.toFixed(1) || 'N/A'
      };
    } catch (error) {
      console.error('[WakeAnalysisArtifact] Error calculating metrics:', error);
      setRenderError(`Failed to calculate metrics: ${error instanceof Error ? error.message : String(error)}`);
      return {
        aep: '0',
        cf: '0',
        wakeLoss: '0',
        wakeEfficiency: '0',
        turbineCount: 0,
        totalCapacity: '0',
        avgWindSpeed: 'N/A'
      };
    }
  }, [data]);

  // Determine wake loss severity with error handling
  const wakeLossSeverity = useMemo(() => {
    try {
      const loss = parseFloat(metrics.wakeLoss);
      if (loss < 5) return { color: 'green' as const, label: 'Low' };
      if (loss < 8) return { color: 'blue' as const, label: 'Moderate' };
      if (loss < 12) return { color: 'grey' as const, label: 'High' };
      return { color: 'red' as const, label: 'Very High' };
    } catch (error) {
      console.error('[WakeAnalysisArtifact] Error determining wake loss severity:', error);
      return { color: 'grey' as const, label: 'Unknown' };
    }
  }, [metrics.wakeLoss]);

  // Generate monthly production chart data with error handling
  const monthlyProductionChart = useMemo(() => {
    try {
      if (!data.monthlyProduction || data.monthlyProduction.length === 0) {
        return null;
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return {
        data: [{
          type: 'bar',
          x: months,
          y: data.monthlyProduction,
          marker: {
            color: '#0972d3',
            line: { color: '#0972d3', width: 1 }
          },
          hovertemplate: '<b>%{x}</b><br>Production: %{y:.2f} GWh<extra></extra>'
        }],
        layout: {
          title: {
            text: 'Monthly Energy Production',
            font: { size: 14, weight: 'bold' }
          },
          xaxis: {
            title: 'Month',
            gridcolor: '#e9ebed'
          },
          yaxis: {
            title: 'Energy Production (GWh)',
            gridcolor: '#e9ebed'
          },
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
          height: 350,
          margin: { t: 50, b: 50, l: 60, r: 30 }
        }
      };
    } catch (error) {
      console.error('[WakeAnalysisArtifact] Error generating monthly production chart:', error);
      return null;
    }
  }, [data.monthlyProduction]);

  const handleFollowUpAction = (action: string) => {
    if (onFollowUpAction) {
      onFollowUpAction(action);
    }
  };

  // Comprehensive error boundary - catch any rendering errors
  try {
    return (
      <Container
        header={
          <Header
            variant="h2"
            description={data.subtitle || `Wake simulation analysis for ${metrics.turbineCount} turbines`}
            actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color="green">
                {metrics.aep} GWh/year
              </Badge>
              <Badge color="blue">
                CF: {metrics.cf}%
              </Badge>
              <Badge color={wakeLossSeverity.color}>
                Wake Loss: {metrics.wakeLoss}% ({wakeLossSeverity.label})
              </Badge>
              {data.visualizations?.complete_report && (
                <Button
                  variant="primary"
                  iconName="download"
                  onClick={() => window.open(data.visualizations!.complete_report, '_blank')}
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
          onAction={onFollowUpAction || (() => {})}
        />
        
        {/* Data Source Information */}
        {(data.dataSource || data.windResourceData) && (
          <Alert type="info" header="Data Source">
            Using {data.windResourceData?.source || data.dataSource || 'NREL Wind Toolkit'} data 
            ({data.windResourceData?.dataYear || data.dataYear})
            {data.windResourceData?.dataPoints && 
              ` - ${data.windResourceData.dataPoints.toLocaleString()} data points analyzed`}
          </Alert>
        )}

        {/* Performance Metrics Overview */}
        <ColumnLayout columns={4} variant="text-grid" minColumnWidth={150}>
          <div>
            <Box variant="awsui-key-label">Annual Energy Production</Box>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
              {metrics.aep} GWh
            </div>
            <Box variant="small" color="text-body-secondary">
              Net energy after wake losses
            </Box>
          </div>
          
          <div>
            <Box variant="awsui-key-label">Capacity Factor</Box>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
              {metrics.cf}%
            </div>
            <Box variant="small" color="text-body-secondary">
              Average capacity utilization
            </Box>
          </div>
          
          <div>
            <Box variant="awsui-key-label">Wake Losses</Box>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: wakeLossSeverity.color === 'red' ? '#d13212' : wakeLossSeverity.color === 'grey' ? '#5f6b7a' : '#037f0c' }}>
              {metrics.wakeLoss}%
            </div>
            <Box variant="small" color="text-body-secondary">
              {wakeLossSeverity.label} impact on production
            </Box>
          </div>
          
          <div>
            <Box variant="awsui-key-label">Wake Efficiency</Box>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
              {metrics.wakeEfficiency}%
            </div>
            <Box variant="small" color="text-body-secondary">
              Effective energy capture
            </Box>
          </div>
        </ColumnLayout>

        {/* Turbine Configuration */}
        <ExpandableSection headerText="Turbine Configuration" defaultExpanded={false}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Number of Turbines</Box>
              <Box variant="p">{metrics.turbineCount}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Capacity</Box>
              <Box variant="p">{metrics.totalCapacity} MW</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Average Wind Speed</Box>
              <Box variant="p">{metrics.avgWindSpeed} m/s</Box>
            </div>
          </ColumnLayout>
        </ExpandableSection>

        {/* Visualizations Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <SpaceBetween size="m">
                  {/* Monthly Production Chart */}
                  {monthlyProductionChart && (
                    <Container header={<Header variant="h3">Monthly Energy Production</Header>}>
                      <Plot
                        data={monthlyProductionChart.data}
                        layout={monthlyProductionChart.layout}
                        config={{ responsive: true, displayModeBar: true }}
                        style={{ width: '100%' }}
                      />
                    </Container>
                  )}

                  {/* Performance Summary */}
                  <Container header={<Header variant="h3">Performance Summary</Header>}>
                    <SpaceBetween size="s">
                      <Box>
                        <Box variant="awsui-key-label">Gross AEP</Box>
                        <Box variant="p">
                          {data.performanceMetrics.grossAEP?.toFixed(2) || 'N/A'} GWh/year
                        </Box>
                      </Box>
                      <Box>
                        <Box variant="awsui-key-label">Net AEP (after wake losses)</Box>
                        <Box variant="p">
                          {metrics.aep} GWh/year
                        </Box>
                      </Box>
                      <Box>
                        <Box variant="awsui-key-label">Energy Loss Due to Wake</Box>
                        <Box variant="p">
                          {data.performanceMetrics.grossAEP 
                            ? ((data.performanceMetrics.grossAEP - parseFloat(metrics.aep))).toFixed(2)
                            : 'N/A'} GWh/year
                        </Box>
                      </Box>
                    </SpaceBetween>
                  </Container>
                </SpaceBetween>
              )
            },
            {
              id: 'charts',
              label: 'Analysis Charts',
              content: (
                <SpaceBetween size="m">
                  {/* Show available charts or message if none */}
                  {/* Performance Charts with Real Data */}
                  {data.visualizations?.chartData && (
                    <Container header={<Header variant="h3">Performance Analysis</Header>}>
                      <SpaceBetween size="l">
                        {/* AEP Distribution Spatial */}
                        {data.visualizations.chartData.aep_distribution_spatial && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>AEP Distribution (Spatial)</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.aep_distribution_spatial.x,
                                y: data.visualizations.chartData.aep_distribution_spatial.y,
                                mode: 'markers',
                                type: 'scatter',
                                marker: {
                                  size: 12,
                                  color: data.visualizations.chartData.aep_distribution_spatial.aep,
                                  colorscale: 'Viridis',
                                  showscale: true,
                                  colorbar: {
                                    title: 'AEP (GWh)',
                                    titlefont: { color: 'inherit' },
                                    tickfont: { color: 'inherit' }
                                  }
                                },
                                text: data.visualizations.chartData.aep_distribution_spatial.turbine_ids,
                                hovertemplate: '%{text}<br>AEP: %{marker.color:.2f} GWh<extra></extra>'
                              }]}
                              layout={{
                                xaxis: { title: 'X Position (m)', gridcolor: 'rgba(128,128,128,0.2)' },
                                yaxis: { title: 'Y Position (m)', gridcolor: 'rgba(128,128,128,0.2)' },
                                height: 500,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {data.visualizations.chartData.aep_distribution_bar && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Annual Energy Production per Turbine</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.aep_distribution_bar.turbines,
                                y: data.visualizations.chartData.aep_distribution_bar.aep,
                                type: 'bar',
                                marker: { color: '#0972d3' }
                              }]}
                              layout={{
                                xaxis: { 
                                  title: 'Turbine Number',
                                  gridcolor: 'rgba(128,128,128,0.2)'
                                },
                                yaxis: { 
                                  title: 'AEP (GWh/year)',
                                  gridcolor: 'rgba(128,128,128,0.2)'
                                },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {data.visualizations.chartData.wake_losses && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Wake Losses per Turbine</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.wake_losses.turbines,
                                y: data.visualizations.chartData.wake_losses.losses,
                                type: 'bar',
                                marker: { color: '#d13212' }
                              }]}
                              layout={{
                                xaxis: { 
                                  title: 'Turbine Number',
                                  gridcolor: 'rgba(128,128,128,0.2)'
                                },
                                yaxis: { 
                                  title: 'Wake Loss (%)',
                                  gridcolor: 'rgba(128,128,128,0.2)'
                                },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {/* Wind Rose with Speed Bins */}
                        {data.visualizations.chartData.wind_rose && Array.isArray(data.visualizations.chartData.wind_rose) && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Wind Rose</Box>
                            <Plot
                              data={
                                // Create stacked bar polar chart with speed bins
                                (() => {
                                  const windRoseData = data.visualizations.chartData.wind_rose;
                                  const directions = windRoseData.map((d: any) => d.direction);
                                  const speedBins = windRoseData[0]?.bins || [];
                                  
                                  // Create one trace per speed bin (stacked)
                                  return speedBins.map((_, binIndex: number) => ({
                                    r: windRoseData.map((d: any) => d.bins[binIndex]?.frequency || 0),
                                    theta: directions,
                                    name: speedBins[binIndex]?.speed_range || '',
                                    type: 'barpolar' as any,
                                    marker: {
                                      color: speedBins[binIndex]?.color || '#0972d3',
                                      line: {
                                        color: 'rgba(0,0,0,0.1)',
                                        width: 0.5
                                      }
                                    }
                                  }));
                                })()
                              }
                              layout={{
                                polar: {
                                  bgcolor: 'rgba(0,0,0,0)',
                                  radialaxis: {
                                    visible: true,
                                    gridcolor: 'rgba(128,128,128,0.3)',
                                    tickfont: {
                                      color: 'inherit',
                                      size: 10
                                    },
                                    linecolor: 'rgba(128,128,128,0.3)',
                                    ticksuffix: '%'
                                  },
                                  angularaxis: {
                                    direction: 'clockwise',
                                    gridcolor: 'rgba(128,128,128,0.3)',
                                    tickfont: {
                                      color: 'inherit',
                                      size: 11
                                    },
                                    linecolor: 'rgba(128,128,128,0.3)'
                                  }
                                },
                                barmode: 'stack',
                                height: 550,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: {
                                  color: 'inherit',
                                  family: 'inherit'
                                },
                                margin: { t: 40, r: 120, b: 40, l: 40 },
                                showlegend: true,
                                legend: {
                                  title: { text: 'Wind Speed (m/s)', font: { color: 'inherit' } },
                                  font: { color: 'inherit', size: 11 },
                                  bgcolor: 'rgba(0,0,0,0)',
                                  bordercolor: 'rgba(128,128,128,0.3)',
                                  borderwidth: 1,
                                  x: 1.02,
                                  y: 0.5
                                }
                              } as any}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {/* Wind Speed Distribution */}
                        {data.visualizations.chartData.wind_speed_distribution && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Wind Speed Distribution</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.wind_speed_distribution.wind_speed,
                                y: data.visualizations.chartData.wind_speed_distribution.probability,
                                type: 'scatter',
                                mode: 'lines',
                                fill: 'tozeroy',
                                line: { color: '#0972d3', width: 2 },
                                fillcolor: 'rgba(9, 114, 211, 0.2)'
                              }]}
                              layout={{
                                xaxis: { title: 'Wind Speed (m/s)', gridcolor: 'rgba(128,128,128,0.2)' },
                                yaxis: { title: 'Probability Density', gridcolor: 'rgba(128,128,128,0.2)' },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {/* Power Curve */}
                        {data.visualizations.chartData.power_curve && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Turbine Power Curve</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.power_curve.wind_speed,
                                y: data.visualizations.chartData.power_curve.power,
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: '#0972d3', width: 3 }
                              }]}
                              layout={{
                                xaxis: { title: 'Wind Speed (m/s)', gridcolor: 'rgba(128,128,128,0.2)' },
                                yaxis: { title: 'Power (MW)', gridcolor: 'rgba(128,128,128,0.2)' },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {/* Monthly Production */}
                        {data.visualizations.chartData.monthly_production && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>Monthly Energy Production</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.monthly_production.months,
                                y: data.visualizations.chartData.monthly_production.aep,
                                type: 'bar',
                                marker: { color: '#0972d3' }
                              }]}
                              layout={{
                                xaxis: { title: 'Month', gridcolor: 'rgba(128,128,128,0.2)' },
                                yaxis: { title: 'Energy Production (GWh)', gridcolor: 'rgba(128,128,128,0.2)' },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                        
                        {/* AEP vs Wind Speed */}
                        {data.visualizations.chartData.aep_vs_windspeed && (
                          <Box>
                            <Box variant="h4" padding={{ bottom: 'xs' }}>AEP vs Wind Speed</Box>
                            <Plot
                              data={[{
                                x: data.visualizations.chartData.aep_vs_windspeed.wind_speed,
                                y: data.visualizations.chartData.aep_vs_windspeed.aep,
                                type: 'scatter',
                                mode: 'lines+markers',
                                line: { color: '#0972d3', width: 2 },
                                marker: { size: 6, color: '#0972d3' }
                              }]}
                              layout={{
                                xaxis: { title: 'Wind Speed (m/s)', gridcolor: 'rgba(128,128,128,0.2)' },
                                yaxis: { title: 'AEP (GWh)', gridcolor: 'rgba(128,128,128,0.2)' },
                                height: 400,
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: 'inherit' },
                                margin: { t: 20, r: 20, b: 60, l: 60 }
                              }}
                              config={{ responsive: true, displayModeBar: false }}
                              style={{ width: '100%' }}
                            />
                          </Box>
                        )}
                      </SpaceBetween>
                    </Container>
                  )}
                  
                  {(!data.visualizations || 
                    (!data.visualizations.chartData && (!data.visualizations.performance_charts || data.visualizations.performance_charts.length === 0))) && (
                    <Alert type="info">
                      Analysis charts are being generated. They will appear here once processing is complete.
                    </Alert>
                  )}
                  
                  {/* ALL 8 Performance Charts - Display all charts from performance_charts array (legacy image URLs) */}
                  {data.visualizations?.performance_charts && data.visualizations.performance_charts.length > 0 && (
                    <Container header={<Header variant="h3">Wind Farm Analysis Charts</Header>}>
                      <SpaceBetween size="l">
                        {data.visualizations.performance_charts.map((chartUrl, index) => {
                          // Chart titles based on order from backend
                          const chartTitles = [
                            'AEP Distribution of Each Turbine',
                            'Wake Map',
                            'Wind Rose',
                            'Annual Energy Production per Turbine',
                            'Wake Losses per Turbine',
                            'Wind Speed Distribution',
                            'Turbine Power Curve',
                            'AEP vs Wind Speed'
                          ];
                          
                          return (
                            <Box key={index}>
                              <Box variant="h4" padding={{ bottom: 'xs' }}>
                                {chartTitles[index] || `Chart ${index + 1}`}
                              </Box>
                              <img
                                src={chartUrl}
                                alt={chartTitles[index] || `Chart ${index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '900px', 
                                  height: 'auto',
                                  backgroundColor: '#ffffff',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                                onError={(e) => {
                                  console.error(`Failed to load chart ${index}:`, chartUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </Box>
                          );
                        })}
                      </SpaceBetween>
                    </Container>
                  )}
                  
                  {/* Show message if no charts are visible */}
                  {data.visualizations && 
                   !data.visualizations.chartData && 
                   (!data.visualizations.performance_charts || data.visualizations.performance_charts.length === 0) && (
                    <Alert type="info" header="Charts Not Available">
                      <SpaceBetween size="s">
                        <Box>
                          The wake simulation completed successfully, but visualization charts were not generated.
                        </Box>
                        <Box variant="small" color="text-body-secondary">
                          Available visualization fields: {Object.keys(data.visualizations).join(', ') || 'none'}
                        </Box>
                        <Box variant="small" color="text-body-secondary">
                          Check the browser console for detailed visualization data.
                        </Box>
                      </SpaceBetween>
                    </Alert>
                  )}
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Next Steps / Call to Action */}
        <Container header={<Header variant="h3">Next Steps</Header>}>
          <SpaceBetween size="s">
            <Box variant="p">
              Generate a comprehensive executive report with technical analysis, performance metrics, and project recommendations.
            </Box>
            <Button
              variant="primary"
              onClick={() => handleFollowUpAction('Generate comprehensive executive report with all analysis results')}
            >
              Generate Report
            </Button>
          </SpaceBetween>
        </Container>

        {/* Message */}
        {data.message && (
          <Box variant="small" color="text-body-secondary">
            {data.message}
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
  } catch (error) {
    // Catch any rendering errors and display user-friendly error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[WakeAnalysisArtifact] Rendering error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      projectId: data?.projectId,
      turbineCount: data?.turbineMetrics?.count,
      timestamp: new Date().toISOString()
    });

    // Set error state if not already set
    if (!hasError) {
      setHasError(true);
    }

    return (
      <Container
        header={
          <Header variant="h2">
            Wake Analysis Error
          </Header>
        }
      >
        <Alert
          type="error"
          header="Failed to Render Wake Analysis"
          action={
            <Button
              onClick={() => {
                console.log('[WakeAnalysisArtifact] User clicked reload button');
                setHasError(false);
                setRenderError(null);
                window.location.reload();
              }}
              iconName="refresh"
            >
              Reload Page
            </Button>
          }
        >
          <SpaceBetween size="s">
            <Box>
              An unexpected error occurred while rendering the wake analysis component.
            </Box>
            <Box variant="small" color="text-body-secondary">
              <strong>Error:</strong> {errorMessage}
            </Box>
            <Box variant="small" color="text-body-secondary">
              This may be a temporary issue. Try reloading the page or re-running the wake simulation.
              If the problem persists, please contact support with the error details above.
            </Box>
          </SpaceBetween>
        </Alert>
      </Container>
    );
  }
};

export default WakeAnalysisArtifact;
