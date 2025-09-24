// Test the enhanced conversational agent directly to debug educational responses
const { EnhancedStrandsAgent } = require('./amplify/functions/agents/enhancedStrandsAgent');

async function testEducationalResponses() {
    console.log('🧪 === TESTING ENHANCED EDUCATIONAL AGENT DIRECTLY ===');
    
    const agent = new EnhancedStrandsAgent();
    
    // Test educational queries that should trigger detailed explanations
    const testQueries = [
        "explain how you run individual well analysis",
        "explain individual well analysis", 
        "how do you run individual well analysis",
        "what is the difference between larionov and linear methods",
        "compare porosity methods",
        "how do you interpret gamma ray logs"
    ];
    
    for (const query of testQueries) {
        console.log(`\n📝 Testing Query: "${query}"`);
        console.log('=' .repeat(80));
        
        try {
            const result = await agent.processMessage(query);
            
            console.log('✅ Result Success:', result.success);
            console.log('📊 Message Length:', result.message?.length || 0);
            console.log('📄 Response Preview:', (result.message || '').substring(0, 200) + '...');
            console.log('🎯 Intent Detection Check:', result.message?.includes('step-by-step') || result.message?.includes('methodology') || result.message?.includes('Overview'));
            
            if (result.message && result.message.length < 500) {
                console.log('⚠️ SHORT RESPONSE - May not be educational content');
            }
            
            if (result.message && (result.message.includes('Quick Answers') || result.message.includes('Detailed Analysis'))) {
                console.log('❌ GENERIC RESPONSE DETECTED - Educational patterns not working');
            }
            
        } catch (error) {
            console.error('❌ Error testing query:', error);
        }
        
        console.log('\n' + '='.repeat(80));
    }
    
    console.log('\n🔍 === TEST COMPLETE ===');
}

testEducationalResponses().catch(console.error);
