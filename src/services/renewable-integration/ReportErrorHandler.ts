/**
 * Report Error Handler - Focused Implementation
 * 
 * Handles errors specifically related to renewable energy report generation
 * regressions. Focuses on the actual problems: Lambda invocation failures,
 * timeout issues, and response parsing errors.
 */

export interface ReportError {
  code: string;
  message: string;
  details: string;
  retryable: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  context: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ReportErrorHandler {
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  /**
   * Classify error and determine if it's retryable
   */
  classifyError(error: any, context: Record<string, any> = {}): ReportError {
    // Lambda invocation errors (common regression cause)
    if (error.name === 'ResourceNotFoundException') {
      return {
        code: 'LAMBDA_NOT_FOUND',
        message: 'Lambda function not found',
        details: `Function ${context.functionName || 'unknown'} does not exist`,
        retryable: false,
        severity: 'critical',
        context
      };
    }

    if (error.name === 'TooManyRequestsException') {
      return {
        code: 'LAMBDA_THROTTLED',
        message: 'Lambda function throttled',
        details: 'Too many concurrent invocations',
        retryable: true,
        severity: 'medium',
        context
      };
    }

    if (error.name === 'TimeoutError' || error.code === 'TimeoutError') {
      return {
        code: 'LAMBDA_TIMEOUT',
        message: 'Lambda function timed out',
        details: 'Function execution exceeded timeout limit',
        retryable: true,
        severity: 'high',
        context
      };
    }

    // Permission errors (common after deployment changes)
    if (error.name === 'AccessDeniedException') {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Access denied to Lambda function',
        details: 'IAM permissions insufficient',
        retryable: false,
        severity: 'critical',
        context
      };
    }

    // JSON parsing errors (common with response format changes)
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return {
        code: 'RESPONSE_PARSE_ERROR',
        message: 'Failed to parse Lambda response',
        details: 'Response is not valid JSON',
        retryable: false,
        severity: 'high',
        context
      };
    }

    // Network/connection errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        details: error.message,
        retryable: true,
        severity: 'medium',
        context
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error.stack || 'No additional details',
      retryable: false,
      severity: 'medium',
      context
    };
  }

  /**
   * Execute function with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: Record<string, any> = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const classifiedError = this.classifyError(error, context);
        
        console.log(`Attempt ${attempt + 1} failed: ${classifiedError.message}`);

        // Don't retry if not retryable or on last attempt
        if (!classifiedError.retryable || attempt === config.maxRetries) {
          throw classifiedError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw this.classifyError(lastError, context);
  }

  /**
   * Generate user-friendly error message
   */
  getUserMessage(error: ReportError): string {
    switch (error.code) {
      case 'LAMBDA_NOT_FOUND':
        return 'Renewable energy functions are not deployed. Please run deployment first.';
      
      case 'PERMISSION_DENIED':
        return 'Permission denied. Please check AWS credentials and IAM permissions.';
      
      case 'LAMBDA_TIMEOUT':
        return 'Report generation is taking longer than expected. Please try again.';
      
      case 'LAMBDA_THROTTLED':
        return 'System is busy. Please wait a moment and try again.';
      
      case 'RESPONSE_PARSE_ERROR':
        return 'Report generation completed but response format is invalid.';
      
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      
      default:
        return 'An unexpected error occurred during report generation.';
    }
  }

  /**
   * Get remediation steps for error
   */
  getRemediationSteps(error: ReportError): string[] {
    switch (error.code) {
      case 'LAMBDA_NOT_FOUND':
        return [
          'Run: npx ampx sandbox',
          'Verify all renewable energy functions are deployed',
          'Check AWS Lambda console for function existence'
        ];
      
      case 'PERMISSION_DENIED':
        return [
          'Check AWS credentials: aws sts get-caller-identity',
          'Verify IAM permissions for Lambda invocation',
          'Update execution role if necessary'
        ];
      
      case 'LAMBDA_TIMEOUT':
        return [
          'Check Lambda function logs in CloudWatch',
          'Consider increasing function timeout',
          'Verify function is not stuck in infinite loop'
        ];
      
      case 'LAMBDA_THROTTLED':
        return [
          'Wait 30 seconds and retry',
          'Check Lambda concurrency limits',
          'Consider increasing reserved concurrency'
        ];
      
      case 'RESPONSE_PARSE_ERROR':
        return [
          'Check Lambda function logs for errors',
          'Verify function returns valid JSON',
          'Update function code if response format changed'
        ];
      
      default:
        return [
          'Check system logs for more details',
          'Verify all dependencies are available',
          'Contact support if issue persists'
        ];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}