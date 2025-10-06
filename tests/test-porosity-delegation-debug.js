/**
 * Debug the exact porosity delegation issue
 * Test what's happening between calculatePorosityTool and comprehensivePorosityAnalysisTool
 */

async function debugPorosityDelegation() {
  console.log('🐛 === POROSITY DELEGATION DEBUG ===');
  console.log('⏰ Test started at:', new Date().toISOString());
  console.log('🎯 Testing: calculatePorosityTool -> comprehensivePorosityAnalysisTool delegation');
  
  try {
    // Test the basic calculatePorosityTool (the one that delegates)
    const { calculatePorosityTool } = require('./amplify/functions/tools/petrophysicsTools');
    
    console.log('✅ Successfully imported calculatePorosityTool');
    console.log('🔧 Tool name:', calculatePorosityTool.name);
    
    // Test input that matches the user's failing prompt
    const testInput = {
      wellName: "WELL-001", // The user is using WELL-001
      method: "density" // Using density method
    };
    
    console.log('\n🎯 === TESTING DELEGATION ===');
    console.log('📋 Input parameters:', JSON.stringify(testInput, null, 2));
    
    // Execute the delegation
    console.log('🚀 Executing calculatePorosityTool (delegation wrapper)...');
    const result = await calculatePorosityTool.func(testInput);
    
    console.log('✅ Delegation execution completed!');
    console.log('📊 Response type:', typeof result);
    console.log('📏 Response length:', result.length, 'characters');
    
    // Parse and analyze the result
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
      console.log('✅ Successfully parsed delegation result');
    } catch (parseError) {
      console.log('❌ Failed to parse delegation result:', parseError.message);
      console.log('📄 Raw result (first 500 chars):', result.substring(0, 500));
      return false;
    }
    
    // Analyze the response structure
    console.log('\n🔍 === DELEGATION RESULT ANALYSIS ===');
    console.log('🎯 Success status:', parsedResult.success);
    console.log('📨 Has message:', !!parsedResult.message);
    console.log('🎨 Has artifacts:', !!parsedResult.artifacts);
    console.log('📊 Has result field:', !!parsedResult.result);
    console.log('🎭 Is demo mode:', !!parsedResult.isDemoMode);
    console.log('❌ Has error field:', !!parsedResult.error);
    console.log('🔧 Error type:', parsedResult.errorType);
    console.log('⚙️ Operation:', parsedResult.operation);
    
    if (parsedResult.message) {
      console.log('📝 Message content:', parsedResult.message);
    }
    
    if (parsedResult.error) {
      console.log('💥 Error content:', parsedResult.error);
    }
    
    // Check if this matches the user's exact error
    const matchesUserError = parsedResult.success === false && 
                            parsedResult.operation === "calculate_porosity" &&
                            parsedResult.errorType === "calculation_failed" &&
                            parsedResult.message && 
                            parsedResult.message.includes("Comprehensive porosity analysis completed successfully");
    
    console.log('\n🔍 === ERROR PATTERN ANALYSIS ===');
    console.log('🎯 Matches user error pattern:', matchesUserError);
    
    if (matchesUserError) {
      console.log('🎉 REPRODUCED USER ERROR! This is the exact same issue.');
      console.log('💡 The problem is that the success message is being wrapped in an error response');
      console.log('🔍 This suggests the delegation is working but error handling is wrong');
    }
    
    // Examine the artifacts if they exist
    if (parsedResult.artifacts && Array.isArray(parsedResult.artifacts)) {
      console.log('\n🎨 === ARTIFACTS ANALYSIS ===');
      console.log('📊 Artifacts count:', parsedResult.artifacts.length);
      
      parsedResult.artifacts.forEach((artifact, index) => {
        console.log(`📋 Artifact ${index}:`, {
          type: typeof artifact,
          isObject: typeof artifact === 'object',
          hasMessageContentType: !!(artifact && artifact.messageContentType),
          messageContentType: artifact?.messageContentType
        });
      });
      
      // Check if the first artifact has the right structure for porosity analysis
      const firstArtifact = parsedResult.artifacts[0];
      if (firstArtifact && firstArtifact.messageContentType === 'comprehensive_porosity_analysis') {
        console.log('✅ First artifact is valid porosity analysis data!');
        console.log('🎯 This should render as ComprehensivePorosityAnalysisComponent');
      }
    }
    
    // Check the result field as well
    if (parsedResult.result) {
      console.log('\n📊 === RESULT FIELD ANALYSIS ===');
      console.log('📋 Result type:', typeof parsedResult.result);
      if (typeof parsedResult.result === 'object') {
        console.log('🔑 Result keys:', Object.keys(parsedResult.result));
        console.log('📊 Has messageContentType:', !!parsedResult.result.messageContentType);
      }
    }
    
    console.log('\n🔧 === DIAGNOSIS ===');
    if (parsedResult.success === false) {
      console.log('❌ ISSUE FOUND: Response shows success: false');
      
      if (parsedResult.message && parsedResult.message.includes("completed successfully")) {
        console.log('💡 CONTRADICTION: Message indicates success but success field is false');
        console.log('🔧 FIX NEEDED: The delegation is working but being wrapped in error format incorrectly');
      }
      
      if (parsedResult.errorType === "calculation_failed") {
        console.log('💡 ERROR TYPE: Shows as calculation_failed');
        console.log('🔧 This suggests the comprehensive tool might be returning an error that gets misinterpreted');
      }
    } else {
      console.log('✅ SUCCESS: Response shows success: true - delegation working correctly');
    }
    
    return {
      success: parsedResult.success,
      matchesUserError,
      hasArtifacts: !!parsedResult.artifacts,
      hasResult: !!parsedResult.result,
      messageContent: parsedResult.message
    };
    
  } catch (error) {
    console.error('\n❌ === DELEGATION DEBUG ERROR ===');
    console.error('💥 Failed to debug delegation:', error.message);
    console.error('📋 Stack trace:', error.stack);
    return false;
  }
}

