import { AgentRequest, AgentResponse, ToolContext } from '../core/types';
import { getFoundationModelId } from '../core/config';

export class MinimalAgent {
  private context: ToolContext;
  private modelId: string;

  constructor(context: ToolContext, modelId?: string) {
    this.context = context;
    this.modelId = getFoundationModelId(modelId);
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      // For now, return a simple response without heavy dependencies
      // This can be expanded later with actual AI model calls
      const response = `Hello! I received your message: "${request.message}". I'm a lightweight agent running with model ${this.modelId}.`;
      
      return {
        success: true,
        message: response,
        artifacts: []
      };
    } catch (error) {
      console.error('Minimal agent processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
