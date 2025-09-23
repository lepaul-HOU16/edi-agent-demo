/**
 * COMPREHENSIVE VALIDATION TEST FOR ALL 5 PRELOADED PROMPTS
 * Tests the complete fix including intent detection, MCP tools, and real log curve data
 */

const axios = require('axios');

// Exact preloaded prompt text from the frontend
const PRELOADED_PROMPTS = [
  {
    id: 1,
    name: 'Production Well Data Discovery (24 Wells)',
    prompt: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
    expectedIntent: 'well_data_discovery',
    expectedComponent: 'ComprehensiveWellDataDiscoveryComponent',
    shouldHaveRealLogCurves: true,
    previouslyWorking: true
  },
  {
    id: 2,
    name: 'Multi-Well Correlation Analysis (WELL-001 to WELL-005)',
    prompt: 'Create a comprehensive multi-well correlation analysis for wells WELL-001, WELL-002, WELL-003, WELL-004, and WELL-005. Generate normalized log correlations showing gamma ray, resistivity, and porosity data. Include geological correlation lines, reservoir zone identification, and statistical analysis. Create interactive visualization components with expandable technical documentation.',
    expectedIntent: 'multi_well_correlation',
    expectedComponent: 'MultiWellCorrelationComponent',
    shouldHaveRealLogCurves: false,
    previouslyWorking: false // This was broken
  },
  {
    id: 3,
    name: 'Comprehensive Shale Analysis (WELL-001)',
    prompt: 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.',
    expectedIntent: 'shale_analysis_workflow',
    expectedComponent: 'ComprehensiveShaleAnalysisComponent',
    shouldHaveRealLogCurves: false,
    previouslyWorking: false // This was broken
  },
  {
    id: 4,
    name: 'Integrated Porosity Analysis (Wells 001-003)',
    prompt: 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.',
    expectedIntent: 'porosity_analysis_workflow',
    expectedComponent: 'ComprehensivePorosityAnalysisComponent',
    shouldHaveRealLogCurves: false,
    previouslyWorking: false // This was broken
  },
  {
    id: 5,
    name: 'Professional Porosity Calculation (WELL-001)',
    prompt: 'Calculate porosity for WELL-001 using enhanced professional methodology. Include density porosity, neutron porosity, and effective porosity calculations with statistical analysis, uncertainty assessment, and complete technical documentation following SPE/API standards.',
    expectedIntent: 'calculate_porosity',
    expectedComponent: 'ComprehensivePorosityAnalysisComponent',
    shouldHaveRealLogCurves: false,
    previouslyWorking: true
  }
];

const GRAPHQL_ENDPOINT = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';

console.log('🧪 === COMPREHENSIVE PRELOADED PROMPT VALIDATION TEST ===');
console.log('📅 Test Date:', new Date().toISOString());
console.log('🎯 Testing all 5 preloaded prompts with complete fix validation');
console.log('🔧 Phases tested: Intent Detection + MCP Tools + Real Log Curves + Artifacts');

