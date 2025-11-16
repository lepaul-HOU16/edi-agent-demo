/**
 * Suitability Assessment Workflow Integration
 * 
 * Integrates site suitability assessment into the renewable energy workflow
 * with call-to-action buttons, report generation, and site comparison functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Button,
  Box,
  Alert,
  Spinner,
  Modal,
  Grid,
  StatusIndicator,
  ProgressBar,
  Badge,
  TextContent
} from '@cloudscape-design/components';
import { SuitabilityVisualizationDashboard } from './SuitabilityVisualizationDashboard';
import { SiteComparisonDashboard } from './SiteComparisonDashboard';
import { SimpleCallToActionPanel } from './SimpleCallToActionPanel';
import { SuitabilityScoringService } from '@/services/renewable';
import {
  SiteSuitabilityAssessment,
  SiteLocation,
  ComparativeAnalysis
} from '../../types/suitabilityScoring';
import { WindResourceData } from '../../types/windData';
import { TerrainFeature } from '../../types/layoutOptimization';

interface SuitabilityAssessmentWorkflowProps {
  siteId: string;
  location: SiteLocation;
  windData?: WindResourceData;
  terrainFeatures?: TerrainFeature[];
  onProceedToReportGeneration?: (assessment: SiteSuitabilityAssessment) => void;
  onCompareAlternatives?: (assessments: SiteSuitabilityAssessment[]) => void;
  onStartNewAssessment?: () => void;
  className?: string;
}

/**
 * Suitability Assessment Workflow Component
 */
