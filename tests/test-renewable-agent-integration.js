/**
 * Test script to validate renewable energy agent integration
 * Tests routing, pattern matching, and basic functionality
 */

const { AgentRouter } = require('./amplify/functions/agents/agentRouter');

async function testRenewableAgentIntegration() {
  console.log('🌱 Testing Renewable Energy Agent Integration\n');

  // Initialize the router
  const router = new AgentRouter();

  // Test cases for renewable energy routing
  const testCases = [
    {
      category: 'Wind Farm Development',
      queries: [
        'I want to create a 30MW wind farm at coordinates 35.067, -101.395',
        'Design a wind farm layout for my site',
        'Help me with wind turbine placement optimization'
      ]
    },
    {
      category: 'Terrain Analysis',
      queries: [
        'Analyze terrain for wind farm development at 40.7128, -74.0060',
        'What are the exclusion zones for wind turbines?',
        'Site analysis for wind project with 100m setbacks'
      ]
    },
    {
      category: 'Performance Simulation',
      queries: [
        'Run wake analysis for my wind farm',
        'Calculate capacity factor and energy production',
        'Wind farm simulation with performance metrics'
      ]
    },
    {
      category: 'General Renewable',
      queries: [
        'What is renewable energy development?',
        'Help me understand wind farm development process',
        'I need guidance on clean energy projects'
      ]
    },
    {
      category: 'Non-Renewable (Should NOT Route to Renewable)',
      queries: [
        'Analyze well porosity for Well-001',
        'Show me wells in the Gulf of Mexico',
        'What is the weather like in Texas?'
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.category}`);
    console.log('='.repeat(50));

    for (const query of testCase.queries) {
      try {
        console.log(`\n🔍 Query: "${query}"`);
        
        const result = await router.routeQuery(query);
        
        console.log(`✅ Agent Used: ${result.agentUsed}`);
        console.log(`📝 Success: ${result.success}`);
        console.log(`💬 Message Length: ${result.message?.length || 0} characters`);
        console.log(`🎯 Artifacts: ${result.artifacts?.length || 0}`);
        console.log(`🧠 Thought Steps: ${result.thoughtSteps?.length || 0}`);

        // Validate routing expectations
        const isRenewableQuery = testCase.category !== 'Non-Renewable (Should NOT Route to Renewable)';
        const routedToRenewable = result.agentUsed === 'renewable_energy';

        if (isRenewableQuery && routedToRenewable) {
          console.log('🎉 CORRECT: Routed to renewable energy agent');
        } else if (!isRenewableQuery && !routedToRenewable) {
          console.log('🎉 CORRECT: Did not route to renewable energy agent');
        } else {
          console.log('⚠️  UNEXPECTED ROUTING');
        }

        // Show artifacts if any
        if (result.artifacts && result.artifacts.length > 0) {
          console.log(`📊 Artifact Types: ${result.artifacts.map(a => a.messageContentType).join(', ')}`);
        }

      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
    }
  }

  console.log('\n🎯 Testing specific renewable patterns...');
  
  // Test pattern matching specifically
  const patternTests = [
    'wind farm development',
    'turbine layout optimization', 
    'renewable energy site design',
    'wake analysis simulation',
    'capacity factor calculation',
    'wind resource assessment'
  ];

  for (const pattern of patternTests) {
    try {
      console.log(`\n🔬 Pattern Test: "${pattern}"`);
      const result = await router.routeQuery(pattern);
      
      const routedCorrectly = result.agentUsed === 'renewable_energy';
      console.log(`${routedCorrectly ? '✅' : '❌'} Routed to: ${result.agentUsed}`);
      
    } catch (error) {
      console.log(`❌ Error testing pattern "${pattern}": ${error.message}`);
    }
  }

  console.log('\n🏁 Renewable Agent Integration Test Complete!');
}

// Run the test
testRenewableAgentIntegration().catch(console.error);
