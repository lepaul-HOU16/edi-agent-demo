/**
 * Direct test of S3 MCP tools to debug artifact and data issues
 */

// Import the MCP tools directly to test them locally
const { listWellsTool, getWellInfoTool } = require('./amplify/functions/tools/petrophysicsTools.ts');

console.log('🔍 === DIRECT S3 MCP TOOL TEST ===');
console.log('🎯 Testing if MCP tools can access S3 and return real data');

async function testS3Access() {
  try {
    console.log('\n📋 Step 1: Testing listWellsTool...');
    const listWellsResult = await listWellsTool.func({});
    console.log('📤 listWellsTool raw result type:', typeof listWellsResult);
    
    let parsedWellsResult;
    if (typeof listWellsResult === 'string') {
      parsedWellsResult = JSON.parse(listWellsResult);
    } else {
      parsedWellsResult = listWellsResult;
    }
    
    console.log('📊 listWellsTool parsed result:', {
      success: parsedWellsResult.success,
      wellCount: parsedWellsResult.count || 0,
      firstFewWells: parsedWellsResult.wells?.slice(0, 3) || 'No wells',
      bucket: parsedWellsResult.bucket,
      error: parsedWellsResult.error
    });
    
    if (!parsedWellsResult.success || !parsedWellsResult.wells || parsedWellsResult.wells.length === 0) {
      console.log('❌ CRITICAL: listWellsTool failing - S3 access broken');
      console.log('💡 This explains why log curves are missing');
      return;
    }
    
    console.log('✅ listWellsTool working - found', parsedWellsResult.count, 'wells');
    
    // Test getting well info for the first well
    const testWell = parsedWellsResult.wells[0];
    console.log('\n📋 Step 2: Testing getWellInfoTool for well:', testWell);
    
    const getWellInfoResult = await getWellInfoTool.func({ wellName: testWell });
    console.log('📤 getWellInfoTool raw result type:', typeof getWellInfoResult);
    
    let parsedWellInfoResult;
    if (typeof getWellInfoResult === 'string') {
      parsedWellInfoResult = JSON.parse(getWellInfoResult);
    } else {
      parsedWellInfoResult = getWellInfoResult;
    }
    
    console.log('📊 getWellInfoTool parsed result:', {
      success: parsedWellInfoResult.success,
      wellName: parsedWellInfoResult.wellName,
      curveCount: parsedWellInfoResult.availableCurves?.length || 0,
      curves: parsedWellInfoResult.availableCurves?.slice(0, 5) || 'No curves',
      error: parsedWellInfoResult.error
    });
    
    if (!parsedWellInfoResult.success || !parsedWellInfoResult.availableCurves || parsedWellInfoResult.availableCurves.length === 0) {
      console.log('❌ CRITICAL: getWellInfoTool failing - LAS file parsing broken');
      console.log('💡 This explains why log curves are empty');
      return;
    }
    
    console.log('✅ getWellInfoTool working - found', parsedWellInfoResult.availableCurves.length, 'curves');
    console.log('📋 Real S3 curves found:', parsedWellInfoResult.availableCurves.join(', '));
    
    // Test comprehensive tools that should generate artifacts
    console.log('\n📋 Step 3: Testing comprehensive tools for artifacts...');
    
    // Import and test comprehensive shale analysis tool
    const { comprehensiveShaleAnalysisTool } = require('./amplify/functions/tools/petrophysicsTools.ts');
    
    console.log('🪨 Testing comprehensiveShaleAnalysisTool...');
    const shaleResult = await comprehensiveShaleAnalysisTool.func({
      analysisType: 'single_well',
      wellNames: [testWell]
    });
    
    let parsedShaleResult;
    if (typeof shaleResult === 'string') {
      parsedShaleResult = JSON.parse(shaleResult);
    } else {
      parsedShaleResult = shaleResult;
    }
    
    console.log('📊 comprehensiveShaleAnalysisTool result:', {
      success: parsedShaleResult.success,
      hasArtifacts: Array.isArray(parsedShaleResult.artifacts),
      artifactCount: parsedShaleResult.artifacts?.length || 0,
      hasResult: !!parsedShaleResult.result,
      messageContentType: parsedShaleResult.result?.messageContentType || parsedShaleResult.artifacts?.[0]?.messageContentType || 'MISSING'
    });
    
    if (!parsedShaleResult.artifacts || parsedShaleResult.artifacts.length === 0) {
      console.log('❌ CRITICAL: comprehensiveShaleAnalysisTool not generating artifacts');
      console.log('💡 This explains why no visualization components appear');
    } else {
      console.log('✅ comprehensiveShaleAnalysisTool generating artifacts correctly');
    }
    
  } catch (error) {
    console.error('💥 Direct S3 MCP tool test failed:', error.message);
    console.log('🔧 This suggests there are import or execution issues with the MCP tools');
  }
}

testS3Access().catch(console.error);
