/**
 * Test to verify that prompts 4 and 5 now generate different responses
 * and investigate the "5 wells analyzed" hallucination in shale analysis
 */

const axios = require('axios');

const GRAPHQL_ENDPOINT = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';

// Exact prompts from the UI
const PROMPT_4 = 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.';

const PROMPT_5 = 'Calculate porosity for WELL-001 using enhanced professional methodology. Include density porosity, neutron porosity, and effective porosity calculations with statistical analysis, uncertainty assessment, and complete technical documentation following SPE/API standards.';

const SHALE_PROMPT = 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.';

console.log('🧪 === PROMPT 4 & 5 FIX VERIFICATION + SHALE HALLUCINATION DEBUG ===');
console.log('📅 Test Date:', new Date().toISOString());

async function testPromptDifferentiation() {
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
  
  console.log('\n🔍 === TESTING PROMPT 4 (Integrated Porosity Analysis) ===');
  
  try {
    const prompt4Response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `test-prompt-4-${Date.now()}`,
          content: PROMPT_4,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result4 = prompt4Response.data.data?.sendChatMessage;
    
    if (result4) {
      console.log('✅ Prompt 4 Response Received');
      console.log('📝 Content Length:', result4.content?.length || 0);
      console.log('🎯 Artifacts Count:', result4.artifacts?.length || 0);
      console.log('📄 Content Preview:', result4.content?.substring(0, 150) + '...');
      
      if (result4.artifacts && result4.artifacts.length > 0) {
        console.log('📦 Prompt 4 Artifact Types:', result4.artifacts.map(a => a.messageContentType));
        console.log('🔍 First Artifact Keys:', Object.keys(result4.artifacts[0]));
      }
      
      // Check for intent-specific patterns
      const hasIntegratedAnalysis = result4.content?.toLowerCase().includes('integrated porosity analysis');
      const hasMultiWell = result4.content?.toLowerCase().includes('well-001') && 
                          result4.content?.toLowerCase().includes('well-002') && 
                          result4.content?.toLowerCase().includes('well-003');
      const hasCrossplot = result4.content?.toLowerCase().includes('crossplot');
      
      console.log('🎯 Prompt 4 Analysis Patterns:');
      console.log('  - Integrated Analysis:', hasIntegratedAnalysis);
      console.log('  - Multi-well (001-003):', hasMultiWell);
      console.log('  - Crossplot:', hasCrossplot);
      
    } else {
      console.log('❌ No response for Prompt 4');
    }
  } catch (error) {
    console.error('❌ Error testing Prompt 4:', error.message);
  }

  console.log('\n🔍 === TESTING PROMPT 5 (Professional Porosity Calculation) ===');
  
  try {
    const prompt5Response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `test-prompt-5-${Date.now()}`,
          content: PROMPT_5,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result5 = prompt5Response.data.data?.sendChatMessage;
    
    if (result5) {
      console.log('✅ Prompt 5 Response Received');
      console.log('📝 Content Length:', result5.content?.length || 0);
      console.log('🎯 Artifacts Count:', result5.artifacts?.length || 0);
      console.log('📄 Content Preview:', result5.content?.substring(0, 150) + '...');
      
      if (result5.artifacts && result5.artifacts.length > 0) {
        console.log('📦 Prompt 5 Artifact Types:', result5.artifacts.map(a => a.messageContentType));
        console.log('🔍 First Artifact Keys:', Object.keys(result5.artifacts[0]));
      }
      
      // Check for intent-specific patterns  
      const hasProfessionalMethod = result5.content?.toLowerCase().includes('professional methodology');
      const hasSPEAPI = result5.content?.toLowerCase().includes('spe') || result5.content?.toLowerCase().includes('api');
      const hasUncertainty = result5.content?.toLowerCase().includes('uncertainty');
      const hasSingleWell = result5.content?.toLowerCase().includes('well-001') && 
                           !result5.content?.toLowerCase().includes('well-002');
      
      console.log('🎯 Prompt 5 Analysis Patterns:');
      console.log('  - Professional Methodology:', hasProfessionalMethod);
      console.log('  - SPE/API Standards:', hasSPEAPI);
      console.log('  - Uncertainty Assessment:', hasUncertainty);
      console.log('  - Single Well (WELL-001 only):', hasSingleWell);
      
    } else {
      console.log('❌ No response for Prompt 5');
    }
  } catch (error) {
    console.error('❌ Error testing Prompt 5:', error.message);
  }

  console.log('\n🔍 === TESTING SHALE ANALYSIS (Hallucination Debug) ===');
  
  try {
    const shaleResponse = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `test-shale-${Date.now()}`,
          content: SHALE_PROMPT,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const shaleResult = shaleResponse.data.data?.sendChatMessage;
    
    if (shaleResult) {
      console.log('✅ Shale Analysis Response Received');
      console.log('📝 Content Length:', shaleResult.content?.length || 0);
      console.log('🎯 Artifacts Count:', shaleResult.artifacts?.length || 0);
      
      // Debug the hallucination issue
      const has5Wells = shaleResult.content?.includes('5 wells analyzed');
      const hasSingleWell = shaleResult.content?.includes('single well');
      const hasWell001 = shaleResult.content?.includes('WELL-001');
      
      console.log('🔍 HALLUCINATION DEBUG:');
      console.log('  - Contains "5 wells analyzed":', has5Wells);
      console.log('  - Contains "single well":', hasSingleWell);
      console.log('  - Contains "WELL-001":', hasWell001);
      console.log('  - CONTRADICTION DETECTED:', has5Wells && hasSingleWell);
      
      if (shaleResult.artifacts && shaleResult.artifacts.length > 0) {
        console.log('📦 Shale Artifacts:', shaleResult.artifacts.length);
        const firstArtifact = shaleResult.artifacts[0];
        
        console.log('🔍 First Artifact Analysis:');
        console.log('  - messageContentType:', firstArtifact.messageContentType);
        console.log('  - analysisType:', firstArtifact.analysisType);
        console.log('  - wellName:', firstArtifact.wellName);
        console.log('  - executiveSummary title:', firstArtifact.executiveSummary?.title);
        
        // Check key findings for the problematic text
        if (firstArtifact.executiveSummary?.keyFindings) {
          console.log('📋 Key Findings:');
          firstArtifact.executiveSummary.keyFindings.forEach((finding, index) => {
            console.log(`  ${index + 1}. ${finding}`);
            if (finding.includes('5 wells analyzed')) {
              console.log('🚨 FOUND HALLUCINATION SOURCE: Key Finding #' + (index + 1));
            }
          });
        }
        
        // Check results section
        if (firstArtifact.results?.fieldStatistics?.totalWellsAnalyzed) {
          console.log('📊 Field Statistics - Wells Analyzed:', firstArtifact.results.fieldStatistics.totalWellsAnalyzed);
        }
      }
      
    } else {
      console.log('❌ No response for Shale Analysis');
    }
  } catch (error) {
    console.error('❌ Error testing Shale Analysis:', error.message);
  }

  console.log('\n🏁 === COMPARISON RESULTS ===');
  console.log('✅ Test completed - check logs above for detailed analysis');
  console.log('🎯 Key Questions to Answer:');
  console.log('  1. Do prompts 4 and 5 generate different artifacts/content?');
  console.log('  2. Where does the "5 wells analyzed" text come from in shale analysis?');
  console.log('  3. Are the intent detection improvements working correctly?');
}

// Execute the test
testPromptDifferentiation()
  .then(() => {
    console.log('\n✅ Test execution completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
