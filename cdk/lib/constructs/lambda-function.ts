import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

/**
 * Props for creating a Lambda function
 */
export interface LambdaFunctionProps {
  /**
   * Function name (will be prefixed with stack name)
   */
  functionName: string;

  /**
   * Description of the function
   */
  description?: string;

  /**
   * Path to the function code (relative to cdk/dist/lambda-functions/)
   * @example 'projects' for cdk/dist/lambda-functions/projects/
   */
  codePath: string;

  /**
   * Handler name (default: 'index.handler')
   */
  handler?: string;

  /**
   * Runtime (default: Node.js 20)
   */
  runtime?: lambda.Runtime;

  /**
   * Memory size in MB (default: 512)
   */
  memorySize?: number;

  /**
   * Timeout in seconds (default: 300)
   */
  timeout?: number;

  /**
   * Environment variables
   */
  environment?: Record<string, string>;

  /**
   * Log retention in days (default: 7 days)
   */
  logRetention?: logs.RetentionDays;

  /**
   * Enable X-Ray tracing (default: false)
   */
  enableTracing?: boolean;
}

/**
 * Reusable Lambda function construct with sensible defaults
 * 
 * This construct creates a Lambda function with:
 * - Consistent naming
 * - CloudWatch log group with retention
 * - Helper methods for permissions and environment variables
 * - Support for both TypeScript and Python runtimes
 */
export class LambdaFunction extends Construct {
  public readonly function: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const stackName = cdk.Stack.of(this).stackName;

    // Create CloudWatch log group with retention
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${stackName}-${props.functionName}`,
      retention: props.logRetention || logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Determine code path
    const codePath = path.join(__dirname, '../../dist/lambda-functions', props.codePath);

    // Create Lambda function
    this.function = new lambda.Function(this, 'Function', {
      functionName: `${stackName}-${props.functionName}`,
      description: props.description || `Lambda function for ${props.functionName}`,
      runtime: props.runtime || lambda.Runtime.NODEJS_20_X,
      handler: props.handler || 'index.handler',
      code: lambda.Code.fromAsset(codePath),
      memorySize: props.memorySize || 512,
      timeout: cdk.Duration.seconds(props.timeout || 300),
      environment: props.environment || {},
      logGroup: this.logGroup,
      tracing: props.enableTracing ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
    });
  }

  /**
   * Add environment variable to the function
   */
  addEnvironment(key: string, value: string): void {
    this.function.addEnvironment(key, value);
  }

  /**
   * Add multiple environment variables
   */
  addEnvironmentVariables(variables: Record<string, string>): void {
    Object.entries(variables).forEach(([key, value]) => {
      this.function.addEnvironment(key, value);
    });
  }

  /**
   * Grant read access to a DynamoDB table
   */
  grantDynamoDBRead(tableArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchGetItem',
        ],
        resources: [tableArn, `${tableArn}/index/*`],
      })
    );
  }

  /**
   * Grant read/write access to a DynamoDB table
   */
  grantDynamoDBReadWrite(tableArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchGetItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [tableArn, `${tableArn}/index/*`],
      })
    );
  }

  /**
   * Grant read access to an S3 bucket
   */
  grantS3Read(bucketArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [bucketArn, `${bucketArn}/*`],
      })
    );
  }

  /**
   * Grant read/write access to an S3 bucket
   */
  grantS3ReadWrite(bucketArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [bucketArn, `${bucketArn}/*`],
      })
    );
  }

  /**
   * Grant permission to invoke another Lambda function
   */
  grantLambdaInvoke(functionArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [functionArn],
      })
    );
  }

  /**
   * Add custom IAM policy statement
   */
  addToRolePolicy(statement: iam.PolicyStatement): void {
    this.function.addToRolePolicy(statement);
  }

  /**
   * Get the function ARN
   */
  get functionArn(): string {
    return this.function.functionArn;
  }

  /**
   * Get the function name
   */
  get functionName(): string {
    return this.function.functionName;
  }
}

/**
 * Props for creating a Python Lambda function
 */
export interface PythonLambdaFunctionProps extends Omit<LambdaFunctionProps, 'runtime'> {
  /**
   * Python runtime version (default: Python 3.12)
   */
  pythonRuntime?: lambda.Runtime;

  /**
   * Path to requirements.txt (optional)
   * If provided, dependencies will be bundled
   */
  requirementsPath?: string;
}

/**
 * Python Lambda function construct
 * 
 * This construct creates a Python Lambda function with:
 * - Python 3.12 runtime by default
 * - Support for requirements.txt dependencies
 * - Same helper methods as TypeScript functions
 */
export class PythonLambdaFunction extends Construct {
  public readonly function: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: PythonLambdaFunctionProps) {
    super(scope, id);

    const stackName = cdk.Stack.of(this).stackName;

    // Create CloudWatch log group with retention
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${stackName}-${props.functionName}`,
      retention: props.logRetention || logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Determine code path
    const codePath = path.join(__dirname, '../../lambda-functions', props.codePath);

    // Create Lambda function
    this.function = new lambda.Function(this, 'Function', {
      functionName: `${stackName}-${props.functionName}`,
      description: props.description || `Python Lambda function for ${props.functionName}`,
      runtime: props.pythonRuntime || lambda.Runtime.PYTHON_3_12,
      handler: props.handler || 'handler.handler',
      code: lambda.Code.fromAsset(codePath),
      memorySize: props.memorySize || 512,
      timeout: cdk.Duration.seconds(props.timeout || 300),
      environment: props.environment || {},
      logGroup: this.logGroup,
      tracing: props.enableTracing ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
    });
  }

  /**
   * Add environment variable to the function
   */
  addEnvironment(key: string, value: string): void {
    this.function.addEnvironment(key, value);
  }

  /**
   * Add multiple environment variables
   */
  addEnvironmentVariables(variables: Record<string, string>): void {
    Object.entries(variables).forEach(([key, value]) => {
      this.function.addEnvironment(key, value);
    });
  }

  /**
   * Grant read access to a DynamoDB table
   */
  grantDynamoDBRead(tableArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchGetItem',
        ],
        resources: [tableArn, `${tableArn}/index/*`],
      })
    );
  }

  /**
   * Grant read/write access to a DynamoDB table
   */
  grantDynamoDBReadWrite(tableArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchGetItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [tableArn, `${tableArn}/index/*`],
      })
    );
  }

  /**
   * Grant read access to an S3 bucket
   */
  grantS3Read(bucketArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [bucketArn, `${bucketArn}/*`],
      })
    );
  }

  /**
   * Grant read/write access to an S3 bucket
   */
  grantS3ReadWrite(bucketArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [bucketArn, `${bucketArn}/*`],
      })
    );
  }

  /**
   * Grant permission to invoke another Lambda function
   */
  grantLambdaInvoke(functionArn: string): void {
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [functionArn],
      })
    );
  }

  /**
   * Add custom IAM policy statement
   */
  addToRolePolicy(statement: iam.PolicyStatement): void {
    this.function.addToRolePolicy(statement);
  }

  /**
   * Get the function ARN
   */
  get functionArn(): string {
    return this.function.functionArn;
  }

  /**
   * Get the function name
   */
  get functionName(): string {
    return this.function.functionName;
  }
}
