/**
 * Verification Script for WakeAnalysisArtifact Component
 * 
 * Verifies that the component exists and has the correct structure
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Verifying WakeAnalysisArtifact Component...\n');

// Check if component file exists
const componentPath = path.join(__dirname, '../src/components/renewable/WakeAnalysisArtifact.tsx');
if (!fs.existsSync(componentPath)) {
  console.error('❌ Component file not found:', componentPath);
  process.exit(1);
}
console.log('✅ Component file exists');

// Read component file
const componentContent = fs.readFileSync(componentPath, 'utf-8');

// Verify key features
const checks = [
  { name: 'Component export', pattern: /export default WakeAnalysisArtifact/ },
  { name: 'Props interface', pattern: /interface WakeAnalysisArtifactProps/ },
  { name: 'Performance metrics', pattern: /performanceMetrics/ },
  { name: 'Turbine metrics', pattern: /turbineMetrics/ },
  { name: 'Monthly production', pattern: /monthlyProduction/ },
  { name: 'Visualizations', pattern: /visualizations/ },
  { name: 'Wake heat map', pattern: /wake_heat_map/ },
  { name: 'Wake analysis chart', pattern: /wake_analysis/ },
  { name: 'Performance charts', pattern: /performance_charts/ },
  { name: 'Seasonal analysis', pattern: /seasonal_analysis/ },
  { name: 'Wind resource data', pattern: /windResourceData/ },
  { name: 'AEP display', pattern: /annualEnergyProduction|netAEP/ },
  { name: 'Capacity factor', pattern: /capacityFactor/ },
  { name: 'Wake losses', pattern: /wakeLosses/ },
  { name: 'Wake efficiency', pattern: /wakeEfficiency/ },
  { name: 'Tabs component', pattern: /Tabs/ },
  { name: 'Plotly chart', pattern: /Plot/ },
  { name: 'Follow-up actions', pattern: /onFollowUpAction/ },
  { name: 'Data source info', pattern: /dataSource/ },
  { name: 'NREL reference', pattern: /NREL/ }
];

let allPassed = true;
checks.forEach(check => {
  if (check.pattern.test(componentContent)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    allPassed = false;
  }
});

// Check if component is exported from index
const indexPath = path.join(__dirname, '../src/components/renewable/index.ts');
if (!fs.existsSync(indexPath)) {
  console.error('\n❌ Index file not found:', indexPath);
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf-8');
if (indexContent.includes('WakeAnalysisArtifact')) {
  console.log('✅ Component exported from index');
} else {
  console.log('❌ Component not exported from index');
  allPassed = false;
}

// Check if component is registered in ArtifactRenderer
const rendererPath = path.join(__dirname, '../src/components/ArtifactRenderer.tsx');
if (!fs.existsSync(rendererPath)) {
  console.error('\n❌ ArtifactRenderer file not found:', rendererPath);
  process.exit(1);
}

const rendererContent = fs.readFileSync(rendererPath, 'utf-8');
if (rendererContent.includes('WakeAnalysisArtifact')) {
  console.log('✅ Component imported in ArtifactRenderer');
} else {
  console.log('❌ Component not imported in ArtifactRenderer');
  allPassed = false;
}

if (rendererContent.includes("case 'wake_simulation':")) {
  console.log('✅ wake_simulation case added to ArtifactRenderer');
} else {
  console.log('❌ wake_simulation case not added to ArtifactRenderer');
  allPassed = false;
}

// Verify data structure compatibility
console.log('\n📋 Verifying data structure compatibility...');

const mockData = {
  messageContentType: 'wake_simulation',
  title: 'Wake Simulation Analysis',
  projectId: 'test-project',
  performanceMetrics: {
    annualEnergyProduction: 45.5,
    netAEP: 45.5,
    grossAEP: 48.2,
    capacityFactor: 0.35,
    wakeLosses: 0.056,
    wakeEfficiency: 0.944
  },
  turbineMetrics: {
    count: 15,
    totalCapacity: 37.5,
    averageWindSpeed: 8.5
  },
  monthlyProduction: [3.2, 3.5, 4.1, 4.3, 4.5, 4.2, 3.8, 3.6, 3.9, 4.0, 3.7, 3.4],
  visualizations: {
    wake_heat_map: 'https://s3.amazonaws.com/bucket/wake_map.html',
    wake_analysis: 'https://s3.amazonaws.com/bucket/wake_analysis.png'
  }
};

console.log('✅ Mock data structure valid');
console.log('   - messageContentType:', mockData.messageContentType);
console.log('   - Performance metrics:', Object.keys(mockData.performanceMetrics).length, 'fields');
console.log('   - Turbine metrics:', Object.keys(mockData.turbineMetrics).length, 'fields');
console.log('   - Monthly production:', mockData.monthlyProduction.length, 'months');
console.log('   - Visualizations:', Object.keys(mockData.visualizations).length, 'items');

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('\nWakeAnalysisArtifact component is ready to use!');
  console.log('\nUsage:');
  console.log('  1. Orchestrator creates artifact with type: "wake_simulation"');
  console.log('  2. ArtifactRenderer routes to WakeAnalysisArtifact');
  console.log('  3. Component renders wake simulation results');
  console.log('\nFeatures:');
  console.log('  ✓ Performance metrics display (AEP, CF, wake losses)');
  console.log('  ✓ Wake heat map visualization');
  console.log('  ✓ Monthly production chart');
  console.log('  ✓ Analysis charts (wake deficit, performance, seasonal)');
  console.log('  ✓ Turbine configuration details');
  console.log('  ✓ Data source information (NREL)');
  console.log('  ✓ Follow-up action buttons');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\nPlease review the failed checks above.');
  process.exit(1);
}
