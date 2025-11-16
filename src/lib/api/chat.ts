/**
 * Chat REST API Client
 * 
 * Provides methods to interact with the CDK-deployed chat API
 */

import { apiPost } from './client';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: {
    text: string;
  };
  artifacts?: any[];
}

export interface SendMessageRequest {
  message: string;
  chatSessionId: string;
  conversationHistory?: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  response?: {
    text: string;
    artifacts?: any[];
  };
  error?: string;
}

/**
 * Send a chat message
 */
export async function sendMessage(
  message: string,
  chatSessionId: string,
  conversationHistory?: ChatMessage[]
): Promise<SendMessageResponse> {
  try {
    console.log('[Chat API] Sending message:', { message, chatSessionId });
    
    const response = await apiPost<SendMessageResponse>('/api/chat/message', {
      message,
      chatSessionId,
      conversationHistory,
    });
    
    console.log('[Chat API] Response received:', response);
    
    // Validate response structure
    if (!response) {
      console.error('[Chat API] Received null/undefined response');
      return {
        success: false,
        error: 'No response from server',
      };
    }
    
    // If response doesn't have success field, check if it has the expected structure
    if (response.success === undefined && response.response) {
      // Backend returned data but in different format, normalize it
      return {
        success: true,
        response: response.response,
      };
    }
    
    return response;
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error type:', typeof error);
    console.error('[Chat API] Error keys:', error ? Object.keys(error) : 'null');
    
    const errorMessage = error?.message || error?.toString() || 'Failed to send message';
    console.error('[Chat API] Error message:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get messages for a chat session
 */
export async function getChatMessages(chatSessionId: string): Promise<any[]> {
  try {
    console.log('[Chat API] Fetching messages for session:', chatSessionId);
    
    // For now, return empty array since we don't have a messages endpoint yet
    // This will be implemented when we add the messages Lambda
    console.warn('[Chat API] Messages endpoint not yet implemented, returning empty array');
    return [];
  } catch (error: any) {
    console.error('[Chat API] Get messages error:', error);
    return [];
  }
}

/**
 * Get agent progress (for long-running operations)
 */
export async function getAgentProgress(requestId: string): Promise<any> {
  try {
    // Note: This endpoint doesn't exist yet in CDK
    // Keeping for future implementation
    throw new Error('Agent progress endpoint not yet implemented');
  } catch (error: any) {
    console.error('[Chat API] Get agent progress error:', error);
    throw error;
  }
}
