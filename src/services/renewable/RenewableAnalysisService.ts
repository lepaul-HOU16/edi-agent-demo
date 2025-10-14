/**
 * Main service that integrates error handling and monitoring for renewable analysis
 * Provides a unified interface for all renewable energy analysis operations
 */

import { 
  RenewableAnalysisErrorHandler, 
  AnalysisError, 
  AnalysisContext, 
  ErrorResponse 
} from './RenewableAnalysisErrorHandler';
import { 
  RenewableAnalysisMonitor, 
  OperationContext, 
  renewableMonitor 
} from './RenewableAnalysisMonitor';

export interface RenewableAnalysisRequest {
  type: 'terrain' | 'wind_rose' | 'wake_analysis' | 'layout_optimization' | 'site_suitability';
  location: {
    latitude: number;
    longitude: number;
  };
  parameters?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface RenewableAnalysisResponse {
  success: boolean;
  data?: any;
  error?: ErrorResponse;
  operationId: string;
  metrics: {
    duration: number;
    featureCount?: number;
    dataSource?: string;
  };
}

export class RenewableAnalysisService {
  private static instance: RenewableAnalysisService;
  private errorHandler: RenewableAnalysisErrorHandler;
  private monitor: RenewableAnalysisMonitor;

  private constructor() {
    this.errorHandler = RenewableAnalysisErrorHandler.getInstance();
    this.monitor = RenewableAnalysisMonitor.getInstance();
  }

  public static getInstance(): RenewableAnalysisService {
    if (!RenewableAnalysisService.instance) {
      RenewableAnalysisService.instance = new RenewableAnalysisService();
    }
    return RenewableAnalysisService.instance;
  }

