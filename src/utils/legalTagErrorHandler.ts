/**
 * Legal Tag Error Handler
 * 
 * Specialized error handling for legal tag operations with specific error types,
 * detailed logging, and actionable error messages for users.
 */

export interface LegalTagError {
  errorType: 'NETWORK' | 'AUTH' | 'SCHEMA' | 'DATA' | 'VALIDATION' | 'SERVICE' | 'UNKNOWN';
  operation: string;
  message: string;
  userMessage: string;
  suggestions: string[];
  canRetry: boolean;
  retryDelay?: number;
  debugInfo: {
    timestamp: string;
    service: 'legal-tagging';
    endpoint?: string;
    query?: string;
    variables?: any;
    response?: any;
    stackTrace?: string;
  };
}

export interface LegalTagOperationContext {
  operation: string;
  dataPartition?: string;
  legalTagId?: string;
  queryType?: 'primary' | 'fallback';
  endpoint?: string;
  query?: string;
  variables?: any;
}

export class LegalTagErrorHandler {
  private readonly SERVICE_NAME = 'legal-tagging';
  
  /**
   * Handle legal tag operation errors with comprehensive logging and user-friendly messages
   */
  handleError(error: any, context: LegalTagOperationContext): LegalTagError {
    const timestamp = new Date().toISOString();
    
    // Log the error for debugging
    this.logError(error, context, timestamp);
    
    // Parse and classify the error
    const parsedError = this.parseError(error, context, timestamp);
    
    // Log the parsed error result
    this.logParsedError(parsedError);
    
    return parsedError;
  }

