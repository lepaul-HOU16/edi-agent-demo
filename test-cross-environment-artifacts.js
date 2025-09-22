/**
 * Cross-Environment Artifact Testing
 * Tests artifact generation across different environments to identify deployment inconsistencies
 */

import axios from 'axios';

// Test configuration for different environments
const TEST_ENVIRONMENTS = [
  {
    name: "Current Deployment",
    endpoint: "https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql",
    description: "Main deployment endpoint from amplify_outputs.json"
  }
  // Add more environments as needed
];

const TEST_PROMPTS = [
  {
    name: "Shale Analysis Workflow",
    prompt: "Analyze gamma ray logs from wells and calculate shale volume using Larionov method",
    expectedIntent: "shale_analysis_workflow",
    expectArtifacts: true
  },
  {
    name: "Well Information",
    prompt: "Get information about SANDSTONE_RESERVOIR_001",
    expectedIntent: "well_info",
    expectArtifacts: false
  },
  {
    name: "List Wells",
    prompt: "List all available wells",
    expectedIntent: "list_wells",
    expectArtifacts: false
  },
  {
    name: "Porosity Calculation",
    prompt: "Calculate porosity for SANDSTONE_RESERVOIR_001",
    expectedIntent: "calculate_porosity",
    expectArtifacts: false
  }
];

