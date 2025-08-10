/**
 * Legal Tag Logger
 * 
 * Specialized logging utility for legal tag operations with structured logging,
 * performance tracking, and debug information collection.
 */

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  operation: string;
  message: string;
  data?: any;
  duration?: number;
  context?: {
    dataPartition?: string;
    legalTagId?: string;
    queryType?: 'primary' | 'fallback';
    endpoint?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface OperationMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorType?: string;
  retryCount?: number;
}

export class LegalTagLogger {
  private logs: LogEntry[] = [];
  private metrics: Map<string, OperationMetrics> = new Map();
  private readonly MAX_LOGS = 1000; // Keep last 1000 log entries
  private readonly SERVICE_NAME = 'legal-tagging';
  
  /**
   * Log debug information
   */
  debug(operation: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog('DEBUG', operation, message, data, context);
  }

  /**
   * Log informational messages
   */
  info(operation: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog('INFO', operation, message, data, context);
  }

  /**
   * Log successful operations with detailed information in development mode
   */
  logSuccess(operation: string, message: string, data?: any, context?: LogEntry['context']): void {
    // Always log success at INFO level
    this.info(operation, message, data, context);
    
    // In development mode, add additional detailed logging
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
      this.debug(operation, `SUCCESS DETAILS: ${message}`, {
        ...data,
        successTimestamp: new Date().toISOString(),
        developmentMode: true,
        additionalContext: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          ...context
        }
      }, context);
    }
  }

  /**
   * Log warning messages
   */
  warn(operation: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog('WARN', operation, message, data, context);
  }

  /**
   * Log error messages
   */
  error(operation: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog('ERROR', operation, message, data, context);
  }

  /**
   * Start tracking an operation
   */
  startOperation(operation: string, context?: LogEntry['context']): string {
    const operationId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.set(operationId, {
      operation,
      startTime: performance.now(),
      success: false
    });

    this.info(operation, `Starting operation: ${operation}`, {
      operationId,
      context
    }, context);

    return operationId;
  }

  /**
   * End tracking an operation successfully
   */
  endOperation(operationId: string, result?: any, context?: LogEntry['context']): void {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      this.warn('unknown', `Operation ${operationId} not found in metrics`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.success = true;

    // Use logSuccess for detailed development logging
    this.logSuccess(metric.operation, `Operation completed successfully`, {
      operationId,
      duration: `${duration.toFixed(2)}ms`,
      result: this.sanitizeLogData(result),
      performanceCategory: this.categorizePerformance(duration),
      operationMetrics: {
        startTime: metric.startTime,
        endTime,
        duration
      }
    }, context);
  }

  /**
   * End tracking an operation with error
   */
  endOperationWithError(operationId: string, error: any, errorType?: string, context?: LogEntry['context']): void {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      this.warn('unknown', `Operation ${operationId} not found in metrics`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.success = false;
    metric.errorType = errorType;

    this.error(metric.operation, `Operation failed`, {
      operationId,
      duration: `${duration.toFixed(2)}ms`,
      errorType,
      error: this.sanitizeLogData(error)
    }, context);
  }

  /**
   * Log GraphQL query execution
   */
  logGraphQLQuery(
    operation: string,
    query: string,
    variables: any,
    endpoint: string,
    context?: LogEntry['context']
  ): void {
    this.debug(operation, 'Executing GraphQL query', {
      query: this.formatGraphQLQuery(query),
      variables: this.sanitizeLogData(variables),
      endpoint
    }, context);
  }

  /**
   * Log GraphQL response
   */
  logGraphQLResponse(
    operation: string,
    response: any,
    duration?: number,
    context?: LogEntry['context']
  ): void {
    const hasErrors = response?.errors && response.errors.length > 0;
    const level = hasErrors ? 'WARN' : 'DEBUG';
    
    this[level.toLowerCase() as 'warn' | 'debug'](operation, 'GraphQL response received', {
      hasData: !!response?.data,
      hasErrors,
      errors: hasErrors ? response.errors : undefined,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      duration: duration ? `${duration.toFixed(2)}ms` : undefined
    }, context);
  }

  /**
   * Log authentication events
   */
  logAuth(operation: string, event: 'token_refresh' | 'token_expired' | 'auth_success' | 'auth_failure', context?: LogEntry['context']): void {
    const level = event.includes('failure') || event.includes('expired') ? 'WARN' : 'INFO';
    
    this[level.toLowerCase() as 'warn' | 'info'](operation, `Authentication event: ${event}`, {
      event,
      timestamp: new Date().toISOString()
    }, context);
  }

  /**
   * Log retry attempts
   */
  logRetry(operation: string, attempt: number, reason: string, delay: number, context?: LogEntry['context']): void {
    this.info(operation, `Retry attempt ${attempt}`, {
      attempt,
      reason,
      delay: `${delay}ms`,
      nextRetryAt: new Date(Date.now() + delay).toISOString()
    }, context);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, metrics: {
    queryTime?: number;
    networkTime?: number;
    parseTime?: number;
    totalTime?: number;
    cacheHit?: boolean;
  }, context?: LogEntry['context']): void {
    this.info(operation, 'Performance metrics', {
      ...metrics,
      queryTime: metrics.queryTime ? `${metrics.queryTime.toFixed(2)}ms` : undefined,
      networkTime: metrics.networkTime ? `${metrics.networkTime.toFixed(2)}ms` : undefined,
      parseTime: metrics.parseTime ? `${metrics.parseTime.toFixed(2)}ms` : undefined,
      totalTime: metrics.totalTime ? `${metrics.totalTime.toFixed(2)}ms` : undefined
    }, context);
  }

  /**
   * Get logs for a specific operation
   */
  getOperationLogs(operation: string): LogEntry[] {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get operation metrics
   */
  getOperationMetrics(operation?: string): OperationMetrics[] {
    const allMetrics = Array.from(this.metrics.values());
    return operation 
      ? allMetrics.filter(m => m.operation === operation)
      : allMetrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    operationBreakdown: Record<string, {
      count: number;
      successRate: number;
      averageDuration: number;
    }>;
  } {
    const metrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    const totalOperations = metrics.length;
    const successfulOperations = metrics.filter(m => m.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const averageDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalOperations;

    // Group by operation
    const operationGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
      return groups;
    }, {} as Record<string, OperationMetrics[]>);

    const operationBreakdown = Object.entries(operationGroups).reduce((breakdown, [operation, opMetrics]) => {
      const count = opMetrics.length;
      const successful = opMetrics.filter(m => m.success).length;
      const successRate = successful / count;
      const avgDuration = opMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / count;

      breakdown[operation] = {
        count,
        successRate,
        averageDuration: avgDuration
      };

      return breakdown;
    }, {} as Record<string, { count: number; successRate: number; averageDuration: number; }>);

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageDuration,
      operationBreakdown
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'operation', 'message', 'duration', 'dataPartition', 'legalTagId'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.operation,
        log.message,
        log.duration?.toString() || '',
        log.context?.dataPartition || '',
        log.context?.legalTagId || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      logs: this.logs,
      metrics: Array.from(this.metrics.entries()),
      summary: this.getPerformanceSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Clear old logs to prevent memory issues
   */
  clearOldLogs(): void {
    if (this.logs.length > this.MAX_LOGS) {
      const toRemove = this.logs.length - this.MAX_LOGS;
      this.logs.splice(0, toRemove);
      this.info('logger', `Cleared ${toRemove} old log entries`);
    }

    // Clear old metrics (keep last 100)
    const metricsArray = Array.from(this.metrics.entries());
    if (metricsArray.length > 100) {
      const toRemove = metricsArray.length - 100;
      const oldestKeys = metricsArray
        .sort(([, a], [, b]) => a.startTime - b.startTime)
        .slice(0, toRemove)
        .map(([key]) => key);
      
      oldestKeys.forEach(key => this.metrics.delete(key));
      this.info('logger', `Cleared ${toRemove} old metric entries`);
    }
  }

  /**
   * Add log entry
   */
  private addLog(
    level: LogEntry['level'],
    operation: string,
    message: string,
    data?: any,
    context?: LogEntry['context']
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message,
      data: this.sanitizeLogData(data),
      context
    };

    this.logs.push(logEntry);

    // Console output for development
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
      const consoleMethod = level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
      const prefix = `[${this.SERVICE_NAME}:${operation}]`;
      
      if (data) {
        console[consoleMethod](prefix, message, data);
      } else {
        console[consoleMethod](prefix, message);
      }
    }

    // Clean up old logs periodically
    if (this.logs.length % 100 === 0) {
      this.clearOldLogs();
    }
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeLogData(data: any): any {
    if (!data) return data;

    // Handle different data types
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeLogData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (this.isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
          continue;
        }

        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeLogData(value);
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Check if field contains sensitive information
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'auth',
      'credential',
      'apikey',
      'accesstoken',
      'idtoken'
    ];

    return sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Sanitize string data
   */
  private sanitizeString(str: string): string {
    // Redact potential tokens or keys
    return str.replace(/([a-zA-Z0-9+/]{20,})/g, '[TOKEN_REDACTED]');
  }

  /**
   * Format GraphQL query for logging
   */
  private formatGraphQLQuery(query: string): string {
    // Remove extra whitespace and format for readability
    return query
      .replace(/\s+/g, ' ')
      .replace(/{\s+/g, '{ ')
      .replace(/\s+}/g, ' }')
      .trim();
  }

  /**
   * Categorize performance based on duration
   */
  private categorizePerformance(duration: number): string {
    if (duration < 100) return 'excellent';
    if (duration < 300) return 'good';
    if (duration < 1000) return 'acceptable';
    if (duration < 3000) return 'slow';
    return 'very_slow';
  }
}

// Export singleton instance
export const legalTagLogger = new LegalTagLogger();

// Export types for use in other modules
export type { LogEntry, OperationMetrics };