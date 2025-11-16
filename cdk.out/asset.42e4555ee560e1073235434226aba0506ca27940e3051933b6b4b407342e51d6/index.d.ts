import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
/**
 * Test Lambda function to verify Cognito authorizer
 *
 * This function returns the authenticated user's information
 * from the JWT token validated by the Cognito authorizer.
 */
export declare const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
