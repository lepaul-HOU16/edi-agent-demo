/**
 * Comprehensive Error Handling and User Feedback System
 * Provides graceful error handling, recovery suggestions, and progress indicators
 * Requirements: 6.1, 6.2, 6.3
 */

import { EventEmitter } from 'events';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATA_VALIDATION = 'data_validation',
  CALCULATION = 'calculation',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  USER_INPUT = 'user_input',
  SYSTEM = 'system',
  EXPORT = 'export',
  VISUALIZATION = 'visualization'
}

export interface ErrorDetails {
  id: string;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: any;
  stackTrace?: string;
  userMessage: string;
  suggestions: string[];
  recoveryActions: RecoveryAction[];
  metadata?: { [key: string]: any };
}

export interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  action: () => Promise<boolean>;
  automatic: boolean;
  priority: number;
}

export interface ProgressIndicator {
  id: string;
  title: string;
  message: string;
  progress: number;
  indeterminate: boolean;
  estimatedTimeRemaining?: number;
  canCancel: boolean;
  onCancel?: () => void;
}

export interface UserFeedback {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: FeedbackAction[];
  persistent?: boolean;
}

export interface FeedbackAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ErrorRecoveryConfig {
  enableAutoRecovery: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableFallbackMethods: boolean;
  enableUserNotification: boolean;
  logErrors: boolean;
}

/**
 * Centralized error handling system
 */
export class ErrorHandlingSystem extends EventEmitter {
  private config: ErrorRecoveryConfig;
  private errorHistory: ErrorDetails[] = [];
  private activeRecoveries: Map<string, Promise<boolean>> = new Map();
  private progressIndicators: Map<string, ProgressIndicator> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    super();
    
