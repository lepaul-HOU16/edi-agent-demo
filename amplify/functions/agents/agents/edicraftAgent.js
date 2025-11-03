/**
 * EDIcraft Agent Wrapper
 * Simplified wrapper that delegates to the EDIcraft handler
 * Requirements: 2.1, 2.3, 5.1, 5.2
 */
import { handler } from '../edicraftAgent/handler.js';
export class EDIcraftAgent {
    constructor() {
        console.log('✅ EDIcraftAgent initialized');
    }
    /**
     * Process a message through the EDIcraft agent
     * Delegates to the actual handler which invokes Bedrock AgentCore
     * Requirements: 2.1, 2.3, 5.1, 5.2
     */
    async processMessage(message) {
        console.log('🎮 EDIcraftAgent: Processing message:', message);
        try {
            // Create event structure expected by handler
            const event = {
                arguments: {
                    userId: 'router-user', // Will be overridden by actual user context
                    message: message
                },
                identity: {
                    sub: 'router-user'
                }
            };
            // Call the actual handler
            const response = await handler(event, {});
            console.log('🎮 EDIcraftAgent: Handler response:', JSON.stringify(response, null, 2));
            return response;
        }
        catch (error) {
            console.error('❌ EDIcraftAgent error:', error);
            return {
                success: false,
                message: `Error processing EDIcraft request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                artifacts: [],
                thoughtSteps: [],
                connectionStatus: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
