import { Handler } from 'aws-lambda';
/**
 * Test Lambda function to verify DynamoDB table imports
 *
 * This function:
 * 1. Verifies all table names are correct
 * 2. Checks Lambda has permission to access tables
 * 3. Retrieves basic table information
 * 4. Counts items in each table
 */
export declare const handler: Handler;
