const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function getStackOutputs() {
  const client = new CloudFormationClient({ region: 'us-east-1' });
  try {
    const command = new DescribeStacksCommand({ StackName: 'amplify-digitalassistant-lepaul-sandbox-81360e1def' });
    const response = await client.send(command);
    const stack = response.Stacks[0];
    return stack.Outputs.reduce((acc, output) => {
      acc[output.OutputKey] = output.OutputValue;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting stack outputs:', error);
    throw error;
  }
}

async function testTerrainAnalysisArtifactFormat() {
  console.log('🧪 Testing terrain analysis artifact format transformation...\n');
  
  try {
    const outputs = await getStackOutputs();
    
    // Parse defined functions to find the lightweight agent Lambda
    let agentsFunctionName = null;
    if (outputs['definedFunctions']) {
      const definedFunctions = JSON.parse(outputs['definedFunctions']);
      agentsFunctionName = definedFunctions.find(func => func.includes('lightweightAgent'));
    }
    
    if (!agentsFunctionName) {
      throw new Error('Could not find agents Lambda function name in definedFunctions');
    }
    
    console.log(`📍 Using Lambda function: ${agentsFunctionName}`);
    
    const client = new LambdaClient({ region: 'us-east-1' });
    
    const payload = {
      arguments: {
        sessionId: 'test-terrain-artifact-' + Date.now(),
        message: 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970',
        foundationModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        userId: 'test-user-' + Date.now()
      },
      identity: {
        sub: 'test-user-' + Date.now(),
        username: 'test-user'
      }
    };
    
    console.log('📤 Sending terrain analysis request...');
    console.log('Request:', JSON.stringify(payload, null, 2));
    
    const command = new InvokeCommand({
      FunctionName: agentsFunctionName,
      Payload: JSON.stringify(payload)
    });
    
    const startTime = Date.now();
    const response = await client.send(command);
    const duration = Date.now() - startTime;
    
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log(`⏱️  Response received in ${duration}ms\n`);
    console.log('📥 Full Response:');
    console.log(JSON.stringify(responsePayload, null, 2));
    
    // Detailed validation of artifact format
    console.log('\n🔍 ARTIFACT FORMAT VALIDATION:');
    
    if (responsePayload.artifacts && responsePayload.artifacts.length > 0) {
      const artifact = responsePayload.artifacts[0];
      console.log(`✅ Artifact found with type: ${artifact.messageContentType}`);
      
      if (artifact.messageContentType === 'wind_farm_terrain_analysis') {
        console.log('✅ Correct artifact type: wind_farm_terrain_analysis');
        
        // Validate required fields for UI component
        const requiredFields = ['title', 'subtitle', 'coordinates', 'setbackDistance', 'exclusionZones', 'results'];
        let allFieldsPresent = true;
        
        for (const field of requiredFields) {
          if (artifact.hasOwnProperty(field)) {
            console.log(`✅ Required field '${field}' present`);
            
            // Detailed validation of nested structures
            if (field === 'coordinates') {
              if (artifact.coordinates.lat && artifact.coordinates.lng) {
                console.log(`   📍 Coordinates: ${artifact.coordinates.lat}, ${artifact.coordinates.lng}`);
              } else {
                console.log(`❌ Coordinates missing lat/lng`);
                allFieldsPresent = false;
              }
            }
            
            if (field === 'exclusionZones') {
              const zones = artifact.exclusionZones;
              console.log(`   🚫 Exclusion zones: water=${zones.water}, buildings=${zones.buildings}, roads=${zones.roads}, protected=${zones.protected}`);
            }
            
            if (field === 'results') {
              const results = artifact.results;
              console.log(`   📊 Results: buildableArea=${results.buildableArea}, constraints=${results.majorConstraints?.length || 0}, setbacks=${results.recommendedSetbacks}`);
            }
            
          } else {
            console.log(`❌ Required field '${field}' missing`);
            allFieldsPresent = false;
          }
        }
        
        if (allFieldsPresent) {
          console.log('\n🎉 SUCCESS: All required fields present for WindFarmTerrainComponent');
          console.log('✅ Artifact format transformation working correctly');
        } else {
          console.log('\n❌ FAILURE: Missing required fields for UI component');
        }
        
      } else {
        console.log(`❌ Wrong artifact type: ${artifact.messageContentType} (expected: wind_farm_terrain_analysis)`);
      }
      
    } else {
      console.log('❌ No artifacts found in response');
    }
    
    // Validate agent routing
    console.log('\n🔀 AGENT ROUTING VALIDATION:');
    if (responsePayload.agentUsed === 'renewableEnergyAgent') {
      console.log('✅ Correct agent used: renewableEnergyAgent');
    } else {
      console.log(`❌ Wrong agent used: ${responsePayload.agentUsed} (expected: renewableEnergyAgent)`);
    }
    
    // Validate thought steps for transparency
    console.log('\n🧠 THOUGHT STEPS VALIDATION:');
    if (responsePayload.thoughtSteps && responsePayload.thoughtSteps.length > 0) {
      console.log(`✅ ${responsePayload.thoughtSteps.length} thought steps present`);
      responsePayload.thoughtSteps.forEach((step, index) => {
        const content = step.content || step.summary || 'No content available';
        console.log(`   ${index + 1}. ${step.title}: ${content.toString().substring(0, 100)}...`);
      });
    } else {
      console.log('❌ No thought steps found');
    }
    
    // Check for rich visualization indicators
    console.log('\n🎨 UI COMPONENT COMPATIBILITY CHECK:');
    if (responsePayload.artifacts && responsePayload.artifacts[0]) {
      const artifact = responsePayload.artifacts[0];
      
      // Check if data structure matches WindFarmTerrainComponent expectations
      const hasTabData = artifact.exclusionZones && artifact.results;
      const hasVisualizationData = artifact.coordinates && artifact.setbackDistance;
      
      console.log(`✅ Tab data available: ${hasTabData}`);
      console.log(`✅ Visualization data available: ${hasVisualizationData}`);
      
      if (hasTabData && hasVisualizationData) {
        console.log('🎉 SUCCESS: Artifact ready for rich UI rendering');
      } else {
        console.log('⚠️  WARNING: Artifact may not render properly in UI');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testTerrainAnalysisArtifactFormat().catch(console.error);
