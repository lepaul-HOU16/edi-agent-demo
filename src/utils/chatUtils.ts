/**
 * Chat Utilities - REST API Version
 * 
 * Provides utility functions for chat operations using REST API.
 * NO AMPLIFY DEPENDENCIES - Pure REST API implementation.
 */

import { Message } from "./types";

/**
 * Combine and sort messages by creation time
 */
export const combineAndSortMessages = ((arr1: Array<Message>, arr2: Array<Message>) => {
  const combinedMessages = [...arr1, ...arr2];
  const uniqueMessages = combinedMessages.filter((message, index, self) =>
    index === self.findIndex((p) => p.id === message.id)
  );
  return uniqueMessages.sort((a, b) => {
    // Handle messages without createdAt (e.g., optimistically added messages)
    // Put them at the end (most recent)
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return (a.createdAt as any).localeCompare(b.createdAt as any);
  });
});

/**
 * Send a chat message via REST API
 */
export const sendMessage = async (props: {
  chatSessionId: string,
  newMessage: {
    content: {
      text: string;
    };
    role: 'user' | 'ai';
  },
  agentType?: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft'
}) => {
  console.log('=== SEND MESSAGE (REST API): Called ===');
  console.log('Chat session ID:', props.chatSessionId);
  console.log('Message text:', props.newMessage.content.text);
  
  try {
    // Use REST API client
    const { sendMessage: sendMessageAPI } = await import('@/lib/api/chat');
    
    if (!props.newMessage.content || !props.newMessage.content.text) {
      console.error('=== SEND MESSAGE: Missing content.text ===');
      throw new Error("content.text is missing");
    }
    
    const messageText = props.newMessage.content.text;
    console.log('Sending message via REST API:', messageText);
    
    // Call REST API
    const response = await sendMessageAPI(
      messageText,
      props.chatSessionId,
      [] // conversation history - will be handled by backend
    );
    
    console.log('=== SEND MESSAGE (REST API): Response received ===');
    console.log('Success:', response.success);
    console.log('Has response:', !!response.response);
    
    if (!response.success) {
      console.error('=== SEND MESSAGE: API returned error ===');
      console.error('Error:', response.error);
      throw new Error(response.error || 'Failed to send message');
    }
    
    console.log('=== SEND MESSAGE (REST API): Success ===');
    console.log('Message:', response.response?.text?.substring(0, 100) + '...');
    console.log('Artifacts:', response.response?.artifacts?.length || 0);
    
    return {
      success: true,
      response: response.response,
      error: null
    };
  } catch (error) {
    console.error('=== SEND MESSAGE: CRITICAL ERROR ===');
    console.error('Error details:', error);
    
    return {
      success: false,
      response: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};


