/**
 * Strands Agent Handler for Renewable Energy Orchestrator
 * 
 * This handler invokes the Strands Agent system instead of individual tool Lambdas.
 * The agents handle intelligent decision-making, tool selection, and workflow orchestration.
 */

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { RenewableIntentClassifier } from './RenewableIntentClassifier';
import type { OrchestratorResponse } from './types';

interface StrandsAgentEvent {
  userMessage: string;
  chatSessionId: string;
  projectContext: Record<string, any>;
}

const lambda = new LambdaClient({});
const intentClassifier = new RenewableIntentClassifier();

// Get Strands Agent function name from environment
const STRANDS_AGENT_FUNCTION_NAME = process.env.RENEWABLE_AGENTS_FUNCTION_NAME;

/**
 * Invoke the Strands Agent system
 */
async function invokeStrandsAgent(
  agentType: 'multi' | 'terrain' | 'layout' | 'simulation' | 'report',
  query: string,
  parameters: Record<string, any>
): Promise<any> {
  
  if (!STRANDS_AGENT_FUNCTION_NAME) {
    throw new Error('RENEWABLE_AGENTS_FUNCTION_NAME environment variable not set');
  }

  const payload = {
    agent: agentType,
    query,
    parameters
  };

  console.log(`Invoking Strands Agent (${agentType}) with query:`, query.substring(0, 200));

  const command = new InvokeCommand({
    FunctionName: STRANDS_AGENT_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await lambda.send(command);
  
  if (!response.Payload) {
    throw new Error('No response from Strands Agent');
  }

  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  
  console.log('Raw Strands Agent response:', JSON.stringify(result, null, 2));
  
  // Handle different response formats
  if (result.statusCode) {
    // API Gateway format
    if (result.statusCode !== 200) {
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      throw new Error(body.error || 'Strands Agent invocation failed');
    }
    return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  } else {
    // Direct Lambda response format
    return result;
  }
}

/**
 * Main handler using Strands Agents
 */
export async function handleWithStrandsAgents(
  event: StrandsAgentEvent
): Promise<OrchestratorResponse> {
  
  const { userMessage, chatSessionId, projectContext } = event;

  console.log('=== Strands Agent Handler ===');
  console.log('User message:', userMessage);
  console.log('Project context:', JSON.stringify(projectContext, null, 2));

  try {
    // Classify intent
    const intent = intentClassifier.classifyIntent(userMessage);
    console.log('Classified intent:', intent.intent);

    // Build parameters from project context
    const parameters: Record<string, any> = {
      chat_session_id: chatSessionId,
      ...projectContext
    };

    // Route to appropriate agent based on intent
    let agentType: 'multi' | 'terrain' | 'layout' | 'simulation' | 'report';
    let agentQuery = userMessage;

    switch (intent.intent) {
      case 'terrain_analysis':
        agentType = 'terrain';
        break;
      
      case 'layout_optimization':
        agentType = 'layout';
        break;
      
      case 'wake_simulation':
      case 'wind_rose':
        agentType = 'simulation';
        break;
      
      case 'report_generation':
        agentType = 'report';
        break;
      
      case 'complete_workflow':
        // Use multi-agent for complete workflows
        agentType = 'multi';
        break;
      
      default:
        // For unknown intents, use multi-agent to figure it out
        agentType = 'multi';
    }

    console.log(`Routing to ${agentType} agent`);

    // Invoke Strands Agent with timeout handling
    const agentResponse = await invokeStrandsAgent(agentType, agentQuery, parameters);

    console.log('Agent response received:', JSON.stringify(agentResponse, null, 2));

    // Format response for frontend
    return {
      success: true,
      message: agentResponse.response,
      artifacts: agentResponse.artifacts || [],
      thoughtSteps: [],
      metadata: {
        executionTime: 0,
        toolsUsed: [`strands_${agentResponse.agent}_agent`],
        requestId: chatSessionId
      }
    };

  } catch (error: any) {
    console.error('Error in Strands Agent handler:', error);
    
    // Check if this is a timeout or throttling error that should trigger fallback
    const errorMessage = error.message || String(error);
    const isTimeoutError = errorMessage.includes('timeout') || 
                          errorMessage.includes('Timeout') ||
                          errorMessage.includes('timed out');
    const isThrottlingError = error.name === 'TooManyRequestsException' ||
                             errorMessage.includes('TooManyRequestsException') ||
                             errorMessage.includes('Rate exceeded');
    
    if (isTimeoutError || isThrottlingError) {
      // Re-throw to trigger fallback in main handler
      throw error;
    }
    
    // For other errors, return error response
    return {
      success: false,
      message: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
      artifacts: [],
      thoughtSteps: [],
      metadata: {
        executionTime: 0,
        toolsUsed: [],
        requestId: chatSessionId
      }
    };
  }
}

/**
 * Check if Strands Agents are available
 * 
 * TEMPORARILY DISABLED - Strands agents are timing out
 * TODO: Fix cold start and timeout issues before re-enabling
 */
export function isStrandsAgentAvailable(): boolean {
  // Temporarily disabled due to timeout issues
  return false;
  // return !!STRANDS_AGENT_FUNCTION_NAME;
}
