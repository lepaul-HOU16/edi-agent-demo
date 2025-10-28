/**
 * EDIcraft MCP Client
 * Client for communicating with the EDIcraft MCP server (Bedrock AgentCore)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

export interface EDIcraftConfig {
  minecraftHost: string;
  minecraftPort: number;
  rconPassword: string;
  ediUsername: string;
  ediPassword: string;
  ediClientId: string;
  ediClientSecret: string;
  ediPartition: string;
  ediPlatformUrl: string;
  bedrockAgentId: string;
  bedrockAgentAliasId: string;
  region: string;
}

export interface EDIcraftResponse {
  success: boolean;
  message: string;
  thoughtSteps?: ThoughtStep[];
  connectionStatus?: string;
}

export interface ThoughtStep {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
  details?: string;
}

export class EDIcraftMCPClient {
  private config: EDIcraftConfig;
  private bedrockClient: BedrockAgentRuntimeClient;
  private sessionId: string;

  constructor(config: EDIcraftConfig) {
    this.config = config;
    this.bedrockClient = new BedrockAgentRuntimeClient({ region: config.region });
    // Create unique session ID for this conversation
    // Requirement 3.3: Create a unique session ID for each conversation
    this.sessionId = `edicraft-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Process a message through the EDIcraft Bedrock AgentCore
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async processMessage(message: string): Promise<EDIcraftResponse> {
    try {
      console.log('[EDIcraft MCP Client] Processing message:', message);
      console.log('[EDIcraft MCP Client] Session ID:', this.sessionId);
      console.log('[EDIcraft MCP Client] Agent ID:', this.config.bedrockAgentId);
      console.log('[EDIcraft MCP Client] Agent Alias ID:', this.config.bedrockAgentAliasId);

      // Invoke Bedrock AgentCore with retry logic
      const response = await this.invokeAgentWithRetry(message);

      return {
        success: true,
        message: response.message,
        thoughtSteps: response.thoughtSteps || [],
        connectionStatus: 'connected'
      };

    } catch (error) {
      console.error('[EDIcraft MCP Client] Error processing message:', error);
      throw error;
    }
  }

  /**
   * Invoke Bedrock AgentCore with retry logic
   * Requirements: 3.5 - Retry logic with exponential backoff
   */
  private async invokeAgentWithRetry(message: string, maxRetries: number = 3): Promise<{ message: string; thoughtSteps: ThoughtStep[] }> {
    let lastError: Error | null = null;
    const delays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[EDIcraft MCP Client] Attempt ${attempt + 1}/${maxRetries}`);
        return await this.invokeBedrockAgent(message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const errorMessage = lastError.message.toLowerCase();
        
        // Only retry on transient failures
        const isRetryable = errorMessage.includes('timeout') || 
                           errorMessage.includes('connection refused') ||
                           errorMessage.includes('econnrefused') ||
                           errorMessage.includes('etimedout');
        
        if (!isRetryable || attempt === maxRetries - 1) {
          throw lastError;
        }

        const delay = delays[attempt];
        console.log(`[EDIcraft MCP Client] Retrying after ${delay}ms due to: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Failed to invoke agent after retries');
  }

  /**
   * Invoke the Bedrock AgentCore agent
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  private async invokeBedrockAgent(message: string): Promise<{ message: string; thoughtSteps: ThoughtStep[] }> {
    console.log('[EDIcraft MCP Client] Invoking Bedrock AgentCore');
    console.log('[EDIcraft MCP Client] Configuration:', {
      agentId: this.config.bedrockAgentId,
      aliasId: this.config.bedrockAgentAliasId,
      sessionId: this.sessionId,
      minecraftHost: this.config.minecraftHost,
      minecraftPort: this.config.minecraftPort,
      osduPlatform: this.config.ediPlatformUrl,
      partition: this.config.ediPartition
    });

    try {
      // Requirement 3.1: Use BedrockAgentRuntimeClient to invoke the agent
      // Requirement 3.2: Pass agent ID from environment variables
      // Requirement 3.3: Create unique session ID for each conversation
      const command = new InvokeAgentCommand({
        agentId: this.config.bedrockAgentId,
        agentAliasId: this.config.bedrockAgentAliasId,
        sessionId: this.sessionId,
        inputText: message,
        enableTrace: true, // Enable trace to extract thought steps
      });

      console.log('[EDIcraft MCP Client] Sending InvokeAgentCommand');
      const response = await this.bedrockClient.send(command);

      // Requirement 3.4: Parse response stream and extract message content
      const { completion, thoughtSteps } = await this.processAgentResponse(response);

      console.log('[EDIcraft MCP Client] Agent invocation successful');
      console.log('[EDIcraft MCP Client] Completion length:', completion.length);
      console.log('[EDIcraft MCP Client] Thought steps:', thoughtSteps.length);

      return {
        message: completion || 'Agent processed the request successfully.',
        thoughtSteps
      };

    } catch (error) {
      // Requirement 3.5: Capture error details and return in structured format
      console.error('[EDIcraft MCP Client] Error invoking Bedrock AgentCore:', error);
      
      if (error instanceof Error) {
        // Check for specific error types
        if (error.name === 'ResourceNotFoundException') {
          throw new Error(`Bedrock AgentCore agent not found. Please verify BEDROCK_AGENT_ID (${this.config.bedrockAgentId}) and BEDROCK_AGENT_ALIAS_ID (${this.config.bedrockAgentAliasId}) are correct and the agent is deployed.`);
        }
        if (error.name === 'AccessDeniedException') {
          throw new Error('Access denied to Bedrock AgentCore. Please verify IAM permissions for bedrock-agent:InvokeAgent.');
        }
        if (error.name === 'ThrottlingException') {
          throw new Error('Bedrock AgentCore request throttled. Please retry after a short delay.');
        }
      }
      
      throw new Error(`Failed to invoke EDIcraft agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process streaming response from Bedrock AgentCore
   * Requirements: 3.4 - Parse response stream and extract completion text
   * Requirements: 2.3, 5.3 - Extract thought steps from trace events
   */
  private async processAgentResponse(response: any): Promise<{ completion: string; thoughtSteps: ThoughtStep[] }> {
    let completion = '';
    const thoughtSteps: ThoughtStep[] = [];
    let stepCounter = 0;
    const seenStepTypes = new Set<string>(); // Track unique step types to avoid duplicates

    try {
      // The response contains a completion stream
      if (response.completion) {
        console.log('[EDIcraft MCP Client] Processing response stream');
        
        // Process each chunk in the stream
        for await (const chunk of response.completion) {
          // Extract completion text from chunk
          if (chunk.chunk && chunk.chunk.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            completion += chunkText;
            console.log('[EDIcraft MCP Client] Received chunk:', chunkText.substring(0, 100));
          }

          // Extract trace information for thought steps
          if (chunk.trace) {
            console.log('[EDIcraft MCP Client] Processing trace event:', JSON.stringify(chunk.trace, null, 2).substring(0, 300));
            
            const traceStep = this.extractThoughtStepFromTrace(chunk.trace, stepCounter);
            if (traceStep) {
              // Create a unique key for this step to avoid duplicates
              const stepKey = `${traceStep.type}-${traceStep.title}`;
              
              // Only add if we haven't seen this exact step type/title combination
              if (!seenStepTypes.has(stepKey)) {
                thoughtSteps.push(traceStep);
                seenStepTypes.add(stepKey);
                stepCounter++;
                console.log('[EDIcraft MCP Client] Extracted thought step:', {
                  id: traceStep.id,
                  type: traceStep.type,
                  title: traceStep.title,
                  summary: traceStep.summary.substring(0, 100)
                });
              }
            }
          }

          // Handle return control events (agent requesting user input)
          if (chunk.returnControl) {
            const returnControl = chunk.returnControl;
            thoughtSteps.push({
              id: `step-${stepCounter++}`,
              type: 'processing',
              timestamp: Date.now(),
              title: 'Requesting User Input',
              summary: 'Agent needs additional information to proceed',
              status: 'pending',
              details: JSON.stringify(returnControl.invocationInputs, null, 2)
            });
          }
        }
      }

      // If no completion text was extracted, check for alternative response formats
      if (!completion && response.output) {
        completion = response.output;
      }

      // Add a final completion step if we have thought steps but no explicit completion step
      if (thoughtSteps.length > 0 && !thoughtSteps.some(step => step.type === 'completion')) {
        thoughtSteps.push({
          id: `step-${stepCounter}`,
          type: 'completion',
          timestamp: Date.now(),
          title: 'Request Complete',
          summary: 'Agent has finished processing the request',
          status: 'complete'
        });
      }

      console.log('[EDIcraft MCP Client] Final completion length:', completion.length);
      console.log('[EDIcraft MCP Client] Total thought steps:', thoughtSteps.length);
      console.log('[EDIcraft MCP Client] Thought step types:', thoughtSteps.map(s => `${s.type}:${s.title}`).join(', '));

      return { completion, thoughtSteps };

    } catch (error) {
      console.error('[EDIcraft MCP Client] Error processing response stream:', error);
      
      // Add error thought step
      thoughtSteps.push({
        id: `step-error`,
        type: 'processing',
        timestamp: Date.now(),
        title: 'Error Processing Response',
        summary: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        details: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(`Failed to process agent response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract thought step from trace information
   * Parse trace events to create structured thought steps
   * Requirements: 2.3, 5.3 - Extract execution steps from Bedrock AgentCore trace
   */
  private extractThoughtStepFromTrace(trace: any, stepId: number): ThoughtStep | null {
    try {
      // Handle orchestration trace
      if (trace.orchestrationTrace) {
        const orchTrace = trace.orchestrationTrace;
        
        // Rationale - Agent's reasoning about what to do
        if (orchTrace.rationale) {
          return {
            id: `step-${stepId}`,
            type: 'analysis',
            timestamp: Date.now(),
            title: 'Agent Reasoning',
            summary: orchTrace.rationale.text || 'Analyzing request and planning actions',
            status: 'complete',
            details: orchTrace.rationale.text
          };
        }

        // Model invocation input - Agent is thinking
        if (orchTrace.modelInvocationInput) {
          const input = orchTrace.modelInvocationInput;
          return {
            id: `step-${stepId}`,
            type: 'analysis',
            timestamp: Date.now(),
            title: 'Analyzing Request',
            summary: 'Processing user query and determining required actions',
            status: 'complete',
            details: input.text?.substring(0, 200) || input.inferenceConfiguration ? 'Configuring model parameters' : undefined
          };
        }

        // Invocation input - About to execute an action
        if (orchTrace.invocationInput) {
          const invInput = orchTrace.invocationInput;
          
          // Action group invocation
          if (invInput.actionGroupInvocationInput) {
            const actionGroup = invInput.actionGroupInvocationInput;
            const functionName = actionGroup.function || actionGroup.apiPath || 'unknown';
            const actionName = actionGroup.actionGroupName || 'Tool';
            
            // Parse parameters for better summary
            let paramSummary = '';
            if (actionGroup.parameters) {
              const params = actionGroup.parameters;
              if (Array.isArray(params) && params.length > 0) {
                const paramNames = params.map((p: any) => p.name || 'param').join(', ');
                paramSummary = ` with ${paramNames}`;
              }
            }
            
            return {
              id: `step-${stepId}`,
              type: 'processing',
              timestamp: Date.now(),
              title: `Executing: ${actionName}`,
              summary: `Invoking ${functionName}${paramSummary}`,
              status: 'complete',
              details: actionGroup.parameters ? JSON.stringify(actionGroup.parameters, null, 2) : undefined
            };
          }

          // Knowledge base lookup
          if (invInput.knowledgeBaseLookupInput) {
            const kbInput = invInput.knowledgeBaseLookupInput;
            return {
              id: `step-${stepId}`,
              type: 'processing',
              timestamp: Date.now(),
              title: 'Searching Knowledge Base',
              summary: kbInput.text || 'Retrieving relevant information',
              status: 'complete',
              details: kbInput.knowledgeBaseId ? `Knowledge Base: ${kbInput.knowledgeBaseId}` : undefined
            };
          }
        }

        // Observation - Result from an action
        if (orchTrace.observation) {
          const observation = orchTrace.observation;
          
          // Action group invocation output
          if (observation.actionGroupInvocationOutput) {
            const output = observation.actionGroupInvocationOutput;
            const outputText = output.text || '';
            
            // Try to extract meaningful information from the output
            let summary = 'Received response from action execution';
            if (outputText.includes('success')) {
              summary = 'Action completed successfully';
            } else if (outputText.includes('error') || outputText.includes('failed')) {
              summary = 'Action encountered an issue';
            } else if (outputText.length > 0) {
              summary = outputText.substring(0, 100);
            }
            
            return {
              id: `step-${stepId}`,
              type: 'processing',
              timestamp: Date.now(),
              title: 'Action Result',
              summary: summary,
              status: 'complete',
              details: outputText.substring(0, 500)
            };
          }

          // Knowledge base lookup output
          if (observation.knowledgeBaseLookupOutput) {
            const kbOutput = observation.knowledgeBaseLookupOutput;
            const retrievedRefs = kbOutput.retrievedReferences || [];
            return {
              id: `step-${stepId}`,
              type: 'processing',
              timestamp: Date.now(),
              title: 'Knowledge Retrieved',
              summary: `Found ${retrievedRefs.length} relevant reference(s)`,
              status: 'complete',
              details: retrievedRefs.length > 0 ? JSON.stringify(retrievedRefs[0], null, 2) : undefined
            };
          }

          // Final response observation
          if (observation.finalResponse) {
            return {
              id: `step-${stepId}`,
              type: 'completion',
              timestamp: Date.now(),
              title: 'Finalizing Response',
              summary: 'Preparing final response for user',
              status: 'complete',
              details: observation.finalResponse.text?.substring(0, 200)
            };
          }

          // Reprompt response (agent needs more information)
          if (observation.repromptResponse) {
            return {
              id: `step-${stepId}`,
              type: 'analysis',
              timestamp: Date.now(),
              title: 'Requesting Clarification',
              summary: observation.repromptResponse.text || 'Agent needs additional information',
              status: 'complete',
              details: observation.repromptResponse.source
            };
          }
        }

        // Model invocation output - Agent has generated a response
        if (orchTrace.modelInvocationOutput) {
          const output = orchTrace.modelInvocationOutput;
          return {
            id: `step-${stepId}`,
            type: 'completion',
            timestamp: Date.now(),
            title: 'Generating Response',
            summary: 'Formulating final response based on execution results',
            status: 'complete',
            details: output.rawResponse?.content?.substring(0, 200)
          };
        }
      }

      // Handle pre-processing trace (input validation, etc.)
      if (trace.preProcessingTrace) {
        const preTrace = trace.preProcessingTrace;
        if (preTrace.modelInvocationInput) {
          return {
            id: `step-${stepId}`,
            type: 'analysis',
            timestamp: Date.now(),
            title: 'Pre-processing Input',
            summary: 'Validating and preparing user input',
            status: 'complete'
          };
        }
      }

      // Handle post-processing trace (output formatting, etc.)
      if (trace.postProcessingTrace) {
        const postTrace = trace.postProcessingTrace;
        if (postTrace.modelInvocationOutput) {
          return {
            id: `step-${stepId}`,
            type: 'completion',
            timestamp: Date.now(),
            title: 'Post-processing Output',
            summary: 'Formatting and validating response',
            status: 'complete'
          };
        }
      }

      // Handle failure trace
      if (trace.failureTrace) {
        const failTrace = trace.failureTrace;
        return {
          id: `step-${stepId}`,
          type: 'processing',
          timestamp: Date.now(),
          title: 'Error Occurred',
          summary: failTrace.failureReason || 'An error occurred during execution',
          status: 'error',
          details: JSON.stringify(failTrace, null, 2)
        };
      }

      return null;
    } catch (error) {
      console.error('[EDIcraft MCP Client] Error extracting thought step:', error);
      return null;
    }
  }

  /**
   * Test connection to Minecraft server
   * This is a placeholder for future RCON connection testing
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`[EDIcraft MCP Client] Testing connection to ${this.config.minecraftHost}:${this.config.minecraftPort}`);
      // Note: Actual RCON connection testing would require the rcon library
      // For now, we rely on the agent's internal connection handling
      return true;
    } catch (error) {
      console.error('[EDIcraft MCP Client] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}
