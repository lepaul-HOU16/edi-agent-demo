#!/usr/bin/env node

/**
 * CloudWatch Log Analyzer for lightweightAgent Lambda
 * 
 * This script queries CloudWatch logs for the lightweightAgent Lambda function
 * to diagnose renewable energy access failures.
 * 
 * Usage: node scripts/check-cloudwatch-logs.js
 */

import { 
  CloudWatchLogsClient, 
  DescribeLogStreamsCommand,
  FilterLogEventsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

const LOG_GROUP_NAME = '/aws/lambda/lightweightAgent';
const SEARCH_KEYWORDS = ['renewable', 'RenewableProxyAgent', 'error', 'Error', 'ERROR', 'exception', 'Exception'];
const LOOKBACK_HOURS = 24;

async function checkCloudWatchLogs() {
  console.log('🔍 CloudWatch Log Analysis for lightweightAgent Lambda\n');
  console.log('=' .repeat(80));
  
  const client = new CloudWatchLogsClient({});
  
  try {
    // Step 1: Verify log group exists
    console.log('\n📋 Step 1: Verifying log group exists...');
    console.log(`Log Group: ${LOG_GROUP_NAME}`);
    
    const startTime = Date.now() - (LOOKBACK_HOURS * 60 * 60 * 1000);
    const endTime = Date.now();
    
    console.log(`Time Range: Last ${LOOKBACK_HOURS} hours`);
    console.log(`From: ${new Date(startTime).toISOString()}`);
    console.log(`To: ${new Date(endTime).toISOString()}`);
    
    // Step 2: Get recent log streams
    console.log('\n📊 Step 2: Fetching recent log streams...');
    
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP_NAME,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 10
    });
    
    const streamsResponse = await client.send(streamsCommand);
    
    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      console.log('⚠️  No log streams found. Lambda may not have been invoked recently.');
      return;
    }
    
    console.log(`✅ Found ${streamsResponse.logStreams.length} recent log streams`);
    streamsResponse.logStreams.forEach((stream, idx) => {
      console.log(`   ${idx + 1}. ${stream.logStreamName}`);
      console.log(`      Last Event: ${new Date(stream.lastEventTimestamp).toISOString()}`);
    });
    
    // Step 3: Search for renewable-related logs
    console.log('\n🔎 Step 3: Searching for renewable energy queries...');
    
    const findings = {
      renewableQueries: [],
      errors: [],
      proxyAgentInvocations: [],
      warnings: []
    };
    
    for (const keyword of SEARCH_KEYWORDS) {
      console.log(`\n   Searching for: "${keyword}"`);
      
      const filterCommand = new FilterLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        startTime,
        endTime,
        filterPattern: keyword,
        limit: 100
      });
      
      try {
        const filterResponse = await client.send(filterCommand);
        
        if (filterResponse.events && filterResponse.events.length > 0) {
          console.log(`   ✅ Found ${filterResponse.events.length} events`);
          
          filterResponse.events.forEach(event => {
            const logEntry = {
              timestamp: new Date(event.timestamp).toISOString(),
              message: event.message,
              logStreamName: event.logStreamName,
              keyword
            };
            
            // Categorize the log entry
            if (event.message.toLowerCase().includes('renewableproxyagent')) {
              findings.proxyAgentInvocations.push(logEntry);
            }
            
            if (event.message.toLowerCase().includes('error') || 
                event.message.toLowerCase().includes('exception')) {
              findings.errors.push(logEntry);
            }
            
            if (event.message.toLowerCase().includes('renewable')) {
              findings.renewableQueries.push(logEntry);
            }
          });
        } else {
          console.log(`   ℹ️  No events found for "${keyword}"`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error searching for "${keyword}": ${error.message}`);
      }
    }
    
    // Step 4: Analyze and report findings
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 ANALYSIS RESULTS\n');
    
    console.log(`🔹 Renewable Queries Found: ${findings.renewableQueries.length}`);
    console.log(`🔹 RenewableProxyAgent Invocations: ${findings.proxyAgentInvocations.length}`);
    console.log(`🔹 Errors Found: ${findings.errors.length}`);
    
    // Display errors in detail
    if (findings.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:\n');
      findings.errors.forEach((error, idx) => {
        console.log(`Error ${idx + 1}:`);
        console.log(`  Timestamp: ${error.timestamp}`);
        console.log(`  Log Stream: ${error.logStreamName}`);
        console.log(`  Message: ${error.message.substring(0, 500)}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No errors found in logs');
    }
    
    // Display RenewableProxyAgent invocations
    if (findings.proxyAgentInvocations.length > 0) {
      console.log('\n🔄 RENEWABLE PROXY AGENT INVOCATIONS:\n');
      findings.proxyAgentInvocations.forEach((invocation, idx) => {
        console.log(`Invocation ${idx + 1}:`);
        console.log(`  Timestamp: ${invocation.timestamp}`);
        console.log(`  Message: ${invocation.message.substring(0, 300)}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  RenewableProxyAgent was NOT invoked');
      console.log('   This suggests the renewable routing logic may not be working.');
    }
    
    // Display renewable queries
    if (findings.renewableQueries.length > 0) {
      console.log('\n🌱 RENEWABLE ENERGY QUERIES:\n');
      const uniqueQueries = [...new Set(findings.renewableQueries.map(q => q.message))];
      uniqueQueries.slice(0, 5).forEach((query, idx) => {
        console.log(`Query ${idx + 1}: ${query.substring(0, 200)}`);
      });
    }
    
    // Step 5: Generate recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (findings.errors.length > 0) {
      console.log('1. ❌ Errors detected in logs - investigate error messages above');
      console.log('2. 🔍 Check for permission issues (AccessDeniedException)');
      console.log('3. 🔍 Check for missing environment variables');
      console.log('4. 🔍 Check for Lambda invocation failures');
    }
    
    if (findings.proxyAgentInvocations.length === 0 && findings.renewableQueries.length > 0) {
      console.log('1. ⚠️  Renewable queries detected but RenewableProxyAgent not invoked');
      console.log('2. 🔍 Check agent routing logic in lightweightAgent');
      console.log('3. 🔍 Verify RenewableProxyAgent is registered in agent router');
    }
    
    if (findings.renewableQueries.length === 0) {
      console.log('1. ℹ️  No renewable queries found in logs');
      console.log('2. 🔍 Verify queries are reaching the Lambda function');
      console.log('3. 🔍 Check frontend API integration');
      console.log('4. 🔍 Check GraphQL resolver configuration');
    }
    
    // Step 6: Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      logGroup: LOG_GROUP_NAME,
      timeRange: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
        hours: LOOKBACK_HOURS
      },
      summary: {
        totalRenewableQueries: findings.renewableQueries.length,
        totalProxyAgentInvocations: findings.proxyAgentInvocations.length,
        totalErrors: findings.errors.length
      },
      findings
    };
    
    const fs = await import('fs');
    const reportPath = 'docs/CLOUDWATCH_LOG_ANALYSIS.md';
    
    let reportContent = `# CloudWatch Log Analysis - lightweightAgent Lambda

**Generated:** ${report.timestamp}

## Summary

- **Log Group:** ${LOG_GROUP_NAME}
- **Time Range:** ${report.timeRange.start} to ${report.timeRange.end} (${LOOKBACK_HOURS} hours)
- **Renewable Queries Found:** ${report.summary.totalRenewableQueries}
- **RenewableProxyAgent Invocations:** ${report.summary.totalProxyAgentInvocations}
- **Errors Found:** ${report.summary.totalErrors}

## Key Findings

`;
    
    if (findings.errors.length > 0) {
      reportContent += `### ❌ Errors Detected\n\n`;
      reportContent += `Found ${findings.errors.length} error(s) in the logs:\n\n`;
      findings.errors.slice(0, 10).forEach((error, idx) => {
        reportContent += `#### Error ${idx + 1}\n`;
        reportContent += `- **Timestamp:** ${error.timestamp}\n`;
        reportContent += `- **Log Stream:** ${error.logStreamName}\n`;
        reportContent += `- **Message:**\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
      });
    }
    
    if (findings.proxyAgentInvocations.length > 0) {
      reportContent += `### ✅ RenewableProxyAgent Invocations\n\n`;
      reportContent += `Found ${findings.proxyAgentInvocations.length} invocation(s):\n\n`;
      findings.proxyAgentInvocations.slice(0, 5).forEach((inv, idx) => {
        reportContent += `#### Invocation ${idx + 1}\n`;
        reportContent += `- **Timestamp:** ${inv.timestamp}\n`;
        reportContent += `- **Message:** ${inv.message.substring(0, 300)}\n\n`;
      });
    } else {
      reportContent += `### ⚠️ RenewableProxyAgent NOT Invoked\n\n`;
      reportContent += `No evidence of RenewableProxyAgent being called. This suggests:\n`;
      reportContent += `- Renewable queries may not be reaching the agent router\n`;
      reportContent += `- Agent routing logic may not be detecting renewable queries\n`;
      reportContent += `- RenewableProxyAgent may not be registered\n\n`;
    }
    
    reportContent += `## Recommendations\n\n`;
    
    if (findings.errors.length > 0) {
      reportContent += `1. **Investigate Errors:** Review error messages above for specific failure reasons\n`;
      reportContent += `2. **Check Permissions:** Look for AccessDeniedException or permission-related errors\n`;
      reportContent += `3. **Verify Configuration:** Check environment variables and Lambda configuration\n`;
    }
    
    if (findings.proxyAgentInvocations.length === 0 && findings.renewableQueries.length > 0) {
      reportContent += `1. **Fix Routing:** RenewableProxyAgent is not being invoked despite renewable queries\n`;
      reportContent += `2. **Check Agent Router:** Verify agent registration and routing logic\n`;
    }
    
    if (findings.renewableQueries.length === 0) {
      reportContent += `1. **Verify Frontend:** Check if queries are being sent from the UI\n`;
      reportContent += `2. **Check GraphQL:** Verify GraphQL resolver is configured correctly\n`;
      reportContent += `3. **Test Invocation:** Try invoking the Lambda directly\n`;
    }
    
    reportContent += `\n## Next Steps\n\n`;
    reportContent += `1. Review the errors and invocations above\n`;
    reportContent += `2. Run the Lambda existence checker: \`node scripts/check-lambda-exists.js\`\n`;
    reportContent += `3. Run the environment variable checker: \`node scripts/check-env-vars.js\`\n`;
    reportContent += `4. Test direct Lambda invocation: \`node scripts/test-invoke-orchestrator.js\`\n`;
    
    reportContent += `\n## Raw Data\n\n`;
    reportContent += `\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`;
    
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to analyze CloudWatch logs');
    console.error(`Error: ${error.message}`);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Log group not found. This means:');
      console.error('   1. The lightweightAgent Lambda may not exist');
      console.error('   2. The Lambda has never been invoked');
      console.error('   3. The log group name is incorrect');
      console.error('\n💡 Next steps:');
      console.error('   - Run: node scripts/check-lambda-exists.js');
      console.error('   - Verify Lambda deployment with: npx ampx sandbox');
    }
    
    if (error.name === 'AccessDeniedException') {
      console.error('\n⚠️  Access denied to CloudWatch logs. This means:');
      console.error('   1. Your AWS credentials may not have CloudWatch permissions');
      console.error('   2. You need logs:DescribeLogStreams and logs:FilterLogEvents permissions');
      console.error('\n💡 Next steps:');
      console.error('   - Check your AWS credentials');
      console.error('   - Verify IAM permissions for CloudWatch Logs');
    }
    
    process.exit(1);
  }
}

// Run the analysis
checkCloudWatchLogs().catch(console.error);