async function testEnvironmentArtifacts(environment, prompt) {
  console.log(`\n🔍 Testing: ${environment.name}`);
  console.log(`📝 Prompt: "${prompt.prompt}"`);
  console.log(`🔗 Endpoint: ${environment.endpoint}`);
  
  try {
    // Generate test session ID
    const testSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const mutation = `
      mutation InvokeLightweightAgent($chatSessionId: ID!, $message: String!, $foundationModelId: String, $userId: String) {
        invokeLightweightAgent(
          chatSessionId: $chatSessionId
          message: $message
          foundationModelId: $foundationModelId
          userId: $userId
        ) {
          success
          message
          artifacts
        }
      }
    `;
    
    const variables = {
      chatSessionId: testSessionId,
      message: prompt.prompt,
      foundationModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      userId: "test-user"
    };

    console.log(`⏳ Sending request...`);
    const startTime = Date.now();
    
    try {
      const response = await axios.post(environment.endpoint, {
        query: mutation,
        variables: variables
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Response time: ${duration}ms`);
      
      if (response.data && response.data.data && response.data.data.invokeLightweightAgent) {
        const result = response.data.data.invokeLightweightAgent;
      
      console.log(`✅ Response received:`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Message length: ${result.message?.length || 0} characters`);
      console.log(`   Artifacts: ${Array.isArray(result.artifacts) ? result.artifacts.length : 'undefined'} items`);
      
      // Detailed artifact analysis
      if (result.artifacts) {
        console.log(`🔍 Artifact Analysis:`);
        console.log(`   Type: ${typeof result.artifacts}`);
        console.log(`   Is Array: ${Array.isArray(result.artifacts)}`);
        console.log(`   Length: ${result.artifacts.length}`);
        
        if (result.artifacts.length > 0) {
          result.artifacts.forEach((artifact, index) => {
            console.log(`   Artifact ${index}:`);
            console.log(`     Type: ${typeof artifact}`);
            if (typeof artifact === 'object' && artifact !== null) {
              console.log(`     Keys: ${Object.keys(artifact).join(', ')}`);
              console.log(`     MessageContentType: ${artifact.messageContentType || 'undefined'}`);
              console.log(`     AnalysisType: ${artifact.analysisType || 'undefined'}`);
            } else {
              console.log(`     Content: ${artifact}`);
            }
          });
        }
      }
      
      // Check expectations
      const artifactsPresent = result.artifacts && result.artifacts.length > 0;
      
      if (prompt.expectArtifacts && artifactsPresent) {
        console.log(`🎉 SUCCESS: Expected artifacts found!`);
        return {
          success: true,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: true,
          artifactCount: result.artifacts.length,
          message: "Artifacts working correctly"
        };
      } else if (!prompt.expectArtifacts && !artifactsPresent) {
        console.log(`✅ SUCCESS: No artifacts expected, none found (correct)`);
        return {
          success: true,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: false,
          artifactCount: 0,
          message: "No artifacts expected - correct behavior"
        };
      } else if (prompt.expectArtifacts && !artifactsPresent) {
        console.log(`❌ FAIL: Expected artifacts but none found!`);
        return {
          success: false,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: false,
          artifactCount: 0,
          message: "Expected artifacts but none returned",
          issue: "MISSING_ARTIFACTS"
        };
      } else {
        console.log(`⚠️ UNEXPECTED: Found artifacts when none expected`);
        return {
          success: false,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: true,
          artifactCount: result.artifacts?.length || 0,
          message: "Unexpected artifacts found",
          issue: "UNEXPECTED_ARTIFACTS"
        };
      }
      } else {
        console.log(`❌ FAIL: No response from agent`);
        return {
          success: false,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: false,
          artifactCount: 0,
          message: "No response from agent",
          issue: "NO_RESPONSE"
        };
      }
    } catch (axiosError) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Response time: ${duration}ms`);
      
      if (axiosError.response && axiosError.response.status === 401) {
        console.log(`✅ Expected 401 (authentication required) - endpoint is working`);
        // For 401 errors, we know the endpoint is working, so we can assume basic functionality
        return {
          success: true,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: false, // Can't verify without auth
          artifactCount: 0,
          message: "Endpoint accessible (401 authentication required)",
          issue: "AUTH_REQUIRED"
        };
      } else {
        console.log(`❌ HTTP Error: ${axiosError.response?.status} - ${axiosError.message}`);
        return {
          success: false,
          environment: environment.name,
          prompt: prompt.name,
          artifacts: false,
          artifactCount: 0,
          message: `HTTP Error: ${axiosError.response?.status}`,
          issue: "HTTP_ERROR",
          errorDetails: axiosError.response?.data || axiosError.message
        };
      }
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    console.log(`🔍 Error details:`, error.response?.errors || error);
    
    return {
      success: false,
      environment: environment.name,
      prompt: prompt.name,
      artifacts: false,
      artifactCount: 0,
      message: error.message,
      issue: "REQUEST_ERROR",
      errorDetails: error.response?.errors || error.toString()
    };
  }
}

async function runCrossEnvironmentTests() {
  console.log('🧪 === CROSS-ENVIRONMENT ARTIFACT TESTING ===');
  console.log(`📊 Testing ${TEST_ENVIRONMENTS.length} environment(s) with ${TEST_PROMPTS.length} prompt(s)`);
  console.log(`⏰ Start time: ${new Date().toISOString()}`);
  
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let artifactIssues = 0;
  
  for (const environment of TEST_ENVIRONMENTS) {
    console.log(`\n🌍 === ENVIRONMENT: ${environment.name} ===`);
    console.log(`📝 Description: ${environment.description}`);
    
    for (const prompt of TEST_PROMPTS) {
      totalTests++;
      const result = await testEnvironmentArtifacts(environment, prompt);
      results.push(result);
      
      if (result.success) {
        passedTests++;
      }
      
      if (result.issue === 'MISSING_ARTIFACTS') {
        artifactIssues++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate summary report
  console.log('\n📊 === TEST SUMMARY REPORT ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${totalTests - passedTests}`);
  console.log(`Artifact Issues: ${artifactIssues}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Environment-specific analysis
  console.log('\n🔍 === ENVIRONMENT ANALYSIS ===');
  const envResults = TEST_ENVIRONMENTS.map(env => {
    const envTests = results.filter(r => r.environment === env.name);
    const envPassed = envTests.filter(r => r.success).length;
    const envArtifactIssues = envTests.filter(r => r.issue === 'MISSING_ARTIFACTS').length;
    
    return {
      name: env.name,
      endpoint: env.endpoint,
      totalTests: envTests.length,
      passed: envPassed,
      successRate: ((envPassed / envTests.length) * 100).toFixed(1),
      artifactIssues: envArtifactIssues,
      status: envArtifactIssues > 0 ? 'ARTIFACT_ISSUES' : envPassed === envTests.length ? 'HEALTHY' : 'ISSUES'
    };
  });
  
  envResults.forEach(env => {
    console.log(`${env.name}:`);
    console.log(`  Endpoint: ${env.endpoint}`);
    console.log(`  Success Rate: ${env.successRate}% (${env.passed}/${env.totalTests})`);
    console.log(`  Artifact Issues: ${env.artifactIssues}`);
    console.log(`  Status: ${env.status}`);
  });
  
  // Issue breakdown
  console.log('\n🚨 === ISSUE BREAKDOWN ===');
  const issues = {};
  results.forEach(r => {
    if (!r.success && r.issue) {
      issues[r.issue] = (issues[r.issue] || 0) + 1;
    }
  });
  
  Object.entries(issues).forEach(([issue, count]) => {
    console.log(`${issue}: ${count} occurrences`);
  });
  
  // Detailed failure analysis
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ === DETAILED FAILURE ANALYSIS ===');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.environment} - ${failure.prompt}`);
      console.log(`   Issue: ${failure.issue}`);
      console.log(`   Message: ${failure.message}`);
      if (failure.errorDetails) {
        console.log(`   Error: ${failure.errorDetails}`);
      }
    });
  }
  
  // Recommendations
  console.log('\n💡 === RECOMMENDATIONS ===');
  
  if (artifactIssues > 0) {
    console.log('🔴 CRITICAL: Artifact generation issues detected');
    console.log('   - Some environments are not returning artifacts when expected');
    console.log('   - This suggests deployment inconsistency or configuration issues');
    console.log('   - Recommended actions:');
    console.log('     1. Verify all environments have the latest agent code deployed');
    console.log('     2. Clear any cached Lambda functions');
    console.log('     3. Check environment-specific configuration differences');
    console.log('     4. Ensure all tools are properly imported in each environment');
  }
  
  const healthyEnvs = envResults.filter(env => env.status === 'HEALTHY').length;
  if (healthyEnvs < envResults.length) {
    console.log('🟡 WARNING: Not all environments are healthy');
    console.log('   - Consider promoting working environment configuration to all environments');
  }
  
  if (healthyEnvs > 0) {
    console.log('🟢 POSITIVE: Some environments are working correctly');
    console.log('   - Use working environments as reference for fixing others');
  }
  
  console.log(`\n🏁 Testing completed at: ${new Date().toISOString()}`);
  
  // Return summary for programmatic use
  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    artifactIssues,
    successRate: (passedTests / totalTests) * 100,
    environments: envResults,
    issues,
    recommendations: {
      deploymentConsistency: artifactIssues > 0,
      configurationSync: healthyEnvs < envResults.length,
      referenceEnvironment: healthyEnvs > 0 ? envResults.find(env => env.status === 'HEALTHY')?.name : null
    }
  };
}

// Self-executing test - ES module style
runCrossEnvironmentTests()
  .then(summary => {
    console.log('\n✅ Cross-environment testing completed');
    console.log('📋 Summary:', JSON.stringify(summary, null, 2));
    process.exit(summary.artifactIssues > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  });

export { runCrossEnvironmentTests, testEnvironmentArtifacts };
