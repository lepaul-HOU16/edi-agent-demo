import { Handler } from 'aws-lambda';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Test Lambda function to verify Cognito User Pool import
 * 
 * This function attempts to describe the User Pool to verify:
 * 1. The User Pool ID is correct
 * 2. The Lambda has permission to access it
 * 3. The User Pool exists and is accessible
 */
export const handler: Handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const userPoolId = process.env.USER_POOL_ID;
  
  if (!userPoolId) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'USER_POOL_ID environment variable not set',
      }),
    };
  }

  try {
    const client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new DescribeUserPoolCommand({
      UserPoolId: userPoolId,
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully accessed Cognito User Pool',
        userPool: {
          id: response.UserPool?.Id,
          name: response.UserPool?.Name,
          arn: response.UserPool?.Arn,
          status: response.UserPool?.Status,
          creationDate: response.UserPool?.CreationDate,
          lastModifiedDate: response.UserPool?.LastModifiedDate,
        },
      }, null, 2),
    };
  } catch (error) {
    console.error('Error accessing User Pool:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to access User Pool',
        message: error instanceof Error ? error.message : 'Unknown error',
        userPoolId,
      }),
    };
  }
};
