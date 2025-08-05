/**
 * Legal Tag Error Handler Hook
 * 
 * React hook for handling legal tag errors with automatic retry logic,
 * user-friendly error messages, and state management.
 */

import React, { useState, useCallback, useRef } from 'react';
import { legalTagErrorHandler, LegalTagError } from '../utils/legalTagErrorHandler';
import { legalTagLogger } from '../utils/legalTagLogger';
import { errorMessageFormatter, FormattedErrorMessage } from '../utils/errorMessageFormatter';

export interface ErrorState {
  hasError: boolean;
  error: LegalTagError | null;
  formattedError: FormattedErrorMessage | null;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: LegalTagError) => void;
  onMaxRetriesReached?: (error: LegalTagError) => void;
}

export interface UseLegalTagErrorHandlerOptions {
  defaultRetryOptions?: RetryOptions;
  logErrors?: boolean;
  autoRetry?: boolean;
}

export function useLegalTagErrorHandler(options: UseLegalTagErrorHandlerOptions = {}) {
  const {
    defaultRetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      exponentialBackoff: true
    },
    logErrors = true,
    autoRetry = true
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    formattedError: null,
    isRetrying: false,
    retryCount: 0,
    maxRetries: defaultRetryOptions.maxRetries || 3
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOperationRef = useRef<string | null>(null);

  /**
   * Handle an error with automatic retry logic
   */
  const handleError = useCallback(async (
    error: any,
    operation: string,
    context: any = {},
    retryOptions: RetryOptions = {}
  ): Promise<boolean> => {
    const finalRetryOptions = { ...defaultRetryOptions, ...retryOptions };
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Parse the error using the legal tag error handler
    let legalTagError: LegalTagError;
    
    if (error.legalTagError) {
      legalTagError = error.legalTagError;
    } else {
      const errorContext = legalTagErrorHandler.createContext(operation, context);
      legalTagError = legalTagErrorHandler.handleError(error, errorContext);
    }

    // Format the error for display
    const formattedError = errorMessageFormatter.formatLegalTagError(legalTagError);

    // Update error state
    setErrorState(prevState => ({
      ...prevState,
      hasError: true,
      error: legalTagError,
      formattedError,
      maxRetries: finalRetryOptions.maxRetries || 3
    }));

    // Log the error if enabled
    if (logErrors) {
      legalTagLogger.error(operation, 'Error handled by hook', {
        errorType: legalTagError.errorType,
        canRetry: legalTagError.canRetry,
        retryCount: errorState.retryCount
      }, context);
    }

    // Check if we should retry
    if (
      autoRetry &&
      legalTagError.canRetry &&
      errorState.retryCount < (finalRetryOptions.maxRetries || 3)
    ) {
      return await scheduleRetry(legalTagError, operation, context, finalRetryOptions);
    }

    // Max retries reached or not retryable
    if (errorState.retryCount >= (finalRetryOptions.maxRetries || 3)) {
      finalRetryOptions.onMaxRetriesReached?.(legalTagError);
      
      if (logErrors) {
        legalTagLogger.warn(operation, 'Max retries reached', {
          retryCount: errorState.retryCount,
          maxRetries: finalRetryOptions.maxRetries
        }, context);
      }
    }

    return false; // Indicates error was not resolved
  }, [errorState.retryCount, defaultRetryOptions, logErrors, autoRetry]);

  /**
   * Schedule a retry attempt
   */
  const scheduleRetry = useCallback(async (
    error: LegalTagError,
    operation: string,
    context: any,
    retryOptions: RetryOptions
  ): Promise<boolean> => {
    const newRetryCount = errorState.retryCount + 1;
    
    // Calculate delay
    let delay = error.retryDelay || retryOptions.baseDelay || 1000;
    
    if (retryOptions.exponentialBackoff) {
      delay = delay * Math.pow(2, newRetryCount - 1);
    }

    // Cap the delay at 30 seconds
    delay = Math.min(delay, 30000);

    // Update state to show retrying
    setErrorState(prevState => ({
      ...prevState,
      isRetrying: true,
      retryCount: newRetryCount
    }));

    // Log the retry attempt
    if (logErrors) {
      legalTagLogger.logRetry(operation, newRetryCount, error.message, delay, context);
    }

    // Call retry callback
    retryOptions.onRetry?.(newRetryCount, error);

    // Schedule the retry
    return new Promise((resolve) => {
      retryTimeoutRef.current = setTimeout(() => {
        setErrorState(prevState => ({
          ...prevState,
          isRetrying: false
        }));
        
        // The actual retry logic should be handled by the calling component
        // This hook just manages the state and timing
        resolve(true);
      }, delay);
    });
  }, [errorState.retryCount, logErrors]);

  /**
   * Manually retry the last operation
   */
  const retry = useCallback(async (
    retryFunction: () => Promise<any>,
    retryOptions: RetryOptions = {}
  ): Promise<boolean> => {
    if (!errorState.error || !errorState.error.canRetry) {
      return false;
    }

    const finalRetryOptions = { ...defaultRetryOptions, ...retryOptions };
    
    try {
      setErrorState(prevState => ({
        ...prevState,
        isRetrying: true
      }));

      const result = await retryFunction();
      
      // Success - clear error state
      clearError();
      
      if (logErrors && currentOperationRef.current) {
        legalTagLogger.info(
          currentOperationRef.current,
          errorMessageFormatter.createRecoveryMessage(currentOperationRef.current)
        );
      }

      return true;
    } catch (error) {
      // Retry failed - handle the new error
      const operation = currentOperationRef.current || 'retry';
      return await handleError(error, operation, {}, finalRetryOptions);
    }
  }, [errorState.error, handleError, logErrors, defaultRetryOptions]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState({
      hasError: false,
      error: null,
      formattedError: null,
      isRetrying: false,
      retryCount: 0,
      maxRetries: defaultRetryOptions.maxRetries || 3
    });

    currentOperationRef.current = null;
  }, [defaultRetryOptions.maxRetries]);

  /**
   * Set the current operation for context
   */
  const setCurrentOperation = useCallback((operation: string) => {
    currentOperationRef.current = operation;
  }, []);

  /**
   * Check if a specific error type is present
   */
  const hasErrorType = useCallback((errorType: string): boolean => {
    return errorState.error?.errorType === errorType;
  }, [errorState.error]);

  /**
   * Get retry message for display
   */
  const getRetryMessage = useCallback((): string | null => {
    if (!errorState.isRetrying || !errorState.error) {
      return null;
    }

    return errorMessageFormatter.createRetryMessage(
      errorState.retryCount,
      errorState.maxRetries,
      errorState.error.retryDelay || 1000
    );
  }, [errorState.isRetrying, errorState.error, errorState.retryCount, errorState.maxRetries]);

  /**
   * Execute an operation with automatic error handling
   */
  const executeWithErrorHandling = useCallback(async <T>(
    operation: string,
    operationFunction: () => Promise<T>,
    context: any = {},
    retryOptions: RetryOptions = {}
  ): Promise<T | null> => {
    setCurrentOperation(operation);
    clearError();

    try {
      const result = await operationFunction();
      
      if (logErrors) {
        legalTagLogger.info(operation, 'Operation completed successfully', {
          hasResult: !!result
        }, context);
      }

      return result;
    } catch (error) {
      const wasHandled = await handleError(error, operation, context, retryOptions);
      
      if (!wasHandled) {
        // Error was not resolved through retry
        throw error;
      }

      return null;
    }
  }, [handleError, clearError, setCurrentOperation, logErrors]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Error state
    errorState,
    hasError: errorState.hasError,
    error: errorState.error,
    formattedError: errorState.formattedError,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,

    // Error handling functions
    handleError,
    clearError,
    retry,
    setCurrentOperation,
    hasErrorType,
    getRetryMessage,
    executeWithErrorHandling
  };
}

// Export types for use in other components
export type { ErrorState, RetryOptions, UseLegalTagErrorHandlerOptions };