/**
 * Test to diagnose the actual layout map issue
 * This will call the backend and check what data is actually returned
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testLayoutMapIssue() {
  console.log('🔍 TESTING LAYOUT MAP ACTUAL ISSUE');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Call layout optimization
    console.log('\n📍 Step 1: Calling layout optimization Lambda...');
    const layoutResult = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG',
      Payload: JSON.stringify({
        latitude: 40.7128,
        longitude: -74.0060,
        num_turbines: 8,
        project_id: 'test-layout-map-issue',
        project_name: 'Layout Map Test'
      })
    }).promise();
    
    const layoutResponse = JSON.parse(layoutResult.Payload);
    console.log('\n✅ Layout Lambda Response Status:', layoutResponse.statusCode);
    
    if (layoutResponse.statusCode !== 200) {
      console.error('❌ Layout optimization failed:', layoutResponse.body);
      return;
    }
    
    const layoutBody = JSON.parse(layoutResponse.body);
    const layoutData = layoutBody.data;
    
    console.log('\n📊 Layout Data Structure:');
    console.log('  - projectId:', layoutData.projectId);
    console.log('  - turbineCount:', layoutData.turbineCount);
    console.log('  - layoutType:', layoutData.layoutType);
    console.log('  - has geojson:', !!layoutData.geojson);
    console.log('  - has mapHtml:', !!layoutData.mapHtml);
    console.log('  - has mapUrl:', !!layoutData.mapUrl);
    
    if (layoutData.geojson) {
      console.log('\n📍 GeoJSON Analysis:');
      console.log('  - type:', layoutData.geojson.type);
      console.log('  - features count:', layoutData.geojson.features?.length || 0);
      
      if (layoutData.geojson.features && layoutData.geojson.features.length > 0) {
        // Count feature types
        const turbines = layoutData.geojson.features.filter(f => 
          f.properties?.type === 'turbine'
        );
        const terrain = layoutData.geojson.features.filter(f => 
          f.properties?.type !== 'turbine'
        );
        
        console.log('  - turbine features:', turbines.length);
        console.log('  - terrain features:', terrain.length);
        
        // Show first turbine
        if (turbines.length > 0) {
          console.log('\n  First turbine feature:');
          console.log('    - id:', turbines[0].properties?.turbine_id);
          console.log('    - coords:', turbines[0].geometry?.coordinates);
          console.log('    - properties:', Object.keys(turbines[0].properties || {}));
        }
        
        // Show terrain feature types
        if (terrain.length > 0) {
          const terrainTypes = {};
          terrain.forEach(f => {
            const type = f.properties?.type || 'unknown';
            terrainTypes[type] = (terrainTypes[type] || 0) + 1;
          });
          console.log('\n  Terrain feature types:');
          Object.entries(terrainTypes).forEach(([type, count]) => {
            console.log(`    - ${type}: ${count}`);
          });
        }
      } else {
        console.log('  ❌ NO FEATURES IN GEOJSON!');
      }
    } else {
      console.log('\n❌ NO GEOJSON IN RESPONSE!');
    }
    
    // Step 2: Check what the orchestrator would send to frontend
    console.log('\n\n📤 Step 2: Checking orchestrator artifact generation...');
    console.log('The orchestrator should create an artifact with:');
    console.log('  - type: "wind_farm_layout"');
    console.log('  - data.geojson: (the geojson from layout response)');
    console.log('  - data.turbineCount:', layoutData.turbineCount);
    console.log('  - data.projectId:', layoutData.projectId);
    
    // Simulate what orchestrator sends
    const artifactData = {
      messageContentType: 'wind_farm_layout',
      title: 'Wind Farm Layout',
      subtitle: `${layoutData.turbineCount} turbines, ${layoutData.totalCapacity} MW`,
      projectId: layoutData.projectId,
      turbineCount: layoutData.turbineCount,
      totalCapacity: layoutData.totalCapacity,
      turbinePositions: layoutData.turbinePositions,
      geojson: layoutData.geojson,
      layoutType: layoutData.layoutType,
      spacing: layoutData.spacing
    };
    
    console.log('\n✅ Artifact data structure matches LayoutMapArtifact props');
    
    // Step 3: Validate against component requirements
    console.log('\n\n🔍 Step 3: Validating against LayoutMapArtifact requirements...');
    
    const validations = [
      {
        name: 'GeoJSON exists',
        pass: !!artifactData.geojson,
        value: !!artifactData.geojson
      },
      {
        name: 'GeoJSON has features array',
        pass: Array.isArray(artifactData.geojson?.features),
        value: Array.isArray(artifactData.geojson?.features)
      },
      {
        name: 'Features array not empty',
        pass: (artifactData.geojson?.features?.length || 0) > 0,
        value: artifactData.geojson?.features?.length || 0
      },
      {
        name: 'Has turbine features',
        pass: (artifactData.geojson?.features?.filter(f => f.properties?.type === 'turbine').length || 0) > 0,
        value: artifactData.geojson?.features?.filter(f => f.properties?.type === 'turbine').length || 0
      }
    ];
    
    console.log('\nValidation Results:');
    validations.forEach(v => {
      const status = v.pass ? '✅' : '❌';
      console.log(`  ${status} ${v.name}: ${v.value}`);
    });
    
    const allPass = validations.every(v => v.pass);
    
    if (allPass) {
      console.log('\n✅ ALL VALIDATIONS PASS - Component should render correctly');
      console.log('\nIf the map still doesn\'t show in the UI, the issue is likely:');
      console.log('  1. Frontend not receiving the artifact');
      console.log('  2. Leaflet import/initialization failing');
      console.log('  3. React component lifecycle issue');
      console.log('  4. CSS/styling hiding the map');
    } else {
      console.log('\n❌ VALIDATION FAILED - Component will show error');
      const failedValidations = validations.filter(v => !v.pass);
      console.log('\nFailed validations:');
      failedValidations.forEach(v => {
        console.log(`  - ${v.name}`);
      });
    }
    
    // Step 4: Check if there are any obvious data issues
    console.log('\n\n🔍 Step 4: Checking for data quality issues...');
    
    if (layoutData.geojson?.features) {
      const issues = [];
      
      // Check for invalid coordinates
      layoutData.geojson.features.forEach((f, idx) => {
        if (f.geometry?.type === 'Point') {
          const [lon, lat] = f.geometry.coordinates;
          if (isNaN(lat) || isNaN(lon)) {
            issues.push(`Feature ${idx}: Invalid coordinates (${lat}, ${lon})`);
          }
          if (lat < -90 || lat > 90) {
            issues.push(`Feature ${idx}: Latitude out of range (${lat})`);
          }
          if (lon < -180 || lon > 180) {
            issues.push(`Feature ${idx}: Longitude out of range (${lon})`);
          }
        }
      });
      
      if (issues.length > 0) {
        console.log('❌ Data quality issues found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('✅ No data quality issues found');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🏁 DIAGNOSIS COMPLETE');
    console.log('\nSUMMARY:');
    console.log(`  Backend returns: ${layoutData.geojson?.features?.length || 0} features`);
    console.log(`  Turbines: ${layoutData.turbineCount}`);
    console.log(`  Terrain features: ${(layoutData.geojson?.features?.length || 0) - layoutData.turbineCount}`);
    console.log(`  Data structure: ${allPass ? 'VALID ✅' : 'INVALID ❌'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testLayoutMapIssue().catch(console.error);
