/**
 * Tool Lambda Template (TypeScript)
 * 
 * This template provides a starting point for creating TypeScript-based tool Lambdas.
 * Replace placeholders with your tool-specific implementation.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Handler, Context } from 'aws-lambda';

// AWS clients
const s3Client = new S3Client({});

// Environment variables
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || '';

interface ToolParameters {
  param1: string;
  param2: number;
  // Add your parameters here
}

interface ToolResult {
  success: boolean;
  message?: string;
  data?: any;
  artifacts?: Artifact[];
  error?: string;
}

interface Artifact {
  type: string;
  data: {
    messageContentType: string;
    title: string;
    s3Key?: string;
    bucket?: string;
    content?: any;
    metadata?: Record<string, any>;
  };
}

/**
 * YourTool - [Brief description of what this tool does]
 * 
 * This tool performs [specific functionality] and generates [output type].
 */
class YourTool {
  private bucketName: string;

  constructor() {
    this.bucketName = STORAGE_BUCKET;
  }

  /**
   * Main processing method
   */
  async process(parameters: ToolParameters): Promise<ToolResult> {
    try {
      console.log('[YourTool] Processing request:', JSON.stringify(parameters));

      // Step 1: Validate parameters
      const validation = this.validateParameters(parameters);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Step 2: Fetch required data
      const data = await this.fetchData(parameters);

      // Step 3: Perform computation
      const results = await this.compute(data, parameters);

      // Step 4: Generate visualization (if applicable)
      const visualization = await this.generateVisualization(results, parameters);

      // Step 5: Store artifacts in S3
      const artifacts = await this.storeArtifacts(visualization, results, parameters);

      // Step 6: Return response
      return {
        success: true,
        message: this.generateMessage(results),
        data: results,
        artifacts
      };

    } catch (error: any) {
      console.error('[YourTool] Error processing request:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate input parameters
   */
  private validateParameters(parameters: ToolParameters): { valid: boolean; error?: string } {
    // Add your validation logic here
    if (!parameters.param1) {
      return {
        valid: false,
        error: 'Missing required parameter: param1'
      };
    }

    if (typeof parameters.param2 !== 'number') {
      return {
        valid: false,
        error: 'param2 must be a number'
      };
    }

    // Add more validation as needed
    return { valid: true };
  }

  /**
   * Fetch required data from external sources
   */
  private async fetchData(parameters: ToolParameters): Promise<any> {
    console.log('[YourTool] Fetching data...');

    // Example: Fetch from S3
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `data/${parameters.param1}`
      });

      const response = await s3Client.send(command);
      const data = await response.Body?.transformToString();
      
      return data ? JSON.parse(data) : {};
    } catch (error: any) {
      console.error('[YourTool] Error fetching data:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  /**
   * Perform the main computation
   */
  private async compute(data: any, parameters: ToolParameters): Promise<any> {
    console.log('[YourTool] Performing computation...');

    // Implement your computation logic here
    // This is where the core functionality of your tool goes

    const results = {
      computedValue: 0,
      statistics: {},
      summary: ''
    };

    // Example computation:
    // results.computedValue = this.calculateSomething(data, parameters);
    // results.statistics = this.computeStatistics(data);
    // results.summary = this.generateSummary(results);

    return results;
  }

  /**
   * Generate visualization (HTML, JSON, etc.)
   */
  private async generateVisualization(
    results: any,
    parameters: ToolParameters
  ): Promise<string | null> {
    console.log('[YourTool] Generating visualization...');

    // Option 1: Generate HTML visualization
    // const html = this.createHtmlVisualization(results, parameters);
    // return html;

    // Option 2: Generate JSON for frontend rendering
    // const vizData = this.createVisualizationData(results, parameters);
    // return JSON.stringify(vizData);

    // Option 3: No visualization
    return null;
  }

  /**
   * Store artifacts in S3 and return artifact metadata
   */
  private async storeArtifacts(
    visualization: string | null,
    results: any,
    parameters: ToolParameters
  ): Promise<Artifact[]> {
    const artifacts: Artifact[] = [];

    if (!this.bucketName) {
      console.warn('[YourTool] No storage bucket configured, skipping artifact storage');
      return artifacts;
    }

    try {
      // Generate unique artifact ID
      const artifactId = this.generateArtifactId(parameters);

      // Store visualization
      if (visualization) {
        const vizKey = `artifacts/${artifactId}/visualization.html`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: vizKey,
          Body: visualization,
          ContentType: 'text/html'
        }));

        artifacts.push({
          type: 'your_artifact_type',
          data: {
            messageContentType: 'your_artifact_type',
            title: 'Analysis Results',
            s3Key: vizKey,
            bucket: this.bucketName,
            metadata: {
              parameters,
              timestamp: new Date().toISOString()
            }
          }
        });
      }

      // Store results JSON
      const resultsKey = `artifacts/${artifactId}/results.json`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: resultsKey,
        Body: JSON.stringify(results, null, 2),
        ContentType: 'application/json'
      }));

      console.log(`[YourTool] Stored artifacts with ID: ${artifactId}`);

    } catch (error: any) {
      console.error('[YourTool] Error storing artifacts:', error);
      // Don't fail the entire request if artifact storage fails
    }

    return artifacts;
  }

  /**
   * Generate human-readable response message
   */
  private generateMessage(results: any): string {
    // Create a natural language summary of the results
    return `Analysis completed successfully. ${results.summary || ''}`;
  }

  /**
   * Generate unique artifact ID
   */
  private generateArtifactId(parameters: ToolParameters): string {
    const crypto = require('crypto');
    const paramStr = JSON.stringify(parameters);
    const timestamp = Date.now().toString();
    const combined = `${paramStr}_${timestamp}`;
    
    return crypto.createHash('md5').update(combined).digest('hex');
  }
}

/**
 * Lambda handler function
 */
export const handler: Handler = async (event: any, context: Context): Promise<any> => {
  console.log('[Handler] Received event:', JSON.stringify(event));

  try {
    // Extract parameters from event
    // Handle different event formats (direct invoke, API Gateway, etc.)
    let parameters: ToolParameters;

    if (typeof event === 'string') {
      parameters = JSON.parse(event);
    } else if (event.body) {
      parameters = JSON.parse(event.body);
    } else {
      parameters = event;
    }

    // Create tool instance and process
    const tool = new YourTool();
    const result = await tool.process(parameters);

    // Return response
    return {
      statusCode: result.success ? 200 : 400,
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error: any) {
    console.error('[Handler] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

/**
 * Example usage for local testing
 */
if (require.main === module) {
  const testEvent = {
    param1: 'test-value',
    param2: 42
  };

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  };

  handler(testEvent, mockContext, () => {})
    .then(response => {
      console.log('Response:', JSON.stringify(response, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
