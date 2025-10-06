const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lambda = new AWS.Lambda();

async function testFrontendArtifactProcessing() {
  console.log('🧪 Testing frontend wind farm artifact processing...');
  
  try {
    // Define test message
    const testMessage = 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970';
    
    // Get stack information
    const cloudformation = new AWS.CloudFormation();
    const stacks = await cloudformation.listStacks({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
    }).promise();
    
    const targetStack = stacks.StackSummaries.find(stack => 
      stack.StackName.includes('digitalassistant') && 
      stack.StackName.includes('sandbox')
    );
    
    if (!targetStack) {
      console.error('❌ Could not find sandbox stack');
      return;
    }
    
    console.log('📍 Using stack:', targetStack.StackName);
    
    // Get stack resources
    const resources = await cloudformation.listStackResources({
      StackName: targetStack.StackName
    }).promise();
    
    // Find the lightweight agent lambda
    const lambdaResource = resources.StackResourceSummaries.find(resource => 
      resource.ResourceType === 'AWS::Lambda::Function' &&
      resource.LogicalResourceId.includes('lightweightAgent')
    );
    
    if (!lambdaResource) {
      console.error('❌ Could not find lightweightAgent lambda');
      return;
    }
    
    const functionName = lambdaResource.PhysicalResourceId;
    console.log('📍 Using Lambda function:', functionName);
    
    // Prepare the request payload
    const payload = {
      arguments: {
        sessionId: `test-frontend-wind-${Date.now()}`,
        message: testMessage,
        foundationModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        userId: `test-user-${Date.now()}`
      },
      identity: {
        sub: `test-user-${Date.now()}`,
        username: 'test-user'
      }
    };
    
    console.log('📤 Sending request...');
    console.log('Request:', JSON.stringify(payload, null, 2));
    
    const startTime = Date.now();
    
    const result = await lambda.invoke({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    }).promise();
    
    const endTime = Date.now();
    console.log(`⏱️  Response received in ${endTime - startTime}ms`);
    
    if (result.StatusCode === 200) {
      const response = JSON.parse(result.Payload);
      console.log('\n📥 Full Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Detailed artifact analysis
      if (response.artifacts && response.artifacts.length > 0) {
        console.log('\n🔍 ARTIFACT ANALYSIS:');
        response.artifacts.forEach((artifact, index) => {
          console.log(`\nArtifact ${index + 1}:`);
          console.log('  type:', artifact.type);
          console.log('  messageContentType:', artifact.messageContentType);
          
          // Check what the ArtifactRenderer would use
          const artifactType = artifact.type || artifact.messageContentType;
          console.log('  🎯 ArtifactRenderer would use:', artifactType);
          
          // Check specific fields
          console.log('  title:', artifact.title);
          console.log('  coordinates:', artifact.coordinates);
          console.log('  exclusionZones:', artifact.exclusionZones);
          console.log('  results:', artifact.results);
          
          // Frontend component matching
          if (artifactType === 'wind_farm_terrain_analysis') {
            console.log('  ✅ MATCH: Would render WindFarmTerrainComponent');
          } else {
            console.log(`  ❌ NO MATCH: artifactType '${artifactType}' doesn't match 'wind_farm_terrain_analysis'`);
          }
        });
        
        console.log('\n🎨 FRONTEND COMPATIBILITY:');
        const terrainArtifact = response.artifacts.find(a => 
          (a.type || a.messageContentType) === 'wind_farm_terrain_analysis'
        );
        
        if (terrainArtifact) {
          console.log('✅ Wind farm terrain artifact found');
          console.log('✅ Has required fields:');
          console.log('   - title:', !!terrainArtifact.title);
          console.log('   - coordinates:', !!terrainArtifact.coordinates);
          console.log('   - exclusionZones:', !!terrainArtifact.exclusionZones);
          console.log('   - results:', !!terrainArtifact.results);
          console.log('   - setbackDistance:', !!terrainArtifact.setbackDistance);
        } else {
          console.log('❌ No wind farm terrain artifact found');
        }
        
      } else {
        console.log('❌ No artifacts in response');
      }
      
      // Agent routing check
      console.log('\n🔀 AGENT ROUTING:');
      console.log('Agent used:', response.agentUsed);
      
    } else {
      console.error('❌ Lambda invocation failed');
      console.error('Status:', result.StatusCode);
      console.error('Payload:', result.Payload);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testFrontendArtifactProcessing();