// Test the comprehensive porosity tool directly to see if it's working
async function testComprehensiveToolDirect() {
  console.log('\n🔬 === DIRECT COMPREHENSIVE TOOL TEST ===');
  
  try {
    const { comprehensivePorosityAnalysisTool } = require('./amplify/functions/tools/comprehensivePorosityAnalysisTool');
    
    console.log('✅ Successfully imported comprehensive tool directly');
    
    const testInput = {
      analysisType: "single_well",
      wellNames: ["WELL-001"],
      includeVisualization: true,
      generateCrossplot: true,
      identifyReservoirIntervals: true
    };
    
    console.log('🚀 Testing comprehensive tool directly...');
    const result = await comprehensivePorosityAnalysisTool.func(testInput);
    
    console.log('✅ Direct comprehensive tool test complete');
    console.log('📊 Result type:', typeof result);
    console.log('📏 Result length:', result.length);
    
    // Parse the result
    const parsed = JSON.parse(result);
    console.log('🎯 Direct tool success status:', parsed.success);
    console.log('📨 Direct tool message:', parsed.message);
    console.log('🎨 Direct tool has artifacts:', !!parsed.artifacts);
    
    return {
      success: parsed.success,
      hasArtifacts: !!parsed.artifacts,
      messageContent: parsed.message
    };
    
  } catch (error) {
    console.error('❌ Direct comprehensive tool test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run all debug tests
async function runPorosityDelegationDebug() {
  console.log('🚀 Starting comprehensive porosity delegation debugging...\n');
  
  const delegationResult = await debugPorosityDelegation();
  const directResult = await testComprehensiveToolDirect();
  
  console.log('\n🏁 === DEBUGGING RESULTS ===');
  console.log('🔧 Delegation test result:', delegationResult);
  console.log('🔬 Direct tool test result:', directResult);
  
  console.log('\n📋 === PROBLEM DIAGNOSIS ===');
  
  if (directResult && directResult.success && delegationResult && !delegationResult.success) {
    console.log('🎯 ISSUE IDENTIFIED: Direct tool works but delegation fails');
    console.log('💡 The comprehensive tool is working correctly');
    console.log('🔧 The issue is in the delegation wrapper (calculatePorosityTool)');
    console.log('⚠️ The delegation wrapper is incorrectly handling the successful response');
  } else if (directResult && !directResult.success) {
    console.log('🎯 ISSUE IDENTIFIED: Comprehensive tool itself is failing');
    console.log('💡 The delegation is working but the underlying tool has issues');
    console.log('🔧 Need to fix the comprehensive porosity analysis tool');
  } else if (delegationResult && delegationResult.success) {
    console.log('🎯 DELEGATION WORKING: Both tools are working correctly');
    console.log('💡 The issue might be in the frontend routing or display');
    console.log('🔧 Check the ChatMessage.tsx routing for calculate_porosity');
  } else {
    console.log('🎯 MULTIPLE ISSUES: Both tools have problems');
    console.log('💡 Need comprehensive debugging of the entire chain');
  }
  
  console.log('\n💡 === RECOMMENDED FIXES ===');
  if (delegationResult && delegationResult.matchesUserError) {
    console.log('1. Fix the delegation error handling logic');
    console.log('2. Ensure success responses are not wrapped as errors');
    console.log('3. Pass through the comprehensive tool response unchanged');
  }
  
  console.log('⏰ Debugging completed at:', new Date().toISOString());
}

// Execute the debugging
runPorosityDelegationDebug().catch(error => {
  console.error('💥 Fatal debugging error:', error);
  process.exit(1);
});
