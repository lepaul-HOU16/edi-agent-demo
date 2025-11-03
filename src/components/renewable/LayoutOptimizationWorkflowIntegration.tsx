/**
 * Layout Optimization Workflow Integration Component
 * 
 * Implements call-to-action for site suitability assessment and report generation,
 * layout comparison tools, and export functionality for CAD and GIS systems.
 */

import React, { useState, useCallback } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  ButtonDropdown,
  ButtonDropdownProps,
  Modal,
  Alert,
  ProgressBar,
  StatusIndicator,
  Badge,
  Grid,
  ColumnLayout,
  Tabs,
  TabsProps
} from '@cloudscape-design/components';
import { OptimizedLayout, OptimizationResults, OptimizationRecommendation } from '../../types/layoutOptimization';
import { SimpleCallToActionPanel } from './SimpleCallToActionPanel';
import { LayoutOptimizationVisualization } from './LayoutOptimizationVisualization';
import { TurbineLayoutMap } from './TurbineLayoutMap';
import { ConstraintComplianceVisualization } from './ConstraintComplianceVisualization';

// ============================================================================
// Component Props
// ============================================================================

interface LayoutOptimizationWorkflowIntegrationProps {
  optimizationResults: OptimizationResults;
  onProceedToSuitabilityAssessment?: () => void;
  onGenerateReport?: (reportType: 'summary' | 'detailed' | 'executive') => void;
  onCompareLayouts?: (layouts: OptimizedLayout[]) => void;
  onExportLayout?: (layout: OptimizedLayout, format: ExportFormat) => void;
  onOptimizeWakeEffects?: () => void;
  onRerunOptimization?: (parameters: OptimizationParameters) => void;
  loading?: boolean;
  error?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

type ExportFormat = 'json' | 'csv' | 'gis' | 'cad' | 'pdf' | 'excel';

interface OptimizationParameters {
  algorithm?: string;
  objectives?: string[];
  constraints?: string[];
  iterations?: number;
}

interface ComparisonMetrics {
  energyYield: number;
  wakeLosses: number;
  constraintCompliance: number;
  economicViability: number;
  overallScore: number;
}

interface LayoutComparison {
  layout: OptimizedLayout;
  metrics: ComparisonMetrics;
  rank: number;
  advantages: string[];
  disadvantages: string[];
}

// ============================================================================
// Main Component
// ============================================================================

export const LayoutOptimizationWorkflowIntegration: React.FC<LayoutOptimizationWorkflowIntegrationProps> = ({
  optimizationResults,
  onProceedToSuitabilityAssessment,
  onGenerateReport,
  onCompareLayouts,
  onExportLayout,
  onOptimizeWakeEffects,
  onRerunOptimization,
  loading = false,
  error
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('json');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ============================================================================
  // Computed Values
  // ============================================================================

  const bestLayout = optimizationResults.bestLayout;
  const alternativeLayouts = optimizationResults.alternativeLayouts;
  const recommendations = optimizationResults.recommendations;
  
  const workflowStatus = {
    optimizationComplete: true,
    hasAlternatives: alternativeLayouts.length > 0,
    hasViolations: bestLayout.constraintViolations.length > 0,
    readyForSuitability: bestLayout.constraintViolations.filter(v => v.severity === 'critical').length === 0,
    canGenerateReport: true
  };

  const nextSteps = [
    {
      id: 'suitability_assessment',
      title: 'Site Suitability Assessment',
      description: 'Evaluate overall site suitability with comprehensive scoring',
      enabled: workflowStatus.readyForSuitability,
      priority: 'high' as const,
      action: onProceedToSuitabilityAssessment
    },
    {
      id: 'wake_optimization',
      title: 'Advanced Wake Optimization',
      description: 'Fine-tune layout to minimize wake effects and maximize energy yield',
      enabled: true,
      priority: 'medium' as const,
      action: onOptimizeWakeEffects
    },
    {
      id: 'report_generation',
      title: 'Generate Comprehensive Report',
      description: 'Create detailed analysis report for stakeholders',
      enabled: workflowStatus.canGenerateReport,
      priority: 'medium' as const,
      action: () => onGenerateReport?.('detailed')
    }
  ];

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleExportLayout = useCallback(async (format: ExportFormat) => {
    if (!onExportLayout) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      await onExportLayout(bestLayout, format);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        setShowExportModal(false);
        setExportProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [bestLayout, onExportLayout]);

  const handleCompareLayouts = useCallback(() => {
    if (onCompareLayouts && alternativeLayouts.length > 0) {
      onCompareLayouts([bestLayout, ...alternativeLayouts.slice(0, 3)]);
    }
    setShowComparisonModal(true);
  }, [bestLayout, alternativeLayouts, onCompareLayouts]);

  const handleRerunOptimization = useCallback(() => {
    if (onRerunOptimization) {
      const parameters: OptimizationParameters = {
        algorithm: 'genetic_algorithm',
        objectives: ['maximize_energy_yield', 'minimize_wake_losses'],
        constraints: ['minimum_spacing', 'setback_distance'],
        iterations: 150
      };
      onRerunOptimization(parameters);
    }
  }, [onRerunOptimization]);

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderWorkflowStatus = () => (
    <Container header={<Header variant="h2">Optimization Status</Header>}>
      <SpaceBetween direction="vertical" size="m">
        <Grid gridDefinition={[
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } }
        ]}>
          <Box textAlign="center">
            <StatusIndicator type="success">Optimization Complete</StatusIndicator>
            <Box variant="small" padding={{ top: 'xs' }}>
              {optimizationResults.optimizationHistory.length} generations
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Badge color={workflowStatus.hasAlternatives ? 'green' : 'grey'}>
              {alternativeLayouts.length} Alternatives
            </Badge>
            <Box variant="small" padding={{ top: 'xs' }}>
              Layout options available
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Badge color={workflowStatus.hasViolations ? 'red' : 'green'}>
              {bestLayout.constraintViolations.length} Violations
            </Badge>
            <Box variant="small" padding={{ top: 'xs' }}>
              Constraint compliance
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Badge color={workflowStatus.readyForSuitability ? 'green' : 'yellow'}>
              {workflowStatus.readyForSuitability ? 'Ready' : 'Needs Review'}
            </Badge>
            <Box variant="small" padding={{ top: 'xs' }}>
              Next step status
            </Box>
          </Box>
        </Grid>
        
        {!workflowStatus.readyForSuitability && (
          <Alert type="warning" header="Critical Issues Found">
            The layout has critical constraint violations that should be resolved before proceeding
            to site suitability assessment. Consider rerunning optimization with adjusted parameters.
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );

  const renderNextSteps = () => (
    <SimpleCallToActionPanel
      title="Next Steps in Wind Farm Development"
      description="Continue with the next phase of your wind farm analysis workflow"
      actions={nextSteps.map(step => ({
        label: step.title,
        description: step.description,
        variant: step.priority === 'high' ? 'primary' : 'normal',
        disabled: !step.enabled,
        onClick: step.action
      }))}
      position="bottom"
    />
  );

  const renderQuickActions = () => (
    <Container header={<Header variant="h2">Quick Actions</Header>}>
      <SpaceBetween direction="horizontal" size="s">
        <ButtonDropdown
          items={[
            { id: 'summary', text: 'Executive Summary' },
            { id: 'detailed', text: 'Detailed Technical Report' },
            { id: 'economic', text: 'Economic Analysis Report' },
            { id: 'environmental', text: 'Environmental Impact Report' }
          ]}
          onItemClick={({ detail }) => onGenerateReport?.(detail.id as any)}
        >
          Generate Report
        </ButtonDropdown>
        
        <ButtonDropdown
          items={[
            { id: 'json', text: 'JSON (Complete Data)' },
            { id: 'csv', text: 'CSV (Turbine Coordinates)' },
            { id: 'gis', text: 'GIS Shapefile' },
            { id: 'cad', text: 'CAD (DXF Format)' },
            { id: 'pdf', text: 'PDF Layout Plan' },
            { id: 'excel', text: 'Excel Workbook' }
          ]}
          onItemClick={({ detail }) => {
            setSelectedExportFormat(detail.id as ExportFormat);
            setShowExportModal(true);
          }}
        >
          Export Layout
        </ButtonDropdown>
        
        <Button
          onClick={handleCompareLayouts}
          disabled={alternativeLayouts.length === 0}
        >
          Compare Layouts ({alternativeLayouts.length})
        </Button>
        
        <Button
          onClick={() => setShowRecommendationsModal(true)}
          disabled={recommendations.length === 0}
        >
          View Recommendations ({recommendations.length})
        </Button>
        
        <Button
          onClick={handleRerunOptimization}
          variant="link"
        >
          Rerun Optimization
        </Button>
      </SpaceBetween>
    </Container>
  );

  const renderOptimizationSummary = () => (
    <Container header={<Header variant="h2">Optimization Summary</Header>}>
      <ColumnLayout columns={3} variant="text-grid">
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <Box variant="awsui-key-label">Best Fitness Score</Box>
            <Box variant="h3">{bestLayout.fitnessScore.toFixed(3)}</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Energy Yield</Box>
            <Box>{bestLayout.energyAnalysis.annualEnergyYield.toLocaleString()} MWh/year</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Capacity Factor</Box>
            <Box>{bestLayout.energyAnalysis.capacityFactor.toFixed(1)}%</Box>
          </Box>
        </SpaceBetween>
        
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <Box variant="awsui-key-label">Wake Losses</Box>
            <Box>{bestLayout.energyAnalysis.lossBreakdown.wakeLosses.toFixed(1)}%</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Total Capacity</Box>
            <Box>{bestLayout.layoutMetrics.totalCapacity.toFixed(1)} MW</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Turbine Count</Box>
            <Box>{bestLayout.layoutMetrics.turbineCount}</Box>
          </Box>
        </SpaceBetween>
        
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <Box variant="awsui-key-label">LCOE</Box>
            <Box>${bestLayout.costAnalysis.levelizedCostOfEnergy.toFixed(2)}/MWh</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">NPV</Box>
            <Box>${(bestLayout.costAnalysis.netPresentValue / 1e6).toFixed(1)}M</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">IRR</Box>
            <Box>{bestLayout.costAnalysis.internalRateOfReturn.toFixed(1)}%</Box>
          </Box>
        </SpaceBetween>
      </ColumnLayout>
    </Container>
  );

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      onDismiss={() => setShowExportModal(false)}
      header="Export Layout"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleExportLayout(selectedExportFormat)}
              loading={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="m">
        <Box variant="p">
          Export the optimized turbine layout in {selectedExportFormat.toUpperCase()} format.
        </Box>
        
        {isExporting && (
          <ProgressBar
            value={exportProgress}
            description="Preparing export file..."
          />
        )}
        
        <Box variant="small" color="text-body-secondary">
          The exported file will include turbine coordinates, specifications, and optimization results.
        </Box>
      </SpaceBetween>
    </Modal>
  );

  const renderComparisonModal = () => (
    <Modal
      visible={showComparisonModal}
      onDismiss={() => setShowComparisonModal(false)}
      header="Layout Comparison"
      size="large"
      footer={
        <Box float="right">
          <Button onClick={() => setShowComparisonModal(false)}>
            Close
          </Button>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <Box variant="p">
          Compare the optimized layout with alternative solutions to understand trade-offs
          between energy yield, costs, and constraint compliance.
        </Box>
        
        {alternativeLayouts.length > 0 ? (
          <Box textAlign="center" padding="l">
            <Box variant="h3">Layout Comparison Tool</Box>
            <Box variant="p" padding={{ top: 's' }}>
              This would show a detailed side-by-side comparison of:
            </Box>
            <SpaceBetween direction="vertical" size="s" alignItems="center">
              <Box>• Energy yield and capacity factors</Box>
              <Box>• Wake loss patterns and optimization</Box>
              <Box>• Economic metrics (LCOE, NPV, IRR)</Box>
              <Box>• Constraint compliance scores</Box>
              <Box>• Risk factors and mitigation strategies</Box>
            </SpaceBetween>
          </Box>
        ) : (
          <Alert type="info" header="No Alternative Layouts Available">
            Run optimization with different parameters to generate alternative layouts for comparison.
          </Alert>
        )}
      </SpaceBetween>
    </Modal>
  );

  const renderRecommendationsModal = () => (
    <Modal
      visible={showRecommendationsModal}
      onDismiss={() => setShowRecommendationsModal(false)}
      header="Optimization Recommendations"
      size="large"
      footer={
        <Box float="right">
          <Button onClick={() => setShowRecommendationsModal(false)}>
            Close
          </Button>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {recommendations.length > 0 ? (
          recommendations.slice(0, 5).map((recommendation, index) => (
            <Container key={index}>
              <SpaceBetween direction="vertical" size="s">
                <Box>
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box variant="h4">{recommendation.title}</Box>
                    <Badge color={
                      recommendation.priority === 'high' ? 'red' :
                      recommendation.priority === 'medium' ? 'yellow' : 'blue'
                    }>
                      {recommendation.priority.toUpperCase()}
                    </Badge>
                  </SpaceBetween>
                </Box>
                
                <Box variant="p">{recommendation.description}</Box>
                
                <Box variant="small" color="text-body-secondary">
                  <strong>Expected Benefit:</strong> {recommendation.expectedBenefit.energyYieldIncrease.toLocaleString()} MWh/year increase
                </Box>
                
                <Box variant="small" color="text-body-secondary">
                  <strong>Implementation:</strong> {recommendation.implementationComplexity} complexity, {recommendation.timeframe} timeframe
                </Box>
              </SpaceBetween>
            </Container>
          ))
        ) : (
          <Alert type="info" header="No Recommendations Available">
            The current layout appears to be well-optimized with no specific improvement recommendations.
          </Alert>
        )}
      </SpaceBetween>
    </Modal>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <Container>
        <Box textAlign="center" padding="xxl">
          <StatusIndicator type="loading">
            Processing optimization results...
          </StatusIndicator>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert type="error" header="Workflow Integration Error">
          {error}
        </Alert>
      </Container>
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <SpaceBetween direction="vertical" size="l">
          {renderWorkflowStatus()}
          {renderOptimizationSummary()}
          {renderQuickActions()}
          {renderNextSteps()}
        </SpaceBetween>
      )
    },
    {
      id: 'visualization',
      label: 'Layout Visualization',
      content: (
        <LayoutOptimizationVisualization
          optimizedLayout={bestLayout}
          alternativeLayouts={alternativeLayouts}
          performanceMetrics={optimizationResults.performanceMetrics}
          constraintCompliance={optimizationResults.constraintCompliance}
          windData={{ statistics: { meanWindSpeed: 8.5, prevailingDirection: 225 } } as any}
          turbineSpec={{ ratedPower: 2500, rotorDiameter: 120, hubHeight: 100 } as any}
          onExportLayout={onExportLayout}
          onCompareLayouts={onCompareLayouts}
          onOptimizeWakeEffects={onOptimizeWakeEffects}
          onGenerateReport={() => onGenerateReport?.('detailed')}
        />
      )
    },
    {
      id: 'compliance',
      label: 'Constraint Compliance',
      content: (
        <ConstraintComplianceVisualization
          constraintCompliance={optimizationResults.constraintCompliance}
          layout={bestLayout}
          constraints={[]} // Would be passed from parent
          onFixViolation={(violationId) => console.log('Fix violation:', violationId)}
          onRelaxConstraint={(constraintId) => console.log('Relax constraint:', constraintId)}
          onShowViolationDetails={(violation) => console.log('Show details:', violation)}
        />
      )
    }
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Complete layout optimization workflow with next steps and export options"
        >
          Layout Optimization Workflow
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <Tabs
          tabs={tabs}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        />
        
        {renderExportModal()}
        {renderComparisonModal()}
        {renderRecommendationsModal()}
      </SpaceBetween>
    </Container>
  );
};