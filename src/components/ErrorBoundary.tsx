/**
 * ErrorBoundary Component
 * 
 * Catches React errors in child components and displays a fallback UI.
 * Used to wrap ProjectContext consumers to prevent crashes from context-related errors.
 */

import React, { Component, ReactNode } from 'react';
import { Alert, Box, Button, SpaceBetween } from '@cloudscape-design/components';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('❌ [ErrorBoundary] Caught error:', error);
    console.error('❌ [ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Alert
          type="error"
          header="Something went wrong"
          action={
            <Button onClick={this.handleReset}>
              Try Again
            </Button>
          }
        >
          <SpaceBetween size="s">
            <Box>
              An error occurred while rendering this component. Please try again or refresh the page.
            </Box>
            {this.state.error && (
              <Box variant="code">
                {this.state.error.message}
              </Box>
            )}
          </SpaceBetween>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
