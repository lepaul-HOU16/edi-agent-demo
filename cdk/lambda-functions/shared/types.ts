/**
 * Shared TypeScript types for Lambda functions
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * User context from JWT token
 */
export interface UserContext {
  sub: string; // User ID
  email?: string;
  username?: string;
  groups?: string[];
}

/**
 * Extract user context from API Gateway event
 * Supports both Lambda authorizer context and JWT authorizer claims
 * Updated: 2025-11-16 - Fixed to read from Lambda authorizer context
 */
export function getUserContext(event: APIGatewayProxyEventV2): UserContext | null {
  try {
    const authorizer = (event.requestContext as any).authorizer;
    
    // Try Lambda authorizer context first (our custom authorizer)
    if (authorizer?.lambda) {
      const context = authorizer.lambda;
      return {
        sub: context.userId || context.sub,
        email: context.email,
        username: context.username,
        groups: context.groups ? (Array.isArray(context.groups) ? context.groups : [context.groups]) : [],
      };
    }
    
    // Fallback to JWT claims (if using JWT authorizer)
    const claims = authorizer?.jwt?.claims;
    if (claims) {
      return {
        sub: claims.sub,
        email: claims.email,
        username: claims['cognito:username'],
        groups: claims['cognito:groups'] || [],
      };
    }

    console.warn('No user context found in authorizer');
    return null;
  } catch (error) {
    console.error('Error extracting user context:', error);
    return null;
  }
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message,
      data,
    } as ApiResponse<T>),
  };
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error,
      code,
    } as ApiResponse),
  };
}

/**
 * Parse request body
 */
export function parseBody<T>(event: APIGatewayProxyEventV2): T | null {
  try {
    if (!event.body) {
      return null;
    }
    return JSON.parse(event.body) as T;
  } catch (error) {
    console.error('Error parsing request body:', error);
    return null;
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
  body: T | null,
  requiredFields: (keyof T)[]
): string | null {
  if (!body) {
    return 'Request body is required';
  }

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${String(field)}`;
    }
  }

  return null;
}
