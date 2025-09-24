/**
 * Test to verify the well data discovery regression fix
 * This should trigger 'well_data_discovery' intent, NOT 'list_wells'
 */

const { EnhancedStrandsAgent } = require('./amplify/functions/agents/enhancedStrandsAgent');

async function testWellDataDiscoveryIntentDetection() {
    console.log('🧪 === WELL DATA DISCOVERY REGRESSION TEST START ===');
    
    const agent = new EnhancedStrandsAgent();
    
    // The exact prompt that should trigger well_data_discovery
    const testPrompt = `Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.`;
    
    console.log('📝 Test Prompt:', testPrompt);
    console.log('📏 Prompt Length:', testPrompt.length);
    
    try {
        // Test the intent detection specifically
        const query = testPrompt.toLowerCase().trim();
        console.log('🔍 Query:', query.substring(0, 100) + '...');
        
        // Manually test the patterns that should match
        const wellDataDiscoveryPatterns = [
            'analyze.*complete.*dataset.*24.*production.*wells.*from.*well-001.*through.*well-024',
            'analyze.*complete.*dataset.*24.*production.*wells.*well-001.*through.*well-024',
            'comprehensive.*summary.*showing.*available.*log.*curves.*gr.*rhob.*nphi.*dtc.*cali.*resistivity',
            'spatial distribution.*depth ranges.*data quality assessment.*create.*interactive visualizations',
            'spatial distribution.*depth ranges.*data quality assessment.*interactive visualizations',
            'create.*interactive.*visualizations.*showing.*field.*overview.*well.*statistics',
            'field overview.*well statistics'
        ];
        
        console.log('🎯 Testing well_data_discovery patterns:');
        let matchedPatterns = [];
        
        wellDataDiscoveryPatterns.forEach((pattern, index) => {
            const regex = new RegExp(pattern, 'i');
            const matches = regex.test(query);
            console.log(`  Pattern ${index + 1}: ${matches ? '✅ MATCH' : '❌ NO MATCH'} - ${pattern.substring(0, 60)}...`);
            if (matches) {
                matchedPatterns.push(pattern);
            }
        });
        
        console.log('📊 Matched Patterns:', matchedPatterns.length);
        console.log('🎯 Should trigger well_data_discovery:', matchedPatterns.length > 0);
        
        // Now test against list_wells patterns to make sure they DON'T match
        const listWellsPatterns = [
            'list.*wells',
            'show.*wells', 
            'what wells',
            'available.*wells',
            'how many wells'
        ];
        
        console.log('🎯 Testing list_wells patterns (should NOT match):');
        let listWellsMatches = [];
        
        listWellsPatterns.forEach((pattern, index) => {
            const regex = new RegExp(pattern, 'i');
            const matches = regex.test(query);
            console.log(`  Pattern ${index + 1}: ${matches ? '⚠️ MATCH (BAD)' : '✅ NO MATCH (GOOD)'} - ${pattern}`);
            if (matches) {
                listWellsMatches.push(pattern);
            }
        });
        
        console.log('📊 List Wells Matches:', listWellsMatches.length);
        
        // Test the actual agent processing
        console.log('🚀 Now testing actual agent processing...');
        const result = await agent.processMessage(testPrompt);
        
        console.log('✅ Agent Processing Result:');
        console.log('  Success:', result.success);
        console.log('  Message Length:', result.message?.length || 0);
        console.log('  Has Artifacts:', Array.isArray(result.artifacts));
        console.log('  Artifact Count:', result.artifacts?.length || 0);
        console.log('  Message Preview:', result.message?.substring(0, 200) + '...');
        
        if (result.artifacts && result.artifacts.length > 0) {
            console.log('📦 Artifacts Found:');
            result.artifacts.forEach((artifact, index) => {
                console.log(`  Artifact ${index + 1}:`, {
                    messageContentType: artifact.messageContentType,
                    title: artifact.title,
                    hasDatasetOverview: !!artifact.datasetOverview,
                    hasLogCurveAnalysis: !!artifact.logCurveAnalysis,
                    hasVisualizations: !!artifact.visualizations
                });
            });
        }
        
        // Verification
        const isCorrectIntent = result.artifacts && 
                              result.artifacts.length > 0 && 
                              result.artifacts[0].messageContentType === 'comprehensive_well_data_discovery';
        
        console.log('🎯 === TEST RESULTS ===');
        console.log('✅ Matched well_data_discovery patterns:', matchedPatterns.length > 0);
        console.log('✅ Did NOT match list_wells patterns:', listWellsMatches.length === 0);
        console.log('✅ Agent returned correct artifact:', isCorrectIntent);
        console.log('✅ Overall Test Result:', isCorrectIntent && matchedPatterns.length > 0 ? 'PASS' : 'FAIL');
        
        if (isCorrectIntent && matchedPatterns.length > 0) {
            console.log('🎉 === REGRESSION FIXED SUCCESSFULLY ===');
            console.log('✅ The well data discovery prompt now correctly triggers the interactive component');
            console.log('✅ Artifacts are properly generated with comprehensive_well_data_discovery type');
        } else {
            console.log('❌ === REGRESSION STILL EXISTS ===');
            console.log('❌ The prompt is still being routed incorrectly');
            
            if (matchedPatterns.length === 0) {
                console.log('❌ Pattern matching failed - intent detection not working');
            }
            if (!isCorrectIntent) {
                console.log('❌ Artifact generation failed - wrong handler called');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('❌ === REGRESSION TEST FAILED ===');
    }
    
    console.log('🧪 === WELL DATA DISCOVERY REGRESSION TEST END ===');
}

// Run the test
testWellDataDiscoveryIntentDetection().catch(console.error);
