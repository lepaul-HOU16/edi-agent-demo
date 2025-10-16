/**
 * Test various equipment status query patterns
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testQuery(query: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Testing: "${query}"`);
  console.log('='.repeat(80));
  
  const router = new AgentRouter();
  
  try {
    const result = await router.routeQuery(query);
    
    console.log('✅ Agent used:', result.agentUsed);
    console.log('✅ Success:', result.success);
    console.log('✅ Has artifacts:', result.artifacts?.length || 0);
    
    if (result.artifacts && result.artifacts.length > 0) {
      const artifact = result.artifacts[0];
      console.log('✅ Artifact type:', artifact.messageContentType);
      console.log('✅ Equipment ID:', artifact.data?.equipmentId);
    }
    
    // Check if routed correctly
    const expectedAgent = 'maintenance';
    if (result.agentUsed === expectedAgent) {
      console.log('✅ PASS: Correctly routed to maintenance agent');
    } else {
      console.log(`❌ FAIL: Expected ${expectedAgent}, got ${result.agentUsed}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Testing Equipment Status Query Variations\n');
  
  const queries = [
    'show me equipment status for well001',
    'equipment status for PUMP-001',
    'check equipment status for comp123',
    'get status for TURB-456',
    'status of equipment PUMP-001',
    'what is the status of well001',
    'show equipment health for COMP-123'
  ];
  
  for (const query of queries) {
    await testQuery(query);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 All tests complete!');
  console.log('='.repeat(80));
}

// Run tests
runAllTests().catch(console.error);
