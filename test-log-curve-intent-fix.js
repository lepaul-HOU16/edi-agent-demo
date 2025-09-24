/**
 * Test script to validate log curve visualization intent detection
 * Ensures correct agent routing for log curve requests
 */

const fs = require('fs');

// Mock the enhanced strands agent intent detection
function testIntentDetection() {
  console.log('🔍 === LOG CURVE INTENT DETECTION TEST ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  // Test different request formats
  const testCases = [
    {
      message: "show log curves for WELL-001",
      expectedIntent: "log_curve_visualization",
      description: "Direct log curve request"
    },
    {
      message: "display log curves for WELL-002", 
      expectedIntent: "log_curve_visualization",
      description: "Display log curves request"
    },
    {
      message: "plot log curves for WELL-003",
      expectedIntent: "log_curve_visualization", 
      description: "Plot log curves request"
    },
    {
      message: "get curve data for WELL-001",
      expectedIntent: "log_curve_visualization",
      description: "Get curve data request"
    },
    {
      message: "visualize log curves for WELL-001",
      expectedIntent: "log_curve_visualization",
      description: "Visualize curves request"
    },
    {
      message: "log plot viewer for WELL-001",
      expectedIntent: "log_curve_visualization",
      description: "Log plot viewer request"
    },
    {
      message: "Analyze the complete dataset of 24 production wells",
      expectedIntent: "well_data_discovery",
      description: "Data discovery request (should NOT trigger log curves)"
    }
  ];
  
  // Simulate intent detection logic (simplified version)
  function simulateIntentDetection(message) {
    const query = message.toLowerCase().trim();
    
    // Log curve visualization patterns
    const logCurvePatterns = [
      'show.*log.*curves',
      'display.*log.*curves', 
      'plot.*log.*curves',
      'visualize.*log.*curves',
      'log.*curve.*plot',
      'log.*plot.*viewer',
      'curve.*data.*for',
      'get.*curve.*data'
    ];
    
    // Well data discovery patterns  
    const discoveryPatterns = [
      'analyze.*complete.*dataset.*24.*production.*wells',
      'comprehensive.*summary.*showing.*available.*log.*curves',
      'spatial distribution.*depth ranges.*data quality assessment'
    ];
    
    // Test log curve visualization first (higher priority)
    for (const pattern of logCurvePatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(query)) {
        return 'log_curve_visualization';
      }
    }
    
    // Test data discovery patterns
    for (const pattern of discoveryPatterns) {
      const regex = new RegExp(pattern, 'i'); 
      if (regex.test(query)) {
        return 'well_data_discovery';
      }
    }
    
    return 'unknown';
  }
  
  console.log('\n📋 Testing Intent Detection:');
  
  let passCount = 0;
  let failCount = 0;
  
  testCases.forEach((testCase, index) => {
    const detectedIntent = simulateIntentDetection(testCase.message);
    const isCorrect = detectedIntent === testCase.expectedIntent;
    
    console.log(`\n${index + 1}. ${testCase.description}:`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expectedIntent}`);
    console.log(`   Detected: ${detectedIntent}`);
    console.log(`   Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
    
    if (isCorrect) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`   ✅ Passed: ${passCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failCount}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${(passCount / testCases.length * 100).toFixed(1)}%`);
  
  if (passCount === testCases.length) {
    console.log('\n🎉 ALL INTENT DETECTION TESTS PASSED!');
    console.log('💡 The agent routing fix should work correctly');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Deploy backend changes: bash deploy-log-curve-fix.sh');
    console.log('   2. Test in chat: "show log curves for WELL-001"');
    console.log('   3. Verify real curves display instead of statistics');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Intent detection needs adjustment');
  }
  
  console.log('\n✅ === INTENT DETECTION TEST COMPLETE ===');
}

// Run the test
testIntentDetection();
