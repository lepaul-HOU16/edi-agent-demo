/**
 * Renewable Energy Orchestrator - API Gateway Wrapper
 * 
 * Wraps the orchestrator handler to work with API Gateway HTTP events
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as orchestratorHandler } from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('[Orchestrator Wrapper] Received API Gateway event');
    console.log('[Orchestrator Wrapper] Event body:', event.body);
    console.log('[Orchestrator Wrapper] Event type:', typeof event.body);
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    console.log('[Orchestrator Wrapper] Parsed body:', JSON.stringify(body));
    console.log('[Orchestrator Wrapper] Body keys:', Object.keys(body));
    
    // Extract user ID from authorizer (supports both Cognito JWT and custom authorizer)
    const claims = event.requestContext.authorizer?.jwt?.claims;
    const authContext = event.requestContext.authorizer as any;
    
    const userId = claims?.sub || authContext?.lambda?.userId || authContext?.userId || 'unknown-user';
    const userEmail = claims?.email || authContext?.lambda?.email || authContext?.email || 'unknown@example.com';
    
    console.log(`[Orchestrator Wrapper] User: ${userId} (${userEmail})`);
    console.log(`[Orchestrator Wrapper] Query: ${body.query}`);
    
    // Call orchestrator with proper format
    const result = await orchestratorHandler({
      query: body.query,
      context: body.context || {},
      sessionId: body.sessionId,
      userId: userId,
    });
    
    console.log('[Orchestrator Wrapper] Orchestrator completed successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[Orchestrator Wrapper] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to process renewable energy request',
      }),
    };
  }
};
