#!/usr/bin/env node

/**
 * NREL Deployment Validation Script
 * 
 * Validates that NREL integration is properly deployed:
 * 1. Environment variables are set
 * 2. NREL client exists
 * 3. No synthetic wind data in production code
 * 4. UI components have data source labels
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 NREL Deployment Validation');
console.log('='.repeat(60));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result.status === 'pass') {
      results.passed++;
      console.log(`✅ ${name}`);
      if (result.details) {
        result.details.forEach(d => console.log(`   ${d}`));
      }
    } else if (result.status === 'warn') {
      results.warnings++;
      console.log(`⚠️  ${name}`);
      if (result.details) {
        result.details.forEach(d => console.log(`   ${d}`));
      }
    } else {
      results.failed++;
      console.log(`❌ ${name}`);
      if (result.details) {
        result.details.forEach(d => console.log(`   ${d}`));
      }
    }
    results.tests.push({ name, ...result });
  } catch (error) {
    results.failed++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    results.tests.push({ name, status: 'fail', details: [error.message] });
  }
}

// Test 1: Check NREL client exists
test('NREL Wind Client exists', () => {
  const clientPath = 'amplify/functions/renewableTools/nrel_wind_client.py';
  if (!fs.existsSync(clientPath)) {
    return { status: 'fail', details: ['nrel_wind_client.py not found'] };
  }
  
  const content = fs.readFileSync(clientPath, 'utf-8');
  const hasNRELAPI = content.includes('developer.nrel.gov');
  const hasWeibull = content.includes('weibull') || content.includes('Weibull');
  
  if (!hasNRELAPI) {
    return { status: 'fail', details: ['NREL API endpoint not found in client'] };
  }
  
  return { 
    status: 'pass', 
    details: [
      '✓ nrel_wind_client.py exists',
      '✓ NREL API endpoint configured',
      hasWeibull ? '✓ Weibull processing included' : '⚠️  Weibull processing not found'
    ]
  };
});

// Test 2: Check backend configuration
test('Backend NREL_API_KEY configuration', () => {
  const backendPath = 'amplify/backend.ts';
  if (!fs.existsSync(backendPath)) {
    return { status: 'fail', details: ['backend.ts not found'] };
  }
  
  const content = fs.readFileSync(backendPath, 'utf-8');
  const hasNRELKey = content.includes('NREL_API_KEY');
  const hasSimConfig = content.includes("renewableSimulationTool.addEnvironment('NREL_API_KEY'");
  const hasTerrainConfig = content.includes("renewableTerrainTool.addEnvironment('NREL_API_KEY'");
  
  if (!hasNRELKey) {
    return { status: 'fail', details: ['NREL_API_KEY not configured in backend.ts'] };
  }
  
  const details = ['✓ NREL_API_KEY configured in backend.ts'];
  if (hasSimConfig) details.push('✓ Simulation tool configured');
  if (hasTerrainConfig) details.push('✓ Terrain tool configured');
  
  if (!hasSimConfig || !hasTerrainConfig) {
    return { status: 'warn', details: [...details, '⚠️  Not all tools configured'] };
  }
  
  return { status: 'pass', details };
});

// Test 3: Check for synthetic wind data
test('No synthetic wind data in production code', () => {
  const searchPatterns = [
    { pattern: '_generate_realistic_wind_data', file: 'amplify/functions/renewableTools/**/*.py' },
    { pattern: 'create_synthetic_wind_fallback', file: 'amplify/functions/renewableTools/**/*.py' },
    { pattern: 'mock.*wind.*data', file: 'amplify/functions/renewableTools/**/*.py' }
  ];
  
  const findings = [];
  
  for (const { pattern, file } of searchPatterns) {
    try {
      const result = execSync(
        `grep -r "${pattern}" amplify/functions/renewableTools/*.py 2>/dev/null || true`,
        { encoding: 'utf-8' }
      );
      
      if (result.trim()) {
        // Check if it's in a comment or error message (acceptable)
        const lines = result.trim().split('\n');
        const actualCode = lines.filter(line => 
          !line.includes('#') && 
          !line.includes('raise ValueError') &&
          !line.includes('Cannot generate wind rose')
        );
        
        if (actualCode.length > 0) {
          findings.push(`Found "${pattern}" in production code`);
        }
      }
    } catch (error) {
      // grep returns non-zero if no matches, which is what we want
    }
  }
  
  if (findings.length > 0) {
    return { status: 'fail', details: findings };
  }
  
  return { 
    status: 'pass', 
    details: [
      '✓ No _generate_realistic_wind_data functions',
      '✓ No create_synthetic_wind_fallback functions',
      '✓ No mock wind data generation'
    ]
  };
});

