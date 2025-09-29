'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Container, 
  Header, 
  Box, 
  Alert,
  Button,
  SpaceBetween
} from '@cloudscape-design/components';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper
} from '@mui/material';

interface Props {
  children: ReactNode;
  fallbackTableData?: any[];
  searchQuery?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary to protect GeoscientistDashboard from crashes
 * Falls back to simple table view if dashboard fails
 */
class GeoscientistDashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to render fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('GeoscientistDashboard Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI - Simple table with error message
      return (
        <Container
          header={
            <Header
              variant="h2"
              description="Displaying fallback table view due to dashboard error"
              actions={
                <Button 
                  variant="primary" 
                  iconName="refresh"
                  onClick={this.handleRetry}
                >
                  Retry Dashboard
                </Button>
              }
            >
              🔧 Well Data - Safe Mode
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="m">
            
            {/* Error Alert */}
            <Alert
              type="warning"
              header="Dashboard Error Detected"
              action={
                <Button variant="primary" onClick={this.handleRetry}>
                  Try Again
                </Button>
              }
            >
              The professional dashboard encountered an error. Displaying simplified table view to ensure data accessibility.
              Error: {this.state.error?.message || 'Unknown error'}
            </Alert>

            {/* Fallback Table */}
            {this.props.fallbackTableData && (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <TableContainer component={Paper} style={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Well Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Location</strong></TableCell>
                        <TableCell><strong>Depth</strong></TableCell>
                        <TableCell><strong>Operator</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {this.props.fallbackTableData.map((item, index) => (
                        <TableRow 
                          key={item.name || `row-${index}`}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                            '&:hover': { backgroundColor: '#f0f0f0' }
                          }}
                        >
                          <TableCell>
                            <strong style={{ color: '#1976d2' }}>
                              {item.name || item.Name || `Well-${index + 1}`}
                            </strong>
                          </TableCell>
                          <TableCell>{item.type || item.Type || 'Unknown'}</TableCell>
                          <TableCell>{item.location || item.Location || 'Unknown'}</TableCell>
                          <TableCell>{item.depth || item.Depth || 'Unknown'}</TableCell>
                          <TableCell>{item.operator || item.Operator || 'Unknown'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box variant="small" color="text-body-secondary" padding={{ top: 'm' }}>
                  💡 Fallback table showing {this.props.fallbackTableData.length} wells. 
                  Query: "{this.props.searchQuery || 'Unknown query'}"
                </Box>
              </div>
            )}

            {/* Error Details (Expandable) */}
            <details style={{ marginTop: '16px' }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '14px', 
                color: '#666',
                userSelect: 'none'
              }}>
                🔧 Technical Error Details (Click to expand)
              </summary>
              <div style={{ 
                marginTop: '8px', 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <strong>Error:</strong> {this.state.error?.message}<br/>
                <strong>Stack:</strong><br/>
                <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <strong>Component Stack:</strong><br/>
                    <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>

          </SpaceBetween>
        </Container>
      );
    }

    // Normal rendering - pass through to children
    return this.props.children;
  }
}

export default GeoscientistDashboardErrorBoundary;
