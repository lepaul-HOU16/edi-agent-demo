import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';

export interface DiagnosticResult {
  step: string;
  success: boolean;
  details: any;
  error?: string;
  duration?: number;
  timestamp: number;
  recommendations?: string[];
}

export class OrchestratorDiagnostics {
  private lambdaClient: LambdaClient;
  private orchestratorFunctionName: string | undefined;

  constructor(region?: string) {
    this.lambdaClient = new LambdaClient({ region: region || process.env.AWS_REGION || 'us-east-1' });
    this.orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  }

  /**
   * Check if orchestrator Lambda exists and is accessible
   */
  async checkOrchestratorExists(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    const step = 'Check Orchestrator Exists';

    try {
      if (!this.orchestratorFunctionName) {
        return {
          step,
          success: false,
          details: { functionName: undefined },
          error: 'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is not set',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          recommendations: [
            'Set RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable',
            'Deploy the renewable orchestrator Lambda function',
            'Run: npx ampx sandbox to deploy all Lambda functions'
          ]
        };
      }

      const command = new GetFunctionCommand({
        FunctionName: this.orchestratorFunctionName
      });

      const response = await this.lambdaClient.send(command);

      return {
        step,
        success: true,
        details: {
          functionName: this.orchestratorFunctionName,
          functionArn: response.Configuration?.FunctionArn,
          runtime: response.Configuration?.Runtime,
          state: response.Configuration?.State,
          lastModified: response.Configuration?.LastModified
        },
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    } catch (error: any) {
      const recommendations: string[] = [];
      
      if (error.name === 'ResourceNotFoundException') {
        recommendations.push(
          'The orchestrator Lambda function does not exist',
          'Deploy the function using: npx ampx sandbox',
          'Verify the function name in your backend configuration'
        );
      } else if (error.name === 'AccessDeniedException') {
        recommendations.push(
          'IAM permissions are missing for Lambda:GetFunction',
          'Add lambda:GetFunction permission to the execution role',
          'Check IAM policies in amplify/backend.ts'
        );
      } else {
        recommendations.push(
          'Check AWS credentials are configured correctly',
          'Verify network connectivity to AWS',
          'Check CloudWatch logs for more details'
        );
      }

      return {
        step,
        success: false,
        details: {
          functionName: this.orchestratorFunctionName,
          errorName: error.name,
          errorMessage: error.message
        },
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        recommendations
      };
    }
  }

  /**
   * Test orchestrator invocation with health check query
   */
  async testOrchestratorInvocation(query: string = '__health_check__'): Promise<DiagnosticResult> {
    const startTime = Date.now();
    const step = 'Test Orchestrator Invocation';

    try {
      if (!this.orchestratorFunctionName) {
        return {
          step,
          success: false,
          details: { query },
          error: 'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is not set',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          recommendations: [
            'Set RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable',
            'Deploy the renewable orchestrator Lambda function'
          ]
        };
      }

      const payload = {
        query,
        conversationHistory: []
      };

      const command = new InvokeCommand({
        FunctionName: this.orchestratorFunctionName,
        Payload: JSON.stringify(payload)
      });

      const response = await this.lambdaClient.send(command);

      if (response.FunctionError) {
        return {
          step,
          success: false,
          details: {
            functionName: this.orchestratorFunctionName,
            query,
            statusCode: response.StatusCode,
            functionError: response.FunctionError,
            payload: response.Payload ? JSON.parse(Buffer.from(response.Payload).toString()) : null
          },
          error: `Function returned error: ${response.FunctionError}`,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          recommendations: [
            'Check orchestrator Lambda logs in CloudWatch',
            'Verify orchestrator handler code is correct',
            'Check for runtime errors or missing dependencies'
          ]
        };
      }

      const responsePayload = response.Payload ? JSON.parse(Buffer.from(response.Payload).toString()) : null;

      return {
        step,
        success: true,
        details: {
          functionName: this.orchestratorFunctionName,
          query,
          statusCode: response.StatusCode,
          response: responsePayload
        },
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    } catch (error: any) {
      const recommendations: string[] = [];
      
      if (error.name === 'ResourceNotFoundException') {
        recommendations.push(
          'The orchestrator Lambda function does not exist',
          'Deploy the function using: npx ampx sandbox'
        );
      } else if (error.name === 'AccessDeniedException') {
        recommendations.push(
          'IAM permissions are missing for Lambda:InvokeFunction',
          'Add lambda:InvokeFunction permission to the execution role'
        );
      } else if (error.name === 'TooManyRequestsException') {
        recommendations.push(
          'Lambda throttling limit reached',
          'Wait a moment and try again',
          'Consider increasing Lambda concurrency limits'
        );
      } else {
        recommendations.push(
          'Check CloudWatch logs for detailed error information',
          'Verify orchestrator function is deployed correctly',
          'Check network connectivity to AWS'
        );
      }

      return {
        step,
        success: false,
        details: {
          functionName: this.orchestratorFunctionName,
          query,
          errorName: error.name,
          errorMessage: error.message
        },
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        recommendations
      };
    }
  }

  /**
   * Check environment variables are set correctly
   */
  checkEnvironmentVariables(): DiagnosticResult {
    const startTime = Date.now();
    const step = 'Check Environment Variables';

    const requiredVars = {
      RENEWABLE_ORCHESTRATOR_FUNCTION_NAME: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
      RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
      RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME,
      RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
      RENEWABLE_REPORT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME,
      AWS_REGION: process.env.AWS_REGION
    };

    const missingVars: string[] = [];
    const setVars: Record<string, string> = {};

    Object.entries(requiredVars).forEach(([key, value]) => {
      if (!value) {
        missingVars.push(key);
      } else {
        setVars[key] = value;
      }
    });

    const success = missingVars.length === 0;

    const recommendations: string[] = [];
    if (!success) {
      recommendations.push(
        'Set missing environment variables in amplify/backend.ts',
        'Ensure all renewable Lambda functions are deployed',
        'Run: npx ampx sandbox to deploy with correct environment variables'
      );
      
      if (missingVars.includes('RENEWABLE_ORCHESTRATOR_FUNCTION_NAME')) {
        recommendations.push('CRITICAL: Orchestrator function name must be set for renewable features to work');
      }
    }

    return {
      step,
      success,
      details: {
        setVariables: setVars,
        missingVariables: missingVars,
        totalRequired: Object.keys(requiredVars).length,
        totalSet: Object.keys(setVars).length
      },
      error: success ? undefined : `Missing ${missingVars.length} required environment variable(s)`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
      recommendations: success ? undefined : recommendations
    };
  }

  /**
   * Run full diagnostic suite
   */
  async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Step 1: Check environment variables
    const envCheck = this.checkEnvironmentVariables();
    results.push(envCheck);

    // Step 2: Check orchestrator exists (only if env vars are set)
    if (envCheck.success || this.orchestratorFunctionName) {
      const existsCheck = await this.checkOrchestratorExists();
      results.push(existsCheck);

      // Step 3: Test invocation (only if orchestrator exists)
      if (existsCheck.success) {
        const invocationCheck = await this.testOrchestratorInvocation();
        results.push(invocationCheck);
      }
    }

    return results;
  }
}
