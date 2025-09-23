/**
 * Test to identify sandbox Lambda function names and validate deployment
 * This will find your actual sandbox functions and test them
 */

const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testSandboxLambdaFunctions() {
    console.log('🔍 SANDBOX LAMBDA DISCOVERY: Finding your sandbox functions');
    console.log('Searching for functions matching sandbox identifier: agent-fix-lp');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // List all Lambda functions to find sandbox ones
        console.log('\n1. Discovering Lambda functions...');
        const listResponse = await lambda.listFunctions({ MaxItems: 100 }).promise();
        
        // Filter for sandbox functions
        const sandboxFunctions = listResponse.Functions?.filter(func => 
            func.FunctionName?.includes('agent-fix-lp') ||
            func.FunctionName?.includes('lightweightAgent') ||
            func.FunctionName?.includes('lightweight') ||
            func.Description?.includes('sandbox')
        ) || [];
        
        console.log('📋 All Lambda functions found:', listResponse.Functions?.length || 0);
        console.log('🎯 Sandbox candidates found:', sandboxFunctions.length);
        
        if (sandboxFunctions.length === 0) {
            console.log('\n⚠️ No sandbox functions found with identifier "agent-fix-lp"');
            console.log('💡 Let me search for any lightweight agent functions...');
            
            // Broader search for any lightweight agent functions
            const allLightweightFunctions = listResponse.Functions?.filter(func => 
                func.FunctionName?.toLowerCase().includes('lightweight') ||
                func.FunctionName?.toLowerCase().includes('agent')
            ) || [];
            
            console.log('📋 All lightweight/agent functions:', allLightweightFunctions.length);
            allLightweightFunctions.forEach(func => {
                console.log(`  - ${func.FunctionName} (${func.Runtime}, ${func.LastModified})`);
            });
            
            if (allLightweightFunctions.length === 0) {
                console.log('❌ No Lambda functions found. Please check your AWS region and credentials.');
                return;
            }
            
            // Test the most recently modified lightweight function
            const mostRecent = allLightweightFunctions.sort((a, b) => 
                new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime()
            )[0];
            
            console.log(`\n🎯 Testing most recent function: ${mostRecent.FunctionName}`);
            await testLambdaFunction(mostRecent.FunctionName);
            
        } else {
            console.log('\n🎯 Found sandbox functions:');
            sandboxFunctions.forEach(func => {
                console.log(`  - ${func.FunctionName}`);
                console.log(`    Runtime: ${func.Runtime}`);
                console.log(`    Last Modified: ${func.LastModified}`);
                console.log(`    Code Size: ${func.CodeSize} bytes`);
            });
            
            // Test each sandbox function
            for (const func of sandboxFunctions) {
                console.log(`\n🧪 Testing sandbox function: ${func.FunctionName}`);
                await testLambdaFunction(func.FunctionName);
            }
        }
        
        console.log('\n📋 SANDBOX DISCOVERY SUMMARY:');
        console.log('- Check the results above to see if your sandbox functions have the fixes');
        console.log('- If artifacts are missing, the sandbox deployment needs to be updated');
        console.log('- If intent detection is failing, the backend fixes are not deployed');
        
    } catch (error) {
        console.error('❌ SANDBOX DISCOVERY ERROR:', error.message);
        console.error('Make sure you have proper AWS credentials and permissions');
    }
}

async function testLambdaFunction(functionName) {
    try {
        const testPayload = {
            arguments: {
                chatSessionId: 'sandbox-test-' + Date.now(),
                message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
                foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                userId: 'sandbox-test-user'
            },
            identity: {
                sub: 'sandbox-test-user',
                username: 'sandbox-test-user'
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
        
        console.log(`  ⏰ Execution time: ${duration}ms`);
        console.log(`  📊 Status code: ${response.StatusCode}`);
        
        if (response.Payload) {
            const payloadStr = response.Payload.toString();
            console.log(`  📄 Payload length: ${payloadStr.length} bytes`);
            
            try {
                const parsed = JSON.parse(payloadStr);
                
                // Analyze response for our fixes
                console.log('  📊 Response Analysis:');
                console.log('    - Success:', parsed.success);
                console.log('    - Message length:', parsed.message?.length || 0);
                console.log('    - Has artifacts:', Array.isArray(parsed.artifacts));
                console.log('    - Artifact count:', parsed.artifacts?.length || 0);
                
                // Check for intent detection
                if (parsed.message && parsed.message.includes('Comprehensive Production Well Data Analysis Complete')) {
                    console.log('  ✅ INTENT DETECTION: Working correctly');
                    console.log('  ✅ PRELOADED PROMPT #1: Processing correctly');
                } else if (parsed.message && parsed.message.includes("I'd be happy to help you with your analysis!")) {
                    console.log('  ❌ INTENT DETECTION: Still using generic fallback');
                    console.log('  💥 BACKEND FIXES NOT DEPLOYED TO THIS FUNCTION');
                } else {
                    console.log('  ⚠️ INTENT DETECTION: Unexpected response type');
                    console.log('  📄 Message preview:', (parsed.message || '').substring(0, 100) + '...');
                }
                
                // Check for artifacts
                if (parsed.artifacts && parsed.artifacts.length > 0) {
                    console.log('  🎉 ARTIFACTS: Found in response!');
                    const firstArtifact = parsed.artifacts[0];
                    console.log('    - Type:', firstArtifact?.messageContentType || 'unknown');
                    console.log('    - Has log curve analysis:', !!firstArtifact?.logCurveAnalysis);
                    console.log('    - Log curve types:', firstArtifact?.logCurveAnalysis?.availableLogTypes?.length || 0);
                    
                    if (firstArtifact?.logCurveAnalysis?.availableLogTypes?.length > 0) {
                        console.log('  ✅ REAL S3 DATA: Integration confirmed');
                        console.log('    Sample curves:', firstArtifact.logCurveAnalysis.availableLogTypes.slice(0, 5).join(', '));
                    }
                } else {
                    console.log('  ❌ ARTIFACTS: Missing from response');
                    console.log('  💥 ARTIFACT GENERATION NOT WORKING IN THIS FUNCTION');
                }
                
                // Overall assessment
                const hasArtifacts = parsed.artifacts && parsed.artifacts.length > 0;
                const hasCorrectIntent = parsed.message && parsed.message.includes('Comprehensive Production Well Data Analysis Complete');
                
                if (hasArtifacts && hasCorrectIntent) {
                    console.log('  🎉 FUNCTION STATUS: All fixes working correctly!');
                } else if (hasCorrectIntent && !hasArtifacts) {
                    console.log('  ⚠️ FUNCTION STATUS: Intent detection working, artifacts missing');
                } else if (!hasCorrectIntent && hasArtifacts) {
                    console.log('  ⚠️ FUNCTION STATUS: Artifacts working, intent detection broken');
                } else {
                    console.log('  ❌ FUNCTION STATUS: Both fixes missing from this deployment');
                }
                
            } catch (parseError) {
                console.log('  ❌ Failed to parse response');
                console.log('  📄 Raw response preview:', payloadStr.substring(0, 200));
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Function test failed: ${error.message}`);
        if (error.message.includes('does not exist')) {
            console.log('  💡 This function may not exist in your AWS account');
        }
    }
}

testSandboxLambdaFunctions().catch(console.error);
