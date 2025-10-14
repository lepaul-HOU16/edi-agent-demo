/**
 * Error Reporter - Simple error reporting for renewable energy issues
 * 
 * Provides user-friendly error messages and remediation steps for common
 * renewable energy report generation failures.
 */

import { ReportError, ReportErrorHandler } from './ReportErrorHandler';

export interface ErrorReport {
  userMessage: string;
  technicalDetails: string;
  remediationSteps: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  canRetry: boolean;
  timestamp: string;
}

export class ErrorReporter {
  private errorHandler: ReportErrorHandler;

  constructor() {
    this.errorHandler = new ReportErrorHandler();
  }

  /**
   * Generate user-friendly error report
   */
  generateErrorReport(error: any, context: Record<string, any> = {}): ErrorReport {
    const classifiedError = this.errorHandler.classifyError(error, context);
    
    return {
      userMessage: this.errorHandler.getUserMessage(classifiedError),
      technicalDetails: `${classifiedError.code}: ${classifiedError.details}`,
      remediationSteps: this.errorHandler.getRemediationSteps(classifiedError),
      severity: classifiedError.severity,
      canRetry: classifiedError.retryable,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log error for debugging
   */
  logError(error: any, context: Record<string, any> = {}): void {
    const report = this.generateErrorReport(error, context);
    
    console.error('Renewable Energy Error Report:', {
      userMessage: report.userMessage,
      technicalDetails: report.technicalDetails,
      severity: report.severity,
      context,
      timestamp: report.timestamp
    });
  }

  /**
   * Format error for UI display
   */
  formatForUI(error: any, context: Record<string, any> = {}): {
    title: string;
    message: string;
    actions: string[];
    type: 'error' | 'warning';
  } {
    const report = this.generateErrorReport(error, context);
    
    return {
      title: report.severity === 'critical' ? 'Critical Error' : 'Report Generation Failed',
      message: report.userMessage,
      actions: report.remediationSteps,
      type: report.severity === 'critical' ? 'error' : 'warning'
    };
  }
}