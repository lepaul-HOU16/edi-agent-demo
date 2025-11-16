import { sendMessage as sendChatMessage } from '../lib/api/chat';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  artifacts?: any[];
}

export interface ChatSession {
  id: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class AgentService {
  async sendMessage(
    chatSessionId: string,
    message: string,
    foundationModelId?: string
  ): Promise<AgentMessage> {
    try {
      const response = await sendChatMessage(message, chatSessionId);

      if (!response.success) {
        throw new Error(response.error || 'Agent request failed');
      }

      return {
        role: 'assistant',
        content: response.response?.text || response.message || '',
        timestamp: new Date(),
        artifacts: response.response?.artifacts || []
      };
    } catch (error) {
      console.error('Agent service error:', error);
      throw error;
    }
  }

  async sendMessageWithFullAgent(
    chatSessionId: string,
    message: string,
    foundationModelId?: string
  ): Promise<AgentMessage> {
    try {
      const response = await sendChatMessage(message, chatSessionId);

      return {
        role: 'assistant',
        content: response.response?.text || response.message || 'No response',
        timestamp: new Date(),
        artifacts: response.response?.artifacts || []
      };
    } catch (error) {
      console.error('Full agent service error:', error);
      throw error;
    }
  }

  async createChatSession(): Promise<string> {
    // Generate a simple UUID for chat session
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
