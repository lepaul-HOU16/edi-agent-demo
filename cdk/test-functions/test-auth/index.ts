import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';

/**
 * Test Lambda function to verify Cognito authorizer
 * 
 * This function returns the authenticated user's information
 * from the JWT token validated by the Cognito authorizer.
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  console.log('Test auth function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Extract user information from the authorizer context
    // TypeScript doesn't have the full type definition, so we use 'any'
    const authorizer = (event.requestContext as any).authorizer;
    const jwt = authorizer?.jwt;

    if (!jwt) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'No JWT token found in request context',
          requestContext: event.requestContext,
        }),
      };
    }

    // Return authenticated user information
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Authentication successful',
        user: {
          sub: jwt.claims.sub,
          email: jwt.claims.email,
          username: jwt.claims['cognito:username'],
          groups: jwt.claims['cognito:groups'] || [],
        },
        jwt: {
          issuer: jwt.claims.iss,
          audience: jwt.claims.aud,
          expiresAt: jwt.claims.exp,
          issuedAt: jwt.claims.iat,
        },
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
