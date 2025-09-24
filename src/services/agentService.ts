import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

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
      const response = await client.mutations.invokeLightweightAgent({
        chatSessionId,
        message,
        foundationModelId
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Agent request failed');
      }

      return {
        role: 'assistant',
        content: response.data.message || '',
        timestamp: new Date(),
        artifacts: response.data.artifacts || []
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
      const response = await client.mutations.invokeLightweightAgent({
        chatSessionId,
        foundationModelId
      });

      return {
        role: 'assistant',
        content: response.data || 'No response',
        timestamp: new Date(),
        artifacts: []
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