  /**
   * Execute renewable analysis with comprehensive error handling and monitoring
   */
  public async executeAnalysis(request: RenewableAnalysisRequest): Promise<RenewableAnalysisResponse> {
    const operationContext: OperationContext = {
      userId: request.userId,
      sessionId: request.sessionId,
      analysisType: request.type,
      location: request.location
    };

    const operationId = this.monitor.startOperation(`renewable_${request.type}`, operationContext);
    const startTime = Date.now();

    try {
      // Execute the actual analysis based on type
      const result = await this.performAnalysis(request);
      
      const duration = Date.now() - startTime;
      
      // Complete monitoring
      this.monitor.completeOperation(operationId, {
        featureCount: result.featureCount,
        dataSource: result.dataSource,
        dataSize: result.dataSize,
        visualizationCount: result.visualizationCount
      });

      // Log successful completion
      this.monitor.logOperation('COMPLETE', `renewable_${request.type}`, {
        operationId,
        duration,
        success: true,
        featureCount: result.featureCount,
        dataSource: result.dataSource
      });

      return {
        success: true,
        data: result.data,
        operationId,
        metrics: {
          duration,
          featureCount: result.featureCount,
          dataSource: result.dataSource
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle the error
      const analysisContext: AnalysisContext = {
        analysisType: request.type,
        location: request.location,
        userId: request.userId,
        sessionId: request.sessionId,
        metadata: request.parameters
      };

      const errorResponse = this.handleAnalysisError(error, analysisContext, operationId);

      return {
        success: false,
        error: errorResponse,
        operationId,
        metrics: {
          duration
        }
      };
    }
  }

  /**
   * Handle analysis errors with monitoring integration
   */
  private handleAnalysisError(
    error: unknown, 
    context: AnalysisContext, 
    operationId: string
  ): ErrorResponse {
    // Convert to AnalysisError if needed
    const analysisError = this.convertToAnalysisError(error);
    
    // Handle with error handler
    const errorResponse = this.errorHandler.handleAnalysisError(analysisError, context);
    
    // Update monitoring
    this.monitor.failOperation(operationId, {
      type: analysisError.type,
      message: analysisError.message,
      code: analysisError.code,
      statusCode: analysisError.statusCode
    });

    return errorResponse;
  }

  /**
   * Perform the actual analysis based on type
   */
  private async performAnalysis(request: RenewableAnalysisRequest): Promise<{
    data: any;
    featureCount?: number;
    dataSource?: string;
    dataSize?: number;
    visualizationCount?: number;
  }> {
    switch (request.type) {
      case 'terrain':
        return this.performTerrainAnalysis(request);
      case 'wind_rose':
        return this.performWindRoseAnalysis(request);
      case 'wake_analysis':
        return this.performWakeAnalysis(request);
      case 'layout_optimization':
        return this.performLayoutOptimization(request);
      case 'site_suitability':
        return this.performSiteSuitabilityAnalysis(request);
      default:
        throw new Error(`Unsupported analysis type: ${request.type}`);
    }
  }

  /**
   * Perform terrain analysis with OSM data
   */
  private async performTerrainAnalysis(request: RenewableAnalysisRequest): Promise<any> {
    this.monitor.logOperation('INFO', 'terrain_analysis_start', {
      location: request.location,
      parameters: request.parameters
    });

    try {
      // This would call the actual terrain analysis Lambda function
      // For now, simulate the operation
      const mockResult = {
        data: {
          features: [],
          metadata: {
            dataSource: 'openstreetmap',
            reliability: 'high',
            featureCount: 151
          }
        },
        featureCount: 151,
        dataSource: 'openstreetmap',
        dataSize: 1024 * 50 // 50KB
      };

      this.monitor.logDataSourceUsage('openstreetmap', {
        requestCount: 1,
        successCount: 1,
        failureCount: 0,
        averageResponseTime: 1500,
        dataQuality: 'high'
      });

      return mockResult;
    } catch (error) {
      // Create specific OSM error
      throw RenewableAnalysisErrorHandler.createAnalysisError('OSM_API_ERROR', 
        'Failed to retrieve terrain data from OpenStreetMap', {
        statusCode: 500,
        endpoint: 'overpass-api.de',
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Perform wind rose analysis
   */
  private async performWindRoseAnalysis(request: RenewableAnalysisRequest): Promise<any> {
    this.monitor.logOperation('INFO', 'wind_rose_analysis_start', {
      location: request.location,
      parameters: request.parameters
    });

    try {
      const mockResult = {
        data: {
          windRoseData: [],
          statistics: {},
          visualizations: []
        },
        visualizationCount: 1,
        dataSource: 'wind_resource_database',
        dataSize: 1024 * 25 // 25KB
      };

      this.monitor.logVisualizationMetrics('wind_rose', {
        generationTime: 800,
        dataPoints: 8760, // Hourly data for a year
        renderingEngine: 'plotly',
        success: true
      });

      return mockResult;
    } catch (error) {
      throw RenewableAnalysisErrorHandler.createAnalysisError('VISUALIZATION_ERROR', 
        'Failed to generate wind rose visualization', {
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Perform wake analysis
   */
  private async performWakeAnalysis(request: RenewableAnalysisRequest): Promise<any> {
    this.monitor.logOperation('INFO', 'wake_analysis_start', {
      location: request.location,
      parameters: request.parameters
    });

    try {
      const mockResult = {
        data: {
          wakeEffects: [],
          turbineInteractions: [],
          optimizationRecommendations: []
        },
        visualizationCount: 2,
        dataSource: 'wake_modeling_engine',
        dataSize: 1024 * 75 // 75KB
      };

      this.monitor.logVisualizationMetrics('wake_analysis', {
        generationTime: 1200,
        dataPoints: 500,
        renderingEngine: 'plotly',
        success: true
      });

      return mockResult;
    } catch (error) {
      throw RenewableAnalysisErrorHandler.createAnalysisError('VISUALIZATION_ERROR', 
        'Failed to generate wake analysis visualization', {
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Perform layout optimization
   */
  private async performLayoutOptimization(request: RenewableAnalysisRequest): Promise<any> {
    this.monitor.logOperation('INFO', 'layout_optimization_start', {
      location: request.location,
      parameters: request.parameters
    });

    try {
      const mockResult = {
        data: {
          optimizedLayout: [],
          energyYield: 0,
          constraints: [],
          recommendations: []
        },
        visualizationCount: 1,
        dataSource: 'optimization_engine',
        dataSize: 1024 * 40 // 40KB
      };

      this.monitor.logPerformanceTiming('layout_optimization', 2500, {
        turbineCount: request.parameters?.turbineCount || 10,
        optimizationAlgorithm: 'genetic_algorithm'
      });

      return mockResult;
    } catch (error) {
      throw RenewableAnalysisErrorHandler.createAnalysisError('LAMBDA_ERROR', 
        'Layout optimization service failed', {
        statusCode: 500,
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Perform site suitability analysis
   */
  private async performSiteSuitabilityAnalysis(request: RenewableAnalysisRequest): Promise<any> {
    this.monitor.logOperation('INFO', 'site_suitability_start', {
      location: request.location,
      parameters: request.parameters
    });

    try {
      const mockResult = {
        data: {
          overallScore: 85,
          componentScores: {},
          riskFactors: [],
          recommendations: []
        },
        visualizationCount: 3,
        dataSource: 'suitability_assessment_engine',
        dataSize: 1024 * 60 // 60KB
      };

      this.monitor.logVisualizationMetrics('site_suitability', {
        generationTime: 1800,
        dataPoints: 200,
        renderingEngine: 'plotly',
        success: true
      });

      return mockResult;
    } catch (error) {
      throw RenewableAnalysisErrorHandler.createAnalysisError('DATA_QUALITY_ERROR', 
        'Insufficient data for site suitability assessment', {
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Convert generic error to AnalysisError
   */
  private convertToAnalysisError(error: unknown): AnalysisError {
    if (error && typeof error === 'object' && 'type' in error) {
      return error as AnalysisError;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Categorize error based on message
    let errorType: AnalysisError['type'] = 'NETWORK_ERROR';
    
    if (errorMessage.toLowerCase().includes('osm') || errorMessage.toLowerCase().includes('overpass')) {
      errorType = 'OSM_API_ERROR';
    } else if (errorMessage.toLowerCase().includes('visualization') || errorMessage.toLowerCase().includes('chart')) {
      errorType = 'VISUALIZATION_ERROR';
    } else if (errorMessage.toLowerCase().includes('intent') || errorMessage.toLowerCase().includes('classification')) {
      errorType = 'INTENT_DETECTION_ERROR';
    } else if (errorMessage.toLowerCase().includes('data') || errorMessage.toLowerCase().includes('quality')) {
      errorType = 'DATA_QUALITY_ERROR';
    } else if (errorMessage.toLowerCase().includes('lambda') || errorMessage.toLowerCase().includes('function')) {
      errorType = 'LAMBDA_ERROR';
    }

    return RenewableAnalysisErrorHandler.createAnalysisError(errorType, errorMessage, {
      originalError: error instanceof Error ? error : undefined
    });
  }

  /**
   * Get service health status
   */
  public getHealthStatus() {
    return this.monitor.generateHealthReport();
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return this.monitor.getSuccessMetrics();
  }
}

/**
 * Convenience function for executing renewable analysis
 */
export const executeRenewableAnalysis = async (
  request: RenewableAnalysisRequest
): Promise<RenewableAnalysisResponse> => {
  const service = RenewableAnalysisService.getInstance();
  return service.executeAnalysis(request);
};