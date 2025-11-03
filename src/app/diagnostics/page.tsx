'use client';

/**
 * Orchestrator Diagnostics Test Page
 * 
 * This page provides access to the Orchestrator Diagnostic Panel for manual testing.
 * Used for Task 18: Run diagnostic panel tests
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { OrchestratorDiagnosticPanel } from '@/components/renewable/OrchestratorDiagnosticPanel';
import { Authenticator } from '@aws-amplify/ui-react';
import { Container, Header, SpaceBetween, Box, Alert } from '@cloudscape-design/components';

export default function DiagnosticsPage() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          <Container
            header={
              <Header
                variant="h1"
                description="Test page for verifying orchestrator diagnostic functionality"
                actions={
                  <button 
                    onClick={signOut}
                    style={{
                      padding: '8px 16px',
                      background: '#ec7211',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                }
              >
                Orchestrator Diagnostics Test Page
              </Header>
            }
          >
            <SpaceBetween size="l">
              <Alert type="info" header="Test Page Information">
                <SpaceBetween size="xs">
                  <Box>
                    <strong>Logged in as:</strong> {user?.username || 'Unknown'}
                  </Box>
                  <Box>
                    <strong>Purpose:</strong> Manual testing of orchestrator diagnostic panel (Task 18)
                  </Box>
                  <Box>
                    <strong>Requirements:</strong> 6.1, 6.2, 6.3, 6.4, 6.5
                  </Box>
                </SpaceBetween>
              </Alert>

              <Alert type="warning" header="Testing Instructions">
                <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  <li>Click "Run Full Diagnostics" to test with orchestrator deployed</li>
                  <li>Click "Quick Check" to test environment variable validation only</li>
                  <li>Verify all checks pass when orchestrator is deployed</li>
                  <li>Stop sandbox and verify appropriate checks fail</li>
                  <li>Check that remediation steps are displayed for failures</li>
                  <li>Test CloudWatch log links (should open in new tab)</li>
                  <li>Open browser console to see callback logs</li>
                </ol>
              </Alert>

              <OrchestratorDiagnosticPanel 
                onDiagnosticsComplete={(response) => {
                  console.log('=== Diagnostics Complete ===');
                  console.log('Status:', response.status);
                  console.log('Summary:', response.summary);
                  console.log('Results:', response.results);
                  console.log('Recommendations:', response.recommendations);
                  console.log('Next Steps:', response.nextSteps);
                  console.log('CloudWatch Links:', response.cloudWatchLinks);
                  console.log('Full Response:', response);
                }}
              />

              <Alert type="success" header="Test Checklist">
                <Box>
                  <strong>Verify the following:</strong>
                  <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li>✓ Panel renders correctly with all UI elements</li>
                    <li>✓ Quick Check completes in 1-2 seconds</li>
                    <li>✓ Full Diagnostics completes in 5-10 seconds</li>
                    <li>✓ All checks pass when orchestrator is deployed</li>
                    <li>✓ Appropriate checks fail when orchestrator is not deployed</li>
                    <li>✓ Remediation steps are displayed for failures</li>
                    <li>✓ CloudWatch log links are functional</li>
                    <li>✓ Summary statistics are accurate</li>
                    <li>✓ Expandable details work correctly</li>
                    <li>✓ Multiple runs work without issues</li>
                    <li>✓ Callback logs appear in browser console</li>
                    <li>✓ Error handling works for network issues</li>
                  </ul>
                </Box>
              </Alert>

              <Box textAlign="center" padding={{ vertical: 'l' }}>
                <Box variant="small" color="text-body-secondary">
                  For detailed testing instructions, see: <code>tests/manual/orchestrator-diagnostics-ui-test.html</code>
                </Box>
              </Box>
            </SpaceBetween>
          </Container>
        </div>
      )}
    </Authenticator>
  );
}
