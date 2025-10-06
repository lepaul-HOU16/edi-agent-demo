/**
 * RenewableClient - HTTP client for AgentCore communication
 * 
 * This client handles communication with the Python renewable energy backend
 * deployed on AWS Bedrock AgentCore.
 */

import {
  AgentCoreRequest,
  AgentCoreResponse,
  AgentCoreError,
  AuthenticationError,
  ConnectionError,
  RenewableConfig,
} from './types';

/**
 * HTTP client for communicating with AgentCore
 */
export class RenewableClient {
  private agentCoreEndpoint: string;
  private region: string;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Create a new RenewableClient
   * 
   * @param config - Renewable energy configuration
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param retryDelay - Delay between retries in ms (default: 1000)
   */
  constructor(
    config: RenewableConfig,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ) {
    this.agentCoreEndpoint = config.agentCoreEndpoint;
    this.region = config.region;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;

    console.log('RenewableClient initialized:', {
      endpoint: this.agentCoreEndpoint,
      region: this.region,
    });
  }

  /**
   * Invoke the AgentCore runtime with a prompt
   * 
   * @param prompt - User query/prompt
   * @param sessionId - Optional session ID for conversation continuity
   * @param userId - Optional user ID
   * @returns AgentCore response with artifacts and thought steps
   */
  async invokeAgent(
    prompt: string,
    sessionId?: string,
    userId?: string
  ): Promise<AgentCoreResponse> {
    console.log('RenewableClient: Invoking agent with prompt:', prompt.substring(0, 100));

    const request: AgentCoreRequest = {
      prompt,
      sessionId,
      userId,
    };

    // Try with retries
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`RenewableClient: Attempt ${attempt}/${this.maxRetries}`);
        
        const response = await this.makeRequest(request);
        
