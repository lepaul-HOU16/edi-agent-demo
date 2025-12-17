import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';

/**
 * Props for the Main Stack
 */
export interface MainStackProps extends cdk.StackProps {
  environment: 'development' | 'staging' | 'production';
  userPoolId?: string;
  userPoolClientId?: string;
  storageBucketName?: string;
}

/**
 * Main infrastructure stack for Energy Data Insights
 * 
 * This stack imports existing resources from Amplify and sets up
 * new infrastructure for the migration.
 */
export class MainStack extends cdk.Stack {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly httpApi: apigatewayv2.HttpApi;
  public readonly authorizer: apigatewayv2_authorizers.HttpLambdaAuthorizer;

  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    // ============================================================================
    // Import Existing Resources (Phase 1, Task 2)
    // ============================================================================

    // Import Cognito User Pool from Amplify (Task 2.1)
    const userPoolId = props.userPoolId || 'us-east-1_sC6yswGji';
    const userPoolClientId = props.userPoolClientId || '18m99t0u39vi9614ssd8sf8vmb';
    
    this.userPool = cognito.UserPool.fromUserPoolId(
      this,
      'UserPool',
      userPoolId
    );

    this.userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      'UserPoolClient',
      userPoolClientId
    );

    // Output Cognito details for verification
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${id}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${id}-UserPoolArn`,
    });

    // Import DynamoDB Tables from Amplify (Task 2.2)
    const tableHash = 'fhzj4la45fevdnax5s2o4hbuqy'; // Current Amplify deployment hash
    
    const chatMessageTable = dynamodb.Table.fromTableName(
      this,
      'ChatMessageTable',
      `ChatMessage-${tableHash}-NONE`
    );

    const chatSessionTable = dynamodb.Table.fromTableName(
      this,
      'ChatSessionTable',
      `ChatSession-${tableHash}-NONE`
    );

    const projectTable = dynamodb.Table.fromTableName(
      this,
      'ProjectTable',
      `Project-${tableHash}-NONE`
    );

    const agentProgressTable = dynamodb.Table.fromTableName(
      this,
      'AgentProgressTable',
      'AgentProgress'
    );

    const sessionContextTable = dynamodb.Table.fromTableName(
      this,
      'SessionContextTable',
      'RenewableSessionContext'
    );

    // ============================================================================
    // Sessions Table (NEW - Collection Data Inheritance)
    // ============================================================================

    // Create Sessions table for canvas-collection linking
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `Sessions-${props.environment}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.environment === 'production',
      timeToLiveAttribute: 'ttl', // Auto-cleanup after 90 days
    });

    // Add GSI for listing user sessions
    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'owner-createdAt-index',
      partitionKey: {
        name: 'owner',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output Sessions table details
    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      description: 'Sessions DynamoDB table name',
      exportName: `${id}-SessionsTable`,
    });

    new cdk.CfnOutput(this, 'SessionsTableArn', {
      value: sessionsTable.tableArn,
      description: 'Sessions DynamoDB table ARN',
      exportName: `${id}-SessionsTableArn`,
    });

    // ============================================================================
    // Collections Table (NEW - Collection Data Inheritance)
    // ============================================================================

    // Create Collections table for persistent collection storage
    const collectionsTable = new dynamodb.Table(this, 'CollectionsTable', {
      tableName: `Collections-${props.environment}`,
      partitionKey: {
        name: 'collectionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.environment === 'production',
    });

    // Add GSI for listing user collections
    collectionsTable.addGlobalSecondaryIndex({
      indexName: 'owner-createdAt-index',
      partitionKey: {
        name: 'owner',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output Collections table details
    new cdk.CfnOutput(this, 'CollectionsTableName', {
      value: collectionsTable.tableName,
      description: 'Collections DynamoDB table name',
      exportName: `${id}-CollectionsTable`,
    });

    new cdk.CfnOutput(this, 'CollectionsTableArn', {
      value: collectionsTable.tableArn,
      description: 'Collections DynamoDB table ARN',
      exportName: `${id}-CollectionsTableArn`,
    });

    // ============================================================================
    // Import Lambda Construct (needed for all Lambda functions below)
    // ============================================================================

    const { LambdaFunction } = require('./constructs/lambda-function');

    // Output table names for verification
    new cdk.CfnOutput(this, 'ChatMessageTableName', {
      value: chatMessageTable.tableName,
      description: 'ChatMessage DynamoDB table name',
      exportName: `${id}-ChatMessageTable`,
    });

    new cdk.CfnOutput(this, 'ProjectTableName', {
      value: projectTable.tableName,
      description: 'Project DynamoDB table name',
      exportName: `${id}-ProjectTable`,
    });

    // Import S3 Storage Bucket from Amplify (Task 2.3)
    const storageBucketName = props.storageBucketName || 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy';
    
    const storageBucket = s3.Bucket.fromBucketName(
      this,
      'StorageBucket',
      storageBucketName
    );

    // Output bucket name for verification
    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: storageBucket.bucketName,
      description: 'S3 storage bucket name',
      exportName: `${id}-StorageBucket`,
    });

    // ============================================================================
    // Frontend S3 Bucket (Phase 4, Task 11.1)
    // ============================================================================

    // Create S3 bucket for static frontend hosting
    // Using private bucket with CloudFront Origin Access Identity
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${id.toLowerCase()}-frontend-${props.environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Private bucket
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'production',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'FrontendOAI', {
      comment: `OAI for ${id} frontend bucket`,
    });

    // Grant CloudFront OAI read access to the bucket
    frontendBucket.grantRead(originAccessIdentity);

    // Output frontend bucket details
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend static files',
      exportName: `${id}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketWebsiteUrl', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'S3 bucket website URL',
      exportName: `${id}-FrontendWebsiteUrl`,
    });

    // CloudFront Distribution will be created at the end after API Gateway is set up

    // ============================================================================
    // Test Lambda Functions (Phase 1, Task 2.1)
    // ============================================================================

    // Create test Lambda to verify Cognito import
    const verifyCognitoLambda = new lambda.Function(this, 'VerifyCognitoFunction', {
      functionName: `${id}-verify-cognito`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../test-functions/verify-cognito')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      description: 'Test function to verify Cognito User Pool import',
    });

    // Grant permission to describe the User Pool
    verifyCognitoLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:DescribeUserPool',
          'cognito-idp:DescribeUserPoolClient',
        ],
        resources: [this.userPool.userPoolArn],
      })
    );

    // Output test Lambda ARN
    new cdk.CfnOutput(this, 'VerifyCognitoLambdaArn', {
      value: verifyCognitoLambda.functionArn,
      description: 'ARN of test Lambda to verify Cognito import',
      exportName: `${id}-VerifyCognitoLambdaArn`,
    });

    // Create test Lambda to verify DynamoDB imports
    const verifyDynamoDBLambda = new lambda.Function(this, 'VerifyDynamoDBFunction', {
      functionName: `${id}-verify-dynamodb`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../test-functions/verify-dynamodb')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        CHAT_MESSAGE_TABLE: chatMessageTable.tableName,
        CHAT_SESSION_TABLE: chatSessionTable.tableName,
        PROJECT_TABLE: projectTable.tableName,
        AGENT_PROGRESS_TABLE: agentProgressTable.tableName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName,
        STORAGE_BUCKET: storageBucket.bucketName,
      },
      description: 'Test function to verify DynamoDB table imports',
    });

    // Grant read permissions to all tables
    chatMessageTable.grantReadData(verifyDynamoDBLambda);
    chatSessionTable.grantReadData(verifyDynamoDBLambda);
    projectTable.grantReadData(verifyDynamoDBLambda);
    agentProgressTable.grantReadData(verifyDynamoDBLambda);
    sessionContextTable.grantReadData(verifyDynamoDBLambda);
    
    // Grant read permission to S3 bucket
    storageBucket.grantRead(verifyDynamoDBLambda);

    // Output test Lambda ARN
    new cdk.CfnOutput(this, 'VerifyDynamoDBLambdaArn', {
      value: verifyDynamoDBLambda.functionArn,
      description: 'ARN of test Lambda to verify DynamoDB imports',
      exportName: `${id}-VerifyDynamoDBLambdaArn`,
    });

    // ============================================================================
    // API Gateway (Phase 1, Task 3)
    // ============================================================================

    // Create CloudWatch Log Group for API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `/aws/apigateway/${id}-http-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create HTTP API Gateway
    this.httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: `${id}-http-api`,
      description: 'REST API for Energy Data Insights (replacing AppSync)',
      
      // Configure CORS for frontend access
      corsPreflight: {
        allowOrigins: ['*'], // TODO: Restrict to specific domain in production
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Create default stage with access logging
    const defaultStage = this.httpApi.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          errorMessage: '$context.error.message',
          errorType: '$context.error.messageString',
        }),
      };
    }

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'HTTP API Gateway endpoint URL',
      exportName: `${id}-HttpApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiLogGroupName', {
      value: apiLogGroup.logGroupName,
      description: 'CloudWatch Log Group for API access logs',
      exportName: `${id}-ApiLogGroupName`,
    });

    // ============================================================================
    // Custom Lambda Authorizer (Phase 1, Task 3.2 + Task 4)
    // ============================================================================

    // Create custom Lambda authorizer that supports both Cognito JWT and mock tokens
    const authorizerFunction = new LambdaFunction(this, 'AuthorizerFunction', {
      functionName: 'custom-authorizer',
      description: 'Custom authorizer supporting Cognito JWT and mock development tokens',
      codePath: 'authorizer',
      timeout: 30,
      memorySize: 256,
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
        // Mock auth disabled - always require real Cognito JWT tokens
        ENABLE_MOCK_AUTH: 'false',
      },
    });

    // Grant permission to describe the User Pool (for JWT verification)
    authorizerFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:DescribeUserPool',
          'cognito-idp:DescribeUserPoolClient',
        ],
        resources: [this.userPool.userPoolArn],
      })
    );

    // Create Lambda authorizer for API Gateway
    this.authorizer = new apigatewayv2_authorizers.HttpLambdaAuthorizer(
      'CustomAuthorizer',
      authorizerFunction.function,
      {
        authorizerName: `${id}-custom-authorizer`,
        identitySource: ['$request.header.Authorization'],
        responseTypes: [apigatewayv2_authorizers.HttpLambdaResponseType.SIMPLE],
      }
    );

    // Output authorizer details
    new cdk.CfnOutput(this, 'AuthorizerFunctionArn', {
      value: authorizerFunction.functionArn,
      description: 'ARN of custom Lambda authorizer',
      exportName: `${id}-AuthorizerFunctionArn`,
    });

    new cdk.CfnOutput(this, 'MockAuthEnabled', {
      value: props.environment === 'development' ? 'true' : 'false',
      description: 'Whether mock authentication is enabled',
      exportName: `${id}-MockAuthEnabled`,
    });

    // Note: Authorizer ID will be available after it's bound to a route (Task 3.3)

    // ============================================================================
    // Test Route with Authorizer (Phase 1, Task 3.2 - Verification)
    // ============================================================================

    // Create test Lambda to verify authorizer works
    const testAuthFunction = new lambda.Function(this, 'TestAuthFunction', {
      functionName: `${id}-test-auth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../test-functions/test-auth')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Test function to verify Cognito authorizer',
    });

    // Add test route with authorizer
    this.httpApi.addRoutes({
      path: '/test/auth',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'TestAuthIntegration',
        testAuthFunction
      ),
      authorizer: this.authorizer,
    });

    // Output test Lambda ARN
    new cdk.CfnOutput(this, 'TestAuthLambdaArn', {
      value: testAuthFunction.functionArn,
      description: 'ARN of test Lambda to verify Cognito authorizer',
      exportName: `${id}-TestAuthLambdaArn`,
    });

    new cdk.CfnOutput(this, 'TestAuthEndpoint', {
      value: `${this.httpApi.apiEndpoint}/test/auth`,
      description: 'Test endpoint to verify Cognito authorizer (requires JWT token)',
      exportName: `${id}-TestAuthEndpoint`,
    });

    // ============================================================================
    // Project Management Lambda and Routes (Phase 2, Task 5.1)
    // ============================================================================

    // Create projects Lambda function
    const projectsFunction = new LambdaFunction(this, 'ProjectsFunction', {
      functionName: 'projects',
      description: 'Handles renewable energy project management operations',
      codePath: 'projects',
      environment: {
        STORAGE_BUCKET: storageBucket.bucketName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName,
        AGENT_PROGRESS_TABLE: agentProgressTable.tableName,
      },
    });

    // Grant S3 permissions
    projectsFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Grant DynamoDB permissions for comprehensive deletion
    sessionContextTable.grantReadWriteData(projectsFunction.function);
    agentProgressTable.grantReadWriteData(projectsFunction.function);

    // Add route: POST /api/projects/delete
    this.httpApi.addRoutes({
      path: '/api/projects/delete',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'DeleteProjectIntegration',
        projectsFunction.function
      ),
      authorizer: this.authorizer,
    });

    // Add route: POST /api/projects/rename
    this.httpApi.addRoutes({
      path: '/api/projects/rename',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'RenameProjectIntegration',
        projectsFunction.function
      ),
      authorizer: this.authorizer,
    });

    // Add route: GET /api/projects/{projectId}
    this.httpApi.addRoutes({
      path: '/api/projects/{projectId}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'GetProjectIntegration',
        projectsFunction.function
      ),
      authorizer: this.authorizer,
    });

    // Add route: DELETE /api/projects/{projectId}
    this.httpApi.addRoutes({
      path: '/api/projects/{projectId}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'DeleteProjectByIdIntegration',
        projectsFunction.function
      ),
      authorizer: this.authorizer,
    });

    // Output projects Lambda ARN
    new cdk.CfnOutput(this, 'ProjectsFunctionArn', {
      value: projectsFunction.functionArn,
      description: 'ARN of projects Lambda function',
      exportName: `${id}-ProjectsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ProjectsEndpoints', {
      value: `${this.httpApi.apiEndpoint}/api/projects/*`,
      description: 'Project management API endpoints',
      exportName: `${id}-ProjectsEndpoints`,
    });

    // ============================================================================
    // Chat/Agent Lambda and Routes (Phase 2, Task 5.2)
    // ============================================================================

    // Create chat/agent Lambda function
    const chatFunction = new LambdaFunction(this, 'ChatFunction', {
      functionName: 'chat',
      description: 'Handles chat messages and agent orchestration',
      codePath: 'chat',
      timeout: 300, // 5 minutes for agent processing
      memorySize: 1024, // More memory for agent operations
      environment: {
        STORAGE_BUCKET: storageBucket.bucketName,
        AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: chatMessageTable.tableName,
        AMPLIFY_DATA_CHATSESSION_TABLE_NAME: chatSessionTable.tableName,
        AMPLIFY_DATA_PROJECT_TABLE_NAME: projectTable.tableName,
        AMPLIFY_DATA_AGENTPROGRESS_TABLE_NAME: agentProgressTable.tableName,
        AMPLIFY_DATA_SESSIONCONTEXT_TABLE_NAME: sessionContextTable.tableName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName, // Add missing env var
        S3_BUCKET: storageBucket.bucketName,
        CHAT_MESSAGE_TABLE: chatMessageTable.tableName, // For message persistence
        
        // Common Bedrock Configuration
        BEDROCK_REGION: 'us-east-1',
        
        // Petrophysics Agent Configuration (Pattern 2: Agent-specific env vars)
        PETROPHYSICS_AGENT_ID: 'QUQKELPKM2',
        PETROPHYSICS_AGENT_ALIAS_ID: 'S5YWIUZOGB',
        
        // Maintenance Agent Configuration (Pattern 2: Agent-specific env vars)
        MAINTENANCE_AGENT_ID: 'UZIMUIUEGG',
        MAINTENANCE_AGENT_ALIAS_ID: 'U5UDPF00FT',
        
        // EDIcraft Agent Configuration (Pattern 1: Set actual non-sensitive values)
        EDICRAFT_AGENT_ID: 'kl1b6iGNug', // Bedrock Agent Core ID (alphanumeric only, max 10 chars)
        EDICRAFT_AGENT_ALIAS_ID: 'DEFAULT', // Bedrock Agent Core uses DEFAULT endpoint
        MINECRAFT_HOST: 'edicraft.nigelgardiner.com', // Pattern 1: Actual value
        MINECRAFT_PORT: '49001', // Pattern 1: Actual value
        MINECRAFT_RCON_PASSWORD: process.env.MINECRAFT_RCON_PASSWORD || '', // Pattern 3: Sensitive - needs Secrets Manager
        
        // OSDU/EDI Configuration (Pattern 3: Sensitive - needs Secrets Manager)
        EDI_PLATFORM_URL: process.env.EDI_PLATFORM_URL || '',
        EDI_PARTITION: process.env.EDI_PARTITION || '',
        
        // Legacy environment variables (for backward compatibility with EDIcraft)
        BEDROCK_AGENT_ID: 'kl1b6iGNug', // EDIcraft Bedrock Agent Core ID (alphanumeric only, max 10 chars)
        BEDROCK_AGENT_ALIAS_ID: 'DEFAULT', // Bedrock Agent Core uses DEFAULT endpoint
        
        FORCE_REFRESH: Date.now().toString(), // Force Lambda update
      },
    });

    // Grant DynamoDB permissions
    chatMessageTable.grantReadWriteData(chatFunction.function);
    chatSessionTable.grantReadWriteData(chatFunction.function);
    projectTable.grantReadData(chatFunction.function);
    agentProgressTable.grantReadWriteData(chatFunction.function);
    sessionContextTable.grantReadWriteData(chatFunction.function);

    // Grant explicit permissions for GSI queries on ChatMessage table
    chatFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:Query',
        ],
        resources: [
          `${chatMessageTable.tableArn}/index/*`,
        ],
      })
    );

    // Grant S3 permissions
    chatFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Grant Bedrock permissions for AI model access
    chatFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'], // TODO: Restrict to specific model ARNs in production
      })
    );

    // Grant Bedrock AgentCore permissions for EDIcraft agent
    // CRITICAL: EDIcraft uses bedrock-agentcore NOT bedrock-agent-runtime
    // See amplify/functions/edicraftAgent/mcpClient.ts for reference
    chatFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agentcore:InvokeAgent',
          'bedrock-agentcore:InvokeAgentRuntime',
          'bedrock-agent-runtime:InvokeAgent', // Keep for other agents that might use regular Bedrock Agents
          'bedrock-agent:GetAgent', // For validating agent exists and retrieving metadata
        ],
        resources: ['*'], // TODO: Restrict to specific agent ARN in production
      })
    );

    // Grant Secrets Manager permissions for retrieving credentials (Task 8)
    chatFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
        ],
        resources: [
          `arn:aws:secretsmanager:us-east-1:${this.account}:secret:minecraft/rcon-password-*`,
          `arn:aws:secretsmanager:us-east-1:${this.account}:secret:edicraft/osdu-credentials-*`,
        ],
      })
    );

    // Add route: POST /api/chat/message
    this.httpApi.addRoutes({
      path: '/api/chat/message',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'ChatMessageIntegration',
        chatFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
          timeout: cdk.Duration.seconds(29), // API Gateway max timeout
        }
      ),
      authorizer: this.authorizer,
    });

    // Output chat Lambda ARN
    new cdk.CfnOutput(this, 'ChatFunctionArn', {
      value: chatFunction.functionArn,
      description: 'ARN of chat/agent Lambda function',
      exportName: `${id}-ChatFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ChatEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/chat/message`,
      description: 'Chat message API endpoint',
      exportName: `${id}-ChatEndpoint`,
    });

    // ============================================================================
    // EDIcraft AgentCore Proxy Lambda (Python)
    // ============================================================================
    
    // Create Python Lambda to proxy requests to Bedrock AgentCore
    // This is needed because Node.js doesn't have SDK support for AgentCore yet
    const edicraftProxyFunction = new lambda.Function(this, 'EDIcraftProxyFunction', {
      functionName: `${id}-edicraft-agentcore-proxy`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/edicraft-agentcore-proxy')),
      timeout: cdk.Duration.seconds(29),
      memorySize: 512,
      environment: {
        BEDROCK_AGENT_ID: 'kl1b6iGNug',
        // AWS_REGION is automatically set by Lambda runtime
      },
    });

    // Grant Bedrock AgentCore permissions
    edicraftProxyFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agent-runtime:InvokeAgent',
          'bedrock-agentcore:InvokeAgent',
        ],
        resources: ['*'],
      })
    );

    // Grant Chat Lambda permission to invoke the proxy
    edicraftProxyFunction.grantInvoke(chatFunction.function);

    // Add proxy Lambda ARN to Chat Lambda environment
    chatFunction.function.addEnvironment('EDICRAFT_PROXY_LAMBDA_ARN', edicraftProxyFunction.functionArn);

    new cdk.CfnOutput(this, 'EDIcraftProxyFunctionArn', {
      value: edicraftProxyFunction.functionArn,
      description: 'ARN of EDIcraft AgentCore proxy Lambda',
      exportName: `${id}-EDIcraftProxyFunctionArn`,
    });

    // ============================================================================
    // Petrophysics Calculator Lambda (Python)
    // ============================================================================

    // Create Python Lambda for petrophysical calculations
    const petrophysicsCalculatorFunction = new lambda.Function(this, 'PetrophysicsCalculatorFunction', {
      functionName: `${id}-petrophysics-calculator`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/petrophysics-calculator')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        STORAGE_BUCKET: storageBucket.bucketName,
      },
      description: 'Petrophysics calculator using Python for LAS file analysis',
    });

    // Grant S3 read permissions to access LAS files
    storageBucket.grantRead(petrophysicsCalculatorFunction);

    // Grant chat Lambda permission to invoke petrophysics calculator
    petrophysicsCalculatorFunction.grantInvoke(chatFunction.function);

    // Add environment variable to chat Lambda
    chatFunction.addEnvironment(
      'PETROPHYSICS_CALCULATOR_FUNCTION_NAME',
      petrophysicsCalculatorFunction.functionName
    );

    // Output petrophysics calculator Lambda ARN
    new cdk.CfnOutput(this, 'PetrophysicsCalculatorFunctionArn', {
      value: petrophysicsCalculatorFunction.functionArn,
      description: 'ARN of petrophysics calculator Lambda function',
      exportName: `${id}-PetrophysicsCalculatorFunctionArn`,
    });

    // ============================================================================
    // ChatSession Lambda and Routes (Phase 5, Task 12.1-12.2)
    // ============================================================================

    // Create chat-sessions Lambda function
    const chatSessionsFunction = new LambdaFunction(this, 'ChatSessionsFunction', {
      functionName: 'chat-sessions',
      description: 'Handles ChatSession CRUD operations',
      codePath: 'chat-sessions',
      timeout: 30,
      memorySize: 512,
      environment: {
        CHAT_SESSION_TABLE: chatSessionTable.tableName,
        CHAT_MESSAGE_TABLE: chatMessageTable.tableName,
      },
    });

    // Grant DynamoDB permissions
    chatSessionTable.grantReadWriteData(chatSessionsFunction.function);
    chatMessageTable.grantReadData(chatSessionsFunction.function);

    // Grant explicit permissions for GSI queries
    chatSessionsFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [
          `${chatSessionTable.tableArn}/index/*`,
          `${chatMessageTable.tableArn}/index/*`,
        ],
      })
    );

    // Add routes for ChatSession operations
    // POST /api/chat/sessions - Create new session
    this.httpApi.addRoutes({
      path: '/api/chat/sessions',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CreateSessionIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/chat/sessions - List user's sessions
    this.httpApi.addRoutes({
      path: '/api/chat/sessions',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'ListSessionsIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/chat/sessions/{id} - Get session details
    this.httpApi.addRoutes({
      path: '/api/chat/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'GetSessionIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // PATCH /api/chat/sessions/{id} - Update session
    this.httpApi.addRoutes({
      path: '/api/chat/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.PATCH],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'UpdateSessionIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // DELETE /api/chat/sessions/{id} - Delete session
    this.httpApi.addRoutes({
      path: '/api/chat/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'DeleteSessionIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/chat/sessions/{id}/messages - Get session messages
    this.httpApi.addRoutes({
      path: '/api/chat/sessions/{id}/messages',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'GetSessionMessagesIntegration',
        chatSessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // Output chat-sessions Lambda ARN
    new cdk.CfnOutput(this, 'ChatSessionsFunctionArn', {
      value: chatSessionsFunction.functionArn,
      description: 'ARN of chat-sessions Lambda function',
      exportName: `${id}-ChatSessionsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ChatSessionsEndpoints', {
      value: `${this.httpApi.apiEndpoint}/api/chat/sessions/*`,
      description: 'ChatSession API endpoints',
      exportName: `${id}-ChatSessionsEndpoints`,
    });

    // ============================================================================
    // Sessions Management Lambda and Routes (Collection Data Inheritance)
    // ============================================================================

    // Create sessions Lambda function
    const sessionsFunction = new LambdaFunction(this, 'SessionsFunction', {
      functionName: 'sessions',
      description: 'Handles session management with collection linking (create, get, update, delete, list)',
      codePath: 'sessions',
      timeout: 30,
      memorySize: 256,
      environment: {
        SESSIONS_TABLE_NAME: sessionsTable.tableName,
      },
    });

    // Grant DynamoDB permissions to sessions Lambda
    sessionsTable.grantReadWriteData(sessionsFunction.function);

    // Add routes for sessions API
    // POST /api/sessions/create
    this.httpApi.addRoutes({
      path: '/api/sessions/create',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'SessionsCreateIntegration',
        sessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/sessions/list
    this.httpApi.addRoutes({
      path: '/api/sessions/list',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'SessionsListIntegration',
        sessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/sessions/{id}
    this.httpApi.addRoutes({
      path: '/api/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'SessionsGetIntegration',
        sessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // PUT /api/sessions/{id}
    this.httpApi.addRoutes({
      path: '/api/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.PUT],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'SessionsUpdateIntegration',
        sessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // DELETE /api/sessions/{id}
    this.httpApi.addRoutes({
      path: '/api/sessions/{id}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'SessionsDeleteIntegration',
        sessionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // Output sessions Lambda ARN and endpoints
    new cdk.CfnOutput(this, 'SessionsFunctionArn', {
      value: sessionsFunction.functionArn,
      description: 'ARN of sessions management Lambda function',
      exportName: `${id}-SessionsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'SessionsApiEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/sessions`,
      description: 'Sessions API base endpoint',
      exportName: `${id}-SessionsApiEndpoint`,
    });

    // ============================================================================
    // CloudWatch Alarms for Sessions API (Task 15.3)
    // ============================================================================

    // Create SNS topic for alarm notifications (optional - can be configured later)
    const alarmTopic = new sns.Topic(this, 'SessionsAlarmTopic', {
      displayName: 'Collection Data Inheritance - Sessions API Alarms',
      topicName: 'sessions-api-alarms',
    });

    // Alarm 1: High API Error Rate (> 5%)
    const errorRateAlarm = new cloudwatch.Alarm(this, 'SessionsHighErrorRate', {
      alarmName: 'Sessions-HighErrorRate',
      alarmDescription: 'Sessions API error rate exceeds 5%',
      metric: new cloudwatch.MathExpression({
        expression: '(errors / invocations) * 100',
        usingMetrics: {
          errors: sessionsFunction.function.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          invocations: sessionsFunction.function.metricInvocations({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm 2: High Latency (> 1 second)
    const latencyAlarm = new cloudwatch.Alarm(this, 'SessionsHighLatency', {
      alarmName: 'Sessions-HighLatency',
      alarmDescription: 'Sessions API latency exceeds 1 second',
      metric: sessionsFunction.function.metricDuration({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1000, // 1 second in milliseconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm 3: DynamoDB Throttling
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'SessionsTableThrottling', {
      alarmName: 'Sessions-DynamoDBThrottling',
      alarmDescription: 'Sessions table experiencing throttling',
      metric: sessionsTable.metricUserErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm 4: Lambda Errors
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'SessionsLambdaErrors', {
      alarmName: 'Sessions-LambdaErrors',
      alarmDescription: 'Sessions Lambda function experiencing errors',
      metric: sessionsFunction.function.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add SNS actions to alarms (optional - can be configured later)
    errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    latencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    dynamoThrottleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    lambdaErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Output alarm topic ARN
    new cdk.CfnOutput(this, 'SessionsAlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for Sessions API alarms',
      exportName: `${id}-SessionsAlarmTopicArn`,
    });

    // Grant CloudWatch permissions to sessions Lambda
    sessionsFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // ============================================================================
    // Renewable Tools Lambda - COMPLETE ORIGINAL CODE (Must be before orchestrator)
    // ============================================================================
    
    // Renewable tools Lambda - returns chart data for frontend Plotly.js rendering
    const renewableToolsFunction = new lambda.Function(this, 'RenewableToolsFunction', {
      description: 'Renewable tools Lambda - returns chart data for client-side rendering',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/renewable-tools')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        NREL_API_KEY: process.env.NREL_API_KEY || 'Fkh6pFT1SPsn9SBw8TDMSl7EnjEeGzNe5mfGQSA2',
        S3_BUCKET: storageBucket.bucketName,
        RENEWABLE_S3_BUCKET: storageBucket.bucketName,
        REGION: this.region,
        RETURN_CHART_DATA: 'true',  // Return data for frontend Plotly.js rendering
      },
    });
    
    // Grant S3 permissions
    storageBucket.grantReadWrite(renewableToolsFunction);

    // ============================================================================
    // Renewable Energy Orchestrator Lambda and Routes (Phase 2, Task 5.3)
    // ============================================================================

    // Create renewable orchestrator Lambda function
    const renewableOrchestratorFunction = new LambdaFunction(this, 'RenewableOrchestratorFunction', {
      functionName: 'renewable-orchestrator',
      description: 'Coordinates renewable energy analysis workflows',
      codePath: 'renewable-orchestrator',
      timeout: 300, // 5 minutes for complex analysis
      memorySize: 1024,
      environment: {
        STORAGE_BUCKET: storageBucket.bucketName,
        CHAT_MESSAGE_TABLE_NAME: chatMessageTable.tableName,
        AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: chatMessageTable.tableName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName,
        RENEWABLE_S3_BUCKET: storageBucket.bucketName,
        // Tool Lambda function names - ALL tools use the same Lambda
        RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: renewableToolsFunction.functionName,
        RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: renewableToolsFunction.functionName,
        RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: renewableToolsFunction.functionName,
        RENEWABLE_REPORT_TOOL_FUNCTION_NAME: renewableToolsFunction.functionName,
        RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME: renewableToolsFunction.functionName,
        FORCE_REFRESH: Date.now().toString(), // Force Lambda update
      },
    });

    // Grant DynamoDB permissions
    chatMessageTable.grantReadWriteData(renewableOrchestratorFunction.function);
    sessionContextTable.grantReadWriteData(renewableOrchestratorFunction.function);

    // Grant S3 permissions
    renewableOrchestratorFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Grant Lambda invoke permissions for the tools Lambda
    renewableToolsFunction.grantInvoke(renewableOrchestratorFunction.function);

    // Add route: POST /api/renewable/analyze
    this.httpApi.addRoutes({
      path: '/api/renewable/analyze',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'RenewableAnalyzeIntegration',
        renewableOrchestratorFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
          timeout: cdk.Duration.seconds(29), // API Gateway max timeout
        }
      ),
      authorizer: this.authorizer,
    });

    // Grant chat Lambda permission to invoke renewable orchestrator
    chatFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [renewableOrchestratorFunction.functionArn],
      })
    );

    // Add environment variable to chat Lambda for orchestrator function name
    chatFunction.addEnvironment(
      'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME',
      renewableOrchestratorFunction.functionName
    );

    // CRITICAL: Grant chat Lambda permission to invoke renewable orchestrator
    renewableOrchestratorFunction.function.grantInvoke(chatFunction.function);

    // Output renewable orchestrator Lambda ARN
    new cdk.CfnOutput(this, 'RenewableOrchestratorFunctionArn', {
      value: renewableOrchestratorFunction.functionArn,
      description: 'ARN of renewable orchestrator Lambda function',
      exportName: `${id}-RenewableOrchestratorFunctionArn`,
    });
    
    new cdk.CfnOutput(this, 'RenewableToolsFunctionArn', {
      value: renewableToolsFunction.functionArn,
      description: 'ARN of complete renewable tools Lambda function',
      exportName: `${id}-RenewableToolsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'RenewableAnalyzeEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/renewable/analyze`,
      description: 'Renewable energy analysis API endpoint',
      exportName: `${id}-RenewableAnalyzeEndpoint`,
    });

    // ============================================================================
    // Catalog Lambda Functions and Routes (Phase 2, Task 5.4)
    // ============================================================================

    // Create catalog map data Lambda function
    const catalogMapDataFunction = new LambdaFunction(this, 'CatalogMapDataFunction', {
      functionName: 'catalog-map-data',
      description: 'Fetches well and seismic data for catalog map visualization',
      codePath: 'catalog-map-data',
      timeout: 30, // 30 seconds for data fetching
      memorySize: 512,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        OSDU_BASE_URL: process.env.OSDU_BASE_URL || 'https://community.opensubsurface.org',
        OSDU_PARTITION_ID: process.env.OSDU_PARTITION_ID || 'opendes',
      },
    });

    // Grant S3 permissions
    catalogMapDataFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Add route: GET /api/catalog/map-data
    this.httpApi.addRoutes({
      path: '/api/catalog/map-data',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CatalogMapDataIntegration',
        catalogMapDataFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
          timeout: cdk.Duration.seconds(29),
        }
      ),
      authorizer: this.authorizer,
    });

    // Create catalog search Lambda function
    const catalogSearchFunction = new LambdaFunction(this, 'CatalogSearchFunction', {
      functionName: 'catalog-search',
      description: 'Performs intelligent catalog search with chain-of-thought reasoning',
      codePath: 'catalog-search',
      timeout: 60, // 60 seconds for AI-powered search
      memorySize: 1024, // More memory for AI processing
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        OSDU_BASE_URL: process.env.OSDU_BASE_URL || 'https://community.opensubsurface.org',
        OSDU_PARTITION_ID: process.env.OSDU_PARTITION_ID || 'opendes',
        // OSDU Lambda API endpoint for internal calls
        OSDU_API_ENDPOINT: `${this.httpApi.apiEndpoint}/api/osdu/search`,
      },
    });

    // Grant S3 permissions
    catalogSearchFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Grant Bedrock permissions for AI model access
    catalogSearchFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      })
    );

    // Add route: POST /api/catalog/search
    this.httpApi.addRoutes({
      path: '/api/catalog/search',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CatalogSearchIntegration',
        catalogSearchFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
          timeout: cdk.Duration.seconds(29),
        }
      ),
      authorizer: this.authorizer,
    });

    // Output catalog Lambda ARNs
    new cdk.CfnOutput(this, 'CatalogMapDataFunctionArn', {
      value: catalogMapDataFunction.functionArn,
      description: 'ARN of catalog map data Lambda function',
      exportName: `${id}-CatalogMapDataFunctionArn`,
    });

    new cdk.CfnOutput(this, 'CatalogSearchFunctionArn', {
      value: catalogSearchFunction.functionArn,
      description: 'ARN of catalog search Lambda function',
      exportName: `${id}-CatalogSearchFunctionArn`,
    });

    new cdk.CfnOutput(this, 'CatalogMapDataEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/catalog/map-data`,
      description: 'Catalog map data API endpoint',
      exportName: `${id}-CatalogMapDataEndpoint`,
    });

    new cdk.CfnOutput(this, 'CatalogSearchEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/catalog/search`,
      description: 'Catalog search API endpoint',
      exportName: `${id}-CatalogSearchEndpoint`,
    });

    // ============================================================================
    // Collections Management Lambda and Routes (Phase 3, Task 8.5)
    // ============================================================================

    // Create collections Lambda function
    const collectionsFunction = new LambdaFunction(this, 'CollectionsFunction', {
      functionName: 'collections',
      description: 'Handles collection management operations (create, list, get, update, delete, query)',
      codePath: 'collections',
      timeout: 60,
      memorySize: 512,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        COLLECTIONS_TABLE_NAME: collectionsTable.tableName,
      },
    });

    // Grant S3 permissions for collection data storage
    collectionsFunction.grantS3ReadWrite(storageBucket.bucketArn);
    
    // Grant DynamoDB permissions to collections Lambda
    collectionsTable.grantReadWriteData(collectionsFunction.function);

    // Add routes for collections API
    // POST /api/collections/create
    this.httpApi.addRoutes({
      path: '/api/collections/create',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsCreateIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/collections/list
    this.httpApi.addRoutes({
      path: '/api/collections/list',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsListIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/collections/{id}
    this.httpApi.addRoutes({
      path: '/api/collections/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsGetIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // PUT /api/collections/{id}
    this.httpApi.addRoutes({
      path: '/api/collections/{id}',
      methods: [apigatewayv2.HttpMethod.PUT],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsUpdateIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // DELETE /api/collections/{id}
    this.httpApi.addRoutes({
      path: '/api/collections/{id}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsDeleteIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // POST /api/collections/{id}/query
    this.httpApi.addRoutes({
      path: '/api/collections/{id}/query',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'CollectionsQueryIntegration',
        collectionsFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // Output collections Lambda ARN and endpoints
    new cdk.CfnOutput(this, 'CollectionsFunctionArn', {
      value: collectionsFunction.functionArn,
      description: 'ARN of collections management Lambda function',
      exportName: `${id}-CollectionsFunctionArn`,
    });

    new cdk.CfnOutput(this, 'CollectionsApiEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/collections`,
      description: 'Collections API base endpoint',
      exportName: `${id}-CollectionsApiEndpoint`,
    });

    // ============================================================================
    // OSDU Integration Lambda and Routes (Phase 3, Task 8.5)
    // ============================================================================

    // Create OSDU Lambda function
    const osduFunction = new LambdaFunction(this, 'OsduFunction', {
      functionName: 'osdu',
      description: 'Handles OSDU data platform integration and search',
      codePath: 'osdu',
      timeout: 60,
      memorySize: 512,
      environment: {
        OSDU_API_URL: process.env.OSDU_API_URL || 'https://api.osdu.example.com/search',
        OSDU_API_KEY: process.env.OSDU_API_KEY || '',
      },
    });

    // Grant Secrets Manager permissions for OSDU credentials
    osduFunction.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
        ],
        resources: [
          `arn:aws:secretsmanager:us-east-1:${this.account}:secret:osdu-credentials-*`,
        ],
      })
    );

    // Add routes for OSDU API
    // POST /api/osdu/search
    this.httpApi.addRoutes({
      path: '/api/osdu/search',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'OsduSearchIntegration',
        osduFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // GET /api/osdu/wells/{id}
    this.httpApi.addRoutes({
      path: '/api/osdu/wells/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'OsduWellIntegration',
        osduFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      ),
      authorizer: this.authorizer,
    });

    // Output OSDU Lambda ARN and endpoints
    new cdk.CfnOutput(this, 'OsduFunctionArn', {
      value: osduFunction.functionArn,
      description: 'ARN of OSDU integration Lambda function',
      exportName: `${id}-OsduFunctionArn`,
    });

    new cdk.CfnOutput(this, 'OsduSearchEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/osdu/search`,
      description: 'OSDU search API endpoint',
      exportName: `${id}-OsduSearchEndpoint`,
    });

    // ============================================================================
    // Renewable API Lambda and Routes (Phase 4, Task 10.2)
    // ============================================================================

    // Create renewable API Lambda function
    const renewableApiFunction = new LambdaFunction(this, 'RenewableApiFunction', {
      functionName: 'api-renewable',
      description: 'Handles all /api/renewable/* routes (health, diagnostics, energy, wind data)',
      codePath: 'api-renewable',
      timeout: 60,
      memorySize: 512,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
      },
    });

    // Grant S3 permissions
    renewableApiFunction.grantS3ReadWrite(storageBucket.bucketArn);

    // Add routes for renewable API (catch-all for /api/renewable/*)
    this.httpApi.addRoutes({
      path: '/api/renewable/{proxy+}',
      methods: [
        apigatewayv2.HttpMethod.GET,
        apigatewayv2.HttpMethod.POST,
        apigatewayv2.HttpMethod.PUT,
        apigatewayv2.HttpMethod.DELETE,
      ],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'RenewableApiIntegration',
        renewableApiFunction.function,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
          timeout: cdk.Duration.seconds(29),
        }
      ),
      authorizer: this.authorizer,
    });

    // Output renewable API Lambda ARN
    new cdk.CfnOutput(this, 'RenewableApiFunctionArn', {
      value: renewableApiFunction.functionArn,
      description: 'ARN of renewable API Lambda function',
      exportName: `${id}-RenewableApiFunctionArn`,
    });

    new cdk.CfnOutput(this, 'RenewableApiEndpoint', {
      value: `${this.httpApi.apiEndpoint}/api/renewable/*`,
      description: 'Renewable API endpoints',
      exportName: `${id}-RenewableApiEndpoint`,
    });

    // ============================================================================
    // Health API Lambda and Routes (Phase 4, Task 10.2)
    // ============================================================================

    const healthApiFunction = new LambdaFunction(this, 'HealthApiFunction', {
      functionName: 'api-health',
      description: 'Handles /api/health/* routes',
      codePath: 'api-health',
      timeout: 30,
      memorySize: 256,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
      },
    });

    healthApiFunction.grantS3ReadWrite(storageBucket.bucketArn);

    this.httpApi.addRoutes({
      path: '/api/health/{proxy+}',
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'HealthApiIntegration',
        healthApiFunction.function,
        { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
      ),
      authorizer: this.authorizer,
    });

    // ============================================================================
    // S3 Proxy API Lambda and Routes (Phase 4, Task 10.2)
    // ============================================================================

    const s3ProxyApiFunction = new LambdaFunction(this, 'S3ProxyApiFunction', {
      functionName: 'api-s3-proxy',
      description: 'Handles /api/s3-proxy route',
      codePath: 'api-s3-proxy',
      timeout: 30,
      memorySize: 256,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
      },
    });

    s3ProxyApiFunction.grantS3ReadWrite(storageBucket.bucketArn);

    this.httpApi.addRoutes({
      path: '/api/s3-proxy',
      methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'S3ProxyApiIntegration',
        s3ProxyApiFunction.function,
        { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
      ),
      authorizer: this.authorizer,
    });

    // ============================================================================
    // Utility API Lambda and Routes (Phase 4, Task 10.2)
    // ============================================================================

    const utilityApiFunction = new LambdaFunction(this, 'UtilityApiFunction', {
      functionName: 'api-utility',
      description: 'Handles utility routes (directory scan, config test)',
      codePath: 'api-utility',
      timeout: 60,
      memorySize: 512,
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
      },
    });

    utilityApiFunction.grantS3ReadWrite(storageBucket.bucketArn);

    this.httpApi.addRoutes({
      path: '/api/global-directory-scan',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'UtilityApiIntegration1',
        utilityApiFunction.function,
        { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/test-renewable-config',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'UtilityApiIntegration2',
        utilityApiFunction.function,
        { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
      ),
      authorizer: this.authorizer,
    });

    // ============================================================================
    // API Routes Structure (Phase 1, Task 3.3)
    // ============================================================================

    // All routes use this.authorizer for Cognito JWT validation

    // ============================================================================
    // CloudFront Distribution with API Gateway (Phase 4, Task 11.2)
    // ============================================================================

    // Extract API Gateway domain from the API endpoint using CloudFormation functions
    // Format: https://{api-id}.execute-api.{region}.amazonaws.com
    // We need to remove the https:// prefix for CloudFront
    const apiDomainWithProtocol = this.httpApi.apiEndpoint;
    
    // Use CloudFormation Select and Split to extract domain without https://
    const apiDomain = cdk.Fn.select(1, cdk.Fn.split('://', apiDomainWithProtocol));

    // Create CloudFront distribution using L1 construct for full control
    // This avoids the origin ID colon issue with L2 constructs
    const distribution = new cloudfront.CfnDistribution(this, 'FrontendDistribution', {
      distributionConfig: {
        enabled: true,
        comment: `${id} Frontend Distribution - Static assets + API`,
        priceClass: 'PriceClass_100', // US, Canada, Europe
        defaultRootObject: 'index.html',
        
        // Origins
        origins: [
          {
            id: 'S3Origin',
            domainName: frontendBucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: `origin-access-identity/cloudfront/${originAccessIdentity.originAccessIdentityId}`,
            },
          },
          {
            id: 'ApiGatewayOrigin',
            domainName: apiDomain,
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'https-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        
        // Default cache behavior (S3 static files)
        defaultCacheBehavior: {
          targetOriginId: 'S3Origin',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: cloudfront.CachePolicy.CACHING_OPTIMIZED.cachePolicyId,
          originRequestPolicyId: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN.originRequestPolicyId,
        },
        
        // Additional cache behaviors
        cacheBehaviors: [
          {
            pathPattern: '/api/*',
            targetOriginId: 'ApiGatewayOrigin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            cachedMethods: ['GET', 'HEAD'],
            compress: false,
            cachePolicyId: cloudfront.CachePolicy.CACHING_DISABLED.cachePolicyId,
            originRequestPolicyId: cloudfront.OriginRequestPolicy.ALL_VIEWER.originRequestPolicyId,
          },
        ],
        
        // Custom error responses for SPA routing
        customErrorResponses: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
        ],
      },
    });

    // Bucket policy is automatically created by grantRead() above

    // Output CloudFront details
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.ref,
      description: 'CloudFront Distribution ID',
      exportName: `${id}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.attrDomainName,
      description: 'CloudFront Domain Name',
      exportName: `${id}-CloudFrontDomain`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.attrDomainName}`,
      description: 'Frontend URL (CloudFront) - Use this to access the application',
      exportName: `${id}-FrontendUrl`,
    });

    new cdk.CfnOutput(this, 'ApiUrlViaCloudFront', {
      value: `https://${distribution.attrDomainName}/api`,
      description: 'API URL via CloudFront (for frontend configuration)',
      exportName: `${id}-ApiUrlViaCloudFront`,
    });

    // ============================================================================
    // Outputs
    // ============================================================================

    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Stack name',
    });
  }
}
