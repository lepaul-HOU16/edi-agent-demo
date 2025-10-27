/**
 * Diagnostic Script: Layout Map UI Issues
 * 
 * Tests to identify why:
 * 1. Turbines don't show up on the map
 * 2. Terrain features don't show up on the map
 * 3. Wake button doesn't work
 * 4. Optimize button is repetitive
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

// Test data structure from layout Lambda
const testLayoutResponse = {
  messageContentType: 'wind_farm_layout',
  title: 'Wind Farm Layout',
  subtitle: 'Optimized turbine placement',
  projectId: 'test-project-123',
  turbineCount: 10,
  totalCapacity: 25.0,
  turbinePositions: [
    { lat: 35.0, lng: -101.0, id: 'T1' },
    { lat: 35.001, lng: -101.001, id: 'T2' }
  ],
  geojson: {
    type: 'FeatureCollection',
    features: [
      // Turbine features
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-101.0, 35.0]
        },
        properties: {
          type: 'turbine',
          turbine_id: 'T1',
          capacity_MW: 2.5,
          hub_height_m: 80,
          rotor_diameter_m: 100
        }
      },
      // Terrain features
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-101.01, 35.01],
            [-101.01, 35.02],
            [-101.02, 35.02],
            [-101.02, 35.01],
            [-101.01, 35.01]
          ]]
        },
        properties: {
          type: 'building',
          name: 'Test Building'
        }
      }
    ]
  }
};

console.log('🔍 DIAGNOSTIC: Layout Map UI Issues\n');
console.log('=' .repeat(60));

// Issue 1: Turbines not showing
console.log('\n📍 ISSUE 1: Turbines Not Showing');
console.log('-'.repeat(60));

const turbineFeatures = testLayoutResponse.geojson.features.filter(f => 
  f.properties?.type === 'turbine'
);

console.log(`✓ Turbine features in GeoJSON: ${turbineFeatures.length}`);
console.log(`✓ Turbine positions array: ${testLayoutResponse.turbinePositions.length}`);

if (turbineFeatures.length === 0) {
  console.log('❌ PROBLEM: No turbine features in GeoJSON!');
  console.log('   → Backend must include turbine features with type="turbine"');
} else {
  console.log('✓ Turbine features exist in GeoJSON');
  console.log('   Sample turbine:', JSON.stringify(turbineFeatures[0], null, 2));
}

// Check coordinate format
const firstTurbine = turbineFeatures[0];
if (firstTurbine) {
  const coords = firstTurbine.geometry.coordinates;
  console.log(`\n   Coordinate format: [${coords[0]}, ${coords[1]}]`);
  console.log(`   Expected: [lng, lat] = [${coords[0]}, ${coords[1]}]`);
  console.log(`   Leaflet expects: [lat, lng] = [${coords[1]}, ${coords[0]}]`);
  
  if (Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) {
    console.log('❌ PROBLEM: Coordinates out of valid range!');
  } else {
    console.log('✓ Coordinates in valid range');
  }
}

// Issue 2: Terrain features not showing
console.log('\n\n🏔️ ISSUE 2: Terrain Features Not Showing');
console.log('-'.repeat(60));

const terrainFeatures = testLayoutResponse.geojson.features.filter(f => 
  f.properties?.type !== 'turbine'
);

console.log(`✓ Terrain features in GeoJSON: ${terrainFeatures.length}`);

if (terrainFeatures.length === 0) {
  console.log('❌ PROBLEM: No terrain features in GeoJSON!');
  console.log('   → Backend must merge terrain context into layout response');
} else {
  console.log('✓ Terrain features exist in GeoJSON');
  
  const featureTypes = {};
  terrainFeatures.forEach(f => {
    const type = f.properties?.type || 'unknown';
    featureTypes[type] = (featureTypes[type] || 0) + 1;
  });
  
  console.log('\n   Feature breakdown:');
  Object.entries(featureTypes).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });
}

// Issue 3: Wake button not working
console.log('\n\n⚡ ISSUE 3: Wake Button Not Working');
console.log('-'.repeat(60));

// Check WorkflowCTAButtons logic
const completedSteps = ['terrain', 'layout'];
console.log(`Completed steps: ${completedSteps.join(', ')}`);

const WORKFLOW_BUTTONS = [
  {
    step: 'terrain',
    label: 'Optimize Turbine Layout',
    action: 'optimize turbine layout',
  },
  {
    step: 'layout',
    label: 'Run Wake Simulation',
    action: 'run wake simulation',
  }
];

const enabledButtons = WORKFLOW_BUTTONS.filter(button => 
  completedSteps.includes(button.step)
);

console.log(`\nEnabled buttons: ${enabledButtons.length}`);
enabledButtons.forEach(btn => {
  console.log(`  - ${btn.label} (action: "${btn.action}")`);
});

if (enabledButtons.some(btn => btn.label === 'Run Wake Simulation')) {
  console.log('\n✓ Wake button should be enabled');
  console.log('  → Check if onClick handler is properly wired');
  console.log('  → Check if onAction prop is passed correctly');
} else {
  console.log('\n❌ PROBLEM: Wake button not enabled!');
  console.log('   → "layout" step must be in completedSteps array');
}

// Issue 4: Repetitive optimize button
console.log('\n\n🔄 ISSUE 4: Repetitive Optimize Button');
console.log('-'.repeat(60));

// Check if both ActionButtons and WorkflowCTAButtons render optimize button
const hasActionButtons = true; // Assuming actions prop is passed
const hasWorkflowButtons = true; // WorkflowCTAButtons always renders

console.log('Components rendering buttons:');
console.log(`  - ActionButtons: ${hasActionButtons ? 'YES' : 'NO'}`);
console.log(`  - WorkflowCTAButtons: ${hasWorkflowButtons ? 'YES' : 'NO'}`);

if (hasActionButtons && hasWorkflowButtons) {
  console.log('\n❌ PROBLEM: Both components rendering buttons!');
  console.log('   → This causes duplicate "Optimize" buttons');
  console.log('   → Solution: Only render WorkflowCTAButtons OR ActionButtons, not both');
  console.log('\n   Recommended fix:');
  console.log('   1. Remove ActionButtons from LayoutMapArtifact');
  console.log('   2. Keep only WorkflowCTAButtons for consistent workflow');
  console.log('   3. OR: Conditionally render based on actions prop');
} else {
  console.log('\n✓ Only one button component rendering');
}

// Summary
console.log('\n\n📋 SUMMARY OF ISSUES');
console.log('='.repeat(60));

const issues = [];

if (turbineFeatures.length === 0) {
  issues.push({
    issue: 'Turbines not showing',
    cause: 'No turbine features in GeoJSON',
    fix: 'Backend must include turbine features with type="turbine"'
  });
}

if (terrainFeatures.length === 0) {
  issues.push({
    issue: 'Terrain features not showing',
    cause: 'No terrain features in GeoJSON',
    fix: 'Backend must merge terrain context into layout response'
  });
}

if (!enabledButtons.some(btn => btn.label === 'Run Wake Simulation')) {
  issues.push({
    issue: 'Wake button not enabled',
    cause: '"layout" step not in completedSteps',
    fix: 'Orchestrator must pass completedSteps=["terrain", "layout"]'
  });
}

if (hasActionButtons && hasWorkflowButtons) {
  issues.push({
    issue: 'Duplicate optimize buttons',
    cause: 'Both ActionButtons and WorkflowCTAButtons rendering',
    fix: 'Remove ActionButtons or make conditional'
  });
}

if (issues.length === 0) {
  console.log('✅ No issues detected in test data structure!');
  console.log('   → Issues may be in actual backend responses');
  console.log('   → Run this script against real Lambda responses');
} else {
  console.log(`Found ${issues.length} issue(s):\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.issue}`);
    console.log(`   Cause: ${issue.cause}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('Next steps:');
console.log('1. Test with actual layout Lambda response');
console.log('2. Check browser console for Leaflet errors');
console.log('3. Verify GeoJSON structure from backend');
console.log('4. Test button click handlers in browser DevTools');
