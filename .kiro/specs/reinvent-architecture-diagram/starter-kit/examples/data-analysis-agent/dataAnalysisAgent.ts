import { BaseEnhancedAgent } from '../../cdk/lambda-functions/chat/agents/BaseEnhancedAgent';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

interface DataAnalysisAgentResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
}

/**
 * Data Analysis Agent - Example implementation
 * 
 * Demonstrates:
 * - S3 data access
 * - Python tool Lambda for data processing
 * - Visualization generation
 * - Complex artifact handling
 */
export class DataAnalysisAgent extends BaseEnhancedAgent {
  private lambdaClient: LambdaClient;
  private s3Client: S3Client;

  constructor() {
    super(true); // Enable verbose logging
    this.lambdaClient = new LambdaClient({});
    this.s3Client = new S3Client({});
  }

  /**
   * Process data analysis queries
   */
  async processMessage(message: string, context?: any): Promise<DataAnalysisAgentResponse> {
    const thoughtSteps = [];

    try {
      // Step 1: Identify data source
      thoughtSteps.push(this.createThoughtStep(
        'intent_detection',
        'Identifying Data Source',
        'Determining which dataset to analyze'
      ));

      const dataSource = this.extractDataSource(message, context);
      
      if (!dataSource) {
        return {
          success: false,
          message: 'Could not identify data source. Please specify a file name or upload data.',
          thoughtSteps,
        };
      }

      thoughtSteps[0].status = 'complete';
      thoughtSteps[0].summary = `Data source: ${dataSource.name}`;

      // Step 2: Load data from S3
      thoughtSteps.push(this.createThoughtStep(
        'execution',
        'Loading Data',
        `Retrieving data from S3: ${dataSource.s3Key}`
      ));

      const data = await this.loadDataFromS3(dataSource.s3Key);

      thoughtSteps[1].status = 'complete';
      thoughtSteps[1].summary = `Loaded ${data.rowCount} rows, ${data.columnCount} columns`;

      // Step 3: Determine analysis type
      thoughtSteps.push(this.createThoughtStep(
        'parameter_extraction',
        'Determining Analysis Type',
        'Identifying requested analysis operations'
      ));

      const analysisType = this.determineAnalysisType(message);

      thoughtSteps[2].status = 'complete';
      thoughtSteps[2].summary = `Analysis type: ${analysisType}`;

      // Step 4: Perform analysis
      thoughtSteps.push(this.createThoughtStep(
        'execution',
        'Performing Analysis',
        `Running ${analysisType} analysis on dataset`
      ));

      const analysisResult = await this.invokeDataAnalysisTool({
        s3Key: dataSource.s3Key,
        analysisType,
        parameters: this.extractAnalysisParameters(message),
      });

      thoughtSteps[3].status = 'complete';
      thoughtSteps[3].summary = 'Analysis complete, visualizations generated';

      // Step 5: Format response
      thoughtSteps.push(this.createThoughtStep(
        'completion',
        'Generating Report',
        'Formatting analysis results and visualizations'
      ));

      const response = this.formatAnalysisResponse(dataSource, analysisType, analysisResult);
      const artifacts = this.createAnalysisArtifacts(analysisResult);

      thoughtSteps[4].status = 'complete';

      return {
        success: true,
        message: response,
        artifacts,
        thoughtSteps,
      };

    } catch (error: any) {
      console.error('Data analysis agent error:', error);
      
      return {
        success: false,
        message: `Analysis failed: ${error.message}`,
        thoughtSteps,
      };
    }
  }

  /**
   * Extract data source from query and context
   */
  private extractDataSource(message: string, context?: any): any | null {
    // Check for file name in message
    const fileMatch = message.match(/([a-zA-Z0-9_-]+\.csv)/i);
    if (fileMatch) {
      return {
        name: fileMatch[1],
        s3Key: `data/${fileMatch[1]}`,
      };
    }

    // Check context for uploaded files
    if (context?.uploadedFiles && context.uploadedFiles.length > 0) {
      const file = context.uploadedFiles[0];
      return {
        name: file.name,
        s3Key: file.s3Key,
      };
    }

    return null;
  }

