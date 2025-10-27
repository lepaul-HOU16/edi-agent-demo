/**
 * Test script for Task 10: Dependency Loading Time Metrics
 * 
 * This script verifies that:
 * 1. Dependency loading times are logged during cold start
 * 2. Dependency loading metrics are published to CloudWatch
 * 3. CloudWatch dashboard includes dependency loading time widget
 * 
 * Usage:
 *   node tests/test-dependency-load-metrics.js
 */

const { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchClient, GetMetricStatisticsCommand, ListDashboardsCommand, GetDashboardCommand } = require('@aws-sdk/client-cloudwatch');

const AWS_REGION = process.env.AWS_REGION || 'us-west-2';

const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });

async function findStrandsAgentLambda() {
  console.log('🔍 Finding Strands Agent Lambda function...');
  
  // Get Lambda function name from environment or use pattern matching
  const functionName = process.env.STRANDS_AGENT_FUNCTION_NAME;
  
  if (functionName) {
    console.log(`✅ Using function: ${functionName}`);
    return functionName;
  }
  
  // If not provided, try to find it by pattern
  console.log('⚠️  STRANDS_AGENT_FUNCTION_NAME not set');
  console.log('Please set it to your Strands Agent Lambda function name');
  console.log('Example: export STRANDS_AGENT_FUNCTION_NAME=amplify-digitalassistant-renewableAgentsFunction-...');
  process.exit(1);
}

async function invokeLambdaColdStart(functionName) {
  console.log('\n🥶 Invoking Lambda to trigger cold start...');
  
  const payload = {
    agent: 'terrain',
    query: 'Test dependency loading metrics',
    parameters: {
      project_id: 'test_dependency_metrics',
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 2.0
    }
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('✅ Lambda invoked successfully');
    
    // Parse response body
    const body = JSON.parse(result.body);
    
    // Check for dependency load times in performance metrics
    if (body.performance && body.performance.dependencyLoadTimes) {
      console.log('\n📦 Dependency Loading Times:');
      for (const [dep, time] of Object.entries(body.performance.dependencyLoadTimes)) {
        console.log(`  - ${dep}: ${time.toFixed(3)}s`);
      }
      return true;
    } else {
      console.log('⚠️  No dependency load times in response (might be warm start)');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to invoke Lambda:', error.message);
    return false;
  }
}

async function checkCloudWatchMetrics() {
  console.log('\n📊 Checking CloudWatch metrics...');
  
  const dependencies = ['boto3', 'psutil', 'agents', 'cloudwatch_metrics', 'total_imports'];
  let metricsFound = 0;
  
  for (const dep of dependencies) {
    try {
      const command = new GetMetricStatisticsCommand({
        Namespace: 'StrandsAgent/Performance',
        MetricName: 'DependencyLoadTime',
        Dimensions: [
          {
            Name: 'Dependency',
            Value: dep
          }
        ],
        StartTime: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        EndTime: new Date(),
        Period: 300, // 5 minutes
        Statistics: ['Average', 'Maximum']
      });
      
      const response = await cloudwatchClient.send(command);
      
      if (response.Datapoints && response.Datapoints.length > 0) {
        const latest = response.Datapoints[response.Datapoints.length - 1];
        console.log(`  ✅ ${dep}: ${latest.Average?.toFixed(3)}s (max: ${latest.Maximum?.toFixed(3)}s)`);
        metricsFound++;
      } else {
        console.log(`  ⏳ ${dep}: No data yet (metrics may take 2-5 minutes to appear)`);
      }
      
    } catch (error) {
      console.error(`  ❌ ${dep}: Error checking metric - ${error.message}`);
    }
  }
  
  return metricsFound;
}

async function checkDashboard() {
  console.log('\n📈 Checking CloudWatch dashboard...');
  
  try {
    // List dashboards
    const listCommand = new ListDashboardsCommand({});
    const listResponse = await cloudwatchClient.send(listCommand);
    
    const dashboard = listResponse.DashboardEntries?.find(d => 
      d.DashboardName === 'StrandsAgent-Performance-Monitoring'
    );
    
    if (!dashboard) {
      console.log('⚠️  Dashboard "StrandsAgent-Performance-Monitoring" not found');
      console.log('Available dashboards:', listResponse.DashboardEntries?.map(d => d.DashboardName).join(', '));
      return false;
    }
    
    console.log(`✅ Dashboard found: ${dashboard.DashboardName}`);
    
    // Get dashboard details
    const getCommand = new GetDashboardCommand({
      DashboardName: dashboard.DashboardName
    });
    
    const getResponse = await cloudwatchClient.send(getCommand);
    const dashboardBody = JSON.parse(getResponse.DashboardBody);
    
    // Check for dependency loading time widget
    const hasDepWidget = dashboardBody.widgets?.some(widget => 
      widget.properties?.title?.includes('Dependency Loading Times')
    );
    
    if (hasDepWidget) {
      console.log('✅ Dashboard includes "Dependency Loading Times" widget');
      return true;
    } else {
      console.log('⚠️  Dashboard does not include "Dependency Loading Times" widget');
      console.log('Widget titles:', dashboardBody.widgets?.map(w => w.properties?.title).join(', '));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to check dashboard:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Task 10: Dependency Loading Time Metrics\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Find Lambda function
    const functionName = await findStrandsAgentLambda();
    
    // Step 2: Invoke Lambda to trigger cold start
    const hasDepTimes = await invokeLambdaColdStart(functionName);
    
    // Step 3: Wait for metrics to be published
    if (hasDepTimes) {
      console.log('\n⏳ Waiting 30 seconds for metrics to be published to CloudWatch...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Step 4: Check CloudWatch metrics
    const metricsFound = await checkCloudWatchMetrics();
    
    // Step 5: Check dashboard
    const hasDashboard = await checkDashboard();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Summary:');
    console.log('=' .repeat(60));
    
    const tests = [
      { name: 'Lambda invocation', passed: hasDepTimes },
      { name: 'Dependency load times in response', passed: hasDepTimes },
      { name: 'CloudWatch metrics published', passed: metricsFound >= 3 },
      { name: 'Dashboard includes dependency widget', passed: hasDashboard }
    ];
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${test.name}`);
    });
    
    const allPassed = tests.every(t => t.passed);
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ All tests passed! Task 10 is complete.');
    } else {
      console.log('⚠️  Some tests failed. Review the output above.');
      console.log('\nTroubleshooting:');
      console.log('1. Ensure Lambda has been deployed with latest code');
      console.log('2. Wait 2-5 minutes for CloudWatch metrics to appear');
      console.log('3. Check Lambda logs for "📦 Dependency loading times" messages');
      console.log('4. Verify IAM permissions for cloudwatch:PutMetricData');
    }
    console.log('='.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
main();
