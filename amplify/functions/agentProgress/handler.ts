/**
 * Lambda handler for agent progress polling
 * Retrieves progress updates from DynamoDB for a given request ID
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const AGENT_PROGRESS_TABLE = process.env.AGENT_PROGRESS_TABLE || 'AgentProgress';

interface ProgressStep {
  type: string;
  step: string;
  message: string;
  elapsed: number;
  timestamp: number;
}

interface ProgressRecord {
  requestId: string;
  steps: ProgressStep[];
  status: 'in_progress' | 'complete' | 'error';
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export const handler = async (event: any) => {
  console.log('Agent progress query event:', JSON.stringify(event, null, 2));

  try {
    const requestId = event.arguments?.requestId;

    if (!requestId) {
      return {
        success: false,
        error: 'requestId is required',
        steps: [],
        status: 'error'
      };
    }

    // Query DynamoDB for progress record
    const command = new GetCommand({
      TableName: AGENT_PROGRESS_TABLE,
      Key: {
        requestId: requestId
      }
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      // No progress found - might be too old or invalid request ID
      return {
        success: false,
        error: 'Progress not found for this request ID',
        steps: [],
        status: 'error'
      };
    }

    const record = response.Item as ProgressRecord;

    return {
      success: true,
      requestId: record.requestId,
      steps: record.steps || [],
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

  } catch (error) {
    console.error('Error retrieving agent progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps: [],
      status: 'error'
    };
  }
};
