import React, { useState } from 'react';
import { RenewableJobStatusDisplay } from './RenewableJobStatusDisplay';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';

/**
 * Integration example showing how to use RenewableJobStatusDisplay in a chat interface
 * 
 * This demonstrates:
 * 1. Starting a renewable job (which triggers async processing)
 * 2. Showing the processing indicator immediately
 * 3. Auto-updating when results arrive
 * 4. Handling errors gracefully
 * 
 * Requirements: 2, 3 from async-renewable-jobs spec
 */
export const RenewableJobStatusIntegrationExample: React.FC = () => {
  const [chatSessionId] = useState('example-session-123');
  const [isJobActive, setIsJobActive] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartRenewableJob = () => {
    console.log('🚀 Starting renewable energy analysis...');
    
    // Clear previous messages
    setCompletionMessage(null);
    setErrorMessage(null);
    
    // Enable job status display
    setIsJobActive(true);
    
    // In real implementation, this would call the backend:
    // await sendMessage({
    //   chatSessionId,
    //   newMessage: {
    //     role: 'human',
    //     content: { text: 'Analyze wind farm at coordinates 40.7128, -74.0060' }
    //   }
    // });
    
    // The backend would:
    // 1. Create a job record in DynamoDB
    // 2. Invoke orchestrator with InvocationType: 'Event' (async)
    // 3. Return immediately with job ID
    // 4. Orchestrator processes in background
    // 5. Results written to ChatMessage table
    // 6. Polling hook detects new message
    // 7. UI auto-updates
  };

  const handleJobComplete = (message: any) => {
    console.log('✅ Job complete!', message);
    setCompletionMessage('Analysis complete! Results are now displayed in the chat.');
    setIsJobActive(false);
  };

  const handleJobError = (error: Error) => {
    console.error('❌ Job error:', error);
    setErrorMessage(error.message);
    setIsJobActive(false);
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Example integration of async renewable job processing with UI"
        >
          Renewable Job Status Integration
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Box>
          <SpaceBetween size="m">
            <Button
              variant="primary"
              onClick={handleStartRenewableJob}
              disabled={isJobActive}
            >
              {isJobActive ? 'Analysis in Progress...' : 'Start Renewable Energy Analysis'}
            </Button>

            {completionMessage && (
              <Alert type="success" dismissible onDismiss={() => setCompletionMessage(null)}>
                {completionMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert type="error" dismissible onDismiss={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}
          </SpaceBetween>
        </Box>

        {/* Processing Status Display */}
        <RenewableJobStatusDisplay
          chatSessionId={chatSessionId}
          enabled={isJobActive}
          onComplete={handleJobComplete}
          onError={handleJobError}
        />

        {/* Integration Instructions */}
        <Container
          header={<Header variant="h3">Integration Instructions</Header>}
        >
          <SpaceBetween size="s">
            <Box variant="h4">1. In your chat interface component:</Box>
            <Box variant="code">
              {`const [isRenewableJobActive, setIsRenewableJobActive] = useState(false);

// When sending a renewable query:
const handleSendMessage = async (message: string) => {
  // Detect if this is a renewable query
  const isRenewableQuery = message.includes('wind farm') || 
                           message.includes('terrain analysis');
  
  if (isRenewableQuery) {
    setIsRenewableJobActive(true);
  }
  
  await sendMessage({ chatSessionId, newMessage });
};`}
            </Box>

            <Box variant="h4">2. Add the status display to your chat UI:</Box>
            <Box variant="code">
              {`<RenewableJobStatusDisplay
  chatSessionId={chatSessionId}
  enabled={isRenewableJobActive}
  onComplete={(message) => {
    setIsRenewableJobActive(false);
    // Message will auto-display via polling
  }}
  onError={(error) => {
    setIsRenewableJobActive(false);
    showErrorNotification(error.message);
  }}
/>`}
            </Box>

            <Box variant="h4">3. The component will:</Box>
            <ul>
              <li>Show "Analyzing..." immediately when job starts</li>
              <li>Display progress indicator with current step</li>
              <li>Poll for results every 3 seconds</li>
              <li>Auto-hide when results arrive</li>
              <li>Handle errors gracefully</li>
            </ul>

            <Box variant="h4">4. Backend requirements:</Box>
            <ul>
              <li>Renewable proxy agent invokes orchestrator with InvocationType: 'Event'</li>
              <li>Orchestrator writes results to ChatMessage table</li>
              <li>IAM permissions for DynamoDB writes configured</li>
            </ul>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Container>
  );
};

export default RenewableJobStatusIntegrationExample;
