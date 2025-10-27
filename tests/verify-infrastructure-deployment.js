#!/usr/bin/env node

/**
 * Verification script for renewable project persistence infrastructure
 * 
 * This script validates that all required infrastructure components are deployed:
 * 1. DynamoDB table for session context
 * 2. AWS Location Service Place Index for reverse geocoding
 * 3. S3 bucket structure for project data
 * 4. IAM permissions for orchestrator Lambda
 */

const { 
  DynamoDBClient, 
  DescribeTableCommand 
} = require('@aws-sdk/client-dynamodb');
const { 
  LocationClient, 
  DescribePlaceIndexCommand 
} = require('@aws-sdk/client-location');
const { 
  S3Client, 
  ListObjectsV2Command,
  HeadBucketCommand 
} = require('@aws-sdk/client-s3');
const { 
  LambdaClient, 
  GetFunctionConfigurationCommand 
} = require('@aws-sdk/client-lambda');
const { 
  IAMClient, 
  GetRolePolicyCommand,
  ListRolePoliciesCommand 
} = require('@aws-sdk/client-iam');

const region = 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const locationClient = new LocationClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const iamClient = new IAMClient({ region });

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyDynamoDBTable() {
  log('\n📊 Verifying DynamoDB Session Context Table...', 'blue');
  
  try {
    const command = new DescribeTableCommand({
      TableName: 'RenewableSessionContext'
    });
    
    const response = await dynamoClient.send(command);
    const table = response.Table;
    
    // Get TTL status separately as it's not always in DescribeTable response
    const { DescribeTimeToLiveCommand } = require('@aws-sdk/client-dynamodb');
    const ttlCommand = new DescribeTimeToLiveCommand({
      TableName: 'RenewableSessionContext'
    });
    const ttlResponse = await dynamoClient.send(ttlCommand);
    
    // Verify table configuration
    const checks = {
      'Table exists': table !== undefined,
      'Table is ACTIVE': table.TableStatus === 'ACTIVE',
      'Partition key is session_id': table.KeySchema[0].AttributeName === 'session_id',
      'Billing mode is PAY_PER_REQUEST': table.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST',
      'TTL is enabled': ttlResponse.TimeToLiveDescription?.TimeToLiveStatus === 'ENABLED',
      'TTL attribute is ttl': ttlResponse.TimeToLiveDescription?.AttributeName === 'ttl'
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        log(`  ✅ ${check}`, 'green');
      } else {
        log(`  ❌ ${check}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n✅ DynamoDB table verification PASSED', 'green');
      return true;
    } else {
      log('\n❌ DynamoDB table verification FAILED', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log('\n❌ DynamoDB table verification FAILED', 'red');
    return false;
  }
}

async function verifyLocationService() {
  log('\n🗺️  Verifying AWS Location Service Place Index...', 'blue');
  
  try {
    const command = new DescribePlaceIndexCommand({
      IndexName: 'RenewableProjectPlaceIndex'
    });
    
    const response = await locationClient.send(command);
    
    // Verify place index configuration
    const checks = {
      'Place index exists': response.IndexName === 'RenewableProjectPlaceIndex',
      'Data source is Esri': response.DataSource === 'Esri',
      'Pricing plan is RequestBasedUsage': response.PricingPlan === 'RequestBasedUsage',
      'Has description': response.Description !== undefined
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        log(`  ✅ ${check}`, 'green');
      } else {
        log(`  ❌ ${check}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n✅ Location Service verification PASSED', 'green');
      return true;
    } else {
      log('\n❌ Location Service verification FAILED', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log('\n❌ Location Service verification FAILED', 'red');
    return false;
  }
}

async function verifyS3BucketStructure() {
  log('\n🪣 Verifying S3 Bucket Structure...', 'blue');
  
  try {
    // Get bucket name from environment or use default pattern
    const bucketName = process.env.RENEWABLE_S3_BUCKET || 
                      'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy';
    
    // Verify bucket exists
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(headCommand);
    log(`  ✅ Bucket exists: ${bucketName}`, 'green');
    
    // Check for renewable/ prefix (will be created on first project save)
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'renewable/',
        MaxKeys: 1
      });
      const listResponse = await s3Client.send(listCommand);
      
      if (listResponse.KeyCount > 0 || listResponse.CommonPrefixes?.length > 0) {
        log(`  ✅ renewable/ prefix exists`, 'green');
      } else {
        log(`  ⚠️  renewable/ prefix not yet created (will be created on first project save)`, 'yellow');
      }
    } catch (error) {
      log(`  ⚠️  renewable/ prefix not yet created (will be created on first project save)`, 'yellow');
    }
    
    log('\n✅ S3 bucket verification PASSED', 'green');
    return true;
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log('\n❌ S3 bucket verification FAILED', 'red');
    return false;
  }
}

