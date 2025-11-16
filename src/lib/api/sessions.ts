/**
 * ChatSession REST API Client
 * 
 * Provides methods for ChatSession CRUD operations.
 * Replaces Amplify GraphQL ChatSession model operations.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './client';

/**
 * ChatSession interface matching backend schema
 */
export interface ChatSession {
  id: string;
  name?: string;
  owner: string;
  workSteps?: any[];
  linkedCollectionId?: string;
  collectionContext?: any;
  dataAccessLog?: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ChatMessage interface for session messages
 */
export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: string;
  content: any;
  artifacts?: any[];
  responseComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create session request
 */
export interface CreateSessionRequest {
  name?: string;
  workSteps?: any[];
  linkedCollectionId?: string;
  collectionContext?: any;
  dataAccessLog?: any[];
}

/**
 * Update session request
 */
export interface UpdateSessionRequest {
  name?: string;
  workSteps?: any[];
  linkedCollectionId?: string;
  collectionContext?: any;
  dataAccessLog?: any[];
}

/**
 * List sessions response
 */
export interface ListSessionsResponse {
  data: ChatSession[];
  nextToken?: string;
}

/**
 * List messages response
 */
export interface ListMessagesResponse {
  data: ChatMessage[];
  nextToken?: string;
}

/**
 * Create a new chat session
 */
export async function createSession(request: CreateSessionRequest = {}): Promise<ChatSession> {
  const response = await apiPost<{ data: ChatSession }>('/api/chat/sessions', request);
  return response.data;
}

/**
 * List user's chat sessions
 */
export async function listSessions(limit: number = 50, nextToken?: string): Promise<ListSessionsResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (nextToken) {
    params.append('nextToken', nextToken);
  }

  const response = await apiGet<ListSessionsResponse>(`/api/chat/sessions?${params.toString()}`);
  return response;
}

/**
 * Get a specific chat session by ID
 */
export async function getSession(sessionId: string): Promise<ChatSession> {
  const response = await apiGet<{ data: ChatSession }>(`/api/chat/sessions/${sessionId}`);
  return response.data;
}

/**
 * Update a chat session
 */
export async function updateSession(sessionId: string, updates: UpdateSessionRequest): Promise<ChatSession> {
  const response = await apiPatch<{ data: ChatSession }>(`/api/chat/sessions/${sessionId}`, updates);
  return response.data;
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiDelete(`/api/chat/sessions/${sessionId}`);
}

/**
 * Get messages for a specific session
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ListMessagesResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (nextToken) {
    params.append('nextToken', nextToken);
  }

  const response = await apiGet<ListMessagesResponse>(
    `/api/chat/sessions/${sessionId}/messages?${params.toString()}`
  );
  return response;
}

/**
 * Helper: Create session with default name
 */
export async function createSessionWithDefaultName(): Promise<ChatSession> {
  const defaultName = `New Canvas - ${new Date().toLocaleString()}`;
  return createSession({ name: defaultName });
}

/**
 * Helper: Delete multiple sessions
 */
export async function deleteSessions(sessionIds: string[]): Promise<void> {
  await Promise.all(sessionIds.map(id => deleteSession(id)));
}
