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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔵 FRONTEND (API Client): Sending message to backend');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🆔 Session ID:', chatSessionId);
    console.log('📝 Message:', message);
    console.log('📚 History Length:', conversationHistory?.length || 0);
    console.log('🌐 Endpoint: /api/chat/message');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
    
    const response = await apiPost<SendMessageResponse>('/api/chat/message', {
      message,
      chatSessionId,
      conversationHistory,
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔵 FRONTEND (API Client): Response received from backend');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Response:', JSON.stringify(response, null, 2));
    console.log('✅ Has Success Field:', 'success' in response);
    console.log('📊 Has Response Field:', 'response' in response);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Validate response structure
    if (!response) {
      console.error('❌ FRONTEND (API Client): Received null/undefined response');
      return {
        success: false,
        error: 'No response from server',
      };
    }
    
    // If response doesn't have success field, check if it has the expected structure
    if (response.success === undefined && response.response) {
      console.warn('⚠️ FRONTEND (API Client): Response missing success field, normalizing');
      return {
        success: true,
        response: response.response,
      };
    }
    
    console.log('✅ FRONTEND (API Client): Response validated successfully');
    return response;
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ FRONTEND (API Client): CRITICAL ERROR');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error keys:', error ? Object.keys(error) : 'null');
    console.error('Error message:', error?.message || error?.toString());
    console.error('Stack:', error?.stack);
    console.error('═══════════════════════════════════════════════════════════');
    
    const errorMessage = error?.message || error?.toString() || 'Failed to send message';
    
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
