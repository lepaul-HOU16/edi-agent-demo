/**
 * Debug Feature Count Issue
 * 
 * This script helps debug where the 60-feature limit is coming from
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function debugFeatureCount() {
  console.log('🔍 Debugging Feature Count Issue\n');
  
  try {
    // Test orchestrator
    const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 
      'amplify-nextjsamplifyge-renewableOrchestrator-';
    
    console.log(`📡 Calling orchestrator: ${orchestratorFunctionName}`);
    
    const query = 'Analyze terrain at 35.067482, -101.395466 within 5km radius';
    
    const command = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify({ query })
    });
    
    const response = await lambdaClient.send(command);
    const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('\n📦 Full Response Structure:');
    console.log(JSON.stringify(responsePayload, null, 2));
    
    // Analyze artifacts
    if (responsePayload.artifacts && responsePayload.artifacts.length > 0) {
      console.log('\n📊 Artifact Analysis:');
      responsePayload.artifacts.forEach((artifact, index) => {
        console.log(`\nArtifact ${index + 1}:`);
        console.log(`  Type: ${artifact.type}`);
        console.log(`  Data keys: ${Object.keys(artifact.data || {}).join(', ')}`);
        
        if (artifact.data) {
          console.log(`  Message Content Type: ${artifact.data.messageContentType}`);
          console.log(`  Project ID: ${artifact.data.projectId}`);
          
          if (artifact.data.metrics) {
            console.log(`  Metrics:`, artifact.data.metrics);
          }
          
          if (artifact.data.featureCount) {
            console.log(`  Feature Count: ${artifact.data.featureCount}`);
          }
          
          if (artifact.data.deploymentRequired) {
            console.log(`  ⚠️  Deployment Required: ${artifact.data.deploymentRequired}`);
            console.log(`  Missing Component: ${artifact.data.missingComponent}`);
          }
          
          if (artifact.data.fallbackUsed) {
            console.log(`  ⚠️  Fallback Used: ${artifact.data.fallbackUsed}`);
          }
        }
      });
    }
    
    // Check metadata
    if (responsePayload.metadata) {
      console.log('\n📋 Metadata:');
      console.log(`  Project ID: ${responsePayload.metadata.projectId}`);
      console.log(`  Tools Used: ${responsePayload.metadata.toolsUsed?.join(', ')}`);
      console.log(`  Execution Time: ${responsePayload.metadata.executionTime}ms`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFeatureCount();
