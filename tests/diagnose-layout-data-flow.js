/**
 * Diagnostic Script: Layout Map Data Flow
 * 
 * Run this in browser console after layout optimization to see what data reaches the frontend
 */

console.log('🔍 LAYOUT MAP DATA FLOW DIAGNOSTIC');
console.log('=' .repeat(60));

// Instructions for user
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Run layout optimization in the UI');
console.log('2. Open browser DevTools Console (F12)');
console.log('3. Paste this entire script and press Enter');
console.log('4. Look for the diagnostic output below\n');

console.log('=' .repeat(60));

// Try to find the layout artifact data in the DOM
console.log('\n🔍 Searching for LayoutMapArtifact data...\n');

// Method 1: Check React DevTools (if available)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools detected');
  console.log('   → Open React DevTools and inspect LayoutMapArtifact component');
  console.log('   → Check the "data" prop');
} else {
  console.log('⚠️  React DevTools not detected');
}

// Method 2: Add a global hook to capture data
console.log('\n📌 Setting up data capture hook...');
console.log('   → Add this to LayoutMapArtifact.tsx temporarily:');
console.log('');
console.log('   useEffect(() => {');
console.log('     window.__LAYOUT_DEBUG__ = data;');
console.log('     console.log("🗺️ Layout Data:", data);');
console.log('   }, [data]);');
console.log('');

// Method 3: Check if data is already captured
if (window.__LAYOUT_DEBUG__) {
  const data = window.__LAYOUT_DEBUG__;
  
  console.log('\n✅ LAYOUT DATA FOUND!\n');
  console.log('=' .repeat(60));
  
  // Check GeoJSON
  console.log('\n📍 GeoJSON Analysis:');
  console.log(`   Has GeoJSON: ${!!data.geojson}`);
  
  if (data.geojson) {
    console.log(`   Feature count: ${data.geojson.features?.length || 0}`);
    
    if (data.geojson.features) {
      const turbines = data.geojson.features.filter(f => f.properties?.type === 'turbine');
      const terrain = data.geojson.features.filter(f => f.properties?.type !== 'turbine');
      
      console.log(`   Turbine features: ${turbines.length}`);
      console.log(`   Terrain features: ${terrain.length}`);
      
      if (turbines.length === 0) {
        console.log('\n❌ PROBLEM: No turbine features found!');
        console.log('   → Backend must include features with properties.type = "turbine"');
      } else {
        console.log('\n✅ Turbine features exist');
        console.log('   Sample turbine:', turbines[0]);
      }
      
      if (terrain.length === 0) {
        console.log('\n❌ PROBLEM: No terrain features found!');
        console.log('   → Backend must include OSM features (buildings, roads, water)');
      } else {
        console.log('\n✅ Terrain features exist');
        const types = {};
        terrain.forEach(f => {
          const type = f.properties?.type || 'unknown';
          types[type] = (types[type] || 0) + 1;
        });
        console.log('   Terrain breakdown:', types);
      }
    }
  } else {
    console.log('\n❌ PROBLEM: No GeoJSON in data!');
    console.log('   → Orchestrator/Strands Agent not passing GeoJSON to frontend');
  }
  
  // Check completedSteps
  console.log('\n\n🔄 Workflow State:');
  console.log(`   Has completedSteps: ${!!data.completedSteps}`);
  if (data.completedSteps) {
    console.log(`   Completed steps: ${data.completedSteps.join(', ')}`);
    
    if (data.completedSteps.includes('layout')) {
      console.log('   ✅ Wake button should be enabled');
    } else {
      console.log('   ❌ Wake button will NOT be enabled (missing "layout" step)');
    }
  } else {
    console.log('   ⚠️  completedSteps not provided - using fallback');
  }
  
  // Check other fields
  console.log('\n\n📊 Other Data Fields:');
  console.log(`   Project ID: ${data.projectId}`);
  console.log(`   Turbine count: ${data.turbineCount}`);
  console.log(`   Total capacity: ${data.totalCapacity} MW`);
  console.log(`   Layout type: ${data.layoutType}`);
  console.log(`   Turbine positions: ${data.turbinePositions?.length || 0}`);
  
  // Full data dump
  console.log('\n\n📦 Full Data Object:');
  console.log(JSON.stringify(data, null, 2));
  
} else {
  console.log('\n⚠️  No layout data captured yet');
  console.log('   → Run layout optimization first');
  console.log('   → Or add the debug hook to LayoutMapArtifact.tsx');
}

console.log('\n' + '=' .repeat(60));
console.log('✅ Diagnostic complete');
console.log('=' .repeat(60));
