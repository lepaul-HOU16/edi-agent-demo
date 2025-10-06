/**
 * Test to validate that Prompt #4 (Integrated Porosity Analysis) 
 * now correctly analyzes WELL-001, WELL-002, and WELL-003 instead of just WELL-001
 */

const axios = require('axios');

const GRAPHQL_ENDPOINT = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';

// Exact text of preloaded prompt #4
const PROMPT_4_TEXT = 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.';

console.log('🧪 === PROMPT #4 MULTI-WELL FIX VALIDATION TEST ===');
console.log('📅 Test Date:', new Date().toISOString());
console.log('🎯 Testing Prompt #4 multi-well fix');
console.log('💬 Testing Prompt: "' + PROMPT_4_TEXT.substring(0, 100) + '..."');

async function testPrompt4MultiWellFix() {
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
  
  console.log('\n🚀 Sending Prompt #4 to test multi-well analysis...');
  
  try {
    const response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `test-prompt-4-multiwell-fix-${Date.now()}`,
          content: PROMPT_4_TEXT,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    });

    const result = response.data.data?.sendChatMessage;
    
    if (!result) {
      console.log('❌ FAIL: No response received for prompt #4');
      return false;
    }
    
    console.log('✅ Response received for prompt #4');
    
    const content = result.content || '';
    const artifacts = result.artifacts || [];
    
    console.log(`📄 Content Length: ${content.length} characters`);
    console.log(`🎯 Artifacts Count: ${artifacts.length}`);
    console.log(`📝 Content Preview: "${content.substring(0, 200)}..."`);
    
    // CRITICAL TEST: Check if all three wells are mentioned in the response
    console.log('\n🔍 === MULTI-WELL ANALYSIS VALIDATION ===');
    
    let wellsFound = [];
    ['WELL-001', 'WELL-002', 'WELL-003'].forEach(well => {
      if (content.includes(well)) {
        wellsFound.push(well);
        console.log(`✅ ${well} found in response content`);
      } else {
        console.log(`❌ ${well} NOT found in response content`);
      }
    });
    
    // Check artifacts for multi-well analysis indicators
    let artifactIndicatesMultiWell = false;
    let artifactAnalysisType = 'unknown';
    
    if (artifacts.length > 0) {
      artifacts.forEach((artifact, index) => {
        if (artifact && typeof artifact === 'object') {
          console.log(`🔍 Analyzing artifact ${index + 1}:`, {
            messageContentType: artifact.messageContentType,
            hasWellNames: !!artifact.wellNames,
            wellNamesCount: Array.isArray(artifact.wellNames) ? artifact.wellNames.length : 0,
            analysisType: artifact.analysisType || 'not specified'
          });
          
          // Check if artifact indicates multi-well analysis
          if (artifact.analysisType === 'multi_well') {
            artifactIndicatesMultiWell = true;
            artifactAnalysisType = 'multi_well';
            console.log(`✅ Artifact ${index + 1} correctly indicates multi-well analysis`);
          } else if (artifact.analysisType === 'single_well') {
            console.log(`❌ Artifact ${index + 1} incorrectly indicates single-well analysis`);
            artifactAnalysisType = 'single_well';
          }
          
          // Check if artifact contains multiple well names
          if (Array.isArray(artifact.wellNames) && artifact.wellNames.length >= 3) {
            console.log(`✅ Artifact ${index + 1} contains multiple wells:`, artifact.wellNames);
            artifactIndicatesMultiWell = true;
          }
          
          // Check for multi-well specific content
          if (artifact.wellsAnalyzed >= 3 || (artifact.wellNames && artifact.wellNames.length >= 3)) {
            console.log(`✅ Artifact ${index + 1} shows multi-well analysis with ${artifact.wellsAnalyzed || artifact.wellNames.length} wells`);
            artifactIndicatesMultiWell = true;
          }
        }
      });
    }
    
    // VALIDATION RESULTS
    console.log('\n📊 === VALIDATION RESULTS ===');
    console.log(`🎯 Wells found in content: ${wellsFound.length}/3 (${wellsFound.join(', ')})`);
    console.log(`📦 Artifacts analysis type: ${artifactAnalysisType}`);
    console.log(`🔗 Multi-well analysis detected: ${artifactIndicatesMultiWell}`);
    
    // PASS/FAIL CRITERIA
    const allWellsInContent = wellsFound.length === 3;
    const correctAnalysisType = artifactIndicatesMultiWell || artifactAnalysisType === 'multi_well';
    const hasArtifacts = artifacts.length > 0;
    
    console.log('\n🎯 === PASS/FAIL ANALYSIS ===');
    console.log(`✅ All 3 wells in content: ${allWellsInContent ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Multi-well analysis type: ${correctAnalysisType ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Has artifacts: ${hasArtifacts ? 'PASS' : 'FAIL'}`);
    
    const overallPass = allWellsInContent && correctAnalysisType && hasArtifacts;
    
    if (overallPass) {
      console.log('\n🎉 🎉 🎉 PROMPT #4 MULTI-WELL FIX SUCCESSFUL! 🎉 🎉 🎉');
      console.log('✅ Prompt #4 now correctly analyzes all three wells (WELL-001, WELL-002, WELL-003)');
      console.log('✅ Analysis type is correctly set to multi-well');
      console.log('✅ Artifacts are generated properly');
      console.log('✅ Fix addresses the original issue completely');
    } else {
      console.log('\n❌ ❌ ❌ PROMPT #4 MULTI-WELL FIX FAILED ❌ ❌ ❌');
      console.log('💡 Issues detected:');
      if (!allWellsInContent) {
        console.log('  - Not all wells found in response content');
      }
      if (!correctAnalysisType) {
        console.log('  - Analysis type not set to multi-well');
      }
      if (!hasArtifacts) {
        console.log('  - No artifacts generated');
      }
    }
    
    // Additional debugging information
    if (!overallPass) {
      console.log('\n🔍 === DEBUG INFORMATION ===');
      console.log('📝 Content search results:');
      ['WELL-001', 'WELL-002', 'WELL-003'].forEach(well => {
        const found = content.includes(well);
        const firstIndex = content.indexOf(well);
        console.log(`  ${well}: ${found ? 'FOUND' : 'NOT FOUND'}${found ? ` at position ${firstIndex}` : ''}`);
      });
      
      console.log('\n📦 Detailed artifact analysis:');
      artifacts.forEach((artifact, index) => {
        console.log(`  Artifact ${index + 1}:`, JSON.stringify(artifact, null, 2).substring(0, 500) + '...');
      });
    }
    
    return overallPass;

  } catch (error) {
    console.error('💥 ERROR testing prompt #4:', error.message);
    return false;
  }
}

// Execute the test
testPrompt4MultiWellFix()
  .then(success => {
    if (success) {
      console.log('\n✅ Test completed successfully - Fix validated!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed - Fix needs further investigation');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
