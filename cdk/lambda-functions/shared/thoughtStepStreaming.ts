/**
 * Shared Thought Step Streaming Utilities
 * 
 * Provides realtime chain-of-thought streaming to DynamoDB for all agents.
 * Thought steps are written immediately as they complete, allowing frontend
 * to poll and display progress in realtime.
 */

export interface ThoughtStep {
  step: number | string;
  action?: string;
  reasoning?: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error' | 'thinking';
  timestamp: string;
  duration?: number;
  error?: {
    message: string;
    suggestion?: string;
  };
  // Legacy fields for backward compatibility
  type?: string;
  title?: string;
  summary?: string;
  details?: string;
}

/**
 * Write thought step to DynamoDB immediately for realtime updates
 */
export async function streamThoughtStepToDynamoDB(
  sessionId: string | undefined,
  userId: string | undefined,
  thoughtStep: ThoughtStep
): Promise<void> {
  if (!sessionId || !userId) {
    console.log('⚠️ Skipping thought step streaming - no sessionId or userId');
    return;
  }

  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const tableName = process.env.CHAT_MESSAGE_TABLE_NAME || 
                     process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME ||
                     process.env.CHAT_MESSAGE_TABLE;
    
    if (!tableName) {
      console.error('❌ No ChatMessage table name configured');
      return;
    }
    
    // Create a streaming message ID for this session
    const streamingMessageId = `streaming-${sessionId}`;
    
    // Update or create the streaming message with latest thought steps
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: {
        id: streamingMessageId,
        chatSessionId: sessionId
      },
      UpdateExpression: 'SET #thoughtSteps = list_append(if_not_exists(#thoughtSteps, :empty_list), :new_step), #role = :role, #updatedAt = :updatedAt, #userId = :userId',
      ExpressionAttributeNames: {
        '#thoughtSteps': 'thoughtSteps',
        '#role': 'role',
        '#updatedAt': 'updatedAt',
        '#userId': 'owner'
      },
      ExpressionAttributeValues: {
        ':new_step': [thoughtStep],
        ':empty_list': [],
        ':role': 'ai-stream',
        ':updatedAt': new Date().toISOString(),
        ':userId': userId
      }
    }));
    
    console.log(`🌊 Streamed thought step ${thoughtStep.step} to DynamoDB`);
  } catch (error) {
    console.error('❌ Failed to stream thought step:', error);
    // Don't throw - streaming is best-effort
  }
}

/**
 * Add thought step and stream to DynamoDB
 * Use this instead of thoughtSteps.push() for realtime updates
 */
export async function addStreamingThoughtStep<T extends ThoughtStep>(
  thoughtSteps: T[],
  step: T,
  sessionId: string | undefined,
  userId: string | undefined
): Promise<void> {
  thoughtSteps.push(step);
  await streamThoughtStepToDynamoDB(sessionId, userId, step);
}

/**
 * Update thought step and stream to DynamoDB
 * Use this when updating a step's status to complete/error
 */
export async function updateStreamingThoughtStep<T extends ThoughtStep>(
  thoughtSteps: T[],
  index: number,
  updates: Partial<T>,
  sessionId: string | undefined,
  userId: string | undefined
): Promise<void> {
  thoughtSteps[index] = { ...thoughtSteps[index], ...updates };
  await streamThoughtStepToDynamoDB(sessionId, userId, thoughtSteps[index]);
}

/**
 * Clear streaming message when analysis completes
 * This prevents old thought steps from showing on next query
 */
export async function clearStreamingMessage(
  sessionId: string | undefined
): Promise<void> {
  if (!sessionId) return;

  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const tableName = process.env.CHAT_MESSAGE_TABLE_NAME || 
                     process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME ||
                     process.env.CHAT_MESSAGE_TABLE;
    
    if (!tableName) return;
    
    const streamingMessageId = `streaming-${sessionId}`;
    
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: {
        id: streamingMessageId,
        chatSessionId: sessionId
      }
    }));
    
    console.log(`🧹 Cleared streaming message for session ${sessionId}`);
  } catch (error) {
    console.error('❌ Failed to clear streaming message:', error);
  }
}
