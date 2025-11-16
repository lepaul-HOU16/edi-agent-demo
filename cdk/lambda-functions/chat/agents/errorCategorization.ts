/**
 * Error Categorization System
 * 
 * Categorizes Lambda errors into specific types with appropriate
 * error messages and remediation steps for each category.
 */

/**
 * Error categories for renewable energy operations
 */
export enum RenewableErrorType {
  NotFound = 'NotFound',
  Timeout = 'Timeout',
  PermissionDenied = 'PermissionDenied',
  InvalidResponse = 'InvalidResponse',
  ToolFailure = 'ToolFailure',
  Unknown = 'Unknown',
}

/**
 * Categorized error with message and remediation steps
 */
export interface CategorizedError {
  type: RenewableErrorType;
  message: string;
  details: string;
  remediationSteps: string[];
  originalError?: any;
  requestId?: string;
}

/**
 * Error categorization service
 */
export class ErrorCategorizer {
  /**
   * Categorize an error and provide appropriate messaging
   * 
   * @param error - Error object to categorize
   * @param requestId - Optional request ID for correlation
   * @returns Categorized error with remediation steps
   */
  static categorizeError(error: any, requestId?: string): CategorizedError {
    // Handle null/undefined errors
    if (!error) {
      return this.createUnknownError(new Error('Unknown error occurred'), requestId);
    }

    const errorName = error.name || '';
    const errorMessage = error.message || '';

    // NotFound errors
    if (this.isNotFoundError(error)) {
      return this.createNotFoundError(error, requestId);
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      return this.createTimeoutError(error, requestId);
    }

    // Permission denied errors
    if (this.isPermissionDeniedError(error)) {
      return this.createPermissionDeniedError(error, requestId);
    }

    // Invalid response errors
    if (this.isInvalidResponseError(error)) {
      return this.createInvalidResponseError(error, requestId);
    }

    // Tool failure errors
    if (this.isToolFailureError(error)) {
      return this.createToolFailureError(error, requestId);
    }

    // Unknown/generic errors
    return this.createUnknownError(error, requestId);
  }

  /**
   * Check if error is a NotFound error
   */
  private static isNotFoundError(error: any): boolean {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    return (
      errorName === 'ResourceNotFoundException' ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('Function not found')
    );
  }

  /**
   * Check if error is a Timeout error
   */
  private static isTimeoutError(error: any): boolean {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    return (
      errorName === 'TimeoutError' ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('timeout after') ||
      errorMessage.includes('Task timed out') ||
      errorMessage.includes('Lambda timeout')
    );
  }

  /**
   * Check if error is a PermissionDenied error
   */
  private static isPermissionDeniedError(error: any): boolean {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    return (
      errorName === 'AccessDeniedException' ||
      errorName === 'UnauthorizedException' ||
      errorName === 'ForbiddenException' ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('not authorized')
    );
  }

  /**
   * Check if error is an InvalidResponse error
   */
  private static isInvalidResponseError(error: any): boolean {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    return (
      errorName === 'ValidationException' ||
      errorName === 'InvalidParameterException' ||
      errorMessage.includes('Invalid response') ||
      errorMessage.includes('Missing required fields') ||
      errorMessage.includes('Invalid artifact') ||
      errorMessage.includes('Invalid project ID') ||
      errorMessage.includes('Response validation failed')
    );
  }

  /**
   * Check if error is a ToolFailure error
   */
  private static isToolFailureError(error: any): boolean {
    const errorName = error.name || '';
    const errorMessage = error.message || '';

    return (
      errorMessage.includes('Tool execution failed') ||
      errorMessage.includes('terrain Lambda') ||
      errorMessage.includes('terrain') ||
      errorMessage.includes('layout Lambda') ||
      errorMessage.includes('layout') ||
      errorMessage.includes('simulation Lambda') ||
      errorMessage.includes('simulation') ||
      errorMessage.includes('report Lambda') ||
      errorMessage.includes('report') ||
      errorMessage.includes('Python error') ||
      errorMessage.includes('ModuleNotFoundError') ||
      errorMessage.includes('ImportError')
    );
  }

