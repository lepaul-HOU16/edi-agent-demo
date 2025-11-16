/**
 * REST API Type Definitions
 * 
 * These types replace the Amplify-generated Schema types
 * for use with the CDK REST API backend
 */

/**
 * Chat Message Types
 */
export interface ChatMessageContent {
  text: string;
}

export interface ChatMessageBase {
  id?: string;
  chatSessionId: string;
  role: 'human' | 'ai' | 'tool' | 'ai-stream' | 'professional-response' | 'thinking';
  content: ChatMessageContent;
  artifacts?: any[];
  thoughtSteps?: any[];
  responseComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export type ChatMessageCreateType = Omit<ChatMessageBase, 'id' | 'createdAt' | 'updatedAt'>;
export type ChatMessageType = ChatMessageBase;

/**
 * Chat Session Types
 */
export interface ChatSessionBase {
  id?: string;
  title?: string;
  userId?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ChatSessionCreateType = Omit<ChatSessionBase, 'id' | 'createdAt' | 'updatedAt'>;
export type ChatSessionType = ChatSessionBase;

/**
 * Project Types
 */
export interface ProjectBase {
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectCreateType = Omit<ProjectBase, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectType = ProjectBase;

/**
 * Collection Types
 */
export interface CollectionBase {
  id?: string;
  name: string;
  description?: string;
  items?: any[];
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CollectionCreateType = Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>;
export type CollectionType = CollectionBase;

/**
 * Legacy Schema compatibility layer
 * Provides backward compatibility with Amplify Schema types
 */
export const Schema = {
  ChatMessage: {
    createType: {} as ChatMessageCreateType,
    type: {} as ChatMessageType,
  },
  ChatSession: {
    createType: {} as ChatSessionCreateType,
    type: {} as ChatSessionType,
  },
  Project: {
    createType: {} as ProjectCreateType,
    type: {} as ProjectType,
  },
  Collection: {
    createType: {} as CollectionCreateType,
    type: {} as CollectionType,
  },
};

export type Schema = typeof Schema;
