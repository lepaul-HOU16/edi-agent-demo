/**
 * Health API Lambda Handler
 * Handles /api/health/* routes
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const path = event.requestContext.http.path;
  
  console.log(`[Health API] ${event.requestContext.http.method} ${path}`);

  try {
    // S3 health check
    if (path === '/api/health/s3') {
      return await handleS3Health(event);
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Not found', path }),
    };
  } catch (error) {
    console.error('[Health API] Error:', error);
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

async function handleS3Health(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    
    if (!bucketName) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'unhealthy',
          error: 'S3 bucket not configured',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Simple health check - just verify environment is configured
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        status: 'healthy',
        bucket: bucketName,
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
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
}
