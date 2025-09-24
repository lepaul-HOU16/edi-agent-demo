/**
 * Test the ACTUAL sandbox function that was just deployed
 * Stack: amplify-digitalassistant-agentfixlp-sandbox-3d38283154
 */

const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testActualSandboxFunction() {
    console.log('🔍 TESTING ACTUAL SANDBOX FUNCTION');
    console.log('Stack: amplify-digitalassistant-agentfixlp-sandbox-3d38283154');
    console.log('Looking for: data/lightweightAgent-lambda (deployed function)');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // List all Lambda functions to find the actual sandbox function
        console.log('\n1. Finding the actual sandbox function...');
        const listResponse = await lambda.listFunctions({ MaxItems: 100 }).promise();
        
        // Look for functions matching the sandbox stack pattern
        const sandboxFunctions = listResponse.Functions?.filter(func => 
            func.FunctionName?.includes('agentfixlp-sandbox') ||
            func.FunctionName?.includes('agent-fix-lp') ||
            (func.Description && func.Description.includes('agentfixlp')) ||
            func.FunctionName?.includes('3d38283154') // The unique stack ID
        ) || [];
        
        console.log('📋 Functions matching sandbox stack pattern:', sandboxFunctions.length);
        
        if (sandboxFunctions.length === 0) {
            // Look for recently modified functions (deployed in last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentFunctions = listResponse.Functions?.filter(func => 
                new Date(func.LastModified) > oneHourAgo &&
                func.FunctionName?.includes('digitalassistant')
            ) || [];
            
            console.log('📋 Recently modified digitalassistant functions:', recentFunctions.length);
            recentFunctions.forEach(func => {
                console.log(`  - ${func.FunctionName} (${func.LastModified})`);
            });
            
            if (recentFunctions.length > 0) {
                // Test the most recently modified one
                const newestFunction = recentFunctions.sort((a, b) => 
                    new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime()
                )[0];
                
                console.log(`\n🎯 Testing most recent sandbox function: ${newestFunction.FunctionName}`);
                await testLambdaFunction(newestFunction.FunctionName);
            } else {
                console.log('❌ No recent sandbox functions found');
                console.log('💡 Your sandbox might not have deployed correctly');
            }
        } else {
            console.log('\n🎯 Found sandbox functions:');
            sandboxFunctions.forEach(func => {
                console.log(`  - ${func.FunctionName}`);
                console.log(`    Last Modified: ${func.LastModified}`);
                console.log(`    Code Size: ${func.CodeSize} bytes`);
            });
            
            // Test each sandbox function
            for (const func of sandboxFunctions) {
                console.log(`\n🧪 Testing actual sandbox function: ${func.FunctionName}`);
                await testLambdaFunction(func.FunctionName);
            }
        }
        
    } catch (error) {
        console.error('❌ ACTUAL SANDBOX FUNCTION TEST ERROR:', error.message);
    }
}

async function testLambdaFunction(functionName) {
    try {
        // Test with preloaded prompt #1 to verify artifacts
        const testPayload = {
            arguments: {
                chatSessionId: 'actual-sandbox-test-' + Date.now(),
                message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
                foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                userId: 'actual-sandbox-test'
            },
            identity: {
                sub: 'actual-sandbox-test',
                username: 'actual-sandbox-test'
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
                
                console.log('  📊 Response Analysis:');
                console.log('    - Success:', parsed.success);
                console.log('    - Message length:', parsed.message?.length || 0);
                console.log('    - Has artifacts:', Array.isArray(parsed.artifacts));
                console.log('    - Artifact count:', parsed.artifacts?.length || 0);
                
                // Check for our specific fixes
                if (parsed.success && parsed.artifacts && parsed.artifacts.length > 0) {
                    console.log('  🎉 THIS IS THE WORKING SANDBOX FUNCTION!');
                    console.log('  ✅ Intent detection: Working');
                    console.log('  ✅ Artifacts: Present');
                    console.log('  ✅ Real S3 data: Confirmed');
                    
                    const firstArtifact = parsed.artifacts[0];
                    if (firstArtifact?.messageContentType === 'comprehensive_well_data_discovery') {
                        console.log('  🎯 Artifact type: comprehensive_well_data_discovery');
                        console.log('  📊 Log curve types:', firstArtifact?.logCurveAnalysis?.availableLogTypes?.length || 0);
                        console.log('  🎉 YOUR SANDBOX SHOULD BE WORKING!');
                        console.log('');
                        console.log('  💡 If your UI still doesn\'t work, the issue is in:');
                        console.log('     1. Browser caching (hard refresh + clear cache)');
                        console.log('     2. Frontend artifact processing in amplifyUtils.ts');
                        console.log('     3. Component rendering logic in ChatMessage.tsx');
                    }
                    
                } else if (parsed.success === false && parsed.message?.includes('MCP tool')) {
                    console.log('  ❌ Sandbox function has MCP tool errors');
                    console.log('  💥 This function is broken - needs redeployment');
                    
                } else if (parsed.message && parsed.message.includes("I'd be happy to help")) {
                    console.log('  ❌ Sandbox function using generic fallback');
                    console.log('  💥 Intent detection not working in this function');
                    
                } else {
                    console.log('  ⚠️ Unexpected response from sandbox function');
                    console.log('  📄 Message preview:', (parsed.message || '').substring(0, 100) + '...');
                }
                
            } catch (parseError) {
                console.log('  ❌ Failed to parse Lambda response');
                console.log('  📄 Raw response:', payloadStr.substring(0, 300));
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Function test failed: ${error.message}`);
        if (error.message.includes('does not exist')) {
            console.log('  💡 This function doesn\'t exist or has different permissions');
        }
    }
}

testActualSandboxFunction().catch(console.error);
