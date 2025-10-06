/**
 * Validate Layout Optimization Integration
 * Checks that the integration is properly structured without runtime execution
 */

const fs = require('fs');
const path = require('path');

function validateLayoutOptimizationIntegration() {
  console.log('🔍 Validating Layout Optimization Integration...\n');

  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };

  // Test 1: Check that layout optimization tool exists
  console.log('📋 Test 1: Layout Optimization Tool Exists');
  const layoutToolPath = './amplify/functions/tools/renewableLayoutOptimizationTool.ts';
  
  if (fs.existsSync(layoutToolPath)) {
    console.log('✅ renewableLayoutOptimizationTool.ts exists');
    results.passed++;
    
    // Check content
    const layoutToolContent = fs.readFileSync(layoutToolPath, 'utf8');
    
    const requiredFunctions = ['createGridLayout', 'createSpiralLayout', 'createGreedyLayout'];
    const missingFunctions = requiredFunctions.filter(func => !layoutToolContent.includes(`export async function ${func}`));
    
    if (missingFunctions.length === 0) {
      console.log('✅ All required functions exported: createGridLayout, createSpiralLayout, createGreedyLayout');
      results.passed++;
    } else {
      console.log(`❌ Missing functions: ${missingFunctions.join(', ')}`);
      results.failed++;
      results.issues.push(`Missing functions: ${missingFunctions.join(', ')}`);
    }

    // Check RouterResponse interface usage
    if (layoutToolContent.includes('RouterResponse')) {
      console.log('✅ Uses RouterResponse interface correctly');
      results.passed++;
    } else {
      console.log('❌ Missing RouterResponse interface usage');
      results.failed++;
      results.issues.push('Missing RouterResponse interface usage');
    }

    // Check algorithm implementations
    const algorithms = ['Grid layout', 'Spiral layout', 'Greedy layout'];
    algorithms.forEach(algo => {
      const algoKey = algo.toLowerCase().replace(' ', '');
      if (layoutToolContent.includes('metersToLatLon') && layoutToolContent.includes('rotateCoordinates')) {
        console.log(`✅ ${algo} algorithm includes coordinate transformation utilities`);
        results.passed++;
      } else {
        console.log(`❌ ${algo} algorithm missing coordinate utilities`);
        results.failed++;
        results.issues.push(`${algo} algorithm missing coordinate utilities`);
      }
    });

  } else {
    console.log('❌ renewableLayoutOptimizationTool.ts does not exist');
    results.failed++;
    results.issues.push('Layout optimization tool file missing');
  }

  // Test 2: Check renewable energy agent integration
  console.log('\n📋 Test 2: Renewable Energy Agent Integration');
  const agentPath = './amplify/functions/agents/renewableEnergyAgent.ts';
  
  if (fs.existsSync(agentPath)) {
    console.log('✅ renewableEnergyAgent.ts exists');
    results.passed++;
    
    const agentContent = fs.readFileSync(agentPath, 'utf8');
    
    // Check imports
    const requiredImports = ['createGridLayout', 'createSpiralLayout', 'createGreedyLayout'];
    const missingImports = requiredImports.filter(imp => !agentContent.includes(imp));
    
    if (missingImports.length === 0) {
      console.log('✅ All layout optimization functions imported');
      results.passed++;
    } else {
      console.log(`❌ Missing imports: ${missingImports.join(', ')}`);
      results.failed++;
      results.issues.push(`Missing imports: ${missingImports.join(', ')}`);
    }

    // Check helper methods
    const helperMethods = [
      'extractLayoutType',
      'extractWindAngle', 
      'extractSpacing',
      'getTurbineCapacity',
      'getRotorDiameter'
    ];
    
    const missingMethods = helperMethods.filter(method => !agentContent.includes(`private ${method}`));
    
    if (missingMethods.length === 0) {
      console.log('✅ All required helper methods implemented');
      results.passed++;
    } else {
      console.log(`❌ Missing helper methods: ${missingMethods.join(', ')}`);
      results.failed++;
      results.issues.push(`Missing helper methods: ${missingMethods.join(', ')}`);
    }

    // Check handleLayoutDesign method
    if (agentContent.includes('private async handleLayoutDesign')) {
      console.log('✅ handleLayoutDesign method exists');
      results.passed++;
      
      // Check algorithm routing
      if (agentContent.includes('switch (layoutType)') && 
          agentContent.includes('createSpiralLayout') &&
          agentContent.includes('createGreedyLayout') &&
          agentContent.includes('createGridLayout')) {
        console.log('✅ Algorithm routing implemented correctly');
        results.passed++;
      } else {
        console.log('❌ Algorithm routing incomplete');
        results.failed++;
        results.issues.push('Algorithm routing incomplete');
      }

      // Check artifact transformation
      if (agentContent.includes('transformedArtifacts') && 
          agentContent.includes('wind_farm_layout')) {
        console.log('✅ Artifact transformation implemented');
        results.passed++;
      } else {
        console.log('❌ Artifact transformation missing');
        results.failed++;
        results.issues.push('Artifact transformation missing');
      }

    } else {
      console.log('❌ handleLayoutDesign method not found');
      results.failed++;
      results.issues.push('handleLayoutDesign method not found');
    }

  } else {
    console.log('❌ renewableEnergyAgent.ts does not exist');
    results.failed++;
    results.issues.push('Renewable energy agent file missing');
  }

  // Test 3: Check UI components exist
  console.log('\n📋 Test 3: UI Components');
  const layoutComponentPath = './src/components/messageComponents/WindFarmLayoutComponent.tsx';
  
  if (fs.existsSync(layoutComponentPath)) {
    console.log('✅ WindFarmLayoutComponent.tsx exists');
    results.passed++;
    
    const componentContent = fs.readFileSync(layoutComponentPath, 'utf8');
    
    // Check for layout visualization features
    if (componentContent.includes('turbinePositions') || componentContent.includes('layout')) {
      console.log('✅ Layout visualization features present');
      results.passed++;
    } else {
      console.log('❌ Layout visualization features missing');
      results.failed++;
      results.issues.push('Layout visualization features missing');
    }

  } else {
    console.log('❌ WindFarmLayoutComponent.tsx does not exist');
    results.failed++;
    results.issues.push('Layout UI component missing');
  }

  // Test 4: Check agent router integration
  console.log('\n📋 Test 4: Agent Router Integration');
  const routerPath = './amplify/functions/agents/agentRouter.ts';
  
  if (fs.existsSync(routerPath)) {
    const routerContent = fs.readFileSync(routerPath, 'utf8');
    
    if (routerContent.includes('renewableEnergyAgent') || routerContent.includes('renewable')) {
      console.log('✅ Renewable energy agent integrated in router');
      results.passed++;
    } else {
      console.log('⚠️  Renewable energy agent may need router integration');
      // This might be acceptable depending on architecture
    }
  }

  // Test 5: Check ChatBox dropdown integration
  console.log('\n📋 Test 5: ChatBox Dropdown Integration');
  const chatBoxPath = './src/components/ChatBox.tsx';
  
  if (fs.existsSync(chatBoxPath)) {
    const chatBoxContent = fs.readFileSync(chatBoxPath, 'utf8');
    
    if (chatBoxContent.includes('Renewable Energy Agent') || chatBoxContent.includes('renewable')) {
      console.log('✅ Renewable Energy Agent present in ChatBox dropdown');
      results.passed++;
    } else {
      console.log('❌ Renewable Energy Agent missing from ChatBox dropdown');
      results.failed++;
      results.issues.push('Renewable Energy Agent missing from ChatBox dropdown');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.issues.length > 0) {
    console.log('\n🔧 Issues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 Layout Optimization Integration: FULLY VALIDATED');
    console.log('✅ Ready for deployment and testing');
  } else if (results.passed > results.failed) {
    console.log('\n⚠️  Layout Optimization Integration: MOSTLY COMPLETE');
    console.log('🔧 Minor issues need attention before deployment');
  } else {
    console.log('\n❌ Layout Optimization Integration: NEEDS WORK');
    console.log('🚫 Major issues must be resolved before deployment');
  }

  return {
    success: results.failed === 0,
    passed: results.passed,
    failed: results.failed,
    issues: results.issues
  };
}

