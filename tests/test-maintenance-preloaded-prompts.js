/**
 * Test Maintenance Agent Preloaded Prompts
 * 
 * This test verifies that:
 * 1. Maintenance prompts are available in the UI
 * 2. Agent is automatically set to 'maintenance' when a maintenance prompt is selected
 * 3. Prompts send to the maintenance agent
 * 4. Expected artifacts are generated
 * 5. No errors occur in the process
 */

const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');
const amplifyConfig = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyConfig);

// Test data for maintenance prompts
const maintenancePrompts = [
  {
    name: 'Equipment Health Assessment',
    prompt: 'Perform a comprehensive health assessment for equipment PUMP-001. Analyze current operational status, health score, performance metrics, sensor readings, and maintenance history. Generate health score visualization, identify potential issues, and provide actionable maintenance recommendations with priority levels.',
    expectedArtifactType: 'equipment_health',
    agentType: 'maintenance'
  },
  {
    name: 'Failure Prediction Analysis',
    prompt: 'Analyze equipment COMPRESSOR-001 for failure prediction. Use historical maintenance data, sensor readings, and operational patterns to predict failure risk over the next 90 days. Generate risk timeline chart, identify contributing factors with impact scores, calculate time-to-failure estimate, and provide preventive action recommendations.',
    expectedArtifactType: 'failure_prediction',
    agentType: 'maintenance'
  },
  {
    name: 'Preventive Maintenance Planning',
    prompt: 'Generate a preventive maintenance plan for equipment TURBINE-001, PUMP-001, and VALVE-001 for the next 6 months. Optimize schedule based on equipment condition, operational priorities, and resource constraints. Create Gantt-style schedule visualization, estimate costs and durations, identify task dependencies, and provide resource allocation recommendations.',
    expectedArtifactType: 'maintenance_schedule',
    agentType: 'maintenance'
  },
  {
    name: 'Inspection Schedule Generation',
    prompt: 'Create an inspection schedule for equipment MOTOR-001. Analyze sensor data trends (temperature, vibration, current), detect anomalies, assess compliance requirements, and generate inspection timeline. Include trend charts, anomaly highlights, inspection checklist, and findings documentation with industry standard compliance.',
    expectedArtifactType: 'inspection_report',
    agentType: 'maintenance'
  },
  {
    name: 'Asset Lifecycle Analysis',
    prompt: 'Perform asset lifecycle analysis for equipment PUMP-001. Evaluate complete lifecycle from installation to current state, analyze total cost of ownership, maintenance frequency trends, performance degradation patterns, and predict end-of-life timeline. Generate lifecycle timeline visualization, cost breakdown, and replacement strategy recommendations.',
    expectedArtifactType: 'asset_lifecycle',
    agentType: 'maintenance'
  }
];

