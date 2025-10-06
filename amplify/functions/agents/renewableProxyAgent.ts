/**
 * Renewable Proxy Agent
 * 
 * This agent acts as a proxy between the EDI Platform frontend and the Python
 * renewable energy backend. It handles:
 * - Direct invocation of renewableOrchestrator Lambda
 * - Response transformation to EDI artifacts
 * - Thought step mapping
 * - Error handling and user-friendly messages
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getRenewableConfig } from '../shared/renewableConfig';
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
  private lambdaClient: LambdaClient;
  private orchestratorFunctionName: string;
  private sessionId?: string;

  constructor() {
    console.log('🌱 RenewableProxyAgent: Initializing');
    
    try {
      const config = getRenewableConfig();
      this.lambdaClient = new LambdaClient({ region: config.region });
      this.orchestratorFunctionName = config.agentCoreEndpoint; // This is the orchestrator function name
      console.log('✅ RenewableProxyAgent: Initialized with orchestrator:', this.orchestratorFunctionName);
    } catch (error) {
      console.error('❌ RenewableProxyAgent: Failed to initialize', error);
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
      // Invoke Lambda orchestrator directly
      console.log('🌱 RenewableProxyAgent: Invoking Lambda orchestrator:', this.orchestratorFunctionName);
      
      const payload = {
        query: message,
        userId: 'user',
        sessionId: this.sessionId || `session-${Date.now()}`,
        context: {}
      };
      
      const command = new InvokeCommand({
        FunctionName: this.orchestratorFunctionName,
        Payload: JSON.stringify(payload)
      });
      
      const lambdaResponse = await this.lambdaClient.send(command);
      
      if (!lambdaResponse.Payload) {
        throw new Error('No payload in Lambda response');
      }
      
      const orchestratorResponse = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
      
      console.log('🌱 RenewableProxyAgent: Orchestrator response:', {
        success: orchestratorResponse.success,
        artifactCount: orchestratorResponse.artifacts?.length || 0
      });

      // Complete routing step
      completeThoughtStep(routingStep, 'Connected to renewable energy service');

      // Transform orchestrator response to EDI format
      const artifacts = this.transformArtifacts(orchestratorResponse.artifacts || []);
      const thoughtSteps = this.transformThoughtSteps(orchestratorResponse.thoughtSteps || [], routingStep);

      // Build successful response
      const response: RouterResponse = {
        success: orchestratorResponse.success,
        message: orchestratorResponse.message,
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
   * Transform orchestrator artifacts to EDI format
   */
  private transformArtifacts(artifacts: any[]): any[] {
    return artifacts.map(artifact => {
      // Orchestrator already returns artifacts in EDI format
      // Just ensure they have the correct structure
      return {
        messageContentType: artifact.type,
        ...artifact.data,
        metadata: artifact.metadata
      };
    });
  }

  /**
   * Transform orchestrator thought steps to EDI Platform format
   * 
   * @param steps - Orchestrator thought steps
   * @param routingStep - Initial routing thought step
   * @returns Array of EDI Platform thought steps
   */
  private transformThoughtSteps(
    steps: any[],
    routingStep: ThoughtStep
  ): ThoughtStep[] {
    const thoughtSteps: ThoughtStep[] = [routingStep];

    if (!steps || steps.length === 0) {
      return thoughtSteps;
    }

    // Transform orchestrator thought steps to EDI format
    for (const step of steps) {
      const ediStep: ThoughtStep = {
        id: `step_${Date.now()}_${Math.random()}`,
        type: 'execution',
        timestamp: Date.now(),
        title: step.action || 'Processing',
        summary: step.reasoning || step.result || '',
        status: 'complete',
      };

      thoughtSteps.push(ediStep);
    }

    return thoughtSteps;
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
    let errorDetails = error.message || 'An unknown error occurred.';

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
      errorType: error.constructor?.name || 'Unknown',
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
      await this.processQuery('Test connection');
      return true;
    } catch (error) {
      console.error('🌱 RenewableProxyAgent: Connection test failed', error);
      return false;
    }
  }
}