  /**
   * Load data from S3
   */
  private async loadDataFromS3(s3Key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    const data = await response.Body?.transformToString();

    if (!data) {
      throw new Error('Failed to load data from S3');
    }

    // Parse CSV to get row/column count
    const lines = data.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    return {
      rowCount: lines.length - 1,
      columnCount: headers.length,
      headers,
      preview: lines.slice(0, 6), // First 5 rows + header
    };
  }

  /**
   * Determine analysis type from query
   */
  private determineAnalysisType(message: string): string {
    if (/summary|describe|statistics/i.test(message)) {
      return 'descriptive_statistics';
    }
    if (/trend|time series|over time/i.test(message)) {
      return 'trend_analysis';
    }
    if (/correlation|relationship/i.test(message)) {
      return 'correlation_analysis';
    }
    if (/distribution|histogram/i.test(message)) {
      return 'distribution_analysis';
    }
    return 'general_analysis';
  }

  /**
   * Extract analysis parameters
   */
  private extractAnalysisParameters(message: string): any {
    return {
      includeVisualizations: true,
      confidenceLevel: 0.95,
      maxCategories: 10,
    };
  }

  /**
   * Invoke data analysis tool Lambda
   */
  private async invokeDataAnalysisTool(params: any): Promise<any> {
    const command = new InvokeCommand({
      FunctionName: process.env.DATA_ANALYSIS_TOOL_FUNCTION_NAME,
      Payload: JSON.stringify(params),
    });

    const response = await this.lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode !== 200) {
      throw new Error('Data analysis tool invocation failed');
    }

    return JSON.parse(result.body);
  }

  /**
   * Format analysis response
   */
  private formatAnalysisResponse(dataSource: any, analysisType: string, result: any): string {
    return `
## Data Analysis Report: ${dataSource.name}

**Analysis Type:** ${analysisType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
**Dataset:** ${result.rowCount} rows × ${result.columnCount} columns

### Summary Statistics

${this.formatStatistics(result.statistics)}

### Key Findings

${result.insights.map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}

### Visualizations

${result.visualizations.length} chart(s) generated - see artifacts below.

---
*Analysis performed using pandas and matplotlib*
    `.trim();
  }

  /**
   * Format statistics table
   */
  private formatStatistics(stats: any): string {
    if (!stats) return 'No statistics available';

    return Object.entries(stats)
      .map(([column, values]: [string, any]) => {
        return `**${column}:**\n` +
          `- Mean: ${values.mean?.toFixed(2) || 'N/A'}\n` +
          `- Median: ${values.median?.toFixed(2) || 'N/A'}\n` +
          `- Std Dev: ${values.std?.toFixed(2) || 'N/A'}\n` +
          `- Min: ${values.min?.toFixed(2) || 'N/A'}\n` +
          `- Max: ${values.max?.toFixed(2) || 'N/A'}`;
      })
      .join('\n\n');
  }

  /**
   * Create analysis artifacts
   */
  private createAnalysisArtifacts(result: any): any[] {
    const artifacts = [];

    // Add visualizations
    for (const viz of result.visualizations || []) {
      artifacts.push({
        type: 'data_visualization',
        data: {
          messageContentType: 'data_visualization',
          title: viz.title,
          chartType: viz.type,
          s3Key: viz.s3Key,
          imageUrl: viz.url,
        },
      });
    }

    // Add data table
    if (result.dataTable) {
      artifacts.push({
        type: 'data_table',
        data: {
          messageContentType: 'data_table',
          headers: result.dataTable.headers,
          rows: result.dataTable.rows,
        },
      });
    }

    return artifacts;
  }

  /**
   * Create thought step helper
   */
  private createThoughtStep(type: string, title: string, summary: string): any {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      status: 'in_progress',
    };
  }
}

/**
 * Intent detection patterns for data analysis queries
 */
export const dataAnalysisPatterns = [
  /analyze.*data/i,
  /\.csv/i,
  /statistics/i,
  /trend/i,
  /correlation/i,
  /distribution/i,
  /visualize/i,
  /plot/i,
  /chart/i,
];

/**
 * Example usage:
 * 
 * const agent = new DataAnalysisAgent();
 * const result = await agent.processMessage("Analyze the sales data in sales-2024.csv");
 * console.log(result.message);
 */
