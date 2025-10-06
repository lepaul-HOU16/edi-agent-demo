/**
 * Check which Lambda function your sandbox is actually configured to use
 */

const { generateClient } = require('aws-amplify/data');

async function checkSandboxConfiguration() {
    console.log('🔍 SANDBOX CONFIGURATION CHECK: Determining which function your UI calls');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Load Amplify configuration
        const outputs = require('./amplify_outputs.json');
        
        console.log('📋 AMPLIFY CONFIGURATION:');
        console.log('- GraphQL Endpoint:', outputs.data.url);
        console.log('- Region:', outputs.data.aws_region);
        console.log('- Default Auth Mode:', outputs.data.default_authorization_type);
        
        // Configure Amplify
        const { Amplify } = require('aws-amplify');
        Amplify.configure({
            API: {
                GraphQL: {
                    endpoint: outputs.data.url,
                    region: outputs.data.aws_region,
                    defaultAuthMode: 'identityPool'
                }
            }
        }, {
            Auth: {
                credentialsProvider: {
                    getCredentialsAndIdentityId: async () => ({
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                            sessionToken: process.env.AWS_SESSION_TOKEN,
                        },
                    }),
                    clearCredentialsAndIdentityId: () => {
                        /* noop */
                    },
                },
            },
        });

        const client = generateClient({
            authMode: 'identityPool'
        });
        
        console.log('\n🧪 TESTING YOUR SANDBOX UI FUNCTION:');
        console.log('This will call the same function your UI uses...');
        
        // Test the exact same mutation your UI calls
        const testChatSessionId = 'sandbox-config-test-' + Date.now();
        
        console.log('Invoking invokeLightweightAgent mutation...');
        const response = await client.mutations.invokeLightweightAgent({
            chatSessionId: testChatSessionId,
            message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
            foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            userId: 'sandbox-config-test'
        });

        console.log('\n📊 SANDBOX UI FUNCTION ANALYSIS:');
        console.log('- Success:', response.data?.success);
        console.log('- Message length:', response.data?.message?.length || 0);
        console.log('- Has artifacts:', Array.isArray(response.data?.artifacts));
        console.log('- Artifact count:', response.data?.artifacts?.length || 0);
        console.log('- Has errors:', !!response.errors);
        
        if (response.errors) {
            console.log('- Errors:', response.errors);
        }
        
        // Analyze the response to determine which function is being called
        if (response.data?.success && response.data?.artifacts?.length > 0) {
            console.log('\n✅ YOUR SANDBOX IS CALLING THE WORKING FUNCTION!');
            console.log('🎯 Function: amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY');
            console.log('📈 This means the artifacts should be working in your UI');
            console.log('💡 The issue might be in the frontend artifact pipeline instead');
            
            const firstArtifact = response.data.artifacts[0];
            console.log('🔍 Artifact details:');
            console.log('  - Type:', firstArtifact?.messageContentType);
            console.log('  - Has log curves:', !!firstArtifact?.logCurveAnalysis);
            console.log('  - Log curve types:', firstArtifact?.logCurveAnalysis?.availableLogTypes?.length || 0);
            
        } else if (response.data?.success === false && response.data?.message?.includes('MCP tool list_wells')) {
            console.log('\n❌ YOUR SANDBOX IS CALLING THE BROKEN FUNCTION!');
            console.log('💥 Function: amplify-digitalassistant--lightweightAgentlambda3D-bsDyPJZEdW4w');
            console.log('🔧 This explains why your UI shows the old behavior');
            console.log('📋 SOLUTION: We need to redirect your sandbox to use the working function');
            
        } else if (response.data?.message?.includes("I'd be happy to help you with your analysis!")) {
            console.log('\n⚠️ YOUR SANDBOX IS USING A FUNCTION WITHOUT INTENT DETECTION FIXES');
            console.log('💡 The backend fixes haven\'t been deployed to your sandbox function');
            
        } else {
            console.log('\n🤔 UNEXPECTED RESPONSE FROM YOUR SANDBOX FUNCTION');
            console.log('📄 Message preview:', (response.data?.message || '').substring(0, 200));
            console.log('💡 This might be a different issue entirely');
        }
        
        console.log('\n📋 NEXT STEPS:');
        if (response.data?.success && response.data?.artifacts?.length > 0) {
            console.log('1. The backend is working correctly');
            console.log('2. Check browser console for frontend errors');
            console.log('3. Verify the frontend artifact processing in amplifyUtils.ts');
        } else {
            console.log('1. Your sandbox needs to be redirected to the working Lambda function');
            console.log('2. Update your sandbox configuration to use: amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY');
            console.log('3. Redeploy your sandbox with the correct function configuration');
        }
        
    } catch (error) {
        console.error('❌ SANDBOX CONFIGURATION CHECK ERROR:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack?.substring(0, 500)
        });
    }
}

checkSandboxConfiguration().catch(console.error);
