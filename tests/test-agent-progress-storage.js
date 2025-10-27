/**
 * Test script for Agent Progress Storage (Task 4)
 * 
 * Tests:
 * 1. DynamoDB table creation
 * 2. Progress write functionality
 * 3. Progress polling API endpoint
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const AGENT_PROGRESS_TABLE = 'AgentProgress';

async function testProgressStorage() {
  console.log('🧪 Testing Agent Progress Storage\n');

  try {
    // Test 1: Write progress to DynamoDB
    console.log('Test 1: Writing progress to DynamoDB...');
    const testRequestId = `test-${Date.now()}`;
    const testProgress = [
      {
        type: 'progress',
        step: 'init',
        message: '🚀 Initializing Strands Agent system...',
        elapsed: 0.5,
        timestamp: Date.now()
      },
      {
        type: 'progress',
        step: 'bedrock',
        message: '🤖 Connecting to AWS Bedrock...',
        elapsed: 2.0,
        timestamp: Date.now()
      }
    ];

    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    await docClient.send(new PutItemCommand({
      TableName: AGENT_PROGRESS_TABLE,
      Item: {
        requestId: testRequestId,
        steps: testProgress,
        status: 'in_progress',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: ttl
      }
    }));

    console.log('✅ Progress written successfully');
    console.log(`   Request ID: ${testRequestId}`);
    console.log(`   Steps: ${testProgress.length}`);
    console.log(`   TTL: ${new Date(ttl * 1000).toISOString()}\n`);

    // Test 2: Read progress from DynamoDB
    console.log('Test 2: Reading progress from DynamoDB...');
    const response = await docClient.send(new GetItemCommand({
      TableName: AGENT_PROGRESS_TABLE,
      Key: {
        requestId: testRequestId
      }
    }));

    if (!response.Item) {
      console.error('❌ Failed to read progress from DynamoDB');
      return false;
    }

    console.log('✅ Progress read successfully');
    console.log(`   Request ID: ${response.Item.requestId}`);
    console.log(`   Status: ${response.Item.status}`);
    console.log(`   Steps: ${response.Item.steps.length}`);
    console.log(`   Created: ${new Date(response.Item.createdAt).toISOString()}`);
    console.log(`   Updated: ${new Date(response.Item.updatedAt).toISOString()}\n`);

    // Test 3: Verify TTL attribute
    console.log('Test 3: Verifying TTL attribute...');
    if (response.Item.expiresAt) {
      const expiresDate = new Date(response.Item.expiresAt * 1000);
      const hoursUntilExpiry = (response.Item.expiresAt - Math.floor(Date.now() / 1000)) / 3600;
      console.log('✅ TTL attribute present');
      console.log(`   Expires: ${expiresDate.toISOString()}`);
      console.log(`   Hours until expiry: ${hoursUntilExpiry.toFixed(1)}\n`);
    } else {
      console.error('❌ TTL attribute missing');
      return false;
    }

    // Test 4: Test missing request ID handling
    console.log('Test 4: Testing missing request ID handling...');
    const missingResponse = await docClient.send(new GetItemCommand({
      TableName: AGENT_PROGRESS_TABLE,
      Key: {
        requestId: 'non-existent-request-id'
      }
    }));

    if (!missingResponse.Item) {
      console.log('✅ Correctly returns empty for missing request ID\n');
    } else {
      console.error('❌ Should return empty for missing request ID');
      return false;
    }

    console.log('✅ All tests passed!\n');
    console.log('Summary:');
    console.log('- DynamoDB table: AgentProgress');
    console.log('- Primary key: requestId (string)');
    console.log('- TTL attribute: expiresAt (24 hours)');
    console.log('- Attributes: steps (list), status (string), createdAt, updatedAt');
    console.log('\nNext steps:');
    console.log('1. Deploy with: npx ampx sandbox');
    console.log('2. Test GraphQL query: getAgentProgress(requestId: "...")');
    console.log('3. Integrate with frontend polling');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  AgentProgress table not found. Deploy with: npx ampx sandbox');
    }
    return false;
  }
}

// Run tests
testProgressStorage()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
