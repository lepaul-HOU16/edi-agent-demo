import { apiPost, apiGet, apiPut, apiDelete } from './client';

export interface Collection {
  id: string;
  name: string;
  description: string;
  dataSourceType: string;
  previewMetadata: any;
  dataItems: any[];
  createdAt: string;
  lastAccessedAt: string;
  owner: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  dataSourceType: string;
  previewMetadata?: any;
  dataItems?: any[];
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  dataSourceType?: string;
  previewMetadata?: any;
  dataItems?: any[];
}

export interface CollectionQueryRequest {
  // Add query parameters as needed
  [key: string]: any;
}

/**
 * Create a new collection
 */
export async function createCollection(data: CreateCollectionRequest): Promise<{
  success: boolean;
  collection: Collection;
  collectionId: string;
  message: string;
}> {
  return apiPost('/api/collections/create', data);
}

/**
 * List all collections
 */
export async function listCollections(): Promise<{
  collections: Collection[];
  count: number;
}> {
  return apiGet('/api/collections/list');
}

/**
 * Get a specific collection by ID
 */
export async function getCollection(collectionId: string): Promise<{
  success: boolean;
  collection: Collection;
}> {
  return apiGet(`/api/collections/${collectionId}`);
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionRequest
): Promise<{
  success: boolean;
  collection: Collection;
  message: string;
}> {
  return apiPut(`/api/collections/${collectionId}`, data);
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiDelete(`/api/collections/${collectionId}`);
}

/**
 * Query a collection (e.g., get wells)
 */
export async function queryCollection(
  collectionId: string,
  query?: CollectionQueryRequest
): Promise<{
  success: boolean;
  wells: any[];
  count: number;
}> {
  return apiPost(`/api/collections/${collectionId}/query`, query || {});
}