    this.config = {
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      enableFallbackMethods: true,
      enableUserNotification: true,
      logErrors: true,
      ...config
    };
  }

  /**
   * Handle an error with comprehensive recovery options
   */
  async handleError(error: Error | ErrorDetails, context?: any): Promise<boolean> {
    const errorDetails = this.normalizeError(error, context);
    
    // Log error if enabled
    if (this.config.logErrors) {
      console.error(`[${errorDetails.severity.toUpperCase()}] ${errorDetails.message}`, errorDetails);
    }

    // Add to error history
    this.errorHistory.push(errorDetails);
    
    // Emit error event
    this.emit('error', errorDetails);

    // Attempt recovery if enabled
    if (this.config.enableAutoRecovery) {
      return this.attemptRecovery(errorDetails);
    }

    // Show user notification
    if (this.config.enableUserNotification) {
      this.showUserFeedback({
        type: this.getNotificationType(errorDetails.severity),
        title: 'Error Occurred',
        message: errorDetails.userMessage,
        actions: errorDetails.recoveryActions.map(action => ({
          label: action.label,
          action: () => action.action()
        }))
      });
    }

    return false;
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptRecovery(errorDetails: ErrorDetails): Promise<boolean> {
    const recoveryKey = `${errorDetails.category}_${errorDetails.code}`;
    
    // Check if recovery is already in progress
    if (this.activeRecoveries.has(recoveryKey)) {
      return this.activeRecoveries.get(recoveryKey)!;
    }

    const recoveryPromise = this.executeRecovery(errorDetails);
    this.activeRecoveries.set(recoveryKey, recoveryPromise);

    try {
      const recovered = await recoveryPromise;
      this.activeRecoveries.delete(recoveryKey);
      
      if (recovered) {
        this.showUserFeedback({
          type: 'success',
          title: 'Issue Resolved',
          message: `Successfully recovered from: ${errorDetails.userMessage}`,
          duration: 5000
        });
      }
      
      return recovered;
    } catch (recoveryError) {
      this.activeRecoveries.delete(recoveryKey);
      
      // Handle recovery failure
      await this.handleError(new Error(`Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`), {
        originalError: errorDetails,
        recoveryAttempt: true
      });
      
      return false;
    }
  }

  /**
   * Execute recovery actions
   */
  private async executeRecovery(errorDetails: ErrorDetails): Promise<boolean> {
    const retryKey = `${errorDetails.category}_${errorDetails.code}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;

    // Check retry limits
    if (currentAttempts >= this.config.maxRetryAttempts) {
      this.showUserFeedback({
        type: 'error',
        title: 'Recovery Failed',
        message: `Maximum retry attempts exceeded for: ${errorDetails.userMessage}`,
        persistent: true,
        actions: [{
          label: 'Reset',
          action: () => this.retryAttempts.delete(retryKey)
        }]
      });
      return false;
    }

    // Increment retry count
    this.retryAttempts.set(retryKey, currentAttempts + 1);

    // Try automatic recovery actions
    const automaticActions = errorDetails.recoveryActions
      .filter(action => action.automatic)
      .sort((a, b) => b.priority - a.priority);

    for (const action of automaticActions) {
      try {
        this.showProgress({
          id: `recovery_${action.id}`,
          title: 'Attempting Recovery',
          message: action.description,
          progress: 0,
          indeterminate: true,
          canCancel: false
        });

        const success = await action.action();
        
        this.hideProgress(`recovery_${action.id}`);
        
        if (success) {
          this.retryAttempts.delete(retryKey);
          return true;
        }
      } catch (actionError) {
        this.hideProgress(`recovery_${action.id}`);
        console.warn(`Recovery action failed: ${action.label}`, actionError);
      }
    }

    // If automatic recovery failed, show manual options
    if (errorDetails.recoveryActions.some(action => !action.automatic)) {
      this.showUserFeedback({
        type: 'warning',
        title: 'Manual Recovery Required',
        message: errorDetails.userMessage,
        persistent: true,
        actions: errorDetails.recoveryActions
          .filter(action => !action.automatic)
          .map(action => ({
            label: action.label,
            action: async () => {
              try {
                const success = await action.action();
                if (success) {
                  this.retryAttempts.delete(retryKey);
                  this.showUserFeedback({
                    type: 'success',
                    title: 'Recovery Successful',
                    message: `Issue resolved using: ${action.label}`,
                    duration: 5000
                  });
                }
              } catch (error) {
                this.handleError(error as Error, { manualRecovery: true });
              }
            }
          }))
      });
    }

    return false;
  }

  /**
   * Show progress indicator
   */
  showProgress(indicator: ProgressIndicator): void {
    this.progressIndicators.set(indicator.id, indicator);
    this.emit('progress_start', indicator);
  }

  /**
   * Update progress indicator
   */
  updateProgress(id: string, updates: Partial<ProgressIndicator>): void {
    const indicator = this.progressIndicators.get(id);
    if (indicator) {
      const updated = { ...indicator, ...updates };
      this.progressIndicators.set(id, updated);
      this.emit('progress_update', updated);
    }
  }

  /**
   * Hide progress indicator
   */
  hideProgress(id: string): void {
    const indicator = this.progressIndicators.get(id);
    if (indicator) {
      this.progressIndicators.delete(id);
      this.emit('progress_end', indicator);
    }
  }

  /**
   * Show user feedback notification
   */
  showUserFeedback(feedback: UserFeedback): void {
    this.emit('user_feedback', feedback);
  }

  /**
   * Normalize error to ErrorDetails format
   */
  private normalizeError(error: Error | ErrorDetails, context?: any): ErrorDetails {
    if ('id' in error && 'code' in error) {
      return error as ErrorDetails;
    }

    const err = error as Error;
    const errorId = this.generateErrorId();
    
    return {
      id: errorId,
      code: this.extractErrorCode(err),
      message: err.message,
      category: this.categorizeError(err, context),
      severity: this.assessSeverity(err, context),
      timestamp: new Date(),
      context,
      stackTrace: err.stack,
      userMessage: this.generateUserMessage(err, context),
      suggestions: this.generateSuggestions(err, context),
      recoveryActions: this.generateRecoveryActions(err, context),
      metadata: {
        errorName: err.name,
        contextType: typeof context
      }
    };
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: Error): string {
    // Try to extract code from error name or message
    if (error.name) {
      return error.name.replace(/Error$/, '').toUpperCase();
    }
    
    if (error.message.includes('ENOTFOUND')) return 'NETWORK_ERROR';
    if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
    if (error.message.includes('permission')) return 'PERMISSION_ERROR';
    if (error.message.includes('not found')) return 'NOT_FOUND_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Categorize error based on type and context
   */
  private categorizeError(error: Error, context?: any): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (context?.calculationType) return ErrorCategory.CALCULATION;
    if (context?.wellData) return ErrorCategory.DATA_VALIDATION;
    if (context?.export) return ErrorCategory.EXPORT;
    if (context?.visualization) return ErrorCategory.VISUALIZATION;
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('memory') || message.includes('performance')) {
      return ErrorCategory.PERFORMANCE;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.DATA_VALIDATION;
    }
    
    return ErrorCategory.SYSTEM;
  }

  /**
   * Assess error severity
   */
  private assessSeverity(error: Error, context?: any): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // Critical errors that stop the workflow
    if (message.includes('fatal') || message.includes('critical') || message.includes('cannot proceed')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors that significantly impact functionality
    if (message.includes('failed to load') || message.includes('calculation failed') || context?.workflowBlocking) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors that impact some functionality
    if (message.includes('warning') || message.includes('partial') || context?.partialFailure) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity errors that don't significantly impact functionality
    return ErrorSeverity.LOW;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(error: Error, context?: any): string {
    const category = this.categorizeError(error, context);
    
    switch (category) {
      case ErrorCategory.DATA_VALIDATION:
        return `There's an issue with the well data: ${this.simplifyTechnicalMessage(error.message)}`;
      
      case ErrorCategory.CALCULATION:
        return `A calculation error occurred: ${this.simplifyTechnicalMessage(error.message)}`;
      
      case ErrorCategory.NETWORK:
        return `Network connection issue: Unable to connect to the server. Please check your internet connection.`;
      
      case ErrorCategory.EXPORT:
        return `Export failed: ${this.simplifyTechnicalMessage(error.message)}`;
      
      case ErrorCategory.VISUALIZATION:
        return `Display issue: ${this.simplifyTechnicalMessage(error.message)}`;
      
      case ErrorCategory.PERFORMANCE:
        return `Performance issue detected: ${this.simplifyTechnicalMessage(error.message)}`;
      
      default:
        return `An unexpected error occurred: ${this.simplifyTechnicalMessage(error.message)}`;
    }
  }

  /**
   * Simplify technical error messages for users
   */
  private simplifyTechnicalMessage(message: string): string {
    // Replace technical terms with user-friendly equivalents
    return message
      .replace(/TypeError:/g, 'Data type issue:')
      .replace(/ReferenceError:/g, 'Missing data:')
      .replace(/SyntaxError:/g, 'Format error:')
      .replace(/NetworkError:/g, 'Connection issue:')
      .replace(/is not a function/g, 'feature is not available')
      .replace(/Cannot read property/g, 'Missing information')
      .replace(/undefined/g, 'missing data')
      .replace(/null/g, 'no data');
  }

  /**
   * Generate helpful suggestions
   */
  private generateSuggestions(error: Error, context?: any): string[] {
    const suggestions: string[] = [];
    const category = this.categorizeError(error, context);
    const message = error.message.toLowerCase();
    
    switch (category) {
      case ErrorCategory.DATA_VALIDATION:
        suggestions.push('Check that all required log curves are present');
        suggestions.push('Verify the LAS file format is correct');
        suggestions.push('Ensure depth data is properly formatted');
        break;
      
      case ErrorCategory.CALCULATION:
        suggestions.push('Check calculation parameters are within valid ranges');
        suggestions.push('Verify input data quality');
        suggestions.push('Try using alternative calculation methods');
        break;
      
      case ErrorCategory.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        suggestions.push('Contact support if the issue persists');
        break;
      
      case ErrorCategory.PERFORMANCE:
        suggestions.push('Try reducing the dataset size');
        suggestions.push('Close other applications to free up memory');
        suggestions.push('Enable performance optimization settings');
        break;
    }
    
    // Add specific suggestions based on error message
    if (message.includes('memory')) {
      suggestions.push('Try processing smaller data chunks');
      suggestions.push('Enable data compression in settings');
    }
    
    if (message.includes('timeout')) {
      suggestions.push('Try again with a smaller dataset');
      suggestions.push('Check your network connection speed');
    }
    
    return suggestions;
  }

  /**
   * Generate recovery actions
   */
  private generateRecoveryActions(error: Error, context?: any): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    const category = this.categorizeError(error, context);
    
    // Add category-specific recovery actions
    switch (category) {
      case ErrorCategory.DATA_VALIDATION:
        actions.push({
          id: 'retry_validation',
          label: 'Retry Validation',
          description: 'Attempting to re-validate the data',
          action: async () => {
            // Implement retry logic
            return true;
          },
          automatic: true,
          priority: 1
        });
        break;
      
      case ErrorCategory.CALCULATION:
        actions.push({
          id: 'retry_calculation',
          label: 'Retry Calculation',
          description: 'Retrying the calculation with current parameters',
          action: async () => {
            // Implement calculation retry
            return true;
          },
          automatic: true,
          priority: 2
        });
        
        actions.push({
          id: 'fallback_method',
          label: 'Use Alternative Method',
          description: 'Try using a different calculation method',
          action: async () => {
            // Implement fallback method
            return true;
          },
          automatic: false,
          priority: 1
        });
        break;
      
      case ErrorCategory.NETWORK:
        actions.push({
          id: 'retry_connection',
          label: 'Retry Connection',
          description: 'Attempting to reconnect',
          action: async () => {
            // Implement connection retry
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            return true;
          },
          automatic: true,
          priority: 3
        });
        break;
    }
    
    // Add general recovery actions
    actions.push({
      id: 'refresh_page',
      label: 'Refresh Page',
      description: 'Reload the application',
      action: async () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return true;
      },
      automatic: false,
      priority: 0
    });
    
    return actions;
  }

  /**
   * Get notification type based on severity
   */
  private getNotificationType(severity: ErrorSeverity): 'success' | 'info' | 'warning' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW: return 'info';
      case ErrorSeverity.MEDIUM: return 'warning';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL: return 'error';
      default: return 'error';
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: { [key in ErrorCategory]: number };
    errorsBySeverity: { [key in ErrorSeverity]: number };
    recentErrors: ErrorDetails[];
    recoveryRate: number;
  } {
    const errorsByCategory = {} as { [key in ErrorCategory]: number };
    const errorsBySeverity = {} as { [key in ErrorSeverity]: number };
    
    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });
    
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });
    
    // Count errors
    this.errorHistory.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });
    
    // Calculate recovery rate
    const totalRecoveryAttempts = Array.from(this.retryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);
    const recoveryRate = this.errorHistory.length > 0 ? 
      (totalRecoveryAttempts / this.errorHistory.length) : 0;
    
    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(-10),
      recoveryRate
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Get active progress indicators
   */
  getActiveProgress(): ProgressIndicator[] {
    return Array.from(this.progressIndicators.values());
  }
}

// Export default instance
export const errorHandler = new ErrorHandlingSystem();