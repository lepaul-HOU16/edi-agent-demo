/**
 * Catalog Search - API Gateway Wrapper
 * 
 * Wraps the catalog search handler to work with API Gateway HTTP events
 * Updated: 2025-11-16
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as catalogSearchHandler } from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('[Catalog Search Wrapper] Received API Gateway event');
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { prompt, existingContext } = body;
    
    console.log(`[Catalog Search Wrapper] Prompt: ${prompt}`);
    console.log(`[Catalog Search Wrapper] Has existing context: ${!!existingContext}`);
    
    // Call catalog search handler with AppSync-style event format
    const result = await catalogSearchHandler({
      arguments: { 
        prompt,
        existingContext 
      },
      identity: {
        sub: (event.requestContext.authorizer?.jwt?.claims?.sub || 
              (event.requestContext.authorizer as any)?.lambda?.userId ||
              (event.requestContext.authorizer as any)?.userId || 
              'unknown-user') as string,
      },
    } as any, {} as any);
    
    console.log('[Catalog Search Wrapper] Catalog search completed successfully');
    
    // Handler already returns JSON string, return it directly
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: result,
    };
  } catch (error: any) {
    console.error('[Catalog Search Wrapper] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        message: 'Failed to perform catalog search',
      }),
    };
  }
};
