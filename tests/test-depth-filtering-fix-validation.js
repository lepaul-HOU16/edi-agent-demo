const { generateClient } = require("aws-amplify/data");
const { Amplify } = require("aws-amplify");
const config = require("./amplify_outputs.json");

// Configure Amplify
Amplify.configure(config);
const client = generateClient();

console.log('🧪 === DEPTH FILTERING FIX VALIDATION TEST ===');
console.log('📅 Testing enhanced depth filtering logic...\n');

async function testDepthFiltering() {
  const testQueries = [
    {
      query: "wells with depth greater than 3500m",
      expectedBehavior: "Should filter to only wells deeper than 3500m",
      minExpectedDepth: 3500
    },
    {
      query: "show me wells deeper than 4000m", 
      expectedBehavior: "Should filter to only wells deeper than 4000m",
      minExpectedDepth: 4000
    },
    {
      query: "find wells with depth > 3000m",
      expectedBehavior: "Should filter to only wells deeper than 3000m", 
      minExpectedDepth: 3000
    }
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const { query, expectedBehavior, minExpectedDepth } = testQueries[i];
    
    console.log(`\n🔍 TEST ${i + 1}: Depth Filtering`);
    console.log(`📝 Query: "${query}"`);
    console.log(`🎯 Expected: ${expectedBehavior}`);
    console.log(`📏 Minimum depth threshold: ${minExpectedDepth}m`);
    console.log('⏱️  Executing...\n');

    try {
      const startTime = Date.now();
      
      // Execute catalog search
      const response = await client.queries.catalogSearch({
        prompt: query
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(`⚡ Response time: ${executionTime}ms`);
      
      if (response.data) {
        const result = JSON.parse(response.data);
        console.log(`📊 Result metadata:`, {
          type: result.metadata?.type,
          queryType: result.metadata?.queryType,
          recordCount: result.metadata?.recordCount,
          source: result.metadata?.source,
          hasDepthFilter: !!result.metadata?.depthFilter
        });

        if (result.metadata?.depthFilter) {
          console.log(`🔧 Depth filter applied:`, result.metadata.depthFilter);
        }

        console.log(`\n📋 Wells found: ${result.features?.length || 0}`);
        
        if (result.features && result.features.length > 0) {
          console.log('\n🏔️  DEPTH ANALYSIS:');
          
          let passCount = 0;
          let failCount = 0;
          const depthIssues = [];

          result.features.forEach((well, index) => {
            const wellName = well.properties?.name || `Well-${index + 1}`;
            const depthStr = well.properties?.depth || 'Unknown';
            
            // Extract numeric depth value using same logic as backend
            const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
            const depthValue = depthMatch ? parseFloat(depthMatch[1]) : 0;
            
            const passesFilter = depthValue > minExpectedDepth;
            
            if (passesFilter) {
              passCount++;
              console.log(`  ✅ ${wellName}: ${depthStr} (${depthValue}m) - PASS`);
            } else {
              failCount++;
              console.log(`  ❌ ${wellName}: ${depthStr} (${depthValue}m) - FAIL (should be > ${minExpectedDepth}m)`);
              depthIssues.push({
                name: wellName,
                depthStr: depthStr,
                depthValue: depthValue,
                required: minExpectedDepth
              });
            }
          });

          console.log(`\n📈 FILTERING RESULTS:`);
          console.log(`  ✅ Wells passing filter: ${passCount}`);
          console.log(`  ❌ Wells failing filter: ${failCount}`);
          console.log(`  📊 Filter accuracy: ${passCount > 0 ? ((passCount / (passCount + failCount)) * 100).toFixed(1) : 0}%`);

          if (failCount === 0) {
            console.log(`\n🎉 SUCCESS: All wells meet the depth criteria!`);
          } else {
            console.log(`\n⚠️  ISSUES FOUND: ${failCount} wells don't meet depth criteria`);
            console.log('🔧 Problematic wells:', depthIssues);
          }

          // Check for thought steps
          if (result.thoughtSteps && result.thoughtSteps.length > 0) {
            console.log(`\n🧠 Chain of thought: ${result.thoughtSteps.length} steps generated`);
            result.thoughtSteps.forEach((step, idx) => {
              console.log(`  ${idx + 1}. ${step.title}: ${step.summary}`);
            });
          }

        } else {
          console.log(`⚠️  No wells found for this query`);
        }

      } else {
        console.log(`❌ No data returned from query`);
      }

    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
      console.error('Full error:', error);
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Test different depth parsing scenarios
async function testDepthParsing() {
  console.log('\n🧪 === DEPTH PARSING VALIDATION ===');
  
  const depthFormats = [
    "3500m (est.)",
    "4200m",
    "3850 m", 
    "2750m (est.)",
    "5100 meter",
    "Unknown"
  ];
  
  console.log('📏 Testing depth parsing with various formats:');
  
  depthFormats.forEach(depthStr => {
    // Simulate same parsing logic as backend
    const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
    const depthValue = depthMatch ? parseFloat(depthMatch[1]) : 0;
    
    console.log(`  "${depthStr}" → ${depthValue}m`);
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testDepthParsing();
    await testDepthFiltering();
    
    console.log('\n🏁 === TEST SUMMARY ===');
    console.log('✅ Depth filtering validation complete');
    console.log('🔧 Backend fixes applied:');
    console.log('   - Enhanced depth value parsing with regex matching');
    console.log('   - Applied filtering to both user wells and OSDU wells');
    console.log('   - Added comprehensive logging for debugging');
    console.log('   - Fixed horizontal scroll in Data Analysis & Visualization tab');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runAllTests();