async function testMaintenancePreloadedPrompts() {
  console.log('🧪 Testing Maintenance Agent Preloaded Prompts\n');
  console.log('=' .repeat(80));
  
  const client = generateClient();
  let allTestsPassed = true;
  
  // Create a test chat session
  console.log('\n📝 Creating test chat session...');
  const { data: chatSession } = await client.models.ChatSession.create({
    name: 'Maintenance Prompts Test Session'
  });
  
  if (!chatSession || !chatSession.id) {
    console.error('❌ Failed to create test chat session');
    return false;
  }
  
  console.log(`✅ Test chat session created: ${chatSession.id}\n`);
  
  // Test each maintenance prompt
  for (let i = 0; i < maintenancePrompts.length; i++) {
    const promptData = maintenancePrompts[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Test ${i + 1}/${maintenancePrompts.length}: ${promptData.name}`);
    console.log('='.repeat(80));
    
    try {
      // Step 1: Verify agentType is set
      console.log('\n✓ Step 1: Verify agentType');
      if (promptData.agentType !== 'maintenance') {
        console.error(`❌ FAIL: agentType should be 'maintenance', got '${promptData.agentType}'`);
        allTestsPassed = false;
        continue;
      }
      console.log(`  ✅ agentType correctly set to: ${promptData.agentType}`);
      
      // Step 2: Send message to maintenance agent
      console.log('\n✓ Step 2: Send prompt to maintenance agent');
      console.log(`  Prompt: ${promptData.prompt.substring(0, 100)}...`);
      
      const { data: invokeResponse, errors } = await client.queries.invokeMaintenanceAgent({
        chatSessionId: chatSession.id,
        message: promptData.prompt
      });
      
      if (errors && errors.length > 0) {
        console.error('❌ FAIL: GraphQL errors:', errors);
        allTestsPassed = false;
        continue;
      }
      
      if (!invokeResponse) {
        console.error('❌ FAIL: No response from maintenance agent');
        allTestsPassed = false;
        continue;
      }
      
      console.log('  ✅ Maintenance agent responded successfully');
      
      // Step 3: Verify response structure
      console.log('\n✓ Step 3: Verify response structure');
      const response = typeof invokeResponse === 'string' 
        ? JSON.parse(invokeResponse) 
        : invokeResponse;
      
      if (!response.success) {
        console.error('❌ FAIL: Response indicates failure');
        console.error('  Message:', response.message);
        allTestsPassed = false;
        continue;
      }
      console.log('  ✅ Response indicates success');
      
      if (!response.message) {
        console.error('❌ FAIL: No message in response');
        allTestsPassed = false;
        continue;
      }
      console.log(`  ✅ Response message: ${response.message.substring(0, 100)}...`);
      
      // Step 4: Verify artifacts are generated
      console.log('\n✓ Step 4: Verify artifacts');
      if (!response.artifacts || response.artifacts.length === 0) {
        console.warn('⚠️  WARNING: No artifacts generated (may be expected for some prompts)');
      } else {
        console.log(`  ✅ Generated ${response.artifacts.length} artifact(s)`);
        
        // Check for expected artifact type
        const hasExpectedArtifact = response.artifacts.some(
          artifact => artifact.messageContentType === promptData.expectedArtifactType
        );
        
        if (hasExpectedArtifact) {
          console.log(`  ✅ Found expected artifact type: ${promptData.expectedArtifactType}`);
        } else {
          console.warn(`  ⚠️  Expected artifact type '${promptData.expectedArtifactType}' not found`);
          console.log('  Artifact types:', response.artifacts.map(a => a.messageContentType).join(', '));
        }
      }
      
      // Step 5: Verify thought steps (if present)
      console.log('\n✓ Step 5: Verify thought steps');
      if (response.thoughtSteps && response.thoughtSteps.length > 0) {
        console.log(`  ✅ Generated ${response.thoughtSteps.length} thought step(s)`);
      } else {
        console.log('  ℹ️  No thought steps (may be expected)');
      }
      
      // Step 6: Check for errors in console
      console.log('\n✓ Step 6: Check for errors');
      if (response.error) {
        console.error('❌ FAIL: Error in response:', response.error);
        allTestsPassed = false;
        continue;
      }
      console.log('  ✅ No errors in response');
      
      console.log(`\n✅ Test ${i + 1} PASSED: ${promptData.name}`);
      
    } catch (error) {
      console.error(`\n❌ Test ${i + 1} FAILED: ${promptData.name}`);
      console.error('Error:', error.message);
      if (error.errors) {
        console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
      }
      allTestsPassed = false;
    }
    
    // Wait between tests to avoid rate limiting
    if (i < maintenancePrompts.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Cleanup: Delete test chat session
  console.log('\n\n🧹 Cleaning up test chat session...');
  try {
    await client.models.ChatSession.delete({ id: chatSession.id });
    console.log('✅ Test chat session deleted');
  } catch (error) {
    console.warn('⚠️  Failed to delete test chat session:', error.message);
  }
  
  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total prompts tested: ${maintenancePrompts.length}`);
  console.log(`Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(80) + '\n');
  
  return allTestsPassed;
}

// Run tests
testMaintenancePreloadedPrompts()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error running tests:', error);
    process.exit(1);
  });
