import React from 'react';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface RenewableJobProcessingIndicatorProps {
  isProcessing: boolean;
  currentStep?: string;
  completedSteps?: number;
  totalSteps?: number;
  estimatedTimeRemaining?: number;
  error?: string | null;
}

/**
 * Processing state indicator for async renewable energy jobs
 * 
 * Displays:
 * - "Analyzing..." message immediately when job starts
 * - Progress indicator showing current step
 * - Auto-updates when results arrive
 * 
 * Requirements: 2, 3 from async-renewable-jobs spec
 */
export const RenewableJobProcessingIndicator: React.FC<RenewableJobProcessingIndicatorProps> = ({
  isProcessing,
  currentStep = 'Initializing analysis',
  completedSteps = 0,
  totalSteps = 3,
  estimatedTimeRemaining,
  error
}) => {
  if (!isProcessing && !error) {
    return null;
  }

  // Calculate progress percentage
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Format estimated time remaining
  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '';
    
    if (seconds < 60) {
      return `~${Math.ceil(seconds)}s remaining`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `~${minutes}m remaining`;
    }
    
    return `~${minutes}m ${Math.ceil(remainingSeconds)}s remaining`;
  };

  // Get step description
  const getStepDescription = (step: string): string => {
    const stepDescriptions: Record<string, string> = {
      'terrain_analysis': 'Analyzing terrain and site conditions',
      'layout_optimization': 'Optimizing turbine layout',
      'simulation': 'Running energy production simulation',
      'report_generation': 'Generating comprehensive report',
      'Initializing analysis': 'Starting renewable energy analysis'
    };
    
    return stepDescriptions[step] || step;
  };

  if (error) {
    return (
      <Container>
        <Box padding="m">
          <StatusIndicator type="error">
            Analysis Error
          </StatusIndicator>
          <Box variant="p" color="text-status-error" margin={{ top: 'xs' }}>
            {error}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box padding="m">
        <SpaceBetween size="m">
          <div>
            <StatusIndicator type="in-progress">
              Analyzing renewable energy site...
            </StatusIndicator>
          </div>
          
          <Box>
            <Box variant="small" color="text-body-secondary" margin={{ bottom: 'xs' }}>
              {getStepDescription(currentStep)}
            </Box>
            <ProgressBar
              value={progressPercentage}
              additionalInfo={`Step ${completedSteps} of ${totalSteps}`}
              description={estimatedTimeRemaining ? formatTimeRemaining(estimatedTimeRemaining) : undefined}
              label="Analysis Progress"
            />
          </Box>

          <Box variant="small" color="text-body-secondary">
            Your results will appear automatically when the analysis is complete. 
            This typically takes 30-60 seconds.
          </Box>
        </SpaceBetween>
      </Box>
    </Container>
  );
};

export default RenewableJobProcessingIndicator;
