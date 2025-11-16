/**
 * Chat/Agent Lambda Function - API Gateway Wrapper
 * 
 * This is a thin wrapper that converts API Gateway HTTP API v2 events
 * to the AppSync format expected by the existing agent code.
 * 
 * ALL EXISTING AGENT LOGIC IS PRESERVED - we only change the event format.
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getUserContext, errorResponse } from '../shared/types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Import the existing agent handler from agents directory
import { handler as agentHandler } from './agents/handler';

// Initialize DynamoDB client with removeUndefinedValues option
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values from objects
  },
});

const CHAT_MESSAGE_TABLE = process.env.CHAT_MESSAGE_TABLE!;

/**
 * Convert API Gateway event to AppSync event format
 */
function convertToAppSyncEvent(event: APIGatewayProxyEventV2, body: any): any {
  const user = getUserContext(event);
  
  return {
    arguments: {
      chatSessionId: body.chatSessionId,
      message: body.message,
      foundationModelId: body.foundationModelId,
      userId: body.userId || user?.sub,
      agentType: body.agentType,
    },
    identity: {
      sub: user?.sub,
      username: user?.username,
      email: user?.email,
      groups: user?.groups || [],
    },
    info: {
      fieldName: 'invokeLightweightAgent',
    },
  };
}

/**
 * Main handler - wraps existing agent handler
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Chat Lambda invoked (API Gateway wrapper)');
  console.log('Path:', event.requestContext.http.path);
  console.log('Method:', event.requestContext.http.method);

  try {
    // Get user context
    const user = getUserContext(event);
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 'INVALID_INPUT', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.chatSessionId || !body.message) {
      return errorResponse('chatSessionId and message are required', 'INVALID_INPUT', 400);
    }

    // Convert to AppSync event format
    const appSyncEvent = convertToAppSyncEvent(event, body);

    console.log('Calling existing agent handler with converted event');

    // Save user message to DynamoDB
    const userMessageId = randomUUID();
    const now = new Date().toISOString();
    
    const userMessage = {
      id: userMessageId,
      chatSessionId: body.chatSessionId,
      role: 'human',
      content: { text: body.message },
      responseComplete: true,
      createdAt: now,
      updatedAt: now,
    };

    console.log('Saving user message to DynamoDB');
    await docClient.send(
      new PutCommand({
        TableName: CHAT_MESSAGE_TABLE,
        Item: userMessage,
      })
    );

    // Call the existing agent handler (preserves ALL functionality)
    const agentResponse = await agentHandler(appSyncEvent, {});

    console.log('Agent response received:', {
      success: agentResponse.success,
      artifactCount: agentResponse.artifacts?.length || 0,
      thoughtStepCount: agentResponse.thoughtSteps?.length || 0,
    });

    // Save AI response to DynamoDB
    const aiMessageId = randomUUID();
    const aiNow = new Date().toISOString();
    
    // Filter out undefined values from aiMessage
    const aiMessage: Record<string, any> = {
      id: aiMessageId,
      chatSessionId: body.chatSessionId,
      role: 'ai',
      content: { text: agentResponse.message || '' },
      responseComplete: true,
      createdAt: aiNow,
      updatedAt: aiNow,
    };

    // Only add artifacts if they exist and are not empty
    if (agentResponse.artifacts && agentResponse.artifacts.length > 0) {
      aiMessage.artifacts = agentResponse.artifacts;
    }

    // Only add thoughtSteps if they exist and are not empty
    if (agentResponse.thoughtSteps && agentResponse.thoughtSteps.length > 0) {
      aiMessage.thoughtSteps = agentResponse.thoughtSteps;
    }

    console.log('Saving AI response to DynamoDB');
    await docClient.send(
      new PutCommand({
        TableName: CHAT_MESSAGE_TABLE,
        Item: aiMessage,
        // Remove undefined values to prevent DynamoDB errors
      })
    );

    // Return in API Gateway format with response text
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: agentResponse.success,
        message: agentResponse.message,
        response: {
          text: agentResponse.message,
          artifacts: agentResponse.artifacts || [],
        },
        data: {
          artifacts: agentResponse.artifacts || [],
          thoughtSteps: agentResponse.thoughtSteps || [],
          sourceAttribution: agentResponse.sourceAttribution || [],
          agentUsed: agentResponse.agentUsed || 'unknown',
        },
      }),
    };
  } catch (error: any) {
    console.error('Error in chat handler:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};
