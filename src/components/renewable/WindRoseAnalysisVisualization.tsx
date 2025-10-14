/**
 * Wind Rose Analysis Visualization Component
 * 
 * Complete wind rose analysis component with Cloudscape design system integration,
 * seasonal analysis, statistics tables, and workflow integration.
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Table,
  Badge,
  Button,
  ButtonDropdown,
  Tabs,
  Alert,
  ProgressBar,
  Spinner
} from '@cloudscape-design/components';
import WindRoseChart from './WindRoseChart';
import { SimpleCallToActionPanel } from './SimpleCallToActionPanel';
import WindStatisticsTable from './WindStatisticsTable';
import WindRoseWorkflowIntegration from './WindRoseWorkflowIntegration';
import { 
  WindResourceData, 
  SeasonalWindData, 
  WindStatistics,
  TemporalWindAnalysis,
  MonthlyWindData,
  WindRoseExportData
} from '../../types/windData';
import { WorkflowStepProps } from '../../types/workflow';

interface WindRoseAnalysisVisualizationProps extends Partial<WorkflowStepProps> {
  windData: WindResourceData;
  seasonalData?: SeasonalWindData;
  temporalData?: TemporalWindAnalysis;
  isLoading?: boolean;
  error?: string;
  onExport?: (format: string, data: WindRoseExportData) => void;
  onAnalysisComplete?: (results: WindRoseAnalysisResults) => void;
}

interface WindRoseAnalysisResults {
  windResourceAssessment: 'excellent' | 'good' | 'fair' | 'poor';
  recommendedTurbineOrientation: number;
  seasonalVariability: 'low' | 'medium' | 'high';
  energyPotentialRating: number; // 0-100
  nextRecommendedSteps: string[];
  keyFindings: string[];
}

interface StatisticsTableItem {
  parameter: string;
  value: string;
  unit: string;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
}

const WindRoseAnalysisVisualization: React.FC<WindRoseAnalysisVisualizationProps> = ({
  windData,
  seasonalData,
  temporalData,
  isLoading = false,
  error,
  onExport,
  onAnalysisComplete,
  stepId,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow
}) => {
  const [activeTab, setActiveTab] = useState('wind-rose');
  const [exportInProgress, setExportInProgress] = useState(false);

  // Calculate analysis results
  const analysisResults: WindRoseAnalysisResults = useMemo(() => {
    return calculateWindRoseAnalysisResults(windData, seasonalData);
  }, [windData, seasonalData]);

  // Prepare statistics table data
  const statisticsData: StatisticsTableItem[] = useMemo(() => {
    return prepareStatisticsTableData(windData.statistics, analysisResults);
  }, [windData.statistics, analysisResults]);

  // Monthly data for table display
  const monthlyTableData = useMemo(() => {
    if (!seasonalData) return [];
    return seasonalData.monthlyData.map(month => ({
      month: month.monthName,
      meanSpeed: `${month.statistics.meanWindSpeed.toFixed(1)} m/s`,
      prevailingDirection: getDirectionLabel(month.statistics.prevailingDirection),
      powerDensity: `${month.statistics.powerDensity.toFixed(0)} W/m²`,
      capacityFactor: `${(month.turbineCapacityFactor * 100).toFixed(1)}%`,
      energyRanking: month.energyPotential
    }));
  }, [seasonalData]);

  // Handle export functionality
  const handleExport = async (format: string) => {
    if (!onExport) return;
    
    setExportInProgress(true);
    try {
      const exportData: WindRoseExportData = {
        windRoseData: {
          directionBins: [], // This would be populated from the chart component
          totalObservations: windData.windData.length,
          calmPercentage: windData.statistics.calmPercentage,
          config: {
            directionBins: 16,
            speedBins: [],
            colorScheme: [],
            showCalm: true,
            calmThreshold: 1.0,
            units: 'metric'
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: windData.dataSource,
            measurementHeight: windData.measurementHeight,
            location: windData.location,
            timeRange: windData.timeRange,
            qualityScore: windData.qualityMetrics.completeness
          }
        },
        visualizationConfig: {
          chartType: 'polar',
          showFrequency: true,
          showSpeed: true,
          showCalm: true,
          interactive: true,
          exportFormats: ['png', 'svg', 'pdf', 'json'],
          dimensions: { width: 800, height: 600 },
          styling: {
            colorScheme: 'viridis',
            showGrid: true,
            showLabels: true,
            fontSize: 12,
            lineWidth: 1,
            transparency: 0.8
          }
        },
        statistics: windData.statistics,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportFormat: format,
          version: '1.0'
        },
        rawData: windData.windData
      };

      await onExport(format, exportData);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportInProgress(false);
    }
  };

  // Handle workflow completion
  const handleAnalysisComplete = () => {
    if (onAnalysisComplete) {
      onAnalysisComplete(analysisResults);
    }

    if (onStepComplete && stepId) {
      onStepComplete(stepId, {
        stepId,
        success: true,
        data: {
          windResourceAssessment: analysisResults.windResourceAssessment,
          energyPotentialRating: analysisResults.energyPotentialRating,
          recommendedOrientation: analysisResults.recommendedTurbineOrientation,
          keyFindings: analysisResults.keyFindings
        },
        artifacts: [windData],
        nextRecommendedStep: 'wake_analysis'
      });
    }
  };

  // Handle next step navigation
  const handleNextStep = (nextStepId: string) => {
    if (onAdvanceWorkflow) {
      onAdvanceWorkflow(nextStepId);
    }
  };

  if (error) {
    return (
      <Container>
        <Alert type="error" header="Wind Rose Analysis Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Box textAlign="center" padding="xl">
          <Spinner size="large" />
          <Box variant="p" margin={{ top: 'm' }}>
            Analyzing wind resource data and generating wind rose visualization...
          </Box>
          <ProgressBar value={65} description="Processing wind measurements" />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={`Comprehensive wind resource analysis for ${windData.location.name || 'selected location'} with ${windData.windData.length.toLocaleString()} measurements`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={getWindResourceBadgeColor(analysisResults.windResourceAssessment)}>
                {analysisResults.windResourceAssessment.toUpperCase()}
              </Badge>
              <Badge color="blue">
                {analysisResults.energyPotentialRating}/100
              </Badge>
              <ButtonDropdown
                items={[
                  { id: 'png', text: 'Export PNG', description: 'High-resolution image' },
                  { id: 'svg', text: 'Export SVG', description: 'Vector graphics' },
                  { id: 'pdf', text: 'Export PDF', description: 'Complete report' },
                  { id: 'json', text: 'Export Data', description: 'Raw analysis data' },
                  { id: 'excel', text: 'Export Excel', description: 'Spreadsheet format' }
                ]}
                onItemClick={({ detail }) => handleExport(detail.id)}
                loading={exportInProgress}
                disabled={exportInProgress}
              >
                Export Results
              </ButtonDropdown>
            </SpaceBetween>
          }
        >
          Wind Rose Analysis
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Key Findings Alert */}
        <Alert
          type={analysisResults.windResourceAssessment === 'excellent' ? 'success' : 
                analysisResults.windResourceAssessment === 'good' ? 'info' : 'warning'}
          header={`Wind Resource Assessment: ${analysisResults.windResourceAssessment.toUpperCase()}`}
        >
          <SpaceBetween size="xs">
            {analysisResults.keyFindings.map((finding, index) => (
              <div key={index}>• {finding}</div>
            ))}
          </SpaceBetween>
        </Alert>

        {/* Analysis Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'wind-rose',
              label: 'Wind Rose',
              content: (
                <SpaceBetween size="m">
                  <WindRoseChart
                    windData={windData}
                    seasonalData={seasonalData}
                    height={600}
                    onExport={handleExport}
                    interactive={true}
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'statistics',
              label: 'Statistics',
              content: (
                <SpaceBetween size="m">
                  <WindStatisticsTable
                    windData={windData}
                    seasonalData={seasonalData}
                    onExport={handleExport}
                    compact={false}
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'seasonal',
              label: 'Seasonal Analysis',
              disabled: !seasonalData,
              content: seasonalData ? (
                <SpaceBetween size="m">
                  <Table
                    columnDefinitions={[
                      {
                        id: 'month',
                        header: 'Month',
                        cell: item => item.month
                      },
                      {
                        id: 'meanSpeed',
                        header: 'Mean Speed',
                        cell: item => item.meanSpeed
                      },
                      {
                        id: 'prevailingDirection',
                        header: 'Prevailing Direction',
                        cell: item => item.prevailingDirection
                      },
                      {
                        id: 'powerDensity',
                        header: 'Power Density',
                        cell: item => item.powerDensity
                      },
                      {
                        id: 'capacityFactor',
                        header: 'Capacity Factor',
                        cell: item => item.capacityFactor
                      },
                      {
                        id: 'energyRanking',
                        header: 'Energy Ranking',
                        cell: item => (
                          <ProgressBar
                            value={item.energyRanking * 100}
                            description={`${(item.energyRanking * 100).toFixed(0)}%`}
                          />
                        )
                      }
                    ]}
                    items={monthlyTableData}
                    header={
                      <Header variant="h3">
                        Monthly Wind Resource Analysis
                      </Header>
                    }
                    empty="No seasonal data available"
                  />
                </SpaceBetween>
              ) : null
            }
          ]}
        />

        {/* Summary Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wind Resource Summary
          </Box>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="small">Mean Wind Speed</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {windData.statistics.meanWindSpeed.toFixed(1)} m/s
              </div>
            </div>
            <div>
              <Box variant="small">Power Density</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {windData.statistics.powerDensity.toFixed(0)} W/m²
              </div>
            </div>
            <div>
              <Box variant="small">Prevailing Direction</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {getDirectionLabel(windData.statistics.prevailingDirection)}
              </div>
            </div>
            <div>
              <Box variant="small">Data Quality</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {windData.qualityMetrics.completeness.toFixed(0)}%
              </div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Workflow Integration */}
        <WindRoseWorkflowIntegration
          windData={windData}
          seasonalData={seasonalData}
          analysisResults={analysisResults}
          onExportResults={handleExport}
          onAdvanceToNextStep={handleNextStep}
          stepId={stepId}
          workflowState={workflowState}
          onStepComplete={onStepComplete}
          onAdvanceWorkflow={onAdvanceWorkflow}
        />

        {/* Data Source Information */}
        <Box variant="small" color="text-body-secondary">
          Data Source: {windData.dataSource} | 
          Measurement Height: {windData.measurementHeight}m | 
          Period: {new Date(windData.timeRange.startDate).toLocaleDateString()} - {new Date(windData.timeRange.endDate).toLocaleDateString()} | 
          Total Hours: {windData.timeRange.totalHours.toLocaleString()}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

