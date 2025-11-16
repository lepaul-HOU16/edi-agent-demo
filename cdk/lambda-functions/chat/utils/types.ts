/**
 * Type definitions for chat utilities
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | { text: string };
  artifacts?: any[];
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  linkedCollectionId?: string;
  collectionContext?: any;
  dataAccessLog?: any[];
}

export interface Artifact {
  type: string;
  messageContentType: string;
  [key: string]: any;
}
