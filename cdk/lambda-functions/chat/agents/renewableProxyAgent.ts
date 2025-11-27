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

import { BaseEnhancedAgent } from './BaseEnhancedAgent';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getRenewableConfig } from '../shared/renewableConfig';
import { 
  ThoughtStep, 
  createThoughtStep, 
  completeThoughtStep 
} from '../utils/thoughtTypes';

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
export class RenewableProxyAgent extends BaseEnhancedAgent {
  private lambdaClient: LambdaClient;
  private orchestratorFunctionName: string;
  private sessionId?: string;

  constructor() {
    super(); // Initialize BaseEnhancedAgent
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
   * @param sessionContext - Session and user IDs for async result storage
   * @returns RouterResponse with artifacts and thought steps
   */
  async processQuery(
    message: string, 
    conversationHistory?: any[],
    sessionContext?: { chatSessionId?: string; userId?: string }
  ): Promise<RouterResponse> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🟠 BACKEND (Renewable Proxy Agent): Processing query');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 Message:', message);
    console.log('🆔 Session ID:', sessionContext?.chatSessionId);
    console.log('👤 User ID:', sessionContext?.userId);
    console.log('🎯 Orchestrator Function:', this.orchestratorFunctionName);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');

    // Create initial thought step
    const routingStep = createThoughtStep(
      'execution',
      'Routing to Renewable Energy Backend',
      'Connecting to Python renewable energy analysis service'
    );

    try {
      // CRITICAL FIX: Orchestrator expects API Gateway event format
      // Create a minimal API Gateway event structure
      const apiGatewayEvent = {
        body: JSON.stringify({
          query: message,
          context: {},
          sessionId: sessionContext?.chatSessionId,
          userId: sessionContext?.userId
        }),
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: sessionContext?.userId || 'unknown-user',
                email: 'user@example.com'
              }
            }
          }
        }
      };
      
      console.log('🟠 BACKEND (Proxy Agent): Preparing Lambda invocation');
      console.log('📦 API Gateway Event:', JSON.stringify(apiGatewayEvent, null, 2));
      
      // CRITICAL FIX: Use SYNCHRONOUS invocation like pre-migration version
      // Async invocation with polling was causing issues - results never appeared
      // Synchronous invocation waits for actual results and returns them immediately
      const command = new InvokeCommand({
        FunctionName: this.orchestratorFunctionName,
        InvocationType: 'RequestResponse', // Synchronous invocation - wait for results
        Payload: JSON.stringify(apiGatewayEvent)
      });
      
      console.log('🟠 BACKEND (Proxy Agent): Invoking orchestrator Lambda SYNCHRONOUSLY...');
      console.log('   Function:', this.orchestratorFunctionName);
      console.log('   Type: RequestResponse (synchronous - wait for results)');
      console.log('   Session ID:', sessionContext?.chatSessionId);
      
      const invokeResponse = await this.lambdaClient.send(command);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🟠 BACKEND (Proxy Agent): Orchestrator completed');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📊 Status Code:', invokeResponse.StatusCode);
      
      // Parse the response - orchestrator returns API Gateway format with body
      const payloadText = new TextDecoder().decode(invokeResponse.Payload);
      console.log('🔍 BACKEND (Proxy Agent): Raw payload:', payloadText.substring(0, 500));
      
      const apiGatewayResponse = JSON.parse(payloadText);
      console.log('🔍 BACKEND (Proxy Agent): API Gateway response keys:', Object.keys(apiGatewayResponse));
      console.log('🔍 BACKEND (Proxy Agent): Body type:', typeof apiGatewayResponse.body);
      console.log('🔍 BACKEND (Proxy Agent): Body preview:', apiGatewayResponse.body?.substring(0, 300));
      
      const responsePayload = JSON.parse(apiGatewayResponse.body);
      console.log('🟠 BACKEND (Proxy Agent): Orchestrator response:', {
        success: responsePayload.success,
        artifactCount: responsePayload.artifacts?.length || 0,
        thoughtStepCount: responsePayload.thoughtSteps?.length || 0
      });

      // Complete routing step
      completeThoughtStep(routingStep, 'Analysis complete');

      // Return the actual results
      const response: RouterResponse = {
        success: responsePayload.success,
        message: responsePayload.message,
        artifacts: this.transformArtifacts(responsePayload.artifacts || []),
        thoughtSteps: [routingStep, ...this.transformThoughtSteps(responsePayload.thoughtSteps || [], routingStep)],
        agentUsed: 'renewable_energy',
      };

      console.log('═══════════════════════════════════════════════════════════');
      console.log('🟠 BACKEND (Proxy Agent): Returning final response');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Success:', response.success);
      console.log('📊 Artifacts:', response.artifacts?.length || 0);
      console.log('🧠 Thought Steps:', response.thoughtSteps?.length || 0);
      console.log('💬 Message Length:', response.message?.length || 0);
      console.log('═══════════════════════════════════════════════════════════');

      return response;

    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ BACKEND (Proxy Agent): CRITICAL ERROR');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('Error:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('═══════════════════════════════════════════════════════════');
      return this.handleError(error, routingStep);
    }
  }

  /**
   * Transform orchestrator artifacts to EDI format
   */
  private transformArtifacts(artifacts: any[]): any[] {
    // CRITICAL FIX: Handle undefined/null artifacts
    if (!artifacts || !Array.isArray(artifacts)) {
      console.warn('⚠️ PROXY: Artifacts is not an array:', artifacts);
      return [];
    }
    
    console.log('🔄 PROXY: Transforming artifacts, count:', artifacts.length);
    return artifacts.map((artifact, index) => {
      console.log(`🔍 PROXY: Artifact ${index + 1} type:`, artifact.type);
      console.log(`🔍 PROXY: Artifact ${index + 1} data keys:`, Object.keys(artifact.data || {}));
      
      // CRITICAL FIX: Keep the nested structure that frontend expects
      // Frontend looks for artifact.data.messageContentType, not artifact.messageContentType
      const transformed = {
        type: artifact.type,
        messageContentType: artifact.type, // For backward compatibility
        data: {
          messageContentType: artifact.type,
          ...artifact.data
        },
        metadata: artifact.metadata
      };
      
      console.log(`✅ PROXY: Transformed artifact ${index + 1}:`, {
        type: transformed.type,
        hasData: !!transformed.data,
        dataKeys: Object.keys(transformed.data || {}).slice(0, 5)
      });
      
      return transformed;
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
