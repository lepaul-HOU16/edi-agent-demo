#!/usr/bin/env node

/**
 * Check CloudWatch logs for renewableOrchestrator Lambda
 * Task 2: Diagnose Renewable Access Failure
 */

const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} = require('@aws-sdk/client-cloudwatch-logs');

const client = new CloudWatchLogsClient({});

async function checkOrchestratorLogs() {
  console.log('🔍 Checking CloudWatch logs for renewableOrchestrator Lambda\n');
  console.log('=' .repeat(80));
  
  const logGroupName = '/aws/lambda/renewableOrchestrator';
  
  try {
    // Step 1: Check if log group exists
    console.log('\n📋 Step 1: Checking if log group exists...');
    console.log(`Log Group: ${logGroupName}`);
    
    const describeCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName,
    });
    
    const logGroupsResponse = await client.send(describeCommand);
    
    if (!logGroupsResponse.logGroups || logGroupsResponse.logGroups.length === 0) {
      console.log('\n❌ FINDING: Log group does NOT exist');
      console.log('\n📊 DIAGNOSIS:');
      console.log('   - renewableOrchestrator Lambda is likely NOT deployed');
      console.log('   - OR Lambda has never been invoked (no logs created yet)');
      console.log('   - OR Lambda name is different than expected');
      console.log('\n💡 RECOMMENDATION:');
      console.log('   1. Run: node scripts/check-lambda-exists.js');
      console.log('   2. Verify Lambda deployment status');
      console.log('   3. Check if Lambda name matches "renewableOrchestrator"');
      
      return {
        exists: false,
        deployed: false,
        invoked: false,
        diagnosis: 'Lambda not deployed or never invoked',
      };
    }
    
    console.log('✅ Log group EXISTS');
    const logGroup = logGroupsResponse.logGroups[0];
    console.log(`   Created: ${new Date(logGroup.creationTime).toISOString()}`);
    console.log(`   Stored Bytes: ${logGroup.storedBytes || 0}`);
    
    // Step 2: Check log streams
    console.log('\n📋 Step 2: Checking log streams...');
    
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 10,
    });
    
    const streamsResponse = await client.send(streamsCommand);
    
    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      console.log('\n⚠️  FINDING: No log streams found');
      console.log('\n📊 DIAGNOSIS:');
      console.log('   - Lambda is deployed but has NEVER been invoked');
      console.log('   - No requests have reached the orchestrator');
      console.log('\n💡 RECOMMENDATION:');
      console.log('   1. Check if lightweightAgent is calling the orchestrator');
      console.log('   2. Verify environment variable RENEWABLE_ORCHESTRATOR_FUNCTION_NAME');
      console.log('   3. Check IAM permissions for Lambda invocation');
      
      return {
        exists: true,
        deployed: true,
        invoked: false,
        diagnosis: 'Lambda deployed but never invoked',
      };
    }
    
    console.log(`✅ Found ${streamsResponse.logStreams.length} log streams`);
    console.log('\nMost recent streams:');
    streamsResponse.logStreams.slice(0, 5).forEach((stream, idx) => {
      console.log(`   ${idx + 1}. ${stream.logStreamName}`);
      console.log(`      Last Event: ${new Date(stream.lastEventTime).toISOString()}`);
    });
    
    // Step 3: Search for recent invocation attempts
    console.log('\n📋 Step 3: Searching for recent invocation attempts...');
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const filterCommand = new FilterLogEventsCommand({
      logGroupName,
      startTime: oneDayAgo,
      limit: 100,
    });
    
    const eventsResponse = await client.send(filterCommand);
    
    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      console.log('\n⚠️  FINDING: No log events in the last 24 hours');
      console.log('\n📊 DIAGNOSIS:');
      console.log('   - Lambda was invoked in the past but not recently');
      console.log('   - Recent renewable queries are not reaching the orchestrator');
      console.log('\n💡 RECOMMENDATION:');
      console.log('   1. Check lightweightAgent logs for orchestrator invocation attempts');
      console.log('   2. Verify RenewableProxyAgent is being called');
      console.log('   3. Check for Lambda invocation errors in lightweightAgent');
      
      return {
        exists: true,
        deployed: true,
        invoked: true,
        recentActivity: false,
        diagnosis: 'Lambda deployed but no recent activity',
      };
    }
    
    console.log(`✅ Found ${eventsResponse.events.length} log events in last 24 hours`);
    
    // Step 4: Analyze log events for errors
    console.log('\n📋 Step 4: Analyzing log events for errors...');
    
    const errors = [];
    const invocations = [];
    const keywords = {
      errors: ['ERROR', 'Error', 'error', 'Exception', 'exception', 'failed', 'Failed'],
      success: ['START RequestId', 'END RequestId', 'REPORT RequestId'],
      renewable: ['renewable', 'terrain', 'layout', 'simulation', 'report'],
    };
    
    eventsResponse.events.forEach(event => {
      const message = event.message;
      const timestamp = new Date(event.timestamp).toISOString();
      
      // Check for errors
      if (keywords.errors.some(kw => message.includes(kw))) {
        errors.push({ timestamp, message: message.substring(0, 200) });
      }
      
      // Check for invocations
      if (message.includes('START RequestId')) {
        const requestId = message.match(/RequestId: ([a-f0-9-]+)/)?.[1];
        invocations.push({ timestamp, requestId });
      }
    });
    
    console.log(`\n📊 ANALYSIS RESULTS:`);
    console.log(`   Total Events: ${eventsResponse.events.length}`);
    console.log(`   Invocations: ${invocations.length}`);
    console.log(`   Errors Found: ${errors.length}`);
    
    if (invocations.length > 0) {
      console.log('\n✅ Recent invocations found:');
      invocations.slice(0, 5).forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ${inv.timestamp} - RequestId: ${inv.requestId}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.slice(0, 10).forEach((err, idx) => {
        console.log(`\n   Error ${idx + 1}:`);
        console.log(`   Timestamp: ${err.timestamp}`);
        console.log(`   Message: ${err.message}`);
      });
      
      console.log('\n💡 RECOMMENDATION:');
      console.log('   1. Review full error messages in CloudWatch console');
      console.log('   2. Check for specific error patterns (permissions, timeouts, etc.)');
      console.log('   3. Verify tool Lambda function names in environment variables');
    } else {
      console.log('\n✅ No errors found in recent logs');
    }
    
    // Step 5: Search for specific renewable keywords
    console.log('\n📋 Step 5: Searching for renewable-specific activity...');
    
    const renewableEvents = eventsResponse.events.filter(event =>
      keywords.renewable.some(kw => event.message.toLowerCase().includes(kw))
    );
    
    if (renewableEvents.length > 0) {
      console.log(`✅ Found ${renewableEvents.length} renewable-related log entries`);
      console.log('\nSample entries:');
      renewableEvents.slice(0, 5).forEach((event, idx) => {
        console.log(`\n   ${idx + 1}. ${new Date(event.timestamp).toISOString()}`);
        console.log(`      ${event.message.substring(0, 150)}...`);
      });
    } else {
      console.log('⚠️  No renewable-specific keywords found in logs');
      console.log('   This might indicate the orchestrator is not processing renewable queries');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   ✅ Log Group Exists: YES`);
    console.log(`   ✅ Lambda Deployed: YES`);
    console.log(`   ✅ Lambda Invoked: YES`);
    console.log(`   ${errors.length > 0 ? '❌' : '✅'} Errors Found: ${errors.length}`);
    console.log(`   ${renewableEvents.length > 0 ? '✅' : '⚠️ '} Renewable Activity: ${renewableEvents.length} events`);
    
    if (errors.length > 0) {
      console.log('\n🔴 ACTION REQUIRED:');
      console.log('   - Review error messages above');
      console.log('   - Check CloudWatch console for full error details');
      console.log('   - Proceed to Task 3: Check terrain tool Lambda logs');
    } else if (renewableEvents.length === 0) {
      console.log('\n⚠️  POTENTIAL ISSUE:');
      console.log('   - Orchestrator is being invoked but not processing renewable queries');
      console.log('   - Check intent detection and routing logic');
    } else {
      console.log('\n✅ Orchestrator appears to be functioning normally');
      console.log('   - Proceed to Task 3: Check terrain tool Lambda logs');
    }
    
    return {
      exists: true,
      deployed: true,
      invoked: true,
      recentActivity: true,
      invocationCount: invocations.length,
      errorCount: errors.length,
      renewableEventCount: renewableEvents.length,
      diagnosis: errors.length > 0 ? 'Errors found in orchestrator' : 'Orchestrator functioning normally',
      errors: errors.slice(0, 10),
    };
    
  } catch (error) {
    console.error('\n❌ ERROR checking logs:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n📊 DIAGNOSIS: Log group does not exist');
      console.log('   - Lambda is not deployed');
      console.log('   - OR Lambda has never been invoked');
    } else if (error.name === 'AccessDeniedException') {
      console.log('\n📊 DIAGNOSIS: Access denied to CloudWatch logs');
      console.log('   - Check AWS credentials');
      console.log('   - Verify IAM permissions for logs:DescribeLogGroups');
    } else {
      console.log('\n📊 DIAGNOSIS: Unexpected error');
      console.log(`   Error: ${error.message}`);
    }
    
    throw error;
  }
}

// Run the check
checkOrchestratorLogs()
  .then(result => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Check failed');
    process.exit(1);
  });
