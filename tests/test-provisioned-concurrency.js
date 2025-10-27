#!/usr/bin/env node

/**
 * Test Provisioned Concurrency for Strands Agent
 * 
 * This script:
 * 1. Checks if provisioned concurrency is enabled
 * 2. Monitors cold start rate (should be 0% with provisioned concurrency)
 * 3. Measures cost impact
 * 4. Provides recommendations on whether to keep or disable
 * 
 * Task 4: Add provisioned concurrency if needed
 */

const { LambdaClient, GetFunctionCommand, GetProvisionedConcurrencyConfigCommand, ListAliasesCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function findStrandsAgentFunction() {
  console.log('🔍 Finding Strands Agent Lambda function...\n');
  
  // The function name pattern from backend.ts
  const functionName = process.env.RENEWABLE_AGENTS_FUNCTION_NAME;
  
  if (!functionName) {
    console.error('❌ RENEWABLE_AGENTS_FUNCTION_NAME environment variable not set');
    console.log('ℹ️  Run this from the sandbox environment or set the variable manually');
    process.exit(1);
  }
  
  try {
    const response = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    console.log(`✅ Found Strands Agent function: ${response.Configuration.FunctionName}`);
    console.log(`   Memory: ${response.Configuration.MemorySize} MB`);
    console.log(`   Timeout: ${response.Configuration.Timeout} seconds`);
    console.log(`   Runtime: ${response.Configuration.PackageType}\n`);
    return response.Configuration.FunctionName;
  } catch (error) {
    console.error(`❌ Failed to find function: ${error.message}`);
    process.exit(1);
  }
}

async function checkProvisionedConcurrency(functionName) {
  console.log('🔍 Checking provisioned concurrency configuration...\n');
  
  try {
    // List aliases to find the provisioned alias
    const aliasesResponse = await lambda.send(new ListAliasesCommand({ FunctionName: functionName }));
    
    if (!aliasesResponse.Aliases || aliasesResponse.Aliases.length === 0) {
      console.log('ℹ️  No aliases found - provisioned concurrency is DISABLED');
      console.log('ℹ️  To enable, set ENABLE_STRANDS_PROVISIONED_CONCURRENCY=true and redeploy\n');
      return { enabled: false };
    }
    
    // Check for the 'provisioned' alias
    const provisionedAlias = aliasesResponse.Aliases.find(a => a.Name === 'provisioned');
    
    if (!provisionedAlias) {
      console.log('ℹ️  No provisioned alias found - provisioned concurrency is DISABLED\n');
      return { enabled: false };
    }
    
    // Get provisioned concurrency config
    const configResponse = await lambda.send(new GetProvisionedConcurrencyConfigCommand({
      FunctionName: functionName,
      Qualifier: provisionedAlias.Name
    }));
    
    console.log('✅ Provisioned concurrency is ENABLED');
    console.log(`   Requested: ${configResponse.RequestedProvisionedConcurrentExecutions} instances`);
    console.log(`   Allocated: ${configResponse.AllocatedProvisionedConcurrentExecutions} instances`);
    console.log(`   Available: ${configResponse.AvailableProvisionedConcurrentExecutions} instances`);
    console.log(`   Status: ${configResponse.Status}\n`);
    
    return {
      enabled: true,
      requested: configResponse.RequestedProvisionedConcurrentExecutions,
      allocated: configResponse.AllocatedProvisionedConcurrentExecutions,
      available: configResponse.AvailableProvisionedConcurrentExecutions,
      status: configResponse.Status
    };
  } catch (error) {
    if (error.name === 'ProvisionedConcurrencyConfigNotFoundException') {
      console.log('ℹ️  Provisioned concurrency is DISABLED\n');
      return { enabled: false };
    }
    console.error(`❌ Error checking provisioned concurrency: ${error.message}\n`);
    return { enabled: false, error: error.message };
  }
}

async function measureColdStartRate(functionName) {
  console.log('📊 Measuring cold start rate (last 24 hours)...\n');
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  try {
    // Get total invocations
    const invocationsResponse = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: 'Invocations',
      Dimensions: [{ Name: 'FunctionName', Value: functionName }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 3600, // 1 hour
      Statistics: ['Sum']
    }));
    
    const totalInvocations = invocationsResponse.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);
    
    // Get cold start count (init duration > 0)
    // Note: This is an approximation - actual cold starts require custom metrics
    const coldStartsResponse = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: 'Duration',
      Dimensions: [{ Name: 'FunctionName', Value: functionName }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 3600,
      Statistics: ['Maximum']
    }));
    
    // Estimate cold starts as invocations with duration > 60 seconds
    const estimatedColdStarts = coldStartsResponse.Datapoints.filter(dp => dp.Maximum > 60000).length;
    
    console.log(`   Total invocations: ${totalInvocations}`);
    console.log(`   Estimated cold starts: ${estimatedColdStarts}`);
    
    if (totalInvocations > 0) {
      const coldStartRate = (estimatedColdStarts / totalInvocations * 100).toFixed(2);
      console.log(`   Cold start rate: ${coldStartRate}%`);
      
      if (coldStartRate === '0.00') {
        console.log('   ✅ EXCELLENT - Zero cold starts!\n');
      } else if (coldStartRate < 10) {
        console.log('   ✅ GOOD - Low cold start rate\n');
      } else if (coldStartRate < 50) {
        console.log('   ⚠️  MODERATE - Consider enabling provisioned concurrency\n');
      } else {
        console.log('   ❌ HIGH - Provisioned concurrency recommended\n');
      }
      
      return { totalInvocations, estimatedColdStarts, coldStartRate: parseFloat(coldStartRate) };
    } else {
      console.log('   ℹ️  No invocations in the last 24 hours\n');
      return { totalInvocations: 0, estimatedColdStarts: 0, coldStartRate: 0 };
    }
  } catch (error) {
    console.error(`❌ Error measuring cold start rate: ${error.message}\n`);
    return { error: error.message };
  }
}

