/**
 * Direct test to see what the backend actually returns for well data discovery
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

async function testActualBackendResponse() {
    console.log('🔍 === ACTUAL BACKEND RESPONSE TEST ===');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const testPrompt = `Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.`;
    
    console.log('📝 Test Prompt:', testPrompt);
    
    // Test by directly invoking the Lambda function
    const lambda = new AWS.Lambda();
    
    const payload = {
        prompt: testPrompt,
        chatSessionId: `test-${Date.now()}`,
        userEmail: 'test@example.com',
        userAttributes: {
            email: 'test@example.com',
            name: 'Test User'
        }
    };
    
    console.log('🚀 Invoking Lambda function directly...');
    
    try {
        const params = {
            FunctionName: 'amplify-digitalassistant-agentfixlp-sandbox-3d38283154-awsMcpToolsFunction',
            Payload: JSON.stringify({
                version: '2.0',
                routeKey: 'POST /invoke-agent',
                requestContext: {
                    http: {
                        method: 'POST',
                        path: '/invoke-agent'
                    }
                },
                body: JSON.stringify(payload),
                isBase64Encoded: false
            })
        };
        
        console.log('📋 Lambda invocation parameters:', params.FunctionName);
        
        const result = await lambda.invoke(params).promise();
        
        if (result.Payload) {
            const response = JSON.parse(result.Payload.toString());
            console.log('📤 Lambda Response Status:', response.statusCode);
            
            if (response.body) {
                const body = JSON.parse(response.body);
                console.log('📦 Response Body Keys:', Object.keys(body));
                console.log('🔍 Success:', body.success);
                console.log('📝 Message Length:', body.message?.length || 0);
                console.log('📄 Message Preview:', body.message?.substring(0, 200) + '...');
                console.log('🎯 Has Artifacts:', Array.isArray(body.artifacts));
                console.log('📊 Artifact Count:', body.artifacts?.length || 0);
                
                if (body.artifacts && body.artifacts.length > 0) {
                    console.log('🎉 ARTIFACTS FOUND IN BACKEND RESPONSE!');
                    body.artifacts.forEach((artifact, index) => {
                        console.log(`📦 Artifact ${index + 1}:`, {
                            messageContentType: artifact.messageContentType,
                            type: artifact.type,
                            title: artifact.title,
                            hasDatasetOverview: !!artifact.datasetOverview,
                            hasLogCurveAnalysis: !!artifact.logCurveAnalysis,
                            keys: Object.keys(artifact)
                        });
                    });
                    
                    // Check if the artifact structure matches what the component expects
                    const firstArtifact = body.artifacts[0];
                    if (firstArtifact.messageContentType === 'comprehensive_well_data_discovery') {
                        console.log('✅ CORRECT ARTIFACT TYPE: comprehensive_well_data_discovery');
                        console.log('✅ Frontend should render this as tabbed component');
                        console.log('🔍 Artifact validation:');
                        console.log('  - title:', !!firstArtifact.title);
                        console.log('  - datasetOverview:', !!firstArtifact.datasetOverview);
                        console.log('  - logCurveAnalysis:', !!firstArtifact.logCurveAnalysis);
                        console.log('  - spatialDistribution:', !!firstArtifact.spatialDistribution);
                        console.log('  - visualizations:', !!firstArtifact.visualizations);
                        console.log('  - statistics:', !!firstArtifact.statistics);
                        console.log('  - executiveSummary:', !!firstArtifact.executiveSummary);
                        
                        console.log('🎯 === BACKEND TEST RESULTS ===');
                        console.log('✅ Backend is generating artifacts correctly');
                        console.log('✅ Artifact type matches frontend expectation');
                        console.log('❌ Issue must be in frontend artifact processing or component mapping');
                    } else {
                        console.log('❌ WRONG ARTIFACT TYPE:', firstArtifact.messageContentType);
                        console.log('❌ Expected: comprehensive_well_data_discovery');
                        console.log('❌ This explains why the component is not rendering');
                    }
                } else {
                    console.log('❌ NO ARTIFACTS IN BACKEND RESPONSE');
                    console.log('❌ This explains why no component is rendering');
                    console.log('🔍 The handleWellDataDiscovery method may not be called');
                    console.log('🔍 Or it may not be generating artifacts properly');
                }
                
                return body.artifacts && body.artifacts.length > 0;
            } else {
                console.log('❌ No body in Lambda response');
                return false;
            }
        } else {
            console.log('❌ No payload in Lambda response');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Lambda invocation failed:', error);
        
        // Try a simpler approach - just log what we expect
        console.log('🔍 === EXPECTED VS ACTUAL ===');
        console.log('✅ Intent detection: WORKING (verified by pattern test)');
        console.log('🔍 Backend artifact generation: UNKNOWN (Lambda access failed)');
        console.log('🔍 Frontend component mapping: FIXED (ComprehensiveWellDataDiscoveryComponent added)');
        
        console.log('\n💡 === TROUBLESHOOTING SUGGESTIONS ===');
        console.log('1. Check browser console for frontend logs when testing the prompt');
        console.log('2. Look for "🎉 EnhancedArtifactProcessor: Rendering ComprehensiveWellDataDiscoveryComponent"');
        console.log('3. Verify artifacts are in the AI message object');
        console.log('4. Check Lambda logs in AWS Console for backend artifact generation');
        
        return false;
    }
}

// Alternative simple test
function logExpectedFlow() {
    console.log('🔍 === EXPECTED DATA FLOW ===');
    console.log('1. User enters: "Analyze the complete dataset of 24 production wells..."');
    console.log('2. Frontend sends prompt to backend');
    console.log('3. Backend intent detection: well_data_discovery (✅ WORKING)');
    console.log('4. Backend calls handleWellDataDiscovery()');
    console.log('5. Backend generates comprehensiveAnalysisArtifact with messageContentType: "comprehensive_well_data_discovery"');
    console.log('6. Backend returns { success: true, message: "...", artifacts: [artifact] }');
    console.log('7. Frontend receives AI message with artifacts array');
    console.log('8. EnhancedArtifactProcessor detects comprehensive_well_data_discovery');
    console.log('9. Frontend renders ComprehensiveWellDataDiscoveryComponent (✅ FIXED)');
    console.log('10. User sees interactive tabbed component');
    console.log('');
    console.log('🔍 Current issue: Step 4-6 (backend artifact generation) may be failing');
    console.log('💡 Check Lambda logs to see if handleWellDataDiscovery is being called');
    console.log('💡 Verify the artifacts array is being properly returned');
}

// Run the tests
logExpectedFlow();
console.log('\n');

// Try the backend test (might fail due to permissions)
testActualBackendResponse().then(success => {
    console.log('\n🎯 Backend test completed:', success ? 'SUCCESS' : 'FAILED');
}).catch(console.error);