  /**
   * Create NotFound categorized error
   */
  private static createNotFoundError(error: any, requestId?: string): CategorizedError {
    const errorMessage = error.message || '';
    
    // Extract function name if available
    let functionName = 'renewable energy Lambda function';
    const functionMatch = errorMessage.match(/function[:\s]+([^\s,]+)/i);
    if (functionMatch) {
      functionName = functionMatch[1];
    }

    return {
      type: RenewableErrorType.NotFound,
      message: 'Renewable Energy Backend Not Deployed',
      details: `The ${functionName} is not deployed or cannot be found.`,
      remediationSteps: [
        'Deploy the renewable energy backend using: npx ampx sandbox',
        'Verify all Lambda functions are deployed in AWS Console',
        `Check that the function name '${functionName}' is correct in your configuration`,
        'Ensure environment variables are set correctly (RENEWABLE_ORCHESTRATOR_FUNCTION_NAME)',
        'Review CloudWatch logs for deployment errors',
      ],
      originalError: error,
      requestId,
    };
  }

  /**
   * Create Timeout categorized error
   */
  private static createTimeoutError(error: any, requestId?: string): CategorizedError {
    const errorMessage = error.message || '';
    
    // Extract duration if available
    let duration = '60 seconds';
    const durationMatch = errorMessage.match(/(\d+)\s*seconds?/i);
    if (durationMatch) {
      duration = `${durationMatch[1]} seconds`;
    }

    return {
      type: RenewableErrorType.Timeout,
      message: 'Renewable Energy Analysis Timed Out',
      details: `The analysis exceeded the timeout threshold of ${duration}.`,
      remediationSteps: [
        'Try again with a smaller analysis area (reduce radius parameter)',
        'Check Lambda timeout settings in AWS Console (increase if needed)',
        'Review CloudWatch logs for the orchestrator and tool Lambda functions',
        'Verify the Lambda functions are not experiencing cold starts',
        'Consider optimizing the analysis parameters (fewer features, smaller area)',
        'If the issue persists, contact support with the request ID',
      ],
      originalError: error,
      requestId,
    };
  }

  /**
   * Create PermissionDenied categorized error
   */
  private static createPermissionDeniedError(error: any, requestId?: string): CategorizedError {
    return {
      type: RenewableErrorType.PermissionDenied,
      message: 'Permission Denied',
      details: 'The agent does not have permission to access the renewable energy backend.',
      remediationSteps: [
        'Add IAM permissions for lambda:InvokeFunction to the agent execution role',
        'Add IAM permissions for lambda:GetFunction to the agent execution role',
        'Verify the Lambda function ARN in the IAM policy is correct',
        'Check that the execution role has the correct trust relationship',
        'Review IAM policies in AWS Console',
        'Example policy needed:',
        '  {',
        '    "Effect": "Allow",',
        '    "Action": ["lambda:InvokeFunction", "lambda:GetFunction"],',
        '    "Resource": "arn:aws:lambda:*:*:function:renewableOrchestrator*"',
        '  }',
      ],
      originalError: error,
      requestId,
    };
  }

  /**
   * Create InvalidResponse categorized error
   */
  private static createInvalidResponseError(error: any, requestId?: string): CategorizedError {
    const errorMessage = error.message || '';
    
    // Extract specific validation issue if available
    let validationIssue = 'The response structure is invalid or incomplete.';
    if (errorMessage.includes('Missing required fields')) {
      validationIssue = 'The response is missing required fields.';
    } else if (errorMessage.includes('Invalid project ID')) {
      validationIssue = 'The response contains an invalid project ID.';
    } else if (errorMessage.includes('Invalid artifact')) {
      validationIssue = 'One or more artifacts have invalid structure.';
    }

    return {
      type: RenewableErrorType.InvalidResponse,
      message: 'Invalid Response from Backend',
      details: validationIssue,
      remediationSteps: [
        'Check CloudWatch logs for the orchestrator Lambda function',
        'Verify the orchestrator is returning the correct response structure',
        'Ensure all required fields are present: success, message, artifacts',
        'Verify project ID generation is working correctly',
        'Check that artifacts have required fields: type, data',
        'Review the orchestrator code for response formatting issues',
        'If the issue persists, redeploy the orchestrator: npx ampx sandbox',
      ],
      originalError: error,
      requestId,
    };
  }

