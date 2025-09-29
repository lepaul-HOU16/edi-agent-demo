/**
 * Test Multi-Agent System with Trusted Web Search
 * Tests the enhanced routing system and general knowledge agent capabilities
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lambda = new AWS.Lambda();

async function testMultiAgentSystem() {
  console.log('🧪 === MULTI-AGENT SYSTEM TEST START ===');
  
  const testQueries = [
    {
      name: 'Weather Query with Geographic Integration',
      message: 'What is the weather in offshore Malaysia?',
      expectedAgent: 'general_knowledge',
      expectedFeatures: ['weather_data', 'catalog_integration', 'source_attribution']
    },
    {
      name: 'EU AI Regulations Query',
      message: 'What are the EU AI regulations regarding automated decision making?',
      expectedAgent: 'general_knowledge', 
      expectedFeatures: ['regulatory_info', 'source_attribution', 'trusted_sources']
    },
    {
      name: 'General Conversational Query',
      message: 'Hello, can you help me understand how AI agents work?',
      expectedAgent: 'general_knowledge',
      expectedFeatures: ['conversational_response', 'educational_content']
    },
    {
      name: 'Petrophysics Analysis Query',
      message: 'Calculate porosity for WELL-001 using density method',
      expectedAgent: 'petrophysics',
      expectedFeatures: ['calculation_results', 'artifacts', 'technical_analysis']
    },
    {
      name: 'Catalog/Geographic Query',
      message: 'Show me all wells in the South China Sea region',
      expectedAgent: 'catalog_search',
      expectedFeatures: ['geographic_search', 'well_mapping', 'spatial_analysis']
    },
    {
      name: 'Mixed Query (General to Petrophysics)',
      message: 'What is porosity and can you calculate it for WELL-001?',
      expectedAgent: 'general_knowledge', // Should start with explanation, then suggest calculation
      expectedFeatures: ['educational_response', 'calculation_guidance']
    }
  ];

  const results = [];

  for (const testCase of testQueries) {
    try {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`📝 Query: "${testCase.message}"`);
      console.log(`🎯 Expected Agent: ${testCase.expectedAgent}`);
      
      const startTime = Date.now();
      
      // Test the lambda function
      const params = {
        FunctionName: 'amplify-d1eeg2gu6ddc3z-ma-lightweightAgent-IVNOKdTiOlvW', // Your function name
        Payload: JSON.stringify({
          arguments: {
            chatSessionId: 'test-session-multi-agent',
            message: testCase.message,
            foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            userId: 'test-user-multi-agent'
          }
        })
      };

      console.log('⚡ Invoking Lambda with multi-agent router...');
      const response = await lambda.invoke(params).promise();
      const duration = Date.now() - startTime;

      if (response.Payload) {
        const result = JSON.parse(response.Payload.toString());
        console.log('📤 Lambda Response Status:', response.StatusCode);
        
        if (result.success) {
          console.log('✅ Multi-Agent Test Success');
          console.log('🔀 Agent Used:', result.agentUsed || 'unknown');
          console.log('💬 Response Length:', result.message?.length || 0);
          console.log('📦 Artifacts Count:', result.artifacts?.length || 0);
          console.log('🧠 Thought Steps Count:', result.thoughtSteps?.length || 0);
          console.log('📚 Source Attribution Count:', result.sourceAttribution?.length || 0);
          console.log('⏱️ Duration:', duration + 'ms');
          
          // Validate expected features
          const validation = {
            correctAgent: result.agentUsed === testCase.expectedAgent,
            hasArtifacts: Array.isArray(result.artifacts) && result.artifacts.length > 0,
            hasThoughtSteps: Array.isArray(result.thoughtSteps) && result.thoughtSteps.length > 0,
            hasSources: Array.isArray(result.sourceAttribution) && result.sourceAttribution.length > 0,
            hasMessage: result.message && result.message.length > 0
          };
          
          console.log('🧪 Validation Results:', validation);
          
          // Check for source attribution in general knowledge queries
          if (testCase.expectedAgent === 'general_knowledge' && result.sourceAttribution?.length > 0) {
            console.log('📚 Source Attribution Details:');
            result.sourceAttribution.forEach((source, idx) => {
              console.log(`  ${idx + 1}. ${source.domain} (${source.trustLevel} trust)`);
            });
          }
          
          // Check for thought steps chain
          if (result.thoughtSteps?.length > 0) {
            console.log('🧠 Chain of Thought:');
            result.thoughtSteps.forEach((step, idx) => {
              console.log(`  ${idx + 1}. ${step.title} - ${step.status}`);
              if (step.sources?.length > 0) {
                console.log(`    Sources: ${step.sources.map(s => s.domain).join(', ')}`);
              }
            });
          }

          results.push({
            testCase: testCase.name,
            success: true,
            agentUsed: result.agentUsed,
            duration,
            validation,
            artifactCount: result.artifacts?.length || 0,
            thoughtStepCount: result.thoughtSteps?.length || 0,
            sourceCount: result.sourceAttribution?.length || 0
          });
          
        } else {
          console.log('❌ Multi-Agent Test Failed');
          console.log('📝 Error Message:', result.message);
          console.log('🧠 Thought Steps:', result.thoughtSteps?.length || 0);
          
          results.push({
            testCase: testCase.name,
            success: false,
            error: result.message,
            duration
          });
        }
      } else {
        console.log('❌ No response payload received');
        results.push({
          testCase: testCase.name,
          success: false,
          error: 'No response payload',
          duration
        });
      }
      
    } catch (error) {
      console.error('💥 Test Error:', error.message);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n🏁 === MULTI-AGENT SYSTEM TEST SUMMARY ===');
  console.log(`📊 Total Tests: ${testQueries.length}`);
  console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
  
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    console.log('\n🎯 Agent Distribution:');
    const agentCounts = {};
    successfulTests.forEach(result => {
      agentCounts[result.agentUsed] = (agentCounts[result.agentUsed] || 0) + 1;
    });
    Object.entries(agentCounts).forEach(([agent, count]) => {
      console.log(`  ${agent}: ${count} queries`);
    });
    
    console.log('\n📊 Feature Validation:');
    console.log(`  Average Artifacts: ${(successfulTests.reduce((sum, r) => sum + r.artifactCount, 0) / successfulTests.length).toFixed(1)}`);
    console.log(`  Average Thought Steps: ${(successfulTests.reduce((sum, r) => sum + r.thoughtStepCount, 0) / successfulTests.length).toFixed(1)}`);
    console.log(`  Average Sources: ${(successfulTests.reduce((sum, r) => sum + r.sourceCount, 0) / successfulTests.length).toFixed(1)}`);
    console.log(`  Average Duration: ${(successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length).toFixed(0)}ms`);
  }

  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(result => {
      console.log(`  ${result.testCase}: ${result.error}`);
    });
  }

  console.log('\n🎉 Multi-Agent System Test Complete!');
  
  return results;
}

// Run the test
if (require.main === module) {
  testMultiAgentSystem()
    .then(results => {
      console.log('\n📋 Test execution completed');
      process.exit(results.every(r => r.success) ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testMultiAgentSystem };
