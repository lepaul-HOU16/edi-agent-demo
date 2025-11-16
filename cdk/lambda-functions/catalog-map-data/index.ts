/**
 * Catalog Map Data - API Gateway Wrapper
 * 
 * Wraps the catalog map data handler to work with API Gateway HTTP events
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as catalogHandler } from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('[Catalog Map Data Wrapper] Received API Gateway event');
    
    // Parse query parameters
    const type = event.queryStringParameters?.type || 'all';
    const maxResults = parseInt(event.queryStringParameters?.maxResults || '100', 10);
    
    console.log(`[Catalog Map Data Wrapper] Type: ${type}, MaxResults: ${maxResults}`);
    
    // Call catalog handler with AppSync-style event format
    const result = await catalogHandler({
      arguments: { type, maxResults },
      identity: {
        sub: (event.requestContext.authorizer?.jwt?.claims?.sub || 
              (event.requestContext.authorizer as any)?.lambda?.userId ||
              (event.requestContext.authorizer as any)?.userId || 
              'unknown-user') as string,
      },
    } as any, {} as any);
    
    console.log('[Catalog Map Data Wrapper] Catalog handler completed successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[Catalog Map Data Wrapper] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        message: 'Failed to fetch catalog map data',
      }),
    };
  }
};
