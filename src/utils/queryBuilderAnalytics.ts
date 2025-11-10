/**
 * Query Builder Analytics Tracking
 * 
 * Tracks usage events, performance metrics, and user behavior
 * for the OSDU Query Builder feature.
 * 
 * Requirements: 15.1, 15.2, 15.3
 */

export interface QueryBuilderEvent {
  id: string;
  type: 'open' | 'close' | 'template_select' | 'query_execute' | 'query_error' | 'field_change' | 'operator_change';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface QueryExecutionMetrics {
  queryId: string;
  query: string;
  dataType: string;
  criteriaCount: number;
  templateUsed?: string;
  executionTimeMs: number;
  resultCount: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  timestamp: Date;
}

export interface TemplateUsageMetrics {
  templateId: string;
  templateName: string;
  usageCount: number;
  lastUsed: Date;
  avgExecutionTimeMs: number;
  avgResultCount: number;
  successRate: number;
}

export interface FieldUsageMetrics {
  fieldPath: string;
  fieldLabel: string;
  dataType: string;
  usageCount: number;
  lastUsed: Date;
  mostCommonOperators: { operator: string; count: number }[];
}

export class QueryBuilderAnalytics {
  private static EVENTS_KEY = 'osdu_query_builder_events';
  private static EXECUTIONS_KEY = 'osdu_query_builder_executions';
  private static MAX_EVENTS = 1000;
  private static MAX_EXECUTIONS = 500;

  /**
   * Track a query builder event
   */
  static trackEvent(
    type: QueryBuilderEvent['type'],
    metadata?: Record<string, any>
  ): void {
    const event: QueryBuilderEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      metadata
    };

    const events = this.getEvents();
    events.unshift(event);

    // Keep only recent events
    const trimmed = events.slice(0, this.MAX_EVENTS);
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(trimmed));