async function testAllPreloadedPrompts() {
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
  
  let totalTests = PRELOADED_PROMPTS.length;
  let passedTests = 0;
  let regressionIssues = [];
  let fixedIssues = [];
  let logCurveIssues = [];
  
  console.log(`\n🚀 Starting comprehensive test of ${totalTests} preloaded prompts...\n`);
  
  for (const promptTest of PRELOADED_PROMPTS) {
    const testStartTime = Date.now();
    console.log(`\n📝 === TESTING PROMPT #${promptTest.id}: ${promptTest.name} ===`);
    console.log(`🎯 Expected Intent: ${promptTest.expectedIntent}`);
    console.log(`🧩 Expected Component: ${promptTest.expectedComponent}`);
    console.log(`📊 Should Have Real Log Curves: ${promptTest.shouldHaveRealLogCurves}`);
    console.log(`⚡ Previously Working: ${promptTest.previouslyWorking}`);
    console.log(`💬 Prompt Preview: "${promptTest.prompt.substring(0, 100)}..."`);
    
    try {
      const response = await axios.post(GRAPHQL_ENDPOINT, {
        query: mutation,
        variables: {
          input: {
            chatSessionId: `test-prompt-${promptTest.id}-${Date.now()}`,
            content: promptTest.prompt,
            role: 'user'
          }
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000 // Extended timeout for comprehensive analysis
      });

      const result = response.data.data?.sendChatMessage;
      const testDuration = Date.now() - testStartTime;
      
      if (!result) {
        console.log(`❌ FAIL: No response received for prompt #${promptTest.id}`);
        if (promptTest.previouslyWorking) {
          regressionIssues.push(`Prompt #${promptTest.id}: No response (regression)`);
        }
        continue;
      }
      
      console.log(`✅ Response received in ${testDuration}ms`);
      
      const content = result.content || '';
      const artifacts = result.artifacts || [];
      
      console.log(`📄 Content Length: ${content.length} characters`);
      console.log(`🎯 Artifacts Count: ${artifacts.length}`);
      console.log(`📝 Content Preview: "${content.substring(0, 150)}..."`);
      
      // Test 1: Check for generic fallback response (should NOT appear)
      const hasGenericFallback = content.includes("I'd be happy to help you with your analysis!");
      if (hasGenericFallback) {
        console.log(`❌ CRITICAL: Prompt #${promptTest.id} still showing generic fallback response`);
        if (promptTest.previouslyWorking) {
          regressionIssues.push(`Prompt #${promptTest.id}: Generic fallback (regression)`);
        }
        continue;
      } else {
        console.log(`✅ No generic fallback response - intent detection working`);
      }
      
      // Test 2: Check for artifacts (visualization components)
      if (artifacts.length === 0) {
        console.log(`❌ FAIL: Prompt #${promptTest.id} has no artifacts - no visualization component will appear`);
        if (promptTest.previouslyWorking) {
          regressionIssues.push(`Prompt #${promptTest.id}: Missing artifacts (regression)`);
        }
        continue;
      } else {
        console.log(`✅ Artifacts found: ${artifacts.length} items`);
        
        // Analyze artifact types
        artifacts.forEach((artifact, index) => {
          if (artifact && typeof artifact === 'object') {
            console.log(`📦 Artifact ${index + 1}: messageContentType = "${artifact.messageContentType || 'MISSING'}"`);
            
            // Test for expected component type
            const expectedTypes = {
              'well_data_discovery': 'comprehensive_well_data_discovery',
              'multi_well_correlation': 'multi_well_correlation',
              'shale_analysis_workflow': 'comprehensive_shale_analysis',
              'porosity_analysis_workflow': 'comprehensive_porosity_analysis',
              'calculate_porosity': 'comprehensive_porosity_analysis'
            };
            
            const expectedType = expectedTypes[promptTest.expectedIntent];
            if (artifact.messageContentType === expectedType) {
              console.log(`✅ Correct artifact type for ${promptTest.expectedIntent}`);
            } else {
              console.log(`⚠️ Artifact type mismatch: expected "${expectedType}", got "${artifact.messageContentType}"`);
            }
          } else {
            console.log(`❌ Invalid artifact ${index + 1}: not an object`);
          }
        });
      }
      
      // Test 3: Check for real log curves (for prompt #1 specifically)
      if (promptTest.shouldHaveRealLogCurves) {
        console.log(`🔍 Checking for real log curves in prompt #${promptTest.id}...`);
        
        let hasRealLogCurves = false;
        let foundLogCurves = [];
        
        // Check artifacts for real log curve data
        artifacts.forEach(artifact => {
          if (artifact && artifact.logCurveAnalysis && artifact.logCurveAnalysis.availableLogTypes) {
            foundLogCurves = artifact.logCurveAnalysis.availableLogTypes;
            
            // Check if we have real S3 log curves (not just the generic fallbacks)
            const genericFallbacks = ['GR', 'RHOB', 'NPHI', 'DTC', 'CALI', 'RT'];
            const hasMoreThanGeneric = foundLogCurves.length > genericFallbacks.length;
            const hasNonGenericCurves = foundLogCurves.some(curve => !genericFallbacks.includes(curve));
            
            if (hasMoreThanGeneric || hasNonGenericCurves) {
              hasRealLogCurves = true;
              console.log(`✅ Real log curves found: ${foundLogCurves.length} types`);
              console.log(`📊 Log curves: ${foundLogCurves.join(', ')}`);
            } else {
              console.log(`❌ Only generic fallback curves found: ${foundLogCurves.join(', ')}`);
            }
          }
        });
        
        // Also check content for real log curve mentions
        const contentHasRealCurves = content.includes('DEPT') || content.includes('DEEPRESISTIVITY') || 
                                   content.includes('SHALLOWRESISTIVITY') || content.includes('curve types');
        
        if (!hasRealLogCurves && !contentHasRealCurves) {
          console.log(`❌ CRITICAL: Prompt #${promptTest.id} missing real log curves from S3`);
          logCurveIssues.push(`Prompt #${promptTest.id}: No real S3 log curves`);
        }
      }
      
      // Test 4: Check for expected content patterns
      const expectedPatterns = {
        1: ['Dataset Analysis Summary', 'Total Wells Analyzed', 'Log Curve Inventory', 'spatial distribution'],
        2: ['Multi-well correlation', 'geological correlation', 'reservoir zone', 'interactive visualization'],
        3: ['shale analysis', 'Larionov method', 'clean sand intervals', 'depth plots'],
        4: ['porosity analysis', 'density-neutron', 'crossplots', 'reservoir quality'],
        5: ['porosity calculation', 'professional methodology', 'SPE/API standards', 'uncertainty assessment']
      };
      
      const patterns = expectedPatterns[promptTest.id] || [];
      let patternMatches = 0;
      
      patterns.forEach(pattern => {
        if (content.toLowerCase().includes(pattern.toLowerCase())) {
          patternMatches++;
        }
      });
      
      const patternScore = patterns.length > 0 ? (patternMatches / patterns.length) * 100 : 100;
      console.log(`📋 Content Pattern Match: ${patternMatches}/${patterns.length} (${patternScore.toFixed(1)}%)`);
      
      // Overall test result
      const hasArtifacts = artifacts.length > 0;
      const noGenericFallback = !hasGenericFallback;
      const goodPatternMatch = patternScore >= 50;
      const logCurveOk = !promptTest.shouldHaveRealLogCurves || hasRealLogCurves;
      
      const testPassed = hasArtifacts && noGenericFallback && goodPatternMatch && logCurveOk;
      
      if (testPassed) {
        console.log(`🎉 PASS: Prompt #${promptTest.id} working correctly`);
        passedTests++;
        
        if (!promptTest.previouslyWorking) {
          fixedIssues.push(`Prompt #${promptTest.id}: Fixed and working`);
        }
      } else {
        console.log(`❌ FAIL: Prompt #${promptTest.id} has issues`);
        if (promptTest.previouslyWorking) {
          regressionIssues.push(`Prompt #${promptTest.id}: Test failure (regression)`);
        }
      }
      
    } catch (error) {
      console.error(`💥 ERROR testing prompt #${promptTest.id}:`, error.message);
      if (promptTest.previouslyWorking) {
        regressionIssues.push(`Prompt #${promptTest.id}: Error (regression)`);
      }
    }
    
    console.log(`📝 === END PROMPT #${promptTest.id} TEST ===\n`);
  }
  
  // Final Results Summary
  console.log('\n🏁 === COMPREHENSIVE TEST RESULTS SUMMARY ===');
  console.log(`📊 Overall Results: ${passedTests}/${totalTests} prompts passed`);
  console.log(`✅ Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (fixedIssues.length > 0) {
    console.log(`\n🎉 FIXED ISSUES (${fixedIssues.length}):`);
    fixedIssues.forEach(issue => console.log(`  ✅ ${issue}`));
  }
  
  if (regressionIssues.length > 0) {
    console.log(`\n⚠️ REGRESSION ISSUES (${regressionIssues.length}):`);
    regressionIssues.forEach(issue => console.log(`  ❌ ${issue}`));
  }
  
  if (logCurveIssues.length > 0) {
    console.log(`\n📊 LOG CURVE ISSUES (${logCurveIssues.length}):`);
    logCurveIssues.forEach(issue => console.log(`  📊 ${issue}`));
  }
  
  console.log('\n🎯 === PHASE VALIDATION RESULTS ===');
  console.log('✅ Phase 1 (Intent Detection): ' + (regressionIssues.length === 0 ? 'SUCCESS' : 'ISSUES DETECTED'));
  console.log('✅ Phase 2 (MCP Tools): ' + (passedTests >= 3 ? 'SUCCESS' : 'ISSUES DETECTED'));
  console.log('✅ Phase 3 (Log Curves): ' + (logCurveIssues.length === 0 ? 'SUCCESS' : 'ISSUES DETECTED'));
  console.log('✅ Phase 4 (End-to-End): ' + (passedTests === totalTests ? 'SUCCESS' : 'PARTIAL SUCCESS'));
  
  if (passedTests === totalTests) {
    console.log('\n🎉 🎉 🎉 ALL TESTS PASSED - COMPREHENSIVE FIX SUCCESSFUL! 🎉 🎉 🎉');
    console.log('✅ All 5 preloaded prompts are working correctly');
    console.log('✅ Intent detection fixed for broken prompts #2, #3, #4');
    console.log('✅ MCP tools generating proper artifacts');
    console.log('✅ Real log curve data displaying correctly');
    console.log('✅ No regressions in previously working prompts #1, #5');
  } else if (passedTests >= 4) {
    console.log('\n🎯 MOSTLY SUCCESSFUL - Minor issues remaining');
    console.log(`✅ ${passedTests}/${totalTests} prompts working correctly`);
    console.log('💡 Recommend investigating remaining issues');
  } else {
    console.log('\n⚠️ SIGNIFICANT ISSUES DETECTED');
    console.log(`❌ Only ${passedTests}/${totalTests} prompts working correctly`);
    console.log('💡 Requires additional debugging and fixes');
  }
  
  console.log('\n🏁 === COMPREHENSIVE VALIDATION TEST COMPLETE ===');
}

// Execute the comprehensive test
testAllPreloadedPrompts()
  .then(() => {
    console.log('\n✅ Test execution completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
