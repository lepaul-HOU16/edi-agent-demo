#!/usr/bin/env node

/**
 * Check CloudWatch logs for timeout issues in renewable orchestrator
 */

const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

async function checkTimeoutLogs() {
  const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  // Get the last 30 minutes of logs
  const endTime = Date.now();
  const startTime = endTime - (30 * 60 * 1000);
  
  console.log('🔍 Checking CloudWatch logs for timeout issues...\n');
  
  try {
    // Check orchestrator logs
    const orchestratorLogGroup = '/aws/lambda/renewableOrchestrator';
    
    console.log(`📋 Checking ${orchestratorLogGroup}...`);
    
    const command = new FilterLogEventsCommand({
      logGroupName: orchestratorLogGroup,
      startTime,
      endTime,
      filterPattern: '"timeout" OR "timed out" OR "Task timed out" OR "REPORT RequestId"',
      limit: 50
    });
    
    const response = await client.send(command);
    
    if (response.events && response.events.length > 0) {
      console.log(`\n✅ Found ${response.events.length} relevant log entries:\n`);
      
      response.events.forEach((event, index) => {
        const timestamp = new Date(event.timestamp).toISOString();
        console.log(`${index + 1}. [${timestamp}]`);
        console.log(`   ${event.message}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No timeout-related logs found in the last 30 minutes');
    }
    
    // Check for duration metrics
    console.log('\n📊 Checking for duration metrics...\n');
    
    const durationCommand = new FilterLogEventsCommand({
      logGroupName: orchestratorLogGroup,
      startTime,
      endTime,
      filterPattern: '"Duration:"',
      limit: 10
    });
    
    const durationResponse = await client.send(durationCommand);
    
    if (durationResponse.events && durationResponse.events.length > 0) {
      console.log('Recent execution durations:');
      durationResponse.events.forEach((event) => {
        const match = event.message.match(/Duration: ([\d.]+) ms/);
        if (match) {
          const duration = parseFloat(match[1]);
          const seconds = (duration / 1000).toFixed(2);
          console.log(`  - ${seconds}s`);
        }
      });
    }
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error('❌ Log group not found. The Lambda function may not have been invoked yet.');
    } else {
      console.error('❌ Error checking logs:', error.message);
    }
  }
}

checkTimeoutLogs().catch(console.error);
