/**
 * Orchestrator Diagnostic Panel Component
 * 
 * Provides a UI for running diagnostics on the renewable energy orchestrator.
 * Displays diagnostic results, success/failure status, remediation steps, and CloudWatch log links.
 * 
 * Requirements: 6.1, 6.4
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  Button,
  SpaceBetween,
  Table,
  Box,
  StatusIndicator,
  Alert,
  ExpandableSection,
  Link,
  Badge,
  ColumnLayout,
  Spinner,
} from '@cloudscape-design/components';

interface DiagnosticResult {
  step: string;
  success: boolean;
  details: any;
  error?: string;
  duration?: number;
  timestamp?: number;
  recommendations?: string[];
}

interface DiagnosticResponse {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'error';
  timestamp: string;
  region: string;
  diagnosticType: 'quick' | 'full';
  results: DiagnosticResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    totalDuration: number;
  };
  cloudWatchLinks: Record<string, string>;
  recommendations: string[];
  nextSteps: string[];
  error?: string;
  message?: string;
}

interface OrchestratorDiagnosticPanelProps {
  /** Whether to show the panel in a compact mode */
  compact?: boolean;
  /** Callback when diagnostics complete */
  onDiagnosticsComplete?: (response: DiagnosticResponse) => void;
}

export const OrchestratorDiagnosticPanel: React.FC<OrchestratorDiagnosticPanelProps> = ({
  compact = false,
  onDiagnosticsComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [diagnosticResponse, setDiagnosticResponse] = useState<DiagnosticResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run full diagnostics
   */
  const runDiagnostics = async (quick: boolean = false) => {
    setLoading(true);
    setError(null);
    setDiagnosticResponse(null);

    try {
      const url = `/api/renewable/diagnostics${quick ? '?quick=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok && response.status === 401) {
        setError('Authentication required. Please sign in to run diagnostics.');
        return;
      }

      setDiagnosticResponse(data);
      
      if (onDiagnosticsComplete) {
        onDiagnosticsComplete(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to run diagnostics: ${errorMessage}`);
      console.error('Diagnostics error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status indicator for overall health
   */
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'healthy':
        return <StatusIndicator type="success">Healthy</StatusIndicator>;
      case 'degraded':
        return <StatusIndicator type="warning">Degraded</StatusIndicator>;
      case 'unhealthy':
        return <StatusIndicator type="error">Unhealthy</StatusIndicator>;
      case 'error':
        return <StatusIndicator type="error">Error</StatusIndicator>;
      default:
        return <StatusIndicator type="info">Unknown</StatusIndicator>;
    }
  };

  /**
   * Get status indicator for individual diagnostic result
   */
  const getResultStatusIndicator = (success: boolean) => {
    return success ? (
      <StatusIndicator type="success">Passed</StatusIndicator>
    ) : (
      <StatusIndicator type="error">Failed</StatusIndicator>
    );
  };

  /**
   * Format duration in milliseconds
   */
  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  /**
   * Render diagnostic results table
   */
  const renderResultsTable = () => {
    if (!diagnosticResponse?.results) return null;

    return (
      <Table
        columnDefinitions={[
          {
            id: 'status',
            header: 'Status',
            cell: (item: DiagnosticResult) => getResultStatusIndicator(item.success),
            width: 100,
          },
          {
            id: 'step',
            header: 'Diagnostic Check',
            cell: (item: DiagnosticResult) => item.step,
          },
          {
            id: 'duration',
            header: 'Duration',
            cell: (item: DiagnosticResult) => formatDuration(item.duration),
            width: 100,
          },
          {
            id: 'details',
            header: 'Details',
            cell: (item: DiagnosticResult) => (
              <ExpandableSection headerText="View Details" variant="footer">
                <Box padding={{ vertical: 's' }}>
                  {item.success ? (
                    <Box color="text-status-success">
                      {typeof item.details === 'string' 
                        ? item.details 
                        : JSON.stringify(item.details, null, 2)}
                    </Box>
                  ) : (
                    <SpaceBetween size="s">
                      <Box color="text-status-error">
                        <strong>Error:</strong> {item.error || 'Unknown error'}
                      </Box>
                      {item.recommendations && item.recommendations.length > 0 && (
                        <Box>
                          <strong>Recommendations:</strong>
                          <ul>
                            {item.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </SpaceBetween>
                  )}
                </Box>
              </ExpandableSection>
            ),
          },
        ]}
        items={diagnosticResponse.results}
        loadingText="Loading diagnostic results"
        empty={
          <Box textAlign="center" color="inherit">
            <b>No diagnostic results</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              Run diagnostics to see results.
            </Box>
          </Box>
        }
      />
    );
  };

  /**
   * Render CloudWatch log links
   */
  const renderCloudWatchLinks = () => {
    if (!diagnosticResponse?.cloudWatchLinks) return null;

    const links = Object.entries(diagnosticResponse.cloudWatchLinks);
    if (links.length === 0) return null;

    return (
      <ExpandableSection headerText="CloudWatch Log Links" variant="container">
        <SpaceBetween size="s">
          {links.map(([name, url]) => (
            <Box key={name}>
              <Link external href={url} target="_blank">
                {name.charAt(0).toUpperCase() + name.slice(1)} Logs
              </Link>
            </Box>
          ))}
        </SpaceBetween>
      </ExpandableSection>
    );
  };

  /**
   * Render recommendations
   */
  const renderRecommendations = () => {
    if (!diagnosticResponse?.recommendations || diagnosticResponse.recommendations.length === 0) {
      return null;
    }

    return (
      <Alert type="warning" header="Recommendations">
        <SpaceBetween size="xs">
          {diagnosticResponse.recommendations.map((rec, idx) => (
            <Box key={idx}>• {rec}</Box>
          ))}
        </SpaceBetween>
      </Alert>
    );
  };

  /**
   * Render next steps
   */
  const renderNextSteps = () => {
    if (!diagnosticResponse?.nextSteps || diagnosticResponse.nextSteps.length === 0) {
      return null;
    }

    const alertType = diagnosticResponse.status === 'healthy' ? 'success' : 'info';

    return (
      <Alert type={alertType} header="Next Steps">
        <SpaceBetween size="xs">
          {diagnosticResponse.nextSteps.map((step, idx) => (
            <Box key={idx}>{step}</Box>
          ))}
        </SpaceBetween>
      </Alert>
    );
  };

  /**
   * Render summary statistics
   */
  const renderSummary = () => {
    if (!diagnosticResponse?.summary) return null;

    const { summary } = diagnosticResponse;

    return (
      <ColumnLayout columns={4} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Total Checks</Box>
          <Box variant="awsui-value-large">{summary.total}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Passed</Box>
          <Box variant="awsui-value-large" color="text-status-success">
            {summary.passed}
          </Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Failed</Box>
          <Box variant="awsui-value-large" color="text-status-error">
            {summary.failed}
          </Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Total Duration</Box>
          <Box variant="awsui-value-large">{formatDuration(summary.totalDuration)}</Box>
        </div>
      </ColumnLayout>
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Run diagnostics to verify the renewable energy orchestrator is deployed and functioning correctly"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => runDiagnostics(true)}
                disabled={loading}
                iconName="refresh"
              >
                Quick Check
              </Button>
              <Button
                onClick={() => runDiagnostics(false)}
                disabled={loading}
                variant="primary"
                iconName="status-positive"
              >
                Run Full Diagnostics
              </Button>
            </SpaceBetween>
          }
        >
          Orchestrator Diagnostics
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Loading State */}
        {loading && (
          <Box textAlign="center" padding={{ vertical: 'l' }}>
            <Spinner size="large" />
            <Box variant="p" padding={{ top: 's' }}>
              Running diagnostics...
            </Box>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert type="error" header="Diagnostic Error">
            {error}
          </Alert>
        )}

        {/* Results */}
        {diagnosticResponse && !loading && (
          <SpaceBetween size="l">
            {/* Overall Status */}
            <Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Box variant="awsui-key-label">Overall Status:</Box>
                {getStatusIndicator(diagnosticResponse.status)}
                <Badge color={diagnosticResponse.diagnosticType === 'full' ? 'blue' : 'grey'}>
                  {diagnosticResponse.diagnosticType === 'full' ? 'Full Diagnostics' : 'Quick Check'}
                </Badge>
                <Box variant="small" color="text-body-secondary">
                  {new Date(diagnosticResponse.timestamp).toLocaleString()}
                </Box>
              </SpaceBetween>
            </Box>

            {/* Summary Statistics */}
            {renderSummary()}

            {/* Recommendations */}
            {renderRecommendations()}

            {/* Next Steps */}
            {renderNextSteps()}

            {/* Diagnostic Results Table */}
            {renderResultsTable()}

            {/* CloudWatch Links */}
            {renderCloudWatchLinks()}
          </SpaceBetween>
        )}

        {/* Initial State */}
        {!diagnosticResponse && !loading && !error && (
          <Box textAlign="center" padding={{ vertical: 'l' }}>
            <Box variant="p" color="text-body-secondary">
              Click "Run Full Diagnostics" to check the orchestrator health
            </Box>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default OrchestratorDiagnosticPanel;
