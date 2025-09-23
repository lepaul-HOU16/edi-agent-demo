const axios = require('axios');

async function testGammaRayIntentDetection() {
  console.log('🧪 === GAMMA RAY INTENT DETECTION FIX TEST ===');
  console.log('📦 Testing deployment with gamma ray visualization fix');
  console.log('🔗 Endpoint: https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql');
  
  // Test cases that should now route to gamma_ray_visualization instead of porosity_analysis
  const testCases = [
    {
      name: 'Depth Coverage Plot',
      message: 'generate a depth coverage plot for gamma ray in wells 001-005',
      expectedBehavior: 'Should route to gamma ray visualization, NOT porosity analysis',
      shouldNotContain: ['porosity', 'density', 'neutron']
    },
    {
      name: 'Gamma Ray Histogram',
      message: 'give me a histogram of gamma ray distribution for well 001',
      expectedBehavior: 'Should route to gamma ray visualization, NOT return "No response generated"',
      shouldNotContain: ['No response generated', 'porosity']
    },
    {
      name: 'Plot Gamma Ray Wells Range',
      message: 'plot gamma ray for wells 001 to 005',
      expectedBehavior: 'Should route to gamma ray visualization with well range',
      shouldNotContain: ['porosity', 'density', 'neutron']
    },
    {
      name: 'Show Gamma Ray Plot',
      message: 'show me gamma ray plot for well 002',
      expectedBehavior: 'Should route to gamma ray visualization for single well',
      shouldNotContain: ['No response generated', 'porosity']
    },
    {
      name: 'Visualize Gamma Ray',
      message: 'visualize gamma ray data for well 001',
      expectedBehavior: 'Should route to gamma ray visualization',
      shouldNotContain: ['No response generated', 'porosity']
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
  
  console.log('\n🔄 Testing gamma ray visualization requests...\n');
  
  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: ${testCase.name}`);
      console.log(`💬 Message: "${testCase.message}"`);
      console.log(`🎯 Expected: ${testCase.expectedBehavior}`);
      
      const response = await axios.post('https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql', {
        query: mutation,
        variables: {
          input: {
            chatSessionId: 'gamma-ray-test-' + Date.now(),
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
        console.log(`📤 Content preview: "${result.content?.substring(0, 150)}..."`);
        console.log(`🎯 Artifacts count: ${result.artifacts?.length || 0}`);
        
        // Check for problematic responses
        let hasIssues = false;
        const content = result.content || '';
        
        // Check if it still routes to wrong intent
        const isPorosityResponse = content.toLowerCase().includes('porosity') && 
                                 (content.toLowerCase().includes('density') || content.toLowerCase().includes('neutron'));
        
        const isNoResponseError = content.includes('No response generated');
        
        const containsProblematicContent = testCase.shouldNotContain.some(term => 
          content.toLowerCase().includes(term.toLowerCase()));
        
        if (isPorosityResponse) {
          console.log('❌ ISSUE: Still routing to porosity analysis instead of gamma ray visualization');
          hasIssues = true;
        }
        
        if (isNoResponseError) {
          console.log('❌ ISSUE: Still returning "No response generated" error');
          hasIssues = true;
        }
        
        if (containsProblematicContent) {
          console.log('❌ ISSUE: Response contains problematic content');
          hasIssues = true;
        }
        
        // Check for gamma ray related content
        const hasGammaRayContent = content.toLowerCase().includes('gamma ray') || 
                                  content.toLowerCase().includes('gamma-ray') ||
                                  content.toLowerCase().includes('histogram') ||
                                  content.toLowerCase().includes('depth coverage') ||
                                  content.toLowerCase().includes('visualization');
        
        if (hasGammaRayContent && !hasIssues) {
          console.log('✅ PASS - Correctly routing to gamma ray visualization');
        } else if (!hasIssues) {
          console.log('⚠️ PARTIAL - Response doesn\'t contain expected gamma ray content but no major issues');
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
  
  console.log('🧪 === GAMMA RAY INTENT DETECTION FIX TEST COMPLETE ===');
}

// Test a porosity request to ensure it still works correctly
async function testPorosityStillWorks() {
  console.log('\n🧮 === POROSITY ANALYSIS CONTROL TEST ===');
  console.log('📝 Ensuring porosity requests still work correctly...');
  
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
  
  try {
    const testMessage = 'extract density and neutron log data from wells and calculate porosity create density-neutron crossplot identify lithology';
    console.log(`💬 Message: "${testMessage}"`);
    
    const response = await axios.post('https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql', {
      query: mutation,
      variables: {
        input: {
          chatSessionId: 'porosity-control-test-' + Date.now(),
          content: testMessage,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result = response.data.data?.sendChatMessage;
    
    if (result) {
      const content = result.content || '';
      const isPorosityResponse = content.toLowerCase().includes('porosity') && 
                               (content.toLowerCase().includes('density') || content.toLowerCase().includes('neutron'));
      
      if (isPorosityResponse) {
        console.log('✅ PASS - Porosity analysis requests still work correctly');
      } else {
        console.log('❌ ISSUE - Porosity analysis requests may be broken');
      }
      
      console.log(`📤 Content preview: "${content.substring(0, 150)}..."`);
    }
    
  } catch (error) {
    console.error('❌ Error testing porosity control:', error.message);
  }
  
  console.log('🧮 === POROSITY ANALYSIS CONTROL TEST COMPLETE ===');
}

// Run the tests
async function runTests() {
  try {
    await testGammaRayIntentDetection();
    await testPorosityStillWorks();
    
    console.log('\n🎉 Gamma Ray Intent Detection Fix Test Complete!');
    console.log('💡 Summary:');
    console.log('  - Gamma ray visualization requests should no longer route to porosity analysis');
    console.log('  - Gamma ray histogram requests should no longer return "No response generated"');
    console.log('  - Porosity analysis requests should still work correctly');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runTests();
