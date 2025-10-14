/**
 * Wake Analysis Visualization Component
 * 
 * Complete wake analysis component integrating wake visualization chart,
 * impact analysis, and workflow integration with Cloudscape design system.
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Button,
  ButtonDropdown,
  Alert,
  ProgressBar,
  Spinner,
  Tabs,
  Badge
} from '@cloudscape-design/components';
import WakeVisualizationChart from './WakeVisualizationChart';
import WakeImpactAnalysis from './WakeImpactAnalysis';
import WakeAnalysisWorkflowIntegration from './WakeAnalysisWorkflowIntegration';
import { SimpleCallToActionPanel } from './SimpleCallToActionPanel';
import { 
  WakeAnalysisData,
  TurbineLayout,
  WindResourceData,
  WakeOptimizationRecommendation,
  WakeAnalysisResults
} from '../../types/wakeData';
import { WorkflowStepProps } from '../../types/workflow';

interface WakeAnalysisVisualizationProps extends Partial<WorkflowStepProps> {
  turbineLayout: TurbineLayout;
  windData: WindResourceData;
  terrainData?: any;
  wakeData?: WakeAnalysisData;
  isLoading?: boolean;
  error?: string;
  onExport?: (format: string, data: any) => void;
  onOptimizationApply?: (recommendation: WakeOptimizationRecommendation) => void;
  onAnalysisComplete?: (results: WakeAnalysisResults) => void;
}

interface WakeAnalysisExportData {
  wakeAnalysis: WakeAnalysisData;
  visualizationConfig: any;
  metadata: {
    exportedAt: string;
    exportFormat: string;
    version: string;
  };
}

const WakeAnalysisVisualization: React.FC<WakeAnalysisVisualizationProps> = ({
  turbineLayout,
  windData,
  terrainData,
  wakeData,
  isLoading = false,
  error,
  onExport,
  onOptimizationApply,
  onAnalysisComplete,
  stepId,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow
}) => {
  const [activeTab, setActiveTab] = useState('visualization');
  const [selectedTurbineId, setSelectedTurbineId] = useState<string | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Generate mock wake data if not provided (for development/demo)
  const processedWakeData: WakeAnalysisData = useMemo(() => {
    if (wakeData) return wakeData;
    
    // Generate realistic wake analysis data for demonstration
    return generateMockWakeData(turbineLayout, windData, terrainData);
  }, [wakeData, turbineLayout, windData, terrainData]);

  // Calculate analysis summary
  const analysisSummary = useMemo(() => {
    const results = processedWakeData.results;
    const overallMetrics = results.overallMetrics;
    
    return {
      wakeEfficiency: overallMetrics.wakeEfficiency,
      totalWakeLoss: overallMetrics.totalWakeLoss,
      energyLossGWh: overallMetrics.energyYieldReduction / 1000,
      economicImpactM: overallMetrics.economicImpact.annualRevenueLoss / 1000000,
      severelyAffectedTurbines: results.turbineResults.filter(r => r.powerReduction > 10).length,
      optimizationOpportunities: results.optimizationRecommendations.filter(r => r.priority === 'high').length,
      overallRating: getOverallWakeRating(overallMetrics.wakeEfficiency),
      keyFindings: generateKeyFindings(results)
    };
  }, [processedWakeData]);

  // Handle export functionality
  const handleExport = async (format: string) => {
    if (!onExport) return;
    
    setExportInProgress(true);
    try {
      const exportData: WakeAnalysisExportData = {
        wakeAnalysis: processedWakeData,
        visualizationConfig: {
          chartType: 'wake_field',
          showTurbineLabels: true,
          showWakeBoundaries: true,
          wakeOpacity: 0.6,
          exportFormats: ['png', 'svg', 'pdf', 'json'],
          dimensions: { width: 1200, height: 800 }
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          exportFormat: format,
          version: '1.0'
        }
      };

      await onExport(format, exportData);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportInProgress(false);
    }
  };

  // Handle optimization application
  const handleOptimizationApply = (recommendation: WakeOptimizationRecommendation) => {
    if (onOptimizationApply) {
      onOptimizationApply(recommendation);
    }
  };

  // Handle workflow completion
  const handleAnalysisComplete = () => {
    if (onAnalysisComplete) {
      onAnalysisComplete(processedWakeData.results);
    }

    if (onStepComplete && stepId) {
      onStepComplete(stepId, {
        stepId,
        success: true,
        data: {
          wakeEfficiency: analysisSummary.wakeEfficiency,
          totalWakeLoss: analysisSummary.totalWakeLoss,
          energyLoss: analysisSummary.energyLossGWh,
          optimizationOpportunities: analysisSummary.optimizationOpportunities,
          keyFindings: analysisSummary.keyFindings
        },
        artifacts: [processedWakeData],
        nextRecommendedStep: 'layout_optimization'
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
        <Alert type="error" header="Wake Analysis Error">
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
            Analyzing wake effects and turbine interactions...
          </Box>
          <ProgressBar value={45} description="Processing wake model calculations" />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={`Wake analysis for ${turbineLayout.turbines.length} turbines with ${turbineLayout.totalCapacity.toFixed(1)} MW total capacity`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={getWakeEfficiencyBadgeColor(analysisSummary.wakeEfficiency)}>
                {analysisSummary.wakeEfficiency.toFixed(1)}% Efficiency
              </Badge>
              <Badge color={analysisSummary.severelyAffectedTurbines > 0 ? 'red' : 'green'}>
                {analysisSummary.severelyAffectedTurbines} Severely Affected
              </Badge>
              <Badge color="blue">
                {analysisSummary.optimizationOpportunities} Optimization Opportunities
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
          Wake Analysis
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Key Findings Alert */}
        <Alert
          type={analysisSummary.overallRating === 'excellent' ? 'success' : 
                analysisSummary.overallRating === 'good' ? 'info' : 'warning'}
          header={`Wake Performance: ${analysisSummary.overallRating.toUpperCase()}`}
        >
          <SpaceBetween size="xs">
            {analysisSummary.keyFindings.map((finding, index) => (
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
              id: 'visualization',
              label: 'Wake Visualization',
              content: (
                <SpaceBetween size="m">
                  <WakeVisualizationChart
                    wakeData={processedWakeData}
                    height={600}
                    onExport={handleExport}
                    interactive={true}
                    onTurbineSelect={setSelectedTurbineId}
                    selectedTurbineId={selectedTurbineId}
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'impact',
              label: 'Impact Analysis',
              content: (
                <SpaceBetween size="m">
                  <WakeImpactAnalysis
                    wakeData={processedWakeData}
                    onOptimizationSelect={handleOptimizationApply}
                    onTurbineSelect={setSelectedTurbineId}
                    compact={false}
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'summary',
              label: 'Executive Summary',
              content: (
                <SpaceBetween size="m">
                  <WakeExecutiveSummary
                    wakeData={processedWakeData}
                    analysisSummary={analysisSummary}
                  />
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Summary Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Wake Analysis Summary
          </Box>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="small">Wake Efficiency</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {analysisSummary.wakeEfficiency.toFixed(1)}%
              </div>
            </div>
            <div>
              <Box variant="small">Total Wake Loss</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {analysisSummary.totalWakeLoss.toFixed(1)}%
              </div>
            </div>
            <div>
              <Box variant="small">Energy Loss</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {analysisSummary.energyLossGWh.toFixed(1)} GWh/yr
              </div>
            </div>
            <div>
              <Box variant="small">Economic Impact</Box>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                ${analysisSummary.economicImpactM.toFixed(1)}M/yr
              </div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Workflow Integration */}
        <WakeAnalysisWorkflowIntegration
          wakeData={processedWakeData}
          analysisResults={processedWakeData.results}
          onExportResults={handleExport}
          onAdvanceToNextStep={handleNextStep}
          onOptimizationApply={handleOptimizationApply}
          stepId={stepId}
          workflowState={workflowState}
          onStepComplete={onStepComplete}
          onAdvanceWorkflow={onAdvanceWorkflow}
        />

        {/* Data Source Information */}
        <Box variant="small" color="text-body-secondary">
          Wake Model: {processedWakeData.wakeModel.modelType.toUpperCase()} | 
          Turbine Model: {turbineLayout.turbineModel.model} | 
          Analysis Date: {new Date(processedWakeData.metadata.createdAt).toLocaleDateString()} | 
          Computation Time: {processedWakeData.metadata.computationTime.toFixed(1)}s
        </Box>
      </SpaceBetween>
    </Container>
  );
};

// Executive Summary Component
const WakeExecutiveSummary: React.FC<{
  wakeData: WakeAnalysisData;
  analysisSummary: any;
}> = ({ wakeData, analysisSummary }) => (
  <SpaceBetween size="m">
    <Container
      header={
        <Header variant="h3">
          Executive Summary
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Box>
          <Box variant="h4">Wake Performance Assessment</Box>
          <Box variant="p">
            The wind farm layout demonstrates {analysisSummary.overallRating} wake performance with an overall 
            efficiency of {analysisSummary.wakeEfficiency.toFixed(1)}%. Wake losses result in a 
            {analysisSummary.totalWakeLoss.toFixed(1)}% reduction in energy yield, equivalent to 
            {analysisSummary.energyLossGWh.toFixed(1)} GWh annually.
          </Box>
        </Box>

        <Box>
          <Box variant="h4">Economic Impact</Box>
          <Box variant="p">
            Wake effects result in an estimated annual revenue loss of 
            ${analysisSummary.economicImpactM.toFixed(1)} million. The net present value impact over the 
            project lifetime is ${(wakeData.results.overallMetrics.economicImpact.netPresentValueImpact / 1000000).toFixed(1)} million, 
            extending the payback period by {wakeData.results.overallMetrics.economicImpact.paybackPeriodIncrease.toFixed(1)} years.
          </Box>
        </Box>

        <Box>
          <Box variant="h4">Optimization Opportunities</Box>
          <Box variant="p">
            {analysisSummary.optimizationOpportunities} high-priority optimization opportunities have been identified. 
            Implementation of these recommendations could reduce wake losses by up to{' '}
            {Math.max(...wakeData.results.optimizationRecommendations.map(r => r.expectedBenefit.wakeLossReduction)).toFixed(1)}% 
            and improve overall wind farm efficiency.
          </Box>
        </Box>

        <Box>
          <Box variant="h4">Recommendations</Box>
          <SpaceBetween size="xs">
            {wakeData.results.optimizationRecommendations
              .filter(r => r.priority === 'high')
              .slice(0, 3)
              .map((rec, index) => (
                <div key={index}>• {rec.description}</div>
              ))}
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  </SpaceBetween>
);

// Helper function to generate mock wake data for demonstration
function generateMockWakeData(
  turbineLayout: TurbineLayout,
  windData: WindResourceData,
  terrainData?: any
): WakeAnalysisData {
  // This would be replaced with actual wake modeling calculations
  const turbineCount = turbineLayout.turbines.length;
  const totalCapacity = turbineLayout.totalCapacity;
  
  // Generate realistic wake analysis results
  const overallWakeLoss = Math.min(15, Math.max(5, turbineCount * 0.8 + Math.random() * 3));
  const wakeEfficiency = 100 - overallWakeLoss;
  
  return {
    turbineLayout,
    windData,
    terrainData,
    wakeModel: {
      modelType: 'jensen',
      parameters: {
        wakeDecayConstant: 0.075,
        turbulenceIntensity: 0.1,
        surfaceRoughness: 0.03,
        atmosphericStability: 'neutral',
        windShear: 0.2,
        airDensity: 1.225
      },
      validationData: {
        measurementCampaign: 'Synthetic',
        validationMetrics: [],
        accuracy: 85,
        bias: 2,
        uncertainty: 10
      },
      accuracy: 'medium',
      computationalCost: 'medium'
    },
    results: {
      overallMetrics: {
        totalWakeLoss: overallWakeLoss,
        averageWakeLoss: overallWakeLoss * 0.8,
        maxWakeLoss: overallWakeLoss * 1.5,
        wakeEfficiency: wakeEfficiency,
        energyYieldReduction: totalCapacity * 8760 * 0.35 * (overallWakeLoss / 100),
        capacityFactorReduction: overallWakeLoss * 0.35,
        economicImpact: {
          annualRevenueLoss: totalCapacity * 8760 * 0.35 * (overallWakeLoss / 100) * 50,
          netPresentValueImpact: totalCapacity * 8760 * 0.35 * (overallWakeLoss / 100) * 50 * 15,
          paybackPeriodIncrease: overallWakeLoss * 0.1,
          levelizedCostIncrease: overallWakeLoss * 0.5
        }
      },
      turbineResults: turbineLayout.turbines.map(turbine => ({
        turbineId: turbine.id,
        position: turbine,
        wakeDeficit: Math.random() * 20,
        powerReduction: Math.random() * 15,
        energyLoss: Math.random() * 500,
        turbulenceIncrease: Math.random() * 30,
        fatigueImpact: Math.random() * 1.5,
        upstreamInfluences: [],
        downstreamImpacts: []
      })),
      wakeVisualization: {
        wakeFields: [],
        flowVisualization: {
          streamlines: [],
          velocityVectors: []
        },
        turbineInteractions: [],
        crossSections: []
      },
      optimizationRecommendations: [
        {
          type: 'layout_modification',
          priority: 'high',
          description: 'Relocate 3 turbines to reduce wake overlap by 25%',
          expectedBenefit: {
            wakeLossReduction: 3.5,
            energyYieldIncrease: totalCapacity * 8760 * 0.35 * 0.035,
            revenueIncrease: totalCapacity * 8760 * 0.35 * 0.035 * 50,
            paybackPeriod: 2.5,
            riskReduction: 0.2
          },
          implementationCost: 0.3,
          implementationComplexity: 'medium',
          actions: []
        }
      ],
      sensitivityAnalysis: {
        parameters: [],
        results: [],
        recommendations: []
      },
      uncertaintyAnalysis: {
        sources: [],
        totalUncertainty: 10,
        confidenceIntervals: [],
        recommendations: []
      }
    },
    metadata: {
      analysisId: `wake-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
      analyst: 'System',
      software: {
        name: 'EDI Wake Analysis',
        version: '1.0',
        modules: ['Jensen Wake Model', 'Turbine Interaction Analysis']
      },
      computationTime: 15.5,
      gridResolution: 50,
      domainSize: {
        width: 5000,
        height: 3000
      },
      qualityMetrics: {
        convergence: 0.95,
        gridIndependence: 0.92,
        massConservation: 99.5,
        energyConservation: 98.8,
        validationScore: 0.85
      }
    }
  };
}

// Helper function to generate key findings
function generateKeyFindings(results: WakeAnalysisResults): string[] {
  const overallMetrics = results.overallMetrics;
  const findings: string[] = [];
  
  findings.push(`Overall wake efficiency of ${overallMetrics.wakeEfficiency.toFixed(1)}% indicates ${getOverallWakeRating(overallMetrics.wakeEfficiency)} performance`);
  findings.push(`Total wake losses of ${overallMetrics.totalWakeLoss.toFixed(1)}% result in ${(overallMetrics.energyYieldReduction / 1000).toFixed(1)} GWh/year energy reduction`);
  findings.push(`${results.turbineResults.filter(r => r.powerReduction > 10).length} turbines experience severe wake effects (>10% power loss)`);
  findings.push(`Economic impact of $${(overallMetrics.economicImpact.annualRevenueLoss / 1000000).toFixed(1)}M annually with ${overallMetrics.economicImpact.paybackPeriodIncrease.toFixed(1)} year payback extension`);
  
  if (results.optimizationRecommendations.length > 0) {
    findings.push(`${results.optimizationRecommendations.filter(r => r.priority === 'high').length} high-priority optimization opportunities identified`);
  }
  
  return findings;
}

// Helper function to get overall wake rating
function getOverallWakeRating(efficiency: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (efficiency >= 95) return 'excellent';
  if (efficiency >= 90) return 'good';
  if (efficiency >= 85) return 'fair';
  return 'poor';
}

// Helper function to get wake efficiency badge color
function getWakeEfficiencyBadgeColor(efficiency: number): 'green' | 'blue' | 'grey' | 'red' {
  if (efficiency >= 95) return 'green';
  if (efficiency >= 90) return 'blue';
  if (efficiency >= 85) return 'grey';
  return 'red';
}

export default WakeAnalysisVisualization;