    console.log('📊 Query Builder Event:', type, metadata);
  }

  /**
   * Track query execution with performance metrics
   */
  static trackQueryExecution(
    query: string,
    dataType: string,
    criteriaCount: number,
    executionTimeMs: number,
    resultCount: number,
    success: boolean,
    templateUsed?: string,
    errorType?: string,
    errorMessage?: string
  ): void {
    const execution: QueryExecutionMetrics = {
      queryId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      dataType,
      criteriaCount,
      templateUsed,
      executionTimeMs,
      resultCount,
      success,
      errorType,
      errorMessage,
      timestamp: new Date()
    };

    const executions = this.getExecutions();
    executions.unshift(execution);

    // Keep only recent executions
    const trimmed = executions.slice(0, this.MAX_EXECUTIONS);
    localStorage.setItem(this.EXECUTIONS_KEY, JSON.stringify(trimmed));

    console.log('📊 Query Execution Tracked:', {
      success,
      executionTimeMs,
      resultCount,
      criteriaCount
    });
  }

  /**
   * Get all tracked events
   */
  static getEvents(): QueryBuilderEvent[] {
    const stored = localStorage.getItem(this.EVENTS_KEY);
    if (!stored) return [];

    try {
      const events = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return events.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get all query executions
   */
  static getExecutions(): QueryExecutionMetrics[] {
    const stored = localStorage.getItem(this.EXECUTIONS_KEY);
    if (!stored) return [];

    try {
      const executions = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return executions.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get template usage statistics
   */
  static getTemplateUsageStats(): TemplateUsageMetrics[] {
    const executions = this.getExecutions();
    const templateStats = new Map<string, {
      name: string;
      count: number;
      totalTime: number;
      totalResults: number;
      successCount: number;
      lastUsed: Date;
    }>();

    executions.forEach(exec => {
      if (!exec.templateUsed) return;

      const existing = templateStats.get(exec.templateUsed) || {
        name: exec.templateUsed,
        count: 0,
        totalTime: 0,
        totalResults: 0,
        successCount: 0,
        lastUsed: exec.timestamp
      };

      existing.count++;
      existing.totalTime += exec.executionTimeMs;
      existing.totalResults += exec.resultCount;
      if (exec.success) existing.successCount++;
      if (exec.timestamp > existing.lastUsed) {
        existing.lastUsed = exec.timestamp;
      }

      templateStats.set(exec.templateUsed, existing);
    });

    return Array.from(templateStats.entries()).map(([id, stats]) => ({
      templateId: id,
      templateName: stats.name,
      usageCount: stats.count,
      lastUsed: stats.lastUsed,
      avgExecutionTimeMs: stats.count > 0 ? stats.totalTime / stats.count : 0,
      avgResultCount: stats.count > 0 ? stats.totalResults / stats.count : 0,
      successRate: stats.count > 0 ? stats.successCount / stats.count : 0
    }));
  }

  /**
   * Get field usage statistics
   */
  static getFieldUsageStats(): FieldUsageMetrics[] {
    const events = this.getEvents();
    const fieldStats = new Map<string, {
      label: string;
      dataType: string;
      count: number;
      lastUsed: Date;
      operators: Map<string, number>;
    }>();

    events.forEach(event => {
      if (event.type === 'field_change' && event.metadata?.field) {
        const field = event.metadata.field;
        const existing = fieldStats.get(field) || {
          label: event.metadata.fieldLabel || field,
          dataType: event.metadata.dataType || 'unknown',
          count: 0,
          lastUsed: event.timestamp,
          operators: new Map()
        };

        existing.count++;
        if (event.timestamp > existing.lastUsed) {
          existing.lastUsed = event.timestamp;
        }

        fieldStats.set(field, existing);
      }

      if (event.type === 'operator_change' && event.metadata?.field && event.metadata?.operator) {
        const field = event.metadata.field;
        const operator = event.metadata.operator;
        const existing = fieldStats.get(field);
        
        if (existing) {
          const opCount = existing.operators.get(operator) || 0;
          existing.operators.set(operator, opCount + 1);
        }
      }
    });

    return Array.from(fieldStats.entries()).map(([path, stats]) => ({
      fieldPath: path,
      fieldLabel: stats.label,
      dataType: stats.dataType,
      usageCount: stats.count,
      lastUsed: stats.lastUsed,
      mostCommonOperators: Array.from(stats.operators.entries())
        .map(([operator, count]) => ({ operator, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }));
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    errorType: string;
    count: number;
    lastOccurred: Date;
    exampleMessage: string;
  }[] {
    const executions = this.getExecutions();
    const errorStats = new Map<string, {
      count: number;
      lastOccurred: Date;
      exampleMessage: string;
    }>();

    executions.forEach(exec => {
      if (!exec.success && exec.errorType) {
        const existing = errorStats.get(exec.errorType) || {
          count: 0,
          lastOccurred: exec.timestamp,
          exampleMessage: exec.errorMessage || 'Unknown error'
        };

        existing.count++;
        if (exec.timestamp > existing.lastOccurred) {
          existing.lastOccurred = exec.timestamp;
          existing.exampleMessage = exec.errorMessage || 'Unknown error';
        }

        errorStats.set(exec.errorType, existing);
      }
    });

    return Array.from(errorStats.entries())
      .map(([errorType, stats]) => ({
        errorType,
        ...stats
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get overall usage statistics
   */
  static getOverallStats(): {
    totalOpens: number;
    totalExecutions: number;
    totalSuccessfulExecutions: number;
    totalFailedExecutions: number;
    avgExecutionTimeMs: number;
    avgResultCount: number;
    successRate: number;
    mostUsedTemplate: string | null;
    mostUsedField: string | null;
    mostCommonError: string | null;
  } {
    const events = this.getEvents();
    const executions = this.getExecutions();

    const totalOpens = events.filter(e => e.type === 'open').length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success);
    const totalSuccessfulExecutions = successfulExecutions.length;
    const totalFailedExecutions = totalExecutions - totalSuccessfulExecutions;

    const avgExecutionTimeMs = totalExecutions > 0
      ? executions.reduce((sum, e) => sum + e.executionTimeMs, 0) / totalExecutions
      : 0;

    const avgResultCount = totalSuccessfulExecutions > 0
      ? successfulExecutions.reduce((sum, e) => sum + e.resultCount, 0) / totalSuccessfulExecutions
      : 0;

    const successRate = totalExecutions > 0
      ? totalSuccessfulExecutions / totalExecutions
      : 0;

    const templateStats = this.getTemplateUsageStats();
    const mostUsedTemplate = templateStats.length > 0
      ? templateStats.sort((a, b) => b.usageCount - a.usageCount)[0].templateName
      : null;

    const fieldStats = this.getFieldUsageStats();
    const mostUsedField = fieldStats.length > 0
      ? fieldStats.sort((a, b) => b.usageCount - a.usageCount)[0].fieldLabel
      : null;

    const errorStats = this.getErrorStats();
    const mostCommonError = errorStats.length > 0
      ? errorStats[0].errorType
      : null;

    return {
      totalOpens,
      totalExecutions,
      totalSuccessfulExecutions,
      totalFailedExecutions,
      avgExecutionTimeMs,
      avgResultCount,
      successRate,
      mostUsedTemplate,
      mostUsedField,
      mostCommonError
    };
  }

  /**
   * Clear all analytics data
   */
  static clearAll(): void {
    localStorage.removeItem(this.EVENTS_KEY);
    localStorage.removeItem(this.EXECUTIONS_KEY);
    console.log('📊 Analytics data cleared');
  }

  /**
   * Export analytics data as JSON
   */
  static exportData(): {
    events: QueryBuilderEvent[];
    executions: QueryExecutionMetrics[];
    exportedAt: Date;
  } {
    return {
      events: this.getEvents(),
      executions: this.getExecutions(),
      exportedAt: new Date()
    };
  }
}
