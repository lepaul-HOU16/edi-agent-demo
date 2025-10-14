/**
 * VisualizationErrorBoundary - Error boundary for renewable energy visualizations
 * 
 * Provides graceful error recovery and fallback content when visualizations fail to render.
 */

import React, { Component, ReactNode } from 'react';
import { Box, Button, Alert } from '@cloudscape-design/components';

interface VisualizationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  title?: string;
  description?: string;
}

interface VisualizationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class VisualizationErrorBoundary extends Component<
  VisualizationErrorBoundaryProps,
  VisualizationErrorBoundaryState
> {
  constructor(props: VisualizationErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<VisualizationErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Visualization error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `Visualization Error: ${error.message}`,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return (
          <div>
            {this.props.fallback}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button
                variant="normal"
                size="small"
                onClick={this.handleRetry}
              >
                Retry Visualization
              </Button>
            </div>
          </div>
        );
      }

      // Default error display
      return (
        <Alert
          statusIconAriaLabel="Error"
          type="error"
          header={this.props.title || "Visualization Error"}
          action={
            <Button
              onClick={this.handleRetry}
              variant="primary"
              size="small"
            >
              Retry
            </Button>
          }
        >
          <div>
            <p>
              {this.props.description || 
               "Unable to display visualization content. This may be due to a network issue or data formatting problem."}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}>
                  Technical Details (Development Mode)
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
            
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
              <strong>Troubleshooting:</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                <li>Check your internet connection</li>
                <li>Refresh the page to reload visualizations</li>
                <li>Try again in a few moments</li>
              </ul>
            </div>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping visualizations with error boundary
 */
export const withVisualizationErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<VisualizationErrorBoundaryProps, 'children'>
) => {
  const WithErrorBoundary = (props: P) => (
    <VisualizationErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </VisualizationErrorBoundary>
  );

  WithErrorBoundary.displayName = `withVisualizationErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundary;
};

/**
 * Safe wrapper component for individual visualizations
 */
interface SafeVisualizationWrapperProps {
  children: ReactNode;
  title?: string;
  fallbackMessage?: string;
}

export const SafeVisualizationWrapper: React.FC<SafeVisualizationWrapperProps> = ({
  children,
  title,
  fallbackMessage
}) => (
  <VisualizationErrorBoundary
    title={title}
    description={fallbackMessage}
    fallback={
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px solid #e9ebed',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
      }}>
        <div>📊 Visualization Unavailable</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          {fallbackMessage || 'Unable to load visualization content'}
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
          The visualization may still be generating or there may be a temporary issue
        </div>
      </div>
    }
  >
    {children}
  </VisualizationErrorBoundary>
);

export default VisualizationErrorBoundary;