// Helper function to calculate wind rose analysis results
function calculateWindRoseAnalysisResults(
  windData: WindResourceData, 
  seasonalData?: SeasonalWindData
): WindRoseAnalysisResults {
  const stats = windData.statistics;
  
  // Assess wind resource quality
  let windResourceAssessment: 'excellent' | 'good' | 'fair' | 'poor';
  if (stats.meanWindSpeed >= 7.5 && stats.powerDensity >= 400) {
    windResourceAssessment = 'excellent';
  } else if (stats.meanWindSpeed >= 6.5 && stats.powerDensity >= 300) {
    windResourceAssessment = 'good';
  } else if (stats.meanWindSpeed >= 5.5 && stats.powerDensity >= 200) {
    windResourceAssessment = 'fair';
  } else {
    windResourceAssessment = 'poor';
  }

  // Calculate energy potential rating (0-100)
  const energyPotentialRating = Math.min(100, Math.round(
    (stats.meanWindSpeed / 10) * 40 + 
    (stats.powerDensity / 500) * 30 + 
    ((100 - stats.calmPercentage) / 100) * 20 + 
    (windData.qualityMetrics.completeness / 100) * 10
  ));

  // Assess seasonal variability
  let seasonalVariability: 'low' | 'medium' | 'high' = 'medium';
  if (seasonalData) {
    const monthlyMeans = seasonalData.monthlyData.map(m => m.statistics.meanWindSpeed);
    const cv = (stats.standardDeviation / stats.meanWindSpeed) * 100;
    seasonalVariability = cv < 15 ? 'low' : cv > 25 ? 'high' : 'medium';
  }

  // Generate key findings
  const keyFindings: string[] = [
    `Mean wind speed of ${stats.meanWindSpeed.toFixed(1)} m/s indicates ${windResourceAssessment} wind resource`,
    `Power density of ${stats.powerDensity.toFixed(0)} W/m² suggests ${energyPotentialRating > 70 ? 'high' : energyPotentialRating > 50 ? 'moderate' : 'low'} energy potential`,
    `Prevailing winds from ${getDirectionLabel(stats.prevailingDirection)} with ${seasonalVariability} seasonal variability`,
    `Data quality is ${windData.qualityMetrics.reliability} with ${windData.qualityMetrics.completeness.toFixed(0)}% completeness`
  ];

  // Determine next recommended steps
  const nextRecommendedSteps: string[] = [];
  if (windResourceAssessment === 'excellent' || windResourceAssessment === 'good') {
    nextRecommendedSteps.push('wake_analysis', 'layout_optimization');
  } else {
    nextRecommendedSteps.push('site_suitability', 'alternative_locations');
  }

  return {
    windResourceAssessment,
    recommendedTurbineOrientation: stats.prevailingDirection,
    seasonalVariability,
    energyPotentialRating,
    nextRecommendedSteps,
    keyFindings
  };
}

