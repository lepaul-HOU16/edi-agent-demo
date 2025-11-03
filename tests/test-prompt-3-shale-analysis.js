/**
 * Test what's happening with Prompt 3: Comprehensive Shale Analysis
 * Check if it's generating the right artifact type and component mapping
 */

const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testPrompt3ShaleAnalysis() {
    console.log('🔍 TESTING PROMPT 3: Comprehensive Shale Analysis');
    console.log('Checking what artifact type it generates and why component mapping fails');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Test the working Lambda function with prompt 3 exactly
        const functionName = 'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY';
        
        console.log(`\n🎯 Testing prompt 3 with function: ${functionName}`);
        
        // Exact prompt 3 text
        const prompt3Text = 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.';
        
        const testPayload = {
            arguments: {
                chatSessionId: 'prompt3-test-' + Date.now(),
                message: prompt3Text,
                foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                userId: 'prompt3-test'
            },
            identity: {
                sub: 'prompt3-test',
                username: 'prompt3-test'
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
                
                console.log('📊 Prompt 3 Response Analysis:');
                console.log('- Success:', parsed.success);
                console.log('- Message length:', parsed.message?.length || 0);
                console.log('- Has artifacts:', Array.isArray(parsed.artifacts));
                console.log('- Artifact count:', parsed.artifacts?.length || 0);
                
                if (parsed.artifacts && parsed.artifacts.length > 0) {
                    console.log('🎉 PROMPT 3 GENERATES ARTIFACTS!');
                    
                    const firstArtifact = parsed.artifacts[0];
                    console.log('📦 First artifact analysis:');
                    console.log('- Message content type:', firstArtifact?.messageContentType);
                    console.log('- Analysis type:', firstArtifact?.analysisType);
                    console.log('- Has shale analysis:', !!firstArtifact?.shaleAnalysis);
                    console.log('- Has depth plots:', !!firstArtifact?.depthPlots);
                    console.log('- Has results:', !!firstArtifact?.results);
                    console.log('- Artifact keys:', Object.keys(firstArtifact || {}));
                    
                    // Check if it matches expected component mapping
                    if (firstArtifact?.messageContentType === 'comprehensive_shale_analysis') {
                        console.log('✅ ARTIFACT TYPE MATCHES: comprehensive_shale_analysis');
                        console.log('✅ Should render ComprehensiveShaleAnalysisComponent');
                    } else {
                        console.log('❌ ARTIFACT TYPE MISMATCH:');
                        console.log('  Expected: comprehensive_shale_analysis');
                        console.log('  Got:', firstArtifact?.messageContentType);
                        console.log('  🔧 This explains why prompt 3 shows simple text!');
                    }
                    
                } else {
                    console.log('❌ NO ARTIFACTS GENERATED');
                    console.log('💥 This explains why prompt 3 shows simple text');
                }
                
                // Check message content for analysis
                if (parsed.message) {
                    console.log('\n📝 Message analysis:');
                    if (parsed.message.includes('shale volume') && parsed.message.includes('WELL-001')) {
                        console.log('✅ Message contains shale analysis content');
                    } else {
                        console.log('❌ Message missing shale analysis content');
                    }
                    
                    console.log('📄 Message preview:', parsed.message.substring(0, 200) + '...');
                }
                
            } catch (parseError) {
                console.log('❌ Failed to parse prompt 3 response');
                console.log('📄 Raw response preview:', payloadStr.substring(0, 200));
            }
        }
        
        console.log('\n🎯 PROMPT 3 DIAGNOSIS:');
        console.log('This will show why prompt 3 isn\'t rendering the shale analysis component');
        
    } catch (error) {
        console.error('❌ PROMPT 3 TEST ERROR:', error.message);
    }
}

testPrompt3ShaleAnalysis().catch(console.error);
