/**
 * Test Agent Switcher Routing Logic
 * Verifies that explicit agent selection bypasses intent detection
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testAgentSwitcherRouting() {
  console.log('🧪 Testing Agent Switcher Routing Logic\n');
  console.log('='.repeat(80));
  
  const router = new AgentRouter();
  
  // Test cases: same query with different agent selections
  const testCases = [
    {
      name: 'Auto Mode - Equipment Status Query',
      query: 'show me equipment status for well001',
      selectedAgent: 'auto' as const,
      expectedAgent: 'maintenance',
      description: 'Auto mode should detect maintenance intent'
    },
    {
      name: 'Explicit Maintenance - Equipment Status Query',
      query: 'show me equipment status for well001',
      selectedAgent: 'maintenance' as const,
      expectedAgent: 'maintenance',
      description: 'Explicit maintenance selection should route to maintenance'
    },
    {
      name: 'Explicit Petrophysics - Equipment Status Query',
      query: 'show me equipment status for well001',
      selectedAgent: 'petrophysics' as const,
      expectedAgent: 'petrophysics',
      description: 'Explicit petrophysics selection should override intent detection'
    },
    {
      name: 'Auto Mode - Porosity Calculation',
      query: 'calculate porosity for WELL-001',
      selectedAgent: 'auto' as const,
      expectedAgent: 'petrophysics',
      description: 'Auto mode should detect petrophysics intent'
    },
    {
      name: 'Explicit Maintenance - Porosity Calculation',
      query: 'calculate porosity for WELL-001',
      selectedAgent: 'maintenance' as const,
      expectedAgent: 'maintenance',
      description: 'Explicit maintenance selection should override petrophysics intent'
    },
    {
      name: 'Auto Mode - Wind Farm Query',
      query: 'analyze wind farm terrain',
      selectedAgent: 'auto' as const,
      expectedAgent: 'renewable_energy',
      description: 'Auto mode should detect renewable energy intent'
    },
    {
      name: 'Explicit Renewable - Generic Query',
      query: 'hello',
      selectedAgent: 'renewable' as const,
      expectedAgent: 'renewable_energy',
      description: 'Explicit renewable selection should route to renewable even for generic query'
    },
    {
      name: 'No Selection (undefined) - Equipment Status',
      query: 'show me equipment status for well001',
      selectedAgent: undefined,
      expectedAgent: 'maintenance',
      description: 'No selection should behave like auto mode'
    }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Test: ${testCase.name}`);
    console.log('='.repeat(80));
    console.log(`Query: "${testCase.query}"`);
    console.log(`Selected Agent: ${testCase.selectedAgent || 'undefined (auto)'}`);
    console.log(`Expected Agent: ${testCase.expectedAgent}`);
    console.log(`Description: ${testCase.description}`);
    console.log('');
    
    try {
      const sessionContext = testCase.selectedAgent ? {
        chatSessionId: 'test-session',
        userId: 'test-user',
        selectedAgent: testCase.selectedAgent
      } : {
        chatSessionId: 'test-session',
        userId: 'test-user'
      };
      
      const result = await router.routeQuery(testCase.query, [], sessionContext);
      
      console.log(`✅ Result: Routed to ${result.agentUsed}`);
      
      if (result.agentUsed === testCase.expectedAgent) {
        console.log('✅ PASS: Correct agent selected');
        passCount++;
      } else {
        console.log(`❌ FAIL: Expected ${testCase.expectedAgent}, got ${result.agentUsed}`);
        failCount++;
      }
      
    } catch (error) {
      console.error('❌ FAIL: Error during routing:', error);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');
  
  if (failCount === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Review the output above.');
  }
  
  console.log('='.repeat(80));
}

// Run tests
testAgentSwitcherRouting().catch(console.error);
