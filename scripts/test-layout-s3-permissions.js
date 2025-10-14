#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function testLayoutToolS3Access() {
  console.log('\n🧪 Testing Layout Tool S3 Access...\n');
  
  const payload = {
    parameters: {
      latitude: 40.7128,
      longitude: -74.0060,
      num_turbines: 10,
      project_id: 'test-s3-permissions'
    }
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: 'amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG',
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('✅ Lambda invocation successful');
    console.log('\n📊 Response:', JSON.stringify(result, null, 2));
    
    if (result.errorMessage) {
      console.error('\n❌ Lambda returned an error:', result.errorMessage);
      if (result.errorMessage.includes('AccessDenied')) {
        console.error('\n🔴 S3 ACCESS DENIED - Permissions fix did not work!');
        return false;
      }
    }
    
    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      if (body.s3_data) {
        console.log('\n✅ S3 data present in response');
        console.log('   Bucket:', body.s3_data.bucket);
        console.log('   Key:', body.s3_data.key);
        console.log('\n🎉 S3 PERMISSIONS FIX SUCCESSFUL!');
        return true;
      }
    }
    
    console.log('\n⚠️  Response structure unexpected, check logs');
    return false;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  S3 Permissions Fix Validation Test (Layout Tool)');
  console.log('═══════════════════════════════════════════════════════');
  
  const success = await testLayoutToolS3Access();
  
  console.log('\n═══════════════════════════════════════════════════════');
  if (success) {
    console.log('✅ ALL TESTS PASSED - S3 permissions are working!');
    process.exit(0);
  } else {
    console.log('❌ TESTS FAILED - S3 permissions issue persists');
    process.exit(1);
  }
}

main();
