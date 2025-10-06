/**
 * COMPREHENSIVE VALIDATION: Prompts 4&5 Fix + Shale Hallucination Fix
 * Tests both the intent detection improvements and the shale analysis text accuracy
 */

const axios = require('axios');

const GRAPHQL_ENDPOINT = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';

// Test prompts
const PROMPTS = {
  // Prompt 3: Shale Analysis - Should now show "Single well (WELL-001) analyzed" not "5 wells analyzed"
  SHALE_ANALYSIS: 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.',
  
  // Prompt 4: Should trigger porosity_analysis_workflow → comprehensive_porosity_analysis
  INTEGRATED_POROSITY: 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.',
  
  // Prompt 5: Should trigger calculate_porosity → different response than prompt 4
  PROFESSIONAL_POROSITY: 'Calculate porosity for WELL-001 using enhanced professional methodology. Include density porosity, neutron porosity, and effective porosity calculations with statistical analysis, uncertainty assessment, and complete technical documentation following SPE/API standards.'
};

console.log('🧪 === COMPREHENSIVE FIX VALIDATION TEST ===');
console.log('📅 Test Date:', new Date().toISOString());
console.log('🎯 Testing: 1) Shale hallucination fix, 2) Prompts 4&5 differentiation');

async function validateFixes() {
  const mutation = `
    mutation SendChatMessage($input: SendChatMessageInput!) {
      sendChatMessage(input: $input) {
        id
        role
        content
        artifacts
        responseComplete
      }
    }
  `;
  
  let results = {
    shaleAnalysis: null,
    integratedPorosity: null,
    professionalPorosity: null
  };

  // Test 1: Shale Analysis Hallucination Fix
  console.log('\n🧪 === TEST 1: SHALE ANALYSIS HALLUCINATION FIX ===');
  console.log('🎯 Expected: "Single well (WELL-001) analyzed" NOT "5 wells analyzed"');
  
  try {
    const shaleResponse = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `shale-fix-test-${Date.now()}`,
          content: PROMPTS.SHALE_ANALYSIS,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    });

    const result = shaleResponse.data.data?.sendChatMessage;
    results.shaleAnalysis = result;
    
    if (result) {
      console.log('✅ Response received');
      console.log('📝 Content length:', result.content?.length || 0);
      console.log('🎯 Artifacts:', result.artifacts?.length || 0);
      
      // Check for hallucination patterns
      const has5Wells = result.content?.includes('5 wells analyzed');
      const hasSingleWell = result.content?.includes('Single well');
      const hasWell001Only = result.content?.includes('WELL-001') && !result.content?.includes('WELL-002');
      
      console.log('🔍 HALLUCINATION CHECK:');
      console.log('  ❌ Contains "5 wells analyzed":', has5Wells);
      console.log('  ✅ Contains "Single well":', hasSingleWell);
      console.log('  ✅ WELL-001 only (no WELL-002):', hasWell001Only);
      
      if (has5Wells) {
        console.log('🚨 HALLUCINATION STILL EXISTS!');
      } else {
        console.log('🎉 HALLUCINATION FIXED!');
      }
      
      // Check artifact structure
      if (result.artifacts && result.artifacts.length > 0) {
        const artifact = result.artifacts[0];
        console.log('📦 Artifact Analysis:');
        console.log('  - messageContentType:', artifact.messageContentType);
        console.log('  - analysisType:', artifact.analysisType);
        console.log('  - wellName:', artifact.wellName);
        
        if (artifact.executiveSummary?.keyFindings) {
          console.log('📋 Key Findings Analysis:');
          artifact.executiveSummary.keyFindings.forEach((finding, i) => {
            console.log(`  ${i+1}. ${finding}`);
            if (finding.includes('5 wells')) {
              console.log('    🚨 HALLUCINATION IN FINDING #' + (i+1));
            }
            if (finding.includes('Single well')) {
              console.log('    ✅ CORRECT SINGLE WELL TEXT IN FINDING #' + (i+1));
            }
          });
        }
      }
      
    } else {
      console.log('❌ No response received');
    }
  } catch (error) {
    console.error('❌ Error in shale analysis test:', error.message);
  }

  // Test 2: Prompt 4 - Integrated Porosity Analysis
  console.log('\n🧪 === TEST 2: PROMPT 4 - INTEGRATED POROSITY ANALYSIS ===');
  console.log('🎯 Expected: Multi-well analysis with crossplots');
  
  try {
    const prompt4Response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `prompt4-test-${Date.now()}`,
          content: PROMPTS.INTEGRATED_POROSITY,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    });

    const result = prompt4Response.data.data?.sendChatMessage;
    results.integratedPorosity = result;
    
    if (result) {
      console.log('✅ Response received');
      console.log('📝 Content length:', result.content?.length || 0);
      console.log('🎯 Artifacts:', result.artifacts?.length || 0);
      
      // Check for expected patterns
      const hasIntegrated = result.content?.toLowerCase().includes('integrated');
      const hasMultiWell = result.content?.includes('WELL-001') && 
                          result.content?.includes('WELL-002') && 
                          result.content?.includes('WELL-003');
      const hasCrossplot = result.content?.toLowerCase().includes('crossplot');
      const hasReservoirQuality = result.content?.toLowerCase().includes('reservoir quality');
      
      console.log('🔍 PROMPT 4 ANALYSIS:');
      console.log('  ✅ Has "integrated":', hasIntegrated);
      console.log('  ✅ Has multi-well (001,002,003):', hasMultiWell);
      console.log('  ✅ Has "crossplot":', hasCrossplot);
      console.log('  ✅ Has "reservoir quality":', hasReservoirQuality);
      
      if (result.artifacts && result.artifacts.length > 0) {
        const artifact = result.artifacts[0];
        console.log('📦 Artifact Type:', artifact.messageContentType);
        console.log('  - Should be: comprehensive_porosity_analysis');
        console.log('  - Match:', artifact.messageContentType === 'comprehensive_porosity_analysis');
      }
      
    } else {
      console.log('❌ No response received');
    }
  } catch (error) {
    console.error('❌ Error in prompt 4 test:', error.message);
  }

  // Test 3: Prompt 5 - Professional Porosity Calculation  
  console.log('\n🧪 === TEST 3: PROMPT 5 - PROFESSIONAL POROSITY CALCULATION ===');
  console.log('🎯 Expected: Single-well professional calculation with SPE/API standards');
  
  try {
    const prompt5Response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `prompt5-test-${Date.now()}`,
          content: PROMPTS.PROFESSIONAL_POROSITY,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    });

    const result = prompt5Response.data.data?.sendChatMessage;
    results.professionalPorosity = result;
    
    if (result) {
      console.log('✅ Response received');
      console.log('📝 Content length:', result.content?.length || 0);
      console.log('🎯 Artifacts:', result.artifacts?.length || 0);
      
      // Check for expected patterns
      const hasProfessional = result.content?.toLowerCase().includes('professional');
      const hasSPEAPI = result.content?.includes('SPE') || result.content?.includes('API');
      const hasUncertainty = result.content?.toLowerCase().includes('uncertainty');
      const hasSingleWell = result.content?.includes('WELL-001') && 
                           !result.content?.includes('WELL-002');
      const hasMethodology = result.content?.toLowerCase().includes('methodology');
      
      console.log('🔍 PROMPT 5 ANALYSIS:');
      console.log('  ✅ Has "professional":', hasProfessional);
      console.log('  ✅ Has SPE/API standards:', hasSPEAPI);
      console.log('  ✅ Has "uncertainty":', hasUncertainty);
      console.log('  ✅ Single well only:', hasSingleWell);
      console.log('  ✅ Has "methodology":', hasMethodology);
      
      if (result.artifacts && result.artifacts.length > 0) {
        const artifact = result.artifacts[0];
        console.log('📦 Artifact Type:', artifact.messageContentType);
        console.log('  - Should be: comprehensive_porosity_analysis');
        console.log('  - Match:', artifact.messageContentType === 'comprehensive_porosity_analysis');
      }
      
    } else {
      console.log('❌ No response received');
    }
  } catch (error) {
    console.error('❌ Error in prompt 5 test:', error.message);
  }

  // Final Validation
  console.log('\n🏁 === COMPREHENSIVE VALIDATION RESULTS ===');
  
  // Validate shale analysis fix
  let shaleFixed = false;
  if (results.shaleAnalysis) {
    const has5Wells = results.shaleAnalysis.content?.includes('5 wells analyzed');
    const hasSingleWell = results.shaleAnalysis.content?.includes('Single well');
    shaleFixed = !has5Wells && hasSingleWell;
  }
  
  // Validate prompts 4 & 5 differentiation
  let promptsAreDifferent = false;
  if (results.integratedPorosity && results.professionalPorosity) {
    const content4 = results.integratedPorosity.content?.toLowerCase() || '';
    const content5 = results.professionalPorosity.content?.toLowerCase() || '';
    
    const prompt4HasIntegrated = content4.includes('integrated') || content4.includes('crossplot');
    const prompt5HasProfessional = content5.includes('professional') || content5.includes('spe');
    const prompt4HasMultiWell = content4.includes('well-001') && content4.includes('well-002');
    const prompt5HasSingleWell = content5.includes('well-001') && !content5.includes('well-002');
    
    promptsAreDifferent = prompt4HasIntegrated && prompt5HasProfessional && 
                         prompt4HasMultiWell && prompt5HasSingleWell;
  }
  
  // Results Summary
  console.log('\n📊 === FIX VALIDATION SUMMARY ===');
  console.log(`🔧 Shale Analysis Hallucination Fixed: ${shaleFixed ? '✅ YES' : '❌ NO'}`);
  console.log(`🔧 Prompts 4 & 5 Differentiated: ${promptsAreDifferent ? '✅ YES' : '❌ NO'}`);
  
  if (shaleFixed && promptsAreDifferent) {
    console.log('\n🎉 === ALL FIXES SUCCESSFUL! ===');
    console.log('✅ Shale analysis now shows correct single-well text');
    console.log('✅ Prompts 4 and 5 now generate different responses');
    console.log('✅ Intent detection improvements working correctly');
  } else {
    console.log('\n⚠️ === SOME ISSUES REMAIN ===');
    if (!shaleFixed) {
      console.log('❌ Shale analysis hallucination still present');
    }
    if (!promptsAreDifferent) {
      console.log('❌ Prompts 4 & 5 still generate similar responses');
    }
  }
  
  console.log('\n🎯 === DETAILED ANALYSIS ===');
  
  if (results.shaleAnalysis?.artifacts?.[0]) {
    const artifact = results.shaleAnalysis.artifacts[0];
    console.log('🪨 Shale Analysis Artifact:');
    console.log(`  - Analysis Type: ${artifact.analysisType}`);
    console.log(`  - Well Name: ${artifact.wellName || 'Not specified'}`);
    console.log(`  - Title: ${artifact.executiveSummary?.title || 'No title'}`);
  }
  
  if (results.integratedPorosity?.artifacts?.[0]) {
    const artifact = results.integratedPorosity.artifacts[0];
    console.log('🔧 Integrated Porosity (Prompt 4) Artifact:');
    console.log(`  - messageContentType: ${artifact.messageContentType}`);
    console.log(`  - Analysis Type: ${artifact.analysisType}`);
    console.log(`  - Wells Analyzed: ${artifact.executiveSummary?.wellsAnalyzed || 'Not specified'}`);
  }
  
  if (results.professionalPorosity?.artifacts?.[0]) {
    const artifact = results.professionalPorosity.artifacts[0];
    console.log('📊 Professional Porosity (Prompt 5) Artifact:');
    console.log(`  - messageContentType: ${artifact.messageContentType}`);
    console.log(`  - Analysis Type: ${artifact.analysisType}`);
    console.log(`  - Primary Well: ${artifact.primaryWell || 'Not specified'}`);
  }
  
  console.log('\n🏁 === VALIDATION TEST COMPLETE ===');
}

// Execute validation
validateFixes()
  .then(() => {
    console.log('\n✅ Comprehensive validation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  });
