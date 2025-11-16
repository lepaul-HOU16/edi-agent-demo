import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Lazy-initialized Cognito JWT verifier
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    const USER_POOL_ID = process.env.USER_POOL_ID || '';
    const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
    
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      throw new Error('USER_POOL_ID and USER_POOL_CLIENT_ID must be set');
    }
    
    verifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: 'id', // Changed from 'access' to 'id' to match frontend
      clientId: USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
}

/**
 * Custom Lambda authorizer that supports both Cognito JWT tokens and mock development tokens
 * Supports both API Gateway V1 (REST API) and V2 (HTTP API) event formats
 */
export async function handler(event: any): Promise<any> {
  const ENABLE_MOCK_AUTH = process.env.ENABLE_MOCK_AUTH === 'true';
  
  console.log('Authorizer invoked:', {
    eventType: event.type || event.version,
    headers: event.headers ? Object.keys(event.headers) : 'none',
    identitySource: event.identitySource,
    mockAuthEnabled: ENABLE_MOCK_AUTH,
  });

  try {
    // Extract token from different event formats
    let token: string | undefined;
    let methodArn: string;
    
    // API Gateway V2 (HTTP API) format
    if (event.identitySource && Array.isArray(event.identitySource)) {
      token = event.identitySource[0];
      methodArn = event.routeArn;
    }
    // API Gateway V1 (REST API) format
    else if (event.authorizationToken) {
      token = event.authorizationToken;
      methodArn = event.methodArn;
    }
    // Fallback: check headers
    else if (event.headers && event.headers.authorization) {
      token = event.headers.authorization;
      methodArn = event.requestContext?.routeArn || event.methodArn || '*';
    }
    else {
      console.error('No authorization token found in event');
      throw new Error('Unauthorized');
    }

    if (!token) {
      console.error('No authorization token provided');
      throw new Error('Unauthorized');
    }

    console.log('Token found:', token.substring(0, 30) + '...');

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    // Check if this is a mock development token
    if (ENABLE_MOCK_AUTH && cleanToken.startsWith('mock-dev-token-')) {
      console.log('Mock development token detected - allowing access');
      return generatePolicy('mock-user', 'Allow', methodArn, {
        userId: 'mock-user',
        email: 'dev@example.com',
        authType: 'mock',
      });
    }

    // Verify Cognito JWT token
    try {
      const cognitoVerifier = getVerifier();
      const payload = await cognitoVerifier.verify(cleanToken);
      console.log('Cognito JWT verified successfully:', {
        sub: payload.sub,
        username: payload.username,
      });

      return generatePolicy(payload.sub, 'Allow', methodArn, {
        userId: payload.sub,
        username: payload.username || payload['cognito:username'],
        email: payload.email,
        authType: 'cognito',
      });
    } catch (verifyError: any) {
      console.error('Cognito JWT verification failed:', verifyError.message);
      
      // If mock auth is enabled and Cognito verification fails, provide helpful error
      if (ENABLE_MOCK_AUTH) {
        console.log('Cognito verification failed but mock auth is enabled. Use mock-dev-token-* for development.');
      }
      
      throw new Error('Unauthorized');
    }
  } catch (error: any) {
    console.error('Authorization error:', error.message);
    throw new Error('Unauthorized');
  }
}

/**
 * Generate IAM policy for API Gateway
 * Returns simple response format for HTTP API (API Gateway V2)
 */
function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, any>
): any {
  // Simple response format for HTTP API Lambda authorizers
  const response: any = {
    isAuthorized: effect === 'Allow',
    context: context || {},
  };

  return response;
}
