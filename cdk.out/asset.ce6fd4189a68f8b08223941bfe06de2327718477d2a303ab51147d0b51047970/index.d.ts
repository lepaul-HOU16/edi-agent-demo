import { Handler } from 'aws-lambda';
/**
 * Test Lambda function to verify Cognito User Pool import
 *
 * This function attempts to describe the User Pool to verify:
 * 1. The User Pool ID is correct
 * 2. The Lambda has permission to access it
 * 3. The User Pool exists and is accessible
 */
export declare const handler: Handler;