export const SuitabilityAssessmentWorkflow: React.FC<SuitabilityAssessmentWorkflowProps> = ({
  siteId,
  location,
  windData,
  terrainFeatures = [],
  onProceedToReportGeneration,
  onCompareAlternatives,
  onStartNewAssessment,
  className
}) => {
  const [assessment, setAssessment] = useState<SiteSuitabilityAssessment | null>(null);
  const [alternativeSites, setAlternativeSites] = useState<SiteSuitabilityAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);

  const scoringService = new SuitabilityScoringService();

  // Perform suitability assessment on component mount or when data changes
  useEffect(() => {
    if (windData && location) {
      performAssessment();
    }
  }, [siteId, location, windData, terrainFeatures]);

  const performAssessment = async () => {
    if (!windData) {
      setError('Wind data is required for suitability assessment');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await scoringService.calculateSuitability(
        siteId,
        location,
        windData,
        terrainFeatures
      );
      
      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform suitability assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportResults = () => {
    if (!assessment) return;

    // Create export data
    const exportData = {
      assessment,
      exportedAt: new Date().toISOString(),
      format: 'json'
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suitability-assessment-${siteId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    if (!assessment) return;

    setShowReportModal(true);
    setReportGenerating(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, this would call a report generation service
      onProceedToReportGeneration?.(assessment);
      
      setShowReportModal(false);
    } catch (err) {
      setError('Failed to generate comprehensive report');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleCompareAlternatives = () => {
    if (!assessment) return;

    // Add current assessment to alternatives if not already present
    const allSites = alternativeSites.some(site => site.siteId === assessment.siteId)
      ? alternativeSites
      : [...alternativeSites, assessment];

    setAlternativeSites(allSites);
    setShowComparison(true);
    onCompareAlternatives?.(allSites);
  };

  const getCallToActionConfig = () => {
    if (!assessment) return null;

    const score = assessment.overallScore;
    const hasHighRisks = assessment.riskFactors.some(risk => 
      risk.severity === 'high' || risk.severity === 'critical'
    );

    if (score >= 80) {
      return {
        position: 'bottom' as const,
        guidance: 'This site shows excellent potential for renewable energy development. Proceed with detailed project planning.',
        buttons: [
          {
            id: 'generate_report',
            label: 'Generate Comprehensive Report',
            action: 'generate_report',
            variant: 'primary' as const
          },
          {
            id: 'compare_alternatives',
            label: 'Compare with Alternatives',
            action: 'compare_alternatives',
            variant: 'secondary' as const
          }
        ],
        priority: 'high' as const,
        onActionClick: (actionId: string) => {
          if (actionId === 'generate_report') handleGenerateReport();
          if (actionId === 'compare_alternatives') handleCompareAlternatives();
        }
      };
    } else if (score >= 60) {
      return {
        position: 'bottom' as const,
        guidance: 'This site has good development potential. Consider risk mitigation strategies and detailed feasibility studies.',
        buttons: [
          {
            id: 'risk_mitigation',
            label: 'Review Risk Mitigation',
            action: 'risk_mitigation',
            variant: 'primary' as const
          },
          {
            id: 'generate_report',
            label: 'Generate Report',
            action: 'generate_report',
            variant: 'secondary' as const
          },
          {
            id: 'compare_alternatives',
            label: 'Compare Alternatives',
            action: 'compare_alternatives',
            variant: 'secondary' as const
          }
        ],
        priority: 'medium' as const,
        onActionClick: (actionId: string) => {
          if (actionId === 'generate_report') handleGenerateReport();
          if (actionId === 'compare_alternatives') handleCompareAlternatives();
        }
      };
    } else if (score >= 40) {
      return {
        position: 'bottom' as const,
        guidance: 'This site requires additional studies and risk assessment before proceeding with development.',
        buttons: [
          {
            id: 'additional_studies',
            label: 'Plan Additional Studies',
            action: 'additional_studies',
            variant: 'primary' as const
          },
          {
            id: 'compare_alternatives',
            label: 'Compare with Better Alternatives',
            action: 'compare_alternatives',
            variant: 'secondary' as const
          }
        ],
        priority: 'medium' as const,
        onActionClick: (actionId: string) => {
          if (actionId === 'compare_alternatives') handleCompareAlternatives();
        }
      };
    } else {
      return {
        position: 'bottom' as const,
        guidance: 'This site shows poor suitability for development. Consider alternative locations.',
        buttons: [
          {
            id: 'find_alternatives',
            label: 'Find Alternative Sites',
            action: 'find_alternatives',
            variant: 'primary' as const
          },
          {
            id: 'generate_report',
            label: 'Generate Assessment Report',
            action: 'generate_report',
            variant: 'secondary' as const
          }
        ],
        priority: 'high' as const,
        onActionClick: (actionId: string) => {
          if (actionId === 'find_alternatives' && onStartNewAssessment) onStartNewAssessment();
          if (actionId === 'generate_report') handleGenerateReport();
        }
      };
    }
  };

  const renderLoadingState = () => (
    <Container>
      <SpaceBetween direction="vertical" size="l" alignItems="center">
        <Spinner size="large" />
        <Box textAlign="center">
          <Header variant="h2">Performing Site Suitability Assessment</Header>
          <TextContent>
            <p>Analyzing wind resource, terrain conditions, grid connectivity, and environmental factors...</p>
          </TextContent>
        </Box>
      </SpaceBetween>
    </Container>
  );

  const renderErrorState = () => (
    <Container>
      <Alert
        type="error"
        header="Assessment Failed"
        action={
          <Button onClick={performAssessment}>
            Retry Assessment
          </Button>
        }
      >
        {error}
      </Alert>
    </Container>
  );

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      onDismiss={() => !reportGenerating && setShowReportModal(false)}
      header="Generating Comprehensive Report"
      closeAriaLabel="Close modal"
      size="medium"
    >
      <SpaceBetween direction="vertical" size="l">
        {reportGenerating ? (
          <SpaceBetween direction="vertical" size="m" alignItems="center">
            <Spinner size="large" />
            <Box textAlign="center">
              <Header variant="h3">Preparing Your Report</Header>
              <TextContent>
                <p>Compiling assessment results, recommendations, and executive summary...</p>
              </TextContent>
            </Box>
            <ProgressBar value={75} additionalInfo="Processing data..." />
          </SpaceBetween>
        ) : (
          <SpaceBetween direction="vertical" size="m">
            <StatusIndicator type="success">Report Generated Successfully</StatusIndicator>
            <TextContent>
              <p>Your comprehensive site suitability report has been generated and is ready for download.</p>
            </TextContent>
            <SpaceBetween direction="horizontal" size="s">
              <Button variant="primary" onClick={() => setShowReportModal(false)}>
                Download Report
              </Button>
              <Button onClick={() => setShowReportModal(false)}>
                Close
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        )}
      </SpaceBetween>
    </Modal>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  if (!assessment) {
    return (
      <Container>
        <Alert type="info" header="No Assessment Data">
          Wind resource data is required to perform site suitability assessment.
        </Alert>
      </Container>
    );
  }

  if (showComparison && alternativeSites.length > 1) {
    return (
      <div className={className}>
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Header variant="h1">Site Comparison Analysis</Header>
              <Button
                variant="link"
                onClick={() => setShowComparison(false)}
              >
                Back to Assessment
              </Button>
            </SpaceBetween>
          </Container>
          
          <SiteComparisonDashboard
            sites={alternativeSites}
            onSelectSite={(siteId) => {
              const selectedSite = alternativeSites.find(site => site.siteId === siteId);
              if (selectedSite) {
                setAssessment(selectedSite);
                setShowComparison(false);
              }
            }}
            onGenerateComparison={() => {
              // Generate detailed comparison report
              handleGenerateReport();
            }}
          />
        </SpaceBetween>
      </div>
    );
  }

  const callToActionConfig = getCallToActionConfig();

  return (
    <div className={className}>
      <SpaceBetween direction="vertical" size="l">
        <SuitabilityVisualizationDashboard
          assessment={assessment}
          onExportResults={handleExportResults}
          onGenerateReport={handleGenerateReport}
          onCompareAlternatives={handleCompareAlternatives}
        />

        {callToActionConfig && (
          <SimpleCallToActionPanel
            position={callToActionConfig.position}
            guidance={callToActionConfig.guidance}
            buttons={callToActionConfig.buttons}
            priority={callToActionConfig.priority}
            onActionClick={callToActionConfig.onActionClick}
          />
        )}

        {renderReportModal()}
      </SpaceBetween>
    </div>
  );
};

export default SuitabilityAssessmentWorkflow;