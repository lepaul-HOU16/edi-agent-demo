# Diagnostic API Implementation Summary

## Overview

Implemented a comprehensive diagnostic API endpoint for the renewable energy orchestrator that provides health checks, configuration validation, and troubleshooting guidance.

## Implementation Details

### API Endpoint

**Location**: `src/app/api/renewable/diagnostics/route.ts`

**Endpoints**:
- `GET /api/renewable/diagnostics` - Run full diagnostic suite
- `GET /api/renewable/diagnostics?quick=true` - Run quick diagnostics (env vars only)
- `POST /api/renewable/diagnostics` - Trigger fresh diagnostics

### Features Implemented

#### 1. Authentication
- Requires authenticated users via AWS Amplify Auth
- Returns 401 Unauthorized for unauthenticated requests
- Uses `getCurrentUser()` to verify authentication

#### 2. Diagnostic Checks
Leverages the `OrchestratorDiagnostics` utility to run:
- Environment variable validation
- Orchestrator Lambda existence check
- Orchestrator invocation test (health check)

#### 3. Response Format
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  region: string,
  diagnosticType: 'quick' | 'full',
  results: DiagnosticResult[],
  summary: {
    total: number,
    passed: number,
    failed: number,
    totalDuration: number
  },
  cloudWatchLinks: {
    orchestrator: string,
    terrainTool: string,
    layoutTool: string,
    simulationTool: string,
    reportTool: string
  },
  recommendations: string[],
  nextSteps: string[]
}
```

#### 4. CloudWatch Integration
Generates direct links to CloudWatch log streams for:
- Renewable orchestrator
- Terrain tool Lambda
- Layout tool Lambda
- Simulation tool Lambda
- Report tool Lambda

Link format:
```
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F{encodedFunctionName}
```

#### 5. Intelligent Recommendations
Provides context-aware recommendations based on failure patterns:
- Missing environment variables → Configuration steps
- Orchestrator not found → Deployment steps
- Permission errors → IAM troubleshooting
- Invocation failures → Log analysis guidance

#### 6. Next Steps Generation
Generates actionable next steps based on diagnostic results:
- **Healthy**: Confirms system is operational
- **Environment issues**: Provides configuration fix steps
- **Deployment issues**: Provides deployment commands
- **Permission issues**: Provides IAM guidance

### Integration Tests

**Location**: `src/app/api/renewable/diagnostics/__tests__/route.test.ts`

**Test Coverage**:
- ✅ Diagnostic result structure validation
- ✅ Error and recommendation handling
- ✅ Environment variable checks
- ✅ Missing variable detection
- ✅ CloudWatch link generation
- ✅ Summary statistics calculation
- ✅ Overall status determination
- ✅ Recommendation deduplication
- ✅ Next steps logic for various scenarios

**Test Results**: All 13 tests passing

## Usage Examples

### Full Diagnostics
```bash
curl -X GET https://your-app.com/api/renewable/diagnostics \
  -H "Authorization: Bearer {token}"
```

### Quick Diagnostics (Environment Variables Only)
```bash
curl -X GET https://your-app.com/api/renewable/diagnostics?quick=true \
  -H "Authorization: Bearer {token}"
```

### Response Example (Healthy)
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "region": "us-west-2",
  "diagnosticType": "full",
  "results": [
    {
      "step": "Check Environment Variables",
      "success": true,
      "details": {
        "setVariables": {
          "RENEWABLE_ORCHESTRATOR_FUNCTION_NAME": "renewableOrchestrator-abc123",
          "RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME": "renewableTerrainTool-abc123"
        }
      },
      "timestamp": 1704710400000,
      "duration": 10
    },
    {
      "step": "Check Orchestrator Exists",
      "success": true,
      "details": {
        "functionName": "renewableOrchestrator-abc123",
        "functionArn": "arn:aws:lambda:us-west-2:123456789012:function:renewableOrchestrator-abc123",
        "runtime": "nodejs20.x",
        "state": "Active"
      },
      "timestamp": 1704710400100,
      "duration": 150
    },
    {
      "step": "Test Orchestrator Invocation",
      "success": true,
      "details": {
        "functionName": "renewableOrchestrator-abc123",
        "query": "__health_check__",
        "statusCode": 200,
        "response": {
          "success": true,
          "message": "Orchestrator is healthy"
        }
      },
      "timestamp": 1704710400300,
      "duration": 250
    }
  ],
  "summary": {
    "total": 3,
    "passed": 3,
    "failed": 0,
    "totalDuration": 410
  },
  "cloudWatchLinks": {
    "orchestrator": "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252FrenewableOrchestrator-abc123",
    "terrainTool": "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252FrenewableTerrainTool-abc123"
  },
  "recommendations": [],
  "nextSteps": [
    "All systems operational - orchestrator is ready to use",
    "You can now perform terrain analysis queries"
  ]
}
```