  /**
   * Create ToolFailure categorized error
   */
  private static createToolFailureError(error: any, requestId?: string): CategorizedError {
    const errorMessage = error.message || '';
    
    // Identify which tool failed
    let toolName = 'renewable energy tool';
    if (errorMessage.includes('terrain')) {
      toolName = 'terrain analysis tool';
    } else if (errorMessage.includes('layout')) {
      toolName = 'layout optimization tool';
    } else if (errorMessage.includes('simulation')) {
      toolName = 'simulation tool';
    } else if (errorMessage.includes('report')) {
      toolName = 'report generation tool';
    }

    // Check for Python-specific errors
    const isPythonError = errorMessage.includes('ModuleNotFoundError') || 
                          errorMessage.includes('ImportError') ||
                          errorMessage.includes('Python error');

    const remediationSteps = [
      `Check CloudWatch logs for the ${toolName} Lambda function`,
      'Verify the tool Lambda is deployed correctly',
      'Ensure the orchestrator is passing correct parameters to the tool',
    ];

    if (isPythonError) {
      remediationSteps.push(
        'Verify Python dependencies are installed in the Lambda layer',
        'Check that the Lambda layer is attached to the function',
        'Review requirements.txt for missing dependencies',
        'Rebuild and redeploy the Lambda layer if needed'
      );
    } else {
      remediationSteps.push(
        'Verify environment variables are set correctly',
        'Check that the tool has access to required AWS services (S3, etc.)',
        'Review the tool code for runtime errors'
      );
    }

    remediationSteps.push(
      'If the issue persists, redeploy all functions: npx ampx sandbox'
    );

    return {
      type: RenewableErrorType.ToolFailure,
      message: 'Tool Execution Failed',
      details: `The ${toolName} encountered an error during execution.`,
      remediationSteps,
      originalError: error,
      requestId,
    };
  }

  /**
   * Create Unknown categorized error
   */
  private static createUnknownError(error: any, requestId?: string): CategorizedError {
    const errorMessage = error?.message || 'An unknown error occurred';
    const errorName = error?.name || (error instanceof Error ? 'Error' : 'UnknownError');

    return {
      type: RenewableErrorType.Unknown,
      message: 'Unexpected Error',
      details: `An unexpected error occurred: ${errorName}: ${errorMessage}`,
      remediationSteps: [
        'Check CloudWatch logs for detailed error information',
        'Verify all Lambda functions are deployed and healthy',
        'Check AWS service status for any outages',
        'Review network connectivity and AWS credentials',
        'Try the operation again in a few moments',
        'If the issue persists, contact support with the request ID and error details',
      ],
      originalError: error,
      requestId,
    };
  }

  /**
   * Format categorized error for logging
   * 
   * @param categorizedError - Categorized error to format
   * @returns Formatted log object
   */
  static formatForLogging(categorizedError: CategorizedError): any {
    return {
      errorType: categorizedError.type,
      message: categorizedError.message,
      details: categorizedError.details,
      remediationSteps: categorizedError.remediationSteps,
      requestId: categorizedError.requestId,
      originalError: {
        name: categorizedError.originalError?.name,
        message: categorizedError.originalError?.message,
      },
    };
  }

  /**
   * Format categorized error for user display
   * 
   * @param categorizedError - Categorized error to format
   * @returns User-friendly error message
   */
  static formatForUser(categorizedError: CategorizedError): string {
    let message = `${categorizedError.message}\n\n${categorizedError.details}\n\n`;
    
    message += 'Remediation Steps:\n';
    categorizedError.remediationSteps.forEach((step, index) => {
      message += `${index + 1}. ${step}\n`;
    });

    if (categorizedError.requestId) {
      message += `\nRequest ID: ${categorizedError.requestId}`;
    }

    return message;
  }
}
