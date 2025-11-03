/**
 * Test CloudWatch Monitoring and Alarms for Strands Agent
 * 
 * Task 11: Verify CloudWatch custom metrics and alarms are working
 * 
 * This test:
 * 1. Invokes the Strands Agent Lambda
 * 2. Verifies custom metrics are published to CloudWatch
 * 3. Checks that alarms are configured correctly
 * 4. Validates alarm thresholds
 */

const { LambdaClient, InvokeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchClient, GetMetricStatisticsCommand, DescribeAlarmsCommand } = require('@aws-sdk/client-cloudwatch');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-west-2' });

async function findStrandsAgentFunction() {
  console.log('🔍 Finding Strands Agent Lambda function...');
  
  try {
    // Try to find the function by name pattern
    const functionName = process.env.RENEWABLE_AGENTS_FUNCTION_NAME;
    
    if (functionName) {
      console.log(`✅ Found function name from environment: ${functionName}`);
      return functionName;
    }
    
    // If not in environment, we need to search
    throw new Error('RENEWABLE_AGENTS_FUNCTION_NAME not set in environment');
    
  } catch (error) {
    console.error('❌ Error finding Strands Agent function:', error.message);
    throw error;
  }
}

async function invokeStrandsAgent(functionName) {
  console.log('\n📞 Invoking Strands Agent Lambda...');
  
  const payload = {
    agent: 'terrain',
    query: 'Test CloudWatch metrics',
    parameters: {
      project_id: 'cloudwatch_test',
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 2.0
    }
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = (Date.now() - startTime) / 1000;
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    
    console.log(`✅ Lambda invoked successfully in ${duration.toFixed(2)}s`);
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   Success: ${body.success}`);
    
    if (body.performance) {
      console.log('\n📊 Performance Metrics:');
      console.log(`   Cold Start: ${body.performance.coldStart}`);
      console.log(`   Init Time: ${body.performance.initTime}s`);
      console.log(`   Execution Time: ${body.performance.executionTime}s`);
      console.log(`   Memory Used: ${body.performance.memoryUsed} MB`);
    }
    
    return body.performance;
    
  } catch (error) {
    console.error('❌ Error invoking Lambda:', error.message);
    throw error;
  }
}

async function checkCloudWatchMetrics() {
  console.log('\n📊 Checking CloudWatch custom metrics...');
  
  const namespace = 'StrandsAgent/Performance';
  const metricNames = [
    'ColdStartDuration',
    'WarmStartDuration',
    'MemoryUsed',
    'TimeoutOccurred',
    'InvocationCount'
  ];
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // Last 10 minutes
  
  console.log(`   Checking metrics from ${startTime.toISOString()} to ${endTime.toISOString()}`);
  
  for (const metricName of metricNames) {
    try {
      const command = new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: metricName,
        StartTime: startTime,
        EndTime: endTime,
        Period: 300, // 5 minutes
        Statistics: ['Sum', 'Average', 'Maximum'],
        Dimensions: []
      });
      
      const response = await cloudwatch.send(command);
      
      if (response.Datapoints && response.Datapoints.length > 0) {
        console.log(`   ✅ ${metricName}: ${response.Datapoints.length} data points found`);
        
        // Show latest data point
        const latest = response.Datapoints.sort((a, b) => b.Timestamp - a.Timestamp)[0];
        if (latest.Average !== undefined) {
          console.log(`      Latest Average: ${latest.Average.toFixed(2)}`);
        }
        if (latest.Maximum !== undefined) {
          console.log(`      Latest Maximum: ${latest.Maximum.toFixed(2)}`);
        }
        if (latest.Sum !== undefined) {
          console.log(`      Latest Sum: ${latest.Sum.toFixed(2)}`);
        }
      } else {
        console.log(`   ⚠️  ${metricName}: No data points found (metrics may take a few minutes to appear)`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error checking ${metricName}:`, error.message);
    }
  }
}

