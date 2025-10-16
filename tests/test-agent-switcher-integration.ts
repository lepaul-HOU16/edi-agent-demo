/**
 * Integration Test: Agent Switcher with Equipment Status
 * Tests the complete flow from UI selection to agent response
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testIntegration() {
  console.log('🧪 Integration Test: Agent Switcher + Equipment Status\n');
  console.log('='.repeat(80));
  console.log('Simulating user flow: Select Maintenance agent → Query equipment status');
  console.log('='.repeat(80));
  console.log('');
  
  const router = new AgentRouter();
  const query = 'show me equipment status for well001';
  
  // Test 1: Auto mode (should detect maintenance intent)
  console.log('📝 Test 1: Auto Mode');
  console.log('-'.repeat(80));
  console.log('User selects: Auto');
  console.log(`User types: "${query}"`);
  console.log('');
  
  const autoResult = await router.routeQuery(query, [], {
    chatSessionId: 'test-session',
    userId: 'test-user',
    selectedAgent: 'auto'
  });
  
  console.log('✅ Result:');
  console.log(`  Agent Used: ${autoResult.agentUsed}`);
  console.log(`  Success: ${autoResult.success}`);
  console.log(`  Message: ${autoResult.message.substring(0, 100)}...`);
  console.log(`  Artifacts: ${autoResult.artifacts?.length || 0}`);
  
  if (autoResult.artifacts && autoResult.artifacts.length > 0) {
    console.log(`  Artifact Type: ${autoResult.artifacts[0].messageContentType}`);
    console.log(`  Equipment ID: ${autoResult.artifacts[0].data?.equipmentId}`);
  }
  
  const autoPass = autoResult.agentUsed === 'maintenance' && 
                   autoResult.success && 
                   autoResult.artifacts?.length > 0;
  console.log('');
  console.log(autoPass ? '✅ PASS: Auto mode correctly detected maintenance intent' : '❌ FAIL');
  console.log('');
  
  // Test 2: Explicit maintenance selection
  console.log('📝 Test 2: Explicit Maintenance Selection');
  console.log('-'.repeat(80));
  console.log('User selects: Maintenance');
  console.log(`User types: "${query}"`);
  console.log('');
  
  const maintenanceResult = await router.routeQuery(query, [], {
    chatSessionId: 'test-session',
    userId: 'test-user',
    selectedAgent: 'maintenance'
  });
  
  console.log('✅ Result:');
  console.log(`  Agent Used: ${maintenanceResult.agentUsed}`);
  console.log(`  Success: ${maintenanceResult.success}`);
  console.log(`  Message: ${maintenanceResult.message.substring(0, 100)}...`);
  console.log(`  Artifacts: ${maintenanceResult.artifacts?.length || 0}`);
  
  if (maintenanceResult.artifacts && maintenanceResult.artifacts.length > 0) {
    console.log(`  Artifact Type: ${maintenanceResult.artifacts[0].messageContentType}`);
    console.log(`  Equipment ID: ${maintenanceResult.artifacts[0].data?.equipmentId}`);
  }
  
  const maintenancePass = maintenanceResult.agentUsed === 'maintenance' && 
                          maintenanceResult.success && 
                          maintenanceResult.artifacts?.length > 0;
  console.log('');
  console.log(maintenancePass ? '✅ PASS: Explicit selection routed to maintenance' : '❌ FAIL');
  console.log('');
  
  // Test 3: Explicit petrophysics selection (should override intent)
  console.log('📝 Test 3: Explicit Petrophysics Selection (Override Test)');
  console.log('-'.repeat(80));
  console.log('User selects: Petrophysics');
  console.log(`User types: "${query}" (maintenance query)`);
  console.log('Expected: Should route to Petrophysics despite maintenance keywords');
  console.log('');
  
  const petrophysicsResult = await router.routeQuery(query, [], {
    chatSessionId: 'test-session',
    userId: 'test-user',
    selectedAgent: 'petrophysics'
  });
  
  console.log('✅ Result:');
  console.log(`  Agent Used: ${petrophysicsResult.agentUsed}`);
  console.log(`  Success: ${petrophysicsResult.success}`);
  console.log(`  Message: ${petrophysicsResult.message.substring(0, 100)}...`);
  
  const petrophysicsPass = petrophysicsResult.agentUsed === 'petrophysics';
  console.log('');
  console.log(petrophysicsPass ? '✅ PASS: Explicit selection overrode intent detection' : '❌ FAIL');
  console.log('');
  
  // Summary
  console.log('='.repeat(80));
  console.log('📊 Integration Test Summary');
  console.log('='.repeat(80));
  console.log(`Auto Mode: ${autoPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Explicit Maintenance: ${maintenancePass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Explicit Override: ${petrophysicsPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (autoPass && maintenancePass && petrophysicsPass) {
    console.log('🎉 All integration tests passed!');
    console.log('');
    console.log('✅ Agent switcher is working correctly:');
    console.log('   - Auto mode detects intent');
    console.log('   - Explicit selection is honored');
    console.log('   - Explicit selection overrides intent detection');
  } else {
    console.log('⚠️ Some integration tests failed');
  }
  console.log('='.repeat(80));
}

// Run integration test
testIntegration().catch(console.error);
