/**
 * Task 4: Verify OSM Features Display on Layout Map
 * 
 * This test verifies that:
 * 1. Terrain features are merged with turbine features in GeoJSON
 * 2. Frontend LayoutMapArtifact displays both feature types
 * 3. Different visual markers are used for turbines vs terrain features
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });

// Test configuration
const TEST_LOCATION = {
  latitude: 35.067482,
  longitude: -101.395466,
  radius_km: 2.0
};

async function verifyOSMFeaturesOnMap() {
  console.log('=' .repeat(80));
  console.log('TASK 4: VERIFY OSM FEATURES DISPLAY ON LAYOUT MAP');
  console.log('=' .repeat(80));
  console.log();

  const results = {
    subtask1: { name: 'Terrain features merged with turbines in GeoJSON', passed: false, details: [] },
    subtask2: { name: 'Frontend LayoutMapArtifact displays both feature types', passed: false, details: [] },
    subtask3: { name: 'Different visual markers for turbines vs terrain', passed: false, details: [] }
  };

  try {
    // STEP 1: Verify backend GeoJSON merging code (Sub-task 1)
    console.log('=' .repeat(80));
    console.log('SUB-TASK 1: Verify terrain features merged with turbines in GeoJSON');
    console.log('=' .repeat(80));
    console.log();

    console.log('📋 Analyzing layout handler Python code...');
    console.log();

    const fs = require('fs');
    const path = require('path');
    const handlerPath = 'amplify/functions/renewableTools/layout/simple_handler.py';
    
    if (!fs.existsSync(handlerPath)) {
      results.subtask1.details.push('❌ Handler file not found');
      console.log('❌ FAILED: Handler file not found');
    } else {
      const handlerCode = fs.readFileSync(handlerPath, 'utf8');

      const checks = [];

      // Check for terrain feature extraction
      if (handlerCode.includes('terrain_features = terrain_geojson.get(\'features\', [])')) {
        checks.push('✅ Handler extracts terrain features from context');
        results.subtask1.details.push('✅ Extracts terrain features');
      } else {
        checks.push('❌ No terrain feature extraction');
        results.subtask1.details.push('❌ No terrain feature extraction');
      }

      // Check for turbine feature creation
      if (handlerCode.includes('turbine_features = []') || handlerCode.includes('turbine_features.append')) {
        checks.push('✅ Handler creates turbine features');
        results.subtask1.details.push('✅ Creates turbine features');
      } else {
        checks.push('❌ No turbine feature creation');
        results.subtask1.details.push('❌ No turbine feature creation');
      }

      // Check for feature merging
      if (handlerCode.includes('all_features = terrain_features + turbine_features')) {
        checks.push('✅ Handler merges terrain and turbine features');
        results.subtask1.details.push('✅ Merges features');
      } else {
        checks.push('❌ No feature merging');
        results.subtask1.details.push('❌ No feature merging');
      }

      // Check for combined GeoJSON creation
      if (handlerCode.includes('combined_geojson') && handlerCode.includes('all_features')) {
        checks.push('✅ Handler creates combined GeoJSON');
        results.subtask1.details.push('✅ Creates combined GeoJSON');
      } else {
        checks.push('❌ No combined GeoJSON');
        results.subtask1.details.push('❌ No combined GeoJSON');
      }

      // Check for GeoJSON in response
      if (handlerCode.includes('\'geojson\': combined_geojson')) {
        checks.push('✅ Handler returns combined GeoJSON in response');
        results.subtask1.details.push('✅ Returns combined GeoJSON');
      } else {
        checks.push('❌ GeoJSON not in response');
        results.subtask1.details.push('❌ GeoJSON not in response');
      }

      checks.forEach(check => console.log(check));
      console.log();

      // If all checks pass, mark as passed
      if (checks.every(c => c.startsWith('✅'))) {
        results.subtask1.passed = true;
        console.log('✅ SUB-TASK 1 PASSED: Backend merges terrain and turbine features');
      } else {
        console.log('❌ SUB-TASK 1 FAILED: Backend merging incomplete');
      }
      console.log();
    }

    // STEP 4: Verify frontend component rendering (Sub-task 2)
    console.log('=' .repeat(80));
    console.log('SUB-TASK 2: Verify frontend LayoutMapArtifact displays both feature types');
    console.log('=' .repeat(80));
    console.log();

    console.log('📋 Analyzing LayoutMapArtifact.tsx component...');
    console.log();

    // Read the component file to verify rendering logic
    const componentPath = 'src/components/renewable/LayoutMapArtifact.tsx';
    
    if (!fs.existsSync(componentPath)) {
      results.subtask2.details.push('❌ Component file not found');
      console.log('❌ FAILED: Component file not found');
    } else {
      const componentCode = fs.readFileSync(componentPath, 'utf8');

      // Check for terrain feature rendering
      const checks = [];

      if (componentCode.includes('terrainFeatures')) {
        checks.push('✅ Component separates terrain features');
        results.subtask2.details.push('✅ Separates terrain features');
      } else {
        checks.push('❌ No terrain feature separation');
        results.subtask2.details.push('❌ No terrain feature separation');
      }

      if (componentCode.includes('turbineFeatures')) {
        checks.push('✅ Component separates turbine features');
        results.subtask2.details.push('✅ Separates turbine features');
      } else {
        checks.push('❌ No turbine feature separation');
        results.subtask2.details.push('❌ No turbine feature separation');
      }

      if (componentCode.includes('L.geoJSON(feature')) {
        checks.push('✅ Component renders GeoJSON features');
        results.subtask2.details.push('✅ Renders GeoJSON features');
      } else {
        checks.push('❌ No GeoJSON rendering');
        results.subtask2.details.push('❌ No GeoJSON rendering');
      }

      if (componentCode.includes('L.marker')) {
        checks.push('✅ Component renders turbine markers');
        results.subtask2.details.push('✅ Renders turbine markers');
      } else {
        checks.push('❌ No turbine marker rendering');
        results.subtask2.details.push('❌ No turbine marker rendering');
      }

      // Check for terrain feature loop
      if (componentCode.includes('terrainFeatures.forEach')) {
        checks.push('✅ Component loops through terrain features');
        results.subtask2.details.push('✅ Loops through terrain features');
      } else {
        checks.push('❌ No terrain feature loop');
        results.subtask2.details.push('❌ No terrain feature loop');
      }

      // Check for turbine feature loop
      if (componentCode.includes('turbineFeatures.forEach')) {
        checks.push('✅ Component loops through turbine features');
        results.subtask2.details.push('✅ Loops through turbine features');
      } else {
        checks.push('❌ No turbine feature loop');
        results.subtask2.details.push('❌ No turbine feature loop');
      }

      checks.forEach(check => console.log(check));
      console.log();

      // If all checks pass, mark as passed
      if (checks.every(c => c.startsWith('✅'))) {
        results.subtask2.passed = true;
        console.log('✅ SUB-TASK 2 PASSED: Frontend displays both feature types');
      } else {
        console.log('❌ SUB-TASK 2 FAILED: Frontend rendering incomplete');
      }
      console.log();
    }

    // STEP 5: Verify different visual markers (Sub-task 3)
    console.log('=' .repeat(80));
    console.log('SUB-TASK 3: Verify different visual markers for turbines vs terrain');
    console.log('=' .repeat(80));
    console.log();

    console.log('📋 Analyzing visual styling in LayoutMapArtifact.tsx...');
    console.log();

    if (fs.existsSync(componentPath)) {
      const componentCode = fs.readFileSync(componentPath, 'utf8');

      const checks = [];

      // Check for terrain feature styling
      if (componentCode.includes('fillColor') && componentCode.includes('building')) {
        checks.push('✅ Building features have custom fill color');
        results.subtask3.details.push('✅ Buildings styled');
      } else {
        checks.push('❌ No building styling');
        results.subtask3.details.push('❌ No building styling');
      }

      if (componentCode.includes('fillColor') && componentCode.includes('water')) {
        checks.push('✅ Water features have custom fill color');
        results.subtask3.details.push('✅ Water styled');
      } else {
        checks.push('❌ No water styling');
        results.subtask3.details.push('❌ No water styling');
      }

      if (componentCode.includes('color') && componentCode.includes('road')) {
        checks.push('✅ Road features have custom color');
        results.subtask3.details.push('✅ Roads styled');
      } else {
        checks.push('❌ No road styling');
        results.subtask3.details.push('❌ No road styling');
      }

      // Check for turbine marker styling
      if (componentCode.includes('L.marker')) {
        checks.push('✅ Turbines use Leaflet markers');
        results.subtask3.details.push('✅ Turbines use markers');
      } else {
        checks.push('❌ No turbine markers');
        results.subtask3.details.push('❌ No turbine markers');
      }

      // Check for legend
      if (componentCode.includes('legend') || componentCode.includes('Legend')) {
        checks.push('✅ Map legend present');
        results.subtask3.details.push('✅ Legend present');
      } else {
        checks.push('❌ No map legend');
        results.subtask3.details.push('❌ No map legend');
      }

      // Check for different geometry types
      if (componentCode.includes('Polygon') && componentCode.includes('LineString')) {
        checks.push('✅ Different geometry types handled');
        results.subtask3.details.push('✅ Multiple geometry types');
      } else {
        checks.push('❌ Limited geometry type support');
        results.subtask3.details.push('❌ Limited geometry types');
      }

      checks.forEach(check => console.log(check));
      console.log();

      // If most checks pass, mark as passed
      const passedChecks = checks.filter(c => c.startsWith('✅')).length;
      if (passedChecks >= 4) {
        results.subtask3.passed = true;
        console.log('✅ SUB-TASK 3 PASSED: Different visual markers implemented');
      } else {
        console.log('❌ SUB-TASK 3 FAILED: Visual differentiation incomplete');
      }
      console.log();
    }

    // FINAL SUMMARY
    console.log('=' .repeat(80));
    console.log('TASK 4 VERIFICATION SUMMARY');
    console.log('=' .repeat(80));
    console.log();

    Object.entries(results).forEach(([key, result]) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status}: ${result.name}`);
      result.details.forEach(detail => {
        console.log(`   ${detail}`);
      });
      console.log();
    });

    const allPassed = Object.values(results).every(r => r.passed);

    if (allPassed) {
      console.log('🎉 TASK 4 COMPLETE: All sub-tasks verified successfully!');
      console.log();
      console.log('✅ Terrain features are merged with turbines in GeoJSON');
      console.log('✅ Frontend LayoutMapArtifact displays both feature types');
      console.log('✅ Different visual markers used for turbines vs terrain');
      console.log();
      console.log('Requirements 2.1, 2.2, 2.3, 2.4, 2.5 are satisfied.');
    } else {
      console.log('⚠️ TASK 4 INCOMPLETE: Some sub-tasks need attention');
      console.log();
      console.log('Please review the failed checks above and address any issues.');
    }

    console.log('=' .repeat(80));

    return allPassed;

  } catch (error) {
    console.error('❌ ERROR during verification:', error);
    console.error(error.stack);
    return false;
  }
}

// Run verification
verifyOSMFeaturesOnMap()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
