// Comprehensive debugging to identify why educational responses are being overridden
const { getConfiguredAmplifyClient } = require('./utils/amplifyUtils');

async function debugEducationalResponses() {
    console.log('🔍 === COMPREHENSIVE EDUCATIONAL RESPONSE DEBUGGING ===');
    console.log('🎯 Goal: Identify why educational responses are being overridden');
    
    const amplifyClient = getConfiguredAmplifyClient();
    
    // Test the exact query from the user's screenshot
    const testQuery = "How I Run Individual Well Analysis";
    
    console.log(`📝 Testing query: "${testQuery}"`);
    console.log('📋 This should trigger our enhanced educational patterns...');
    console.log('⏰ Current time:', new Date().toISOString());
    
    try {
        console.log('🚀 Calling invokeLightweightAgent mutation...');
        
        const response = await amplifyClient.graphql({
            query: `
                mutation TestEducationalQuery {
                    invokeLightweightAgent(
                        chatSessionId: "debug-educational-${Date.now()}",
                        message: "${testQuery}",
                        foundationModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
                        userId: "debug-user"
                    ) {
                        success
                        message
                        artifacts
                    }
                }
            `
        });
        
        console.log('✅ GraphQL Response Received');
        console.log('📊 Response Structure:', {
            hasData: !!response.data,
            hasErrors: !!response.errors,
            dataKeys: response.data ? Object.keys(response.data) : [],
            errorCount: response.errors?.length || 0
        });
        
        if (response.errors) {
            console.error('❌ GraphQL Errors:', response.errors);
            return;
        }
        
        const result = response.data?.invokeLightweightAgent;
        
        console.log('\n🔍 === DETAILED RESPONSE ANALYSIS ===');
        console.log('✅ Success:', result?.success);
        console.log('📝 Message Length:', result?.message?.length || 0);
        console.log('📦 Artifacts Count:', result?.artifacts?.length || 0);
        
        console.log('\n📄 === MESSAGE CONTENT ANALYSIS ===');
        const message = result?.message || '';
        
        // Check for specific patterns
        const patterns = [
            { name: 'Generic Response', pattern: /I understand you're asking about/i },
            { name: 'Quick Answers Format', pattern: /Quick Answers:/i },
            { name: 'Educational Content', pattern: /step-by-step/i },
            { name: 'Interactive Guide', pattern: /Interactive.*Guide/i },
            { name: 'Well Count Reference', pattern: /your \d+ wells/i },
            { name: 'Detailed Explanation', pattern: /(Overview|Step-by-Step Process)/i }
        ];
        
        patterns.forEach(({ name, pattern }) => {
            const matches = pattern.test(message);
            console.log(`${matches ? '✅' : '❌'} ${name}: ${matches ? 'DETECTED' : 'NOT FOUND'}`);
        });
        
        console.log('\n📄 First 500 characters of response:');
        console.log(message.substring(0, 500));
        console.log('...\n');
        
        console.log('🎯 === DIAGNOSIS ===');
        if (message.includes('I understand you\'re asking about')) {
            console.log('❌ PROBLEM: Agent is providing generic responses instead of educational content');
            console.log('💡 This suggests our educational patterns are not being detected properly');
            console.log('🔍 The agent is routing to a fallback handler instead of our enhanced educational logic');
        } else if (message.includes('step-by-step') || message.includes('Overview')) {
            console.log('✅ SUCCESS: Educational content is being generated properly');
            console.log('🎉 Interactive educational responses are working!');
        } else {
            console.log('⚠️ UNKNOWN: Response format is unexpected');
        }
        
        console.log('\n📦 === ARTIFACTS ANALYSIS ===');
        if (result?.artifacts && result.artifacts.length > 0) {
            console.log('✅ Artifacts generated:', result.artifacts.length);
            result.artifacts.forEach((artifact, index) => {
                console.log(`📄 Artifact ${index}:`, {
                    type: artifact.messageContentType || artifact.type || 'unknown',
                    hasTitle: !!artifact.title,
                    hasSteps: !!artifact.steps,
                    isInteractive: artifact.messageContentType === 'interactive_educational'
                });
            });
        } else {
            console.log('❌ No artifacts generated - educational components missing');
        }
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
    
    console.log('\n🔚 === DEBUGGING COMPLETE ===');
}

debugEducationalResponses().catch(console.error);
