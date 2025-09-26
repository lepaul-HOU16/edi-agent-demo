/**
 * Test Chain of Thought System
 * Validates UI components and data flow
 */

const { generateClient } = require('aws-amplify/data');

async function testChainOfThoughtUI() {
    console.log('🧪 Testing Chain of Thought UI System...');
    
    try {
        const client = generateClient();
        
        // Create a test chat session
        const chatSession = await client.models.ChatSession.create({
            name: 'Chain of Thought Test Session'
        });
        
        console.log('✅ Created test chat session:', chatSession.data.id);
        
        // Create a test AI message with thought steps
        const testMessage = {
            role: 'ai',
            content: {
                text: 'Test porosity calculation completed successfully with detailed reasoning process.'
            },
            chatSessionId: chatSession.data.id,
            thoughtSteps: [
                {
                    id: 'test-intent-1',
                    type: 'intent_detection',
                    timestamp: Date.now() - 4000,
                    title: 'Analyzing User Request',
                    summary: 'Processing natural language input to understand analysis requirements',
                    details: 'Intent detected: calculate_porosity with 97% confidence\nWell: WELL-001\nMethod: density',
                    confidence: 0.97,
                    duration: 250,
                    status: 'complete',
                    context: {
                        analysisType: 'calculate_porosity',
                        wellName: 'WELL-001',
                        method: 'density'
                    }
                },
                {
                    id: 'test-param-2',
                    type: 'parameter_extraction',
                    timestamp: Date.now() - 3500,
                    title: 'Extracting Parameters',
                    summary: 'Identifying analysis parameters for porosity calculation',
                    details: 'Parameters extracted:\n- Analysis type: calculate_porosity\n- Well: WELL-001\n- Method: density',
                    confidence: 0.95,
                    duration: 180,
                    status: 'complete',
                    context: {
                        analysisType: 'calculate_porosity',
                        wellName: 'WELL-001',
                        method: 'density'
                    }
                },
                {
                    id: 'test-exec-3',
                    type: 'execution',
                    timestamp: Date.now() - 2000,
                    title: 'Executing Analysis',
                    summary: 'Running porosity calculation with MCP tools',
                    details: 'Handler execution completed: Success\nGenerated 1 artifacts\nProcessed 2,847 data points',
                    duration: 850,
                    status: 'complete',
                    context: {
                        analysisType: 'calculate_porosity',
                        wellName: 'WELL-001',
                        method: 'density'
                    }
                }
            ]
        };
        
        // Store the message in database
        const messageResult = await client.models.ChatMessage.create(testMessage);
        
        console.log('✅ Created test message with thought steps:', messageResult.data.id);
        console.log('🔍 Message thought steps:', messageResult.data.thoughtSteps?.length || 0);
        
        console.log('🎯 Test completed! Navigate to chat session:', chatSession.data.id);
        console.log('🔗 URL: http://localhost:3000/chat/' + chatSession.data.id);
        
        return {
            success: true,
            chatSessionId: chatSession.data.id,
            messageId: messageResult.data.id,
            thoughtStepsCount: messageResult.data.thoughtSteps?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Chain of thought test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
if (require.main === module) {
    testChainOfThoughtUI().then(result => {
        console.log('🏁 Test Result:', result);
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { testChainOfThoughtUI };
