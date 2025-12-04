/**
 * Base REST API Client
 * 
 * Provides common functionality for all API clients
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://t4begsixg2.execute-api.us-east-1.amazonaws.com';

const COGNITO_CONFIG = {
  userPoolId: 'us-east-1_sC6yswGji',
  clientId: '18m99t0u39vi9614ssd8sf8vmb',
  region: 'us-east-1'
};

// Store token in memory
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

import { cognitoAuth } from '../auth/cognitoAuth';

/**
 * Get JWT token from Cognito
 */
export async function getAuthToken(): Promise<string> {
  return await cognitoAuth.getToken();
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    
    const token = await getAuthToken();
    console.log(`🔑 Got auth token: ${token.substring(0, 20)}...`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} ${endpoint}`, errorText);
      
      if (response.status === 401) {
        throw new Error(`Authentication failed. Using mock token for development. Backend may need to accept mock tokens.`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Request Failed: ${endpoint}`);
    console.error('Error details:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * Make an authenticated POST request
 */
export async function apiPost<T = any>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated PUT request
 */
export async function apiPut<T = any>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated PATCH request
 */
export async function apiPatch<T = any>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
