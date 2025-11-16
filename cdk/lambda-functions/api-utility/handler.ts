/**
 * Utility API Lambda Handler
 * Handles utility routes:
 * - POST /api/global-directory-scan
 * - GET /api/test-renewable-config
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  console.log(`[Utility API] ${method} ${path}`);

  try {
    // Global directory scan
    if (path === '/api/global-directory-scan' && method === 'POST') {
      return await handleDirectoryScan(event);
    }

    // Test renewable config
    if (path === '/api/test-renewable-config') {
      return await handleTestConfig(event);
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Not found', path, method }),
    };
  } catch (error) {
    console.error('[Utility API] Error:', error);
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

async function handleDirectoryScan(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Placeholder implementation
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'scanned',
        files: [],
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

async function handleTestConfig(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'ok',
        config: {
          environment: process.env.AWS_REGION,
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
