/**
 * Renewable API Lambda Handler
 * 
 * Handles all /api/renewable/* routes:
 * - GET /api/renewable/health
 * - GET/POST /api/renewable/health/deployment
 * - GET/POST /api/renewable/diagnostics
 * - POST /api/renewable/energy-production
 * - POST /api/renewable/wind-data
 * - GET /api/renewable/debug
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  console.log(`[Renewable API] ${method} ${path}`);

  try {
    // Health check endpoint
    if (path === '/api/renewable/health') {
      return await handleHealth(event);
    }

    // Health deployment endpoint
    if (path === '/api/renewable/health/deployment') {
      return await handleHealthDeployment(event);
    }

    // Diagnostics endpoint
    if (path === '/api/renewable/diagnostics') {
      return await handleDiagnostics(event);
    }

    // Energy production endpoint
    if (path === '/api/renewable/energy-production' && method === 'POST') {
      return await handleEnergyProduction(event);
    }

    // Wind data endpoint
    if (path === '/api/renewable/wind-data' && method === 'POST') {
      return await handleWindData(event);
    }

    // Debug endpoint
    if (path === '/api/renewable/debug') {
      return await handleDebug(event);
    }

    // Not found
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Not found',
        path,
        method,
      }),
    };
  } catch (error) {
    console.error('[Renewable API] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Health check handler
 */
async function handleHealth(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const checkType = queryParams.type || 'full';

  try {
    // Import the health check service
    // Note: This will need to be bundled with the Lambda
    const { healthCheckService } = await import('../../../src/services/renewable-integration/HealthCheckService');

    let result;
    switch (checkType) {
      case 'ready':
      case 'readiness':
        const healthCheck = await healthCheckService.performHealthCheck();
        const isReady = healthCheck.status !== 'unhealthy';
        result = {
          ready: isReady,
          status: healthCheck.status,
          timestamp: healthCheck.timestamp,
          message: isReady ? 'Service is ready' : 'Service is not ready',
        };
        return {
          statusCode: isReady ? 200 : 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(result),
        };

      case 'live':
      case 'liveness':
        result = {
          alive: true,
          timestamp: new Date().toISOString(),
          message: 'Service is alive',
        };
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(result),
        };

      case 'full':
      case 'health':
      default:
        const fullHealthCheck = await healthCheckService.performHealthCheck();
        const statusCode = fullHealthCheck.status === 'healthy' ? 200 :
                          fullHealthCheck.status === 'degraded' ? 200 : 503;
        
        return {
          statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify(fullHealthCheck),
        };
    }
  } catch (error) {
    console.error('[Health Check] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
}

/**
 * Health deployment handler
 */
async function handleHealthDeployment(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    // TODO: Implement deployment validation logic
    // For now, return a placeholder
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'healthy',
        deployment: 'validated',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Diagnostics handler
 */
async function handleDiagnostics(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    // TODO: Implement diagnostics logic
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'ok',
        diagnostics: {},
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Energy production handler
 */
async function handleEnergyProduction(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // TODO: Implement energy production logic
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'calculated',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Wind data handler
 */
async function handleWindData(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // TODO: Implement wind data logic
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'processed',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Debug handler
 */
async function handleDebug(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        event: {
          path: event.requestContext.http.path,
          method: event.requestContext.http.method,
          sourceIp: event.requestContext.http.sourceIp,
        },
        environment: {
          AWS_REGION: process.env.AWS_REGION,
          AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
