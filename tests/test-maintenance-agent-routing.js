/**
 * Test Maintenance Agent Routing
 * Verifies that maintenance queries are correctly routed to the maintenance agent
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

const { AgentRouter } = require('../amplify/functions/agents/agentRouter');

async function testMaintenanceRouting() {
  console.log('🧪 === TESTING MAINTENANCE AGENT ROUTING ===\n');

  try {
    // Initialize router
    console.log('📦 Initializing AgentRouter...');
    const router = new AgentRouter();
    console.log('✅ AgentRouter initialized\n');

    // Test 1: Equipment status query
    console.log('Test 1: Equipment Status Query');
    console.log('Query: "What is the status of equipment PUMP-001?"');
    const result1 = await router.routeQuery('What is the status of equipment PUMP-001?');
    console.log('Agent Used:', result1.agentUsed);
    console.log('Success:', result1.success);
    console.log('Expected: maintenance');
    console.log(result1.agentUsed === 'maintenance' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 2: Failure prediction query
    console.log('Test 2: Failure Prediction Query');
    console.log('Query: "Predict failure for equipment COMP-123"');
    const result2 = await router.routeQuery('Predict failure for equipment COMP-123');
    console.log('Agent Used:', result2.agentUsed);
    console.log('Success:', result2.success);
    console.log('Expected: maintenance');
    console.log(result2.agentUsed === 'maintenance' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 3: Maintenance planning query
    console.log('Test 3: Maintenance Planning Query');
    console.log('Query: "Create a maintenance plan for next month"');
    const result3 = await router.routeQuery('Create a maintenance plan for next month');
    console.log('Agent Used:', result3.agentUsed);
    console.log('Success:', result3.success);
    console.log('Expected: maintenance');
    console.log(result3.agentUsed === 'maintenance' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 4: Explicit agent selection (maintenance)
    console.log('Test 4: Explicit Agent Selection (Maintenance)');
    console.log('Query: "Analyze well data" (with selectedAgent: maintenance)');
    const result4 = await router.routeQuery(
      'Analyze well data',
      [],
      { selectedAgent: 'maintenance' }
    );
    console.log('Agent Used:', result4.agentUsed);
    console.log('Success:', result4.success);
    console.log('Expected: maintenance');
    console.log(result4.agentUsed === 'maintenance' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 5: Petrophysics query (no regression)
    console.log('Test 5: Petrophysics Query (No Regression)');
    console.log('Query: "Calculate porosity for WELL-001"');
    const result5 = await router.routeQuery('Calculate porosity for WELL-001');
    console.log('Agent Used:', result5.agentUsed);
    console.log('Success:', result5.success);
    console.log('Expected: petrophysics');
    console.log(result5.agentUsed === 'petrophysics' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 6: Renewable query (no regression)
    console.log('Test 6: Renewable Query (No Regression)');
    console.log('Query: "Analyze wind farm terrain"');
    const result6 = await router.routeQuery('Analyze wind farm terrain');
    console.log('Agent Used:', result6.agentUsed);
    console.log('Success:', result6.success);
    console.log('Expected: renewable_energy');
    console.log(result6.agentUsed === 'renewable_energy' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 7: Maintenance term detection
    console.log('Test 7: Maintenance Term Detection');
    console.log('Query: "Show me equipment monitoring data"');
    const result7 = await router.routeQuery('Show me equipment monitoring data');
    console.log('Agent Used:', result7.agentUsed);
    console.log('Success:', result7.success);
    console.log('Expected: maintenance');
    console.log(result7.agentUsed === 'maintenance' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Summary
    console.log('🏁 === TEST SUMMARY ===');
    const results = [result1, result2, result3, result4, result5, result6, result7];
    const expectedAgents = ['maintenance', 'maintenance', 'maintenance', 'maintenance', 'petrophysics', 'renewable_energy', 'maintenance'];
    
    let passed = 0;
    let failed = 0;
    
    results.forEach((result, index) => {
      if (result.agentUsed === expectedAgents[index]) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('');

    if (failed === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ Maintenance agent routing is working correctly');
      console.log('✅ No regressions detected in petrophysics or renewable routing');
      return true;
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('❌ Please review the routing logic');
      return false;
    }

  } catch (error) {
    console.error('❌ === TEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests
testMaintenanceRouting()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
