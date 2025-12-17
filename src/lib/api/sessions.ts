import { apiPost, apiGet, apiPut, apiDelete } from './client';

/**
 * Session interface matching backend schema
 */
export interface Session {
  id: string;
  name: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
  createdAt: string;
  updatedAt: string;
  owner: string;
}

/**
 * Collection context stored in session
 */
export interface CollectionContext {
  collectionId: string;
  name: string;
  wellCount: number;
  dataSourceType: string;
  dataItems: DataItem[];
  previewMetadata: any;
}

/**
 * Data item in collection
 */
export interface DataItem {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  s3Key?: string;
  osduId?: string;
  location?: string;
  operator?: string;
  depth?: string;
  curves?: string[];
  coordinates?: [number, number];
}

/**
 * Request to create a new session
 */
export interface CreateSessionRequest {
  name: string;
  linkedCollectionId?: string;
}

/**
 * Request to update a session
 */
export interface UpdateSessionRequest {
  name?: string;
  linkedCollectionId?: string;
  collectionContext?: CollectionContext;
}

/**
 * Create a new session
 */
export async function createSession(data: CreateSessionRequest): Promise<{
  success: boolean;
  session: Session;
  sessionId: string;
}> {
  return apiPost('/api/sessions/create', data);
}

/**
 * Get a specific session by ID
 */
export async function getSession(sessionId: string): Promise<{
  success: boolean;
  session: Session;
}> {
  return apiGet(`/api/sessions/${sessionId}`);
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  data: UpdateSessionRequest
): Promise<{
  success: boolean;
  session: Session;
}> {
  return apiPut(`/api/sessions/${sessionId}`, data);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiDelete(`/api/sessions/${sessionId}`);
}

/**
 * List all sessions for the current user
 */
export async function listSessions(): Promise<{
  sessions: Session[];
  count: number;
}> {
  return apiGet('/api/sessions/list');
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<{
  success: boolean;
  data: any[];
}> {
  return apiGet(`/api/chat/sessions/${sessionId}/messages`);
}
