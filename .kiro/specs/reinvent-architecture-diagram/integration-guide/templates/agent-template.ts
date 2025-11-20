/**
 * Agent Template
 * 
 * This template provides a starting point for creating new agents.
 * Replace placeholders with your agent-specific implementation.
 */

import { BaseEnhancedAgent } from './BaseEnhancedAgent';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

interface YourAgentResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  error?: string;
}

interface ThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 
        'execution' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'in_progress' | 'complete' | 'error';
  context?: Record<string, any>;
  confidence?: number;
  duration?: number;
}

/**
 * YourAgent - [Brief description of what this agent does]
 * 
 * Handles queries related to [domain/functionality]
 * 
 * Example queries:
 * - "Example query 1"
 * - "Example query 2"
 */
export class YourAgent extends BaseEnhancedAgent {
  private lambdaClient: LambdaClient;
  
  constructor() {
    super(true); // Enable verbose logging
    this.lambdaClient = new LambdaClient({});
  }

  /**
   * Main entry point for processing user messages
   */
  async processMessage(message: string): Promise<YourAgentResponse> {
    const thoughtSteps: ThoughtStep[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Intent Detection
      thoughtSteps.push(this.createThoughtStep(
        'intent_detection',
        'Analyzing Request',
        'Understanding user intent and extracting parameters'
      ));

      const intent = this.detectIntent(message);
      const parameters = this.extractParameters(message);

      thoughtSteps[0].status = 'complete';
      thoughtSteps[0].summary = `Intent detected: ${intent} with confidence 0.95`;
      thoughtSteps[0].confidence = 0.95;
      thoughtSteps[0].duration = Date.now() - startTime;

      // Step 2: Parameter Validation
      thoughtSteps.push(this.createThoughtStep(
        'parameter_extraction',
        'Validating Parameters',
        'Checking required parameters and data availability'
      ));

      const validation = this.validateParameters(parameters);
      if (!validation.valid) {
        thoughtSteps[1].status = 'error';
        thoughtSteps[1].summary = `Validation failed: ${validation.error}`;
        
        return {
          success: false,
          message: `I need more information: ${validation.error}`,
          thoughtSteps,
          error: validation.error
        };
      }

      thoughtSteps[1].status = 'complete';
      thoughtSteps[1].summary = 'All required parameters validated';
      thoughtSteps[1].duration = Date.now() - startTime - thoughtSteps[0].duration!;

      // Step 3: Tool Selection (if using tools)
      if (this.requiresToolInvocation(intent)) {
        thoughtSteps.push(this.createThoughtStep(
          'tool_selection',
          'Selecting Analysis Tools',
          'Determining which tools to use for this analysis'
        ));

        const tools = this.selectTools(intent, parameters);
        
        thoughtSteps[2].status = 'complete';
        thoughtSteps[2].summary = `Selected tools: ${tools.join(', ')}`;
        thoughtSteps[2].context = { tools };
        thoughtSteps[2].duration = Date.now() - startTime - 
          thoughtSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
      }

      // Step 4: Execution
      thoughtSteps.push(this.createThoughtStep(
        'execution',
        'Executing Analysis',
        'Processing your request and generating results'
      ));

      const result = await this.executeAnalysis(intent, parameters);

      thoughtSteps[thoughtSteps.length - 1].status = 'complete';
      thoughtSteps[thoughtSteps.length - 1].summary = 'Analysis completed successfully';
      thoughtSteps[thoughtSteps.length - 1].duration = Date.now() - startTime - 
        thoughtSteps.slice(0, -1).reduce((sum, step) => sum + (step.duration || 0), 0);

      // Step 5: Completion
      thoughtSteps.push(this.createThoughtStep(
        'completion',
        'Finalizing Results',
        'Preparing response and artifacts for display'
      ));

      const response = this.formatResponse(result);

      thoughtSteps[thoughtSteps.length - 1].status = 'complete';
      thoughtSteps[thoughtSteps.length - 1].summary = 
        `Generated ${response.artifacts?.length || 0} artifacts`;
      thoughtSteps[thoughtSteps.length - 1].duration = Date.now() - startTime - 
        thoughtSteps.slice(0, -1).reduce((sum, step) => sum + (step.duration || 0), 0);

      return {
        success: true,
        message: response.message,
        artifacts: response.artifacts,
        thoughtSteps
      };

    } catch (error: any) {
      console.error('[YourAgent] Error processing message:', error);

      // Mark last thought step as error
      if (thoughtSteps.length > 0) {
        thoughtSteps[thoughtSteps.length - 1].status = 'error';
        thoughtSteps[thoughtSteps.length - 1].summary = `Error: ${error.message}`;
      }

      return {
        success: false,
        message: 'I encountered an error processing your request. Please try again.',
        thoughtSteps,
        error: error.message
      };
    }
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Add your intent detection patterns here
    if (/pattern1/.test(lowerMessage)) {
      return 'intent_1';
    }
    if (/pattern2/.test(lowerMessage)) {
      return 'intent_2';
    }

    return 'general_query';
  }

