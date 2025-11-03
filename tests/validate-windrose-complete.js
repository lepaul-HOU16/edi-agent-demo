#!/usr/bin/env node

/**
 * Complete Wind Rose Validation
 * Tests all layers: Backend → Orchestrator → Frontend
 */

console.log('🔍 Wind Rose Complete Validation\n');
console.log('='.repeat(60));

// Validation checklist
const checks = {
  backend: {
    name: 'Backend (simulation/handler.py)',
    items: [
      'Imports generate_plotly_wind_rose function',
      'Calls generate_plotly_wind_rose with wind data',
      'Includes plotlyWindRose in response',
      'Includes visualizations.wind_rose as fallback'
    ]
  },
  orchestrator: {
    name: 'Orchestrator (renewableOrchestrator/handler.ts)',
    items: [
      'Maps result.data.plotlyWindRose to artifact',
      'Maps result.data.visualizations.wind_rose to visualizationUrl',
      'Passes both fields to frontend'
    ]
  },
  frontend: {
    name: 'Frontend (WindRoseArtifact.tsx)',
    items: [
      'Checks data.plotlyWindRose first',
      'Renders PlotlyWindRose component if present',
      'Falls back to PNG if plotlyWindRose missing',
      'Falls back to SVG if both missing'
    ]
  },
  component: {
    name: 'PlotlyWindRose Component',
    items: [
      'Accepts data and layout props',
      'Renders Plotly barpolar chart',
      'Uses dark background styling',
      'Shows interactive hover tooltips'
    ]
  }
};

console.log('\n📋 VALIDATION CHECKLIST\n');

Object.entries(checks).forEach(([key, section]) => {
  console.log(`\n${section.name}:`);
  section.items.forEach((item, idx) => {
    console.log(`   ${idx + 1}. ${item}`);
  });
});

console.log('\n\n' + '='.repeat(60));
console.log('MANUAL TESTING STEPS');
console.log('='.repeat(60));

console.log(`
1. BACKEND TEST (Python)
   -------------------------
   File: amplify/functions/renewableTools/simulation/handler.py
   
   Check logs for:
   ✓ "Creating Plotly wind rose data"
   ✓ "Saved Plotly wind rose data to S3"
   ✓ "Added Plotly wind rose data to response"
   
   If missing:
   - Check VISUALIZATIONS_AVAILABLE flag
   - Check plotly_wind_rose_generator.py import
   - Check generate_plotly_wind_rose function call

2. ORCHESTRATOR TEST (TypeScript)
   --------------------------------
   File: amplify/functions/renewableOrchestrator/handler.ts
   Lines: ~1620-1640
   
   Verify artifact includes:
   ✓ plotlyWindRose: result.data.plotlyWindRose
   ✓ visualizationUrl: result.data.visualizations?.wind_rose
   
   Add console.log to verify:
   console.log('Wind rose artifact:', {
     hasPlotly: !!artifact.data.plotlyWindRose,
     hasVisualizationUrl: !!artifact.data.visualizationUrl
   });

3. FRONTEND TEST (Browser)
   -------------------------
   File: src/components/renewable/WindRoseArtifact.tsx
   
   Open browser console and check:
   ✓ data.plotlyWindRose exists (should be object)
   ✓ data.plotlyWindRose.data is array
   ✓ data.plotlyWindRose.layout is object
   
   Add to component (line ~227):
   console.log('WindRoseArtifact data:', {
     hasPlotlyWindRose: !!data.plotlyWindRose,
     hasVisualizationUrl: !!data.visualizationUrl,
     hasWindRoseData: !!data.windRoseData
   });

4. COMPONENT TEST (PlotlyWindRose)
   ---------------------------------
   File: src/components/renewable/PlotlyWindRose.tsx
   
   Check browser console for:
   ✓ No errors loading react-plotly.js
   ✓ Plotly chart renders
   ✓ Interactive features work (hover, zoom)
   
   If chart doesn't render:
   - Check browser console for errors
   - Check Network tab for failed requests
   - Verify Plotly.js loaded successfully

5. END-TO-END TEST
   ----------------
   Query: "show me a wind rose for 35.067482, -101.395466"
   
   Expected result:
   ✓ Interactive Plotly wind rose displays
   ✓ Dark background (#1a1a1a)
   ✓ 16 directional sectors
   ✓ Stacked bars for speed ranges
   ✓ Hover shows direction, speed, frequency
   ✓ Legend shows speed ranges
   
   If PNG shows instead:
   - Backend generated Plotly data but orchestrator didn't pass it
   - Check orchestrator logs
   
   If SVG shows instead:
   - Backend didn't generate Plotly data
   - Check backend logs for errors
   
   If "No data" shows:
   - Complete failure in data pipeline
   - Check all Lambda logs
`);

console.log('\n' + '='.repeat(60));
console.log('DEBUGGING COMMANDS');
console.log('='.repeat(60));

console.log(`
# Check backend logs (simulation Lambda)
aws logs tail /aws/lambda/[simulation-function-name] --follow

# Check orchestrator logs
aws logs tail /aws/lambda/[orchestrator-function-name] --follow

# Test backend directly
node tests/debug-windrose-flow.js

# Check deployed functions
aws lambda list-functions | grep -i renewable
`);

console.log('\n' + '='.repeat(60));
console.log('COMMON ISSUES & FIXES');
console.log('='.repeat(60));

console.log(`
Issue 1: "plotlyWindRose is undefined"
---------------------------------------
Cause: Backend not generating Plotly data
Fix: Check simulation/handler.py logs for errors
     Verify VISUALIZATIONS_AVAILABLE = True
     Verify plotly_wind_rose_generator.py imported

Issue 2: "PNG shows instead of Plotly"
---------------------------------------
Cause: Orchestrator not passing plotlyWindRose
Fix: Verify handler.ts line ~1633 includes:
     plotlyWindRose: result.data.plotlyWindRose

Issue 3: "Plotly component doesn't render"
------------------------------------------
Cause: Frontend component error
Fix: Check browser console for errors
     Verify react-plotly.js loaded
     Check PlotlyWindRose component props

Issue 4: "Chart is blank/empty"
--------------------------------
Cause: Invalid data format
Fix: Verify data structure matches Plotly barpolar format
     Check data.plotlyWindRose.data is array of traces
     Check each trace has type: 'barpolar'
`);

console.log('\n' + '='.repeat(60));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(60));

console.log(`
Next steps:
1. Run the query in browser
2. Check browser console for data
3. Verify which component renders
4. Report results

If Plotly wind rose shows: ✅ WORKING
If PNG shows: ⚠️  Backend issue
If SVG shows: ❌ Complete failure
`);
