import { useState, useCallback } from 'react';
import { AgentService, AgentMessage } from '../services/agentService';

export function useChat(chatSessionId: string) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const agentService = new AgentService();

  const sendMessage = useCallback(async (content: string, foundationModelId?: string) => {
    if (!content.trim()) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const assistantMessage = await agentService.sendMessage(
        chatSessionId,
        content,
        foundationModelId
      );
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Add error message to chat
      const errorResponse: AgentMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [chatSessionId, agentService]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
}
