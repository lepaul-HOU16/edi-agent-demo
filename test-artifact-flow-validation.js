/**
 * Test Artifact Flow Validation
 * Tests the complete artifact flow from agent to frontend
 */

const AWS = require('aws-sdk');

// Configure AWS
const lambda = new AWS.Lambda({
  region: 'us-east-1'
});

const FUNCTION_NAME = 'amplify-d1eeg2gu6ddc3z-ma-agentshandler4C551957-bOCHLJuO5Qie';

async function testArtifactFlow() {
  console.log('🧪 === ARTIFACT FLOW VALIDATION TEST ===');
  console.log('⏰ Test Start:', new Date().toISOString());
  
  const testCases = [
    {
      name: 'Comprehensive Shale Analysis (Field Overview)',
      message: 'analyze gamma ray logs for wells and calculate shale volume using larionov method with engaging visualizations',
      expectedArtifactType: 'comprehensive_shale_analysis'
    },
    {
      name: 'Comprehensive Shale Analysis (Specific Pattern)',
      message: 'engaging visualizations for gamma ray shale analysis',
      expectedArtifactType: 'comprehensive_shale_analysis'
    },
    {
      name: 'List Wells (Should not have artifacts)',
      message: 'list wells',
      expectedArtifactType: null
    }
  ];

  let testResults = [];

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    
    try {
      const event = {
        arguments: {
          message: testCase.message,
          foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      console.log('🚀 Invoking Lambda function...');
      const startTime = Date.now();

      const response = await lambda.invoke({
        FunctionName: FUNCTION_NAME,
        Payload: JSON.stringify(event)
      }).promise();

      const duration = Date.now() - startTime;
      const result = JSON.parse(response.Payload);

      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`✅ Function Success: ${result.success}`);
      
      if (result.success) {
        console.log(`📝 Message Length: ${result.message?.length || 0} chars`);
        console.log(`📦 Artifacts Count: ${result.artifacts?.length || 0}`);
        
        if (result.artifacts && result.artifacts.length > 0) {
          console.log('🔍 Artifact Analysis:');
          result.artifacts.forEach((artifact, i) => {
            console.log(`  Artifact ${i + 1}:`);
            console.log(`    Type: ${artifact.messageContentType || 'unknown'}`);
            console.log(`    Analysis Type: ${artifact.analysisType || 'N/A'}`);
            console.log(`    Has Executive Summary: ${!!artifact.executiveSummary}`);
            console.log(`    Has Results: ${!!artifact.results}`);
            console.log(`    Keys: ${Object.keys(artifact).join(', ')}`);
          });

          // Validate expected artifact type
          if (testCase.expectedArtifactType) {
            const hasExpectedType = result.artifacts.some(
              artifact => artifact.messageContentType === testCase.expectedArtifactType
            );
            
            if (hasExpectedType) {
              console.log('✅ Expected artifact type found');
            } else {
              console.log(`❌ Expected artifact type '${testCase.expectedArtifactType}' not found`);
              console.log(`   Found types: ${result.artifacts.map(a => a.messageContentType).join(', ')}`);
            }
          }
        } else if (testCase.expectedArtifactType) {
          console.log('❌ Expected artifacts but none found');
        } else {
          console.log('✅ No artifacts expected and none found');
        }

        testResults.push({
          testCase: testCase.name,
          success: true,
          duration,
          artifactCount: result.artifacts?.length || 0,
          hasExpectedArtifacts: testCase.expectedArtifactType ? 
            result.artifacts?.some(a => a.messageContentType === testCase.expectedArtifactType) : 
            (result.artifacts?.length || 0) === 0,
          message: result.message?.substring(0, 100) + '...'
        });
      } else {
        console.log(`❌ Function Failed: ${result.message}`);
        testResults.push({
          testCase: testCase.name,
          success: false,
          error: result.message,
          duration
        });
      }

    } catch (error) {
      console.log(`💥 Test Error: ${error.message}`);
      testResults.push({
        testCase: testCase.name,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  // Print summary
  console.log('\n🏁 === TEST SUMMARY ===');
  console.log(`⏰ Test End: ${new Date().toISOString()}`);
  console.log(`📊 Total Tests: ${testResults.length}`);
  
  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);
  const testsWithCorrectArtifacts = testResults.filter(r => r.success && r.hasExpectedArtifacts);
  
  console.log(`✅ Successful: ${successfulTests.length}`);
  console.log(`❌ Failed: ${failedTests.length}`);
  console.log(`🎯 Correct Artifacts: ${testsWithCorrectArtifacts.length}`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  testResults.forEach((result, index) => {
    const status = result.success ? 
      (result.hasExpectedArtifacts ? '✅ PASS' : '⚠️ PARTIAL') : 
      '❌ FAIL';
    
    console.log(`${index + 1}. ${status} - ${result.testCase}`);
    if (result.success) {
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Artifacts: ${result.artifactCount}`);
      console.log(`   Expected Artifacts: ${result.hasExpectedArtifacts ? 'Yes' : 'No'}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Final assessment
  const overallSuccess = testResults.every(r => r.success && r.hasExpectedArtifacts);
  console.log(`\n🎯 Overall Test Result: ${overallSuccess ? '✅ ALL PASS' : '⚠️ ISSUES DETECTED'}`);

  if (overallSuccess) {
    console.log('🎉 Artifact flow is working correctly!');
  } else {
    console.log('🔧 Artifact flow needs attention. Check the issues above.');
  }
  
  console.log('🧪 === TEST COMPLETE ===');
  return overallSuccess;
}

// Enhanced logging for debugging
const originalConsoleLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString().substring(11, 23);
  originalConsoleLog(`[${timestamp}]`, ...args);
};

// Run the test
testArtifactFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.log('💥 Test Runner Error:', error);
    process.exit(1);
  });
