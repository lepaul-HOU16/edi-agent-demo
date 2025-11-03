#!/usr/bin/env node

/**
 * Test writing directly to DynamoDB ChatMessage table
 * This mimics what the orchestrator does
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

async function testWrite() {
  const client = new DynamoDBClient({ region: 'us-east-1' });
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
      convertClassInstanceToMap: false
    }
  });
  
  const tableName = 'ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE';
  const sessionId = '83af9827-6841-4749-bb65-a6255f8f4f7a';
  const userId = '34483498-6001-703b-9371-6948f8d6fb94';
  
  console.log('🧪 Testing DynamoDB write...\n');
  console.log(`Table: ${tableName}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`User ID: ${userId}\n`);
  
  const testMessage = {
    id: `test-msg-${Date.now()}`,
    chatSessionId: sessionId,
    owner: userId,
    role: 'ai',
    content: {
      text: 'Test message from script'
    },
    responseComplete: true,
    artifacts: [{
      type: 'test',
      data: { message: 'This is a test' }
    }],
    thoughtSteps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('📝 Writing test message:', testMessage.id);
  
  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: testMessage
    }));
    
    console.log('✅ Write successful!\n');
    
    // Try to read it back
    console.log('📖 Reading message back...');
    
    const getResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: {
        id: testMessage.id
      }
    }));
    
    if (getResult.Item) {
      console.log('✅ Message found in DynamoDB!');
      console.log(JSON.stringify(getResult.Item, null, 2));
    } else {
      console.log('❌ Message NOT found in DynamoDB after write!');
      console.log('This suggests the write succeeded but the item is not persisted.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nError details:');
    console.error('  Name:', error.name);
    console.error('  Message:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Table not found');
    } else if (error.name === 'AccessDeniedException') {
      console.error('\n⚠️  Permission denied - check IAM permissions');
    } else if (error.name === 'ValidationException') {
      console.error('\n⚠️  Invalid data format');
    }
  }
}

testWrite().catch(console.error);