  /**
   * Parse raw error into structured LegalTagError
   */
  private parseError(error: any, context: LegalTagOperationContext, timestamp: string): LegalTagError {
    const baseError: LegalTagError = {
      errorType: 'UNKNOWN',
      operation: context.operation,
      message: 'An unknown error occurred',
      userMessage: 'Something went wrong with the legal tag operation',
      suggestions: ['Please try again or contact support'],
      canRetry: false,
      debugInfo: {
        timestamp,
        service: this.SERVICE_NAME,
        endpoint: context.endpoint,
        query: context.query,
        variables: context.variables,
        stackTrace: error?.stack
      }
    };

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, baseError, context);
    }

    // Handle authentication errors
    if (this.isAuthError(error)) {
      return this.handleAuthError(error, baseError, context);
    }

    // Handle GraphQL schema errors
    if (this.isSchemaError(error)) {
      return this.handleSchemaError(error, baseError, context);
    }

    // Handle data validation errors
    if (this.isDataError(error)) {
      return this.handleDataError(error, baseError, context);
    }

    // Handle service errors
    if (this.isServiceError(error)) {
      return this.handleServiceError(error, baseError, context);
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return this.handleValidationError(error, baseError, context);
    }

    // Default unknown error handling
    return {
      ...baseError,
      message: error?.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred while processing legal tags',
      suggestions: [
        'Please try again',
        'Check your network connection',
        'Contact support if the issue persists'
      ]
    };
  }

  /**
   * Handle network-related errors
   */
  private handleNetworkError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isTimeout = error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT';
    const isConnectionRefused = error?.message?.includes('ECONNREFUSED') || error?.code === 'ECONNREFUSED';
    const isFetchError = error?.message?.includes('fetch') || error?.name === 'TypeError';

    let message = 'Network connection failed';
    let userMessage = 'Unable to connect to the legal tagging service';
    let suggestions = [
      'Check your internet connection',
      'Verify the service is running',
      'Try again in a few moments'
    ];

    if (isTimeout) {
      message = 'Request timeout';
      userMessage = 'The request took too long to complete';
      suggestions = [
        'The service may be experiencing high load',
        'Try again with a smaller request',
        'Contact support if timeouts persist'
      ];
    } else if (isConnectionRefused) {
      message = 'Connection refused by server';
      userMessage = 'The legal tagging service is not available';
      suggestions = [
        'The service may be down for maintenance',
        'Check service status',
        'Contact your administrator'
      ];
    } else if (isFetchError) {
      message = 'Network request failed';
      userMessage = 'Failed to communicate with the legal tagging service';
      suggestions = [
        'Check your network connection',
        'Verify the service endpoint is correct',
        'Try refreshing the page'
      ];
    }

    return {
      ...baseError,
      errorType: 'NETWORK',
      message,
      userMessage,
      suggestions,
      canRetry: true,
      retryDelay: isTimeout ? 10000 : 5000, // Longer delay for timeouts
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          networkError: true,
          errorCode: error?.code,
          errorName: error?.name
        }
      }
    };
  }

  /**
   * Handle authentication-related errors
   */
  private handleAuthError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isTokenExpired = error?.message?.includes('expired') || error?.message?.includes('invalid token');
    const isUnauthorized = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
    const isForbidden = error?.message?.includes('403') || error?.message?.includes('Forbidden');

    let message = 'Authentication failed';
    let userMessage = 'You are not authorized to access legal tags';
    let suggestions = [
      'Please log in again',
      'Check your credentials',
      'Contact your administrator for access'
    ];

    if (isTokenExpired) {
      message = 'Authentication token expired';
      userMessage = 'Your session has expired';
      suggestions = [
        'Please log in again',
        'Your session will be refreshed automatically',
        'Try the operation again after logging in'
      ];
    } else if (isUnauthorized) {
      message = 'Unauthorized access';
      userMessage = 'You need to log in to access legal tags';
      suggestions = [
        'Please log in with your credentials',
        'Ensure you have the correct permissions',
        'Contact support if you believe this is an error'
      ];
    } else if (isForbidden) {
      message = 'Access forbidden';
      userMessage = 'You do not have permission to perform this action';
      suggestions = [
        'Contact your administrator for access',
        'Verify you have legal tag management permissions',
        'Check your user role and entitlements'
      ];
    }

    return {
      ...baseError,
      errorType: 'AUTH',
      message,
      userMessage,
      suggestions,
      canRetry: false, // Auth errors require user intervention
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          authError: true,
          statusCode: this.extractStatusCode(error),
          dataPartition: context.dataPartition
        }
      }
    };
  }

  /**
   * Handle GraphQL schema-related errors
   */
  private handleSchemaError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isMissingField = error?.message?.includes('Field') && error?.message?.includes('undefined');
    const isMissingArgument = error?.message?.includes('Missing field argument');
    const isInvalidQuery = error?.message?.includes('Syntax Error') || error?.message?.includes('Cannot query field');
    const isSubSelectionRequired = error?.message?.includes('Sub selection required');

    let message = 'GraphQL schema error';
    let userMessage = 'There was a problem with the query structure';
    let suggestions = [
      'The API schema may have changed',
      'Contact support for assistance',
      'Try refreshing the page'
    ];

    if (isMissingField) {
      const fieldMatch = error.message.match(/Field '(\w+)'/);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';
      message = `Field '${field}' does not exist in the schema`;
      userMessage = 'The legal tag query is using outdated field names';
      suggestions = [
        'The API schema has been updated',
        'Please refresh the page to get the latest version',
        'Contact support if the issue persists'
      ];
    } else if (isMissingArgument) {
      const argMatch = error.message.match(/Missing field argument (\w+)/);
      const arg = argMatch ? argMatch[1] : 'unknown';
      message = `Missing required argument: ${arg}`;
      userMessage = 'Required information is missing from the request';
      suggestions = [
        `The '${arg}' parameter is required`,
        'Please ensure all required fields are provided',
        'Contact support if you continue to see this error'
      ];
    } else if (isSubSelectionRequired) {
      message = 'Query requires sub-field selection';
      userMessage = 'The query structure needs to be updated';
      suggestions = [
        'The API requires more specific field selections',
        'Please refresh the page to get the updated query',
        'Contact support for assistance'
      ];
    }

    return {
      ...baseError,
      errorType: 'SCHEMA',
      message,
      userMessage,
      suggestions,
      canRetry: false, // Schema errors need code fixes
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          schemaError: true,
          graphqlErrors: error?.response?.errors || [],
          queryType: context.queryType
        }
      }
    };
  }

  /**
   * Handle data-related errors
   */
  private handleDataError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isEmptyResponse = error?.message?.includes('empty') || error?.message?.includes('no data');
    const isInvalidData = error?.message?.includes('invalid') || error?.message?.includes('malformed');
    const isParsingError = error?.message?.includes('parse') || error?.message?.includes('JSON');

    let message = 'Data processing error';
    let userMessage = 'There was a problem processing the legal tag data';
    let suggestions = [
      'The data may be in an unexpected format',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ];

    if (isEmptyResponse) {
      message = 'No legal tags found';
      userMessage = context.operation === 'getLegalTags' 
        ? 'No legal tags have been created yet'
        : 'The requested legal tag was not found';
      suggestions = context.operation === 'getLegalTags'
        ? [
            'Create your first legal tag to get started',
            'Check if you have the correct data partition',
            'Verify your access permissions'
          ]
        : [
            'Check that the legal tag ID is correct',
            'The legal tag may have been deleted',
            'Verify you have access to this legal tag'
          ];
    } else if (isParsingError) {
      message = 'Failed to parse response data';
      userMessage = 'The server response could not be processed';
      suggestions = [
        'The server may have returned invalid data',
        'Try again in a few moments',
        'Contact support with the error details'
      ];
    }

    return {
      ...baseError,
      errorType: 'DATA',
      message,
      userMessage,
      suggestions,
      canRetry: isEmptyResponse ? false : true,
      retryDelay: 3000,
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          dataError: true,
          isEmpty: isEmptyResponse,
          parsingError: isParsingError
        }
      }
    };
  }

  /**
   * Handle service-related errors
   */
  private handleServiceError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isServerError = error?.message?.includes('500') || error?.message?.includes('Internal Server Error');
    const isBadGateway = error?.message?.includes('502') || error?.message?.includes('Bad Gateway');
    const isServiceUnavailable = error?.message?.includes('503') || error?.message?.includes('Service Unavailable');

    let message = 'Service error';
    let userMessage = 'The legal tagging service is experiencing issues';
    let suggestions = [
      'The service may be temporarily unavailable',
      'Try again in a few minutes',
      'Contact support if the issue persists'
    ];

    if (isServerError) {
      message = 'Internal server error';
      userMessage = 'The legal tagging service encountered an internal error';
      suggestions = [
        'This is a temporary server issue',
        'Try again in a few minutes',
        'Contact support if errors continue'
      ];
    } else if (isBadGateway) {
      message = 'Bad gateway error';
      userMessage = 'Unable to connect to the legal tagging service';
      suggestions = [
        'The service gateway is experiencing issues',
        'Try again in a few moments',
        'Check service status or contact support'
      ];
    } else if (isServiceUnavailable) {
      message = 'Service unavailable';
      userMessage = 'The legal tagging service is temporarily unavailable';
      suggestions = [
        'The service may be under maintenance',
        'Try again in a few minutes',
        'Check service status for updates'
      ];
    }

    return {
      ...baseError,
      errorType: 'SERVICE',
      message,
      userMessage,
      suggestions,
      canRetry: true,
      retryDelay: isServiceUnavailable ? 30000 : 10000, // Longer delay for maintenance
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          serviceError: true,
          statusCode: this.extractStatusCode(error),
          serverError: isServerError
        }
      }
    };
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: any, baseError: LegalTagError, context: LegalTagOperationContext): LegalTagError {
    const isRequiredField = error?.message?.includes('required') || error?.message?.includes('must be provided');
    const isInvalidFormat = error?.message?.includes('format') || error?.message?.includes('invalid');
    const isConstraintViolation = error?.message?.includes('constraint') || error?.message?.includes('violation');

    let message = 'Validation error';
    let userMessage = 'The legal tag data is not valid';
    let suggestions = [
      'Check that all required fields are provided',
      'Verify the data format is correct',
      'Review the legal tag requirements'
    ];

    if (isRequiredField) {
      message = 'Required field missing';
      userMessage = 'Some required information is missing';
      suggestions = [
        'Please fill in all required fields',
        'Check that the legal tag name is provided',
        'Ensure all mandatory properties are included'
      ];
    } else if (isInvalidFormat) {
      message = 'Invalid data format';
      userMessage = 'The legal tag data format is incorrect';
      suggestions = [
        'Check the date formats (use ISO 8601)',
        'Verify email addresses are valid',
        'Ensure country codes are correct'
      ];
    }

    return {
      ...baseError,
      errorType: 'VALIDATION',
      message,
      userMessage,
      suggestions,
      canRetry: false, // Validation errors need user input fixes
      debugInfo: {
        ...baseError.debugInfo,
        response: {
          validationError: true,
          requiredField: isRequiredField,
          invalidFormat: isInvalidFormat
        }
      }
    };
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(error: any): boolean {
    return !!(
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNREFUSED' ||
      error?.name === 'TypeError' ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('network') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout')
    );
  }

  private isAuthError(error: any): boolean {
    return !!(
      error?.message?.includes('401') ||
      error?.message?.includes('403') ||
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('Forbidden') ||
      error?.message?.includes('Authentication') ||
      error?.message?.includes('expired') ||
      error?.message?.includes('invalid token')
    );
  }

  private isSchemaError(error: any): boolean {
    return !!(
      error?.response?.errors?.some((e: any) => 
        e.message?.includes('Field') ||
        e.message?.includes('Missing field argument') ||
        e.message?.includes('Syntax Error') ||
        e.message?.includes('Cannot query field') ||
        e.message?.includes('Sub selection required')
      ) ||
      error?.message?.includes('Field') ||
      error?.message?.includes('Missing field argument') ||
      error?.message?.includes('Syntax Error') ||
      error?.message?.includes('Cannot query field') ||
      error?.message?.includes('Sub selection required')
    );
  }

  private isDataError(error: any): boolean {
    return !!(
      error?.message?.includes('empty') ||
      error?.message?.includes('no data') ||
      error?.message?.includes('parse') ||
      error?.message?.includes('JSON') ||
      error?.message?.includes('malformed') ||
      error?.message?.includes('invalid data')
    );
  }

  private isServiceError(error: any): boolean {
    return !!(
      error?.message?.includes('500') ||
      error?.message?.includes('502') ||
      error?.message?.includes('503') ||
      error?.message?.includes('Internal Server Error') ||
      error?.message?.includes('Bad Gateway') ||
      error?.message?.includes('Service Unavailable')
    );
  }

  private isValidationError(error: any): boolean {
    return !!(
      error?.message?.includes('required') ||
      error?.message?.includes('must be provided') ||
      error?.message?.includes('format') ||
      error?.message?.includes('constraint') ||
      error?.message?.includes('violation') ||
      error?.message?.includes('validation')
    );
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: any): number | undefined {
    if (error?.response?.status) return error.response.status;
    if (error?.status) return error.status;
    
    const statusMatch = error?.message?.match(/status:\s*(\d+)/);
    return statusMatch ? parseInt(statusMatch[1]) : undefined;
  }

  /**
   * Log error for debugging
   */
  private logError(error: any, context: LegalTagOperationContext, timestamp: string): void {
    console.group(`🚨 Legal Tag Error - ${context.operation} (${timestamp})`);
    console.error('Raw error:', error);
    console.log('Operation context:', {
      operation: context.operation,
      dataPartition: context.dataPartition,
      legalTagId: context.legalTagId,
      queryType: context.queryType,
      endpoint: context.endpoint
    });
    
    if (context.query) {
      console.log('GraphQL Query:', context.query);
    }
    
    if (context.variables) {
      console.log('Query Variables:', context.variables);
    }
    
    if (error?.response) {
      console.log('Response:', error.response);
    }
    
    if (error?.stack) {
      console.log('Stack Trace:', error.stack);
    }
    
    console.groupEnd();
  }

  /**
   * Log parsed error result
   */
  private logParsedError(parsedError: LegalTagError): void {
    console.group(`📋 Legal Tag Error Analysis - ${parsedError.operation}`);
    console.log('Error Type:', parsedError.errorType);
    console.log('Technical Message:', parsedError.message);
    console.log('User Message:', parsedError.userMessage);
    console.log('Can Retry:', parsedError.canRetry);
    
    if (parsedError.retryDelay) {
      console.log('Retry Delay:', `${parsedError.retryDelay}ms`);
    }
    
    console.log('Suggestions:', parsedError.suggestions);
    console.log('Debug Info:', parsedError.debugInfo);
    console.groupEnd();
  }

  /**
   * Create operation context for error handling
   */
  createContext(
    operation: string,
    options: {
      dataPartition?: string;
      legalTagId?: string;
      queryType?: 'primary' | 'fallback';
      endpoint?: string;
      query?: string;
      variables?: any;
    } = {}
  ): LegalTagOperationContext {
    return {
      operation,
      ...options
    };
  }
}

// Export singleton instance
export const legalTagErrorHandler = new LegalTagErrorHandler();

// Export types for use in other modules
export type { LegalTagError, LegalTagOperationContext };