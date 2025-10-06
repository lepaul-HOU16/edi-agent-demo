/**
 * Test the EXACT workflow your UI uses
 * This will replicate your UI's authentication and GraphQL calls exactly
 */

const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');

async function testExactUIWorkflow() {
    console.log('🔍 EXACT UI WORKFLOW TEST');
    console.log('Replicating your UI authentication and GraphQL calls exactly');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Load your actual sandbox configuration
        const outputs = require('./amplify_outputs.json');
        
        console.log('📋 Using your sandbox configuration:');
        console.log('  - GraphQL Endpoint:', outputs.data.url);
        console.log('  - Region:', outputs.data.aws_region);
        console.log('  - Auth Mode:', outputs.data.default_authorization_type);
        
        // Configure Amplify exactly like your UI does (same as ConfigureAmplify.tsx)
        Amplify.configure(outputs, { ssr: true });

        const client = generateClient();
        
        console.log('\n🧪 STEP 1: Testing GraphQL introspection');
        
        // First, let's see what mutations are actually available
        console.log('Available client mutations:', Object.keys(client.mutations || {}));
        console.log('Available client models:', Object.keys(client.models || {}));
        
        console.log('\n🧪 STEP 2: Testing ChatSession creation (like your UI does)');
        
        // Create a test chat session like your UI
        const testChatSessionId = 'exact-ui-test-' + Date.now();
        try {
            const sessionResult = await client.models.ChatSession.create({
                name: 'Exact UI Test Session'
            });
            
            if (sessionResult.data?.id) {
                console.log('  ✅ ChatSession created:', sessionResult.data.id);
            } else {
                console.log('  ❌ ChatSession creation failed:', sessionResult.errors);
            }
        } catch (sessionError) {
            console.log('  ❌ ChatSession error:', sessionError.message);
            console.log('  💡 This might indicate auth issues');
        }
        
        console.log('\n🧪 STEP 3: Testing invokeLightweightAgent mutation (exact UI call)');
        
        // Test the exact GraphQL mutation your UI calls
        try {
            if (client.mutations && client.mutations.invokeLightweightAgent) {
                console.log('  📡 Calling invokeLightweightAgent mutation...');
                
                const mutationResult = await client.mutations.invokeLightweightAgent({
                    chatSessionId: testChatSessionId,
                    message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
                    foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                    userId: 'exact-ui-test'
                });
                
                console.log('  📊 Mutation response analysis:');
                console.log('    - Success:', mutationResult.data?.success);
                console.log('    - Message length:', mutationResult.data?.message?.length || 0);
                console.log('    - Has artifacts:', Array.isArray(mutationResult.data?.artifacts));
                console.log('    - Artifact count:', mutationResult.data?.artifacts?.length || 0);
                console.log('    - Errors:', mutationResult.errors?.length || 0);
                
                if (mutationResult.data?.success && mutationResult.data?.artifacts?.length > 0) {
                    console.log('  🎉 YOUR UI BACKEND IS WORKING CORRECTLY!');
                    console.log('  🔍 Artifacts are being generated and returned');
                    console.log('  💡 The issue must be in frontend processing or component rendering');
                    
                    const firstArtifact = mutationResult.data.artifacts[0];
                    console.log('  📦 First artifact details:');
                    console.log('    - Type:', firstArtifact?.messageContentType);
                    console.log('    - Has log curves:', !!firstArtifact?.logCurveAnalysis);
                    console.log('    - Log curve count:', firstArtifact?.logCurveAnalysis?.availableLogTypes?.length || 0);
                    
                } else if (mutationResult.errors?.length > 0) {
                    console.log('  ❌ GraphQL MUTATION ERRORS:');
                    mutationResult.errors.forEach((error, index) => {
                        console.log(`    Error ${index + 1}: ${error.message}`);
                        if (error.errorType) console.log(`    Type: ${error.errorType}`);
                    });
                    
                    if (mutationResult.errors.some(e => e.message.includes('401') || e.message.includes('Unauthorized'))) {
                        console.log('  🚨 AUTHENTICATION ISSUE DETECTED');
                        console.log('  💡 You need to log into your sandbox environment');
                    }
                    
                } else if (mutationResult.data?.success === false) {
                    console.log('  ❌ Agent execution failed:');
                    console.log('    Message:', mutationResult.data?.message);
                    
                } else {
                    console.log('  ❌ Unexpected mutation response');
                    console.log('    Raw data:', mutationResult.data);
                }
                
            } else {
                console.log('  ❌ invokeLightweightAgent mutation NOT AVAILABLE');
                console.log('  💥 This means your GraphQL schema wasn\'t deployed correctly');
                console.log('  🔧 You need to redeploy your backend schema');
            }
            
        } catch (mutationError) {
            console.log('  ❌ Mutation call failed:', mutationError.message);
            
            if (mutationError.message.includes('401') || mutationError.message.includes('Unauthorized')) {
                console.log('  🚨 AUTHENTICATION ERROR CONFIRMED');
                console.log('  💡 You need to authenticate with your sandbox');
                console.log('  🔧 Try: amplify auth signin');
            } else if (mutationError.message.includes('Network')) {
                console.log('  🌐 NETWORK ERROR');
                console.log('  💡 Check your internet connection and GraphQL endpoint');
            }
        }
        
        console.log('\n🎯 === EXACT UI WORKFLOW DIAGNOSIS ===');
        console.log('This test replicates exactly what your browser does when you use the UI.');
        console.log('If this test works but your UI doesn\'t, the issue is browser-specific.');
        console.log('If this test fails, the issue is in authentication or backend deployment.');
        
    } catch (error) {
        console.error('❌ EXACT UI WORKFLOW TEST ERROR:', error.message);
        
        if (error.message.includes('amplify_outputs.json')) {
            console.log('💡 Your sandbox configuration file is missing or corrupted');
            console.log('🔧 Try redeploying your sandbox to regenerate amplify_outputs.json');
        }
    }
}

testExactUIWorkflow().catch(console.error);
