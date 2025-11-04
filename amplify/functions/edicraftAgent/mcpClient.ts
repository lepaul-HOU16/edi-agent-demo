/**
 * EDIcraft MCP Client
 * Client for communicating with the EDIcraft MCP server (Bedrock AgentCore)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';

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
  private bedrockClient: BedrockAgentCoreClient;
  private sessionId: string;

  constructor(config: EDIcraftConfig) {
    this.config = config;
    // Bedrock AgentCore client - let SDK determine the correct endpoint
    this.bedrockClient = new BedrockAgentCoreClient({ 
      region: config.region
    });
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
      // Requirement 3.1: Use BedrockAgentCoreClient to invoke the agent
      // Requirement 3.2: Pass agent ID from environment variables
      // Requirement 3.3: Create unique session ID for each conversation
      
      // Bedrock AgentCore uses a payload-based API with runtime ARN
      const runtimeArn = `arn:aws:bedrock-agentcore:${this.config.region}:${process.env.AWS_ACCOUNT_ID || '484907533441'}:runtime/${this.config.bedrockAgentId}`;
      
      const payload = JSON.stringify({
        message: message,
        sessionId: this.sessionId
      });
      
      const command = new InvokeAgentRuntimeCommand({
        agentRuntimeArn: runtimeArn,
        runtimeSessionId: this.sessionId,
        contentType: 'application/json',
        accept: 'application/json',
        payload: new TextEncoder().encode(payload)
      });

      console.log('[EDIcraft MCP Client] Sending InvokeAgentRuntimeCommand');
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
      console.log('[EDIcraft MCP Client] Processing response');
      // Don't log the full response object - it may contain circular references
      console.log('[EDIcraft MCP Client] Response type:', typeof response);
      if (response && typeof response === 'object') {
        console.log('[EDIcraft MCP Client] Response keys:', Object.keys(response));
      }
      
      // Bedrock AgentCore returns response in the 'response' field as a streaming body
      if (response.response) {
        console.log('[EDIcraft MCP Client] Processing response stream');
        
        // Read the streaming response body
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.response) {
          if (chunk) {
            chunks.push(chunk);
          }
        }
        
        // Combine all chunks and decode
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        const responseText = new TextDecoder().decode(combined);
        console.log('[EDIcraft MCP Client] Response length:', responseText.length);
        console.log('[EDIcraft MCP Client] Response preview:', responseText.substring(0, 300));
        
        // Parse the response text - it might be in format: {role=assistant, content=[{text=...}]}
        // This is a Python-style string representation, not JSON
        completion = this.extractTextFromResponse(responseText);
        
        // Ensure completion is a string
        if (typeof completion !== 'string') {
          completion = String(completion || '');
        }
        
        console.log('[EDIcraft MCP Client] Extracted completion:', completion.substring(0, 200));
        
        // Create thought steps from the response
        thoughtSteps.push({
          id: 'edicraft-processing',
          type: 'processing',
          timestamp: Date.now(),
          title: 'EDIcraft Agent Processing',
          summary: 'Successfully invoked Bedrock AgentCore agent',
          status: 'complete'
        });
      } else if (response.completion) {
        // Fallback to old format
        console.log('[EDIcraft MCP Client] Processing completion stream');
        
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

      // Ensure completion is always a string
      if (typeof completion !== 'string') {
        completion = String(completion || 'No response generated');
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
   * Extract text from response that may be in Python dict format or JSON
   * Handles formats like: {role=assistant, content=[{text=Hello!}]}
   */
  private extractTextFromResponse(responseText: string): string {
    console.log('[EDIcraft MCP Client] extractTextFromResponse input type:', typeof responseText);
    console.log('[EDIcraft MCP Client] extractTextFromResponse input preview:', String(responseText).substring(0, 200));
    
    try {
      // First try to parse as JSON
      const jsonData = JSON.parse(responseText);
      console.log('[EDIcraft MCP Client] Parsed as JSON, keys:', Object.keys(jsonData));
      
      // CRITICAL FIX: Check for response field as STRING first (from Python agent)
      if (jsonData.response && typeof jsonData.response === 'string') {
        console.log('[EDIcraft MCP Client] Found response string field');
        return jsonData.response;
      }
      
      // Handle nested response format: {response: {role: "assistant", content: [{text: "..."}]}}
      if (jsonData.response && typeof jsonData.response === 'object') {
        console.log('[EDIcraft MCP Client] Found nested response object');
        if (jsonData.response.content && Array.isArray(jsonData.response.content)) {
          const texts = jsonData.response.content.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && item.text) return item.text;
            return '';
          }).filter(t => t);
          if (texts.length > 0) {
            console.log('[EDIcraft MCP Client] Extracted from response.content array');
            return texts.join('\n');
          }
        }
      }
      
      // Extract text from various JSON formats
      if (jsonData.message && typeof jsonData.message === 'string') {
        console.log('[EDIcraft MCP Client] Found message field');
        return jsonData.message;
      }
      if (jsonData.text && typeof jsonData.text === 'string') {
        console.log('[EDIcraft MCP Client] Found text field');
        return jsonData.text;
      }
      
      if (jsonData.content) {
        console.log('[EDIcraft MCP Client] Found content field, type:', typeof jsonData.content, 'isArray:', Array.isArray(jsonData.content));
        if (Array.isArray(jsonData.content)) {
          const texts = jsonData.content.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && item.text) return item.text;
            return '';
          }).filter(t => t);
          if (texts.length > 0) {
            console.log('[EDIcraft MCP Client] Extracted from content array');
            return texts.join('\n');
          }
        }
        if (typeof jsonData.content === 'object' && jsonData.content.text) {
          console.log('[EDIcraft MCP Client] Found content.text');
          return jsonData.content.text;
        }
        if (typeof jsonData.content === 'string') {
          console.log('[EDIcraft MCP Client] Content is string');
          return jsonData.content;
        }
      }
      
      // If we have a JSON object but couldn't extract text, try JSON.stringify as last resort
      console.log('[EDIcraft MCP Client] Could not extract text from JSON, using original');
      return responseText;
    } catch (e) {
      console.log('[EDIcraft MCP Client] Not valid JSON, trying Python dict format');
      // Not valid JSON, try to parse Python dict format
      // Format: {role=assistant, content=[{text=Hello! ...}]}
      
      // Extract content array
      const contentMatch = responseText.match(/content=\[({text=.+?})\]/s);
      if (contentMatch) {
        const contentStr = contentMatch[1];
        // Extract text value
        const textMatch = contentStr.match(/text=(.+?)(?:}|$)/s);
        if (textMatch) {
          console.log('[EDIcraft MCP Client] Extracted from Python dict format');
          return textMatch[1].trim();
        }
      }
      
      // Try simpler pattern: text=...
      const simpleTextMatch = responseText.match(/text=(.+?)(?:}|$)/s);
      if (simpleTextMatch) {
        console.log('[EDIcraft MCP Client] Extracted from simple text pattern');
        return simpleTextMatch[1].trim();
      }
      
      // If all else fails, return the original text
      console.log('[EDIcraft MCP Client] Using original text as-is');
      return responseText;
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
