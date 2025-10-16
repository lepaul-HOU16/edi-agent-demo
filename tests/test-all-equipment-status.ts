/**
 * Test: Equipment Status for All Wells/Equipment
 * Verifies that queries like "show me equipment status for all my wells" work correctly
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testAllEquipmentStatus() {
  console.log('🧪 Testing: Equipment Status for All Wells/Equipment\n');

  const router = new AgentRouter();

  // Test cases for "all equipment" queries
  const testCases = [
    {
      query: 'show me equipment status for all my wells',
      expectedAgent: 'maintenance',
      description: 'Query for all wells status'
    },
    {
      query: 'what is the status of all equipment',
      expectedAgent: 'maintenance',
      description: 'Query for all equipment status'
    },
    {
      query: 'show all equipment status',
      expectedAgent: 'maintenance',
      description: 'Simple all equipment query'
    },
    {
      query: 'status for all my wells',
      expectedAgent: 'maintenance',
      description: 'Status for all wells'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);

    try {
      const result = await router.routeQuery(testCase.query, [], {
        chatSessionId: 'test-session',
        userId: 'test-user',
        selectedAgent: 'auto'
      });

      console.log(`Agent Used: ${result.agentUsed}`);
      console.log(`Success: ${result.success}`);
      console.log(`Artifacts: ${result.artifacts?.length || 0}`);
      console.log(`Message Preview: ${result.message.substring(0, 150)}...`);

      // Verify correct agent was used
      if (result.agentUsed === testCase.expectedAgent) {
        console.log('✅ PASS: Correct agent selected');
        
        // Verify artifacts were generated
        if (result.artifacts && result.artifacts.length > 0) {
          console.log(`✅ PASS: Generated ${result.artifacts.length} artifacts`);
          
          // Verify artifact structure
          const firstArtifact = result.artifacts[0];
          if (firstArtifact.messageContentType === 'equipment_health') {
            console.log('✅ PASS: Correct artifact type');
            
            if (firstArtifact.equipmentHealth) {
              console.log('✅ PASS: Equipment health data present');
              console.log(`   Equipment: ${firstArtifact.equipmentHealth.equipmentName}`);
              console.log(`   Health Score: ${firstArtifact.equipmentHealth.healthScore}`);
              console.log(`   Status: ${firstArtifact.equipmentHealth.operationalStatus}`);
              passed++;
            } else {
              console.log('❌ FAIL: Missing equipment health data');
              failed++;
            }
          } else {
            console.log(`❌ FAIL: Wrong artifact type: ${firstArtifact.messageContentType}`);
            failed++;
          }
        } else {
          console.log('❌ FAIL: No artifacts generated');
          failed++;
        }
      } else {
        console.log(`❌ FAIL: Wrong agent selected (expected ${testCase.expectedAgent}, got ${result.agentUsed})`);
        failed++;
      }

    } catch (error) {
      console.log(`❌ FAIL: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
testAllEquipmentStatus().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
