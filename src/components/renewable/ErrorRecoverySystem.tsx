/**
 * ErrorRecoverySystem - Comprehensive error recovery and user guidance system
 * 
 * Provides intelligent error recovery, user guidance, and fallback mechanisms
 * for renewable energy components when errors occur.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Header, 
  SpaceBetween, 
  Alert,
  Modal,
  Textarea,
  FormField,
  Select,
  StatusIndicator,
  ProgressBar
} from '@cloudscape-design/components';
import { useRenewableErrorHandler, type FormattedError } from '@/utils/renewable/ErrorHandlingUtils';

interface ErrorRecoverySystemProps {
  error: Error | FormattedError;
  componentName: string;
  onRetry?: () => Promise<void>;
  onFallback?: () => void;
  onReportError?: (report: ErrorReport) => void;
  recoveryStrategies?: RecoveryStrategy[];
  showModal?: boolean;
  onClose?: () => void;
}

interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  severity: 'low' | 'medium' | 'high';
  estimatedTime?: string;
}

interface ErrorReport {
  errorCode: string;
  description: string;
  reproductionSteps: string;
  userEmail?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  includeSystemInfo: boolean;
}

/**
 * Main error recovery system component
 */
export const ErrorRecoverySystem: React.FC<ErrorRecoverySystemProps> = ({
  error,
  componentName,
  onRetry,
  onFallback,
  onReportError,
  recoveryStrategies = [],
  showModal = false,
  onClose
}) => {
  const errorHandler = useRenewableErrorHandler(componentName);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<Partial<ErrorReport>>({
    severity: 'medium',
    includeSystemInfo: true
  });

  const formattedError = error instanceof Error 
    ? errorHandler.formatError(error)
    : error as FormattedError;

  // Default recovery strategies
  const defaultStrategies: RecoveryStrategy[] = [
    {
      id: 'retry',
      name: 'Retry Operation',
      description: 'Attempt to retry the failed operation',
      action: async () => {
        if (onRetry) {
          await onRetry();
        }
      },
      severity: 'low',
      estimatedTime: '< 1 minute'
    },
    {
      id: 'refresh',
      name: 'Refresh Component',
      description: 'Refresh the component and reload data',
      action: async () => {
        window.location.reload();
      },
      severity: 'medium',
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'fallback',
      name: 'Use Fallback Mode',
      description: 'Switch to a simplified version of the component',
      action: async () => {
        if (onFallback) {
          onFallback();
        }
      },
      severity: 'low',
      estimatedTime: 'Immediate'
    }
  ];

  const allStrategies = [...defaultStrategies, ...recoveryStrategies];

  const handleRecovery = useCallback(async (strategyId: string) => {
    const strategy = allStrategies.find(s => s.id === strategyId);
    if (!strategy) return;

    setIsRecovering(true);
    setRecoveryProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setRecoveryProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await strategy.action();
      
      clearInterval(progressInterval);
      setRecoveryProgress(100);
      
      // Close modal after successful recovery
      setTimeout(() => {
        setIsRecovering(false);
        setRecoveryProgress(0);
        onClose?.();
      }, 1000);

    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      setIsRecovering(false);
      setRecoveryProgress(0);
      
      // Show additional error handling
      alert('Recovery attempt failed. Please try a different strategy or contact support.');
    }
  }, [allStrategies, onClose]);

  const handleReportError = useCallback(() => {
    const report: ErrorReport = {
      errorCode: formattedError.code,
      description: reportData.description || '',
      reproductionSteps: reportData.reproductionSteps || '',
      userEmail: reportData.userEmail,
      severity: reportData.severity || 'medium',
      includeSystemInfo: reportData.includeSystemInfo || false
    };

    onReportError?.(report);
    setShowReportModal(false);
    
    // Show confirmation
    alert('Error report submitted successfully. Thank you for helping us improve the system.');
  }, [formattedError, reportData, onReportError]);

  const renderRecoveryContent = () => (
    <SpaceBetween direction="vertical" size="m">
      <Alert
        statusIconAriaLabel="Error"
        type="error"
        header={`${componentName} Error`}
      >
        <SpaceBetween direction="vertical" size="s">
          <div>{formattedError.message}</div>
          
          {formattedError.code && (
            <Box variant="small" color="text-body-secondary">
              Error Code: {formattedError.code}
            </Box>
          )}
          
          <StatusIndicator type={
            formattedError.severity === 'critical' ? 'error' :
            formattedError.severity === 'high' ? 'warning' :
            formattedError.severity === 'medium' ? 'info' : 'success'
          }>
            Severity: {formattedError.severity}
          </StatusIndicator>
        </SpaceBetween>
      </Alert>

      {formattedError.suggestions && formattedError.suggestions.length > 0 && (
        <Box>
          <Header variant="h4">Suggested Solutions</Header>
          <ul>
            {formattedError.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </Box>
      )}

      <Box>
        <Header variant="h4">Recovery Options</Header>
        <SpaceBetween direction="vertical" size="s">
          {allStrategies.map(strategy => (
            <Box key={strategy.id} padding="s" variant="div">
              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                <div style={{ flex: 1 }}>
                  <div><strong>{strategy.name}</strong></div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {strategy.description}
                  </div>
                  {strategy.estimatedTime && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Estimated time: {strategy.estimatedTime}
                    </div>
                  )}
                </div>
                <Button
                  variant={strategy.severity === 'low' ? 'primary' : 'normal'}
                  size="small"
                  onClick={() => handleRecovery(strategy.id)}
                  disabled={isRecovering}
                >
                  {strategy.name}
                </Button>
              </SpaceBetween>
            </Box>
          ))}
        </SpaceBetween>
      </Box>

      {isRecovering && (
        <Box>
          <Header variant="h4">Recovery in Progress</Header>
          <ProgressBar
            value={recoveryProgress}
            label="Recovery progress"
            description="Please wait while we attempt to recover from the error..."
          />
        </Box>
      )}

      <Box>
        <SpaceBetween direction="horizontal" size="s">
          <Button
            variant="normal"
            iconName="contact"
            onClick={() => setShowReportModal(true)}
          >
            Report Error
          </Button>
          <Button
            variant="normal"
            iconName="copy"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                error: formattedError,
                component: componentName,
                timestamp: new Date().toISOString()
              }, null, 2));
              alert('Error details copied to clipboard');
            }}
          >
            Copy Error Details
          </Button>
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      onDismiss={() => setShowReportModal(false)}
      header="Report Error"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => setShowReportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReportError}
              disabled={!reportData.description}
            >
              Submit Report
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="m">
        <FormField
          label="Error Description"
          description="Please describe what you were trying to do when the error occurred"
        >
          <Textarea
            value={reportData.description || ''}
            onChange={({ detail }) => 
              setReportData(prev => ({ ...prev, description: detail.value }))
            }
            placeholder="Describe the error and what you were doing..."
            rows={4}
          />
        </FormField>

        <FormField
          label="Steps to Reproduce"
          description="If possible, describe the steps that led to this error"
        >
          <Textarea
            value={reportData.reproductionSteps || ''}
            onChange={({ detail }) => 
              setReportData(prev => ({ ...prev, reproductionSteps: detail.value }))
            }
            placeholder="1. First I did...\n2. Then I clicked...\n3. The error occurred when..."
            rows={4}
          />
        </FormField>

        <FormField label="Severity">
          <Select
            selectedOption={{ label: reportData.severity, value: reportData.severity }}
            onChange={({ detail }) => 
              setReportData(prev => ({ ...prev, severity: detail.selectedOption.value as any }))
            }
            options={[
              { label: 'Low - Minor inconvenience', value: 'low' },
              { label: 'Medium - Affects functionality', value: 'medium' },
              { label: 'High - Blocks important tasks', value: 'high' },
              { label: 'Critical - System unusable', value: 'critical' }
            ]}
          />
        </FormField>

        <FormField
          label="Contact Email (Optional)"
          description="Provide your email if you'd like updates on this issue"
        >
          <input
            type="email"
            value={reportData.userEmail || ''}
            onChange={(e) => 
              setReportData(prev => ({ ...prev, userEmail: e.target.value }))
            }
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );

  if (showModal) {
    return (
      <>
        <Modal
          visible={true}
          onDismiss={onClose}
          header="Error Recovery"
          size="large"
        >
          {renderRecoveryContent()}
        </Modal>
        {renderReportModal()}
      </>
    );
  }

  return (
    <Container>
      {renderRecoveryContent()}
      {renderReportModal()}
    </Container>
  );
};

/**
 * Hook for using the error recovery system
 */
export const useErrorRecovery = (componentName: string) => {
  const [error, setError] = useState<Error | FormattedError | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  const handleError = useCallback((error: Error | FormattedError) => {
    setError(error);
    setShowRecovery(true);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setShowRecovery(false);
  }, []);

  const RecoveryComponent = useCallback((props: Omit<ErrorRecoverySystemProps, 'error' | 'componentName' | 'showModal' | 'onClose'>) => {
    if (!error) return null;

    return (
      <ErrorRecoverySystem
        error={error}
        componentName={componentName}
        showModal={showRecovery}
        onClose={clearError}
        {...props}
      />
    );
  }, [error, componentName, showRecovery, clearError]);

  return {
    error,
    showRecovery,
    handleError,
    clearError,
    RecoveryComponent
  };
};

export default ErrorRecoverySystem;