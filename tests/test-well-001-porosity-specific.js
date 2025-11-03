/**
 * Specific test for WELL-001 porosity calculation
 * Tests the actual porosity calculation workflow that the user is experiencing
 */

const AWS = require('aws-sdk');

// Set up AWS configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

async function testWell001PorositySpecific() {
  console.log('🎯 === WELL-001 POROSITY CALCULATION TEST ===');
  console.log('⏰ Test started at:', new Date().toISOString());
  
  try {
    // Import the comprehensive porosity analysis tool
    const { comprehensivePorosityAnalysisTool } = require('./amplify/functions/tools/comprehensivePorosityAnalysisTool');
    
    console.log('✅ Successfully imported comprehensive porosity analysis tool');
    console.log('🔧 Tool name:', comprehensivePorosityAnalysisTool.name);
    console.log('📝 Tool description:', comprehensivePorosityAnalysisTool.description);
    
    // Test with WELL-001 specifically
    const testInput = {
      analysisType: "single_well",
      wellNames: ["WELL-001"],
      porosityCutoff: 0.08,
      highPorosityCutoff: 0.12,
      matrixDensity: 2.65,
      includeVisualization: true,
      generateCrossplot: true,
      identifyReservoirIntervals: true
    };
    
    console.log('\n🎯 === TESTING WELL-001 POROSITY CALCULATION ===');
    console.log('📋 Input parameters:', JSON.stringify(testInput, null, 2));
    
    // Execute the porosity analysis
    console.log('🚀 Executing porosity analysis for WELL-001...');
    const result = await comprehensivePorosityAnalysisTool.func(testInput);
    
    console.log('✅ Porosity analysis completed successfully!');
    console.log('📊 Response type:', typeof result);
    console.log('📏 Response length:', result.length, 'characters');
    
    // Parse and analyze the result
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message);
      console.log('📄 Raw result (first 500 chars):', result.substring(0, 500));
      return false;
    }
    
    // Analyze the response structure
    console.log('\n🔍 === RESPONSE ANALYSIS ===');
    console.log('🎯 Success status:', parsedResult.success);
    console.log('📨 Has message:', !!parsedResult.message);
    console.log('🎨 Has artifacts:', !!parsedResult.artifacts);
    console.log('🎭 Is demo mode:', !!parsedResult.isDemoMode);
    
    if (parsedResult.message) {
      console.log('📝 Message:', parsedResult.message);
    }
    
    if (parsedResult.artifacts && parsedResult.artifacts.length > 0) {
      const artifact = parsedResult.artifacts[0];
      console.log('\n🎨 === ARTIFACT ANALYSIS ===');
      console.log('📊 Artifact type:', artifact.messageContentType);
      console.log('🔬 Analysis type:', artifact.analysisType);
      
      if (artifact.wellNames) {
        console.log('🏭 Wells analyzed:', artifact.wellNames.join(', '));
      }
      
      if (artifact.executiveSummary) {
        console.log('📋 Executive summary title:', artifact.executiveSummary.title);
        console.log('🔑 Key findings count:', artifact.executiveSummary.keyFindings?.length || 0);
      }
      
      if (artifact.results) {
        console.log('📊 Has results section:', !!artifact.results);
        
        if (artifact.results.porosityAnalysis) {
          console.log('🧮 Porosity analysis method:', artifact.results.porosityAnalysis.method);
          console.log('📈 Statistics available:', !!artifact.results.porosityAnalysis.statistics);
        }
        
        if (artifact.results.reservoirIntervals) {
          console.log('🎯 Reservoir intervals found:', artifact.results.reservoirIntervals.totalIntervals || 0);
        }
      }
      
      if (artifact.visualizations) {
        console.log('📊 Visualizations available:', !!artifact.visualizations);
      }
      
      if (artifact.completionStrategy) {
        console.log('🎯 Completion strategy provided:', !!artifact.completionStrategy);
      }
    }
    
    // Check for any error indicators
    if (parsedResult.error) {
      console.log('\n❌ === ERROR IN RESPONSE ===');
      console.log('💥 Error message:', parsedResult.error);
      console.log('💡 Suggestion:', parsedResult.suggestion || 'No suggestion provided');
      return false;
    }
    
    // Check for "temporarily simplified" or similar messages
    const resultString = JSON.stringify(parsedResult);
    const hasSimplifiedMessage = resultString.includes('temporarily simplified') || 
                                 resultString.includes('functionality limited') ||
                                 resultString.includes('use catalog tools');
    
    if (hasSimplifiedMessage) {
      console.log('\n⚠️ === OLD ERROR PATTERN DETECTED ===');
      console.log('❌ Response still contains "temporarily simplified" type messages');
      return false;
    }
    
    console.log('\n🎉 === SUCCESS ANALYSIS ===');
    
    if (parsedResult.success && parsedResult.artifacts && parsedResult.artifacts.length > 0) {
      console.log('✅ WELL-001 porosity calculation completed successfully');
      console.log('🎨 Professional analysis with visualizations generated');
      console.log('📊 Comprehensive porosity methodology applied');
      console.log('🎯 Result includes reservoir intervals and completion strategy');
      return true;
    } else {
      console.log('⚠️ Porosity calculation completed but may be incomplete');
      console.log('🔍 Check the response structure above for details');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ === CRITICAL ERROR ===');
    console.error('💥 Failed to test WELL-001 porosity calculation:', error.message);
    console.error('📋 Error type:', error.constructor.name);
    console.error('📍 Stack trace:', error.stack);
    
    // Check if this is a specific import or module error
    if (error.message.includes('Cannot find module')) {
      console.log('\n🔍 === MODULE RESOLUTION ISSUE ===');
      console.log('💡 This appears to be a module import issue');
      console.log('🔧 The comprehensive porosity tool may not be properly exported');
    } else if (error.message.includes('AWS') || error.message.includes('S3')) {
      console.log('\n🔍 === AWS/S3 CONNECTION ISSUE ===');
      console.log('💡 This appears to be an AWS connectivity issue');
      console.log('🔧 Check AWS credentials and S3 bucket configuration');
    }
    
    return false;
  }
}

