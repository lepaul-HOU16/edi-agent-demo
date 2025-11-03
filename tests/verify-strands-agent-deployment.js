#!/usr/bin/env node

/**
 * Verification Script: Strands Agent Lambda Deployment
 * 
 * This script verifies that the Strands Agent Lambda is properly deployed
 * and configured according to Task 1 requirements.
 */

const { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { IAMClient, GetRolePolicyCommand, ListRolePoliciesCommand } = require('@aws-sdk/client-iam');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

const REQUIRED_ENV_VARS = [
  'BEDROCK_MODEL_ID',
  'RENEWABLE_S3_BUCKET',
  'AGENT_PROGRESS_TABLE',
  'GET_INFO_LOGS',
  'DISABLE_CALLBACK_HANDLER'
];

const REQUIRED_PERMISSIONS = [
  { action: 'bedrock:InvokeModel', description: 'Bedrock model invocation' },
  { action: 's3:PutObject', description: 'S3 artifact storage' },
  { action: 'dynamodb:PutItem', description: 'DynamoDB progress tracking' },
  { action: 'cloudwatch:PutMetricData', description: 'CloudWatch metrics' }
];

async function verifyLambdaExists(functionName) {
  console.log('\n📋 Step 1: Verify Lambda exists in AWS Console');
  console.log('=' .repeat(60));
  
  try {
    const command = new GetFunctionCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    
    console.log('✅ Lambda function found:');
    console.log(`   Name: ${response.Configuration.FunctionName}`);
    console.log(`   ARN: ${response.Configuration.FunctionArn}`);
    console.log(`   Package Type: ${response.Configuration.PackageType}`);
    console.log(`   Memory: ${response.Configuration.MemorySize} MB`);
    console.log(`   Timeout: ${response.Configuration.Timeout} seconds`);
    console.log(`   Last Modified: ${response.Configuration.LastModified}`);
    
    return {
      success: true,
      functionArn: response.Configuration.FunctionArn,
      roleArn: response.Configuration.Role
    };
  } catch (error) {
    console.error('❌ Lambda function not found:', error.message);
    return { success: false };
  }
}

async function verifyEnvironmentVariables(functionName) {
  console.log('\n📋 Step 2: Check environment variables are set correctly');
  console.log('=' .repeat(60));
  
  try {
    const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    
    const envVars = response.Environment?.Variables || {};
    let allPresent = true;
    
    console.log('Environment Variables:');
    for (const varName of REQUIRED_ENV_VARS) {
      const value = envVars[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${value}`);
      } else {
        console.log(`   ❌ ${varName}: MISSING`);
        allPresent = false;
      }
    }
    
    // Check for additional important variables
    const additionalVars = Object.keys(envVars).filter(k => !REQUIRED_ENV_VARS.includes(k));
    if (additionalVars.length > 0) {
      console.log('\nAdditional Environment Variables:');
      additionalVars.forEach(varName => {
        console.log(`   ℹ️  ${varName}: ${envVars[varName]}`);
      });
    }
    
    return { success: allPresent, envVars };
  } catch (error) {
    console.error('❌ Failed to get environment variables:', error.message);
    return { success: false };
  }
}

async function verifyIAMPermissions(roleArn) {
  console.log('\n📋 Step 3: Verify IAM permissions granted');
  console.log('=' .repeat(60));
  
  try {
    const roleName = roleArn.split('/').pop();
    
    // List inline policies
    const listPoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
    const policiesResponse = await iamClient.send(listPoliciesCommand);
    
    if (policiesResponse.PolicyNames.length === 0) {
      console.log('❌ No inline policies found');
      return { success: false };
    }
    
    console.log(`Found ${policiesResponse.PolicyNames.length} inline policy(ies)`);
    
    // Get the policy document
    const policyName = policiesResponse.PolicyNames[0];
    const getPolicyCommand = new GetRolePolicyCommand({
      RoleName: roleName,
      PolicyName: policyName
    });
    const policyResponse = await iamClient.send(getPolicyCommand);
    
    const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
    const statements = policyDoc.Statement || [];
    
    console.log('\nPermissions Check:');
    let allPermissionsFound = true;
    
    for (const required of REQUIRED_PERMISSIONS) {
      const found = statements.some(stmt => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some(action => 
          action === required.action || 
          action.endsWith('*') && required.action.startsWith(action.slice(0, -1))
        );
      });
      
      if (found) {
        console.log(`   ✅ ${required.action} - ${required.description}`);
      } else {
        console.log(`   ❌ ${required.action} - ${required.description} (MISSING)`);
        allPermissionsFound = false;
      }
    }
    
    // Show all granted permissions
    console.log('\nAll Granted Permissions:');
    statements.forEach((stmt, idx) => {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      console.log(`   Statement ${idx + 1}:`);
      actions.forEach(action => {
        console.log(`      - ${action}`);
      });
    });
    
    return { success: allPermissionsFound };
  } catch (error) {
    console.error('❌ Failed to verify IAM permissions:', error.message);
    return { success: false };
  }
}

async function verifyOrchestratorIntegration() {
  console.log('\n📋 Step 4: Verify orchestrator can invoke Strands Agent');
  console.log('=' .repeat(60));
  
  try {
    // Find orchestrator function - use known name
    const orchestratorName = 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE';
    
    try {
      const testCommand = new GetFunctionConfigurationCommand({
        FunctionName: orchestratorName
      });
      await lambdaClient.send(testCommand);
    } catch (error) {
      console.log('❌ Orchestrator function not found:', orchestratorName);
      return { success: false };
    }
    
    const orchestrator = { FunctionName: orchestratorName };
    
    console.log(`✅ Found orchestrator: ${orchestrator.FunctionName}`);
    
    // Check environment variable
    const configCommand = new GetFunctionConfigurationCommand({
      FunctionName: orchestrator.FunctionName
    });
    const configResponse = await lambdaClient.send(configCommand);
    
    const strandsAgentFunctionName = configResponse.Environment?.Variables?.RENEWABLE_AGENTS_FUNCTION_NAME;
    
    if (strandsAgentFunctionName) {
      console.log(`✅ RENEWABLE_AGENTS_FUNCTION_NAME: ${strandsAgentFunctionName}`);
    } else {
      console.log('❌ RENEWABLE_AGENTS_FUNCTION_NAME not set in orchestrator');
      return { success: false };
    }
    
    // Check orchestrator has invoke permission
    const orchestratorRoleName = configResponse.Role.split('/').pop();
    const listPoliciesCommand = new ListRolePoliciesCommand({ RoleName: orchestratorRoleName });
    const policiesResponse = await iamClient.send(listPoliciesCommand);
    
    const policyName = policiesResponse.PolicyNames[0];
    const getPolicyCommand = new GetRolePolicyCommand({
      RoleName: orchestratorRoleName,
      PolicyName: policyName
    });
    const policyResponse = await iamClient.send(getPolicyCommand);
    
    const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
    const hasInvokePermission = policyDoc.Statement.some(stmt => {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
      
      return actions.includes('lambda:InvokeFunction') && 
             resources.some(r => r.includes('RenewableAgentsFunction'));
    });
    
    if (hasInvokePermission) {
      console.log('✅ Orchestrator has permission to invoke Strands Agent');
    } else {
      console.log('❌ Orchestrator missing invoke permission for Strands Agent');
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to verify orchestrator integration:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('🚀 Strands Agent Lambda Deployment Verification');
  console.log('=' .repeat(60));
  console.log('Task 1: Deploy Strands Agent Lambda to AWS');
  console.log('');
  
  const functionName = 'amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm';
  
  // Step 1: Verify Lambda exists
  const lambdaResult = await verifyLambdaExists(functionName);
  if (!lambdaResult.success) {
    console.log('\n❌ VERIFICATION FAILED: Lambda not deployed');
    process.exit(1);
  }
  
  // Step 2: Verify environment variables
  const envResult = await verifyEnvironmentVariables(functionName);
  if (!envResult.success) {
    console.log('\n⚠️  WARNING: Some environment variables missing');
  }
  
  // Step 3: Verify IAM permissions
  const iamResult = await verifyIAMPermissions(lambdaResult.roleArn);
  if (!iamResult.success) {
    console.log('\n⚠️  WARNING: Some IAM permissions missing');
  }
  
  // Step 4: Verify orchestrator integration
  const orchestratorResult = await verifyOrchestratorIntegration();
  if (!orchestratorResult.success) {
    console.log('\n⚠️  WARNING: Orchestrator integration incomplete');
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(60));
  
  const checks = [
    { name: 'Lambda Deployment', result: lambdaResult.success },
    { name: 'Environment Variables', result: envResult.success },
    { name: 'IAM Permissions', result: iamResult.success },
    { name: 'Orchestrator Integration', result: orchestratorResult.success }
  ];
  
  checks.forEach(check => {
    const icon = check.result ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.result);
  
  if (allPassed) {
    console.log('\n🎉 SUCCESS: Task 1 Complete!');
    console.log('   Strands Agent Lambda is fully deployed and configured.');
    console.log('\n📝 Next Steps:');
    console.log('   - Task 2: Test cold start performance');
    console.log('   - Task 3: Implement lazy loading if needed');
    process.exit(0);
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS: Lambda deployed but some checks failed');
    console.log('   Review warnings above and fix any issues.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
});
