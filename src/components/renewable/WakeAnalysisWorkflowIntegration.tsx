/**
 * Wake Analysis Workflow Integration Component
 * 
 * Integrates wake analysis with the progressive disclosure workflow system,
 * providing call-to-action buttons and advanced modeling options.
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
  ExpandableSection,
  FormField,
  Select,
  Slider,
  Toggle,
  Cards,
  Badge,
  StatusIndicator,
  Popover
} from '@cloudscape-design/components';
import { SimpleCallToActionPanel } from './SimpleCallToActionPanel';
import { ProgressiveDisclosurePanel } from './ProgressiveDisclosurePanel';
import {
  WakeAnalysisData,
  WakeOptimizationRecommendation,
  WakeAnalysisResults
} from '../../types/wakeData';
import { WorkflowStepProps } from '../../types/workflow';

interface WakeAnalysisWorkflowIntegrationProps extends Partial<WorkflowStepProps> {
  wakeData: WakeAnalysisData;
  analysisResults: WakeAnalysisResults;
  onExportResults?: (format: string, data: any) => void;
  onAdvanceToNextStep?: (nextStepId: string) => void;
  onOptimizationApply?: (recommendation: WakeOptimizationRecommendation) => void;
  onRerunAnalysis?: (parameters: any) => void;
}

interface AdvancedModelingOptions {
  wakeModel: { value: string; label: string };
  turbulenceModel: { value: string; label: string };
  atmosphericStability: { value: string; label: string };
  gridResolution: number;
  includeTerrainEffects: boolean;
  includeTemperatureEffects: boolean;
  multiDirectionalAnalysis: boolean;
}

interface NextStepOption {
  id: string;
  title: string;
  description: string;
  priority: 'primary' | 'secondary';
  prerequisites: string[];
  estimatedTime: string;
  complexity: 'low' | 'medium' | 'high';
}

const WakeAnalysisWorkflowIntegration: React.FC<WakeAnalysisWorkflowIntegrationProps> = ({
  wakeData,
  analysisResults,
  onExportResults,
  onAdvanceToNextStep,
  onOptimizationApply,
  onRerunAnalysis,
  stepId,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedModelingOptions>({
    wakeModel: { value: 'jensen', label: 'Jensen Model' },
    turbulenceModel: { value: 'standard', label: 'Standard Turbulence' },
    atmosphericStability: { value: 'neutral', label: 'Neutral Stability' },
    gridResolution: 50,
    includeTerrainEffects: false,
    includeTemperatureEffects: false,
    multiDirectionalAnalysis: false
  });

  // Define next step options based on analysis results
  const nextStepOptions: NextStepOption[] = useMemo(() => {
    const wakeEfficiency = analysisResults.overallMetrics.wakeEfficiency;
    const hasOptimizationOpportunities = analysisResults.optimizationRecommendations.length > 0;
    
    const options: NextStepOption[] = [
      {
        id: 'layout_optimization',
        title: 'Layout Optimization',
        description: 'Apply optimization algorithms to minimize wake losses and maximize energy yield',
        priority: wakeEfficiency < 90 ? 'primary' : 'secondary',
        prerequisites: ['wake_analysis_complete'],
        estimatedTime: '15-30 minutes',
        complexity: 'medium'
      },
      {
        id: 'site_suitability',
        title: 'Site Suitability Assessment',
        description: 'Comprehensive evaluation of site development potential and constraints',
        priority: 'secondary',
        prerequisites: ['wake_analysis_complete'],
        estimatedTime: '10-20 minutes',
        complexity: 'low'
      },
      {
        id: 'generate_report',
        title: 'Generate Comprehensive Report',
        description: 'Create detailed wake analysis report with visualizations and recommendations',
        priority: 'secondary',
        prerequisites: ['wake_analysis_complete'],
        estimatedTime: '5-10 minutes',
        complexity: 'low'
      }
    ];

    if (hasOptimizationOpportunities) {
      options.unshift({
        id: 'apply_optimization',
        title: 'Apply Wake Optimization',
        description: 'Implement recommended layout modifications to reduce wake losses',
        priority: 'primary',
        prerequisites: ['wake_analysis_complete'],
        estimatedTime: '20-45 minutes',
        complexity: 'high'
      });
    }

    return options;
  }, [analysisResults]);

  // Wake model options
  const wakeModelOptions = [
    { value: 'jensen', label: 'Jensen Model (Fast)' },
    { value: 'larsen', label: 'Larsen Model (Accurate)' },
    { value: 'fuga', label: 'FUGA Model (Research)' },
    { value: 'eddy_viscosity', label: 'Eddy Viscosity Model' }
  ];

  const turbulenceModelOptions = [
    { value: 'standard', label: 'Standard Turbulence' },
    { value: 'enhanced', label: 'Enhanced Turbulence' },
    { value: 'atmospheric', label: 'Atmospheric Boundary Layer' }
  ];

  const stabilityOptions = [
    { value: 'stable', label: 'Stable Atmosphere' },
    { value: 'neutral', label: 'Neutral Atmosphere' },
    { value: 'unstable', label: 'Unstable Atmosphere' }
  ];

  // Handle next step selection
  const handleNextStepSelect = (stepId: string) => {
    if (onAdvanceToNextStep) {
      onAdvanceToNextStep(stepId);
    }
    
    if (onAdvanceWorkflow) {
      onAdvanceWorkflow(stepId);
    }
  };

  // Handle optimization application
  const handleOptimizationApply = (recommendationIndex: number) => {
    const recommendation = analysisResults.optimizationRecommendations[recommendationIndex];
    if (onOptimizationApply) {
      onOptimizationApply(recommendation);
    }
  };

  // Handle advanced analysis rerun
  const handleRerunAnalysis = () => {
    if (onRerunAnalysis) {
      onRerunAnalysis({
        wakeModel: advancedOptions.wakeModel.value,
        turbulenceModel: advancedOptions.turbulenceModel.value,
        atmosphericStability: advancedOptions.atmosphericStability.value,
        gridResolution: advancedOptions.gridResolution,
        includeTerrainEffects: advancedOptions.includeTerrainEffects,
        includeTemperatureEffects: advancedOptions.includeTemperatureEffects,
        multiDirectionalAnalysis: advancedOptions.multiDirectionalAnalysis
      });
    }
  };

  // Handle workflow step completion
  const handleStepComplete = () => {
    if (onStepComplete && stepId) {
      onStepComplete(stepId, {
        stepId,
        success: true,
        data: {
          wakeEfficiency: analysisResults.overallMetrics.wakeEfficiency,
          totalWakeLoss: analysisResults.overallMetrics.totalWakeLoss,
          optimizationRecommendations: analysisResults.optimizationRecommendations.length,
          nextRecommendedStep: nextStepOptions[0]?.id || 'layout_optimization'
        },
        artifacts: [wakeData],
        nextRecommendedStep: nextStepOptions[0]?.id || 'layout_optimization'
      });
    }
  };

  return (
    <SpaceBetween size="l">
      {/* Wake Analysis Summary */}
      <Container
        header={
          <Header
            variant="h3"
            description="Summary of wake analysis results and recommended next steps"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color={getWakeEfficiencyColor(analysisResults.overallMetrics.wakeEfficiency)}>
                  {analysisResults.overallMetrics.wakeEfficiency.toFixed(1)}% Efficiency
                </Badge>
                <Badge color={analysisResults.optimizationRecommendations.length > 0 ? 'blue' : 'grey'}>
                  {analysisResults.optimizationRecommendations.length} Optimizations
                </Badge>
              </SpaceBetween>
            }
          >
            Wake Analysis Summary & Next Steps
          </Header>
        }
      >
        <SpaceBetween size="m">
          {/* Analysis Quality Indicator */}
          <Alert
            type={analysisResults.overallMetrics.wakeEfficiency > 90 ? 'success' : 
                  analysisResults.overallMetrics.wakeEfficiency > 85 ? 'info' : 'warning'}
            header={`Wake Analysis Complete - ${getWakePerformanceRating(analysisResults.overallMetrics.wakeEfficiency)} Performance`}
          >
            <SpaceBetween size="xs">
              <div>
                • Wake efficiency: {analysisResults.overallMetrics.wakeEfficiency.toFixed(1)}% 
                (Loss: {analysisResults.overallMetrics.totalWakeLoss.toFixed(1)}%)
              </div>
              <div>
                • Energy impact: {(analysisResults.overallMetrics.energyYieldReduction / 1000).toFixed(1)} GWh/year reduction
              </div>
              <div>
                • Economic impact: ${(analysisResults.overallMetrics.economicImpact.annualRevenueLoss / 1000000).toFixed(1)}M annual revenue loss
              </div>
              {analysisResults.optimizationRecommendations.length > 0 && (
                <div>
                  • {analysisResults.optimizationRecommendations.filter(r => r.priority === 'high').length} high-priority optimization opportunities identified
                </div>
              )}
            </SpaceBetween>
          </Alert>

          {/* Key Metrics */}
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Wake Efficiency</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: getWakeEfficiencyTextColor(analysisResults.overallMetrics.wakeEfficiency) }}>
                {analysisResults.overallMetrics.wakeEfficiency.toFixed(1)}%
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Affected Turbines</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0073bb' }}>
                {analysisResults.turbineResults.filter(r => r.powerReduction > 5).length}
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Max Wake Loss</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d13212' }}>
                {analysisResults.overallMetrics.maxWakeLoss.toFixed(1)}%
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Optimization Potential</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#037f0c' }}>
                {analysisResults.optimizationRecommendations.length > 0 ? 
                  `${Math.max(...analysisResults.optimizationRecommendations.map(r => r.expectedBenefit.wakeLossReduction)).toFixed(1)}%` : 
                  'Limited'
                }
              </div>
            </div>
          </ColumnLayout>
        </SpaceBetween>
      </Container>

      {/* Optimization Recommendations */}
      {analysisResults.optimizationRecommendations.length > 0 && (
        <Container
          header={
            <Header
              variant="h3"
              description="Recommended optimizations to improve wake performance"
              counter={`(${analysisResults.optimizationRecommendations.length})`}
            >
              Wake Optimization Opportunities
            </Header>
          }
        >
          <Cards
            cardDefinition={{
              header: (item, index) => (
                <div>
                  <Badge color={getPriorityColor(item.priority)}>
                    {item.priority.toUpperCase()}
                  </Badge>
                  <Box variant="h4" margin={{ top: 'xs' }}>
                    {item.type.replace('_', ' ').toUpperCase()}
                  </Box>
                </div>
              ),
              sections: [
                {
                  id: 'description',
                  content: item => item.description
                },
                {
                  id: 'benefits',
                  header: 'Expected Benefits',
                  content: item => (
                    <SpaceBetween size="xs">
                      <div>• Wake loss reduction: {item.expectedBenefit.wakeLossReduction.toFixed(1)}%</div>
                      <div>• Energy increase: {(item.expectedBenefit.energyYieldIncrease / 1000).toFixed(1)} GWh/year</div>
                      <div>• Revenue increase: ${(item.expectedBenefit.revenueIncrease / 1000000).toFixed(1)}M/year</div>
                      <div>• Payback period: {item.expectedBenefit.paybackPeriod.toFixed(1)} years</div>
                    </SpaceBetween>
                  )
                },
                {
                  id: 'implementation',
                  header: 'Implementation',
                  content: item => (
                    <SpaceBetween size="xs">
                      <div>Cost: {getCostLabel(item.implementationCost)}</div>
                      <div>Complexity: {item.implementationComplexity}</div>
                      <div>Actions: {item.actions.length}</div>
                    </SpaceBetween>
                  )
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 }
            ]}
            items={analysisResults.optimizationRecommendations.map((rec, index) => ({ ...rec, index }))}
            selectionType="single"
            onSelectionChange={({ detail }) => {
              const selected = detail.selectedItems[0];
              if (selected) {
                setSelectedOptimization(selected.index.toString());
              }
            }}
            header={
              <Header
                actions={
                  <Button
                    variant="primary"
                    disabled={selectedOptimization === null}
                    onClick={() => {
                      if (selectedOptimization !== null) {
                        handleOptimizationApply(parseInt(selectedOptimization));
                      }
                    }}
                  >
                    Apply Selected Optimization
                  </Button>
                }
              >
                Select Optimization to Apply
              </Header>
            }
            empty="No optimization recommendations available"
          />
        </Container>
      )}

      {/* Progressive Disclosure for Advanced Options */}
      <ProgressiveDisclosurePanel
        title="Advanced Wake Modeling Options"
        description="Configure advanced parameters for more detailed wake analysis"
        isExpanded={showAdvancedOptions}
        onToggle={setShowAdvancedOptions}
        complexity="high"
        estimatedTime="10-15 minutes"
      >
        <SpaceBetween size="m">
          <ColumnLayout columns={2} variant="text-grid">
            <FormField label="Wake Model">
              <Select
                selectedOption={advancedOptions.wakeModel}
                onChange={({ detail }) => 
                  setAdvancedOptions(prev => ({ ...prev, wakeModel: detail.selectedOption }))
                }
                options={wakeModelOptions}
                expandToViewport
              />
            </FormField>
            <FormField label="Turbulence Model">
              <Select
                selectedOption={advancedOptions.turbulenceModel}
                onChange={({ detail }) => 
                  setAdvancedOptions(prev => ({ ...prev, turbulenceModel: detail.selectedOption }))
                }
                options={turbulenceModelOptions}
                expandToViewport
              />
            </FormField>
            <FormField label="Atmospheric Stability">
              <Select
                selectedOption={advancedOptions.atmosphericStability}
                onChange={({ detail }) => 
                  setAdvancedOptions(prev => ({ ...prev, atmosphericStability: detail.selectedOption }))
                }
                options={stabilityOptions}
                expandToViewport
              />
            </FormField>
            <FormField label="Grid Resolution (meters)">
              <Slider
                value={advancedOptions.gridResolution}
                onChange={({ detail }) => 
                  setAdvancedOptions(prev => ({ ...prev, gridResolution: detail.value }))
                }
                min={25}
                max={200}
                step={25}
                tickMarks
              />
            </FormField>
          </ColumnLayout>

          <SpaceBetween size="s">
            <Toggle
              checked={advancedOptions.includeTerrainEffects}
              onChange={({ detail }) => 
                setAdvancedOptions(prev => ({ ...prev, includeTerrainEffects: detail.checked }))
              }
            >
              Include Terrain Effects
            </Toggle>
            <Toggle
              checked={advancedOptions.includeTemperatureEffects}
              onChange={({ detail }) => 
                setAdvancedOptions(prev => ({ ...prev, includeTemperatureEffects: detail.checked }))
              }
            >
              Include Temperature Effects
            </Toggle>
            <Toggle
              checked={advancedOptions.multiDirectionalAnalysis}
              onChange={({ detail }) => 
                setAdvancedOptions(prev => ({ ...prev, multiDirectionalAnalysis: detail.checked }))
              }
            >
              Multi-Directional Analysis
            </Toggle>
          </SpaceBetween>

          <Box float="right">
            <SpaceBetween direction="horizontal" size="s">
              <Button
                variant="normal"
                onClick={() => setShowAdvancedOptions(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRerunAnalysis}
              >
                Rerun Analysis
              </Button>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </ProgressiveDisclosurePanel>

      {/* Next Steps Call to Action */}
      <SimpleCallToActionPanel
        title="Continue Wind Farm Development Workflow"
        description="Based on the wake analysis results, proceed with the recommended next steps to optimize your wind farm design."
        actions={nextStepOptions.map(option => ({
          id: option.id,
          label: option.title,
          variant: option.priority === 'primary' ? 'primary' : 'normal',
          description: `${option.description} (${option.estimatedTime})`
        }))}
        onActionClick={handleNextStepSelect}
        guidance={
          analysisResults.overallMetrics.wakeEfficiency < 85 
            ? "Wake losses are significant. Layout optimization is strongly recommended to improve performance."
            : analysisResults.overallMetrics.wakeEfficiency < 90
            ? "Wake performance is good but can be improved. Consider layout optimization for better results."
            : "Excellent wake performance! Proceed with site suitability assessment or report generation."
        }
      />

      {/* Export and Workflow Actions */}
      <Container>
        <SpaceBetween direction="horizontal" size="s" alignItems="center">
          <Box variant="awsui-key-label">Actions:</Box>
          
          {onExportResults && (
            <ButtonDropdown
              items={[
                { id: 'pdf', text: 'Export PDF Report', description: 'Complete wake analysis report' },
                { id: 'excel', text: 'Export Excel Data', description: 'Detailed data tables' },
                { id: 'json', text: 'Export JSON Data', description: 'Raw analysis data' },
                { id: 'png', text: 'Export Visualizations', description: 'High-resolution images' }
              ]}
              onItemClick={({ detail }) => onExportResults(detail.id, wakeData)}
            >
              Export Results
            </ButtonDropdown>
          )}

          <Button
            variant="normal"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
          </Button>

          <Button
            variant="primary"
            onClick={handleStepComplete}
          >
            Complete Wake Analysis
          </Button>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

// Helper functions
function getWakeEfficiencyColor(efficiency: number): 'green' | 'blue' | 'grey' | 'red' {
  if (efficiency >= 95) return 'green';
  if (efficiency >= 90) return 'blue';
  if (efficiency >= 85) return 'grey';
  return 'red';
}

function getWakeEfficiencyTextColor(efficiency: number): string {
  if (efficiency >= 95) return '#037f0c';
  if (efficiency >= 90) return '#0073bb';
  if (efficiency >= 85) return '#ff9900';
  return '#d13212';
}

function getWakePerformanceRating(efficiency: number): string {
  if (efficiency >= 95) return 'Excellent';
  if (efficiency >= 90) return 'Good';
  if (efficiency >= 85) return 'Fair';
  return 'Poor';
}

function getPriorityColor(priority: string): 'red' | 'blue' | 'grey' {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'blue';
    case 'low': return 'grey';
    default: return 'grey';
  }
}

function getCostLabel(cost: number): string {
  if (cost <= 0.3) return 'Low';
  if (cost <= 0.6) return 'Medium';
  return 'High';
}

export default WakeAnalysisWorkflowIntegration;