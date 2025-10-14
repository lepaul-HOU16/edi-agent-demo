#!/usr/bin/env node

/**
 * CloudWatch Log Analyzer for renewableTerrain Lambda
 * 
 * This script queries CloudWatch logs for the renewableTerrain Lambda function
 * to check if it's being invoked directly (bypassing orchestrator).
 * 
 * Usage: node scripts/check-terrain-logs.js
 */

import { 
  CloudWatchLogsClient, 
  DescribeLogStreamsCommand,
  FilterLogEventsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

const LOG_GROUP_NAME = '/aws/lambda/renewableTerrain';
const SEARCH_KEYWORDS = ['terrain', 'invoked', 'error', 'Error', 'ERROR', 'exception', 'Exception', 'handler'];
const LOOKBACK_HOURS = 24;

async function checkTerrainLogs() {
  console.log('🔍 CloudWatch Log Analysis for renewableTerrain Lambda\n');
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
      console.log('⚠️  No log streams found.');
      console.log('\n💡 This means:');
      console.log('   1. The renewableTerrain Lambda has never been invoked');
      console.log('   2. The Lambda may not be deployed');
      console.log('   3. The log group name is incorrect');
      console.log('\n✅ GOOD NEWS: Terrain Lambda is NOT being invoked directly');
      console.log('   This means the orchestrator flow is correct (if it exists).');
      
      await saveReport({
        exists: false,
        logGroup: LOG_GROUP_NAME,
        message: 'Log group not found or no invocations',
        recommendation: 'Terrain Lambda is not being invoked directly. Check if orchestrator exists and is being called.'
      });
      
      return;
    }
    
    console.log(`✅ Found ${streamsResponse.logStreams.length} recent log streams`);
    console.log('\n⚠️  WARNING: Terrain Lambda HAS been invoked!');
    console.log('   This suggests it may be called directly, bypassing the orchestrator.\n');
    
    streamsResponse.logStreams.forEach((stream, idx) => {
      console.log(`   ${idx + 1}. ${stream.logStreamName}`);
      console.log(`      Last Event: ${new Date(stream.lastEventTimestamp).toISOString()}`);
    });
    
    // Step 3: Search for invocation patterns
    console.log('\n🔎 Step 3: Analyzing invocation patterns...');
    
    const findings = {
      invocations: [],
      errors: [],
      directCalls: [],
      orchestratorCalls: []
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
            findings.invocations.push(logEntry);
            
            if (event.message.toLowerCase().includes('error') || 
                event.message.toLowerCase().includes('exception')) {
              findings.errors.push(logEntry);
            }
            
            // Check if invoked by orchestrator or directly
            if (event.message.toLowerCase().includes('orchestrator')) {
              findings.orchestratorCalls.push(logEntry);
            } else if (event.message.toLowerCase().includes('start') || 
                       event.message.toLowerCase().includes('invoked')) {
              findings.directCalls.push(logEntry);
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
    
    console.log(`🔹 Total Invocations: ${findings.invocations.length}`);
    console.log(`🔹 Errors Found: ${findings.errors.length}`);
    console.log(`🔹 Orchestrator Calls: ${findings.orchestratorCalls.length}`);
    console.log(`🔹 Potential Direct Calls: ${findings.directCalls.length}`);
    
    // Display errors in detail
    if (findings.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:\n');
      findings.errors.slice(0, 5).forEach((error, idx) => {
        console.log(`Error ${idx + 1}:`);
        console.log(`  Timestamp: ${error.timestamp}`);
        console.log(`  Log Stream: ${error.logStreamName}`);
        console.log(`  Message: ${error.message.substring(0, 500)}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No errors found in terrain Lambda logs');
    }
    
    // Analyze invocation pattern
    console.log('\n🔍 INVOCATION PATTERN ANALYSIS:\n');
    
    if (findings.orchestratorCalls.length > 0) {
      console.log('✅ Terrain Lambda is being invoked BY the orchestrator (correct flow)');
      console.log(`   Found ${findings.orchestratorCalls.length} orchestrator-initiated calls`);
    } else if (findings.invocations.length > 0) {
      console.log('⚠️  Terrain Lambda is being invoked, but NOT by orchestrator');
      console.log('   This suggests DIRECT invocation, bypassing the orchestrator');
      console.log('   This is likely the root cause of the access issue!');
    }
    
    // Display sample invocations
    if (findings.invocations.length > 0) {
      console.log('\n📋 SAMPLE INVOCATIONS:\n');
      const uniqueInvocations = findings.invocations.slice(0, 5);
      uniqueInvocations.forEach((inv, idx) => {
        console.log(`Invocation ${idx + 1}:`);
        console.log(`  Timestamp: ${inv.timestamp}`);
        console.log(`  Message: ${inv.message.substring(0, 300)}`);
        console.log('');
      });
    }
    
    // Step 5: Generate recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (findings.invocations.length > 0 && findings.orchestratorCalls.length === 0) {
      console.log('❌ CRITICAL ISSUE DETECTED:');
      console.log('   Terrain Lambda is being invoked DIRECTLY, not through orchestrator');
      console.log('');
      console.log('🔧 FIXES NEEDED:');
      console.log('   1. Update frontend to call orchestrator, not terrain Lambda directly');
      console.log('   2. Remove direct terrain Lambda invocation from RenewableProxyAgent');
      console.log('   3. Ensure all renewable queries go through orchestrator');
      console.log('   4. Update GraphQL resolvers to point to orchestrator');
    } else if (findings.orchestratorCalls.length > 0) {
      console.log('✅ Invocation pattern is CORRECT');
      console.log('   Terrain Lambda is being called by orchestrator as expected');
      console.log('');
      console.log('🔍 If access issues persist, check:');
      console.log('   1. Orchestrator Lambda logs for errors');
      console.log('   2. IAM permissions between orchestrator and terrain Lambda');
      console.log('   3. Environment variables in orchestrator');
    } else {
      console.log('ℹ️  No invocations found');
      console.log('   This is expected if terrain Lambda is only called via orchestrator');
      console.log('');
      console.log('🔍 Next steps:');
      console.log('   1. Check orchestrator logs: node scripts/check-orchestrator-logs.js');
      console.log('   2. Verify orchestrator is being invoked');
      console.log('   3. Check if orchestrator has permission to invoke terrain Lambda');
    }
    
    // Save report
    await saveReport({
      exists: true,
      logGroup: LOG_GROUP_NAME,
      timeRange: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
        hours: LOOKBACK_HOURS
      },
      summary: {
        totalInvocations: findings.invocations.length,
        totalErrors: findings.errors.length,
        orchestratorCalls: findings.orchestratorCalls.length,
        directCalls: findings.directCalls.length
      },
      findings,
      diagnosis: findings.invocations.length > 0 && findings.orchestratorCalls.length === 0
        ? 'DIRECT_INVOCATION_DETECTED'
        : findings.orchestratorCalls.length > 0
        ? 'CORRECT_ORCHESTRATOR_FLOW'
        : 'NO_INVOCATIONS'
    });
    
    console.log('\n📄 Detailed report saved to: docs/TERRAIN_LAMBDA_LOG_ANALYSIS.md');
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to analyze CloudWatch logs');
    console.error(`Error: ${error.message}`);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n✅ GOOD NEWS: Log group not found');
      console.error('   This means the terrain Lambda is NOT being invoked directly.');
      console.error('   This is the CORRECT behavior - terrain should only be called by orchestrator.');
      console.error('\n💡 Next steps:');
      console.error('   1. Check orchestrator logs: node scripts/check-orchestrator-logs.js');
      console.error('   2. Verify orchestrator exists: node scripts/check-lambda-exists.js');
      console.error('   3. Check if orchestrator is being invoked from lightweightAgent');
      
      await saveReport({
        exists: false,
        logGroup: LOG_GROUP_NAME,
        error: error.message,
        diagnosis: 'LOG_GROUP_NOT_FOUND',
        recommendation: 'Terrain Lambda is not being invoked directly (correct). Check orchestrator flow.'
      });
      
      return;
    }
    
    if (error.name === 'AccessDeniedException') {
      console.error('\n⚠️  Access denied to CloudWatch logs');
      console.error('   You need logs:DescribeLogStreams and logs:FilterLogEvents permissions');
    }
    
    process.exit(1);
  }
}

async function saveReport(data) {
  const fs = await import('fs');
  const reportPath = 'docs/TERRAIN_LAMBDA_LOG_ANALYSIS.md';
  
  let reportContent = `# CloudWatch Log Analysis - renewableTerrain Lambda

**Generated:** ${new Date().toISOString()}

## Summary

- **Log Group:** ${LOG_GROUP_NAME}
- **Exists:** ${data.exists ? 'Yes' : 'No'}
`;

  if (data.timeRange) {
    reportContent += `- **Time Range:** ${data.timeRange.start} to ${data.timeRange.end} (${data.timeRange.hours} hours)\n`;
  }

  if (data.summary) {
    reportContent += `- **Total Invocations:** ${data.summary.totalInvocations}
- **Errors Found:** ${data.summary.totalErrors}
- **Orchestrator Calls:** ${data.summary.orchestratorCalls}
- **Direct Calls:** ${data.summary.directCalls}
`;
  }

  reportContent += `\n## Diagnosis

**Status:** ${data.diagnosis || 'UNKNOWN'}

`;

  if (data.diagnosis === 'DIRECT_INVOCATION_DETECTED') {
    reportContent += `### ❌ CRITICAL ISSUE: Direct Invocation Detected

The terrain Lambda is being invoked DIRECTLY, not through the orchestrator.
This is likely the root cause of the "access issue" error.

**Why this is a problem:**
- Bypasses orchestrator's intent detection and routing
- May not have proper authentication context
- Breaks the expected renewable energy flow

**How to fix:**
1. Update frontend to call orchestrator, not terrain Lambda directly
2. Remove direct terrain Lambda invocation from RenewableProxyAgent
3. Ensure all renewable queries go through orchestrator
4. Update GraphQL resolvers to point to orchestrator

`;
  } else if (data.diagnosis === 'CORRECT_ORCHESTRATOR_FLOW') {
    reportContent += `### ✅ Correct Flow: Orchestrator Invocation

The terrain Lambda is being invoked BY the orchestrator, which is correct.

If access issues persist, check:
1. Orchestrator Lambda logs for errors
2. IAM permissions between orchestrator and terrain Lambda
3. Environment variables in orchestrator

`;
  } else if (data.diagnosis === 'NO_INVOCATIONS' || data.diagnosis === 'LOG_GROUP_NOT_FOUND') {
    reportContent += `### ✅ No Direct Invocations (Expected)

The terrain Lambda is NOT being invoked directly, which is correct.
Terrain should only be called by the orchestrator.

**Next steps:**
1. Check orchestrator logs: \`node scripts/check-orchestrator-logs.js\`
2. Verify orchestrator exists: \`node scripts/check-lambda-exists.js\`
3. Check if orchestrator is being invoked from lightweightAgent

`;
  }

  if (data.findings && data.findings.errors && data.findings.errors.length > 0) {
    reportContent += `## Errors Found

`;
    data.findings.errors.slice(0, 10).forEach((error, idx) => {
      reportContent += `### Error ${idx + 1}

- **Timestamp:** ${error.timestamp}
- **Log Stream:** ${error.logStreamName}
- **Message:**
\`\`\`
${error.message}
\`\`\`

`;
    });
  }

  if (data.findings && data.findings.invocations && data.findings.invocations.length > 0) {
    reportContent += `## Sample Invocations

`;
    data.findings.invocations.slice(0, 5).forEach((inv, idx) => {
      reportContent += `### Invocation ${idx + 1}

- **Timestamp:** ${inv.timestamp}
- **Message:** ${inv.message.substring(0, 300)}

`;
    });
  }

  reportContent += `## Recommendations

`;

  if (data.recommendation) {
    reportContent += `${data.recommendation}\n\n`;
  }

  reportContent += `## Next Steps

1. Review the diagnosis above
2. Check orchestrator logs: \`node scripts/check-orchestrator-logs.js\`
3. Verify Lambda deployment: \`node scripts/check-lambda-exists.js\`
4. Check environment variables: \`node scripts/check-env-vars.js\`

## Raw Data

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`;

  fs.writeFileSync(reportPath, reportContent);
}

// Run the analysis
checkTerrainLogs().catch(console.error);
