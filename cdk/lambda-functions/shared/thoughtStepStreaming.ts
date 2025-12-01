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
 * This function replaces the entire thought steps array to ensure updates are reflected
 */
export async function streamThoughtStepToDynamoDB(
  sessionId: string | undefined,
  userId: string | undefined,
  thoughtStep: ThoughtStep,
  allThoughtSteps?: ThoughtStep[]
): Promise<void> {
  if (!sessionId || !userId) {
    console.log('⚠️ [STREAMING] Skipping thought step streaming - no sessionId or userId');
    return;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌊 [STREAMING] Writing thought steps to DynamoDB');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🆔 Session ID:', sessionId);
    console.log('👤 User ID:', userId);
    console.log('📊 Thought Step Count:', allThoughtSteps?.length || 1);
    console.log('🔄 Current Step:', thoughtStep.step);
    console.log('🎬 Action:', thoughtStep.action);
    console.log('📈 Status:', thoughtStep.status);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const tableName = process.env.CHAT_MESSAGE_TABLE_NAME || 
                     process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME ||
                     process.env.CHAT_MESSAGE_TABLE;
    
    if (!tableName) {
      console.error('❌ [STREAMING] No ChatMessage table name configured');
      console.error('Environment variables checked:');
      console.error('  - CHAT_MESSAGE_TABLE_NAME:', process.env.CHAT_MESSAGE_TABLE_NAME);
      console.error('  - AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME:', process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME);
      console.error('  - CHAT_MESSAGE_TABLE:', process.env.CHAT_MESSAGE_TABLE);
      return;
    }
    
    console.log('📦 Table Name:', tableName);
    
    // Create a streaming message ID for this session
    const streamingMessageId = `streaming-${sessionId}`;
    console.log('🆔 Streaming Message ID:', streamingMessageId);
    
    const item = {
      id: streamingMessageId,
      chatSessionId: sessionId,
      thoughtSteps: allThoughtSteps || [thoughtStep],
      role: 'ai-stream',
      updatedAt: new Date().toISOString(),
      owner: userId,
      createdAt: new Date().toISOString()
    };
    
    console.log('📝 Writing item:', JSON.stringify(item, null, 2));
    
    // Use PutCommand to replace the entire message with current thought steps
    // This ensures updates are reflected properly
    const startTime = Date.now();
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: item
    }));
    const duration = Date.now() - startTime;
    
    console.log('✅ [STREAMING] Successfully streamed thought steps');
    console.log('⏱️  Write Duration:', duration, 'ms');
    console.log('📊 Steps Written:', allThoughtSteps?.length || 1);
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.log('═══════════════════════════════════════════════════════════');
    console.error('❌ [STREAMING] FAILED TO STREAM THOUGHT STEP');
    console.log('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : String(error));
    console.error('🆔 Session ID:', sessionId);
    console.error('👤 User ID:', userId);
    console.error('🔄 Step:', thoughtStep.step);
    console.error('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
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
  await streamThoughtStepToDynamoDB(sessionId, userId, step, thoughtSteps as ThoughtStep[]);
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
  await streamThoughtStepToDynamoDB(sessionId, userId, thoughtSteps[index], thoughtSteps as ThoughtStep[]);
}

/**
 * Clear streaming message when analysis completes
 * This prevents old thought steps from showing on next query
 */
export async function clearStreamingMessage(
  sessionId: string | undefined
): Promise<void> {
  if (!sessionId) {
    console.log('⚠️ [CLEANUP] Skipping cleanup - no sessionId');
    return;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧹 [CLEANUP] Clearing streaming message');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🆔 Session ID:', sessionId);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const tableName = process.env.CHAT_MESSAGE_TABLE_NAME || 
                     process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME ||
                     process.env.CHAT_MESSAGE_TABLE;
    
    if (!tableName) {
      console.error('❌ [CLEANUP] No ChatMessage table name configured');
      return;
    }
    
    console.log('📦 Table Name:', tableName);
    
    const streamingMessageId = `streaming-${sessionId}`;
    console.log('🆔 Streaming Message ID:', streamingMessageId);
    
    const startTime = Date.now();
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: {
        id: streamingMessageId
      }
    }));
    const duration = Date.now() - startTime;
    
    console.log('✅ [CLEANUP] Successfully cleared streaming message');
    console.log('⏱️  Delete Duration:', duration, 'ms');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.log('═══════════════════════════════════════════════════════════');
    console.error('❌ [CLEANUP] FAILED TO CLEAR STREAMING MESSAGE');
    console.log('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : String(error));
    console.error('🆔 Session ID:', sessionId);
    console.error('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
  }
}

/**
 * Cleanup all streaming messages for a session
 * 
 * This function queries DynamoDB for all messages with role='ai-stream' in the given session
 * and deletes them. This prevents stale "Thinking" indicators from appearing after page reload.
 * 
 * @param sessionId - The chat session ID to clean up
 * @param userId - The user ID (owner) of the messages
 * @returns Object containing count of deleted messages and any errors encountered
 */
export async function cleanupStreamingMessages(
  sessionId: string | undefined,
  userId: string | undefined
): Promise<{ deleted: number; errors: string[] }> {
  const result = { deleted: 0, errors: [] as string[] };
  
  if (!sessionId || !userId) {
    const error = 'Missing sessionId or userId for cleanup';
    console.log(`⚠️ ${error}`);
    result.errors.push(error);
    return result;
  }

  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const tableName = process.env.CHAT_MESSAGE_TABLE_NAME || 
                     process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME ||
                     process.env.CHAT_MESSAGE_TABLE;
    
    if (!tableName) {
      const error = 'No ChatMessage table name configured';
      console.error(`❌ ${error}`);
      result.errors.push(error);
      return result;
    }
    
    console.log(`🧹 Starting cleanup of streaming messages for session: ${sessionId}`);
    
    // Query for all messages in this session with role='ai-stream'
    // We need to scan the table since we're filtering by role, not querying by key
    const queryParams = {
      TableName: tableName,
      IndexName: 'byChatSession', // Use GSI to query by chatSessionId
      KeyConditionExpression: 'chatSessionId = :sessionId',
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
        ':role': 'ai-stream'
      }
    };
    
    console.log(`🔍 Querying for streaming messages in session ${sessionId}`);
    const queryResult = await docClient.send(new QueryCommand(queryParams));
    
    const streamingMessages = queryResult.Items || [];
    console.log(`📊 Found ${streamingMessages.length} streaming message(s) to delete`);
    
    // Delete each streaming message
    for (const message of streamingMessages) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: tableName,
          Key: {
            id: message.id,
            chatSessionId: message.chatSessionId
          }
        }));
        
        result.deleted++;
        console.log(`✅ Deleted streaming message: ${message.id}`);
      } catch (deleteError: any) {
        const error = `Failed to delete message ${message.id}: ${deleteError.message}`;
        console.error(`❌ ${error}`);
        result.errors.push(error);
      }
    }
    
    console.log(`🧹 Cleanup complete: ${result.deleted} message(s) deleted, ${result.errors.length} error(s)`);
    
  } catch (error: any) {
    const errorMsg = `Cleanup failed: ${error.message}`;
    console.error(`❌ ${errorMsg}`, error);
    result.errors.push(errorMsg);
  }
  
  return result;
}
