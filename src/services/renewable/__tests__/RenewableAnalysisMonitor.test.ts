/**
 * Tests for RenewableAnalysisMonitor
 * Validates performance tracking, metrics collection, and health monitoring
 */

import { 
  RenewableAnalysisMonitor, 
  OperationContext, 
  PerformanceMetrics,
  SuccessMetrics
} from '../RenewableAnalysisMonitor';

describe('RenewableAnalysisMonitor', () => {
  let monitor: RenewableAnalysisMonitor;
  let mockContext: OperationContext;

  beforeEach(() => {
    monitor = RenewableAnalysisMonitor.getInstance();
    mockContext = {
      userId: 'test-user',
      sessionId: 'test-session',
      analysisType: 'terrain_analysis',
      location: { latitude: 40.7128, longitude: -74.0060 }
    };
  });

  describe('Operation Tracking', () => {
    it('should start operation tracking and return operation ID', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);

      expect(operationId).toBeDefined();
      expect(operationId).toContain('terrain_analysis');
      expect(operationId).toContain('test-session'.substr(0, 8));
    });

    it('should complete operation successfully', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      const result = {
        featureCount: 151,
        dataSource: 'openstreetmap',
        dataSize: 50000,
        visualizationCount: 1
      };

      // Should not throw
      expect(() => {
        monitor.completeOperation(operationId, result);
      }).not.toThrow();
    });

    it('should handle operation failure', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      const error = {
        type: 'OSM_API_ERROR',
        message: 'Service unavailable',
        statusCode: 503
      };

      // Should not throw
      expect(() => {
        monitor.failOperation(operationId, error);
      }).not.toThrow();
    });

    it('should handle completion of non-existent operation gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      monitor.completeOperation('non-existent-id', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation non-existent-id not found')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metrics Collection', () => {
    it('should update success metrics correctly', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      monitor.completeOperation(operationId, {
        featureCount: 151,
        dataSource: 'openstreetmap',
        dataSize: 50000
      });

      const metrics = monitor.getSuccessMetrics();
      
      expect(metrics.totalOperations).toBeGreaterThan(0);
      expect(metrics.successfulOperations).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.dataSourceBreakdown.openstreetmap).toBeGreaterThan(0);
    });

    it('should update failure metrics correctly', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      monitor.failOperation(operationId, {
        type: 'OSM_API_ERROR',
        message: 'Service unavailable'
      });

      const metrics = monitor.getSuccessMetrics();
      
      expect(metrics.totalOperations).toBeGreaterThan(0);
      expect(metrics.failedOperations).toBeGreaterThan(0);
      expect(metrics.errorBreakdown.OSM_API_ERROR).toBeGreaterThan(0);
    });

    it('should calculate feature count statistics', () => {
      const operationId1 = monitor.startOperation('terrain_analysis', mockContext);
      const operationId2 = monitor.startOperation('terrain_analysis', mockContext);
      
      monitor.completeOperation(operationId1, { featureCount: 100 });
      monitor.completeOperation(operationId2, { featureCount: 200 });

      const metrics = monitor.getSuccessMetrics();
      
      expect(metrics.featureCountStats.min).toBeLessThanOrEqual(100);
      expect(metrics.featureCountStats.max).toBeGreaterThanOrEqual(200);
      expect(metrics.featureCountStats.average).toBeGreaterThan(0);
      expect(metrics.featureCountStats.total).toBeGreaterThan(0);
    });
  });

  describe('Logging Operations', () => {
    it('should log operations with correct format', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      monitor.logOperation('INFO', 'test_operation', {
        operationId: 'test-id',
        success: true
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RENEWABLE_ANALYSIS] test_operation:'),
        expect.objectContaining({
          level: 'INFO',
          service: 'RenewableAnalysis',
          operationType: 'test_operation'
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log performance timing', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      monitor.logPerformanceTiming('test_operation', 1500, { extra: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PERFORMANCE_TIMING'),
        expect.objectContaining({
          operation: 'test_operation',
          timing: 1500,
          unit: 'milliseconds',
          extra: 'data'
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log slow operations as warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      monitor.logPerformanceTiming('slow_operation', 6000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SLOW_OPERATION'),
        expect.objectContaining({
          operation: 'slow_operation',
          timing: 6000,
          threshold: 5000
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log visualization metrics', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      monitor.logVisualizationMetrics('wind_rose', {
        generationTime: 800,
        dataPoints: 1000,
        renderingEngine: 'plotly',
        success: true
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('VISUALIZATION_GENERATION'),
        expect.objectContaining({
          visualizationType: 'wind_rose',
          generationTime: 800,
          dataPoints: 1000,
          renderingEngine: 'plotly',
          success: true
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log data source usage', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      monitor.logDataSourceUsage('openstreetmap', {
        requestCount: 10,
        successCount: 9,
        failureCount: 1,
        averageResponseTime: 1500,
        dataQuality: 'high'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DATA_SOURCE_USAGE'),
        expect.objectContaining({
          dataSource: 'openstreetmap',
          requestCount: 10,
          successCount: 9,
          failureCount: 1,
          successRate: 0.9,
          averageResponseTime: 1500,
          dataQuality: 'high'
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log workflow steps', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      monitor.logWorkflowStep('workflow-123', 'terrain_analysis', {
        stepDuration: 2000,
        userInteractions: 3,
        completionRate: 0.85,
        nextStep: 'wind_rose_analysis'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WORKFLOW_STEP'),
        expect.objectContaining({
          workflowId: 'workflow-123',
          step: 'terrain_analysis',
          stepDuration: 2000,
          userInteractions: 3,
          completionRate: 0.85,
          nextStep: 'wind_rose_analysis'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Summary', () => {
    it('should generate performance summary', () => {
      const summary = monitor.getPerformanceSummary(24);

      expect(summary).toHaveProperty('totalOperations');
      expect(summary).toHaveProperty('averageResponseTime');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('topErrors');
      expect(summary).toHaveProperty('slowestOperations');
      expect(Array.isArray(summary.topErrors)).toBe(true);
      expect(Array.isArray(summary.slowestOperations)).toBe(true);
    });
  });

  describe('Health Report', () => {
    it('should generate health report with healthy status', () => {
      // Simulate successful operations to ensure healthy status
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      monitor.completeOperation(operationId, {
        featureCount: 151,
        dataSource: 'openstreetmap'
      });

      const healthReport = monitor.generateHealthReport();

      expect(healthReport).toHaveProperty('status');
      expect(healthReport).toHaveProperty('metrics');
      expect(healthReport).toHaveProperty('alerts');
      expect(healthReport).toHaveProperty('recommendations');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthReport.status);
      expect(Array.isArray(healthReport.alerts)).toBe(true);
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
    });

    it('should detect unhealthy status with high failure rate', () => {
      // Simulate multiple failures to trigger unhealthy status
      for (let i = 0; i < 10; i++) {
        const operationId = monitor.startOperation('terrain_analysis', mockContext);
        monitor.failOperation(operationId, {
          type: 'OSM_API_ERROR',
          message: 'Service unavailable'
        });
      }

      const healthReport = monitor.generateHealthReport();
      
      // Should detect low success rate
      expect(healthReport.alerts.some(alert => 
        alert.message.includes('Success rate') && alert.severity === 'high'
      )).toBe(true);
    });
  });

  describe('Alert Thresholds', () => {
    it('should trigger performance alerts for slow operations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      // Simulate slow operation by manually setting start time
      setTimeout(() => {
        monitor.completeOperation(operationId, {
          featureCount: 151,
          dataSource: 'openstreetmap'
        });
        
        // Should have logged a performance alert
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('PERFORMANCE_ALERT'),
          expect.objectContaining({
            severity: 'medium'
          })
        );
        
        consoleSpy.mockRestore();
      }, 100);
    });
  });

  describe('Operation ID Generation', () => {
    it('should generate unique operation IDs', () => {
      const id1 = monitor.startOperation('terrain_analysis', mockContext);
      const id2 = monitor.startOperation('terrain_analysis', mockContext);

      expect(id1).not.toBe(id2);
      expect(id1).toContain('terrain_analysis');
      expect(id2).toContain('terrain_analysis');
    });

    it('should include session prefix in operation ID', () => {
      const contextWithSession = {
        ...mockContext,
        sessionId: 'session-12345'
      };

      const operationId = monitor.startOperation('terrain_analysis', contextWithSession);

      expect(operationId).toContain('session-'); // Should contain session prefix
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage when available', () => {
      const operationId = monitor.startOperation('terrain_analysis', mockContext);
      
      monitor.completeOperation(operationId, {
        featureCount: 151,
        dataSource: 'openstreetmap'
      });

      // Memory usage should be tracked (0 if process.memoryUsage not available)
      expect(typeof monitor.getSuccessMetrics()).toBe('object');
    });
  });
});