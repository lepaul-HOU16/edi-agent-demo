const { generateClient } = require("aws-amplify/data");
const { Amplify } = require("aws-amplify");

// Import the amplify config
let outputs;
try {
  outputs = require('./amplify_outputs.json');
} catch (error) {
  console.error('amplify_outputs.json not found - check if Amplify is configured');
  process.exit(1);
}

// Configure Amplify
Amplify.configure(outputs);

async function testCatalogThoughtSteps() {
  console.log('🧪 Testing catalog search with thought steps...');
  
  try {
    const client = generateClient();
    
    // Test catalog search with simple query
    const testQuery = "my wells";
    console.log('🔍 Testing query:', testQuery);
    
    const response = await client.queries.catalogSearch({
      prompt: testQuery
    });
    
    console.log('✅ Raw catalog search response received');
    console.log('📦 Response type:', typeof response.data);
    
    if (response.data) {
      // Parse the response
      const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      
      console.log('🎯 THOUGHT STEPS TEST RESULTS:');
      console.log('- Has thoughtSteps property:', !!parsed.thoughtSteps);
      console.log('- ThoughtSteps type:', typeof parsed.thoughtSteps);
      console.log('- ThoughtSteps count:', parsed.thoughtSteps?.length || 0);
      
      if (parsed.thoughtSteps && parsed.thoughtSteps.length > 0) {
        console.log('🎉 THOUGHT STEPS FOUND!');
        console.log('📋 Thought step details:');
        parsed.thoughtSteps.forEach((step, index) => {
          console.log(`  Step ${index + 1}:`, {
            type: step.type,
            title: step.title,
            summary: step.summary?.substring(0, 50) + '...',
            status: step.status,
            confidence: step.confidence
          });
        });
        
        console.log('✅ CHAIN OF THOUGHT IS WORKING!');
        return true;
      } else {
        console.log('❌ NO THOUGHT STEPS IN RESPONSE');
        console.log('📋 Response structure:', Object.keys(parsed));
        return false;
      }
      
    } else {
      console.log('❌ No response data received');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing catalog thought steps:', error);
    return false;
  }
}

// Run the test
testCatalogThoughtSteps()
  .then(success => {
    if (success) {
      console.log('🎉 CATALOG CHAIN OF THOUGHT TEST: SUCCESS');
    } else {
      console.log('💥 CATALOG CHAIN OF THOUGHT TEST: FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 TEST CRASHED:', error);
    process.exit(1);
  });
