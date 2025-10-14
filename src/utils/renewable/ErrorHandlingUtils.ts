/**
 * Standardized error handling utilities for renewable energy components
 * Provides consistent error logging, formatting, and recovery patterns
 */

export interface ErrorContext {
  component: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface FormattedError {
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions: string[];
  technicalDetails?: string;
}

export class RenewableErrorHandler {
  private static instance: RenewableErrorHandler;

  public static getInstance(): RenewableErrorHandler {
    if (!RenewableErrorHandler.instance) {
      RenewableErrorHandler.instance = new RenewableErrorHandler();
    }
    return RenewableErrorHandler.instance;
  }

  /**
   * Standardized error logging with context
   */
  public logError(error: Error | unknown, context: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logContext = {
      ...context,
      timestamp: context.timestamp || new Date(),
      stack: error instanceof Error ? error.stack : undefined
    };

    console.error(`[${context.component}] ${errorMessage}`, logContext);

    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error, logContext);
    }
  }

  /**
   * Format error for user display
   */
  public formatForUser(error: Error | unknown, context: ErrorContext): FormattedError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Categorize error type
    const errorType = this.categorizeError(errorMessage);
    
    return {
      message: this.getUserFriendlyMessage(errorMessage, errorType),
      code: this.generateErrorCode(context.component, errorType),
      severity: this.determineSeverity(errorType),
      recoverable: this.isRecoverable(errorType),
      suggestions: this.getSuggestions(errorType, context),
      technicalDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    };
  }

  /**
   * Handle error with automatic logging and formatting
   */
  public handleError(error: Error | unknown, context: ErrorContext): FormattedError {
    this.logError(error, context);
    return this.formatForUser(error, context);
  }

  private categorizeError(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) return 'NETWORK_ERROR';
    if (lowerMessage.includes('export') || lowerMessage.includes('download')) return 'EXPORT_ERROR';
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) return 'VALIDATION_ERROR';
    if (lowerMessage.includes('deployment') || lowerMessage.includes('service')) return 'SERVICE_ERROR';
    if (lowerMessage.includes('visualization') || lowerMessage.includes('chart')) return 'VISUALIZATION_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private getUserFriendlyMessage(message: string, errorType: string): string {
    const friendlyMessages: Record<string, string> = {
      NETWORK_ERROR: 'Unable to connect to the service. Please check your internet connection and try again.',
      EXPORT_ERROR: 'Failed to export data. Please try again or contact support if the issue persists.',
      VALIDATION_ERROR: 'The provided data is invalid. Please check your inputs and try again.',
      SERVICE_ERROR: 'The service is temporarily unavailable. Please try again in a few moments.',
      VISUALIZATION_ERROR: 'Unable to generate visualization. Please refresh the page and try again.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again or contact support.'
    };

    return friendlyMessages[errorType] || friendlyMessages.UNKNOWN_ERROR;
  }

  private generateErrorCode(component: string, errorType: string): string {
    const timestamp = Date.now().toString(36);
    return `${component.toUpperCase()}_${errorType}_${timestamp}`;
  }

  private determineSeverity(errorType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      NETWORK_ERROR: 'medium',
      EXPORT_ERROR: 'low',
      VALIDATION_ERROR: 'medium',
      SERVICE_ERROR: 'high',
      VISUALIZATION_ERROR: 'medium',
      UNKNOWN_ERROR: 'medium'
    };

    return severityMap[errorType] || 'medium';
  }

  private isRecoverable(errorType: string): boolean {
    const recoverableErrors = ['NETWORK_ERROR', 'EXPORT_ERROR', 'VISUALIZATION_ERROR'];
    return recoverableErrors.includes(errorType);
  }

  private getSuggestions(errorType: string, context: ErrorContext): string[] {
    const suggestions: Record<string, string[]> = {
      NETWORK_ERROR: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact your network administrator if the issue persists'
      ],
      EXPORT_ERROR: [
        'Try a different export format',
        'Ensure you have sufficient storage space',
        'Try exporting a smaller dataset'
      ],
      VALIDATION_ERROR: [
        'Check that all required fields are filled',
        'Verify data formats are correct',
        'Review the input requirements'
      ],
      SERVICE_ERROR: [
        'Wait a few moments and try again',
        'Check the service status page',
        'Contact support if the issue persists'
      ],
      VISUALIZATION_ERROR: [
        'Refresh the page and try again',
        'Try with a smaller dataset',
        'Check that your browser supports the required features'
      ],
      UNKNOWN_ERROR: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support with the error code'
      ]
    };

    return suggestions[errorType] || suggestions.UNKNOWN_ERROR;
  }

  private sendToMonitoring(error: Error | unknown, context: any): void {
    // Implementation would send to monitoring service like CloudWatch, Sentry, etc.
    // For now, just log that it would be sent
    console.log('Would send to monitoring:', { error, context });
  }
}

/**
 * Convenience function for quick error handling
 */
export const handleRenewableError = (
  error: Error | unknown, 
  component: string, 
  action?: string
): FormattedError => {
  return RenewableErrorHandler.getInstance().handleError(error, {
    component,
    action,
    timestamp: new Date()
  });
};

/**
 * Hook for consistent error handling in components
 */
export const useRenewableErrorHandler = (componentName: string) => {
  const errorHandler = RenewableErrorHandler.getInstance();

  return {
    handleError: (error: Error | unknown, action?: string) => 
      errorHandler.handleError(error, { component: componentName, action }),
    logError: (error: Error | unknown, action?: string) => 
      errorHandler.logError(error, { component: componentName, action }),
    formatError: (error: Error | unknown, action?: string) => 
      errorHandler.formatForUser(error, { component: componentName, action })
  };
};