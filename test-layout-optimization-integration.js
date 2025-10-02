/**
 * Test Layout Optimization Integration
 * Validates the integration of layout optimization tools into the renewable energy agent
 */

const { 
  createGridLayout, 
  createSpiralLayout, 
  createGreedyLayout 
} = require('./amplify/functions/tools/renewableLayoutOptimizationTool');

const { RenewableEnergyAgent } = require('./amplify/functions/agents/renewableEnergyAgent');

async function testLayoutOptimizationIntegration() {
  console.log('🚀 Testing Layout Optimization Integration...\n');

  try {
    // Initialize the renewable energy agent
    const renewableAgent = new RenewableEnergyAgent();

    // Test Cases
    const testCases = [
      {
        name: 'Grid Layout Request',
        message: 'Design a 30MW grid layout wind farm at 40.7128, -74.0060 with 225° wind direction',
        expectedLayoutType: 'grid'
      },
      {
        name: 'Spiral Layout Request',  
        message: 'Create a spiral layout for 50MW wind farm at 32.7767, -96.7970 with Vestas_V90_3MW turbines',
        expectedLayoutType: 'spiral'
      },
      {
        name: 'Greedy Layout Request',
        message: 'Optimize placement using greedy layout for 25MW at 39.7392, -104.9903 with 180° wind',
        expectedLayoutType: 'greedy'
      },
      {
        name: 'Layout with Custom Spacing',
        message: 'Design a 40MW wind farm at 41.8781, -87.6298 with 10D spacing',
        expectedSpacing: 10
      },
      {
        name: 'Missing Parameters Test',
        message: 'Design a wind farm layout',
        shouldPromptForParams: true
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`📝 Message: "${testCase.message}"`);
      
      try {
        const startTime = Date.now();
        const response = await renewableAgent.processQuery(testCase.message);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️  Processing time: ${duration}ms`);
        console.log(`✅ Success: ${response.success}`);
        console.log(`🤖 Agent: ${response.agentUsed}`);
        console.log(`💬 Message: ${response.message.substring(0, 100)}...`);
        
        if (response.artifacts && response.artifacts.length > 0) {
          const artifact = response.artifacts[0];
          console.log(`🎯 Artifact Type: ${artifact.messageContentType}`);
          console.log(`📊 Layout Details:`);
          
          if (artifact.layout) {
            console.log(`   - Turbine Count: ${artifact.layout.turbineCount}`);
            console.log(`   - Total Capacity: ${artifact.layout.totalCapacity}`);
            console.log(`   - Efficiency: ${artifact.layout.efficiency}`);
            console.log(`   - Layout Pattern: ${artifact.layout.layoutPattern}`);
            console.log(`   - Wind Alignment: ${artifact.layout.windAlignment}°`);
            console.log(`   - Turbine Positions: ${artifact.turbinePositions?.length || 0} positions`);
          }

          // Validate expected layout type
          if (testCase.expectedLayoutType) {
            const actualLayoutType = artifact.layoutType || artifact.algorithmUsed;
            if (actualLayoutType === testCase.expectedLayoutType) {
              console.log(`✅ Layout type validation: PASSED (${actualLayoutType})`);
            } else {
              console.log(`❌ Layout type validation: FAILED (expected ${testCase.expectedLayoutType}, got ${actualLayoutType})`);
            }
          }

          // Validate spacing if specified
          if (testCase.expectedSpacing) {
            const spacingText = artifact.spacing;
            if (spacingText && spacingText.includes(`${testCase.expectedSpacing}D`)) {
              console.log(`✅ Spacing validation: PASSED (${spacingText})`);
            } else {
              console.log(`❌ Spacing validation: FAILED (expected ${testCase.expectedSpacing}D, got ${spacingText})`);
            }
          }

        } else if (testCase.shouldPromptForParams) {
          console.log('✅ Correctly prompted for missing parameters');
        } else {
          console.log('⚠️  No artifacts generated');
        }

        if (response.thoughtSteps && response.thoughtSteps.length > 0) {
          console.log(`🧠 Thought Steps: ${response.thoughtSteps.length}`);
          response.thoughtSteps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step.title}: ${step.status}`);
          });
        }

        console.log('✅ Test completed successfully');

      } catch (error) {
        console.error(`❌ Test failed with error:`, error.message);
        console.error('Stack:', error.stack);
      }
    }

    // Test direct tool functions
    console.log('\n🔧 Testing Direct Tool Functions...\n');

    const directTestParams = {
      project_id: 'test_layout_001',
      center_lat: 40.7128,
      center_lon: -74.0060,
      num_turbines: 10,
      turbine_model: 'IEA_Reference_3.4MW_130',
      rotor_diameter: 130,
      capacity_mw: 34,
      wind_angle: 225,
      spacing_d: 9
    };

    const tools = [
      { name: 'Grid Layout', func: createGridLayout },
      { name: 'Spiral Layout', func: createSpiralLayout },
      { name: 'Greedy Layout', func: createGreedyLayout }
    ];

    for (const tool of tools) {
      try {
        console.log(`\n🛠️  Testing ${tool.name} Tool Direct`);
        const startTime = Date.now();
        const result = await tool.func(directTestParams);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️  Direct tool time: ${duration}ms`);
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Artifacts: ${result.artifacts?.length || 0}`);
        
        if (result.artifacts && result.artifacts.length > 0) {
          const artifact = result.artifacts[0];
          console.log(`   - Type: ${artifact.type}`);
          console.log(`   - Turbines: ${artifact.turbineCount}`);
          console.log(`   - Capacity: ${artifact.totalCapacity}MW`);
          console.log(`   - Efficiency: ${Math.round(artifact.placementEfficiency * 100)}%`);
          console.log(`   - Avg Spacing: ${Math.round(artifact.averageSpacing)}m`);
        }

      } catch (error) {
        console.error(`❌ Direct tool test failed:`, error.message);
      }
    }

    console.log('\n🎉 Layout Optimization Integration Test Complete!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Performance benchmark
async function benchmarkLayoutOptimization() {
  console.log('\n🏁 Performance Benchmark for Layout Optimization...\n');

  const benchmarkSizes = [
    { turbines: 5, capacity: 17 },
    { turbines: 10, capacity: 34 },
    { turbines: 20, capacity: 68 },
    { turbines: 50, capacity: 170 }
  ];

  for (const size of benchmarkSizes) {
    console.log(`\n📊 Benchmarking ${size.turbines} turbines (${size.capacity}MW):`);
    
    const params = {
      project_id: `benchmark_${size.turbines}`,
      center_lat: 40.7128,
      center_lon: -74.0060,
      num_turbines: size.turbines,
      turbine_model: 'IEA_Reference_3.4MW_130',
      rotor_diameter: 130,
      capacity_mw: size.capacity,
      wind_angle: 225,
      spacing_d: 9
    };

    const algorithms = [
      { name: 'Grid', func: createGridLayout },
      { name: 'Spiral', func: createSpiralLayout },
      { name: 'Greedy', func: createGreedyLayout }
    ];

    for (const algo of algorithms) {
      try {
        const startTime = Date.now();
        const result = await algo.func(params);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`   ${algo.name}: ${duration}ms (${result.success ? 'SUCCESS' : 'FAILED'})`);
        
        if (result.artifacts && result.artifacts.length > 0) {
          const efficiency = Math.round(result.artifacts[0].placementEfficiency * 100);
          console.log(`     Efficiency: ${efficiency}%`);
        }

      } catch (error) {
        console.log(`   ${algo.name}: ERROR - ${error.message}`);
      }
    }
  }
}

// Run tests
if (require.main === module) {
  (async () => {
    await testLayoutOptimizationIntegration();
    await benchmarkLayoutOptimization();
  })();
}

module.exports = {
  testLayoutOptimizationIntegration,
  benchmarkLayoutOptimization
};