async function verifyOrchestratorPermissions() {
  log('\n🔐 Verifying Orchestrator Lambda Permissions...', 'blue');
  
  try {
    // Try to find orchestrator function by searching for it
    const { execSync } = require('child_process');
    let orchestratorFunctionName;
    
    try {
      orchestratorFunctionName = execSync(
        `aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text --region ${region}`,
        { encoding: 'utf-8' }
      ).trim();
    } catch (error) {
      log(`  ❌ Failed to find orchestrator function`, 'red');
      return false;
    }
    
    if (!orchestratorFunctionName) {
      log(`  ❌ Orchestrator function not found`, 'red');
      return false;
    }
    
    log(`  ℹ️  Function: ${orchestratorFunctionName}`, 'blue');
    
    // Get orchestrator function configuration
    const listFunctionsCommand = new GetFunctionConfigurationCommand({
      FunctionName: orchestratorFunctionName
    });
    
    const functionConfig = await lambdaClient.send(listFunctionsCommand);
    const roleName = functionConfig.Role.split('/').pop();
    
    log(`  ℹ️  Role: ${roleName}`, 'blue');
    
    // Get inline policies
    const listPoliciesCommand = new ListRolePoliciesCommand({
      RoleName: roleName
    });
    const policiesResponse = await iamClient.send(listPoliciesCommand);
    
    if (policiesResponse.PolicyNames.length === 0) {
      log(`  ❌ No inline policies found`, 'red');
      return false;
    }
    
    // Get the policy document
    const getPolicyCommand = new GetRolePolicyCommand({
      RoleName: roleName,
      PolicyName: policiesResponse.PolicyNames[0]
    });
    const policyResponse = await iamClient.send(getPolicyCommand);
    const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
    
    // Check for required permissions
    const requiredPermissions = {
      'Lambda invoke permissions': (stmt) => 
        stmt.Action === 'lambda:InvokeFunction' && 
        Array.isArray(stmt.Resource) && 
        stmt.Resource.some(r => r.includes('RenewableTerrain')),
      
      'DynamoDB ChatMessage permissions': (stmt) => 
        Array.isArray(stmt.Action) && 
        stmt.Action.includes('dynamodb:PutItem') &&
        Array.isArray(stmt.Resource) &&
        stmt.Resource.some(r => r.includes('ChatMessage')),
      
      'DynamoDB SessionContext permissions': (stmt) => 
        Array.isArray(stmt.Action) && 
        stmt.Action.includes('dynamodb:GetItem') &&
        Array.isArray(stmt.Resource) &&
        stmt.Resource.some(r => r.includes('RenewableSessionContext')),
      
      'Location Service permissions': (stmt) => 
        Array.isArray(stmt.Action) && 
        stmt.Action.includes('geo:SearchPlaceIndexForPosition') &&
        typeof stmt.Resource === 'string' &&
        stmt.Resource.includes('RenewableProjectPlaceIndex'),
      
      'S3 permissions': (stmt) => 
        Array.isArray(stmt.Action) && 
        stmt.Action.includes('s3:PutObject') &&
        Array.isArray(stmt.Resource)
    };
    
    let allPassed = true;
    for (const [permission, checkFn] of Object.entries(requiredPermissions)) {
      const found = policyDoc.Statement.some(checkFn);
      if (found) {
        log(`  ✅ ${permission}`, 'green');
      } else {
        log(`  ❌ ${permission}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n✅ Orchestrator permissions verification PASSED', 'green');
      return true;
    } else {
      log('\n❌ Orchestrator permissions verification FAILED', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log('\n❌ Orchestrator permissions verification FAILED', 'red');
    return false;
  }
}

async function verifyEnvironmentVariables() {
  log('\n🔧 Verifying Orchestrator Environment Variables...', 'blue');
  
  try {
    // Try to find orchestrator function by searching for it
    const { execSync } = require('child_process');
    let orchestratorFunctionName;
    
    try {
      orchestratorFunctionName = execSync(
        `aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text --region ${region}`,
        { encoding: 'utf-8' }
      ).trim();
    } catch (error) {
      log(`  ❌ Failed to find orchestrator function`, 'red');
      return false;
    }
    
    if (!orchestratorFunctionName) {
      log(`  ❌ Orchestrator function not found`, 'red');
      return false;
    }
    
    const command = new GetFunctionConfigurationCommand({
      FunctionName: orchestratorFunctionName
    });
    
    const response = await lambdaClient.send(command);
    const envVars = response.Environment?.Variables || {};
    
    // Check for required environment variables
    const requiredVars = {
      'SESSION_CONTEXT_TABLE': 'RenewableSessionContext',
      'AWS_LOCATION_PLACE_INDEX': 'RenewableProjectPlaceIndex',
      'RENEWABLE_S3_BUCKET': (val) => val && val.includes('amplify'),
      'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME': (val) => val && val.includes('Terrain'),
      'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME': (val) => val && val.includes('Layout'),
      'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME': (val) => val && val.includes('Simulation'),
      'RENEWABLE_REPORT_TOOL_FUNCTION_NAME': (val) => val && val.includes('Report'),
      'AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME': (val) => val && val.includes('ChatMessage')
    };
    
    let allPassed = true;
    for (const [varName, expectedValue] of Object.entries(requiredVars)) {
      const actualValue = envVars[varName];
      const passed = typeof expectedValue === 'function' 
        ? expectedValue(actualValue)
        : actualValue === expectedValue;
      
      if (passed) {
        log(`  ✅ ${varName}: ${actualValue}`, 'green');
      } else {
        log(`  ❌ ${varName}: ${actualValue || 'NOT SET'}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n✅ Environment variables verification PASSED', 'green');
      return true;
    } else {
      log('\n❌ Environment variables verification FAILED', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    log('\n❌ Environment variables verification FAILED', 'red');
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════════════════════════', 'blue');
  log('  Renewable Project Persistence Infrastructure Verification', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  const results = {
    dynamodb: await verifyDynamoDBTable(),
    locationService: await verifyLocationService(),
    s3: await verifyS3BucketStructure(),
    permissions: await verifyOrchestratorPermissions(),
    envVars: await verifyEnvironmentVariables()
  };
  
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  Summary', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  for (const [component, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? 'green' : 'red';
    log(`  ${component.padEnd(20)}: ${status}`, color);
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  
  if (allPassed) {
    log('\n🎉 All infrastructure components verified successfully!', 'green');
    log('\nThe renewable project persistence infrastructure is ready to use.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some infrastructure components failed verification.', 'red');
    log('\nPlease review the errors above and redeploy if necessary.', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Verification failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
