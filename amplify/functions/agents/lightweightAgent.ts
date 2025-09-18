import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentRequest, AgentResponse, ToolContext } from '../core/types';
import { getFoundationModelId } from '../core/config';
import { loadTools } from '../core/toolRegistry';

export class LightweightAgent {
  private model: ChatBedrockConverse;
  private context: ToolContext;

  constructor(context: ToolContext, modelId?: string) {
    this.context = context;
    this.model = new ChatBedrockConverse({
      model: getFoundationModelId(modelId),
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Load only required tools based on message content
      const requiredTools = this.analyzeRequiredTools(request.message);
      const tools = await loadTools(requiredTools);

      const messages = [
        new SystemMessage("You are a helpful AI assistant for energy data analysis."),
        new HumanMessage(request.message)
      ];

      const response = await this.model.invoke(messages);
      
      return {
        success: true,
        message: response.content as string
      };
    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private analyzeRequiredTools(message: string): string[] {
    const tools: string[] = [];
    
    if (message.toLowerCase().includes('plot') || message.toLowerCase().includes('chart')) {
      tools.push('plotDataTool');
    }
    if (message.toLowerCase().includes('file') || message.toLowerCase().includes('upload')) {
      tools.push('s3Tools');
    }
    if (message.toLowerCase().includes('spark') || message.toLowerCase().includes('query')) {
      tools.push('pysparkTool');
    }
    
    return tools;
  }
}
