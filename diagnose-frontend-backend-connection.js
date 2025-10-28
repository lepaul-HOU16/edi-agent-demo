/**
 * Comprehensive Frontend-Backend Connection Diagnosis
 * Tests the entire flow from UI query to Lambda response
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });

// Test queries that should work
const testQueries = [
  {
    name: "Terrain Analysis",
    query: "analyze terrain at 35.067482, -101.395466",
    expectedIntent: "terrain_analysis",
    expectedArtifacts: 1
  },
  {
    name: "Layout Optimization", 
    query: "optimize layout at 35.067482, -101.395466",
    expectedIntent: "layout_optimization",
    expectedArtifacts: 1
  },
  {
    name: "Financial Analysis",
    query: "Perform financial analysis and ROI calculation",
    expectedIntent: "report_generation",
    expectedArtifacts: 1
  },
  {
    name: "Project Dashboard",
    query: "show project dashboard",
    expectedIntent: "project_dashboard",
    expectedArtifacts: 1
  }
];

async function testQuery(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`${'='.repeat(60)}`);
  
  const payload = {
    query: testCase.query,
    chatSessionId: `test-${Date.now()}`,
    requestId: `test-${Date.now()}`
  };
  
  try {
    const startTime = Date.now();
    const result = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE',
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse'
    }).promise();
    
    const duration = Date.now() - startTime;
    const response = JSON.parse(result.Payload);
    
    // Check response structure
    const hasBody = response && response.body;
    const body = hasBody ? response.body : response;
    
    console.log(`\n✅ Lambda Response Received (${duration}ms)`);
    console.log(`   Status Code: ${result.StatusCode}`);
    console.log(`   Has Body: ${hasBody}`);
    
    if (body) {
      console.log(`   Success: ${body.success}`);
      console.log(`   Message Length: ${body.message ? body.message.length : 0} chars`);
      console.log(`   Artifacts: ${body.artifacts ? body.artifacts.length : 0}`);
      console.log(`   Thought Steps: ${body.thoughtSteps ? body.thoughtSteps.length : 0}`);
      
      // Check intent detection
      if (body.thoughtSteps && body.thoughtSteps.length > 1) {
        const intentStep = body.thoughtSteps.find(s => s.action === 'Analyzing query');
        if (intentStep && intentStep.result) {
          const detectedIntent = intentStep.result.replace('Detected: ', '');
          const intentMatch = detectedIntent === testCase.expectedIntent;
          console.log(`   Detected Intent: ${detectedIntent} ${intentMatch ? '✅' : '❌ Expected: ' + testCase.expectedIntent}`);
        }
      }
      
      // Check artifacts
      if (body.artifacts && body.artifacts.length > 0) {
        console.log(`\n   📦 Artifacts:`);
        body.artifacts.forEach((artifact, i) => {
          console.log(`      ${i + 1}. Type: ${artifact.type}`);
          console.log(`         Has Data: ${!!artifact.data}`);
          console.log(`         Has Actions: ${artifact.actions ? artifact.actions.length : 0}`);
        });
        
        const artifactMatch = body.artifacts.length === testCase.expectedArtifacts;
        console.log(`   Artifact Count: ${artifactMatch ? '✅' : '❌ Expected: ' + testCase.expectedArtifacts}`);
      } else {
        console.log(`   ❌ No artifacts generated (expected ${testCase.expectedArtifacts})`);
      }
      
      // Check for errors
      if (!body.success) {
        console.log(`\n   ❌ ERROR: ${body.message}`);
      }
      
      // Check thought steps for errors
      if (body.thoughtSteps) {
        const errorSteps = body.thoughtSteps.filter(s => s.status === 'error');
        if (errorSteps.length > 0) {
          console.log(`\n   ⚠️  Error Steps:`);
          errorSteps.forEach(step => {
            console.log(`      - ${step.action}: ${step.error ? step.error.message : 'Unknown error'}`);
          });
        }
      }
      
      return {
        success: body.success && body.artifacts && body.artifacts.length > 0,
        intent: body.thoughtSteps ? body.thoughtSteps.find(s => s.action === 'Analyzing query')?.result : 'unknown',
        artifacts: body.artifacts ? body.artifacts.length : 0,
        duration
      };
    } else {
      console.log(`   ❌ No body in response`);
      return { success: false, error: 'No body in response' };
    }
    
  } catch (error) {
    console.log(`\n   ❌ Lambda Invocation Failed`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnosis() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   FRONTEND-BACKEND CONNECTION DIAGNOSIS                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const testCase of testQueries) {
    const result = await testQuery(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('DIAGNOSIS SUMMARY');
  console.log(`${'='.repeat(60)}\n`);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (!result.success && result.error) {
      console.log(`         Error: ${result.error}`);
    }
  });
  
  console.log(`\nSuccess Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === 0) {
    console.log('\n🚨 CRITICAL: ALL TESTS FAILED - MASSIVE FRONTEND-BACKEND BREAK');
    console.log('   Possible causes:');
    console.log('   1. Orchestrator Lambda not deployed');
    console.log('   2. GraphQL API not routing to orchestrator');
    console.log('   3. Authentication issues');
    console.log('   4. Environment variables missing');
  } else if (successCount < totalCount) {
    console.log('\n⚠️  WARNING: PARTIAL FAILURES - Some features broken');
    console.log('   Check individual test results above');
  } else {
    console.log('\n✅ ALL TESTS PASSED - Frontend-Backend connection working');
  }
}

runDiagnosis().catch(console.error);
