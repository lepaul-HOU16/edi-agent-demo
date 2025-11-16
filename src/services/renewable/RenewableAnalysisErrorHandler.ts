/**
 * Comprehensive error handler for renewable energy analysis operations
 * Implements progressive fallback strategies and detailed error logging
 * Based on requirements 14.1, 14.2, 14.3
 */

import { RenewableErrorHandler, ErrorContext, FormattedError } from '@/utils/renewable/ErrorHandlingUtils';

export interface AnalysisError {
  type: 'OSM_API_ERROR' | 'INTENT_DETECTION_ERROR' | 'VISUALIZATION_ERROR' | 'DATA_QUALITY_ERROR' | 'LAMBDA_ERROR' | 'NETWORK_ERROR';
  message: string;
  code?: string;
  statusCode?: number;
  endpoint?: string;
  originalError?: Error;
  timestamp: Date;
}

export interface AnalysisContext {
  analysisType: string;
  query?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: FormattedError;
  fallbackData?: any;
  retryable: boolean;
  retryAfter?: number;
  fallbackStrategy?: string;
}

export interface OSMError extends AnalysisError {
  type: 'OSM_API_ERROR';
  endpoint: string;
  statusCode: number;
  query?: string;
}

export interface IntentDetectionError extends AnalysisError {
  type: 'INTENT_DETECTION_ERROR';
  query: string;
  confidence?: number;
  alternatives?: string[];
}

export interface VisualizationError extends AnalysisError {
  type: 'VISUALIZATION_ERROR';
  component: string;
  dataSize?: number;
  renderingEngine?: string;
}

export interface DataQualityError extends AnalysisError {
  type: 'DATA_QUALITY_ERROR';
  dataSource: string;
  qualityIssues: string[];
  completeness?: number;
}

export class RenewableAnalysisErrorHandler {
  private static instance: RenewableAnalysisErrorHandler;
  private baseErrorHandler: RenewableErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private baseRetryDelay = 1000; // 1 second

  private constructor() {
    this.baseErrorHandler = RenewableErrorHandler.getInstance();
  }

  public static getInstance(): RenewableAnalysisErrorHandler {
    if (!RenewableAnalysisErrorHandler.instance) {
      RenewableAnalysisErrorHandler.instance = new RenewableAnalysisErrorHandler();
    }
    return RenewableAnalysisErrorHandler.instance;
  }

  /**
   * Main error handling entry point
   */
  public handleAnalysisError(error: AnalysisError, context: AnalysisContext): ErrorResponse {
    // Log the error with full context
    this.logAnalysisError(error, context);

    // Route to specific error handler based on type
    switch (error.type) {
      case 'OSM_API_ERROR':
        return this.handleOSMError(error as OSMError, context);
      case 'INTENT_DETECTION_ERROR':
        return this.handleIntentError(error as IntentDetectionError, context);
      case 'VISUALIZATION_ERROR':
        return this.handleVisualizationError(error as VisualizationError, context);
      case 'DATA_QUALITY_ERROR':
        return this.handleDataQualityError(error as DataQualityError, context);
      case 'LAMBDA_ERROR':
        return this.handleLambdaError(error, context);
      case 'NETWORK_ERROR':
        return this.handleNetworkError(error, context);
      default:
        return this.handleGenericError(error, context);
    }
  }

  /**
   * Handle OSM API specific errors with progressive fallback
   */
  private handleOSMError(error: OSMError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'OSMClient',
      action: 'queryTerrainFeatures',
      metadata: {
        endpoint: error.endpoint,
        statusCode: error.statusCode,
        query: error.query,
        location: context.location
      }
    };

    this.baseErrorHandler.logError(error.originalError || new Error(error.message), errorContext);

    // Progressive fallback strategies
    if (error.statusCode === 429) {
      // Rate limiting - schedule retry with exponential backoff
      return this.scheduleRetryWithBackoff(context, error);
    }

    if (error.statusCode >= 500) {
      // Server error - try alternative endpoint first, then fallback
      return this.tryAlternativeEndpoint(context, error);
    }

    if (error.statusCode === 404 || error.statusCode === 400) {
      // Bad request or not found - provide reduced feature set
      return this.createReducedFeatureSet(context, error);
    }

