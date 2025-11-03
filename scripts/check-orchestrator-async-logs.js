#!/usr/bin/env node

/**
 * Check CloudWatch logs for renewable orchestrator async invocations
 */

const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

async function checkOrchestratorLogs() {
  const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  // Get logs from last 10 minutes
  const startTime = Date.now() - (10 * 60 * 1000);
  
  console.log('🔍 Checking Renewable Orchestrator logs...\n');
  console.log(`Time range: Last 10 minutes`);
  console.log(`Start time: ${new Date(startTime).toISOString()}\n`);
  
  try {
    // Find the log group
    const logGroupName = '/aws/lambda/amplify-edidemo-lepaul-sandbox-renewableOrchestrator';
    
    console.log(`📋 Log Group: ${logGroupName}\n`);
    
    // Search for key patterns
    const patterns = [
      'ORCHESTRATOR ENTRY POINT',
      'ASYNC MODE',
      'Writing results to DynamoDB',
      'Successfully wrote',
      'Error writing to DynamoDB',
      'sessionId',
      'userId'
    ];
    
    for (const pattern of patterns) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔎 Searching for: "${pattern}"`);
      console.log('='.repeat(60));
      
      try {
        const command = new FilterLogEventsCommand({
          logGroupName,
          startTime,
          filterPattern: pattern,
          limit: 20
        });
        
        const response = await client.send(command);
        
        if (response.events && response.events.length > 0) {
          console.log(`✅ Found ${response.events.length} events:\n`);
          
          response.events.forEach((event, index) => {
            const timestamp = new Date(event.timestamp).toISOString();
            console.log(`${index + 1}. [${timestamp}]`);
            console.log(`   ${event.message}\n`);
          });
        } else {
          console.log(`❌ No events found`);
        }
      } catch (error) {
        console.error(`Error searching for "${pattern}":`, error.message);
      }
    }
    
    // Get most recent logs
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📜 Most Recent Logs (last 50)`);
    console.log('='.repeat(60));
    
    try {
      const command = new FilterLogEventsCommand({
        logGroupName,
        startTime,
        limit: 50
      });
      
      const response = await client.send(command);
      
      if (response.events && response.events.length > 0) {
        console.log(`\nFound ${response.events.length} recent events:\n`);
        
        response.events.forEach((event, index) => {
          const timestamp = new Date(event.timestamp).toISOString();
          console.log(`${index + 1}. [${timestamp}]`);
          console.log(`   ${event.message}\n`);
        });
      } else {
        console.log(`❌ No recent events found`);
      }
    } catch (error) {
      console.error(`Error getting recent logs:`, error.message);
    }
    
  } catch (error) {
    console.error('Error checking logs:', error);
    console.error('\nMake sure:');
    console.error('1. AWS credentials are configured');
    console.error('2. You have CloudWatch Logs read permissions');
    console.error('3. The Lambda function has been invoked recently');
  }
}

checkOrchestratorLogs().catch(console.error);
