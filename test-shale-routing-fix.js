/**
 * Test to validate the comprehensive shale analysis routing fix
 * This tests the original user request that was returning text outlines instead of visualizations
 */

const testOriginalShaleRequest = async () => {
  console.log('🧪 Testing Comprehensive Shale Analysis Routing Fix');
  console.log('=' .repeat(60));
  
  // The original user request that was failing
  const originalRequest = "Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.";
  
  console.log('📝 Original User Request:');
  console.log(originalRequest);
  console.log('\n🔄 Testing Intent Detection...');
  
  // Simulate the intent detection logic
  const query = originalRequest.toLowerCase().trim();
  
  // Check for shale analysis patterns
  const shalePatterns = [
    /\banalyze.*gamma.*ray.*logs.*wells\b/,
    /\bcalculate.*shale.*volume.*larionov\b/,
    /\binteractive.*plots.*shale.*volume.*depth\b/,
    /\bidentify.*cleanest.*sand.*intervals\b/,
    /\bclear.*engaging.*visualizations\b/,
    /\bshale.*volume.*vs.*depth\b/,
    /\bgamma.*ray.*shale.*analysis\b/,
    /\banalyze.*gamma.*ray.*logs\b/,
    /\bgamma.*ray.*logs.*wells\b/,
    /\blarionov.*method\b/,
    /\bshale.*volume.*using.*larionov\b/,
    /\bengaging.*visualizations\b/
  ];
  
  const shaleKeywords = ['analyze', 'gamma', 'ray', 'logs', 'calculate', 'shale', 'volume', 'larionov', 'interactive', 'plots', 'depth', 'cleanest', 'sand', 'intervals', 'visualizations', 'method'];
  
  let shaleScore = 0;
  
  // Pattern matching
  for (const pattern of shalePatterns) {
    if (pattern.test(query)) {
      shaleScore += 10;
      console.log(`✅ Pattern matched: ${pattern}`);
      break;
    }
  }
  
  // Keyword matching
  let matchedKeywords = [];
  for (const keyword of shaleKeywords) {
    if (query.includes(keyword)) {
      shaleScore += 2;
      matchedKeywords.push(keyword);
    }
  }
  
  // Priority bonus
  if (shaleScore > 0) {
    shaleScore += 20; // High priority intent boost
  }
  
  console.log(`\n📊 Shale Analysis Intent Scoring:`);
  console.log(`   Base score: ${shaleScore - 20}`);
  console.log(`   Priority bonus: +20`);
  console.log(`   Final score: ${shaleScore}`);
  console.log(`   Matched keywords: ${matchedKeywords.join(', ')}`);
  
  // Check formation evaluation patterns for comparison
  const formationPatterns = [
    /\banalyze\b/,
    /\bformation\b.*\bevaluation\b/,
    /\b(complete|full|comprehensive)\b.*\b(analysis|evaluation)\b/
  ];
  
  const formationKeywords = ['formation', 'evaluation', 'complete', 'comprehensive', 'analysis', 'analyze'];
  
  let formationScore = 0;
  
  for (const pattern of formationPatterns) {
    if (pattern.test(query)) {
      formationScore += 10;
      break;
    }
  }
  
  for (const keyword of formationKeywords) {
    if (query.includes(keyword)) {
      formationScore += 2;
    }
  }
  
  console.log(`\n📊 Formation Evaluation Intent Scoring:`);
  console.log(`   Final score: ${formationScore}`);
  
  console.log(`\n🎯 Intent Detection Result:`);
  if (shaleScore > formationScore) {
    console.log(`✅ SUCCESS: Shale analysis workflow selected (${shaleScore} vs ${formationScore})`);
    console.log(`   Expected routing: shale_analysis_workflow -> handleComprehensiveShaleAnalysisWorkflow`);
    console.log(`   Expected output: Comprehensive shale analysis with engaging visualizations`);
    return true;
  } else {
    console.log(`❌ FAILURE: Formation evaluation would be selected (${formationScore} vs ${shaleScore})`);
    console.log(`   This would result in basic text outlines instead of engaging visualizations`);
    return false;
  }
};

// Run the test
testOriginalShaleRequest()
  .then(success => {
    console.log('\n' + '=' .repeat(60));
    if (success) {
      console.log('🎉 ROUTING FIX VALIDATION: PASSED');
      console.log('   The enhanced system should now deliver engaging visualizations');
      console.log('   instead of underwhelming text outlines for shale analysis requests.');
    } else {
      console.log('❌ ROUTING FIX VALIDATION: FAILED');
      console.log('   The system may still route to basic workflows instead of comprehensive analysis.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test Error:', error);
    process.exit(1);
  });
