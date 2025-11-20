import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface MainStackProps extends cdk.StackProps {
  environment?: string;
  enableMonitoring?: boolean;
}

export class MainStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly api: apigateway.HttpApi;
  public readonly storageBucket: s3.Bucket;
  public readonly chatFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: MainStackProps) {
    super(scope, id, props);

    const env = props?.environment || 'dev';
    const enableMonitoring = props?.enableMonitoring ?? true;

    // ========================================
    // Cognito User Pool
    // ========================================
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${env}-agent-platform-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: `${env}-agent-platform-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // ========================================
    // DynamoDB Tables
    // ========================================
    const chatMessageTable = new dynamodb.Table(this, 'ChatMessageTable', {
      tableName: `ChatMessage-${env}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: env === 'prod',
    });

    chatMessageTable.addGlobalSecondaryIndex({
      indexName: 'chatSessionId-createdAt-index',
      partitionKey: { name: 'chatSessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const chatSessionTable = new dynamodb.Table(this, 'ChatSessionTable', {
      tableName: `ChatSession-${env}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: env === 'prod',
    });

    chatSessionTable.addGlobalSecondaryIndex({
      indexName: 'userId-lastMessageAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastMessageAt', type: dynamodb.AttributeType.STRING },
    });

    const sessionContextTable = new dynamodb.Table(this, 'SessionContextTable', {
      tableName: `SessionContext-${env}`,
      partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // S3 Storage Bucket
    // ========================================
    this.storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: `${env}-agent-platform-storage-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: env === 'prod',
      lifecycleRules: [
        {
          id: 'archive-old-artifacts',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: env !== 'prod',
    });

    // ========================================
    // Lambda Authorizer
    // ========================================
    const authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
      functionName: `${env}-agent-platform-authorizer`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/authorizer')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        CLIENT_ID: this.userPoolClient.userPoolClientId,
        REGION: this.region,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    authorizerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:DescribeUserPool', 'cognito-idp:DescribeUserPoolClient'],
        resources: [this.userPool.userPoolArn],
      })
    );

    // ========================================
    // Chat Lambda Function
    // ========================================
    this.chatFunction = new lambda.Function(this, 'ChatFunction', {
      functionName: `${env}-agent-platform-chat`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/chat')),
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
      environment: {
        CHAT_MESSAGE_TABLE: chatMessageTable.tableName,
        CHAT_SESSION_TABLE: chatSessionTable.tableName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName,
        STORAGE_BUCKET: this.storageBucket.bucketName,
        BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
        ENABLE_THOUGHT_STEPS: process.env.ENABLE_THOUGHT_STEPS || 'true',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions
    chatMessageTable.grantReadWriteData(this.chatFunction);
    chatSessionTable.grantReadWriteData(this.chatFunction);
    sessionContextTable.grantReadWriteData(this.chatFunction);
    this.storageBucket.grantReadWrite(this.chatFunction);

    this.chatFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'],
      })
    );

    // Allow self-invocation for async processing
    this.chatFunction.grantInvoke(this.chatFunction);

    // ========================================
    // Example Tool Lambda (Weather)
    // ========================================
    const weatherToolFunction = new lambda.Function(this, 'WeatherToolFunction', {
      functionName: `${env}-agent-platform-weather-tool`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/tools/weather-tool')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        STORAGE_BUCKET: this.storageBucket.bucketName,
        WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    this.storageBucket.grantReadWrite(weatherToolFunction);
    weatherToolFunction.grantInvoke(this.chatFunction);

    // Add environment variable to chat function
    this.chatFunction.addEnvironment('WEATHER_TOOL_FUNCTION_NAME', weatherToolFunction.functionName);

    // ========================================
    // API Gateway
    // ========================================
    this.api = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `${env}-agent-platform-api`,
      description: 'Agent Platform API',
      corsPreflight: {
        allowOrigins: ['*'], // Restrict in production
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const authorizer = new apigatewayAuthorizers.HttpLambdaAuthorizer(
      'LambdaAuthorizer',
      authorizerFunction,
      {
        authorizerName: `${env}-jwt-authorizer`,
        responseTypes: [apigatewayAuthorizers.HttpLambdaResponseType.SIMPLE],
        resultsCacheTtl: cdk.Duration.minutes(5),
      }
    );

    // Chat endpoint
    this.api.addRoutes({
      path: '/api/chat/message',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ChatIntegration',
        this.chatFunction
      ),
      authorizer,
    });

    // Get messages endpoint
    this.api.addRoutes({
      path: '/api/chat/sessions/{sessionId}/messages',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetMessagesIntegration',
        this.chatFunction
      ),
      authorizer,
    });

    // ========================================
    // CloudWatch Monitoring (Optional)
    // ========================================
    if (enableMonitoring) {
      // Lambda error alarms
      const chatErrorAlarm = this.chatFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }).createAlarm(this, 'ChatFunctionErrorAlarm', {
        threshold: 5,
        evaluationPeriods: 1,
        alarmDescription: 'Chat function error rate is too high',
      });

      // API Gateway 5xx errors
      const apiErrorMetric = this.api.metricServerError({
        period: cdk.Duration.minutes(5),
      });

      new cdk.aws_cloudwatch.Alarm(this, 'ApiErrorAlarm', {
        metric: apiErrorMetric,
        threshold: 10,
        evaluationPeriods: 1,
        alarmDescription: 'API Gateway 5xx error rate is too high',
      });
    }

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${env}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${env}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url!,
      description: 'API Gateway URL',
      exportName: `${env}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: this.storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
      exportName: `${env}-StorageBucketName`,
    });

    new cdk.CfnOutput(this, 'ChatFunctionName', {
      value: this.chatFunction.functionName,
      description: 'Chat Lambda Function Name',
      exportName: `${env}-ChatFunctionName`,
    });
  }
}
