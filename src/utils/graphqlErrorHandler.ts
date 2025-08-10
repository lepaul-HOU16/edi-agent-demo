/**
 * GraphQL Error Handler
 * 
 * This module provides comprehensive error handling for GraphQL operations,
 * converting technical errors into user-friendly messages with actionable suggestions.
 */

export interface APIError {
  service: string;
  operation: string;
  errorType: 'VALIDATION' | 'AUTHENTICATION' | 'NETWORK' | 'SERVER' | 'UNKNOWN';
  message: string;
  suggestions: string[];
  details?: {
    missingArguments?: string[];
    invalidFields?: string[];
    requiredFields?: string[];
    originalError?: any;
  };
}

export interface ErrorHandlerResult {
  userFriendlyMessage: string;
  technicalDetails: string;
  suggestions: string[];
  canRetry: boolean;
  retryDelay?: number;
}

export class GraphQLErrorHandler {
  private errorPatterns = new Map<RegExp, (match: RegExpMatchArray, error: any) => APIError>();

  constructor() {
    this.initializeErrorPatterns();
  }

  /**
   * Handle GraphQL errors and convert them to user-friendly messages
   */
  handleError(error: any, service: string, operation: string): ErrorHandlerResult {
    const apiError = this.parseError(error, service, operation);
    
    return {
      userFriendlyMessage: this.generateUserFriendlyMessage(apiError),
      technicalDetails: this.generateTechnicalDetails(apiError),
      suggestions: apiError.suggestions,
      canRetry: this.canRetry(apiError),
      retryDelay: this.getRetryDelay(apiError)
    };
  }

  /**
   * Parse raw error into structured APIError
   */
  private parseError(error: any, service: string, operation: string): APIError {
    const baseError: APIError = {
      service,
      operation,
      errorType: 'UNKNOWN',
      message: 'An unknown error occurred',
      suggestions: [],
      details: { originalError: error }
    };

    // Handle different error formats
    if (error.response?.errors) {
      return this.parseGraphQLErrors(error.response.errors, baseError);
    }

    if (error.message) {
      return this.parseErrorMessage(error.message, baseError);
    }

    if (typeof error === 'string') {
      return this.parseErrorMessage(error, baseError);
    }

    return baseError;
  }

  /**
   * Parse GraphQL validation errors
   */
  private parseGraphQLErrors(errors: any[], baseError: APIError): APIError {
    const error = errors[0]; // Focus on the first error
    const message = error.message || 'GraphQL validation error';

    // Check against known error patterns
    for (const [pattern, handler] of this.errorPatterns) {
      const match = message.match(pattern);
      if (match) {
        return handler(match, { ...baseError, message });
      }
    }

    // Default GraphQL error handling
    return {
      ...baseError,
      errorType: 'VALIDATION',
      message,
      suggestions: ['Check your query syntax and field selections']
    };
  }

  /**
   * Parse error message string
   */
  private parseErrorMessage(message: string, baseError: APIError): APIError {
    // Check for HTTP errors
    if (message.includes('HTTP error! status:')) {
      const statusMatch = message.match(/status:\s*(\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      return {
        ...baseError,
        errorType: status >= 400 && status < 500 ? 'AUTHENTICATION' : 'SERVER',
        message: this.getHttpErrorMessage(status),
        suggestions: this.getHttpErrorSuggestions(status)
      };
    }

    // Check for network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return {
        ...baseError,
        errorType: 'NETWORK',
        message: 'Network connection error',
        suggestions: [
          'Check your internet connection',
          'Verify the service endpoint is accessible',
          'Try again in a few moments'
        ]
      };
    }

    return {
      ...baseError,
      message,
      suggestions: ['Please try again or contact support if the issue persists']
    };
  }

