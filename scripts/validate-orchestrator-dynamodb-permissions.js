#!/usr/bin/env node

/**
 * Validation script for orchestrator DynamoDB permissions
 * Verifies that the orchestrator Lambda has the necessary permissions to write to ChatMessage table
 */

const { IAMClient, GetRolePolicyCommand, ListRolePoliciesCommand, GetPolicyCommand, ListAttachedRolePoliciesCommand } = require('@aws-sdk/client-iam');
const { LambdaClient, GetFunctionCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});
const iamClient = new IAMClient({});

async function validateOrchestratorPermissions() {
  console.log('🔍 Validating Orchestrator DynamoDB Permissions\n');
  
  try {
    // Step 1: Get orchestrator function details
    console.log('Step 1: Getting orchestrator function details...');
    const functionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator';
    
    let functionConfig;
    try {
      const getFunctionResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      functionConfig = getFunctionResponse.Configuration;
      console.log(`✅ Found function: ${functionConfig.FunctionName}`);
      console.log(`   Role ARN: ${functionConfig.Role}\n`);
    } catch (error) {
      console.error(`❌ Function not found: ${functionName}`);
      console.error('   Make sure the orchestrator is deployed: npx ampx sandbox\n');
      return false;
    }
    
    // Step 2: Extract role name from ARN
    const roleArn = functionConfig.Role;
    const roleName = roleArn.split('/').pop();
    console.log(`Step 2: Checking IAM role: ${roleName}...`);
    
    // Step 3: Check inline policies
    console.log('\nStep 3: Checking inline policies...');
    const listPoliciesResponse = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );
    
    let hasDynamoDBPermissions = false;
    
    for (const policyName of listPoliciesResponse.PolicyNames || []) {
      const policyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName
        })
      );
      
      const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
      
      // Check for DynamoDB permissions
      for (const statement of policyDocument.Statement || []) {
        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
        const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
        
        const hasDynamoDBActions = actions.some(action => 
          action.includes('dynamodb:PutItem') || 
          action.includes('dynamodb:GetItem') ||
          action.includes('dynamodb:UpdateItem') ||
          action.includes('dynamodb:Query')
        );
        
        const hasChatMessageResource = resources.some(resource => 
          resource.includes('ChatMessage')
        );
        
        if (hasDynamoDBActions && hasChatMessageResource) {
          hasDynamoDBPermissions = true;
          console.log(`✅ Found DynamoDB permissions in policy: ${policyName}`);
          console.log(`   Actions: ${actions.join(', ')}`);
          console.log(`   Resources: ${resources.join(', ')}`);
        }
      }
    }
    
    // Step 4: Check attached managed policies
    console.log('\nStep 4: Checking attached managed policies...');
    const attachedPoliciesResponse = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    
    for (const policy of attachedPoliciesResponse.AttachedPolicies || []) {
      console.log(`   - ${policy.PolicyName} (${policy.PolicyArn})`);
    }
    
    // Step 5: Check environment variables
    console.log('\nStep 5: Checking environment variables...');
    const envVars = functionConfig.Environment?.Variables || {};
    
    const hasTableName = !!envVars.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME;
    console.log(`   AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: ${hasTableName ? '✅ ' + envVars.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME : '❌ Not set'}`);
    
    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (hasDynamoDBPermissions && hasTableName) {
      console.log('✅ All checks passed!');
      console.log('   - DynamoDB permissions: ✅');
      console.log('   - Table name environment variable: ✅');
      console.log('\nThe orchestrator is correctly configured to write results to DynamoDB.');
      return true;
    } else {
      console.log('❌ Configuration issues detected:');
      if (!hasDynamoDBPermissions) {
        console.log('   - DynamoDB permissions: ❌ Missing');
        console.log('     Fix: Ensure backend.ts grants DynamoDB permissions to orchestrator');
      }
      if (!hasTableName) {
        console.log('   - Table name environment variable: ❌ Missing');
        console.log('     Fix: Ensure backend.ts sets AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME');
      }
      console.log('\nPlease redeploy: npx ampx sandbox');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error('\nMake sure you have AWS credentials configured and the orchestrator is deployed.');
    return false;
  }
}

// Run validation
validateOrchestratorPermissions()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
