/**
 * Comprehensive validation test for deployed terrain analysis functionality
 * Tests the complete workflow: routing -> pattern matching -> tool execution -> artifact generation
 */

const { generateClient } = require('aws-amplify/api');
const config = require('./amplify_outputs.json');

// Configure Amplify
const { Amplify } = require('aws-amplify');
Amplify.configure(config);

const client = generateClient();

const QUERY_AGENTS_WITH_MESSAGES = `
  mutation QueryAgentsWithMessages($messages: [MessageInput!]!) {
    queryAgentsWithMessages(messages: $messages) {
      success
      message
      artifacts {
        messageContentType
        title
        subtitle
        analysisType
      }
      thoughtSteps {
        id
        type
        title
        description
      }
      sourceAttribution {
        title
        url
        snippet
      }
      agentUsed
    }
  }
`;

async function testTerrainAnalysis() {
  console.log('🧪 Testing Deployed Terrain Analysis Fix');
  console.log('=====================================\n');

  const testMessage = "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970";
  
  console.log('📋 Test Details:');
  console.log(`Message: ${testMessage}`);
  console.log(`Expected Agent: renewable_energy`);
  console.log(`Expected Artifact Type: wind_farm_terrain_analysis`);
  console.log('');

  try {
    console.log('🚀 Sending query to deployed system...');
    
    const variables = {
      messages: [{
        role: 'user',
        content: testMessage
      }]
    };

    const response = await client.graphql({
      query: QUERY_AGENTS_WITH_MESSAGES,
      variables: variables
    });

    const result = response.data.queryAgentsWithMessages;
    
    console.log('📨 Response received!\n');
    
    // Validation checks
    console.log('🔍 Validation Results:');
    console.log('====================');
    
    // Check 1: Success status
    const successCheck = result.success;
    console.log(`✓ Success Status: ${successCheck ? '✅ PASS' : '❌ FAIL'} (${result.success})`);
    
    // Check 2: Agent routing
    const agentCheck = result.agentUsed === 'renewable_energy';
    console.log(`✓ Agent Routing: ${agentCheck ? '✅ PASS' : '❌ FAIL'} (${result.agentUsed})`);
    
    // Check 3: Artifacts generated
    const artifactsCheck = result.artifacts && result.artifacts.length > 0;
    console.log(`✓ Artifacts Generated: ${artifactsCheck ? '✅ PASS' : '❌ FAIL'} (${result.artifacts?.length || 0} artifacts)`);
    
    // Check 4: Terrain analysis artifact type
    const terrainArtifactCheck = result.artifacts?.some(artifact => 
      artifact.messageContentType === 'wind_farm_terrain_analysis'
    );
    console.log(`✓ Terrain Analysis Artifact: ${terrainArtifactCheck ? '✅ PASS' : '❌ FAIL'}`);
    
    // Check 5: Thought steps present
    const thoughtStepsCheck = result.thoughtSteps && result.thoughtSteps.length > 0;
    console.log(`✓ Thought Steps: ${thoughtStepsCheck ? '✅ PASS' : '❌ FAIL'} (${result.thoughtSteps?.length || 0} steps)`);
    
    // Check 6: Not generic guidance response
    const notGenericCheck = !result.message.includes("I'm here to help with your renewable energy project!");
    console.log(`✓ Not Generic Response: ${notGenericCheck ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📊 Detailed Response Analysis:');
    console.log('==============================');
    
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('🎯 Artifacts:');
      result.artifacts.forEach((artifact, index) => {
        console.log(`  ${index + 1}. ${artifact.title} (${artifact.messageContentType})`);
        console.log(`     Subtitle: ${artifact.subtitle}`);
        console.log(`     Analysis Type: ${artifact.analysisType}`);
      });
    }
    
    if (result.thoughtSteps && result.thoughtSteps.length > 0) {
      console.log('\n🧠 Thought Steps:');
      result.thoughtSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. [${step.type}] ${step.title}`);
        console.log(`     ${step.description}`);
      });
    }
    
    if (result.sourceAttribution && result.sourceAttribution.length > 0) {
      console.log('\n📚 Source Attribution:');
      result.sourceAttribution.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.title}`);
        console.log(`     ${source.snippet}`);
      });
    }
    
    console.log('\n📝 Response Message:');
    console.log(result.message.substring(0, 200) + (result.message.length > 200 ? '...' : ''));
    
    // Overall test result
    const allChecks = [successCheck, agentCheck, artifactsCheck, terrainArtifactCheck, thoughtStepsCheck, notGenericCheck];
    const passCount = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;
    
    console.log('\n🏆 OVERALL TEST RESULT:');
    console.log('=======================');
    console.log(`${passCount}/${totalChecks} checks passed`);
    
    if (passCount === totalChecks) {
      console.log('🎉 SUCCESS: Terrain analysis is working correctly!');
      console.log('✅ Pattern matching fix deployed successfully');
      console.log('✅ Tool execution working properly');
      console.log('✅ Artifact generation functioning');
    } else {
      console.log('❌ ISSUES DETECTED: Some checks failed');
      if (!agentCheck) console.log('   - Agent routing issue');
      if (!artifactsCheck) console.log('   - No artifacts generated');
      if (!terrainArtifactCheck) console.log('   - Wrong artifact type');
      if (!notGenericCheck) console.log('   - Still returning generic guidance');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('- Check if deployment completed successfully');
    console.log('- Verify amplify_outputs.json is up to date');
    console.log('- Confirm all Lambda functions are deployed');
  }
}

// Run the test
testTerrainAnalysis().then(() => {
  console.log('\n✨ Test completed');
}).catch(error => {
  console.error('💥 Test runner error:', error);
});
