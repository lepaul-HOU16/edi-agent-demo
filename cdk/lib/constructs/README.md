# CDK Constructs

Reusable CDK constructs for the Energy Data Insights infrastructure.

## LambdaFunction

A reusable construct for creating Lambda functions with sensible defaults and helper methods.

### Features

- **Consistent Configuration**: Default settings for runtime, memory, timeout
- **CloudWatch Logs**: Automatic log group creation with retention
- **Helper Methods**: Easy permission management for DynamoDB, S3, Lambda
- **Environment Variables**: Simple methods to add configuration
- **TypeScript & Python**: Support for both runtimes

### Basic Usage

```typescript
import { LambdaFunction } from './constructs/lambda-function';

// Create a Lambda function
const projectsFunction = new LambdaFunction(this, 'ProjectsFunction', {
  functionName: 'projects',
  description: 'Handles project management operations',
  codePath: 'projects', // Points to cdk/dist/lambda-functions/projects/
  environment: {
    TABLE_NAME: projectTable.tableName,
    BUCKET_NAME: storageBucket.bucketName,
  },
});

// Grant permissions
projectsFunction.grantDynamoDBReadWrite(projectTable.tableArn);
projectsFunction.grantS3ReadWrite(storageBucket.bucketArn);
```

### Configuration Options

```typescript
interface LambdaFunctionProps {
  functionName: string;           // Required: Function name
  codePath: string;               // Required: Path to built code
  description?: string;           // Optional: Function description
  handler?: string;               // Optional: Handler name (default: 'index.handler')
  runtime?: lambda.Runtime;       // Optional: Runtime (default: Node.js 20)
  memorySize?: number;            // Optional: Memory in MB (default: 512)
  timeout?: number;               // Optional: Timeout in seconds (default: 300)
  environment?: Record<string, string>; // Optional: Environment variables
  logRetention?: logs.RetentionDays;   // Optional: Log retention (default: 7 days)
  enableTracing?: boolean;        // Optional: X-Ray tracing (default: false)
}
```

### Helper Methods

#### Environment Variables

```typescript
// Add single environment variable
projectsFunction.addEnvironment('API_KEY', 'secret-key');

// Add multiple environment variables
projectsFunction.addEnvironmentVariables({
  API_KEY: 'secret-key',
  REGION: 'us-east-1',
  DEBUG: 'true',
});
```

#### DynamoDB Permissions

```typescript
// Grant read-only access
projectsFunction.grantDynamoDBRead(table.tableArn);

// Grant read/write access
projectsFunction.grantDynamoDBReadWrite(table.tableArn);
```

#### S3 Permissions

```typescript
// Grant read-only access
projectsFunction.grantS3Read(bucket.bucketArn);

// Grant read/write access
projectsFunction.grantS3ReadWrite(bucket.bucketArn);
```

#### Lambda Invocation

```typescript
// Grant permission to invoke another Lambda
orchestratorFunction.grantLambdaInvoke(toolFunction.functionArn);
```

#### Custom Permissions

```typescript
// Add custom IAM policy
projectsFunction.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['*'],
  })
);
```

### Python Lambda Functions

For Python Lambda functions, use the `PythonLambdaFunction` construct:

```typescript
import { PythonLambdaFunction } from './constructs/lambda-function';

const pythonFunction = new PythonLambdaFunction(this, 'PythonFunction', {
  functionName: 'renewable-tools',
  description: 'Python tools for renewable energy analysis',
  codePath: '../amplify/functions/renewableTools', // Path to Python code
  handler: 'handler.handler',
  pythonRuntime: lambda.Runtime.PYTHON_3_12,
  memorySize: 1024,
  timeout: 600,
  environment: {
    NREL_API_KEY: process.env.NREL_API_KEY || 'DEMO_KEY',
  },
});

// Same helper methods available
pythonFunction.grantS3ReadWrite(bucket.bucketArn);
```

