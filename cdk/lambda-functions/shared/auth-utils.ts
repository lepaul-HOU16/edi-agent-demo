/**
 * Shared authentication utilities for Lambda functions
 */

import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Extract user ID from JWT claims or custom authorizer context
 * Supports both Cognito JWT authorizer and custom Lambda authorizer
 */
export function getUserId(event: APIGatewayProxyEventV2): string {
  // Try JWT claims first (standard Cognito authorizer)
  const claims = event.requestContext.authorizer?.jwt?.claims;
  if (claims && claims.sub) {
    return claims.sub as string;
  }
  
  // Try custom Lambda authorizer context (mock auth or custom authorizer)
  const authContext = event.requestContext.authorizer as any;
  if (authContext && authContext.lambda) {
    // Lambda authorizer puts context in 'lambda' property
    if (authContext.lambda.userId) {
      return authContext.lambda.userId as string;
    }
  }
  
  // Try direct context (fallback)
  if (authContext && authContext.userId) {
    return authContext.userId as string;
  }
  
  throw new Error('Unauthorized: No user ID in token');
}

/**
 * Extract user email from JWT claims or custom authorizer context
 */
export function getUserEmail(event: APIGatewayProxyEventV2): string | undefined {
  // Try JWT claims first
  const claims = event.requestContext.authorizer?.jwt?.claims;
  if (claims && claims.email) {
    return claims.email as string;
  }
  
  // Try custom Lambda authorizer context
  const authContext = event.requestContext.authorizer as any;
  if (authContext && authContext.lambda && authContext.lambda.email) {
    return authContext.lambda.email as string;
  }
  
  // Try direct context (fallback)
  if (authContext && authContext.email) {
    return authContext.email as string;
  }
  
  return undefined;
}

/**
 * Extract username from JWT claims or custom authorizer context
 */
export function getUsername(event: APIGatewayProxyEventV2): string | undefined {
  // Try JWT claims first
  const claims = event.requestContext.authorizer?.jwt?.claims;
  if (claims) {
    return (claims.username || claims['cognito:username']) as string | undefined;
  }
  
  // Try custom Lambda authorizer context
  const authContext = event.requestContext.authorizer as any;
  if (authContext && authContext.lambda && authContext.lambda.username) {
    return authContext.lambda.username as string;
  }
  
  // Try direct context (fallback)
  if (authContext && authContext.username) {
    return authContext.username as string;
  }
  
  return undefined;
}
