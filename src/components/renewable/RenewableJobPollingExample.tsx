import React from 'react';
import { Box, Alert, StatusIndicator, ProgressBar } from '@cloudscape-design/components';
import { useRenewableJobPolling } from '@/hooks/useRenewableJobPolling';

interface RenewableJobPollingExampleProps {
  chatSessionId: string;
  enabled: boolean;
}

/**
 * Example component demonstrating how to use the useRenewableJobPolling hook
 * 
 * This component shows:
 * - How to enable/disable polling
 * - How to display processing state
 * - How to handle new results
 * - How to display errors
 */
export function RenewableJobPollingExample({
  chatSessionId,
  enabled
}: RenewableJobPollingExampleProps) {
  const {
    isProcessing,
    hasNewResults,
    latestMessage,
    error
  } = useRenewableJobPolling({
    chatSessionId,
    enabled,
    pollingInterval: 3000, // Poll every 3 seconds
    onNewMessage: (message) => {
      console.log('New renewable job result received:', message);
    },
    onError: (err) => {
      console.error('Polling error:', err);
    }
  });

  return (
    <Box padding="l">
      {/* Processing State */}
      {isProcessing && (
        <Alert type="info" header="Processing Renewable Energy Analysis">
          <Box>
            <StatusIndicator type="in-progress">
              Analyzing terrain, wind resources, and site suitability...
            </StatusIndicator>
            <Box margin={{ top: 's' }}>
              <ProgressBar
                value={33}
                additionalInfo="This may take 30-60 seconds"
                description="Processing renewable energy job"
              />
            </Box>
          </Box>
        </Alert>
      )}

      {/* Results Available */}
      {hasNewResults && latestMessage && (
        <Alert type="success" header="Analysis Complete">
          <Box>
            <StatusIndicator type="success">
              Renewable energy analysis completed successfully
            </StatusIndicator>
            {latestMessage.artifacts && latestMessage.artifacts.length > 0 && (
              <Box margin={{ top: 's' }}>
                Found {latestMessage.artifacts.length} artifact(s)
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert type="error" header="Polling Error">
          {error}
        </Alert>
      )}

      {/* Idle State */}
      {!isProcessing && !hasNewResults && !error && enabled && (
        <Alert type="info" header="Waiting for Job">
          Polling for renewable energy job results...
        </Alert>
      )}

      {/* Disabled State */}
      {!enabled && (
        <Alert type="info" header="Polling Disabled">
          Enable polling to check for renewable energy job results
        </Alert>
      )}
    </Box>
  );
}
