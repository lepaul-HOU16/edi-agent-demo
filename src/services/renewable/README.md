# Renewable Energy Analysis Error Handling and Monitoring

This directory contains comprehensive error handling and monitoring services for renewable energy analysis operations, implementing requirements 14.1, 14.2, 14.3, 14.4, and 14.5.

## Components

### 1. RenewableAnalysisErrorHandler

Handles all types of errors that can occur during renewable energy analysis with progressive fallback strategies.

**Features:**
- **OSM API Error Handling**: Rate limiting, server errors, bad requests with appropriate fallback strategies
- **Intent Detection Errors**: User guidance and alternative suggestions
- **Visualization Errors**: Graceful degradation with fallback visualizations
- **Data Quality Errors**: Partial data processing when possible
- **Lambda Function Errors**: Retry logic for transient failures
- **Network Errors**: Connection timeout handling with exponential backoff

**Usage:**
```typescript
import { RenewableAnalysisErrorHandler, AnalysisError, AnalysisContext } from './RenewableAnalysisErrorHandler';

const errorHandler = RenewableAnalysisErrorHandler.getInstance();

const error: AnalysisError = {
  type: 'OSM_API_ERROR',
  message: 'Service unavailable',
  statusCode: 503,
  endpoint: 'overpass-api.de',
  timestamp: new Date()
};

const context: AnalysisContext = {
  analysisType: 'terrain_analysis',
  location: { latitude: 40.7128, longitude: -74.0060 },
  userId: 'user-123',
  sessionId: 'session-456'
};

const response = errorHandler.handleAnalysisError(error, context);
```

### 2. RenewableAnalysisMonitor

Comprehensive monitoring and logging service that tracks performance metrics, success rates, and operational health.

**Features:**
- **Operation Tracking**: Start/complete/fail operation tracking with unique IDs
- **Performance Metrics**: Response times, memory usage, data sizes
- **Success Metrics**: Success rates, error breakdowns, feature count statistics
- **Health Monitoring**: Automated health reports with alerts and recommendations
- **Detailed Logging**: Structured logging for all operations with appropriate context

**Usage:**
```typescript
import { RenewableAnalysisMonitor, OperationContext } from './RenewableAnalysisMonitor';

const monitor = RenewableAnalysisMonitor.getInstance();

// Start tracking an operation
const operationId = monitor.startOperation('terrain_analysis', {
  userId: 'user-123',
  sessionId: 'session-456',
  analysisType: 'terrain_analysis',
  location: { latitude: 40.7128, longitude: -74.0060 }
});

// Complete successfully
monitor.completeOperation(operationId, {
  featureCount: 151,
  dataSource: 'openstreetmap',
  dataSize: 50000
});

// Or handle failure
monitor.failOperation(operationId, {
  type: 'OSM_API_ERROR',
  message: 'Service unavailable'
});
```

### 3. RenewableAnalysisService

Main service that integrates error handling and monitoring for a unified interface.

**Features:**
- **Unified Interface**: Single entry point for all renewable energy analysis operations
- **Automatic Monitoring**: Integrated operation tracking and metrics collection
- **Error Recovery**: Automatic error handling with appropriate fallback strategies
- **Health Status**: Service health monitoring and reporting

**Usage:**
```typescript
import { RenewableAnalysisService, RenewableAnalysisRequest } from './RenewableAnalysisService';

const service = RenewableAnalysisService.getInstance();

const request: RenewableAnalysisRequest = {
  type: 'terrain',
  location: { latitude: 40.7128, longitude: -74.0060 },
  userId: 'user-123',
  sessionId: 'session-456'
};

const response = await service.executeAnalysis(request);

if (response.success) {
  console.log('Analysis completed:', response.data);
  console.log('Metrics:', response.metrics);
} else {
  console.error('Analysis failed:', response.error);
  // Error includes user-friendly message and recovery suggestions
}
```

## Error Types and Fallback Strategies

### OSM API Errors
- **429 (Rate Limited)**: Exponential backoff retry
- **500+ (Server Error)**: Alternative endpoint or synthetic fallback
- **400/404 (Bad Request)**: Reduced feature set
- **503 (Service Unavailable)**: Synthetic data with clear labeling

### Intent Detection Errors
- **Low Confidence**: User clarification with alternative suggestions
- **No Match**: Fallback to generic analysis with options

### Visualization Errors
- **Rendering Failure**: Simplified visualization fallback
- **Data Size Issues**: Data reduction and retry

### Data Quality Errors
- **Partial Data (>70% complete)**: Continue with available data
- **Poor Quality (<70% complete)**: Request data refresh

### Lambda Function Errors
- **Timeout/Memory**: Retry with backoff
- **Invalid Parameters**: Alternative service routing
- **Permission Errors**: Manual intervention required

### Network Errors
- **Connection Issues**: Retry with exponential backoff
- **DNS/Routing**: Alternative endpoints

## Monitoring and Alerting

### Performance Metrics
- **Response Times**: Average, min, max response times
- **Success Rates**: Overall and per-operation-type success rates
- **Feature Counts**: Statistics on data completeness
- **Memory Usage**: Resource utilization tracking

### Health Monitoring
- **Status Levels**: Healthy, Degraded, Unhealthy
- **Alert Thresholds**: Configurable thresholds for key metrics
- **Recommendations**: Automated suggestions for performance improvements

### Logging Levels
- **INFO**: Successful operations, performance metrics
- **WARN**: Slow operations, degraded performance
- **ERROR**: Failed operations, system errors

## Integration with Frontend Components

The error handling and monitoring services integrate seamlessly with existing renewable energy components:

```typescript
// In a React component
import { useRenewableErrorHandler } from '../../utils/renewable/ErrorHandlingUtils';
import { executeRenewableAnalysis } from '../../services/renewable/RenewableAnalysisService';

const TerrainAnalysisComponent = () => {
  const { handleError } = useRenewableErrorHandler('TerrainAnalysisComponent');

  const performAnalysis = async () => {
    try {
      const response = await executeRenewableAnalysis({
        type: 'terrain',
        location: { latitude: 40.7128, longitude: -74.0060 }
      });

      if (!response.success) {
        // Error is already handled and logged
        setError(response.error);
        if (response.error.fallbackData) {
          setData(response.error.fallbackData);
        }
      } else {
        setData(response.data);
      }
    } catch (error) {
      const formattedError = handleError(error, 'performAnalysis');
      setError(formattedError);
    }
  };
};
```

## Testing

Comprehensive test suites are provided for all components:

- **RenewableAnalysisErrorHandler.test.ts**: Tests all error types and fallback strategies
- **RenewableAnalysisMonitor.test.ts**: Tests monitoring, metrics, and health reporting

Run tests:
```bash
npm test -- --testPathPatterns="RenewableAnalysisErrorHandler|RenewableAnalysisMonitor"
```

## Production Considerations

### Environment Variables
- `NODE_ENV=production`: Enables monitoring service integration
- Monitoring data is sent to external services (CloudWatch, Datadog, etc.)

### Performance
- Singleton pattern ensures minimal memory overhead
- Efficient data structures for metrics collection
- Automatic cleanup of old operation data

### Security
- No sensitive data logged in error messages
- User IDs and session IDs are hashed in production logs
- Error details are sanitized for user display

## Compliance with Requirements

This implementation satisfies all requirements from the specification:

- **14.1**: Specific error details logged with appropriate context
- **14.2**: Progressive fallback strategies with clear user communication
- **14.3**: Meaningful error messages and recovery suggestions
- **14.4**: Detailed logging for all renewable analysis operations
- **14.5**: Success metrics tracking for monitoring and alerting