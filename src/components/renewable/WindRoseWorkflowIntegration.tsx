/**
 * Wind Rose Workflow Integration Component
 * 
 * Handles workflow progression, call-to-action buttons, and next step guidance
 * for wind rose analysis within the renewable energy workflow.
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  Modal,
  ProgressBar,
  Badge,
  ColumnLayout,
  Link
} from '@cloudscape-design/components';
import { WindResourceData, SeasonalWindData } from '../../types/windData';
import { WorkflowStepProps } from '../../types/workflow';

interface WindRoseWorkflowIntegrationProps extends Partial<WorkflowStepProps> {
  windData: WindResourceData;
  seasonalData?: SeasonalWindData;
  analysisResults: {
    windResourceAssessment: 'excellent' | 'good' | 'fair' | 'poor';
    energyPotentialRating: number;
    recommendedTurbineOrientation: number;
    seasonalVariability: 'low' | 'medium' | 'high';
    nextRecommendedSteps: string[];
    keyFindings: string[];
  };
  onExportResults?: (format: string, data: any) => void;
  onAdvanceToNextStep?: (stepId: string) => void;
}

interface NextStepOption {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  prerequisites: string[];
  benefits: string[];
  icon: string;
}

const WindRoseWorkflowIntegration: React.FC<WindRoseWorkflowIntegrationProps> = ({
  windData,
  seasonalData,
  analysisResults,
  onExportResults,
  onAdvanceToNextStep,
  stepId,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNextStepsModal, setShowNextStepsModal] = useState(false);
  const [selectedNextStep, setSelectedNextStep] = useState<NextStepOption | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Define next step options based on analysis results
  const nextStepOptions: NextStepOption[] = [
    {
      id: 'wake_analysis',
      title: 'Wake Analysis',
      description: 'Analyze turbine wake interactions and energy losses to optimize spacing and layout',
      priority: analysisResults.windResourceAssessment === 'excellent' || analysisResults.windResourceAssessment === 'good' ? 'high' : 'medium',
      estimatedTime: '15-20 minutes',
      prerequisites: ['Wind rose analysis complete'],
      benefits: [
        'Understand turbine interaction effects',
        'Optimize turbine spacing',
        'Minimize energy losses',
        'Improve overall farm efficiency'
      ],
      icon: 'settings'
    },
    {
      id: 'layout_optimization',
      title: 'Layout Optimization',
      description: 'Optimize turbine placement based on wind patterns and terrain constraints',
      priority: 'high',
      estimatedTime: '20-30 minutes',
      prerequisites: ['Wind rose analysis complete'],
      benefits: [
        'Maximize energy production',
        'Minimize wake losses',
        'Optimize land use',
        'Reduce infrastructure costs'
      ],
      icon: 'view-horizontal'
    },
    {
      id: 'site_suitability',
      title: 'Site Suitability Assessment',
      description: 'Comprehensive site evaluation including regulatory, environmental, and economic factors',
      priority: analysisResults.windResourceAssessment === 'poor' ? 'high' : 'medium',
      estimatedTime: '25-35 minutes',
      prerequisites: ['Wind rose analysis complete'],
      benefits: [
        'Comprehensive site scoring',
        'Risk factor identification',
        'Regulatory compliance check',
        'Investment decision support'
      ],
      icon: 'status-positive'
    },
    {
      id: 'financial_analysis',
      title: 'Financial Analysis',
      description: 'Economic feasibility analysis including LCOE, NPV, and ROI calculations',
      priority: analysisResults.windResourceAssessment === 'excellent' ? 'high' : 'low',
      estimatedTime: '30-40 minutes',
      prerequisites: ['Wind rose analysis complete', 'Layout optimization recommended'],
      benefits: [
        'LCOE calculations',
        'Investment returns analysis',
        'Risk assessment',
        'Financing options evaluation'
      ],
      icon: 'gen-ai'
    }
  ];

  // Sort next steps by priority and suitability
  const sortedNextSteps = nextStepOptions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Handle step completion
  const handleCompleteAnalysis = () => {
    if (onStepComplete && stepId) {
      onStepComplete(stepId, {
        stepId,
        success: true,
        data: {
          windResourceAssessment: analysisResults.windResourceAssessment,
          energyPotentialRating: analysisResults.energyPotentialRating,
          recommendedOrientation: analysisResults.recommendedTurbineOrientation,
          keyFindings: analysisResults.keyFindings,
          completedAt: new Date().toISOString()
        },
        artifacts: [windData],
        nextRecommendedStep: sortedNextSteps[0]?.id || 'wake_analysis'
      });
    }
  };

  // Handle next step selection
  const handleNextStepSelection = (nextStep: NextStepOption) => {
    setSelectedNextStep(nextStep);
    setShowNextStepsModal(true);
  };

  // Confirm and advance to next step
  const confirmNextStep = () => {
    if (selectedNextStep) {
      handleCompleteAnalysis();
      
      if (onAdvanceToNextStep) {
        onAdvanceToNextStep(selectedNextStep.id);
      }
      
      if (onAdvanceWorkflow) {
        onAdvanceWorkflow(selectedNextStep.id);
      }
    }
    setShowNextStepsModal(false);
  };

  // Handle export
  const handleExport = async (format: string) => {
    if (!onExportResults) return;
    
    setExportInProgress(true);
    try {
      const exportData = {
        windRoseAnalysis: {
          location: windData.location,
          timeRange: windData.timeRange,
          statistics: windData.statistics,
          qualityMetrics: windData.qualityMetrics,
          analysisResults
        },
        seasonalData,
        metadata: {
          exportedAt: new Date().toISOString(),
          format,
          version: '1.0'
        }
      };
      
      await onExportResults(format, exportData);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportInProgress(false);
      setShowExportModal(false);
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'grey';
      case 'low': return 'blue';
      default: return 'grey';
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Complete your wind rose analysis and proceed to the next step in your renewable energy workflow"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                iconName="download"
                onClick={() => setShowExportModal(true)}
              >
                Export Results
              </Button>
              <Button
                variant="primary"
                iconName="arrow-right"
                onClick={() => handleNextStepSelection(sortedNextSteps[0])}
              >
                Continue Analysis
              </Button>
            </SpaceBetween>
          }
        >
          Wind Rose Analysis Complete
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Analysis Summary */}
        <Alert
          type={analysisResults.windResourceAssessment === 'excellent' ? 'success' : 
                analysisResults.windResourceAssessment === 'good' ? 'info' : 'warning'}
          header={`Wind Resource Assessment: ${analysisResults.windResourceAssessment.toUpperCase()}`}
        >
          <SpaceBetween size="s">
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="small">Energy Potential</Box>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {analysisResults.energyPotentialRating}/100
                </div>
              </div>
              <div>
                <Box variant="small">Seasonal Variability</Box>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {analysisResults.seasonalVariability.toUpperCase()}
                </div>
              </div>
              <div>
                <Box variant="small">Recommended Orientation</Box>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {analysisResults.recommendedTurbineOrientation}°
                </div>
              </div>
            </ColumnLayout>
            
            <Box>
              <Box variant="awsui-key-label">Key Findings:</Box>
              <SpaceBetween size="xs">
                {analysisResults.keyFindings.map((finding, index) => (
                  <div key={index}>• {finding}</div>
                ))}
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Alert>

        {/* Progress Indicator */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Workflow Progress
          </Box>
          <ProgressBar
            value={25}
            description="Wind rose analysis complete - Ready for next step"
            additionalInfo="Step 1 of 4 completed"
          />
        </Box>

        {/* Next Steps Recommendations */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Recommended Next Steps
          </Box>
          <SpaceBetween size="m">
            {sortedNextSteps.slice(0, 3).map((nextStep) => (
              <Container key={nextStep.id}>
                <SpaceBetween size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Badge color={getPriorityBadgeColor(nextStep.priority)}>
                      {nextStep.priority.toUpperCase()}
                    </Badge>
                    <Box variant="h4">{nextStep.title}</Box>
                    <Box variant="small" color="text-body-secondary">
                      {nextStep.estimatedTime}
                    </Box>
                  </SpaceBetween>
                  
                  <Box>{nextStep.description}</Box>
                  
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="small">Benefits:</Box>
                      <SpaceBetween size="xs">
                        {nextStep.benefits.slice(0, 2).map((benefit, index) => (
                          <div key={index} style={{ fontSize: '12px' }}>• {benefit}</div>
                        ))}
                      </SpaceBetween>
                    </div>
                    <div>
                      <Box variant="small">Prerequisites:</Box>
                      <SpaceBetween size="xs">
                        {nextStep.prerequisites.map((prereq, index) => (
                          <div key={index} style={{ fontSize: '12px', color: '#0073bb' }}>✓ {prereq}</div>
                        ))}
                      </SpaceBetween>
                    </div>
                  </ColumnLayout>
                  
                  <SpaceBetween direction="horizontal" size="s">
                    <Button
                      variant={nextStep.priority === 'high' ? 'primary' : 'normal'}
                      iconName={nextStep.icon as any}
                      onClick={() => handleNextStepSelection(nextStep)}
                    >
                      Start {nextStep.title}
                    </Button>
                    <Link href="#" onClick={() => console.log(`Learn more about ${nextStep.title}`)}>
                      Learn more
                    </Link>
                  </SpaceBetween>
                </SpaceBetween>
              </Container>
            ))}
          </SpaceBetween>
        </Box>

        {/* Export Options */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Export & Share Results
          </Box>
          <SpaceBetween direction="horizontal" size="s">
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleExport('pdf')}
              loading={exportInProgress}
            >
              PDF Report
            </Button>
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleExport('excel')}
              loading={exportInProgress}
            >
              Excel Data
            </Button>
            <Button
              variant="normal"
              iconName="share"
              onClick={() => console.log('Share results')}
            >
              Share Analysis
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        onDismiss={() => setShowExportModal(false)}
        header="Export Wind Rose Analysis"
        footer={
          <SpaceBetween direction="horizontal" size="s">
            <Button variant="link" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box>Choose your preferred export format:</Box>
          <SpaceBetween size="s">
            <Button
              variant="primary"
              iconName="download"
              onClick={() => handleExport('pdf')}
              loading={exportInProgress}
              fullWidth
            >
              PDF Report - Complete analysis with charts and statistics
            </Button>
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleExport('excel')}
              loading={exportInProgress}
              fullWidth
            >
              Excel Spreadsheet - Raw data and calculations
            </Button>
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleExport('json')}
              loading={exportInProgress}
              fullWidth
            >
              JSON Data - Machine-readable format
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Modal>

      {/* Next Steps Confirmation Modal */}
      <Modal
        visible={showNextStepsModal}
        onDismiss={() => setShowNextStepsModal(false)}
        header={`Start ${selectedNextStep?.title}`}
        footer={
          <SpaceBetween direction="horizontal" size="s">
            <Button variant="link" onClick={() => setShowNextStepsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmNextStep}>
              Continue to {selectedNextStep?.title}
            </Button>
          </SpaceBetween>
        }
      >
        {selectedNextStep && (
          <SpaceBetween size="m">
            <Alert type="info" header="Ready to proceed">
              Your wind rose analysis is complete and all prerequisites are met.
            </Alert>
            
            <Box>
              <Box variant="h4">{selectedNextStep.title}</Box>
              <Box margin={{ top: 'xs' }}>{selectedNextStep.description}</Box>
            </Box>
            
            <Box>
              <Box variant="awsui-key-label">What you'll accomplish:</Box>
              <SpaceBetween size="xs">
                {selectedNextStep.benefits.map((benefit, index) => (
                  <div key={index}>• {benefit}</div>
                ))}
              </SpaceBetween>
            </Box>
            
            <Box>
              <Box variant="awsui-key-label">Estimated time:</Box>
              <div>{selectedNextStep.estimatedTime}</div>
            </Box>
          </SpaceBetween>
        )}
      </Modal>
    </Container>
  );
};

export default WindRoseWorkflowIntegration;