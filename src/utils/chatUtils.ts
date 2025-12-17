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
  agentType?: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft',
  projectContext?: {
    projectId?: string;
    projectName?: string;
    location?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  },
  collectionContext?: {
    collectionId: string;
    name: string;
    wellCount: number;
    dataSourceType: string;
    dataItems?: Array<{
      id: string;
      name: string;
      type: string;
      s3Key?: string;
      osduId?: string;
      location?: string;
      coordinates?: [number, number];
    }>;
    geographicBounds?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  }
}) => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔵 FRONTEND (chatUtils): sendMessage called');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🆔 Session ID:', props.chatSessionId);
  console.log('📝 Message:', props.newMessage.content.text);
  console.log('🤖 Agent Type:', props.agentType || 'auto');
  console.log('🎯 Project Context:', props.projectContext);
  console.log('📚 Collection Context:', props.collectionContext ? {
    name: props.collectionContext.name,
    wellCount: props.collectionContext.wellCount,
    dataSource: props.collectionContext.dataSourceType
  } : 'None');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Use REST API client
    const { sendMessage: sendMessageAPI } = await import('@/lib/api/chat');
    
    if (!props.newMessage.content || !props.newMessage.content.text) {
      console.error('❌ FRONTEND (chatUtils): Missing content.text');
      throw new Error("content.text is missing");
    }
    
    const messageText = props.newMessage.content.text;
    console.log('🔵 FRONTEND (chatUtils): Calling REST API client...');
    
    // Call REST API
    const response = await sendMessageAPI(
      messageText,
      props.chatSessionId,
      [], // conversation history - will be handled by backend
      props.projectContext, // Pass project context to backend
      props.collectionContext // Pass collection context to backend
    );
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔵 FRONTEND (chatUtils): REST API Response');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Success:', response.success);
    console.log('📦 Has Response:', !!response.response);
    console.log('📊 Artifact Count:', response.response?.artifacts?.length || 0);
    console.log('💬 Message Length:', response.response?.text?.length || 0);
    console.log('🧠 Thought Steps:', response.data?.thoughtSteps?.length || 0);
    console.log('═══════════════════════════════════════════════════════════');
    
    // CRITICAL FIX: Return response even on error so thought steps are displayed
    if (!response.success) {
      console.warn('⚠️ FRONTEND (chatUtils): API returned error, but returning response with thought steps');
      return {
        success: false,
        response: response.response || { text: response.message, artifacts: [] },
        data: response.data, // Include thought steps even on error
        error: response.error || response.message
      };
    }
    
    console.log('✅ FRONTEND (chatUtils): Message sent successfully');
    
    return {
      success: true,
      response: response.response,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ FRONTEND (chatUtils): CRITICAL ERROR');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('═══════════════════════════════════════════════════════════');
    
    return {
      success: false,
      response: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};


