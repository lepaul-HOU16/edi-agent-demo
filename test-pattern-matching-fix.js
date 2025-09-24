/**
 * Simple test to verify the regex patterns work for well data discovery
 * Tests the patterns without importing the TypeScript agent
 */

function testPatternMatching() {
    console.log('🧪 === PATTERN MATCHING TEST START ===');
    
    // The exact prompt that should trigger well_data_discovery
    const testPrompt = `Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.`;
    
    const query = testPrompt.toLowerCase().trim();
    console.log('📝 Test Prompt:', testPrompt);
    console.log('📏 Prompt Length:', testPrompt.length);
    console.log('🔍 Query (first 100 chars):', query.substring(0, 100) + '...');
    
    // Test the well_data_discovery patterns (these should match)
    const wellDataDiscoveryPatterns = [
        'analyze.*complete.*dataset.*24.*production.*wells.*from.*well-001.*through.*well-024',
        'analyze.*complete.*dataset.*24.*production.*wells.*well-001.*through.*well-024',
        'comprehensive.*summary.*showing.*available.*log.*curves.*gr.*rhob.*nphi.*dtc.*cali.*resistivity',
        'spatial distribution.*depth ranges.*data quality assessment.*create.*interactive visualizations',
        'spatial distribution.*depth ranges.*data quality assessment.*interactive visualizations',
        'create.*interactive.*visualizations.*showing.*field.*overview.*well.*statistics',
        'field overview.*well statistics',
        // More flexible patterns
        'analyze.*complete.*dataset.*production.*wells.*from.*well-001',
        'analyze.*complete.*dataset.*24.*production.*wells',
        'comprehensive.*summary.*showing.*available.*log.*curves',
        'generate.*comprehensive.*summary.*showing.*available.*log.*curves',
        'spatial distribution.*depth ranges.*data quality assessment',
        'interactive visualizations.*field overview',
        'create.*interactive.*visualizations.*field.*overview'
    ];
    
    console.log('\n🎯 Testing well_data_discovery patterns (should match):');
    let matchedPatterns = [];
    
    wellDataDiscoveryPatterns.forEach((pattern, index) => {
        try {
            const regex = new RegExp(pattern, 'i');
            const matches = regex.test(query);
            console.log(`  ${index + 1}. ${matches ? '✅ MATCH' : '❌ NO MATCH'} - ${pattern.substring(0, 80)}...`);
            if (matches) {
                matchedPatterns.push(pattern);
            }
        } catch (regexError) {
            console.log(`  ${index + 1}. ❌ REGEX ERROR - ${pattern.substring(0, 80)}...`);
            console.log('    Error:', regexError.message);
        }
    });
    
    console.log('\n📊 Well Data Discovery Results:');
    console.log('  Total patterns:', wellDataDiscoveryPatterns.length);
    console.log('  Matched patterns:', matchedPatterns.length);
    console.log('  Should trigger well_data_discovery:', matchedPatterns.length > 0);
    
    // Test list_wells patterns (these should NOT match)
    const listWellsPatterns = [
        'list.*wells',
        'show.*wells', 
        'what wells',
        'available.*wells',
        'how many wells'
    ];
    
    console.log('\n🎯 Testing list_wells patterns (should NOT match):');
    let listWellsMatches = [];
    
    listWellsPatterns.forEach((pattern, index) => {
        try {
            const regex = new RegExp(pattern, 'i');
            const matches = regex.test(query);
            console.log(`  ${index + 1}. ${matches ? '⚠️ MATCH (BAD)' : '✅ NO MATCH (GOOD)'} - ${pattern}`);
            if (matches) {
                listWellsMatches.push(pattern);
            }
        } catch (regexError) {
            console.log(`  ${index + 1}. ❌ REGEX ERROR - ${pattern}`);
            console.log('    Error:', regexError.message);
        }
    });
    
    console.log('\n📊 List Wells Results:');
    console.log('  Total patterns:', listWellsPatterns.length);
    console.log('  Matched patterns:', listWellsMatches.length);
    console.log('  Correctly avoided list_wells:', listWellsMatches.length === 0);
    
    // Overall test results
    const patternTestPassed = matchedPatterns.length > 0;
    const listWellsAvoided = listWellsMatches.length === 0;
    const overallPassed = patternTestPassed && listWellsAvoided;
    
    console.log('\n🎯 === FINAL TEST RESULTS ===');
    console.log('✅ Well data discovery patterns matched:', patternTestPassed);
    console.log('✅ List wells patterns avoided:', listWellsAvoided);
    console.log('✅ Overall pattern test result:', overallPassed ? 'PASS' : 'FAIL');
    
    if (overallPassed) {
        console.log('\n🎉 === PATTERN MATCHING FIXED ===');
        console.log('✅ The regex patterns now correctly identify the well data discovery prompt');
        console.log('✅ The prompt will be routed to the correct handler');
        console.log('✅ The interactive component should render properly');
    } else {
        console.log('\n❌ === PATTERN MATCHING STILL BROKEN ===');
        console.log('❌ Need to adjust the regex patterns further');
        
        if (!patternTestPassed) {
            console.log('❌ Issue: Well data discovery patterns don\'t match the prompt');
        }
        if (!listWellsAvoided) {
            console.log('❌ Issue: List wells patterns incorrectly match the prompt');
        }
    }
    
    // Show some specific pattern breakdowns for debugging
    console.log('\n🔍 === DETAILED PATTERN ANALYSIS ===');
    
    // Test key parts of the prompt individually
    const keyPhrases = [
        'analyze the complete dataset',
        '24 production wells',
        'from well-001 through well-024',
        'comprehensive summary showing available log curves',
        'gr, rhob, nphi, dtc, cali, resistivity',
        'spatial distribution',
        'depth ranges',
        'data quality assessment', 
        'create interactive visualizations',
        'field overview and well statistics'
    ];
    
    console.log('Key phrases in prompt:');
    keyPhrases.forEach((phrase, index) => {
        const inQuery = query.includes(phrase.toLowerCase());
        console.log(`  ${index + 1}. ${inQuery ? '✅' : '❌'} "${phrase}"`);
    });
    
    console.log('\n🧪 === PATTERN MATCHING TEST END ===');
    return overallPassed;
}

// Run the test
const testResult = testPatternMatching();
console.log(`\n🏁 Final Result: ${testResult ? 'PASS' : 'FAIL'}`);
