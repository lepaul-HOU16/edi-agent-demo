/**
 * Deployment Status Indicator - Simple status display for renewable energy tools
 * 
 * Shows deployment status and provides remediation guidance when issues are detected.
 */

import React from 'react';
import { StatusIndicator, Alert, Button, Box, SpaceBetween } from '@cloudscape-design/components';

export interface DeploymentStatusProps {
  status: 'checking' | 'healthy' | 'degraded' | 'failed';
  message: string;
  remediationSteps?: string[];
  onRefresh?: () => void;
  onCopyCommand?: (command: string) => void;
}

export const DeploymentStatusIndicator: React.FC<DeploymentStatusProps> = ({
  status,
  message,
  remediationSteps = [],
  onRefresh,
  onCopyCommand
}) => {
  const getStatusType = () => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'failed': return 'error';
      case 'checking': return 'loading';
      default: return 'info';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking': return 'Checking deployment status...';
      case 'healthy': return 'All systems operational';
      case 'degraded': return 'Limited functionality';
      case 'failed': return 'System unavailable';
      default: return message;
    }
  };

  // Don't show anything for healthy status
  if (status === 'healthy') {
    return (
      <StatusIndicator type="success">
        {getStatusText()}
      </StatusIndicator>
    );
  }

  // Show alert for issues
  if (status === 'failed' || status === 'degraded') {
    return (
      <Alert
        type={status === 'failed' ? 'error' : 'warning'}
        header={status === 'failed' ? 'Renewable Energy Tools Unavailable' : 'Limited Functionality'}
        action={
          <SpaceBetween direction="horizontal" size="xs">
            {onRefresh && (
              <Button onClick={onRefresh}>
                {status === 'checking' ? 'Checking...' : 'Check Again'}
              </Button>
            )}
            {remediationSteps.length > 0 && onCopyCommand && (
              <Button
                variant="primary"
                onClick={() => {
                  const firstCommand = remediationSteps.find(step => step.startsWith('Run:'));
                  if (firstCommand && onCopyCommand) {
                    onCopyCommand(firstCommand);
                  }
                }}
              >
                Copy Fix Command
              </Button>
            )}
          </SpaceBetween>
        }
      >
        <SpaceBetween size="s">
          <div>{message}</div>
          {remediationSteps.length > 0 && (
            <div>
              <Box variant="strong">
                {status === 'failed' ? 'Required Actions:' : 'Recommended Actions:'}
              </Box>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {remediationSteps.slice(0, 3).map((step, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {step.startsWith('Run:') ? <code>{step}</code> : step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SpaceBetween>
      </Alert>
    );
  }

  // Default status indicator for checking state
  return (
    <StatusIndicator type={getStatusType()}>
      {getStatusText()}
    </StatusIndicator>
  );
};

export default DeploymentStatusIndicator;