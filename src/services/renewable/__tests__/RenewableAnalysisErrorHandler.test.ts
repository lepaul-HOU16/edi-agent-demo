/**
 * Tests for RenewableAnalysisErrorHandler
 * Validates error handling, fallback strategies, and recovery mechanisms
 */

import { 
  RenewableAnalysisErrorHandler, 
  AnalysisError, 
  AnalysisContext, 
  OSMError,
  IntentDetectionError,
  VisualizationError,
  DataQualityError
} from '../RenewableAnalysisErrorHandler';

describe('RenewableAnalysisErrorHandler', () => {
  let errorHandler: RenewableAnalysisErrorHandler;
  let mockContext: AnalysisContext;

  beforeEach(() => {
    errorHandler = RenewableAnalysisErrorHandler.getInstance();
    mockContext = {
      analysisType: 'terrain_analysis',
      location: { latitude: 40.7128, longitude: -74.0060 },
      userId: 'test-user',
      sessionId: 'test-session'
    };
  });

  describe('OSM Error Handling', () => {
    it('should handle rate limiting with retry strategy', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Rate limited',
        statusCode: 429,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(osmError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('exponential_backoff');
      expect(response.retryAfter).toBeGreaterThan(0);
    });

    it('should handle server errors with alternative endpoint strategy', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Internal server error',
        statusCode: 500,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(osmError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('alternative_endpoint');
    });

    it('should handle bad requests with reduced feature set', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Bad request',
        statusCode: 400,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(osmError, mockContext);

      expect(response.success).toBe(false);
      expect(response.fallbackData).toBeDefined();
      expect(response.fallbackStrategy).toBe('reduced_feature_set');
      expect(response.fallbackData.metadata.dataSource).toBe('reduced_osm');
    });

    it('should create synthetic fallback for unrecoverable errors', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Service unavailable',
        statusCode: 503,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(osmError, mockContext);

      expect(response.success).toBe(false);
      expect(response.fallbackData).toBeDefined();
      expect(response.fallbackStrategy).toBe('synthetic_data');
      expect(response.fallbackData.metadata.dataSource).toBe('synthetic_fallback');
      expect(response.fallbackData.features).toHaveLength(3);
      expect(response.error.message).toContain('SYNTHETIC DATA');
    });
  });

  describe('Intent Detection Error Handling', () => {
    it('should handle intent detection errors with alternatives', () => {
      const intentError: IntentDetectionError = {
        type: 'INTENT_DETECTION_ERROR',
        message: 'Unable to classify intent',
        query: 'analyze something',
        confidence: 0.3,
        alternatives: ['terrain_analysis', 'wind_rose_analysis'],
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(intentError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('user_clarification');
      expect(response.error.suggestions).toContain('Try: "terrain_analysis"');
      expect(response.error.suggestions).toContain('Try: "wind_rose_analysis"');
    });
  });

  describe('Visualization Error Handling', () => {
    it('should handle visualization errors with fallback', () => {
      const vizError: VisualizationError = {
        type: 'VISUALIZATION_ERROR',
        message: 'Failed to render chart',
        component: 'WindRoseChart',
        dataSize: 10000,
        renderingEngine: 'plotly',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(vizError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('simplified_visualization');
      expect(response.fallbackData).toBeDefined();
      expect(response.fallbackData.type).toBe('fallback_chart');
    });
  });

  describe('Data Quality Error Handling', () => {
    it('should continue with partial data when completeness is acceptable', () => {
      const dataError: DataQualityError = {
        type: 'DATA_QUALITY_ERROR',
        message: 'Data quality issues detected',
        dataSource: 'wind_resource_db',
        qualityIssues: ['missing_values', 'outliers'],
        completeness: 0.85,
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(dataError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(false);
      expect(response.fallbackStrategy).toBe('partial_data_processing');
      expect(response.error.message).toContain('85%');
      expect(response.error.severity).toBe('medium');
    });

    it('should require data refresh when completeness is too low', () => {
      const dataError: DataQualityError = {
        type: 'DATA_QUALITY_ERROR',
        message: 'Insufficient data quality',
        dataSource: 'wind_resource_db',
        qualityIssues: ['missing_values', 'corrupted_data'],
        completeness: 0.5,
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(dataError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('data_refresh');
    });
  });

  describe('Lambda Error Handling', () => {
    it('should handle retryable Lambda errors', () => {
      const lambdaError: AnalysisError = {
        type: 'LAMBDA_ERROR',
        message: 'Function timeout',
        statusCode: 504,
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(lambdaError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('retry_with_backoff');
    });

    it('should handle non-retryable Lambda errors', () => {
      const lambdaError: AnalysisError = {
        type: 'LAMBDA_ERROR',
        message: 'Invalid parameters',
        statusCode: 400,
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(lambdaError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(false);
      expect(response.fallbackStrategy).toBe('alternative_service');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with retry', () => {
      const networkError: AnalysisError = {
        type: 'NETWORK_ERROR',
        message: 'Connection timeout',
        endpoint: 'api.example.com',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(networkError, mockContext);

      expect(response.success).toBe(false);
      expect(response.retryable).toBe(true);
      expect(response.fallbackStrategy).toBe('retry_with_backoff');
      expect(response.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Error Creation Utility', () => {
    it('should create analysis error with correct properties', () => {
      const error = RenewableAnalysisErrorHandler.createAnalysisError(
        'OSM_API_ERROR',
        'Test error message',
        {
          statusCode: 500,
          endpoint: 'test.com'
        }
      );

      expect(error.type).toBe('OSM_API_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('test.com');
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Synthetic Feature Generation', () => {
    it('should generate synthetic features with correct structure', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Service unavailable',
        statusCode: 503,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      const response = errorHandler.handleAnalysisError(osmError, mockContext);
      const features = response.fallbackData.features;

      expect(features).toHaveLength(3);
      
      // Check building feature
      const building = features.find((f: any) => f.properties.type === 'building');
      expect(building).toBeDefined();
      expect(building.properties.synthetic).toBe(true);
      expect(building.geometry.type).toBe('Polygon');
      
      // Check road feature
      const road = features.find((f: any) => f.properties.type === 'highway');
      expect(road).toBeDefined();
      expect(road.properties.synthetic).toBe(true);
      expect(road.geometry.type).toBe('LineString');
      
      // Check water feature
      const water = features.find((f: any) => f.properties.type === 'water');
      expect(water).toBeDefined();
      expect(water.properties.synthetic).toBe(true);
      expect(water.geometry.type).toBe('Polygon');
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff for retries', () => {
      const osmError: OSMError = {
        type: 'OSM_API_ERROR',
        message: 'Rate limited',
        statusCode: 429,
        endpoint: 'overpass-api.de',
        timestamp: new Date()
      };

      // First retry
      const response1 = errorHandler.handleAnalysisError(osmError, mockContext);
      const delay1 = response1.retryAfter || 0;

      // Second retry (should have longer delay)
      const response2 = errorHandler.handleAnalysisError(osmError, mockContext);
      const delay2 = response2.retryAfter || 0;

      expect(delay2).toBeGreaterThan(delay1);
    });
  });
});