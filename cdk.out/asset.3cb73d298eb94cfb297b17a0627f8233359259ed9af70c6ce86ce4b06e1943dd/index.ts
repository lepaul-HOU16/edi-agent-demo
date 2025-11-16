import { Handler } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

/**
 * Test Lambda function to verify DynamoDB table imports
 * 
 * This function:
 * 1. Verifies all table names are correct
 * 2. Checks Lambda has permission to access tables
 * 3. Retrieves basic table information
 * 4. Counts items in each table
 */
export const handler: Handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const tables = {
    chatMessage: process.env.CHAT_MESSAGE_TABLE,
    chatSession: process.env.CHAT_SESSION_TABLE,
    project: process.env.PROJECT_TABLE,
    agentProgress: process.env.AGENT_PROGRESS_TABLE,
    sessionContext: process.env.SESSION_CONTEXT_TABLE,
  };

  // Verify all environment variables are set
  const missingTables = Object.entries(tables)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingTables.length > 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing table environment variables',
        missingTables,
      }),
    };
  }

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const results: any = {};

  try {
    // Check each table
    for (const [key, tableName] of Object.entries(tables)) {
      if (!tableName) continue;

      try {
        // Describe table
        const describeCommand = new DescribeTableCommand({
          TableName: tableName,
        });
        const describeResponse = await client.send(describeCommand);

        // Get item count (using scan with limit for efficiency)
        const scanCommand = new ScanCommand({
          TableName: tableName,
          Select: 'COUNT',
          Limit: 1,
        });
        const scanResponse = await client.send(scanCommand);

        results[key] = {
          tableName,
          status: describeResponse.Table?.TableStatus,
          itemCount: describeResponse.Table?.ItemCount || 0,
          sizeBytes: describeResponse.Table?.TableSizeBytes || 0,
          creationDate: describeResponse.Table?.CreationDateTime,
          accessible: true,
        };
      } catch (error) {
        results[key] = {
          tableName,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const allAccessible = Object.values(results).every((r: any) => r.accessible);

    return {
      statusCode: allAccessible ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: allAccessible,
        message: allAccessible 
          ? 'Successfully accessed all DynamoDB tables'
          : 'Some tables are not accessible',
        tables: results,
      }, null, 2),
    };
  } catch (error) {
    console.error('Error accessing tables:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to access DynamoDB tables',
        message: error instanceof Error ? error.message : 'Unknown error',
        tables: results,
      }),
    };
  }
};
