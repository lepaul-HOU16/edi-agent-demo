"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const aws_jwt_verify_1 = require("aws-jwt-verify");
// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const ENABLE_MOCK_AUTH = process.env.ENABLE_MOCK_AUTH === 'true';
// Create Cognito JWT verifier
const verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: 'access',
    clientId: USER_POOL_CLIENT_ID,
});
/**
 * Custom Lambda authorizer that supports both Cognito JWT tokens and mock development tokens
 */
async function handler(event) {
    console.log('Authorizer invoked:', {
        methodArn: event.methodArn,
        tokenPrefix: event.authorizationToken?.substring(0, 20) + '...',
        mockAuthEnabled: ENABLE_MOCK_AUTH,
    });
    try {
        const token = event.authorizationToken;
        if (!token) {
            console.error('No authorization token provided');
            throw new Error('Unauthorized');
        }
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        // Check if this is a mock development token
        if (ENABLE_MOCK_AUTH && cleanToken.startsWith('mock-dev-token-')) {
            console.log('Mock development token detected - allowing access');
            return generatePolicy('mock-user', 'Allow', event.methodArn, {
                userId: 'mock-user',
                email: 'dev@example.com',
                authType: 'mock',
            });
        }
        // Verify Cognito JWT token
        try {
            const payload = await verifier.verify(cleanToken);
            console.log('Cognito JWT verified successfully:', {
                sub: payload.sub,
                username: payload.username,
            });
            return generatePolicy(payload.sub, 'Allow', event.methodArn, {
                userId: payload.sub,
                username: payload.username || payload['cognito:username'],
                email: payload.email,
                authType: 'cognito',
            });
        }
        catch (verifyError) {
            console.error('Cognito JWT verification failed:', verifyError.message);
            // If mock auth is enabled and Cognito verification fails, provide helpful error
            if (ENABLE_MOCK_AUTH) {
                console.log('Cognito verification failed but mock auth is enabled. Use mock-dev-token-* for development.');
            }
            throw new Error('Unauthorized');
        }
    }
    catch (error) {
        console.error('Authorization error:', error.message);
        throw new Error('Unauthorized');
    }
}
/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(principalId, effect, resource, context) {
    const authResponse = {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };
    // Add context if provided
    if (context) {
        authResponse.context = context;
    }
    return authResponse;
}