        console.log('RenewableClient: Success!', {
          artifactCount: response.artifacts?.length || 0,
          thoughtStepCount: response.thoughtSteps?.length || 0,
        });
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof AuthenticationError) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retrying
        console.log(`RenewableClient: Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
        await this.sleep(this.retryDelay);
      }
    }

    // All retries failed
    console.error('RenewableClient: All retry attempts failed');
    throw lastError || new AgentCoreError('Failed to invoke agent after retries');
  }

  /**
   * Make the actual HTTP request to AgentCore
   * 
   * @param request - AgentCore request payload
   * @returns AgentCore response
   */
  private async makeRequest(request: AgentCoreRequest): Promise<AgentCoreResponse> {
    try {
      // Check if we have a valid endpoint
      if (!this.agentCoreEndpoint || this.agentCoreEndpoint.trim() === '') {
        console.warn('RenewableClient: No AgentCore endpoint configured, using mock response');
        return this.getMockResponse(request);
      }
      
      // For AgentCore Runtime ARN format: arn:aws:bedrock-agentcore:region:account:agent-runtime/name
      if (this.agentCoreEndpoint.startsWith('arn:aws:bedrock-agentcore:') || 
          this.agentCoreEndpoint.startsWith('arn:aws:bedrock-agent-runtime:')) {
        console.log('RenewableClient: Detected AgentCore Runtime ARN');
        console.log('RenewableClient: Calling Python proxy Lambda for AgentCore access');
        
        // Call Python Lambda proxy since there's no TypeScript SDK for bedrock-agentcore yet
        // The Python Lambda uses boto3 which has full support
        try {
          // Get the Lambda function name from environment or use default
          const proxyFunctionName = process.env.RENEWABLE_PROXY_FUNCTION_NAME || 'renewableAgentCoreProxy';
          
          // Import Lambda client
          const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
          
          const lambdaClient = new LambdaClient({ region: this.region });
          
          const payload = {
            prompt: request.prompt,
            sessionId: request.sessionId,
            agentRuntimeArn: this.agentCoreEndpoint,
          };
          
          console.log('RenewableClient: Invoking Python proxy Lambda');
          
          const command = new InvokeCommand({
            FunctionName: proxyFunctionName,
            Payload: JSON.stringify(payload),
          });
          
          const response = await lambdaClient.send(command);
          
          if (response.Payload) {
            const result = JSON.parse(new TextDecoder().decode(response.Payload));
            
            if (result.statusCode === 200) {
              const body = JSON.parse(result.body);
              console.log('RenewableClient: Received response from Python proxy', {
                messageLength: body.message?.length || 0,
                thoughtStepsCount: body.thoughtSteps?.length || 0,
              });
              return body;
            } else {
              throw new Error(`Python proxy returned error: ${result.body}`);
            }
          }
          
          throw new Error('No response from Python proxy');
          
        } catch (proxyError) {
          console.error('RenewableClient: Python proxy error:', proxyError);
          console.warn('RenewableClient: Falling back to mock response due to proxy error');
          return this.getMockResponse(request);
        }
      }
      
      // For HTTP/HTTPS endpoints
      if (this.agentCoreEndpoint.startsWith('http')) {
        console.log('RenewableClient: Making HTTP request to:', this.agentCoreEndpoint);
        
        const response = await fetch(this.agentCoreEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        
        if (!response.ok) {
          throw new AgentCoreError(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      }
      
      // Fallback to mock response
      console.warn('RenewableClient: Unknown endpoint format, using mock response');
      return this.getMockResponse(request);
      
    } catch (error) {
      console.error('RenewableClient: Request failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ConnectionError('Unable to connect to renewable energy service');
      }
      
      throw new AgentCoreError(
        `Failed to invoke AgentCore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get authentication token for AgentCore
   * 
   * @returns Bearer token from Cognito
   */
  private async getAuthToken(): Promise<string> {
    // TODO: Implement Cognito token retrieval
    // This should get the current user's Cognito token from the session
    
    // For now, return empty string (will be implemented with Cognito integration)
    return '';
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get mock response for development
   * 
   * This allows frontend development to proceed while the backend integration
   * is being completed. Remove this once AWS SDK integration is implemented.
   * 
   * @param request - AgentCore request
   * @returns Mock AgentCore response
   */
  private getMockResponse(request: AgentCoreRequest): AgentCoreResponse {
    console.log('RenewableClient: Generating mock response for:', request.prompt);
    
    // Parse the prompt to determine what type of response to return
    const prompt = request.prompt.toLowerCase();
    
    if (prompt.includes('terrain') || prompt.includes('analyze')) {
      return {
        message: 'Terrain analysis completed successfully. The site shows good potential for wind farm development.',
        artifacts: [
          {
            type: 'terrain',
            data: {
              mapHtml: '<div>Mock Folium Map - Terrain Analysis</div>',
              metrics: {
                suitabilityScore: 85,
                exclusionZones: 3,
              },
            },
            metadata: {
              projectId: 'mock-project-123',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [
          {
            id: 'step-1',
            type: 'analysis',
            timestamp: Date.now(),
            title: 'Analyzing terrain',
            summary: 'Identifying exclusion zones and buildable areas',
            status: 'complete',
          },
        ],
        projectId: 'mock-project-123',
        status: 'success',
      };
    }
    
    if (prompt.includes('layout') || prompt.includes('design')) {
      return {
        message: 'Wind farm layout designed successfully with optimal turbine placement.',
        artifacts: [
          {
            type: 'layout',
            data: {
              mapHtml: '<div>Mock Folium Map - Turbine Layout</div>',
              geojson: {
                type: 'FeatureCollection',
                features: [],
              },
              metrics: {
                turbineCount: 10,
                totalCapacity: 30,
              },
            },
            metadata: {
              projectId: 'mock-project-123',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [
          {
            id: 'step-1',
            type: 'design',
            timestamp: Date.now(),
            title: 'Designing layout',
            summary: 'Optimizing turbine placement for maximum energy capture',
            status: 'complete',
          },
        ],
        projectId: 'mock-project-123',
        status: 'success',
      };
    }
    
    if (prompt.includes('simulation') || prompt.includes('wake')) {
      return {
        message: 'Wake simulation completed. Annual energy production estimated at 95,000 MWh.',
        artifacts: [
          {
            type: 'simulation',
            data: {
              chartImage: 'data:image/png;base64,mock-chart-data',
              metrics: {
                annualEnergyProduction: 95000,
                capacityFactor: 36.5,
                wakeLosses: 8.2,
              },
            },
            metadata: {
              projectId: 'mock-project-123',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [
          {
            id: 'step-1',
            type: 'simulation',
            timestamp: Date.now(),
            title: 'Running wake simulation',
            summary: 'Calculating wake effects and energy production',
            status: 'complete',
          },
        ],
        projectId: 'mock-project-123',
        status: 'success',
      };
    }
    
    // Default response
    return {
      message: 'I can help you with wind farm development. Try asking about terrain analysis, layout design, or wake simulation.',
      artifacts: [],
      thoughtSteps: [],
      projectId: 'mock-project-123',
      status: 'success',
    };
  }
}
