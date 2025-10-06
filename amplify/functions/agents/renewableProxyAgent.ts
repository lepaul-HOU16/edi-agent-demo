/**
 * Renewable Proxy Agent
 * 
 * This agent acts as a proxy between the EDI Platform frontend and the Python
 * renewable energy backend deployed on AWS Bedrock AgentCore. It handles:
 * - Communication with AgentCore via RenewableClient
 * - Response transformation via ResponseTransformer
 * - Thought step mapping
 * - Error handling and user-friendly messages
 */

import { RenewableClient } from '../../../src/services/renewable-integration/renewableClient';
import { ResponseTransformer } from '../../../src/services/renewable-integration/responseTransformer';
import { getRenewableConfig } from '../../../src/services/renewable-integration/config';
import { 
  AgentCoreResponse,
  AgentCoreError,
  AuthenticationError,
  ConnectionError,
} from '../../../src/services/renewable-integration/types';
import { 
  ThoughtStep, 
  createThoughtStep, 
  completeThoughtStep 
} from '../../../utils/thoughtTypes';

interface RouterResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
}

/**
 * Renewable Proxy Agent
 * Bridges EDI Platform with Python renewable energy backend
 */
export class RenewableProxyAgent {
  private client: RenewableClient;
  private sessionId?: string;

  constructor() {
    console.log('🌱 RenewableProxyAgent: Initializing');
    
    try {
      const config = getRenewableConfig();
      this.client = new RenewableClient(config);
      console.log('✅ RenewableProxyAgent: Client initialized successfully');
    } catch (error) {
      console.error('❌ RenewableProxyAgent: Failed to initialize client', error);
      throw error;
    }
  }

  /**
   * Set session ID for conversation continuity
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Process a renewable energy query
   * 
   * @param message - User query
   * @param conversationHistory - Optional conversation history
   * @returns RouterResponse with artifacts and thought steps
   */
  async processQuery(
    message: string, 
    conversationHistory?: any[]
  ): Promise<RouterResponse> {
    console.log('🌱 RenewableProxyAgent: Processing query:', message.substring(0, 100) + '...');

    // Create initial thought step
    const routingStep = createThoughtStep(
      'execution',
      'Routing to Renewable Energy Backend',
      'Connecting to Python renewable energy analysis service'
    );

    try {
      // Invoke AgentCore
      console.log('🌱 RenewableProxyAgent: Invoking AgentCore');
      const agentCoreResponse = await this.client.invokeAgent(message, this.sessionId);

      // Complete routing step
      completeThoughtStep(routingStep, 'Connected to renewable energy service');

      // Transform response
      console.log('🌱 RenewableProxyAgent: Transforming response');
      const artifacts = ResponseTransformer.transformToEDIArtifacts(agentCoreResponse);

      // Map thought steps
      const thoughtSteps = this.mapThoughtSteps(agentCoreResponse, routingStep);

      // Build successful response
      const response: RouterResponse = {
        success: true,
        message: agentCoreResponse.message,
        artifacts: artifacts,
        thoughtSteps: thoughtSteps,
        agentUsed: 'renewable_energy',
      };

      console.log('✅ RenewableProxyAgent: Query processed successfully', {
        artifactCount: artifacts.length,
        thoughtStepCount: thoughtSteps.length,
      });

      return response;

    } catch (error) {
      console.error('❌ RenewableProxyAgent: Error processing query', error);
      return this.handleError(error, routingStep);
    }
  }

  /**
   * Map AgentCore thought steps to EDI Platform format
   * 
   * @param response - AgentCore response
   * @param routingStep - Initial routing thought step
   * @returns Array of EDI Platform thought steps
   */
  private mapThoughtSteps(
    response: AgentCoreResponse,
    routingStep: ThoughtStep
  ): ThoughtStep[] {
    const thoughtSteps: ThoughtStep[] = [routingStep];

    if (!response.thoughtSteps || response.thoughtSteps.length === 0) {
      return thoughtSteps;
    }

    // Map AgentCore thought steps to EDI Platform format
    for (const agentCoreStep of response.thoughtSteps) {
      const ediStep: ThoughtStep = {
        id: agentCoreStep.id || `step_${Date.now()}_${Math.random()}`,
        type: this.mapStepType(agentCoreStep.type),
        timestamp: agentCoreStep.timestamp || Date.now(),
        title: agentCoreStep.title || 'Processing',
        summary: agentCoreStep.summary || '',
        status: this.mapStepStatus(agentCoreStep.status),
      };

      thoughtSteps.push(ediStep);
    }

    return thoughtSteps;
  }

  /**
   * Map AgentCore step type to EDI Platform type
   */
  private mapStepType(type: string): ThoughtStep['type'] {
    switch (type) {
      case 'intent':
      case 'intent_detection':
        return 'intent_detection';
      case 'parameter':
      case 'parameter_extraction':
        return 'parameter_extraction';
      case 'tool':
      case 'tool_selection':
        return 'tool_selection';
      case 'execution':
      case 'running':
        return 'execution';
      case 'validation':
      case 'verify':
        return 'validation';
      case 'completion':
      case 'complete':
        return 'completion';
      default:
        return 'execution';
    }
  }

  /**
   * Map AgentCore step status to EDI Platform status
   */
  private mapStepStatus(status: string): ThoughtStep['status'] {
    switch (status) {
      case 'in_progress':
      case 'running':
      case 'pending':
        return 'thinking';
      case 'complete':
      case 'completed':
      case 'success':
        return 'complete';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'complete';
    }
  }

  /**
   * Handle errors and return user-friendly error response
   * 
   * @param error - Error object
   * @param routingStep - Initial routing thought step
   * @returns Error RouterResponse
   */
  private handleError(error: any, routingStep: ThoughtStep): RouterResponse {
    let errorMessage = 'An unexpected error occurred while processing your renewable energy query.';
    let errorDetails = '';

    if (error instanceof AuthenticationError) {
      errorMessage = 'Authentication failed. Please sign in again to access renewable energy features.';
      errorDetails = 'Your session may have expired or you may not have permission to access this service.';
    } else if (error instanceof ConnectionError) {
      errorMessage = 'Unable to connect to the renewable energy service.';
      errorDetails = 'Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
    } else if (error instanceof AgentCoreError) {
      errorMessage = 'The renewable energy service encountered an error.';
      errorDetails = error.message || 'Please try again in a few moments.';
    } else {
      errorDetails = error.message || 'An unknown error occurred.';
    }

    // Mark routing step as error
    routingStep.status = 'error';
    routingStep.summary = errorMessage;

    // Create error thought step
    const errorStep = createThoughtStep(
      'completion',
      'Error Processing Query',
      errorDetails
    );
    errorStep.status = 'error';

    console.error('🌱 RenewableProxyAgent: Returning error response', {
      errorType: error.constructor.name,
      errorMessage,
      errorDetails,
    });

    return {
      success: false,
      message: `${errorMessage}\n\n${errorDetails}`,
      artifacts: [],
      thoughtSteps: [routingStep, errorStep],
      agentUsed: 'renewable_energy',
    };
  }

  /**
   * Test connection to renewable energy service
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.invokeAgent('Test connection', 'test-session');
      return true;
    } catch (error) {
      console.error('🌱 RenewableProxyAgent: Connection test failed', error);
      return false;
    }
  }
}
