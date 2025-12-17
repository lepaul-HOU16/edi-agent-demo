/**
 * ChatSession Lambda Handler
 * 
 * Handles all ChatSession CRUD operations for the REST API migration.
 * Replaces Amplify GraphQL ChatSession model operations.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { getUserId } from '../shared/auth-utils';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CHAT_SESSION_TABLE = process.env.CHAT_SESSION_TABLE!;
const CHAT_MESSAGE_TABLE = process.env.CHAT_MESSAGE_TABLE!;

/**
 * ChatSession interface matching Amplify schema
 */
interface ChatSession {
  id: string;
  name?: string;
  owner: string;
  workSteps?: any[];
  linkedCollectionId?: string;
  collectionContext?: any;
  dataAccessLog?: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };
}

/**
 * Create success response
 */
function successResponse(data: any, statusCode: number = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(data),
  };
}

/**
 * Create error response
 */
function errorResponse(message: string, statusCode: number = 500): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

/**
 * POST /api/chat/sessions - Create new session
 */
async function createSession(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const body = event.body ? JSON.parse(event.body) : {};

    const now = new Date().toISOString();
    const session: ChatSession = {
      id: randomUUID(),
      owner: userId,
      name: body.name,
      workSteps: body.workSteps,
      linkedCollectionId: body.linkedCollectionId,
      collectionContext: body.collectionContext,
      dataAccessLog: body.dataAccessLog,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: CHAT_SESSION_TABLE,
        Item: session,
      })
    );

    return successResponse({ data: session }, 201);
  } catch (error: any) {
    console.error('Error creating session:', error);
    return errorResponse(error.message || 'Failed to create session', 500);
  }
}

/**
 * GET /api/chat/sessions - List user's sessions
 */
async function listSessions(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const queryParams = event.queryStringParameters || {};
    
    // Support pagination
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
    const nextToken = queryParams.nextToken;

    // Use Scan with filter since byOwner GSI doesn't exist
    // This is less efficient but works without GSI
    const result = await docClient.send(
      new ScanCommand({
        TableName: CHAT_SESSION_TABLE,
        FilterExpression: '#owner = :owner',
        ExpressionAttributeNames: {
          '#owner': 'owner',
        },
        ExpressionAttributeValues: {
          ':owner': userId,
        },
        Limit: limit,
        ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
      })
    );

    // Sort by createdAt descending (most recent first)
    const sortedItems = (result.Items || []).sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const response: any = {
      data: sortedItems,
    };

    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return successResponse(response);
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    return errorResponse(error.message || 'Failed to list sessions', 500);
  }
}

/**
 * GET /api/chat/sessions/{id} - Get session details
 */
async function getSession(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
      })
    );

    if (!result.Item) {
      return errorResponse('Session not found', 404);
    }

    // Verify ownership
    if (result.Item.owner !== userId) {
      return errorResponse('Unauthorized: You do not own this session', 403);
    }

    return successResponse({ data: result.Item });
  } catch (error: any) {
    console.error('Error getting session:', error);
    return errorResponse(error.message || 'Failed to get session', 500);
  }
}

/**
 * PATCH /api/chat/sessions/{id} - Update session
 */
async function updateSession(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : {};

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    // First, verify ownership
    const existing = await docClient.send(
      new GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
      })
    );

    if (!existing.Item) {
      return errorResponse('Session not found', 404);
    }

    if (existing.Item.owner !== userId) {
      return errorResponse('Unauthorized: You do not own this session', 403);
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const updatableFields = ['name', 'workSteps', 'linkedCollectionId', 'collectionContext', 'dataAccessLog'];
    
    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    });

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // Only updatedAt, nothing to update
      return successResponse({ data: existing.Item });
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return successResponse({ data: result.Attributes });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return errorResponse(error.message || 'Failed to update session', 500);
  }
}

/**
 * DELETE /api/chat/sessions/{id} - Delete session
 */
async function deleteSession(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    // First, verify ownership
    const existing = await docClient.send(
      new GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
      })
    );

    if (!existing.Item) {
      return errorResponse('Session not found', 404);
    }

    if (existing.Item.owner !== userId) {
      return errorResponse('Unauthorized: You do not own this session', 403);
    }

    // Delete the session
    await docClient.send(
      new DeleteCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
      })
    );

    // Note: Messages are not deleted automatically (they have their own lifecycle)
    // This matches Amplify behavior where messages can exist without a session

    return successResponse({ data: { id: sessionId, deleted: true } });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return errorResponse(error.message || 'Failed to delete session', 500);
  }
}

/**
 * GET /api/chat/sessions/{id}/messages - Get session messages
 */
async function getSessionMessages(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    const queryParams = event.queryStringParameters || {};

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    // First, verify session ownership
    const session = await docClient.send(
      new GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
      })
    );

    if (!session.Item) {
      return errorResponse('Session not found', 404);
    }

    if (session.Item.owner !== userId) {
      return errorResponse('Unauthorized: You do not own this session', 403);
    }

    // Query messages by chatSessionId (GSI required)
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 100;
    const nextToken = queryParams.nextToken;

    const result = await docClient.send(
      new QueryCommand({
        TableName: CHAT_MESSAGE_TABLE,
        IndexName: 'chatMessagesByChatSessionIdAndCreatedAt', // Actual GSI name from Amplify
        KeyConditionExpression: 'chatSessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': sessionId,
        },
        Limit: limit,
        ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
        ScanIndexForward: true, // Chronological order
      })
    );

    const response: any = {
      data: result.Items || [],
    };

    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return successResponse(response);
  } catch (error: any) {
    console.error('Error getting session messages:', error);
    return errorResponse(error.message || 'Failed to get session messages', 500);
  }
}

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  console.log('ChatSession handler invoked:', JSON.stringify(event, null, 2));

  // Handle OPTIONS for CORS preflight
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Route to appropriate handler
    if (method === 'POST' && path === '/api/chat/sessions') {
      return await createSession(event);
    } else if (method === 'GET' && path === '/api/chat/sessions') {
      return await listSessions(event);
    } else if (method === 'GET' && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await getSession(event);
    } else if (method === 'PATCH' && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await updateSession(event);
    } else if (method === 'DELETE' && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await deleteSession(event);
    } else if (method === 'GET' && path.match(/^\/api\/chat\/sessions\/[^/]+\/messages$/)) {
      return await getSessionMessages(event);
    } else {
      return errorResponse('Not found', 404);
    }
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