  /**
   * Extract parameters from message
   */
  private extractParameters(message: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract parameters using regex or NLP
    // Example: Extract coordinates
    const coordMatch = message.match(/(\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      parameters.latitude = parseFloat(coordMatch[1]);
      parameters.longitude = parseFloat(coordMatch[2]);
    }

    // Extract other parameters as needed
    // ...

    return parameters;
  }

  /**
   * Validate extracted parameters
   */
  private validateParameters(parameters: Record<string, any>): { valid: boolean; error?: string } {
    // Add your validation logic here
    if (!parameters.latitude || !parameters.longitude) {
      return {
        valid: false,
        error: 'Please provide coordinates (latitude, longitude)'
      };
    }

    if (parameters.latitude < -90 || parameters.latitude > 90) {
      return {
        valid: false,
        error: 'Latitude must be between -90 and 90'
      };
    }

    if (parameters.longitude < -180 || parameters.longitude > 180) {
      return {
        valid: false,
        error: 'Longitude must be between -180 and 180'
      };
    }

    return { valid: true };
  }

  /**
   * Check if intent requires tool invocation
   */
  private requiresToolInvocation(intent: string): boolean {
    // Return true if this intent needs to call a tool Lambda
    return ['intent_1', 'intent_2'].includes(intent);
  }

  /**
   * Select appropriate tools for the intent
   */
  private selectTools(intent: string, parameters: Record<string, any>): string[] {
    const tools: string[] = [];

    // Select tools based on intent and parameters
    if (intent === 'intent_1') {
      tools.push('tool_1');
    }
    if (intent === 'intent_2') {
      tools.push('tool_2');
    }

    return tools;
  }

  /**
   * Execute the analysis (with or without tools)
   */
  private async executeAnalysis(
    intent: string,
    parameters: Record<string, any>
  ): Promise<any> {
    if (this.requiresToolInvocation(intent)) {
      // Invoke tool Lambda
      return await this.invokeToolLambda(parameters);
    } else {
      // Direct processing without tools
      return this.processDirectly(intent, parameters);
    }
  }

  /**
   * Invoke a tool Lambda function
   */
  private async invokeToolLambda(parameters: Record<string, any>): Promise<any> {
    const functionName = process.env.YOUR_TOOL_FUNCTION_NAME;
    
    if (!functionName) {
      throw new Error('Tool Lambda function name not configured');
    }

    console.log('[YourAgent] Invoking tool Lambda:', functionName);

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(parameters)
    });

    const response = await this.lambdaClient.send(command);
    
    if (!response.Payload) {
      throw new Error('No response from tool Lambda');
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }

    return result;
  }

  /**
   * Process query directly without tools
   */
  private processDirectly(intent: string, parameters: Record<string, any>): any {
    // Implement direct processing logic here
    return {
      result: 'Direct processing result',
      data: parameters
    };
  }

  /**
   * Format the response with artifacts
   */
  private formatResponse(result: any): { message: string; artifacts?: any[] } {
    const artifacts: any[] = [];

    // Create artifacts from result
    if (result.visualization) {
      artifacts.push({
        type: 'your_artifact_type',
        data: {
          messageContentType: 'your_artifact_type',
          title: 'Analysis Results',
          content: result.visualization,
          metadata: {
            timestamp: new Date().toISOString(),
            parameters: result.parameters
          }
        }
      });
    }

    // Generate response message
    const message = this.generateResponseMessage(result);

    return {
      message,
      artifacts: artifacts.length > 0 ? artifacts : undefined
    };
  }

  /**
   * Generate human-readable response message
   */
  private generateResponseMessage(result: any): string {
    // Create a natural language response
    return `I've completed the analysis. ${result.summary || 'Results are displayed below.'}`;
  }

  /**
   * Create a thought step object
   */
  private createThoughtStep(
    type: ThoughtStep['type'],
    title: string,
    summary: string
  ): ThoughtStep {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      status: 'in_progress'
    };
  }
}

/**
 * Usage Example:
 * 
 * const agent = new YourAgent();
 * const response = await agent.processMessage("Your query here");
 * 
 * if (response.success) {
 *   console.log(response.message);
 *   console.log(response.artifacts);
 * } else {
 *   console.error(response.error);
 * }
 */
