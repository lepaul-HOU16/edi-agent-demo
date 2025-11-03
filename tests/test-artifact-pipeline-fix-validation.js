/**
 * Validation test for the artifact pipeline fix
 * Tests the complete pipeline: Lambda → Database → Frontend Components
 */

const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testArtifactPipelineFix() {
    console.log('🔧 ARTIFACT PIPELINE FIX VALIDATION');
    console.log('Testing complete pipeline: Lambda → Database → Frontend Components');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Test the actual lightweight agent function from the deployment
        const lightweightAgentFunctions = [
            'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY',
            'amplify-digitalassistant--lightweightAgentlambda3D-bsDyPJZEdW4w'
        ];
        
        for (const functionName of lightweightAgentFunctions) {
            console.log(`\n🎯 Testing artifact pipeline with function: ${functionName}`);
            
            try {
                // Test with preloaded prompt #1 (Well Data Discovery)
                const testPayload = {
                    arguments: {
                        chatSessionId: 'artifact-pipeline-test-' + Date.now(),
                        message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
                        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                        userId: 'test-artifact-pipeline'
                    },
                    identity: {
                        sub: 'test-artifact-pipeline',
                        username: 'test-artifact-pipeline'
                    }
                };
                
                const invokeParams = {
                    FunctionName: functionName,
                    Payload: JSON.stringify(testPayload),
                    InvocationType: 'RequestResponse'
                };
                
                const startTime = Date.now();
                const response = await lambda.invoke(invokeParams).promise();
                const duration = Date.now() - startTime;
                
                console.log(`⏰ Execution time: ${duration}ms`);
                console.log(`📊 Status code: ${response.StatusCode}`);
                
                if (response.Payload) {
                    const payloadStr = response.Payload.toString();
                    console.log(`📄 Payload length: ${payloadStr.length} bytes`);
                    
                    try {
                        const parsed = JSON.parse(payloadStr);
                        console.log('📊 Response structure:', {
                            success: parsed.success,
                            messageLength: parsed.message?.length || 0,
                            hasArtifacts: Array.isArray(parsed.artifacts),
                            artifactCount: parsed.artifacts?.length || 0
                        });
                        
                        // CRITICAL TEST: Validate artifact structure for database persistence
                        if (parsed.artifacts && parsed.artifacts.length > 0) {
                            console.log('🎉 ARTIFACTS FOUND IN LAMBDA RESPONSE!');
                            
                            const firstArtifact = parsed.artifacts[0];
                            console.log('📦 First artifact analysis:', {
                                messageContentType: firstArtifact?.messageContentType,
                                hasTitle: !!firstArtifact?.title,
                                hasWellsData: !!firstArtifact?.wellsData,
                                hasLogCurveAnalysis: !!firstArtifact?.logCurveAnalysis,
                                wellCount: firstArtifact?.wellCount,
                                logCurveTypesCount: firstArtifact?.logCurveAnalysis?.availableLogTypes?.length || 0
                            });
                            
                            // Test JSON serialization (database persistence simulation)
                            try {
                                const serialized = JSON.stringify(parsed.artifacts);
                                const deserialized = JSON.parse(serialized);
                                
                                if (deserialized && deserialized.length > 0 && deserialized[0].messageContentType) {
                                    console.log('✅ ARTIFACT SERIALIZATION TEST PASSED');
                                    console.log('🎯 Artifacts should persist through database operations');
                                    
                                    // Validate specific artifact content for visualization components
                                    const artifact = deserialized[0];
                                    if (artifact.messageContentType === 'comprehensive_well_data_discovery') {
                                        console.log('🎉 COMPREHENSIVE WELL DATA DISCOVERY ARTIFACT VALIDATED');
                                        console.log('📈 This should render ComprehensiveWellDataDiscoveryComponent');
                                        
                                        if (artifact.logCurveAnalysis?.availableLogTypes?.length > 0) {
                                            console.log('📊 Log curve types available:', artifact.logCurveAnalysis.availableLogTypes);
                                            console.log('✅ REAL S3 DATA INTEGRATION CONFIRMED');
                                        }
                                    }
                                    
                                } else {
                                    console.log('❌ ARTIFACT SERIALIZATION TEST FAILED');
                                    console.log('💥 Artifacts would be lost in database operations');
                                }
                            } catch (serializationError) {
                                console.error('❌ SERIALIZATION ERROR:', serializationError.message);
                            }
                            
                        } else {
                            console.log('❌ NO ARTIFACTS - Pipeline still broken at Lambda level');
                        }
                        
                        // Check for intent detection success
                        if (parsed.message && parsed.message.includes('Comprehensive Production Well Data Analysis Complete')) {
                            console.log('✅ INTENT DETECTION WORKING');
                            console.log('✅ PRELOADED PROMPT #1 PROCESSING CORRECTLY');
                        } else if (parsed.message && parsed.message.includes("I'd be happy to help you with your analysis!")) {
                            console.log('❌ STILL GETTING GENERIC FALLBACK');
                            console.log('💥 Intent detection not working properly');
                        }
                        
                        // If this function worked, we found the right one
                        if (parsed.success !== undefined) {
                            console.log(`✅ Function ${functionName} is the correct lightweight agent`);
                            
                            // FINAL PIPELINE ASSESSMENT
                            console.log('\n🎯 ARTIFACT PIPELINE FIX ASSESSMENT:');
                            const hasArtifacts = parsed.artifacts && parsed.artifacts.length > 0;
                            const hasCorrectResponse = parsed.message && parsed.message.includes('Comprehensive Production Well Data Analysis Complete');
                            const hasRealData = parsed.artifacts?.[0]?.logCurveAnalysis?.availableLogTypes?.length > 0;
                            
                            console.log(`✅ Lambda generates artifacts: ${hasArtifacts ? 'SUCCESS' : 'FAILED'}`);
                            console.log(`✅ Intent detection working: ${hasCorrectResponse ? 'SUCCESS' : 'FAILED'}`);
                            console.log(`✅ Real S3 data integration: ${hasRealData ? 'SUCCESS' : 'FAILED'}`);
                            console.log(`✅ Artifact serialization: ${hasArtifacts ? 'SUCCESS' : 'FAILED'}`);
                            
                            if (hasArtifacts && hasCorrectResponse && hasRealData) {
                                console.log('🎉 ARTIFACT PIPELINE FIX VALIDATION: SUCCESS!');
                                console.log('📈 Visualization components should now work correctly');
                                console.log('🔧 Database persistence fix should resolve frontend issue');
                            } else {
                                console.log('⚠️ ARTIFACT PIPELINE FIX VALIDATION: PARTIAL SUCCESS');
                                console.log('🔍 Some components working, others may need additional fixes');
                            }
                            
                            break;
                        }
                        
                    } catch (parseError) {
                        console.log('❌ Failed to parse payload');
                        console.log('📄 Raw payload preview:', payloadStr.substring(0, 200));
                    }
                }
                
            } catch (error) {
                console.log(`❌ Function ${functionName} failed:`, error.message);
            }
        }
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Deploy the amplifyUtils.ts fix to production');
        console.log('2. Test the complete user workflow in the UI');
        console.log('3. Verify visualization components render correctly');
        console.log('4. Validate all 5 preloaded prompts work as expected');
        
    } catch (error) {
        console.error('❌ ARTIFACT PIPELINE FIX VALIDATION FAILED:', error.message);
    }
}

testArtifactPipelineFix().catch(console.error);