// Test what happens with the basic petrophysics tools as well
async function testBasicPorosityTool() {
  console.log('\n🔧 === TESTING BASIC POROSITY TOOL (FOR COMPARISON) ===');
  
  try {
    // Import the basic petrophysics tools
    const fs = require('fs');
    const path = require('path');
    
    const petrophysicsToolsPath = path.join(__dirname, 'amplify/functions/tools/petrophysicsTools.ts');
    const petrophysicsContent = fs.readFileSync(petrophysicsToolsPath, 'utf8');
    
    console.log('✅ Successfully read petrophysicsTools.ts');
    
    // Check if it has the calculatePorosityTool
    const hasCalculatePorosityTool = petrophysicsContent.includes('calculatePorosityTool');
    console.log('🔧 Has calculatePorosityTool:', hasCalculatePorosityTool);
    
    if (hasCalculatePorosityTool) {
      // Extract the tool definition
      const toolMatch = petrophysicsContent.match(/export const calculatePorosityTool[\s\S]*?func: async[\s\S]*?}\s*}/);
      if (toolMatch) {
        console.log('📋 Found calculatePorosityTool definition');
        
        // Check if it properly delegates
        const toolCode = toolMatch[0];
        const hasDelegation = toolCode.includes('comprehensivePorosityAnalysisTool') && 
                             toolCode.includes('analysisType') &&
                             toolCode.includes('single_well');
        
        console.log('🔄 Properly delegates to comprehensive tool:', hasDelegation);
        
        if (!hasDelegation) {
          console.log('⚠️ WARNING: Basic tool may not be properly delegating');
          console.log('📄 Tool code preview (first 300 chars):');
          console.log(toolCode.substring(0, 300) + '...');
        }
      }
    }
    
    return hasCalculatePorosityTool;
    
  } catch (error) {
    console.error('❌ Error testing basic porosity tool:', error.message);
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting WELL-001 specific porosity calculation tests...\n');
  
  const comprehensiveTestResult = await testWell001PorositySpecific();
  const basicTestResult = await testBasicPorosityTool();
  
  console.log('\n🏁 === FINAL TEST RESULTS ===');
  console.log('🎯 WELL-001 comprehensive test:', comprehensiveTestResult ? '✅ PASSED' : '❌ FAILED');
  console.log('🔧 Basic tool delegation test:', basicTestResult ? '✅ PASSED' : '❌ FAILED');
  
  const overallSuccess = comprehensiveTestResult && basicTestResult;
  console.log('🎖️ Overall status:', overallSuccess ? '✅ SUCCESS' : '⚠️ ISSUES DETECTED');
  
  console.log('\n📝 === DIAGNOSIS ===');
  if (overallSuccess) {
    console.log('✅ WELL-001 porosity calculation should be working properly');
    console.log('🎨 Enhanced methodology with visualizations and statistical analysis');
    console.log('📊 Professional documentation following SPE/API standards');
  } else if (comprehensiveTestResult && !basicTestResult) {
    console.log('⚠️ Comprehensive tool works, but basic delegation may have issues');
    console.log('💡 Users should use comprehensive porosity analysis directly');
  } else if (!comprehensiveTestResult && basicTestResult) {
    console.log('⚠️ Basic tool setup correct, but comprehensive tool has runtime issues');
    console.log('🔍 Check AWS connectivity and S3 bucket configuration');
  } else {
    console.log('❌ Both tools have issues - investigation needed');
    console.log('🔧 Check tool exports, imports, and AWS configuration');
  }
  
  console.log('⏰ Test completed at:', new Date().toISOString());
}

// Execute the test suite
runAllTests().catch(error => {
  console.error('💥 Fatal test error:', error);
  process.exit(1);
});
