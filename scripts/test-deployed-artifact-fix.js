import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const testAgentQuery = `
  query TestLightweightAgent($input: String!) {
    lightweightAgent(input: $input) {
      success
      message
      artifacts
    }
  }
`;

async function testDeployedArtifactFix() {
  console.log('🧪 Testing deployed artifact fix...');
  
  try {
    const testInput = "Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.";
    
    console.log('📤 Sending request:', testInput);
    
    const result = await client.graphql({
      query: testAgentQuery,
      variables: {
        input: testInput
      }
    });

    const response = result.data.lightweightAgent;
    console.log('\n📥 Response received:');
    console.log('Success:', response.success);
    console.log('Message:', response.message);
    
    if (response.artifacts && response.artifacts.length > 0) {
      console.log('\n✅ ARTIFACTS FOUND! Count:', response.artifacts.length);
      console.log('First artifact type:', typeof response.artifacts[0]);
      
      // Try to parse the first artifact
      try {
        const firstArtifact = typeof response.artifacts[0] === 'string' 
          ? JSON.parse(response.artifacts[0]) 
          : response.artifacts[0];
        
        console.log('First artifact keys:', Object.keys(firstArtifact));
        
        if (firstArtifact.analysis) {
          console.log('✅ Analysis data found');
        }
        if (firstArtifact.plots) {
          console.log('✅ Plot data found:', firstArtifact.plots.length, 'plots');
        }
        if (firstArtifact.recommendations) {
          console.log('✅ Recommendations found');
        }
        
        console.log('\n🎯 ARTIFACT FIX SUCCESS! The system now returns proper artifacts.');
        
      } catch (parseError) {
        console.log('Artifact parse error:', parseError.message);
        console.log('Raw artifact:', response.artifacts[0].substring(0, 200) + '...');
      }
    } else {
      console.log('\n❌ NO ARTIFACTS RETURNED - Fix may not be working');
      console.log('Full response:', JSON.stringify(response, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.errors) {
      error.errors.forEach(err => console.error('GraphQL Error:', err.message));
    }
  }
}

testDeployedArtifactFix();
