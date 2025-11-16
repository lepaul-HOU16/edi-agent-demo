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
 * Invoke the Strands Agent system asynchronously
 * 
 * Uses Event invocation type to avoid timeout issues.
 * The agent will write progress to DynamoDB which can be polled.
 */
async function invokeStrandsAgentAsync(
  agentType: 'multi' | 'terrain' | 'layout' | 'simulation' | 'report',
  query: string,
  parameters: Record<string, any>,
  requestId: string
): Promise<void> {
  
  if (!STRANDS_AGENT_FUNCTION_NAME) {
    throw new Error('RENEWABLE_AGENTS_FUNCTION_NAME environment variable not set');
  }

  const payload = {
    agent: agentType,
    query,
    parameters,
    requestId  // Include requestId for progress tracking
  };

  console.log(`🚀 Invoking Strands Agent ASYNC (${agentType})`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   Query: ${query.substring(0, 200)}`);

  const command = new InvokeCommand({
    FunctionName: STRANDS_AGENT_FUNCTION_NAME,
    InvocationType: 'Event',  // ← ASYNC INVOCATION
    Payload: JSON.stringify(payload),
  });

  await lambda.send(command);
  
  console.log(`✅ Async invocation started for request ${requestId}`);
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

    // Generate unique request ID for tracking
    const requestId = chatSessionId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Invoke Strands Agent asynchronously
    await invokeStrandsAgentAsync(agentType, agentQuery, parameters, requestId);

    // Return immediately with polling instructions
    const estimatedTime = getEstimatedTime(agentType);
    
    return {
      success: true,
      message: `🚀 ${getAgentDisplayName(agentType)} analysis started. This may take ${estimatedTime}...`,
      artifacts: [],
      thoughtSteps: [{
        step: 1,
        action: 'Starting analysis',
        reasoning: `Invoking ${getAgentDisplayName(agentType)} with async pattern`,
        status: 'in_progress',
        timestamp: new Date().toISOString(),
        duration: 0
      }],
      metadata: {
        executionTime: 0,
        toolsUsed: [`strands_${agentType}_agent`],
        requestId,
        polling: {
          enabled: true,
          interval: 5000,  // Poll every 5 seconds
          maxAttempts: 36  // 3 minutes max (36 * 5s = 180s)
        }
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
 * Get estimated time for agent execution
 */
function getEstimatedTime(agentType: string): string {
  const estimates: Record<string, string> = {
    terrain: '30-45 seconds',
    layout: '45-60 seconds',
    simulation: '60-90 seconds',
    report: '30-45 seconds',
    multi: '3-4 minutes'
  };
  return estimates[agentType] || '1-2 minutes';
}

/**
 * Get display name for agent type
 */
function getAgentDisplayName(agentType: string): string {
  const names: Record<string, string> = {
    terrain: 'Terrain Analysis',
    layout: 'Layout Optimization',
    simulation: 'Wake Simulation',
    report: 'Report Generation',
    multi: 'Complete Workflow'
  };
  return names[agentType] || 'Analysis';
}

/**
 * Check if Strands Agents are available
 * 
 * Checks for RENEWABLE_AGENTS_FUNCTION_NAME environment variable.
 * Agents will use async invocation pattern to handle long execution times.
 */
export function isStrandsAgentAvailable(): boolean {
  const isAvailable = !!STRANDS_AGENT_FUNCTION_NAME;
  
  if (isAvailable) {
    console.log('✅ Strands Agents ENABLED - Function:', STRANDS_AGENT_FUNCTION_NAME);
  } else {
    console.log('⚠️  Strands Agents DISABLED - RENEWABLE_AGENTS_FUNCTION_NAME not set');
  }
  
  return isAvailable;
}