// Helper function to prepare statistics table data
function prepareStatisticsTableData(
  statistics: WindStatistics, 
  analysisResults: WindRoseAnalysisResults
): StatisticsTableItem[] {
  return [
    {
      parameter: 'Mean Wind Speed',
      value: statistics.meanWindSpeed.toFixed(1),
      unit: 'm/s',
      rating: statistics.meanWindSpeed >= 7 ? 'excellent' : statistics.meanWindSpeed >= 6 ? 'good' : statistics.meanWindSpeed >= 5 ? 'fair' : 'poor',
      description: 'Average wind speed over the measurement period'
    },
    {
      parameter: 'Power Density',
      value: statistics.powerDensity.toFixed(0),
      unit: 'W/m²',
      rating: statistics.powerDensity >= 400 ? 'excellent' : statistics.powerDensity >= 300 ? 'good' : statistics.powerDensity >= 200 ? 'fair' : 'poor',
      description: 'Available wind power per unit area'
    },
    {
      parameter: 'Weibull Shape (k)',
      value: statistics.weibullParameters.shape.toFixed(2),
      unit: '',
      rating: statistics.weibullParameters.shape >= 2 ? 'good' : 'fair',
      description: 'Wind speed distribution shape parameter'
    },
    {
      parameter: 'Weibull Scale (A)',
      value: statistics.weibullParameters.scale.toFixed(1),
      unit: 'm/s',
      rating: statistics.weibullParameters.scale >= 7 ? 'excellent' : statistics.weibullParameters.scale >= 6 ? 'good' : 'fair',
      description: 'Wind speed distribution scale parameter'
    },
    {
      parameter: 'Calm Percentage',
      value: statistics.calmPercentage.toFixed(1),
      unit: '%',
      rating: statistics.calmPercentage <= 5 ? 'excellent' : statistics.calmPercentage <= 10 ? 'good' : statistics.calmPercentage <= 15 ? 'fair' : 'poor',
      description: 'Percentage of time with wind speed < 1 m/s'
    }
  ];
}

// Helper function to get direction label from degrees
function getDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return `${directions[index]} (${degrees.toFixed(0)}°)`;
}

// Helper function to get badge color based on rating
function getWindResourceBadgeColor(rating: string): 'green' | 'blue' | 'grey' | 'red' {
  switch (rating) {
    case 'excellent': return 'green';
    case 'good': return 'blue';
    case 'fair': return 'grey';
    case 'poor': return 'red';
    default: return 'grey';
  }
}

export default WindRoseAnalysisVisualization;