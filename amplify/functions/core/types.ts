// Core types shared across all functions
export interface AgentRequest {
  userId: string;
  chatSessionId: string;
  foundationModelId?: string;
  message: string;
}

export interface AgentResponse {
  success: boolean;
  message?: string;
  error?: string;
  artifacts?: any[];
}

export interface ToolContext {
  userId: string;
  chatSessionId: string;
  s3Bucket?: string;
}

export interface StreamChunk {
  type: 'message' | 'tool_call' | 'artifact';
  content: any;
  timestamp: number;
}