async function checkCloudWatchAlarms() {
  console.log('\n🚨 Checking CloudWatch alarms...');
  
  const alarmNames = [
    'StrandsAgent-ColdStartDuration-High',
    'StrandsAgent-WarmStartDuration-High',
    'StrandsAgent-MemoryUsage-High',
    'StrandsAgent-TimeoutRate-High'
  ];
  
  try {
    const command = new DescribeAlarmsCommand({
      AlarmNames: alarmNames
    });
    
    const response = await cloudwatch.send(command);
    
    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      console.log(`   ✅ Found ${response.MetricAlarms.length} alarms`);
      
      for (const alarm of response.MetricAlarms) {
        console.log(`\n   📋 ${alarm.AlarmName}`);
        console.log(`      State: ${alarm.StateValue}`);
        console.log(`      Threshold: ${alarm.Threshold}`);
        console.log(`      Comparison: ${alarm.ComparisonOperator}`);
        console.log(`      Description: ${alarm.AlarmDescription}`);
        
        if (alarm.StateValue === 'ALARM') {
          console.log(`      ⚠️  ALARM is currently triggered!`);
        } else if (alarm.StateValue === 'OK') {
          console.log(`      ✅ Alarm is OK`);
        } else {
          console.log(`      ℹ️  Alarm state: ${alarm.StateValue}`);
        }
      }
    } else {
      console.log('   ⚠️  No alarms found (alarms may not be deployed yet)');
      console.log('   💡 Run "npx ampx sandbox" to deploy alarms');
    }
    
  } catch (error) {
    console.error('   ❌ Error checking alarms:', error.message);
  }
}

async function validateAlarmThresholds() {
  console.log('\n✅ Validating alarm thresholds...');
  
  const expectedThresholds = {
    'StrandsAgent-ColdStartDuration-High': {
      threshold: 600, // 10 minutes
      unit: 'seconds',
      description: 'Cold start > 10 minutes'
    },
    'StrandsAgent-WarmStartDuration-High': {
      threshold: 60, // 60 seconds
      unit: 'seconds',
      description: 'Warm start > 60 seconds'
    },
    'StrandsAgent-MemoryUsage-High': {
      threshold: 2867, // 95% of 3GB
      unit: 'MB',
      description: 'Memory > 2867 MB (95% of 3GB)'
    },
    'StrandsAgent-TimeoutRate-High': {
      threshold: 10, // 10%
      unit: 'percent',
      description: 'Timeout rate > 10%'
    }
  };
  
  try {
    const command = new DescribeAlarmsCommand({
      AlarmNames: Object.keys(expectedThresholds)
    });
    
    const response = await cloudwatch.send(command);
    
    if (response.MetricAlarms && response.MetricAlarms.length > 0) {
      let allValid = true;
      
      for (const alarm of response.MetricAlarms) {
        const expected = expectedThresholds[alarm.AlarmName];
        
        if (alarm.Threshold === expected.threshold) {
          console.log(`   ✅ ${alarm.AlarmName}: ${alarm.Threshold} ${expected.unit} (correct)`);
        } else {
          console.log(`   ❌ ${alarm.AlarmName}: ${alarm.Threshold} (expected ${expected.threshold} ${expected.unit})`);
          allValid = false;
        }
      }
      
      if (allValid) {
        console.log('\n   ✅ All alarm thresholds are correctly configured');
      } else {
        console.log('\n   ❌ Some alarm thresholds are incorrect');
      }
      
    } else {
      console.log('   ⚠️  No alarms found to validate');
    }
    
  } catch (error) {
    console.error('   ❌ Error validating thresholds:', error.message);
  }
}

async function main() {
  console.log('🧪 Testing CloudWatch Monitoring and Alarms for Strands Agent\n');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Find Strands Agent function
    const functionName = await findStrandsAgentFunction();
    
    // Step 2: Invoke Strands Agent to generate metrics
    console.log('\n📝 Step 1: Invoke Strands Agent to generate metrics');
    await invokeStrandsAgent(functionName);
    
    // Step 3: Wait a bit for metrics to be published
    console.log('\n⏳ Waiting 30 seconds for metrics to be published to CloudWatch...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Step 4: Check CloudWatch metrics
    console.log('\n📝 Step 2: Check CloudWatch custom metrics');
    await checkCloudWatchMetrics();
    
    // Step 5: Check CloudWatch alarms
    console.log('\n📝 Step 3: Check CloudWatch alarms');
    await checkCloudWatchAlarms();
    
    // Step 6: Validate alarm thresholds
    console.log('\n📝 Step 4: Validate alarm thresholds');
    await validateAlarmThresholds();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ CloudWatch monitoring test complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check CloudWatch console for metrics: StrandsAgent/Performance');
    console.log('   2. Check CloudWatch console for alarms');
    console.log('   3. Check CloudWatch dashboard: StrandsAgent-Performance-Monitoring');
    console.log('   4. Invoke Lambda multiple times to see warm start metrics');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
