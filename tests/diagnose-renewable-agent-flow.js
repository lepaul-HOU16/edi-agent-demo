/**
 * Diagnostic Test: Renewable Agent Flow
 * 
 * This script helps diagnose the renewable agent issue by:
 * 1. Reproducing the exact user-reported issue
 * 2. Tracing the complete flow through logs
 * 3. Verifying message persistence
 * 4. Checking API response format
 * 5. Identifying where the flow breaks
 */

const https = require('https');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const logs = new AWS.CloudWatchLogs();

// Test configuration
const TEST_CONFIG = {
  // This will be filled in from environment or CDK outputs
  chatApiEndpoint: process.env.CHAT_API_ENDPOINT || '',
  chatSessionId: `test-session-${Date.now()}`,
  testQuery: 'Analyze terrain at 40.7128, -74.0060',
  agentType: 'renewable'
};

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 DIAGNOSTIC TEST: Renewable Agent Flow');
console.log('═══════════════════════════════════════════════════════════');
console.log('Test Configuration:');
console.log('  Session ID:', TEST_CONFIG.chatSessionId);
console.log('  Query:', TEST_CONFIG.testQuery);
console.log('  Agent Type:', TEST_CONFIG.agentType);
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Step 1: Send message through Chat API
 */
async function step1_SendMessage() {
  console.log('\n📤 STEP 1: Sending message through Chat API');
  console.log('─────────────────────────────────────────────────────────');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: TEST_CONFIG.testQuery,
      chatSessionId: TEST_CONFIG.chatSessionId,
      conversationHistory: []
    });
    
    const url = new URL(TEST_CONFIG.chatApiEndpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('Request:', {
      url: TEST_CONFIG.chatApiEndpoint,
      body: JSON.parse(postData)
    });
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n✅ Response received:');
          console.log('  Status Code:', res.statusCode);
          console.log('  Success:', response.success);
          console.log('  Has Response:', !!response.response);
          console.log('  Response Text Length:', response.response?.text?.length || 0);
          console.log('  Artifact Count:', response.response?.artifacts?.length || 0);
          
          if (response.response?.artifacts) {
            console.log('\n📊 Artifacts:');
            response.response.artifacts.forEach((artifact, i) => {
              console.log(`  ${i + 1}. Type: ${artifact.type}`);
              console.log(`     Content Type: ${artifact.messageContentType}`);
            });
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Step 2: Check DynamoDB for message persistence
 */
async function step2_CheckDynamoDB() {
  console.log('\n💾 STEP 2: Checking DynamoDB for message persistence');
  console.log('─────────────────────────────────────────────────────────');
  
  const tableName = process.env.CHAT_MESSAGE_TABLE || 'ChatMessage';
  
  try {
    const params = {
      TableName: tableName,
      KeyConditionExpression: 'chatSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': TEST_CONFIG.chatSessionId
      }
    };
    
    console.log('Querying table:', tableName);
    console.log('Session ID:', TEST_CONFIG.chatSessionId);
    
    const result = await dynamodb.query(params).promise();
    
    console.log('\n✅ Messages found:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((item, i) => {
        console.log(`\n  Message ${i + 1}:`);
        console.log('    ID:', item.id);
        console.log('    Role:', item.role);
        console.log('    Text:', item.content?.text?.substring(0, 100) + '...');
        console.log('    Has Artifacts:', !!(item.artifacts && item.artifacts.length > 0));
        console.log('    Artifact Count:', item.artifacts?.length || 0);
        console.log('    Response Complete:', item.responseComplete);
        console.log('    Created At:', item.createdAt);
      });
    } else {
      console.warn('⚠️ No messages found in DynamoDB');
    }
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ DynamoDB query failed:', error);
    throw error;
  }
}

/**
 * Step 3: Check CloudWatch logs for the flow
 */
async function step3_CheckCloudWatchLogs() {
  console.log('\n📋 STEP 3: Checking CloudWatch logs');
  console.log('─────────────────────────────────────────────────────────');
  
  const logGroups = [
    '/aws/lambda/EnergyInsights-development-chat',
    '/aws/lambda/EnergyInsights-development-renewable-orchestrator'
  ];
  
  const startTime = Date.now() - (5 * 60 * 1000); // Last 5 minutes
  const endTime = Date.now();
  
  for (const logGroup of logGroups) {
    console.log(`\nChecking log group: ${logGroup}`);
    
    try {
      const params = {
        logGroupName: logGroup,
        startTime: startTime,
        endTime: endTime,
        filterPattern: TEST_CONFIG.chatSessionId,
        limit: 50
      };
      
      const result = await logs.filterLogEvents(params).promise();
      
      console.log(`  Found ${result.events?.length || 0} log events`);
      
      if (result.events && result.events.length > 0) {
        console.log('\n  Recent logs:');
        result.events.slice(0, 10).forEach((event) => {
          console.log(`    ${new Date(event.timestamp).toISOString()}: ${event.message}`);
        });
      }
    } catch (error) {
      console.warn(`  ⚠️ Could not access log group: ${error.message}`);
    }
  }
}

/**
 * Step 4: Verify API response format
 */