function calculateCostImpact(provisionedConfig) {
  console.log('💰 Calculating cost impact...\n');
  
  if (!provisionedConfig.enabled) {
    console.log('   Current cost: $0 (provisioned concurrency disabled)');
    console.log('   Potential cost with 1 instance: ~$10.80/month\n');
    return { current: 0, potential: 10.80 };
  }
  
  // Provisioned concurrency pricing (approximate for us-east-1)
  // $0.000004167 per GB-second
  // For 3008 MB (3 GB) Lambda: $0.0000125 per second
  // Per hour: $0.045
  // Per month (730 hours): $32.85
  
  const memoryGB = 3.008; // 3008 MB
  const pricePerGBSecond = 0.000004167;
  const pricePerSecond = memoryGB * pricePerGBSecond;
  const pricePerHour = pricePerSecond * 3600;
  const pricePerMonth = pricePerHour * 730;
  
  const instances = provisionedConfig.requested || 1;
  const totalCost = pricePerMonth * instances;
  
  console.log(`   Provisioned instances: ${instances}`);
  console.log(`   Memory per instance: ${memoryGB.toFixed(2)} GB`);
  console.log(`   Cost per instance: $${pricePerMonth.toFixed(2)}/month`);
  console.log(`   Total cost: $${totalCost.toFixed(2)}/month\n`);
  
  return { instances, costPerInstance: pricePerMonth, totalCost };
}

function provideRecommendation(provisionedConfig, coldStartMetrics, costImpact) {
  console.log('📋 RECOMMENDATION\n');
  console.log('─'.repeat(60));
  
  if (!provisionedConfig.enabled) {
    console.log('\n🔴 Provisioned concurrency is currently DISABLED\n');
    
    if (coldStartMetrics.totalInvocations === 0) {
      console.log('Recommendation: WAIT');
      console.log('Reason: No usage data yet. Test the function first, then decide.\n');
      console.log('Next steps:');
      console.log('1. Run some test invocations');
      console.log('2. Re-run this script to measure cold start rate');
      console.log('3. Enable if cold start rate > 10%\n');
    } else if (coldStartMetrics.coldStartRate > 10) {
      console.log('Recommendation: ENABLE provisioned concurrency');
      console.log(`Reason: Cold start rate is ${coldStartMetrics.coldStartRate}% (> 10%)\n`);
      console.log('Benefits:');
      console.log('- Zero cold starts (instant response)');
      console.log('- Better user experience during demos');
      console.log('- Consistent performance\n');
      console.log('Cost: ~$32.85/month for 1 instance\n');
      console.log('To enable:');
      console.log('1. Set ENABLE_STRANDS_PROVISIONED_CONCURRENCY=true');
      console.log('2. Restart sandbox: npx ampx sandbox\n');
    } else {
      console.log('Recommendation: KEEP DISABLED');
      console.log(`Reason: Cold start rate is ${coldStartMetrics.coldStartRate}% (< 10%)\n`);
      console.log('Current setup is working well. Save the cost.\n');
    }
  } else {
    console.log('\n🟢 Provisioned concurrency is currently ENABLED\n');
    
    if (coldStartMetrics.coldStartRate === 0) {
      console.log('Recommendation: KEEP ENABLED (if budget allows)');
      console.log('Reason: Zero cold starts - excellent user experience\n');
      console.log(`Cost: $${costImpact.totalCost.toFixed(2)}/month\n`);
      console.log('Consider disabling if:');
      console.log('- Budget is tight');
      console.log('- Usage is low');
      console.log('- Cold starts are acceptable for your use case\n');
    } else {
      console.log('Recommendation: INVESTIGATE');
      console.log(`Reason: Cold starts still occurring (${coldStartMetrics.coldStartRate}%) despite provisioned concurrency\n`);
      console.log('Possible issues:');
      console.log('- Provisioned instances not fully allocated');
      console.log('- Traffic exceeding provisioned capacity');
      console.log('- Alias not being used for invocations\n');
      console.log('Check:');
      console.log('1. Alias status (should be "READY")');
      console.log('2. Available instances (should match requested)');
      console.log('3. Invocation logs (check which qualifier is used)\n');
    }
  }
  
  console.log('─'.repeat(60));
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  STRANDS AGENT PROVISIONED CONCURRENCY TEST');
  console.log('  Task 4: Add provisioned concurrency if needed');
  console.log('═'.repeat(60));
  console.log();
  
  try {
    // Step 1: Find the function
    const functionName = await findStrandsAgentFunction();
    
    // Step 2: Check provisioned concurrency
    const provisionedConfig = await checkProvisionedConcurrency(functionName);
    
    // Step 3: Measure cold start rate
    const coldStartMetrics = await measureColdStartRate(functionName);
    
    // Step 4: Calculate cost impact
    const costImpact = calculateCostImpact(provisionedConfig);
    
    // Step 5: Provide recommendation
    provideRecommendation(provisionedConfig, coldStartMetrics, costImpact);
    
    console.log('\n✅ Test complete\n');
    
    // Exit with appropriate code
    if (provisionedConfig.enabled && coldStartMetrics.coldStartRate === 0) {
      process.exit(0); // Success - provisioned concurrency working
    } else if (!provisionedConfig.enabled && coldStartMetrics.coldStartRate < 10) {
      process.exit(0); // Success - no need for provisioned concurrency
    } else {
      process.exit(1); // Action needed
    }
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}\n`);
    process.exit(1);
  }
}

main();