### Response Example (Unhealthy)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "region": "us-west-2",
  "diagnosticType": "full",
  "results": [
    {
      "step": "Check Environment Variables",
      "success": false,
      "details": {
        "setVariables": {},
        "missingVariables": [
          "RENEWABLE_ORCHESTRATOR_FUNCTION_NAME",
          "RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME"
        ]
      },
      "error": "Missing 2 required environment variable(s)",
      "timestamp": 1704710400000,
      "duration": 5,
      "recommendations": [
        "Set missing environment variables in amplify/backend.ts",
        "Ensure all renewable Lambda functions are deployed",
        "Run: npx ampx sandbox to deploy with correct environment variables",
        "CRITICAL: Orchestrator function name must be set for renewable features to work"
      ]
    }
  ],
  "summary": {
    "total": 1,
    "passed": 0,
    "failed": 1,
    "totalDuration": 5
  },
  "cloudWatchLinks": {},
  "recommendations": [
    "Set missing environment variables in amplify/backend.ts",
    "Ensure all renewable Lambda functions are deployed",
    "Run: npx ampx sandbox to deploy with correct environment variables",
    "CRITICAL: Orchestrator function name must be set for renewable features to work"
  ],
  "nextSteps": [
    "1. Fix environment variable configuration in amplify/backend.ts",
    "2. Run: npx ampx sandbox to redeploy with correct configuration",
    "3. Wait for deployment to complete",
    "4. Run diagnostics again to verify"
  ]
}
```

## Security Considerations

1. **Authentication Required**: All diagnostic endpoints require authentication
2. **No Sensitive Data Exposure**: Environment variable values are shown but not secrets
3. **Rate Limiting**: Consider adding rate limiting for production use
4. **CORS**: Configured with no-cache headers to prevent stale diagnostic data

## Integration with Frontend

The diagnostic API can be integrated with a frontend diagnostic panel (Task 13):

```typescript
// Example usage in React component
const runDiagnostics = async () => {
  const response = await fetch('/api/renewable/diagnostics', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const diagnostics = await response.json();
  
  if (diagnostics.status === 'healthy') {
    console.log('✅ All systems operational');
  } else {
    console.error('❌ Issues detected:', diagnostics.recommendations);
  }
};
```

## Monitoring and Observability

The diagnostic API provides:
- **Health Status**: Quick overview of system health
- **Detailed Results**: Step-by-step diagnostic information
- **Performance Metrics**: Duration tracking for each check
- **CloudWatch Links**: Direct access to logs for troubleshooting
- **Actionable Guidance**: Specific steps to resolve issues

## Future Enhancements

Potential improvements for future iterations:
1. Add caching for diagnostic results (with TTL)
2. Implement webhook notifications for health status changes
3. Add historical diagnostic data tracking
4. Integrate with monitoring dashboards (CloudWatch, Grafana)
5. Add more granular checks (network connectivity, API quotas)
6. Support for custom diagnostic plugins

## Requirements Satisfied

✅ **Requirement 6.1**: Verify orchestrator Lambda exists and is accessible
✅ **Requirement 6.4**: Provide specific guidance on deployment issues

## Related Files

- API Route: `src/app/api/renewable/diagnostics/route.ts`
- Tests: `src/app/api/renewable/diagnostics/__tests__/route.test.ts`
- Diagnostic Utility: `amplify/functions/agents/diagnostics/orchestratorDiagnostics.ts`
- Health Check API: `src/app/api/renewable/health/route.ts`

## Conclusion

The diagnostic API provides a comprehensive, authenticated endpoint for validating the renewable energy orchestrator deployment. It offers detailed diagnostic information, CloudWatch integration, and actionable guidance for resolving issues. The implementation is fully tested and ready for integration with a frontend diagnostic panel.
