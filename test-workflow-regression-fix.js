const axios = require('axios');

async function testWorkflowRegression() {
  console.log('🧪 === WORKFLOW REGRESSION FIX TEST ===');
  console.log('📦 Testing fixed intent detection to ensure workflows route correctly');
  console.log('🔗 Endpoint: https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql');
  
  // Test cases for the workflows that had regression
  const testCases = [
    {
      name: 'Production Well Data Discovery',
      message: 'Comprehensive analysis of all 24 production wells (WELL-001 through WELL-024) with spatial distribution and log curve inventory.',
      expectedIntent: 'well_data_discovery',
      shouldNotRoute: 'gamma_ray_visualization',
      shouldContain: ['Well Data Discovery', 'Dataset Overview', 'Total Wells', 'spatial distribution']
    },
    {
      name: 'Multi-Well Correlation Analysis', 
      message: 'AI-powered correlation analysis with interactive visualization panels, geological interpretation, and development strategy recommendations using the first 5 wells.',
      expectedIntent: 'multi_well_correlation',
      shouldNotRoute: 'gamma_ray_visualization',
      shouldContain: ['Multi-well correlation', 'interactive visualizations', 'correlation panel']
    },
    {
      name: 'Gamma Ray Histogram (Should Still Work)',
      message: 'give me a histogram of gamma ray distribution for well 001',
      expectedIntent: 'gamma_ray_visualization',
      shouldContain: ['Gamma Ray Distribution', 'Histogram', 'statistical distribution']
    },
    {
      name: 'Gamma Ray Depth Coverage (Should Still Work)',
      message: 'generate a depth coverage plot for gamma ray in wells 001-005',
      expectedIntent: 'gamma_ray_visualization', 
      shouldContain: ['Gamma Ray Depth Coverage', 'depth coverage plot', 'gamma ray response']
    }
  ];
  
  const mutation = `
    mutation SendChatMessage($input: SendChatMessageInput!) {
      sendChatMessage(input: $input) {
        id
        role
        content
        artifacts
        responseComplete
      }
    }
  `;
  
  console.log('\n🔄 Testing workflow regression fixes...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: ${testCase.name}`);
      console.log(`💬 Message: "${testCase.message}"`);
      console.log(`🎯 Expected Intent: ${testCase.expectedIntent}`);
      
      const response = await axios.post('https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql', {
        query: mutation,
        variables: {
          input: {
            chatSessionId: 'workflow-test-' + Date.now(),
            content: testCase.message,
            role: 'user'
          }
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      const result = response.data.data?.sendChatMessage;
      
      if (result) {
        console.log(`✅ Response received`);
        const content = result.content || '';
        console.log(`📤 Content preview: "${content.substring(0, 200)}..."`);
        console.log(`🎯 Artifacts count: ${result.artifacts?.length || 0}`);
        
        // Check if response contains expected content
        let hasExpectedContent = true;
        if (testCase.shouldContain) {
          for (const expectedText of testCase.shouldContain) {
            if (!content.toLowerCase().includes(expectedText.toLowerCase())) {
              console.log(`❌ Missing expected content: "${expectedText}"`);
              hasExpectedContent = false;
            }
          }
        }
        
        // Check if it incorrectly routed to wrong intent (for regression tests)
        let hasWrongRouting = false;
        if (testCase.shouldNotRoute) {
          const wrongContent = testCase.shouldNotRoute === 'gamma_ray_visualization' ? 
            ['Gamma Ray Distribution', 'Histogram generated', 'Depth coverage plot'] : [];
          
          for (const wrongText of wrongContent) {
            if (content.includes(wrongText)) {
              console.log(`❌ Incorrectly routed to ${testCase.shouldNotRoute}: found "${wrongText}"`);
              hasWrongRouting = true;
            }
          }
        }
        
        // Overall test evaluation
        if (hasExpectedContent && !hasWrongRouting) {
          console.log('✅ PASS - Correct intent routing and content');
          passedTests++;
        } else if (hasExpectedContent) {
          console.log('⚠️ PARTIAL - Expected content found but may have routing issues');
        } else {
          console.log('❌ FAIL - Missing expected content or wrong routing');
        }
        
      } else {
        console.log('❌ No response received from agent');
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
      console.log('---\n');
    }
  }
  
  console.log('🧪 === WORKFLOW REGRESSION FIX TEST COMPLETE ===');
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 SUCCESS - All workflows routing correctly!');
  } else if (passedTests >= totalTests - 1) {
    console.log('⚠️ MOSTLY SUCCESSFUL - Minor issues may remain');
  } else {
    console.log('❌ ISSUES DETECTED - Review routing logic');
  }
}

// Run the test
testWorkflowRegression()
  .then(() => {
    console.log('\n🎉 Regression Test Complete!');
    console.log('💡 Summary:');
    console.log('  - Production Well Data Discovery should route to well_data_discovery');
    console.log('  - Multi-Well Correlation should route to multi_well_correlation');  
    console.log('  - Gamma ray requests should still work correctly');
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
  });