### Complete Example

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { LambdaFunction } from './constructs/lambda-function';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing resources
    const projectTable = dynamodb.Table.fromTableName(
      this,
      'ProjectTable',
      'Project-abc123-NONE'
    );

    const storageBucket = s3.Bucket.fromBucketName(
      this,
      'StorageBucket',
      'my-storage-bucket'
    );

    // Create Lambda function
    const projectsFunction = new LambdaFunction(this, 'ProjectsFunction', {
      functionName: 'projects',
      description: 'Handles project CRUD operations',
      codePath: 'projects',
      memorySize: 512,
      timeout: 30,
      environment: {
        PROJECT_TABLE: projectTable.tableName,
        STORAGE_BUCKET: storageBucket.bucketName,
        AWS_REGION: this.region,
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions
    projectsFunction.grantDynamoDBReadWrite(projectTable.tableArn);
    projectsFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Output function ARN
    new cdk.CfnOutput(this, 'ProjectsFunctionArn', {
      value: projectsFunction.functionArn,
      description: 'ARN of projects Lambda function',
    });
  }
}
```

### Integration with API Gateway

```typescript
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

// Create Lambda function
const projectsFunction = new LambdaFunction(this, 'ProjectsFunction', {
  functionName: 'projects',
  codePath: 'projects',
});

// Add API Gateway route
httpApi.addRoutes({
  path: '/api/projects/delete',
  methods: [apigatewayv2.HttpMethod.POST],
  integration: new apigatewayv2_integrations.HttpLambdaIntegration(
    'DeleteProjectIntegration',
    projectsFunction.function // Access underlying Lambda function
  ),
  authorizer: cognitoAuthorizer,
});
```

### Accessing Underlying Resources

```typescript
const myFunction = new LambdaFunction(this, 'MyFunction', {
  functionName: 'my-function',
  codePath: 'my-function',
});

// Access underlying Lambda function
const lambdaFunction = myFunction.function;

// Access CloudWatch log group
const logGroup = myFunction.logGroup;

// Get function ARN
const arn = myFunction.functionArn;

// Get function name
const name = myFunction.functionName;
```

### Best Practices

1. **Use Descriptive Names**: Function names should clearly indicate their purpose
2. **Set Appropriate Timeouts**: Don't use default 3 seconds, set based on expected execution time
3. **Grant Minimal Permissions**: Only grant permissions the function actually needs
4. **Use Environment Variables**: Don't hardcode configuration in code
5. **Enable Logging**: Keep default 7-day retention for development, adjust for production
6. **Monitor Memory Usage**: Start with 512MB, adjust based on CloudWatch metrics
7. **Consider Cold Starts**: Minimize dependencies to reduce cold start time

### Troubleshooting

#### Error: Code path not found
**Problem**: `codePath` points to non-existent directory  
**Solution**: Ensure Lambda function is built with `npm run build:lambdas`

#### Error: Permission denied
**Problem**: Lambda doesn't have required IAM permissions  
**Solution**: Use helper methods to grant permissions or add custom policy

#### Error: Timeout
**Problem**: Function execution exceeds timeout  
**Solution**: Increase `timeout` in props (max 900 seconds)

#### Error: Out of memory
**Problem**: Function uses more memory than allocated  
**Solution**: Increase `memorySize` in props (max 10,240 MB)

### Migration from Amplify

When migrating from Amplify `defineFunction`:

**Amplify (Before)**:
```typescript
export const myFunction = defineFunction({
  name: 'myFunction',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
});
```

**CDK (After)**:
```typescript
const myFunction = new LambdaFunction(this, 'MyFunction', {
  functionName: 'my-function',
  codePath: 'my-function',
  timeout: 300,
  memorySize: 512,
});
```

### Testing

Test Lambda functions locally using AWS SAM:

```bash
# Invoke function locally
sam local invoke EnergyInsights-development-projects \
  -e events/delete-project.json

# Start local API
sam local start-api
```

### Monitoring

Monitor Lambda functions in CloudWatch:

```bash
# View logs
aws logs tail /aws/lambda/EnergyInsights-development-projects --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=EnergyInsights-development-projects \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Future Constructs

Additional constructs to be added:

- **ApiRoute**: Reusable construct for API Gateway routes
- **DynamoDBTable**: Reusable construct for DynamoDB tables
- **S3Bucket**: Reusable construct for S3 buckets with CORS
- **CloudFrontDistribution**: Reusable construct for CloudFront

