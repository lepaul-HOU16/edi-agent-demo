/**
 * Test Artifact Flow Debug
 * Trace where artifacts are lost between tool -> agent -> response
 */

console.log('🔍 Testing Artifact Flow Debug...\n');

// Test the comprehensive shale analysis tool directly
async function testComprehensiveShaleAnalysisTool() {
    try {
        // Import the tool directly
        console.log('📦 Importing comprehensive shale analysis tool...');
        const toolModule = await import('./amplify/functions/tools/comprehensiveShaleAnalysisTool.ts');
        const tool = toolModule.comprehensiveShaleAnalysisTool;
        
        if (!tool || !tool.func) {
            console.error('❌ Tool not found or missing func property');
            return;
        }
        
        console.log('✅ Tool imported successfully');
        console.log('🔧 Tool name:', tool.name);
        console.log('📝 Tool description:', tool.description);
        
        // Test parameters
        const testParams = {
            analysisType: "field_overview",
            generatePlots: true,
            includeCorrelation: true
        };
        
        console.log('\n📋 Calling tool with parameters:', testParams);
        console.log('⏰ Start time:', new Date().toISOString());
        
        // Call the tool function directly
        const rawResult = await tool.func(testParams);
        
        console.log('⏰ End time:', new Date().toISOString());
        console.log('📤 Raw result type:', typeof rawResult);
        console.log('📤 Raw result length:', rawResult ? rawResult.length : 'null');
        console.log('📤 Raw result preview:', rawResult ? rawResult.substring(0, 200) + '...' : 'null');
        
        // Parse the result
        let parsedResult;
        try {
            parsedResult = JSON.parse(rawResult);
            console.log('\n✅ Successfully parsed JSON result');
            
            console.log('🔍 DETAILED RESULT STRUCTURE:');
            console.log('   - success:', parsedResult.success);
            console.log('   - hasMessage:', !!parsedResult.message);
            console.log('   - messageLength:', parsedResult.message?.length || 0);
            console.log('   - hasArtifacts:', Array.isArray(parsedResult.artifacts));
            console.log('   - artifactsLength:', parsedResult.artifacts?.length || 0);
            console.log('   - hasResult:', !!parsedResult.result);
            console.log('   - isDemoMode:', parsedResult.isDemoMode);
            console.log('   - allKeys:', Object.keys(parsedResult));
            
            if (parsedResult.artifacts && parsedResult.artifacts.length > 0) {
                console.log('\n🎯 ARTIFACT ANALYSIS:');
                parsedResult.artifacts.forEach((artifact, index) => {
                    console.log(`   Artifact ${index}:`);
                    console.log(`     - type: ${typeof artifact}`);
                    console.log(`     - hasMessageContentType: ${!!artifact.messageContentType}`);
                    console.log(`     - messageContentType: ${artifact.messageContentType}`);
                    console.log(`     - hasExecutiveSummary: ${!!artifact.executiveSummary}`);
                    console.log(`     - hasResults: ${!!artifact.results}`);
                    console.log(`     - keys: ${Object.keys(artifact)}`);
                    
                    // Test JSON serialization
                    try {
                        const testSerialized = JSON.stringify(artifact);
                        const testDeserialized = JSON.parse(testSerialized);
                        console.log(`     - jsonSerialization: ✅ OK`);
                        console.log(`     - preservesKeys: ${Object.keys(testDeserialized).length === Object.keys(artifact).length ? '✅' : '❌'}`);
                    } catch (serializationError) {
                        console.log(`     - jsonSerialization: ❌ FAILED - ${serializationError.message}`);
                    }
                });
            } else {
                console.log('\n❌ NO ARTIFACTS FOUND IN RESULT!');
            }
            
            // Test complete response serialization
            console.log('\n🔍 TESTING COMPLETE RESPONSE SERIALIZATION:');
            try {
                const serializedResponse = JSON.stringify(parsedResult);
                const deserializedResponse = JSON.parse(serializedResponse);
                
                console.log('   - Response serialization: ✅ OK');
                console.log('   - Artifacts preserved:', Array.isArray(deserializedResponse.artifacts) && deserializedResponse.artifacts.length > 0 ? '✅' : '❌');
                console.log('   - Artifact count preserved:', deserializedResponse.artifacts?.length || 0);
                
                if (deserializedResponse.artifacts && deserializedResponse.artifacts.length > 0) {
                    console.log('   - First artifact messageContentType preserved:', !!deserializedResponse.artifacts[0].messageContentType ? '✅' : '❌');
                }
            } catch (serializationError) {
                console.log('   - Response serialization: ❌ FAILED -', serializationError.message);
            }
            
        } catch (parseError) {
            console.error('❌ Failed to parse JSON result:', parseError.message);
            console.log('📤 Raw result sample:', rawResult ? rawResult.substring(0, 500) : 'null');
        }
        
    } catch (error) {
        console.error('💥 Tool test failed:', error.message);
        console.error('📋 Error stack:', error.stack);
    }
}

// Run the test
console.log('🚀 Starting comprehensive shale analysis tool test...\n');
testComprehensiveShaleAnalysisTool()
    .then(() => {
        console.log('\n🎯 Tool test completed');
    })
    .catch(error => {
        console.error('💥 Test runner failed:', error);
    });
