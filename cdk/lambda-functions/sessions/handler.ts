import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Session {
  id: string;
  name: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
  createdAt: string;
  updatedAt: string;
  owner: string;
  ttl?: number;
}

interface CollectionContext {
  collectionId: string;
  name: string;
  wellCount: number;
  dataSourceType: string;
  dataItems: DataItem[];
  previewMetadata: any;
}

interface DataItem {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  s3Key?: string;
  osduId?: string;
  location?: string;
  operator?: string;
  depth?: string;
  curves?: string[];
  coordinates?: [number, number];
}

interface CreateSessionRequest {
  name: string;
  linkedCollectionId?: string;
}

interface UpdateSessionRequest {
  name?: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
}

// ============================================================================
// DynamoDB Client Setup
// ============================================================================

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const cloudWatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.SESSIONS_TABLE_NAME || 'Sessions-development';
const TTL_DAYS = 90;
const NAMESPACE = 'CollectionDataInheritance/Sessions';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Structured logging utility
 */
interface LogContext {
  operation: string;
  sessionId?: string;
  userId?: string;
  linkedCollectionId?: string;
  error?: string;
  latency?: number;
  [key: string]: any;
}

function logInfo(message: string, context?: LogContext): void {
  console.log(JSON.stringify({
    level: 'INFO',
    timestamp: new Date().toISOString(),
    message,
    ...context,
  }));
}

function logError(message: string, error: any, context?: LogContext): void {
  console.error(JSON.stringify({
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
    ...context,
  }));
}

function logWarning(message: string, context?: LogContext): void {
  console.warn(JSON.stringify({
    level: 'WARNING',
    timestamp: new Date().toISOString(),
    message,
    ...context,
  }));
}

/**
 * Publish CloudWatch metric
 */
async function publishMetric(
  metricName: string,
  value: number,
  unit: 'Count' | 'Milliseconds' | 'Percent' = 'Count',
  dimensions?: Record<string, string>
): Promise<void> {
  try {
    const metricData: any = {
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
    };

    if (dimensions) {
      metricData.Dimensions = Object.entries(dimensions).map(([Name, Value]) => ({
        Name,
        Value,
      }));
    }

    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [metricData],
      })
    );
  } catch (error) {
    // Don't fail the request if metrics fail
    console.error('⚠️ Failed to publish metric:', error);
  }
}

/**
 * Measure execution time and publish metric
 */
async function measureLatency<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const latency = Date.now() - startTime;
    await publishMetric(`${operation}Latency`, latency, 'Milliseconds', {
      Operation: operation,
    });
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    await publishMetric(`${operation}Latency`, latency, 'Milliseconds', {
      Operation: operation,
      Status: 'Error',
    });
    throw error;
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate TTL timestamp (90 days from now)
 */
function calculateTTL(): number {
  const now = Math.floor(Date.now() / 1000);
  return now + (TTL_DAYS * 24 * 60 * 60);
}

/**
 * Extract user ID from event (from Cognito authorizer)
 */
function getUserId(event: APIGatewayProxyEventV2): string {
  // In production, this would come from Cognito JWT claims
  // For now, use a default user
  const authorizer = (event.requestContext as any).authorizer;
  const claims = authorizer?.jwt?.claims;
  return claims?.sub || 'current-user';
}

/**
 * Create success response
 */
function successResponse(data: any, statusCode: number = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

/**
 * Create error response
 */
function errorResponse(
  error: string,
  statusCode: number = 500,
  details?: any
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      error,
      ...(details && { details }),
    }),
  };
}

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * POST /api/sessions/create
 * Create a new session with optional collection link
 */
