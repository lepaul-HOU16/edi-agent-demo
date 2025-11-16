
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Container } from '@cloudscape-design/components';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and any error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container>
          <Box padding="l">
            <Alert
              statusIconAriaLabel="Error"
              type="error"
              header="Something went wrong"
              action={
                <Button onClick={this.handleReset} variant="primary">
                  Try again
                </Button>
              }
            >
              <Box>
                <p>An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.</p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box margin={{ top: 'm' }}>
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Error Details (Development Only)
                      </summary>
                      <Box margin={{ top: 's' }}>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '1rem', 
                          borderRadius: '4px',
                          overflow: 'auto',
                          fontSize: '0.875rem'
                        }}>
                          <strong>Error:</strong> {this.state.error.message}
                          {'\n\n'}
                          <strong>Stack:</strong> {this.state.error.stack}
                          {this.state.errorInfo && (
                            <>
                              {'\n\n'}
                              <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                            </>
                          )}
                        </pre>
                      </Box>
                    </details>
                  </Box>
                )}
              </Box>
            </Alert>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;