function step4_VerifyResponseFormat(apiResponse) {
  console.log('\n🔍 STEP 4: Verifying API response format');
  console.log('─────────────────────────────────────────────────────────');
  
  const checks = {
    hasSuccess: apiResponse.hasOwnProperty('success'),
    hasMessage: apiResponse.hasOwnProperty('message'),
    hasResponse: apiResponse.hasOwnProperty('response'),
    hasResponseText: apiResponse.response?.hasOwnProperty('text'),
    hasResponseArtifacts: apiResponse.response?.hasOwnProperty('artifacts'),
    artifactsIsArray: Array.isArray(apiResponse.response?.artifacts),
    artifactCount: apiResponse.response?.artifacts?.length || 0
  };
  
  console.log('Response structure checks:');
  Object.entries(checks).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`  ${icon} ${key}: ${value}`);
  });
  
  if (checks.artifactCount > 0) {
    console.log('\nArtifact structure:');
    apiResponse.response.artifacts.forEach((artifact, i) => {
      console.log(`  Artifact ${i + 1}:`);
      console.log('    Has type:', artifact.hasOwnProperty('type'));
      console.log('    Has messageContentType:', artifact.hasOwnProperty('messageContentType'));
      console.log('    Has data:', artifact.hasOwnProperty('data'));
      console.log('    Type value:', artifact.type);
      console.log('    Content type value:', artifact.messageContentType);
    });
  }
  
  return checks;
}

/**
 * Step 5: Diagnose the issue
 */
function step5_DiagnoseIssue(apiResponse, dbMessages, formatChecks) {
  console.log('\n🔬 STEP 5: Diagnosis');
  console.log('═══════════════════════════════════════════════════════════');
  
  const issues = [];
  
  // Check if API returned success
  if (!apiResponse.success) {
    issues.push({
      severity: 'CRITICAL',
      component: 'API Response',
      issue: 'API returned success: false',
      details: apiResponse.error || apiResponse.message
    });
  }
  
  // Check if response has text
  if (!apiResponse.response?.text) {
    issues.push({
      severity: 'CRITICAL',
      component: 'API Response',
      issue: 'No response text returned',
      details: 'response.text is missing or empty'
    });
  }
  
  // Check if response has artifacts
  if (!apiResponse.response?.artifacts || apiResponse.response.artifacts.length === 0) {
    issues.push({
      severity: 'HIGH',
      component: 'API Response',
      issue: 'No artifacts returned',
      details: 'response.artifacts is missing or empty array'
    });
  }
  
  // Check if messages were saved to DynamoDB
  if (dbMessages.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      component: 'Message Persistence',
      issue: 'No messages saved to DynamoDB',
      details: 'Neither user message nor AI response were persisted'
    });
  } else {
    // Check for user message
    const userMessage = dbMessages.find(m => m.role === 'user');
    if (!userMessage) {
      issues.push({
        severity: 'HIGH',
        component: 'Message Persistence',
        issue: 'User message not saved',
        details: 'User message missing from DynamoDB'
      });
    }
    
    // Check for AI message
    const aiMessage = dbMessages.find(m => m.role === 'ai');
    if (!aiMessage) {
      issues.push({
        severity: 'HIGH',
        component: 'Message Persistence',
        issue: 'AI message not saved',
        details: 'AI response missing from DynamoDB'
      });
    } else {
      // Check if AI message has artifacts
      if (!aiMessage.artifacts || aiMessage.artifacts.length === 0) {
        issues.push({
          severity: 'HIGH',
          component: 'Message Persistence',
          issue: 'AI message saved without artifacts',
          details: 'Artifacts were not included in persisted AI message'
        });
      }
    }
  }
  
  // Check response format
  if (!formatChecks.hasSuccess || !formatChecks.hasResponse) {
    issues.push({
      severity: 'CRITICAL',
      component: 'Response Format',
      issue: 'Invalid response structure',
      details: 'Response missing required fields (success, response)'
    });
  }
  
  // Print diagnosis
  if (issues.length === 0) {
    console.log('✅ NO ISSUES FOUND - System appears to be working correctly');
    console.log('\nIf the frontend still shows issues, the problem is likely in:');
    console.log('  - Frontend display logic (ChatMessage component)');
    console.log('  - Artifact rendering components');
    console.log('  - State management in ChatBox');
  } else {
    console.log(`❌ FOUND ${issues.length} ISSUE(S):\n`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity}] ${issue.component}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Details: ${issue.details}\n`);
    });
    
    console.log('RECOMMENDED ACTIONS:');
    issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.component}:`);
      if (issue.component === 'API Response' && issue.issue.includes('No artifacts')) {
        console.log('   → Check renewable orchestrator logs');
        console.log('   → Verify orchestrator is being invoked');
        console.log('   → Check if tools are returning artifacts');
      } else if (issue.component === 'Message Persistence') {
        console.log('   → Check Chat Lambda handler');
        console.log('   → Verify DynamoDB write operations');
        console.log('   → Check if artifacts are included in save operation');
      } else if (issue.component === 'Response Format') {
        console.log('   → Check Chat Lambda response structure');
        console.log('   → Verify response transformation logic');
      }
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
}

/**
 * Main diagnostic flow
 */
async function runDiagnostics() {
  try {
    // Step 1: Send message
    const apiResponse = await step1_SendMessage();
    
    // Wait a moment for DynamoDB writes
    console.log('\n⏳ Waiting 2 seconds for DynamoDB writes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Check DynamoDB
    const dbMessages = await step2_CheckDynamoDB();
    
    // Step 3: Check CloudWatch logs
    await step3_CheckCloudWatchLogs();
    
    // Step 4: Verify response format
    const formatChecks = step4_VerifyResponseFormat(apiResponse);
    
    // Step 5: Diagnose issues
    step5_DiagnoseIssue(apiResponse, dbMessages, formatChecks);
    
    console.log('\n✅ Diagnostic test complete');
    
  } catch (error) {
    console.error('\n❌ Diagnostic test failed:', error);
    process.exit(1);
  }
}

// Check if API endpoint is configured
if (!TEST_CONFIG.chatApiEndpoint) {
  console.error('❌ CHAT_API_ENDPOINT environment variable not set');
  console.error('Please set it to your Chat API endpoint URL');
  console.error('Example: export CHAT_API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/chat');
  process.exit(1);
}

// Run diagnostics
runDiagnostics();
