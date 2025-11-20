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
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { randomUUID } from 'crypto';

// Import the existing agent handler from agents directory
import { handler as agentHandler } from './agents/handler';

// Initialize Lambda client for async invocation
const lambdaClient = new LambdaClient({});

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
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🟢 BACKEND (Chat Lambda): Request received');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌐 Path:', (event.requestContext as any).http?.path || 'N/A');
  console.log('📋 Method:', (event.requestContext as any).http?.method || 'N/A');
  console.log('🆔 Request ID:', event.requestContext.requestId);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Get user context
    const user = getUserContext(event);
    if (!user) {
      console.error('❌ BACKEND (Chat Lambda): Unauthorized - no user context');
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    console.log('✅ BACKEND (Chat Lambda): User authenticated:', user.sub);

    // Parse request body
    if (!event.body) {
      console.error('❌ BACKEND (Chat Lambda): Missing request body');
      return errorResponse('Request body is required', 'INVALID_INPUT', 400);
    }

    const body = JSON.parse(event.body);
    console.log('📦 BACKEND (Chat Lambda): Request body parsed');
    console.log('🆔 Session ID:', body.chatSessionId);
    console.log('📝 Message:', body.message);
    console.log('🤖 Agent Type:', body.agentType || 'auto');
    console.log('🔄 Async Processing:', body._asyncProcessing || false);

    // Validate required fields
    if (!body.chatSessionId || !body.message) {
      console.error('❌ BACKEND (Chat Lambda): Missing required fields');
      return errorResponse('chatSessionId and message are required', 'INVALID_INPUT', 400);
    }
    
    // If this is an async processing request, skip saving user message (already saved)
    const isAsyncProcessing = body._asyncProcessing === true;
    const existingUserMessageId = body._userMessageId;

    // Convert to AppSync event format
    const appSyncEvent = convertToAppSyncEvent(event, body);
    console.log('🔄 BACKEND (Chat Lambda): Converted to AppSync event format');

    // Save user message to DynamoDB (skip if async processing)
    let userMessageId: string;
    
    if (isAsyncProcessing) {
      console.log('🔄 BACKEND (Chat Lambda): Async processing - skipping user message save');
      userMessageId = existingUserMessageId!;
    } else {
      userMessageId = randomUUID();
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

      console.log('💾 BACKEND (Chat Lambda): Saving user message to DynamoDB');
      console.log('🆔 User Message ID:', userMessageId);
      await docClient.send(
        new PutCommand({
          TableName: CHAT_MESSAGE_TABLE,
          Item: userMessage,
        })
      );
      console.log('✅ BACKEND (Chat Lambda): User message saved successfully');
    }

    // TIMEOUT HANDLING: Set a 25-second timeout to prevent API Gateway timeout
    // API Gateway has a 29-second timeout, so we need to respond before that
    // Skip timeout for async processing (already in background)
    const TIMEOUT_MS = 25000; // 25 seconds
    
    let agentResponse: any;
    
    if (isAsyncProcessing) {
      // Already in async mode, no timeout needed
      console.log('🔄 BACKEND (Chat Lambda): Async processing mode - no timeout');
      agentResponse = await agentHandler(appSyncEvent, {});
    } else {
      // Normal mode with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PROCESSING_TIMEOUT')), TIMEOUT_MS)
      );

      console.log('🤖 BACKEND (Chat Lambda): Calling agent handler with timeout...');
      console.log('⏱️  Timeout set to:', TIMEOUT_MS, 'ms');
      
      try {
        agentResponse = await Promise.race([
          agentHandler(appSyncEvent, {}),
          timeoutPromise
        ]);
      } catch (error: any) {
        if (error.message === 'PROCESSING_TIMEOUT') {
          console.log('⏰ BACKEND (Chat Lambda): Query exceeded timeout, switching to async processing');
          
          // Invoke this Lambda asynchronously to continue processing in background
          const asyncPayload = {
            ...event,
            body: JSON.stringify({
              ...body,
              _asyncProcessing: true, // Flag to indicate async processing
              _userMessageId: userMessageId, // Pass user message ID
            }),
          };
          
          console.log('🔄 BACKEND (Chat Lambda): Invoking Lambda asynchronously for background processing');
          const invokeCommand = new InvokeCommand({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: 'Event', // Async invocation
            Payload: JSON.stringify(asyncPayload),
          });
          
          await lambdaClient.send(invokeCommand);
          console.log('✅ BACKEND (Chat Lambda): Async invocation started');
          
          // Return immediate "processing" response
          const processingResponse = {
            success: true,
            message: '🔄 **Analysis in Progress**\n\nYour query is being processed. This may take 30-60 seconds.\n\nResults will appear automatically when ready.',
            response: {
              text: '🔄 **Analysis in Progress**\n\nYour query is being processed. This may take 30-60 seconds.\n\nResults will appear automatically when ready.',
              artifacts: [],
            },
            data: {
              artifacts: [],
              thoughtSteps: [],
              sourceAttribution: [],
              agentUsed: 'processing',
              processing: true,
            },
          };
          
          console.log('═══════════════════════════════════════════════════════════');
          console.log('🟢 BACKEND (Chat Lambda): Returning processing response');
          console.log('═══════════════════════════════════════════════════════════');
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processingResponse),
          };
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🟢 BACKEND (Chat Lambda): Agent response received');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Success:', agentResponse.success);
    console.log('📊 Artifact Count:', agentResponse.artifacts?.length || 0);
    console.log('🧠 Thought Step Count:', agentResponse.thoughtSteps?.length || 0);
    console.log('🤖 Agent Used:', agentResponse.agentUsed || 'unknown');
    console.log('💬 Message Length:', agentResponse.message?.length || 0);
    console.log('═══════════════════════════════════════════════════════════');

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
      console.log('📊 BACKEND (Chat Lambda): Adding', agentResponse.artifacts.length, 'artifacts to AI message');
    } else {
      console.warn('⚠️ BACKEND (Chat Lambda): No artifacts in agent response');
    }

    // Only add thoughtSteps if they exist and are not empty
    if (agentResponse.thoughtSteps && agentResponse.thoughtSteps.length > 0) {
      aiMessage.thoughtSteps = agentResponse.thoughtSteps;
      console.log('🧠 BACKEND (Chat Lambda): Adding', agentResponse.thoughtSteps.length, 'thought steps to AI message');
    }

    console.log('💾 BACKEND (Chat Lambda): Saving AI response to DynamoDB');
    console.log('🆔 AI Message ID:', aiMessageId);
    await docClient.send(
      new PutCommand({
        TableName: CHAT_MESSAGE_TABLE,
        Item: aiMessage,
      })
    );
    console.log('✅ BACKEND (Chat Lambda): AI message saved successfully');

    // If this was async processing, don't return a response (already returned "processing" message)
    if (isAsyncProcessing) {
      console.log('🔄 BACKEND (Chat Lambda): Async processing complete - no response needed');
      console.log('💾 Results saved to DynamoDB for frontend to retrieve');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true, asyncComplete: true }),
      };
    }

    // Return in API Gateway format with response text
    const responseBody = {
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
    };

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🟢 BACKEND (Chat Lambda): Returning response');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Success:', responseBody.success);
    console.log('📊 Artifacts in Response:', responseBody.response?.artifacts?.length || 0);
    console.log('💬 Message Length:', responseBody.message?.length || 0);
    console.log('═══════════════════════════════════════════════════════════');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseBody),
    };
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ BACKEND (Chat Lambda): CRITICAL ERROR');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Stack:', error?.stack);
    console.error('═══════════════════════════════════════════════════════════');
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};
