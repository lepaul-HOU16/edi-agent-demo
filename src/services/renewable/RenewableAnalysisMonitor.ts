/**
 * Comprehensive monitoring and logging service for renewable energy analysis operations
 * Tracks performance metrics, success rates, and operational health
 * Based on requirements 14.4, 14.5
 */

export interface PerformanceMetrics {
  operationId: string;
  operationType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
  errorType?: string;
  dataSize?: number;
  featureCount?: number;
  memoryUsage?: number;
  metadata?: Record<string, any>;
}

export interface SuccessMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  averageResponseTime: number;
  featureCountStats: {
    min: number;
    max: number;
    average: number;
    total: number;
  };
  dataSourceBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
}

export interface OperationContext {
  userId?: string;
  sessionId?: string;
  analysisType: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  requestId?: string;
  userAgent?: string;
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class RenewableAnalysisMonitor {
  private static instance: RenewableAnalysisMonitor;
  private performanceData: Map<string, PerformanceMetrics> = new Map();
  private successMetrics: SuccessMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    successRate: 0,
    averageResponseTime: 0,
    featureCountStats: { min: 0, max: 0, average: 0, total: 0 },
    dataSourceBreakdown: {},
    errorBreakdown: {}
  };
  private alertThresholds: AlertThreshold[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {
    this.initializeAlertThresholds();
    this.startPeriodicReporting();
  }

  public static getInstance(): RenewableAnalysisMonitor {
    if (!RenewableAnalysisMonitor.instance) {
      RenewableAnalysisMonitor.instance = new RenewableAnalysisMonitor();
    }
    return RenewableAnalysisMonitor.instance;
  }

  /**
   * Start tracking a renewable analysis operation
   */
  public startOperation(
    operationType: string, 
    context: OperationContext
  ): string {
    const operationId = this.generateOperationId(operationType, context);
    
    const metrics: PerformanceMetrics = {
      operationId,
      operationType,
      startTime: new Date(),
      success: false,
      metadata: {
        ...context,
        userAgent: context.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    this.performanceData.set(operationId, metrics);
    
    this.logOperation('START', operationType, {
      operationId,
      analysisType: context.analysisType,
      location: context.location,
      userId: context.userId,
      sessionId: context.sessionId
    });

    return operationId;
  }

  /**
   * Complete tracking of a successful operation
   */
  public completeOperation(
    operationId: string,
    result: {
      featureCount?: number;
      dataSource?: string;
      dataSize?: number;
      visualizationCount?: number;
      metadata?: Record<string, any>;
    }
  ): void {
    const metrics = this.performanceData.get(operationId);
    if (!metrics) {
      console.warn(`Operation ${operationId} not found for completion`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - metrics.startTime.getTime();

    // Update metrics
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.success = true;
    metrics.featureCount = result.featureCount;
    metrics.dataSize = result.dataSize;
    metrics.memoryUsage = this.getCurrentMemoryUsage();
    metrics.metadata = { ...metrics.metadata, ...result.metadata };

    // Update success metrics
    this.updateSuccessMetrics(metrics, result);

    this.logOperation('COMPLETE', metrics.operationType, {
      operationId,
      duration,
      featureCount: result.featureCount,
      dataSource: result.dataSource,
      dataSize: result.dataSize,
      success: true
    });

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics);

    // Clean up old data
    this.performanceData.delete(operationId);
  }

  /**
   * Mark operation as failed
   */
  public failOperation(
    operationId: string,
    error: {
      type: string;
      message: string;
      code?: string;
      statusCode?: number;
      metadata?: Record<string, any>;
    }
  ): void {
    const metrics = this.performanceData.get(operationId);
    if (!metrics) {
      console.warn(`Operation ${operationId} not found for failure`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - metrics.startTime.getTime();

    // Update metrics
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.success = false;
    metrics.errorType = error.type;
    metrics.memoryUsage = this.getCurrentMemoryUsage();
    metrics.metadata = { ...metrics.metadata, ...error.metadata };

    // Update failure metrics
    this.updateFailureMetrics(metrics, error);

    this.logOperation('FAIL', metrics.operationType, {
      operationId,
      duration,
      errorType: error.type,
      errorMessage: error.message,
      statusCode: error.statusCode,
      success: false
    });

    // Check for failure alerts
    this.checkFailureAlerts(metrics, error);

    // Clean up old data
    this.performanceData.delete(operationId);
  }

  /**
   * Log detailed operation information
   */
  public logOperation(
    level: 'START' | 'COMPLETE' | 'FAIL' | 'INFO' | 'WARN' | 'ERROR',
    operationType: string,
    details: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'RenewableAnalysis',
      operationType,
      ...details
    };

    // Console logging with appropriate level
    switch (level) {
      case 'START':
      case 'INFO':
        console.info(`[RENEWABLE_ANALYSIS] ${operationType}:`, logEntry);
        break;
      case 'COMPLETE':
        console.log(`[RENEWABLE_ANALYSIS] ${operationType} completed:`, logEntry);
        break;
      case 'WARN':
        console.warn(`[RENEWABLE_ANALYSIS] ${operationType} warning:`, logEntry);
        break;
      case 'FAIL':
      case 'ERROR':
        console.error(`[RENEWABLE_ANALYSIS] ${operationType} failed:`, logEntry);
        break;
    }

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService(logEntry);
    }
  }

  /**
   * Log performance timing for specific operations
   */
  public logPerformanceTiming(
    operation: string,
    timing: number,
    metadata?: Record<string, any>
  ): void {
    this.logOperation('INFO', 'PERFORMANCE_TIMING', {
      operation,
      timing,
      unit: 'milliseconds',
      ...metadata
    });

    // Check if timing exceeds thresholds
    if (timing > 5000) { // 5 seconds
      this.logOperation('WARN', 'SLOW_OPERATION', {
        operation,
        timing,
        threshold: 5000,
        ...metadata
      });
    }
  }

  /**
   * Log visualization generation metrics
   */
  public logVisualizationMetrics(
    visualizationType: string,
    metrics: {
      generationTime: number;
      dataPoints: number;
      renderingEngine: string;
      success: boolean;
      errorMessage?: string;
    }
  ): void {
    this.logOperation(metrics.success ? 'INFO' : 'ERROR', 'VISUALIZATION_GENERATION', {
      visualizationType,
      generationTime: metrics.generationTime,
      dataPoints: metrics.dataPoints,
      renderingEngine: metrics.renderingEngine,
      success: metrics.success,
      errorMessage: metrics.errorMessage
    });
  }

  /**
   * Log data source usage statistics
   */
  public logDataSourceUsage(
    dataSource: string,
    metrics: {
      requestCount: number;
      successCount: number;
      failureCount: number;
      averageResponseTime: number;
      dataQuality: 'high' | 'medium' | 'low';
    }
  ): void {
    this.logOperation('INFO', 'DATA_SOURCE_USAGE', {
      dataSource,
      requestCount: metrics.requestCount,
      successCount: metrics.successCount,
      failureCount: metrics.failureCount,
      successRate: metrics.successCount / metrics.requestCount,
      averageResponseTime: metrics.averageResponseTime,
      dataQuality: metrics.dataQuality
    });
  }

  /**
   * Log user workflow progression
   */
  public logWorkflowStep(
    workflowId: string,
    step: string,
    metrics: {
      stepDuration: number;
      userInteractions: number;
      completionRate: number;
      nextStep?: string;
    }
  ): void {
    this.logOperation('INFO', 'WORKFLOW_STEP', {
      workflowId,
      step,
      stepDuration: metrics.stepDuration,
      userInteractions: metrics.userInteractions,
      completionRate: metrics.completionRate,
      nextStep: metrics.nextStep
    });
  }

  /**
   * Get current success metrics
   */
  public getSuccessMetrics(): SuccessMetrics {
    return { ...this.successMetrics };
  }

  /**
   * Get performance summary for a time period
   */
  public getPerformanceSummary(hours: number = 24): {
    totalOperations: number;
    averageResponseTime: number;
    successRate: number;
    topErrors: Array<{ error: string; count: number }>;
    slowestOperations: Array<{ operation: string; duration: number }>;
  } {
    // In a real implementation, this would query stored metrics
    // For now, return current metrics
    const topErrors = Object.entries(this.successMetrics.errorBreakdown)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOperations: this.successMetrics.totalOperations,
      averageResponseTime: this.successMetrics.averageResponseTime,
      successRate: this.successMetrics.successRate,
      topErrors,
      slowestOperations: [] // Would be populated from stored data
    };
  }

  /**
   * Generate health check report
   */
  public generateHealthReport(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: SuccessMetrics;
    alerts: Array<{ severity: string; message: string; timestamp: Date }>;
    recommendations: string[];
  } {
    const alerts: Array<{ severity: string; message: string; timestamp: Date }> = [];
    const recommendations: string[] = [];

    // Check success rate
    if (this.successMetrics.successRate < 0.95) {
      alerts.push({
        severity: 'high',
        message: `Success rate is ${(this.successMetrics.successRate * 100).toFixed(1)}%, below 95% threshold`,
        timestamp: new Date()
      });
      recommendations.push('Investigate recent failures and implement fixes');
    }

    // Check response time
    if (this.successMetrics.averageResponseTime > 3000) {
      alerts.push({
        severity: 'medium',
        message: `Average response time is ${this.successMetrics.averageResponseTime}ms, above 3s threshold`,
        timestamp: new Date()
      });
      recommendations.push('Optimize slow operations and consider caching');
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (alerts.some(a => a.severity === 'high')) {
      status = 'unhealthy';
    } else if (alerts.some(a => a.severity === 'medium')) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.successMetrics,
      alerts,
      recommendations
    };
  }

  /**
   * Initialize alert thresholds
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds = [
      {
        metric: 'response_time',
        threshold: 5000,
        comparison: 'greater_than',
        severity: 'medium',
        description: 'Response time exceeds 5 seconds'
      },
      {
        metric: 'success_rate',
        threshold: 0.95,
        comparison: 'less_than',
        severity: 'high',
        description: 'Success rate below 95%'
      },
      {
        metric: 'error_rate',
        threshold: 0.05,
        comparison: 'greater_than',
        severity: 'medium',
        description: 'Error rate above 5%'
      },
      {
        metric: 'feature_count',
        threshold: 10,
        comparison: 'less_than',
        severity: 'low',
        description: 'Low feature count may indicate data quality issues'
      }
    ];
  }

  /**
   * Update success metrics
   */
  private updateSuccessMetrics(metrics: PerformanceMetrics, result: any): void {
    this.successMetrics.totalOperations++;
    this.successMetrics.successfulOperations++;
    
    // Update response time average
    const totalTime = this.successMetrics.averageResponseTime * (this.successMetrics.totalOperations - 1);
    this.successMetrics.averageResponseTime = (totalTime + (metrics.duration || 0)) / this.successMetrics.totalOperations;
    
    // Update success rate
    this.successMetrics.successRate = this.successMetrics.successfulOperations / this.successMetrics.totalOperations;
    
    // Update feature count stats
    if (metrics.featureCount) {
      this.updateFeatureCountStats(metrics.featureCount);
    }
    
    // Update data source breakdown
    if (result.dataSource) {
      this.successMetrics.dataSourceBreakdown[result.dataSource] = 
        (this.successMetrics.dataSourceBreakdown[result.dataSource] || 0) + 1;
    }
  }

  /**
   * Update failure metrics
   */
  private updateFailureMetrics(metrics: PerformanceMetrics, error: any): void {
    this.successMetrics.totalOperations++;
    this.successMetrics.failedOperations++;
    
    // Update success rate
    this.successMetrics.successRate = this.successMetrics.successfulOperations / this.successMetrics.totalOperations;
    
    // Update error breakdown
    if (error.type) {
      this.successMetrics.errorBreakdown[error.type] = 
        (this.successMetrics.errorBreakdown[error.type] || 0) + 1;
    }
  }

  /**
   * Update feature count statistics
   */
  private updateFeatureCountStats(featureCount: number): void {
    const stats = this.successMetrics.featureCountStats;
    
    if (stats.min === 0 || featureCount < stats.min) {
      stats.min = featureCount;
    }
    
    if (featureCount > stats.max) {
      stats.max = featureCount;
    }
    
    stats.total += featureCount;
    stats.average = stats.total / this.successMetrics.successfulOperations;
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    if (metrics.duration && metrics.duration > 5000) {
      this.logOperation('WARN', 'PERFORMANCE_ALERT', {
        operationId: metrics.operationId,
        operationType: metrics.operationType,
        duration: metrics.duration,
        threshold: 5000,
        severity: 'medium'
      });
    }
  }

  /**
   * Check for failure alerts
   */
  private checkFailureAlerts(metrics: PerformanceMetrics, error: any): void {
    // Check if error rate is increasing
    const errorRate = this.successMetrics.failedOperations / this.successMetrics.totalOperations;
    if (errorRate > 0.1) { // 10% error rate
      this.logOperation('ERROR', 'ERROR_RATE_ALERT', {
        errorRate,
        threshold: 0.1,
        severity: 'high',
        recentError: error.type
      });
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(operationType: string, context: OperationContext): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const sessionPrefix = context.sessionId ? context.sessionId.substr(0, 8) : 'unknown';
    return `${operationType}_${sessionPrefix}_${timestamp}_${random}`;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Send metrics to monitoring service (placeholder)
   */
  private sendToMonitoringService(logEntry: any): void {
    // In production, this would send to CloudWatch, Datadog, etc.
    // For now, just log that it would be sent
    if (this.isProduction) {
      console.log('Would send to monitoring service:', logEntry);
    }
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Report metrics every 5 minutes in production
    if (this.isProduction) {
      setInterval(() => {
        this.logOperation('INFO', 'PERIODIC_METRICS_REPORT', {
          metrics: this.successMetrics,
          timestamp: new Date().toISOString()
        });
      }, 5 * 60 * 1000); // 5 minutes
    }
  }
}

/**
 * Convenience functions for common monitoring operations
 */
export const renewableMonitor = RenewableAnalysisMonitor.getInstance();

export const trackRenewableOperation = (
  operationType: string,
  context: OperationContext
) => renewableMonitor.startOperation(operationType, context);

export const completeRenewableOperation = (
  operationId: string,
  result: any
) => renewableMonitor.completeOperation(operationId, result);

export const failRenewableOperation = (
  operationId: string,
  error: any
) => renewableMonitor.failOperation(operationId, error);

export const logRenewablePerformance = (
  operation: string,
  timing: number,
  metadata?: Record<string, any>
) => renewableMonitor.logPerformanceTiming(operation, timing, metadata);