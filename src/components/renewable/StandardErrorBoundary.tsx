/**
 * StandardErrorBoundary - Comprehensive error boundary for renewable energy components
 * 
 * Provides consistent error handling, recovery mechanisms, and user feedback
 * across all renewable energy visualizations and components.
 */

import React, { Component, ReactNode } from 'react';
import { Box, Button, Alert, SpaceBetween, Container, Header } from '@cloudscape-design/components';
import { useRenewableErrorHandler, type FormattedError } from '@/utils/renewable/ErrorHandlingUtils';

interface StandardErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showTechnicalDetails?: boolean;
  maxRetries?: number;
  enableAutoRetry?: boolean;
  autoRetryDelay?: number;
}

interface StandardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  formattedError?: FormattedError;
  retryCount: number;
  isRetrying: boolean;
  autoRetryTimeoutId?: NodeJS.Timeout;
}

export class StandardErrorBoundary extends Component<
  StandardErrorBoundaryProps,
  StandardErrorBoundaryState
> {
  private errorHandler = useRenewableErrorHandler(this.props.componentName);

  constructor(props: StandardErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<StandardErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const formattedError = this.errorHandler.handleError(error, 'componentDidCatch');
    
    this.setState({
      error,
      errorInfo,
      formattedError
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Auto-retry if enabled and within retry limit
    if (this.props.enableAutoRetry && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.state.autoRetryTimeoutId) {
      clearTimeout(this.state.autoRetryTimeoutId);
    }
  }

  scheduleAutoRetry = () => {
    const delay = this.props.autoRetryDelay || 3000;
    const timeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);

    this.setState({ autoRetryTimeoutId: timeoutId });
  };

  handleRetry = async () => {
    if (this.state.retryCount >= (this.props.maxRetries || 3)) {
      return;
    }

    this.setState({ isRetrying: true });

    // Clear any pending auto-retry
    if (this.state.autoRetryTimeoutId) {
      clearTimeout(this.state.autoRetryTimeoutId);
    }

    // Call optional retry handler
    if (this.props.onRetry) {
      try {
        await this.props.onRetry();
      } catch (retryError) {
        console.error('Retry handler failed:', retryError);
      }
    }

    // Reset error state
    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        formattedError: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        autoRetryTimeoutId: undefined
      }));
    }, 500);
  };

  handleReportError = () => {
    if (this.state.formattedError) {
      const reportData = {
        component: this.props.componentName,
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        errorCode: this.state.formattedError.code,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Copy error report to clipboard
      navigator.clipboard.writeText(JSON.stringify(reportData, null, 2)).then(() => {
        alert('Error report copied to clipboard. Please share this with support.');
      }).catch(() => {
        console.error('Failed to copy error report');
      });
    }
  };

  renderErrorContent() {
    const { formattedError } = this.state;
    const { title, description, showTechnicalDetails = false } = this.props;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = this.state.retryCount < maxRetries;

    return (
      <Container>
        <Alert
          statusIconAriaLabel="Error"
          type="error"
          header={title || formattedError?.message || "Component Error"}
          action={
            <SpaceBetween direction="horizontal" size="xs">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  size="small"
                  loading={this.state.isRetrying}
                  disabled={this.state.isRetrying}
                >
                  {this.state.isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}
              <Button
                onClick={this.handleReportError}
                variant="normal"
                size="small"
              >
                Report Error
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="vertical" size="s">
            <div>
              <p>
                {description || formattedError?.message || 
                 "An unexpected error occurred while loading this component."}
              </p>
              
              {formattedError?.severity === 'critical' && (
                <Box variant="p" color="text-status-error">
                  <strong>Critical Error:</strong> This component requires immediate attention.
                </Box>
              )}
            </div>

            {formattedError?.suggestions && formattedError.suggestions.length > 0 && (
              <div>
                <strong>Suggestions:</strong>
                <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                  {formattedError.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {!canRetry && (
              <Box variant="p" color="text-status-warning">
                Maximum retry attempts reached. Please refresh the page or contact support.
              </Box>
            )}

            {this.state.retryCount > 0 && (
              <Box variant="small" color="text-body-secondary">
                Retry attempts: {this.state.retryCount} / {maxRetries}
              </Box>
            )}

            {formattedError?.code && (
              <Box variant="small" color="text-body-secondary">
                Error Code: {formattedError.code}
              </Box>
            )}

            {(showTechnicalDetails || process.env.NODE_ENV === 'development') && 
             this.state.error && (
              <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}>
                  Technical Details {process.env.NODE_ENV === 'development' ? '(Development Mode)' : ''}
                </summary>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      <br /><br />
                      <strong>Stack Trace:</strong>
                      <br />
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br /><br />
                      <strong>Component Stack:</strong>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}
          </SpaceBetween>
        </Alert>
      </Container>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return (
          <div>
            {this.props.fallback}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="normal"
                  size="small"
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= (this.props.maxRetries || 3)}
                >
                  Retry
                </Button>
                <Button
                  variant="normal"
                  size="small"
                  onClick={this.handleReportError}
                >
                  Report Error
                </Button>
              </SpaceBetween>
            </div>
          </div>
        );
      }

      // Default error display
      return this.renderErrorContent();
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with standard error boundary
 */
export const withStandardErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  errorBoundaryProps?: Omit<StandardErrorBoundaryProps, 'children' | 'componentName'>
) => {
  const WithErrorBoundary = (props: P) => (
    <StandardErrorBoundary 
      componentName={componentName}
      {...errorBoundaryProps}
    >
      <WrappedComponent {...props} />
    </StandardErrorBoundary>
  );

  WithErrorBoundary.displayName = `withStandardErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundary;
};

/**
 * Specialized error boundaries for different component types
 */

// Visualization Error Boundary
export const VisualizationErrorBoundary: React.FC<{
  children: ReactNode;
  visualizationType: string;
  onRetry?: () => void;
}> = ({ children, visualizationType, onRetry }) => (
  <StandardErrorBoundary
    componentName={`${visualizationType}Visualization`}
    title={`${visualizationType} Visualization Error`}
    description={`Unable to display the ${visualizationType.toLowerCase()} visualization. This may be due to data processing issues or network connectivity.`}
    onRetry={onRetry}
    enableAutoRetry={true}
    maxRetries={2}
    showTechnicalDetails={false}
  >
    {children}
  </StandardErrorBoundary>
);

// Analysis Error Boundary
export const AnalysisErrorBoundary: React.FC<{
  children: ReactNode;
  analysisType: string;
  onRetry?: () => void;
}> = ({ children, analysisType, onRetry }) => (
  <StandardErrorBoundary
    componentName={`${analysisType}Analysis`}
    title={`${analysisType} Analysis Error`}
    description={`Failed to perform ${analysisType.toLowerCase()} analysis. Please check your data and try again.`}
    onRetry={onRetry}
    enableAutoRetry={false}
    maxRetries={3}
    showTechnicalDetails={true}
  >
    {children}
  </StandardErrorBoundary>
);

// Workflow Error Boundary
export const WorkflowErrorBoundary: React.FC<{
  children: ReactNode;
  workflowStep: string;
  onRetry?: () => void;
}> = ({ children, workflowStep, onRetry }) => (
  <StandardErrorBoundary
    componentName={`${workflowStep}WorkflowStep`}
    title={`Workflow Step Error`}
    description={`An error occurred in the ${workflowStep} workflow step. You can retry this step or continue with the next step.`}
    onRetry={onRetry}
    enableAutoRetry={false}
    maxRetries={2}
    showTechnicalDetails={false}
  >
    {children}
  </StandardErrorBoundary>
);

export default StandardErrorBoundary;