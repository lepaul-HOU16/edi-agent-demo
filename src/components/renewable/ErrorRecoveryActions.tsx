/**
 * Error Recovery Actions - Simple UI for recovering from renewable energy errors
 * 
 * Provides actionable buttons and guidance when renewable energy tools fail.
 */

import React, { useState } from 'react';
import { Button, SpaceBetween, Modal, Box, Alert } from '@cloudscape-design/components';
import { ReportFallbackService } from '../../services/renewable-integration/ReportFallbackService';

export interface ErrorRecoveryProps {
  errorType: 'deployment' | 'permission' | 'timeout' | 'network' | 'unknown';
  errorMessage: string;
  remediationSteps: string[];
  projectData?: any;
  onRetry?: () => void;
  onFallbackReport?: (report: any) => void;
}

export const ErrorRecoveryActions: React.FC<ErrorRecoveryProps> = ({
  errorType,
  errorMessage,
  remediationSteps,
  projectData,
  onRetry,
  onFallbackReport
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [generatingFallback, setGeneratingFallback] = useState(false);
  const [fallbackService] = useState(() => new ReportFallbackService());

  const handleGenerateFallbackReport = async () => {
    if (!projectData || !onFallbackReport) return;
    
    setGeneratingFallback(true);
    try {
      const reportRequest = {
        projectName: projectData.projectId || 'Wind Farm Project',
        location: {
          lat: projectData.coordinates?.lat || 0,
          lon: projectData.coordinates?.lng || 0
        }
      };

      const fallbackReport = await fallbackService.generateReport(reportRequest, {
        terrain: projectData
      });

      if (fallbackReport.success && fallbackReport.report) {
        onFallbackReport(fallbackReport.report);
      }
    } catch (error) {
      console.error('Failed to generate fallback report:', error);
    } finally {
      setGeneratingFallback(false);
    }
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command).then(() => {
      console.log('Command copied to clipboard:', command);
    }).catch(err => {
      console.error('Failed to copy command:', err);
    });
  };

  const getPrimaryAction = () => {
    switch (errorType) {
      case 'deployment':
        return {
          text: 'Deploy Tools',
          command: 'npx ampx sandbox',
          description: 'Deploy renewable energy backend tools'
        };
      case 'permission':
        return {
          text: 'Check Credentials',
          command: 'aws sts get-caller-identity',
          description: 'Verify AWS credentials and permissions'
        };
      case 'timeout':
        return {
          text: 'Retry Analysis',
          command: null,
          description: 'Retry the analysis with current settings'
        };
      default:
        return {
          text: 'Retry',
          command: null,
          description: 'Try the operation again'
        };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <SpaceBetween size="s">
      <SpaceBetween direction="horizontal" size="xs">
        {/* Primary action button */}
        {primaryAction.command ? (
          <Button
            variant="primary"
            onClick={() => handleCopyCommand(primaryAction.command!)}
          >
            {primaryAction.text}
          </Button>
        ) : onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
          >
            {primaryAction.text}
          </Button>
        )}

        {/* Fallback report generation */}
        {projectData && onFallbackReport && (
          <Button
            onClick={handleGenerateFallbackReport}
            loading={generatingFallback}
          >
            Generate Fallback Report
          </Button>
        )}

        {/* Show details button */}
        <Button
          onClick={() => setShowDetails(true)}
        >
          Show Details
        </Button>
      </SpaceBetween>

      {/* Details modal */}
      <Modal
        visible={showDetails}
        onDismiss={() => setShowDetails(false)}
        header="Error Details & Recovery Steps"
        footer={
          <Box float="right">
            <Button onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="info" header="Error Information">
            <SpaceBetween size="s">
              <div>
                <Box variant="strong">Error Type:</Box> {errorType}
              </div>
              <div>
                <Box variant="strong">Message:</Box> {errorMessage}
              </div>
            </SpaceBetween>
          </Alert>

          {remediationSteps.length > 0 && (
            <div>
              <Box variant="h3">Recovery Steps</Box>
              <ol style={{ paddingLeft: '20px' }}>
                {remediationSteps.map((step, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {step.startsWith('Run:') ? (
                      <div>
                        <code style={{ 
                          background: '#f1f3f3', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}>
                          {step}
                        </code>
                        <Button
                          variant="inline-link"
                          onClick={() => handleCopyCommand(step)}
                        >
                          Copy
                        </Button>
                      </div>
                    ) : (
                      step
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Alert type="info" header="Need Help?">
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Check the deployment documentation for detailed setup instructions</li>
              <li>Review CloudWatch logs for specific error details</li>
              <li>Verify AWS credentials and permissions are properly configured</li>
            </ul>
          </Alert>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};

export default ErrorRecoveryActions;