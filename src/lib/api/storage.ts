/**
 * Storage API Client
 * 
 * Handles file upload, download, list, and delete operations via REST API
 */

import { API_BASE_URL, getAuthToken } from './client';

export interface UploadFileOptions {
  contentType?: string;
}

export interface FileUrlResponse {
  url: string;
  key: string;
  bucket: string;
}

export interface ListOptions {
  subpathStrategy?: {
    strategy: 'include' | 'exclude';
  };
}

export interface S3Item {
  path: string;
  eTag?: string;
  lastModified?: Date;
  size?: number;
}

export interface ListResult {
  items: S3Item[];
  excludedSubpaths?: string[];
}

/**
 * Upload a file to S3 via backend API
 */
export async function uploadFile(
  path: string,
  data: Blob | File,
  options?: UploadFileOptions
): Promise<void> {
  const token = await getAuthToken();
  
  const formData = new FormData();
  formData.append('file', data);
  formData.append('key', path);
  
  if (options?.contentType) {
    formData.append('contentType', options.contentType);
  }

  const response = await fetch(`${API_BASE_URL}/api/s3-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }
}

/**
 * Get a signed URL for a file in S3
 */
export async function getFileUrl(path: string): Promise<string> {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/api/s3-proxy?key=${encodeURIComponent(path)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get file URL: ${response.status} ${errorText}`);
  }

  const data: FileUrlResponse = await response.json();
  return data.url;
}

/**
 * List files in S3 at a given path
 */
export async function listFiles(
  path: string,
  options?: ListOptions
): Promise<ListResult> {
  const token = await getAuthToken();
  
  const params = new URLSearchParams({
    key: path,
    action: 'list',
  });

  if (options?.subpathStrategy) {
    params.append('subpathStrategy', options.subpathStrategy.strategy);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/s3-proxy?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`List failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Delete a file from S3
 */
export async function deleteFile(path: string): Promise<void> {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/api/s3-proxy?key=${encodeURIComponent(path)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delete failed: ${response.status} ${errorText}`);
  }
}