async function createSession(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  
  try {
    const body: CreateSessionRequest = JSON.parse(event.body || '{}');
    const { name, linkedCollectionId } = body;

    if (!name) {
      await publishMetric('SessionCreationError', 1, 'Count', { ErrorType: 'ValidationError' });
      return errorResponse('name is required', 400);
    }

    const userId = getUserId(event);
    const sessionId = generateSessionId();
    const now = new Date().toISOString();

    const session: Session = {
      id: sessionId,
      name,
      owner: userId,
      createdAt: now,
      updatedAt: now,
      ttl: calculateTTL(),
    };

    // Add optional linkedCollectionId
    if (linkedCollectionId) {
      session.linkedCollectionId = linkedCollectionId;
    }

    logInfo('Creating session', {
      operation: 'createSession',
      sessionId,
      userId,
      linkedCollectionId,
      hasCollectionLink: !!linkedCollectionId,
    });

    // DynamoDB item with sessionId as partition key (table schema uses sessionId, not id)
    const dynamoItem = {
      sessionId: sessionId, // Partition key for DynamoDB
      id: sessionId, // Keep id field for consistency
      name,
      owner: userId,
      createdAt: now,
      updatedAt: now,
      ttl: calculateTTL(),
      ...(linkedCollectionId && { linkedCollectionId }),
    };

    await measureLatency('SessionCreate', async () => {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: dynamoItem,
        })
      );
    });

    logInfo('Session created successfully', {
      operation: 'createSession',
      sessionId,
      userId,
      linkedCollectionId,
      latency: Date.now() - startTime,
    });

    // Publish success metrics
    await publishMetric('SessionCreated', 1, 'Count', {
      HasCollectionLink: linkedCollectionId ? 'true' : 'false',
    });

    const totalLatency = Date.now() - startTime;
    await publishMetric('SessionCreationLatency', totalLatency, 'Milliseconds');

    return successResponse({
      success: true,
      session,
      sessionId,
      message: 'Session created successfully',
    });
  } catch (error) {
    logError('Failed to create session', error, {
      operation: 'createSession',
      userId: getUserId(event),
      latency: Date.now() - startTime,
    });
    await publishMetric('SessionCreationError', 1, 'Count', { ErrorType: 'InternalError' });
    return errorResponse(
      'Failed to create session',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/sessions/{id}
 * Retrieve a session by ID
 */
async function getSession(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  
  try {
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      await publishMetric('SessionRetrievalError', 1, 'Count', { ErrorType: 'ValidationError' });
      return errorResponse('sessionId is required', 400);
    }

    logInfo('Retrieving session', {
      operation: 'getSession',
      sessionId,
    });

    const result = await measureLatency('SessionGet', async () => {
      return await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { sessionId: sessionId },
        })
      );
    });

    if (!result.Item) {
      logWarning('Session not found', {
        operation: 'getSession',
        sessionId,
      });
      await publishMetric('SessionRetrievalError', 1, 'Count', { ErrorType: 'NotFound' });
      return errorResponse('Session not found', 404, { sessionId });
    }

    const session = result.Item as Session;
    const userId = getUserId(event);

    // Verify ownership
    if (session.owner !== userId) {
      logWarning('Unauthorized session access attempt', {
        operation: 'getSession',
        sessionId,
        userId,
        sessionOwner: session.owner,
      });
      await publishMetric('SessionRetrievalError', 1, 'Count', { ErrorType: 'Unauthorized' });
      return errorResponse('Unauthorized', 403);
    }

    logInfo('Session retrieved successfully', {
      operation: 'getSession',
      sessionId,
      userId,
      hasCollectionLink: !!session.linkedCollectionId,
      latency: Date.now() - startTime,
    });

    // Publish success metrics
    await publishMetric('SessionRetrieved', 1, 'Count', {
      HasCollectionLink: session.linkedCollectionId ? 'true' : 'false',
    });

    const totalLatency = Date.now() - startTime;
    await publishMetric('SessionRetrievalLatency', totalLatency, 'Milliseconds');

    return successResponse({
      success: true,
      session,
    });
  } catch (error) {
    logError('Failed to retrieve session', error, {
      operation: 'getSession',
      sessionId: event.pathParameters?.id,
      latency: Date.now() - startTime,
    });
    await publishMetric('SessionRetrievalError', 1, 'Count', { ErrorType: 'InternalError' });
    return errorResponse(
      'Failed to retrieve session',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * PUT /api/sessions/{id}
 * Update a session
 */
async function updateSession(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  
  try {
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      return errorResponse('sessionId is required', 400);
    }

    const body: UpdateSessionRequest = JSON.parse(event.body || '{}');
    const { name, linkedCollectionId, collectionContext } = body;

    logInfo('Updating session', {
      operation: 'updateSession',
      sessionId,
      hasName: !!name,
      hasLinkedCollectionId: linkedCollectionId !== undefined,
      hasCollectionContext: !!collectionContext,
    });

    // First, verify session exists and user owns it
    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { sessionId: sessionId },
      })
    );

    if (!getResult.Item) {
      return errorResponse('Session not found', 404, { sessionId });
    }

    const session = getResult.Item as Session;
    const userId = getUserId(event);

    if (session.owner !== userId) {
      return errorResponse('Unauthorized', 403);
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (name !== undefined) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (linkedCollectionId !== undefined) {
      updateExpressions.push('#linkedCollectionId = :linkedCollectionId');
      expressionAttributeNames['#linkedCollectionId'] = 'linkedCollectionId';
      expressionAttributeValues[':linkedCollectionId'] = linkedCollectionId;
    }

    if (collectionContext !== undefined) {
      updateExpressions.push('#collectionContext = :collectionContext');
      expressionAttributeNames['#collectionContext'] = 'collectionContext';
      expressionAttributeValues[':collectionContext'] = collectionContext;
    }

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // Only updatedAt, nothing else to update
      return errorResponse('No fields to update', 400);
    }

    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { sessionId: sessionId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    logInfo('Session updated successfully', {
      operation: 'updateSession',
      sessionId,
      userId: getUserId(event),
      latency: Date.now() - startTime,
    });

    return successResponse({
      success: true,
      session: updateResult.Attributes as Session,
      message: 'Session updated successfully',
    });
  } catch (error) {
    logError('Failed to update session', error, {
      operation: 'updateSession',
      sessionId: event.pathParameters?.id,
      latency: Date.now() - startTime,
    });
    return errorResponse(
      'Failed to update session',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * DELETE /api/sessions/{id}
 * Delete a session
 */
async function deleteSession(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  
  try {
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      return errorResponse('sessionId is required', 400);
    }

    logInfo('Deleting session', {
      operation: 'deleteSession',
      sessionId,
    });

    // First, verify session exists and user owns it
    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { sessionId: sessionId },
      })
    );

    if (!getResult.Item) {
      return errorResponse('Session not found', 404, { sessionId });
    }

    const session = getResult.Item as Session;
    const userId = getUserId(event);

    if (session.owner !== userId) {
      return errorResponse('Unauthorized', 403);
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { sessionId: sessionId },
      })
    );

    logInfo('Session deleted successfully', {
      operation: 'deleteSession',
      sessionId,
      userId: getUserId(event),
      latency: Date.now() - startTime,
    });

    return successResponse({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    logError('Failed to delete session', error, {
      operation: 'deleteSession',
      sessionId: event.pathParameters?.id,
      latency: Date.now() - startTime,
    });
    return errorResponse(
      'Failed to delete session',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/sessions/list
 * List all sessions for the current user
 */
async function listSessions(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();
  
  try {
    const userId = getUserId(event);

    logInfo('Listing sessions', {
      operation: 'listSessions',
      userId,
    });

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'owner-createdAt-index',
        KeyConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: {
          '#owner': 'owner',
        },
        ExpressionAttributeValues: {
          ':owner': userId,
        },
        ScanIndexForward: false, // Sort by createdAt descending (newest first)
      })
    );

    const sessions = (result.Items || []) as Session[];

    logInfo('Sessions listed successfully', {
      operation: 'listSessions',
      userId,
      sessionCount: sessions.length,
      latency: Date.now() - startTime,
    });

    return successResponse({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    logError('Failed to list sessions', error, {
      operation: 'listSessions',
      userId: getUserId(event),
      latency: Date.now() - startTime,
    });
    return errorResponse(
      'Failed to list sessions',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  logInfo('Sessions API request received', {
    operation: 'handler',
    requestId,
    path,
    method,
    sourceIp: event.requestContext.http.sourceIp,
  });

  try {
    // POST /api/sessions/create
    if (path === '/api/sessions/create' && method === 'POST') {
      return await createSession(event);
    }

    // GET /api/sessions/list
    if (path === '/api/sessions/list' && method === 'GET') {
      return await listSessions(event);
    }

    // GET /api/sessions/{id}
    if (path.startsWith('/api/sessions/') && method === 'GET' && path !== '/api/sessions/list') {
      return await getSession(event);
    }

    // PUT /api/sessions/{id}
    if (path.startsWith('/api/sessions/') && method === 'PUT') {
      return await updateSession(event);
    }

    // DELETE /api/sessions/{id}
    if (path.startsWith('/api/sessions/') && method === 'DELETE') {
      return await deleteSession(event);
    }

    logWarning('Route not found', {
      operation: 'handler',
      path,
      method,
    });
    return errorResponse('Not found', 404);
  } catch (error) {
    logError('Sessions API error', error, {
      operation: 'handler',
      path,
      method,
    });
    return errorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