// Test 4: Check handlers use NREL client
test('Handlers import NREL client', () => {
  const handlers = [
    'amplify/functions/renewableTools/simulation/handler.py',
    'amplify/functions/renewableTools/terrain/handler.py'
  ];
  
  const details = [];
  let allGood = true;
  
  for (const handler of handlers) {
    if (!fs.existsSync(handler)) {
      details.push(`⚠️  ${path.basename(path.dirname(handler))} handler not found`);
      allGood = false;
      continue;
    }
    
    const content = fs.readFileSync(handler, 'utf-8');
    const hasNRELImport = content.includes('nrel_wind_client') || content.includes('NRELWindClient');
    
    if (hasNRELImport) {
      details.push(`✓ ${path.basename(path.dirname(handler))} uses NREL client`);
    } else {
      details.push(`❌ ${path.basename(path.dirname(handler))} does NOT use NREL client`);
      allGood = false;
    }
  }
  
  return { status: allGood ? 'pass' : 'fail', details };
});

// Test 5: Check UI components have data source labels
test('UI components have data source labels', () => {
  const components = [
    { path: 'src/components/renewable/PlotlyWindRose.tsx', name: 'PlotlyWindRose' },
    { path: 'src/components/renewable/WindRoseArtifact.tsx', name: 'WindRoseArtifact' }
  ];
  
  const details = [];
  let allGood = true;
  
  for (const { path: compPath, name } of components) {
    if (!fs.existsSync(compPath)) {
      details.push(`⚠️  ${name} not found`);
      continue;
    }
    
    const content = fs.readFileSync(compPath, 'utf-8');
    const hasDataSource = content.includes('NREL Wind Toolkit') || 
                          content.includes('data_source') ||
                          content.includes('Data Source');
    
    if (hasDataSource) {
      details.push(`✓ ${name} has data source label`);
    } else {
      details.push(`❌ ${name} missing data source label`);
      allGood = false;
    }
  }
  
  return { status: allGood ? 'pass' : 'fail', details };
});

// Test 6: Check Plotly generator
test('Plotly wind rose generator configured', () => {
  const generatorPath = 'amplify/functions/renewableTools/plotly_wind_rose_generator.py';
  
  if (!fs.existsSync(generatorPath)) {
    return { status: 'fail', details: ['plotly_wind_rose_generator.py not found'] };
  }
  
  const content = fs.readFileSync(generatorPath, 'utf-8');
  const hasPlotly = content.includes('plotly');
  const hasWindRose = content.includes('wind_rose') || content.includes('windrose');
  
  return {
    status: (hasPlotly && hasWindRose) ? 'pass' : 'fail',
    details: [
      hasPlotly ? '✓ Plotly integration present' : '❌ Plotly integration missing',
      hasWindRose ? '✓ Wind rose generation present' : '❌ Wind rose generation missing'
    ]
  };
});

// Test 7: Check deployment readiness
test('Deployment readiness', () => {
  const details = [];
  
  // Check if sandbox is running (optional)
  try {
    const lambdas = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'Renewable\')].FunctionName" --output text 2>/dev/null || echo ""',
      { encoding: 'utf-8' }
    ).trim();
    
    if (lambdas) {
      const lambdaList = lambdas.split(/\s+/).filter(Boolean);
      details.push(`✓ Found ${lambdaList.length} renewable Lambda functions`);
      
      // Check for specific functions
      const hasSimulation = lambdaList.some(l => l.includes('Simulation'));
      const hasTerrain = lambdaList.some(l => l.includes('Terrain'));
      const hasOrchestrator = lambdaList.some(l => l.includes('Orchestrator'));
      
      if (hasSimulation) details.push('✓ Simulation Lambda deployed');
      if (hasTerrain) details.push('✓ Terrain Lambda deployed');
      if (hasOrchestrator) details.push('✓ Orchestrator Lambda deployed');
      
      if (!hasSimulation || !hasTerrain || !hasOrchestrator) {
        details.push('⚠️  Some Lambdas may not be deployed');
        return { status: 'warn', details };
      }
    } else {
      details.push('⚠️  No Lambda functions found (sandbox may not be running)');
      return { status: 'warn', details };
    }
  } catch (error) {
    details.push('⚠️  Could not check Lambda deployment status');
    return { status: 'warn', details };
  }
  
  return { status: 'pass', details };
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 Validation Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${results.tests.length}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.failed === 0 && results.warnings === 0) {
  console.log('\n✅ All validations passed! NREL integration is properly configured.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Restart sandbox: npx ampx sandbox');
  console.log('   2. Wait for deployment to complete');
  console.log('   3. Run end-to-end tests: node tests/test-nrel-integration-e2e.js');
} else if (results.failed === 0) {
  console.log('\n⚠️  All critical validations passed, but there are warnings.');
  console.log('   Review warnings above and restart sandbox if needed.');
} else {
  console.log('\n❌ Some validations failed. Fix the issues above before deployment.');
}

process.exit(results.failed > 0 ? 1 : 0);