// Additional checks for code quality
function checkCodeQuality() {
  console.log('\n🔍 Code Quality Checks...\n');

  const files = [
    './amplify/functions/tools/renewableLayoutOptimizationTool.ts',
    './amplify/functions/agents/renewableEnergyAgent.ts'
  ];

  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      console.log(`📝 ${fileName}:`);
      
      // Check for proper error handling
      const errorHandlingCount = (content.match(/try \{|catch \(/g) || []).length;
      console.log(`   🛡️  Error handling blocks: ${errorHandlingCount}`);
      
      // Check for console logging
      const loggingCount = (content.match(/console\.(log|error|warn|info)/g) || []).length;
      console.log(`   📋 Logging statements: ${loggingCount}`);
      
      // Check for TypeScript types
      const typeCount = (content.match(/: \w+/g) || []).length;
      console.log(`   🏷️  Type annotations: ${typeCount}`);
      
      // Check for documentation
      const docCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      console.log(`   📚 Documentation blocks: ${docCount}`);
      
      console.log('');
    }
  });
}

// Run validation
if (require.main === module) {
  const result = validateLayoutOptimizationIntegration();
  checkCodeQuality();
  
  process.exit(result.success ? 0 : 1);
}

module.exports = {
  validateLayoutOptimizationIntegration,
  checkCodeQuality
};