    // Final fallback with clear labeling
    return this.createSyntheticFallback(context, error);
  }

  /**
   * Handle intent detection errors with user guidance
   */
  private handleIntentError(error: IntentDetectionError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'IntentClassifier',
      action: 'classifyIntent',
      metadata: {
        query: error.query,
        confidence: error.confidence,
        alternatives: error.alternatives
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    // Provide alternative suggestions if available
    if (error.alternatives && error.alternatives.length > 0) {
      formattedError.suggestions = [
        'Try rephrasing your request',
        'Be more specific about the type of analysis you want',
        ...error.alternatives.map(alt => `Try: "${alt}"`)
      ];
    }

    return {
      success: false,
      error: formattedError,
      retryable: true,
      fallbackStrategy: 'user_clarification'
    };
  }

  /**
   * Handle visualization errors with graceful degradation
   */
  private handleVisualizationError(error: VisualizationError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: error.component,
      action: 'renderVisualization',
      metadata: {
        dataSize: error.dataSize,
        renderingEngine: error.renderingEngine
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    // Provide fallback visualization options
    const fallbackData = this.createFallbackVisualization(error, context);

    return {
      success: false,
      error: formattedError,
      fallbackData,
      retryable: true,
      fallbackStrategy: 'simplified_visualization'
    };
  }

  /**
   * Handle data quality errors with partial data processing
   */
  private handleDataQualityError(error: DataQualityError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'DataValidator',
      action: 'validateData',
      metadata: {
        dataSource: error.dataSource,
        qualityIssues: error.qualityIssues,
        completeness: error.completeness
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    // Continue with available data if completeness is acceptable
    if (error.completeness && error.completeness > 0.7) {
      formattedError.message = `Data quality issues detected, but analysis can continue with ${Math.round(error.completeness * 100)}% of the data.`;
      formattedError.severity = 'medium';
      
      return {
        success: false,
        error: formattedError,
        retryable: false,
        fallbackStrategy: 'partial_data_processing'
      };
    }

    return {
      success: false,
      error: formattedError,
      retryable: true,
      fallbackStrategy: 'data_refresh'
    };
  }

  /**
   * Handle Lambda function errors
   */
  private handleLambdaError(error: AnalysisError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'LambdaFunction',
      action: context.analysisType,
      metadata: {
        statusCode: error.statusCode,
        code: error.code
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    // Check if this is a retryable Lambda error
    const retryable = error.statusCode !== 400 && error.statusCode !== 403;

    return {
      success: false,
      error: formattedError,
      retryable,
      fallbackStrategy: retryable ? 'retry_with_backoff' : 'alternative_service'
    };
  }

  /**
   * Handle network connectivity errors
   */
  private handleNetworkError(error: AnalysisError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'NetworkClient',
      action: 'makeRequest',
      metadata: {
        endpoint: error.endpoint
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    return {
      success: false,
      error: formattedError,
      retryable: true,
      retryAfter: this.calculateRetryDelay(context),
      fallbackStrategy: 'retry_with_backoff'
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: AnalysisError, context: AnalysisContext): ErrorResponse {
    const errorContext: ErrorContext = {
      component: 'RenewableAnalysis',
      action: context.analysisType,
      metadata: {
        errorType: error.type
      }
    };

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(error.message), 
      errorContext
    );

    return {
      success: false,
      error: formattedError,
      retryable: false,
      fallbackStrategy: 'manual_intervention'
    };
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetryWithBackoff(context: AnalysisContext, error: AnalysisError): ErrorResponse {
    const retryKey = `${context.analysisType}_${context.sessionId}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;

    if (currentAttempts >= this.maxRetries) {
      this.retryAttempts.delete(retryKey);
      return this.createSyntheticFallback(context, error);
    }

    this.retryAttempts.set(retryKey, currentAttempts + 1);
    const retryDelay = this.baseRetryDelay * Math.pow(2, currentAttempts);

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error(`Rate limited. Retrying in ${retryDelay / 1000} seconds...`),
      { component: 'RetryHandler', action: 'scheduleRetry' }
    );

    return {
      success: false,
      error: formattedError,
      retryable: true,
      retryAfter: retryDelay,
      fallbackStrategy: 'exponential_backoff'
    };
  }

  /**
   * Try alternative endpoint
   */
  private tryAlternativeEndpoint(context: AnalysisContext, error: AnalysisError): ErrorResponse {
    // For 503 errors, go directly to synthetic fallback as alternative endpoints likely won't work
    if (error.statusCode === 503) {
      return this.createSyntheticFallback(context, error);
    }

    const formattedError = this.baseErrorHandler.formatForUser(
      new Error('Primary service unavailable, trying alternative endpoint...'),
      { component: 'EndpointFailover', action: 'tryAlternative' }
    );

    return {
      success: false,
      error: formattedError,
      retryable: true,
      fallbackStrategy: 'alternative_endpoint'
    };
  }

  /**
   * Create reduced feature set for partial data scenarios
   */
  private createReducedFeatureSet(context: AnalysisContext, error: AnalysisError): ErrorResponse {
    const formattedError = this.baseErrorHandler.formatForUser(
      new Error('Full dataset unavailable, providing essential features only'),
      { component: 'DataReducer', action: 'createReducedSet' }
    );

    formattedError.severity = 'medium';
    formattedError.suggestions = [
      'Analysis will continue with essential terrain features',
      'Some advanced features may not be available',
      'Try again later for complete dataset'
    ];

    const fallbackData = {
      features: [],
      metadata: {
        dataSource: 'reduced_osm',
        reliability: 'medium',
        featureCount: 0,
        reason: 'Partial data due to service limitations'
      }
    };

    return {
      success: false,
      error: formattedError,
      fallbackData,
      retryable: true,
      fallbackStrategy: 'reduced_feature_set'
    };
  }

  /**
   * Create synthetic fallback with clear labeling
   */
  private createSyntheticFallback(context: AnalysisContext, error: AnalysisError): ErrorResponse {
    const formattedError = this.baseErrorHandler.formatForUser(
      new Error('SYNTHETIC DATA - Real terrain data unavailable'),
      { component: 'SyntheticFallback', action: 'createFallback' }
    );

    // Override the user-friendly message to include SYNTHETIC DATA warning
    formattedError.message = 'SYNTHETIC DATA - Real terrain data unavailable. This is demonstration data only.';

    formattedError.severity = 'high';
    formattedError.suggestions = [
      'This is synthetic data for demonstration purposes only',
      'Real terrain data is temporarily unavailable',
      'Contact support if this issue persists'
    ];

    const fallbackData = {
      features: this.generateSyntheticFeatures(context),
      metadata: {
        dataSource: 'synthetic_fallback',
        reliability: 'low',
        featureCount: 3,
        reason: error.message,
        warning: 'SYNTHETIC DATA - Not suitable for production analysis'
      }
    };

    return {
      success: false,
      error: formattedError,
      fallbackData,
      retryable: false,
      fallbackStrategy: 'synthetic_data'
    };
  }

  /**
   * Create fallback visualization for rendering errors
   */
  private createFallbackVisualization(error: VisualizationError, context: AnalysisContext): any {
    return {
      type: 'fallback_chart',
      message: 'Simplified visualization due to rendering issues',
      data: {
        error: error.message,
        component: error.component,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate synthetic features for complete fallback
   */
  private generateSyntheticFeatures(context: AnalysisContext): any[] {
    const location = context.location || { latitude: 40.7128, longitude: -74.0060 };
    
    return [
      {
        type: 'Feature',
        properties: {
          name: 'Synthetic Building',
          type: 'building',
          synthetic: true
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [location.longitude - 0.001, location.latitude - 0.001],
            [location.longitude + 0.001, location.latitude - 0.001],
            [location.longitude + 0.001, location.latitude + 0.001],
            [location.longitude - 0.001, location.latitude + 0.001],
            [location.longitude - 0.001, location.latitude - 0.001]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'Synthetic Road',
          type: 'highway',
          synthetic: true
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [location.longitude - 0.002, location.latitude],
            [location.longitude + 0.002, location.latitude]
          ]
        }
      },
      {
        type: 'Feature',
        properties: {
          name: 'Synthetic Water Body',
          type: 'water',
          synthetic: true
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [location.longitude - 0.0015, location.latitude + 0.001],
            [location.longitude - 0.0005, location.latitude + 0.001],
            [location.longitude - 0.0005, location.latitude + 0.002],
            [location.longitude - 0.0015, location.latitude + 0.002],
            [location.longitude - 0.0015, location.latitude + 0.001]
          ]]
        }
      }
    ];
  }

  /**
   * Calculate retry delay based on context
   */
  private calculateRetryDelay(context: AnalysisContext): number {
    const retryKey = `${context.analysisType}_${context.sessionId}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    return this.baseRetryDelay * Math.pow(2, currentAttempts);
  }

  /**
   * Log analysis error with full context
   */
  private logAnalysisError(error: AnalysisError, context: AnalysisContext): void {
    const errorContext: ErrorContext = {
      component: 'RenewableAnalysisErrorHandler',
      action: 'handleAnalysisError',
      metadata: {
        errorType: error.type,
        analysisType: context.analysisType,
        location: context.location,
        timestamp: error.timestamp,
        statusCode: error.statusCode,
        endpoint: error.endpoint
      }
    };

    this.baseErrorHandler.logError(error.originalError || new Error(error.message), errorContext);
  }

  /**
   * Create analysis error from generic error
   */
  public static createAnalysisError(
    type: AnalysisError['type'],
    message: string,
    options: Partial<AnalysisError> = {}
  ): AnalysisError {
    return {
      type,
      message,
      timestamp: new Date(),
      ...options
    };
  }
}

/**
 * Convenience function for handling renewable analysis errors
 */
export const handleRenewableAnalysisError = (
  error: Error | AnalysisError,
  context: AnalysisContext
): ErrorResponse => {
  const handler = RenewableAnalysisErrorHandler.getInstance();
  
  // Convert generic Error to AnalysisError if needed
  const analysisError: AnalysisError = error instanceof Error ? 
    RenewableAnalysisErrorHandler.createAnalysisError('NETWORK_ERROR', error.message, {
      originalError: error
    }) : error;

  return handler.handleAnalysisError(analysisError, context);
};