  /**
   * Initialize error pattern matching
   */
  private initializeErrorPatterns(): void {
    // Missing field argument
    this.errorPatterns.set(
      /Missing field argument (\w+) @ '(\w+)'/,
      (match, baseError) => ({
        ...baseError,
        errorType: 'VALIDATION',
        message: `Missing required argument: ${match[1]}`,
        suggestions: [
          `Add the '${match[1]}' argument to your ${match[2]} query`,
          `Example: ${match[2]}(${match[1]}: "value")`,
          'Check the API documentation for required parameters'
        ],
        details: {
          ...baseError.details,
          missingArguments: [match[1]]
        }
      })
    );

    // Field undefined
    this.errorPatterns.set(
      /Field '(\w+)' in type '(\w+)' is undefined/,
      (match, baseError) => ({
        ...baseError,
        errorType: 'VALIDATION',
        message: `Field '${match[1]}' does not exist on type '${match[2]}'`,
        suggestions: [
          `Remove '${match[1]}' from your query`,
          'Use GraphQL introspection to see available fields',
          'Check the API documentation for correct field names'
        ],
        details: {
          ...baseError.details,
          invalidFields: [match[1]]
        }
      })
    );

    // Sub-selection required
    this.errorPatterns.set(
      /Sub selection required for type (\w+) of field (\w+)/,
      (match, baseError) => ({
        ...baseError,
        errorType: 'VALIDATION',
        message: `Field '${match[2]}' requires sub-field selection`,
        suggestions: [
          `Add sub-fields to '${match[2]}': { id name }`,
          'Complex types need nested field selections',
          'Use GraphQL introspection to see available sub-fields'
        ],
        details: {
          ...baseError.details,
          requiredFields: ['Sub-field selection required']
        }
      })
    );

    // Authentication errors
    this.errorPatterns.set(
      /Unauthorized|Authentication|Invalid token/i,
      (match, baseError) => ({
        ...baseError,
        errorType: 'AUTHENTICATION',
        message: 'Authentication failed',
        suggestions: [
          'Check your API key is correct',
          'Verify you are logged in',
          'Try refreshing your authentication token'
        ]
      })
    );
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserFriendlyMessage(error: APIError): string {
    const serviceMap: Record<string, string> = {
      'schema': 'Schema Service',
      'legal': 'Legal Tagging Service',
      'entitlements': 'Entitlements Service',
      'search': 'Search Service',
      'storage': 'Storage Service'
    };

    const serviceName = serviceMap[error.service] || error.service;
    
    switch (error.errorType) {
      case 'VALIDATION':
        return `${serviceName}: ${error.message}. Please check your query format.`;
      case 'AUTHENTICATION':
        return `${serviceName}: Authentication required. Please check your credentials.`;
      case 'NETWORK':
        return `${serviceName}: Connection problem. Please check your network.`;
      case 'SERVER':
        return `${serviceName}: Server error. Please try again later.`;
      default:
        return `${serviceName}: ${error.message}`;
    }
  }

  /**
   * Generate technical details for developers
   */
  private generateTechnicalDetails(error: APIError): string {
    const details = [
      `Service: ${error.service}`,
      `Operation: ${error.operation}`,
      `Error Type: ${error.errorType}`,
      `Message: ${error.message}`
    ];

    if (error.details?.missingArguments?.length) {
      details.push(`Missing Arguments: ${error.details.missingArguments.join(', ')}`);
    }

    if (error.details?.invalidFields?.length) {
      details.push(`Invalid Fields: ${error.details.invalidFields.join(', ')}`);
    }

    return details.join('\n');
  }

  /**
   * Get HTTP error message
   */
  private getHttpErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request - Invalid query or parameters',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Access denied',
      404: 'Not Found - Service or resource not available',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Service temporarily unavailable',
      502: 'Bad Gateway - Service connection error',
      503: 'Service Unavailable - Service temporarily down'
    };

    return messages[status] || `HTTP Error ${status}`;
  }

  /**
   * Get HTTP error suggestions
   */
  private getHttpErrorSuggestions(status: number): string[] {
    const suggestions: Record<number, string[]> = {
      400: [
        'Check your query syntax',
        'Verify all required arguments are provided',
        'Ensure field selections are correct'
      ],
      401: [
        'Check your API key',
        'Verify authentication credentials',
        'Try logging in again'
      ],
      403: [
        'Check your permissions',
        'Verify you have access to this resource',
        'Contact your administrator'
      ],
      404: [
        'Check the service endpoint URL',
        'Verify the resource exists',
        'Check for typos in the request'
      ],
      429: [
        'Wait a moment before trying again',
        'Reduce the frequency of requests',
        'Contact support if this persists'
      ],
      500: [
        'Try again in a few minutes',
        'Check service status',
        'Contact support if the issue persists'
      ]
    };

    return suggestions[status] || ['Try again later or contact support'];
  }

  /**
   * Determine if error is retryable
   */
  private canRetry(error: APIError): boolean {
    switch (error.errorType) {
      case 'NETWORK':
      case 'SERVER':
        return true;
      case 'AUTHENTICATION':
        return false; // Need user intervention
      case 'VALIDATION':
        return false; // Need query fixes
      default:
        return false;
    }
  }

  /**
   * Get retry delay in milliseconds
   */
  private getRetryDelay(error: APIError): number | undefined {
    switch (error.errorType) {
      case 'NETWORK':
        return 2000; // 2 seconds
      case 'SERVER':
        return 5000; // 5 seconds
      default:
        return undefined;
    }
  }
}

// Export singleton instance
export const errorHandler = new GraphQLErrorHandler();