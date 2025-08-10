/**
 * Error Message Formatter
 * 
 * Utility for formatting error messages for display in the UI with
 * user-friendly messages and actionable suggestions.
 */

import { LegalTagError } from './legalTagErrorHandler';

export interface FormattedErrorMessage {
  title: string;
  message: string;
  suggestions: string[];
  severity: 'error' | 'warning' | 'info';
  canRetry: boolean;
  retryDelay?: number;
  showTechnicalDetails: boolean;
  technicalDetails?: string;
}

export class ErrorMessageFormatter {
  /**
   * Format a legal tag error for UI display
   */
  formatLegalTagError(error: LegalTagError): FormattedErrorMessage {
    const baseMessage: FormattedErrorMessage = {
      title: this.getErrorTitle(error.errorType, error.operation),
      message: error.userMessage,
      suggestions: error.suggestions,
      severity: this.getErrorSeverity(error.errorType),
      canRetry: error.canRetry,
      retryDelay: error.retryDelay,
      showTechnicalDetails: this.shouldShowTechnicalDetails(error.errorType),
      technicalDetails: this.formatTechnicalDetails(error)
    };

    return baseMessage;
  }

  /**
   * Format a generic error for UI display
   */
  formatGenericError(error: any, operation: string = 'operation'): FormattedErrorMessage {
    // Check if it's already a legal tag error
    if (error.legalTagError) {
      return this.formatLegalTagError(error.legalTagError);
    }

    // Handle different error types
    if (error.message) {
      return this.formatErrorMessage(error.message, operation, error);
    }

    if (typeof error === 'string') {
      return this.formatErrorMessage(error, operation);
    }

    // Default error formatting
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      suggestions: [
        'Try refreshing the page',
        'Check your network connection',
        'Contact support if the issue persists'
      ],
      severity: 'error',
      canRetry: true,
      showTechnicalDetails: false
    };
  }

  /**
   * Format error message string
   */
  private formatErrorMessage(message: string, operation: string, originalError?: any): FormattedErrorMessage {
    // Network errors
    if (this.isNetworkError(message)) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the service. Please check your network connection.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ],
        severity: 'error',
        canRetry: true,
        retryDelay: 5000,
        showTechnicalDetails: false,
        technicalDetails: message
      };
    }

    // Authentication errors
    if (this.isAuthError(message)) {
      return {
        title: 'Authentication Required',
        message: 'You need to log in to perform this action.',
        suggestions: [
          'Please log in with your credentials',
          'Check if your session has expired',
          'Contact your administrator if you need access'
        ],
        severity: 'warning',
        canRetry: false,
        showTechnicalDetails: false,
        technicalDetails: message
      };
    }

    // Server errors
    if (this.isServerError(message)) {
      return {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        suggestions: [
          'Try again in a few minutes',
          'Check service status',
          'Contact support if the issue persists'
        ],
        severity: 'error',
        canRetry: true,
        retryDelay: 10000,
        showTechnicalDetails: false,
        technicalDetails: message
      };
    }

    // Validation errors
    if (this.isValidationError(message)) {
      return {
        title: 'Invalid Data',
        message: 'The provided data is not valid. Please check your input.',
        suggestions: [
          'Check that all required fields are filled',
          'Verify the data format is correct',
          'Review the validation requirements'
        ],
        severity: 'warning',
        canRetry: false,
        showTechnicalDetails: true,
        technicalDetails: message
      };
    }

    // Default formatting
    return {
      title: `${this.capitalizeFirst(operation)} Error`,
      message: this.sanitizeErrorMessage(message),
      suggestions: [
        'Please try again',
        'Contact support if the issue persists'
      ],
      severity: 'error',
      canRetry: true,
      showTechnicalDetails: true,
      technicalDetails: message
    };
  }

  /**
   * Get error title based on type and operation
   */
  private getErrorTitle(errorType: string, operation: string): string {
    const operationTitles: Record<string, string> = {
      'createLegalTag': 'Create Legal Tag',
      'updateLegalTag': 'Update Legal Tag',
      'getLegalTags': 'Load Legal Tags',
      'getLegalTag': 'Load Legal Tag'
    };

    const operationTitle = operationTitles[operation] || this.capitalizeFirst(operation);

    const errorTitles: Record<string, string> = {
      'NETWORK': 'Connection Problem',
      'AUTH': 'Authentication Required',
      'SCHEMA': 'Service Configuration Error',
      'DATA': 'Data Processing Error',
      'VALIDATION': 'Invalid Data',
      'SERVICE': 'Service Unavailable',
      'UNKNOWN': 'Unexpected Error'
    };

    const errorTitle = errorTitles[errorType] || 'Error';
    
    return `${operationTitle}: ${errorTitle}`;
  }

  /**
   * Get error severity based on type
   */
  private getErrorSeverity(errorType: string): 'error' | 'warning' | 'info' {
    const severityMap: Record<string, 'error' | 'warning' | 'info'> = {
      'NETWORK': 'error',
      'AUTH': 'warning',
      'SCHEMA': 'error',
      'DATA': 'info',
      'VALIDATION': 'warning',
      'SERVICE': 'error',
      'UNKNOWN': 'error'
    };

    return severityMap[errorType] || 'error';
  }

  /**
   * Determine if technical details should be shown
   */
  private shouldShowTechnicalDetails(errorType: string): boolean {
    // Show technical details for schema and validation errors
    return ['SCHEMA', 'VALIDATION', 'UNKNOWN'].includes(errorType);
  }

  /**
   * Format technical details for display
   */
  private formatTechnicalDetails(error: LegalTagError): string {
    const details = [
      `Error Type: ${error.errorType}`,
      `Operation: ${error.operation}`,
      `Message: ${error.message}`,
      `Timestamp: ${error.debugInfo.timestamp}`
    ];

    if (error.debugInfo.endpoint) {
      details.push(`Endpoint: ${error.debugInfo.endpoint}`);
    }

    if (error.debugInfo.response) {
      details.push(`Response Info: ${JSON.stringify(error.debugInfo.response, null, 2)}`);
    }

    return details.join('\n');
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(message: string): boolean {
    return !!(
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT')
    );
  }

  private isAuthError(message: string): boolean {
    return !!(
      message.includes('401') ||
      message.includes('403') ||
      message.includes('Unauthorized') ||
      message.includes('Forbidden') ||
      message.includes('Authentication') ||
      message.includes('expired') ||
      message.includes('invalid token')
    );
  }

  private isServerError(message: string): boolean {
    return !!(
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('Internal Server Error') ||
      message.includes('Bad Gateway') ||
      message.includes('Service Unavailable')
    );
  }

  private isValidationError(message: string): boolean {
    return !!(
      message.includes('required') ||
      message.includes('must be provided') ||
      message.includes('format') ||
      message.includes('constraint') ||
      message.includes('violation') ||
      message.includes('validation') ||
      message.includes('invalid')
    );
  }

  /**
   * Sanitize error message for display
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove technical stack traces and internal details
    const sanitized = message
      .replace(/at\s+.*\(.*\)/g, '') // Remove stack trace lines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Limit message length
    if (sanitized.length > 200) {
      return sanitized.substring(0, 197) + '...';
    }

    return sanitized;
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create a retry message
   */
  createRetryMessage(attempt: number, maxAttempts: number, delay: number): string {
    const remainingAttempts = maxAttempts - attempt;
    const delaySeconds = Math.ceil(delay / 1000);
    
    if (remainingAttempts > 0) {
      return `Retrying in ${delaySeconds} seconds... (${remainingAttempts} attempts remaining)`;
    }
    
    return 'Maximum retry attempts reached. Please try again later.';
  }

  /**
   * Create a success message after error recovery
   */
  createRecoveryMessage(operation: string): string {
    const operationMessages: Record<string, string> = {
      'createLegalTag': 'Legal tag created successfully after retry',
      'updateLegalTag': 'Legal tag updated successfully after retry',
      'getLegalTags': 'Legal tags loaded successfully after retry',
      'getLegalTag': 'Legal tag loaded successfully after retry'
    };

    return operationMessages[operation] || `${operation} completed successfully after retry`;
  }
}

// Export singleton instance
export const errorMessageFormatter = new ErrorMessageFormatter();

// Export types for use in other modules
export type { FormattedErrorMessage };