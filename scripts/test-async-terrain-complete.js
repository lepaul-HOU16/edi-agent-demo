#!/usr/bin/env node

/**
 * Test complete async terrain analysis flow
 * 1. Send query to lightweightAgent
 * 2. Get immediate "Analysis Started" response
 * 3. Wait for orchestrator to complete
 * 4. Check if results were written to DynamoDB
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const sessionId = `test-session-${Date.now()}`;
const userId = 'test-user';

async function testAsyncFlow() {
  console.log('🧪 Testing Async Terrain Analysis Flow');
  console.log('═══════════════════════════════════════\n');

  // Step 1: Send query to lightweightAgent
  console.log('📤 Step 1: Sending query to lightweightAgent...');
  const query = 'Analyze terrain for wind farm at coordinates 40.7128, -74.0060';
  
  const invokePayload = {
    query,
    userId,
    sessionId,
    context: {}
  };

  const invokeCommand = new InvokeCommand({
    FunctionName: 'amplify-digitalassistant--lightweightAgent-lambda',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(invokePayload)
  });

  const startTime = Date.now();
  const response = await lambda.send(invokeCommand);
  const responseTime = Date.now() - startTime;
  
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  console.log(`✅ Received response in ${responseTime}ms`);
  console.log('📋 Response:', JSON.stringify(result, null, 2));
  
  // Verify immediate response
  if (result.message && result.message.includes('Analysis Started')) {
    console.log('✅ Got immediate "Analysis Started" response\n');
  } else {
    console.log('❌ Expected "Analysis Started" message\n');
    return;
  }

  // Step 2: Wait for orchestrator to complete (30-60 seconds)
  console.log('⏳ Step 2: Waiting for orchestrator to complete (up to 90 seconds)...');
  
  let attempts = 0;
  const maxAttempts = 18; // 90 seconds / 5 seconds
  let foundResults = false;
  
  while (attempts < maxAttempts && !foundResults) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    console.log(`   Checking DynamoDB (attempt ${attempts}/${maxAttempts})...`);
    
    // Query DynamoDB for new messages in this session
    const queryCommand = new QueryCommand({
      TableName: process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME || 'ChatMessage',
      KeyConditionExpression: 'chatSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      },
      ScanIndexForward: false, // Most recent first
      Limit: 10
    });
    
    try {
      const queryResult = await docClient.send(queryCommand);
      
      if (queryResult.Items && queryResult.Items.length > 0) {
        // Look for AI response with artifacts
        const aiMessages = queryResult.Items.filter(item => 
          item.role === 'ai' && 
          item.artifacts && 
          item.artifacts.length > 0
        );
        
        if (aiMessages.length > 0) {
          foundResults = true;
          console.log('\n✅ Step 3: Found results in DynamoDB!');
          console.log('═══════════════════════════════════════\n');
          
          const message = aiMessages[0];
          console.log('📊 Results Summary:');
          console.log(`   Message ID: ${message.id}`);
          console.log(`   Text: ${message.content.text}`);
          console.log(`   Artifacts: ${message.artifacts.length}`);
          console.log(`   Thought Steps: ${message.thoughtSteps?.length || 0}`);
          console.log(`   Created: ${message.createdAt}`);
          
          if (message.artifacts.length > 0) {
            const artifact = message.artifacts[0];
            console.log('\n📦 First Artifact:');
            console.log(`   Type: ${artifact.type}`);
            console.log(`   Title: ${artifact.data?.title}`);
            console.log(`   Features: ${artifact.data?.metrics?.totalFeatures}`);
            console.log(`   Project ID: ${artifact.data?.projectId}`);
          }
          
          console.log('\n🎉 ASYNC FLOW WORKING CORRECTLY!');
          console.log('═══════════════════════════════════════');
          return;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Query error: ${error.message}`);
    }
  }
  
  if (!foundResults) {
    console.log('\n❌ Timeout: No results found in DynamoDB after 90 seconds');
    console.log('   Check CloudWatch logs for orchestrator errors');
  }
}

testAsyncFlow().catch(console.error);
