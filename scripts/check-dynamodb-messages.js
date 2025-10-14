#!/usr/bin/env node

/**
 * Check DynamoDB ChatMessage table for recent messages
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

async function checkMessages() {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const docClient = DynamoDBDocumentClient.from(client);
  
  const tableName = 'ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE';
  const sessionId = 'd8490293-3ded-4980-a6d9-4a17eafa3c19'; // From console errors
  
  console.log('🔍 Checking DynamoDB ChatMessage table...\n');
  console.log(`Table: ${tableName}`);
  console.log(`Session ID: ${sessionId}\n`);
  
  try {
    // Query for messages in this session
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'chatSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      },
      Limit: 20
    });
    
    const response = await docClient.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      console.log('❌ No messages found in this session');
      return;
    }
    
    console.log(`✅ Found ${response.Items.length} messages:\n`);
    
    // Sort by creation time
    const sortedMessages = response.Items.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
    
    sortedMessages.forEach((msg, index) => {
      console.log(`${'='.repeat(60)}`);
      console.log(`Message ${index + 1}:`);
      console.log(`${'='.repeat(60)}`);
      console.log(`ID: ${msg.id}`);
      console.log(`Role: ${msg.role}`);
      console.log(`Created: ${msg.createdAt}`);
      console.log(`Response Complete: ${msg.responseComplete}`);
      console.log(`Has Artifacts: ${!!(msg.artifacts && msg.artifacts.length > 0)}`);
      
      if (msg.artifacts && msg.artifacts.length > 0) {
        console.log(`\nArtifacts (${msg.artifacts.length}):`);
        msg.artifacts.forEach((artifact, i) => {
          console.log(`  ${i + 1}. Type: ${artifact.type || artifact.messageContentType}`);
          if (artifact.data) {
            console.log(`     Title: ${artifact.data.title}`);
            console.log(`     Has geojson: ${!!artifact.data.geojson}`);
            console.log(`     Has geojsonS3Key: ${!!artifact.data.geojsonS3Key}`);
            console.log(`     Total Features: ${artifact.data.metrics?.totalFeatures}`);
          }
        });
      }
      
      if (msg.content) {
        const contentText = typeof msg.content === 'string' 
          ? msg.content 
          : msg.content.text || JSON.stringify(msg.content);
        console.log(`\nContent: ${contentText.substring(0, 200)}${contentText.length > 200 ? '...' : ''}`);
      }
      
      console.log('');
    });
    
    // Check for the specific message from logs
    const targetMessageId = 'msg-1760443472892-egg8qn0wd';
    const targetMessage = sortedMessages.find(m => m.id === targetMessageId);
    
    if (targetMessage) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ FOUND TARGET MESSAGE: ${targetMessageId}`);
      console.log(`${'='.repeat(60)}`);
      console.log(JSON.stringify(targetMessage, null, 2));
    } else {
      console.log(`\n❌ Target message ${targetMessageId} NOT FOUND in DynamoDB`);
    }
    
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    console.error('\nMake sure:');
    console.error('1. AWS credentials are configured');
    console.error('2. You have DynamoDB read permissions');
    console.error('3. The table name is correct');
  }
}

checkMessages().catch(console.error);
