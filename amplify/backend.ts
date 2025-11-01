import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, agentFunction, catalogMapDataFunction, catalogSearchFunction, renewableToolsFunction, agentProgressFunction } from './data/resource';
import { storage } from './storage/resource';
import { renewableAgentCoreProxy } from './functions/renewableAgentCoreProxy/resource';
import { aws_iam as iam, Stack, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { McpServerConstruct } from './custom/mcpServer';
import { LocationServiceConstruct } from './custom/locationService';
import { StrandsAgentAlarms } from './custom/strandsAgentAlarms';

// Import NEW Lambda-based renewable energy functions
import { renewableOrchestrator } from './functions/renewableOrchestrator/resource';
import { renewableTerrainTool } from './functions/renewableTools/terrain/resource';
import { renewableLayoutTool } from './functions/renewableTools/layout/resource';
import { renewableSimulationTool } from './functions/renewableTools/simulation/resource';
import { renewableReportTool } from './functions/renewableTools/report/resource';
// import { createRenewableDemoLayer } from './layers/renewableDemo/resource'; // DISABLED - Python layer build hanging

// Import Maintenance Agent
import { maintenanceAgentFunction } from './functions/maintenanceAgent/resource';

// Import EDIcraft Agent
import { edicraftAgentFunction } from './functions/edicraftAgent/resource';

// Import Strands Agent System
import { renewableAgentsFunction } from './functions/renewableAgents/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  agentFunction,
  catalogMapDataFunction,
  catalogSearchFunction,
  renewableToolsFunction,
  agentProgressFunction,
  renewableAgentCoreProxy,
  // NEW: Lambda-based renewable energy functions
  renewableOrchestrator,
  renewableTerrainTool,
  renewableLayoutTool,
  renewableSimulationTool,
  renewableReportTool,
  // Maintenance Agent
  maintenanceAgentFunction,
  // EDIcraft Agent
  edicraftAgentFunction,
  // Strands Agent System (COMPLETE AGENT ARCHITECTURE)
  renewableAgentsFunction // ✅ ENABLED - Intelligent layout optimization with py-wake
});

backend.stack.tags.setTag('Project', 'workshop-a4e');

// ============================================
// Project Persistence Infrastructure
// ============================================

// Create DynamoDB table for session context
const sessionContextTable = new dynamodb.Table(backend.stack, 'RenewableSessionContext', {
  partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
  removalPolicy: RemovalPolicy.DESTROY,
  tableName: 'RenewableSessionContext'
});

console.log('✅ Created DynamoDB table for session context:', sessionContextTable.tableName);

// ============================================
// Catalog Session Storage Infrastructure
// ============================================

// Create S3 bucket for catalog sessions with lifecycle policies
const catalogSessionBucket = new s3.Bucket(backend.stack, 'CatalogSessionBucket', {
  bucketName: `catalog-sessions-${backend.stack.account}-${backend.stack.region}`,
  // Lifecycle policy: Delete sessions after 7 days
  lifecycleRules: [
    {
      id: 'DeleteOldSessions',
      expiration: Duration.days(7),
      enabled: true
    }
  ],
  // CORS configuration for frontend access to signed URLs
  cors: [
    {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
      allowedOrigins: ['*'], // In production, restrict to your domain
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      maxAge: 3600
    }
  ],
  // Encryption at rest
  encryption: s3.BucketEncryption.S3_MANAGED,
  // Block public access
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  // Removal policy for development
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  // Versioning disabled to save costs
  versioned: false
});

console.log('✅ Created S3 bucket for catalog sessions:', catalogSessionBucket.bucketName);
console.log('✅ Lifecycle policy: Delete sessions after 7 days');

// Create DynamoDB table for agent progress tracking
const agentProgressTable = new dynamodb.Table(backend.stack, 'AgentProgress', {
  partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'expiresAt',
  removalPolicy: RemovalPolicy.DESTROY,
  tableName: 'AgentProgress'
});

console.log('✅ Created DynamoDB table for agent progress:', agentProgressTable.tableName);

// Grant agentProgressFunction permission to read from AgentProgress table
backend.agentProgressFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query'
    ],
    resources: [
      agentProgressTable.tableArn,
      `${agentProgressTable.tableArn}/index/*`
    ]
  })
);

// Add AgentProgress table name to agentProgressFunction environment
backend.agentProgressFunction.addEnvironment(
  'AGENT_PROGRESS_TABLE',
  agentProgressTable.tableName
);

console.log('✅ Granted agentProgressFunction permissions for AgentProgress table');

// ============================================
// CloudWatch Alarms for Strands Agent Performance Monitoring
// Task 11.2: Create CloudWatch alarms for performance degradation
// ============================================

const strandsAgentAlarms = new StrandsAgentAlarms(backend.stack, 'StrandsAgentAlarms', {
  // Optional: Add email for alarm notifications
  // alarmEmail: 'your-email@example.com',
  enabled: true
});

console.log('✅ Created CloudWatch alarms for Strands Agent performance monitoring');

// Create AWS Location Service Place Index for reverse geocoding
const locationService = new LocationServiceConstruct(backend.stack, 'LocationService', {
  placeIndexName: 'RenewableProjectPlaceIndex'
});

console.log('✅ Created AWS Location Service Place Index:', locationService.placeIndexName);

// CRITICAL FIX: Add S3 permissions for authenticated users to upload chat artifacts
// This fixes the AccessDenied error when uploading large artifacts to S3
const chatArtifactsPolicy = new iam.Policy(backend.stack, 'ChatArtifactsS3Policy', {
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject'
      ],
      resources: [
        `${backend.storage.resources.bucket.bucketArn}/chatSessionArtifacts/*`
      ]
    })
  ]
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(chatArtifactsPolicy);

console.log('✅ S3 permissions added for authenticated users to upload chat artifacts');

// Create the renewable demo layer
// const renewableDemoLayer = createRenewableDemoLayer(backend.stack); // DISABLED - Python layer build hanging

// Add MCP Server with petrophysical capabilities
const mcpServer = new McpServerConstruct(backend.stack, 'McpServer', {});

// Add IAM permissions to the Lambda functions
const s3PolicyStatement = new iam.PolicyStatement({
  actions: [
    "s3:ListBucket",
    "s3:GetObject"
  ],
  resources: [
    backend.storage.resources.bucket.bucketArn,
    `${backend.storage.resources.bucket.bucketArn}/*`,
  ],
});

// Add permissions for the bucket with actual LAS files
const actualS3BucketPolicyStatement = new iam.PolicyStatement({
  actions: [
    "s3:ListBucket",
    "s3:GetObject"
  ],
  resources: [
    "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m",
    "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/*",
  ],
});

backend.agentFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
backend.catalogMapDataFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
backend.catalogSearchFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
backend.maintenanceAgentFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);

// Add permissions for the actual bucket with LAS files
backend.agentFunction.resources.lambda.addToRolePolicy(actualS3BucketPolicyStatement);
backend.catalogMapDataFunction.resources.lambda.addToRolePolicy(actualS3BucketPolicyStatement);
backend.catalogSearchFunction.resources.lambda.addToRolePolicy(actualS3BucketPolicyStatement);
backend.maintenanceAgentFunction.resources.lambda.addToRolePolicy(actualS3BucketPolicyStatement);

// ============================================
// Catalog Search Lambda S3 Permissions
// ============================================

// Grant catalogSearchFunction full access to catalog session bucket
backend.catalogSearchFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject',
      's3:ListBucket'
    ],
    resources: [
      catalogSessionBucket.bucketArn,
      `${catalogSessionBucket.bucketArn}/*`
    ]
  })
);

// Grant catalogSearchFunction Bedrock permissions for Strands Agent
backend.catalogSearchFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream'
    ],
    resources: [
      // Foundation models (region-specific)
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:*::foundation-model/*`,
      // Inference profiles (cross-region and global)
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`,
      `arn:aws:bedrock:*:${backend.stack.account}:inference-profile/*`,
      // Global inference profiles (no region, no account)
      `arn:aws:bedrock:*::inference-profile/*`,
    ]
  })
);

// Add catalog session bucket name as environment variable
backend.catalogSearchFunction.addEnvironment(
  'CATALOG_SESSION_BUCKET',
  catalogSessionBucket.bucketName
);

// CloudWatch Logs permissions are automatically granted by Lambda
// But we'll ensure enhanced logging is enabled
console.log('✅ Granted catalogSearchFunction S3 permissions for catalog sessions');
console.log('✅ Granted catalogSearchFunction Bedrock permissions for Strands Agent');
console.log('✅ CloudWatch Logs automatically enabled for Lambda function');

backend.agentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel*"],
    resources: [
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`,
    ],
  })
);

// Add Bedrock permissions to Maintenance Agent
backend.maintenanceAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel*"],
    resources: [
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`,
    ],
  })
);

// Add S3_BUCKET environment variable to Maintenance Agent
backend.maintenanceAgentFunction.addEnvironment('S3_BUCKET', backend.storage.resources.bucket.bucketName);

// Add Bedrock permissions to EDIcraft Agent
backend.edicraftAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel*"],
    resources: [
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`,
    ],
  })
);

// Add Bedrock Agent Runtime permissions for EDIcraft Agent
// This allows the Lambda to invoke Bedrock agents via the Agent Runtime API
backend.edicraftAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "bedrock-agent-runtime:InvokeAgent",
      "bedrock-agent:GetAgent",
      "bedrock-agent:GetAgentAlias",
    ],
    resources: [
      `arn:aws:bedrock:*:${backend.stack.account}:agent/*`,
      `arn:aws:bedrock:*:${backend.stack.account}:agent-alias/*/*`,
    ],
  })
);

// Add CloudWatch Logs permissions for EDIcraft Agent (explicit for clarity)
// Note: Lambda functions automatically get basic CloudWatch Logs permissions,
// but we add this explicitly to ensure full logging capabilities
backend.edicraftAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ],
    resources: [
      `arn:aws:logs:${backend.stack.region}:${backend.stack.account}:log-group:/aws/lambda/*`,
    ],
  })
);

// Configure EDIcraft Agent environment variables
// Bedrock AgentCore configuration
backend.edicraftAgentFunction.addEnvironment(
  'BEDROCK_AGENT_ID',
  process.env.BEDROCK_AGENT_ID || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'BEDROCK_AGENT_ALIAS_ID',
  process.env.BEDROCK_AGENT_ALIAS_ID || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'BEDROCK_REGION',
  process.env.BEDROCK_REGION || 'us-east-1'
);

// Minecraft Server configuration
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_HOST',
  process.env.MINECRAFT_HOST || 'edicraft.nigelgardiner.com'
);
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_PORT',
  process.env.MINECRAFT_PORT || '49000'
);
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_RCON_PORT',
  process.env.MINECRAFT_RCON_PORT || '49001'
);
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_RCON_PASSWORD',
  process.env.MINECRAFT_RCON_PASSWORD || ''
);

// OSDU Platform configuration
backend.edicraftAgentFunction.addEnvironment(
  'EDI_USERNAME',
  process.env.EDI_USERNAME || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'EDI_PASSWORD',
  process.env.EDI_PASSWORD || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'EDI_CLIENT_ID',
  process.env.EDI_CLIENT_ID || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'EDI_CLIENT_SECRET',
  process.env.EDI_CLIENT_SECRET || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'EDI_PARTITION',
  process.env.EDI_PARTITION || ''
);
backend.edicraftAgentFunction.addEnvironment(
  'EDI_PLATFORM_URL',
  process.env.EDI_PLATFORM_URL || ''
);

console.log('✅ EDIcraft Agent configured with Bedrock and Lambda invoke permissions');
console.log('✅ EDIcraft Agent environment variables configured (Bedrock, Minecraft, OSDU)');

// Add S3 permissions to MCP Server for petrophysical analysis
mcpServer.lambdaFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "s3:ListBucket",
      "s3:GetObject"
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  })
);

// Add environment variables for S3 bucket access
mcpServer.lambdaFunction.addEnvironment('S3_BUCKET', backend.storage.resources.bucket.bucketName);

// ============================================
// Renewable Energy Integration Configuration
// ============================================

// Note: Renewable energy environment variables are defined in amplify/data/resource.ts
// in the agentFunction definition

// Add Bedrock AgentCore permissions for renewable energy
backend.agentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "bedrock-agentcore:InvokeAgentRuntime",
      "bedrock-agentcore:InvokeAgent",
      "bedrock-agentcore:GetAgent",
    ],
    resources: [
      `arn:aws:bedrock-agentcore:*:${backend.stack.account}:runtime/*`,
      `arn:aws:bedrock-agentcore:*:${backend.stack.account}:agent/*`,
    ],
  })
);

// Add S3 permissions for renewable energy artifacts bucket (if configured)
if (process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET) {
  backend.agentFunction.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
      ],
      resources: [
        `arn:aws:s3:::${process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET}`,
        `arn:aws:s3:::${process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET}/*`,
      ],
    })
  );
}

// Add SSM parameter access for renewable energy configuration
backend.agentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ],
    resources: [
      `arn:aws:ssm:*:${backend.stack.account}:parameter/wind-farm-assistant/*`,
    ],
  })
);

// ============================================
// Python Proxy Lambda Configuration
// ============================================

// Add Bedrock AgentCore permissions for Python proxy
backend.renewableAgentCoreProxy.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "bedrock-agentcore:InvokeAgentRuntime",
      "bedrock-agentcore:InvokeAgent",
      "bedrock-agentcore:GetAgent",
    ],
    resources: [
      `arn:aws:bedrock-agentcore:*:${backend.stack.account}:agent-runtime/*`,
      `arn:aws:bedrock-agentcore:*:${backend.stack.account}:agent/*`,
    ],
  })
);

// Add Lambda invoke permissions for TypeScript Lambda to call Python proxy
backend.agentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "lambda:InvokeFunction",
    ],
    resources: [
      backend.renewableAgentCoreProxy.resources.lambda.functionArn,
    ],
  })
);

// Add Lambda invoke permissions for TypeScript Lambda to call renewable orchestrator
backend.agentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "lambda:InvokeFunction",
      "lambda:GetFunction", // Required for validation checks
    ],
    resources: [
      backend.renewableOrchestrator.resources.lambda.functionArn,
    ],
  })
);

// Add environment variable to TypeScript Lambda with Python proxy function name
backend.agentFunction.addEnvironment(
  'RENEWABLE_PROXY_FUNCTION_NAME',
  backend.renewableAgentCoreProxy.resources.lambda.functionName
);

// Add environment variable for renewable orchestrator function name
backend.agentFunction.addEnvironment(
  'RENEWABLE_ORCHESTRATOR_FUNCTION_NAME',
  backend.renewableOrchestrator.resources.lambda.functionName
);

// Add S3 bucket name (was hardcoded in data/resource.ts, now dynamic)
backend.agentFunction.addEnvironment(
  'S3_BUCKET',
  backend.storage.resources.bucket.bucketName
);

// Add renewable S3 bucket name for frontend (same as main bucket)
backend.agentFunction.addEnvironment(
  'NEXT_PUBLIC_RENEWABLE_S3_BUCKET',
  backend.storage.resources.bucket.bucketName
);

// ============================================
// NEW: Lambda-Based Renewable Energy Configuration
// ============================================

// Grant orchestrator permission to invoke tool Lambdas
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      backend.renewableTerrainTool.resources.lambda.functionArn,
      backend.renewableLayoutTool.resources.lambda.functionArn,
      backend.renewableSimulationTool.resources.lambda.functionArn,
      backend.renewableReportTool.resources.lambda.functionArn
    ]
  })
);

// Grant orchestrator permission to write results to DynamoDB ChatMessage table
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
    resources: [
      `arn:aws:dynamodb:${backend.stack.region}:${backend.stack.account}:table/ChatMessage-*`,
      `arn:aws:dynamodb:${backend.stack.region}:${backend.stack.account}:table/ChatMessage-*/index/*`
    ]
  })
);

// Grant orchestrator permission to access session context table
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      sessionContextTable.tableArn,
      `${sessionContextTable.tableArn}/index/*`
    ]
  })
);

// Grant orchestrator permission to use AWS Location Service for reverse geocoding
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'geo:SearchPlaceIndexForPosition',
      'geo:SearchPlaceIndexForText'
    ],
    resources: [
      locationService.placeIndex.attrArn
    ]
  })
);

// Grant orchestrator S3 permissions for project data storage
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:ListBucket',
      's3:DeleteObject'
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`
    ]
  })
);

console.log('✅ Granted orchestrator permissions for session context, Location Service, and S3');

// Add ChatMessage table name environment variable to orchestrator
backend.renewableOrchestrator.addEnvironment(
  'AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME',
  backend.data.resources.tables['ChatMessage'].tableName
);

// Add session context table name environment variable to orchestrator
backend.renewableOrchestrator.addEnvironment(
  'SESSION_CONTEXT_TABLE',
  sessionContextTable.tableName
);

// Add AWS Location Service place index name environment variable
backend.renewableOrchestrator.addEnvironment(
  'AWS_LOCATION_PLACE_INDEX',
  locationService.placeIndexName
);

console.log('✅ Added session context table and Location Service environment variables to orchestrator');

// ============================================
// Strands Agent System Configuration
// ============================================

// Task 4: Add provisioned concurrency for Strands Agent (OPTIONAL - for zero cold starts)
// Enable this to maintain 1 warm instance at all times
// Cost: ~$0.015/hour = ~$10.80/month for 1 instance
// Benefit: Zero cold starts, instant response times
const ENABLE_PROVISIONED_CONCURRENCY = process.env.ENABLE_STRANDS_PROVISIONED_CONCURRENCY === 'true';

if (ENABLE_PROVISIONED_CONCURRENCY) {
  // Create a version for the Lambda function
  const lambdaFunction = backend.renewableAgentsFunction.resources.lambda as lambda.Function;
  const version = lambdaFunction.currentVersion;
  
  // Create an alias with provisioned concurrency
  const alias = new lambda.Alias(backend.stack, 'StrandsAgentProvisionedAlias', {
    aliasName: 'provisioned',
    version: version,
    provisionedConcurrentExecutions: 1, // Keep 1 warm instance
  });
  
  console.log('✅ Provisioned concurrency enabled for Strands Agent (1 warm instance)');
  console.log('💰 Estimated cost: ~$32.85/month for zero cold starts');
  console.log('ℹ️  Invoke using alias: provisioned');
} else {
  console.log('ℹ️  Provisioned concurrency DISABLED for Strands Agent');
  console.log('ℹ️  Set ENABLE_STRANDS_PROVISIONED_CONCURRENCY=true to enable');
  console.log('ℹ️  Cold starts will occur (~2-3 minutes for first request)');
}

// Grant Strands Agent function Bedrock access
backend.renewableAgentsFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream'
    ],
    resources: [
      // Foundation models
      `arn:aws:bedrock:*::foundation-model/us.anthropic.claude-3-7-sonnet-20250219-v1:0`,
      `arn:aws:bedrock:*::foundation-model/anthropic.claude-*`,
      // Inference profiles (cross-region inference)
      `arn:aws:bedrock:*:*:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0`,
      `arn:aws:bedrock:*:*:inference-profile/anthropic.claude-*`
    ]
  })
);

// Grant Strands Agent function S3 access for artifacts
backend.renewableAgentsFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:ListBucket',
      's3:DeleteObject'
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`
    ]
  })
);

// Add S3 bucket name to Strands Agent environment
backend.renewableAgentsFunction.addEnvironment(
  'RENEWABLE_S3_BUCKET',
  backend.storage.resources.bucket.bucketName
);

// Add AgentProgress table name to Strands Agent environment
backend.renewableAgentsFunction.addEnvironment(
  'AGENT_PROGRESS_TABLE',
  agentProgressTable.tableName
);

// Grant Strands Agent function DynamoDB access for progress tracking
backend.renewableAgentsFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query'
    ],
    resources: [
      agentProgressTable.tableArn,
      `${agentProgressTable.tableArn}/index/*`
    ]
  })
);

// Task 11.2: Grant Strands Agent function CloudWatch permissions for custom metrics
backend.renewableAgentsFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'cloudwatch:PutMetricData'
    ],
    resources: ['*'], // CloudWatch metrics don't support resource-level permissions
    conditions: {
      StringEquals: {
        'cloudwatch:namespace': 'StrandsAgent/Performance'
      }
    }
  })
);

console.log('✅ Granted Strands Agent CloudWatch permissions for custom metrics');

// Add Strands Agent function name to orchestrator so it can invoke it
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_AGENTS_FUNCTION_NAME',
  backend.renewableAgentsFunction.resources.lambda.functionName
);

// Grant orchestrator permission to invoke Strands Agent function
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [backend.renewableAgentsFunction.resources.lambda.functionArn]
  })
);

console.log('✅ Configured Strands Agent system with Bedrock and S3 permissions');
console.log('✅ Orchestrator can now invoke Strands Agents');
console.log('🐳 Docker-based Lambda with py-wake for intelligent layout optimization');

// Grant tool Lambdas permission to access S3
// CRITICAL FIX: Grant permissions to the actual Amplify storage bucket
const renewableS3BucketName = backend.storage.resources.bucket.bucketName;
[
  backend.renewableTerrainTool,
  backend.renewableLayoutTool,
  backend.renewableSimulationTool,
  backend.renewableReportTool
].forEach(toolLambda => {
  toolLambda.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:ListBucket',
        's3:DeleteObject',
        's3:PutObjectAcl'
      ],
      resources: [
        backend.storage.resources.bucket.bucketArn,
        `${backend.storage.resources.bucket.bucketArn}/*`
      ]
    })
  );
  
  // Log the permissions being granted
  console.log(`✅ Granted S3 permissions to ${toolLambda.resources.lambda.functionName} for bucket: ${renewableS3BucketName}`);
});

// Pass tool Lambda function names to orchestrator
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
  backend.renewableTerrainTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
  backend.renewableLayoutTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
  backend.renewableSimulationTool.resources.lambda.functionName
);
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
  backend.renewableReportTool.resources.lambda.functionName
);

// Add the renewable demo layer to all Python tool functions
// NOTE: Layer attachment is not working with current defineFunction pattern
// The functions work without the layer by using only standard library dependencies
// TODO: Fix layer attachment or migrate to Docker deployment for heavy dependencies
// [
//   backend.renewableTerrainTool,
//   backend.renewableLayoutTool,
//   backend.renewableSimulationTool,
//   backend.renewableReportTool
// ].forEach(toolLambda => {
//   const lambdaFunction = toolLambda.resources.lambda;
//   (lambdaFunction as any).addLayers([renewableDemoLayer]);
// });

// Add S3 bucket environment variables to all renewable tool functions
// CRITICAL: Use the actual Amplify storage bucket name, not a separate renewable bucket
const actualS3BucketName = backend.storage.resources.bucket.bucketName;
[
  backend.renewableTerrainTool,
  backend.renewableLayoutTool,
  backend.renewableSimulationTool,
  backend.renewableReportTool,
  backend.renewableOrchestrator
].forEach(toolLambda => {
  toolLambda.addEnvironment('RENEWABLE_S3_BUCKET', actualS3BucketName);
  toolLambda.addEnvironment('S3_BUCKET', actualS3BucketName); // Also set S3_BUCKET for simple handlers
  toolLambda.addEnvironment('RENEWABLE_AWS_REGION', backend.stack.region);
  // Note: AWS_REGION is automatically set by Lambda runtime, don't set it manually
});

// Add NREL API key to simulation and terrain tool Lambdas for real wind data integration
// CRITICAL: This is required for NREL Wind Toolkit API access (NO SYNTHETIC DATA)
const nrelApiKey = 'bhLwyK7XgOAQdYJi4j4Rp0QTWB8ZMCfZ3dUh0vsx';
backend.renewableSimulationTool.addEnvironment('NREL_API_KEY', nrelApiKey);
backend.renewableTerrainTool.addEnvironment('NREL_API_KEY', nrelApiKey);

console.log('✅ NREL API key configured for simulation and terrain tools');
console.log('✅ Renewable Energy Lambda functions registered successfully');

// ============================================
// CRITICAL: Export Function Names as Outputs
// ============================================
// Without these outputs, the frontend cannot access the deployed function names
// This is why changes never reach the frontend - the frontend is using hardcoded names!

// Export all renewable energy function names
new CfnOutput(backend.stack, 'RenewableOrchestratorFunctionName', {
  value: backend.renewableOrchestrator.resources.lambda.functionName,
  description: 'Renewable Orchestrator Lambda function name',
  exportName: 'RenewableOrchestratorFunctionName'
});

new CfnOutput(backend.stack, 'RenewableTerrainToolFunctionName', {
  value: backend.renewableTerrainTool.resources.lambda.functionName,
  description: 'Renewable Terrain Tool Lambda function name',
  exportName: 'RenewableTerrainToolFunctionName'
});

new CfnOutput(backend.stack, 'RenewableLayoutToolFunctionName', {
  value: backend.renewableLayoutTool.resources.lambda.functionName,
  description: 'Renewable Layout Tool Lambda function name',
  exportName: 'RenewableLayoutToolFunctionName'
});

new CfnOutput(backend.stack, 'RenewableSimulationToolFunctionName', {
  value: backend.renewableSimulationTool.resources.lambda.functionName,
  description: 'Renewable Simulation Tool Lambda function name',
  exportName: 'RenewableSimulationToolFunctionName'
});

new CfnOutput(backend.stack, 'RenewableReportToolFunctionName', {
  value: backend.renewableReportTool.resources.lambda.functionName,
  description: 'Renewable Report Tool Lambda function name',
  exportName: 'RenewableReportToolFunctionName'
});

new CfnOutput(backend.stack, 'RenewableAgentsFunctionName', {
  value: backend.renewableAgentsFunction.resources.lambda.functionName,
  description: 'Renewable Strands Agents Lambda function name',
  exportName: 'RenewableAgentsFunctionName'
});

new CfnOutput(backend.stack, 'MaintenanceAgentFunctionName', {
  value: backend.maintenanceAgentFunction.resources.lambda.functionName,
  description: 'Maintenance Agent Lambda function name',
  exportName: 'MaintenanceAgentFunctionName'
});

new CfnOutput(backend.stack, 'EDIcraftAgentFunctionName', {
  value: backend.edicraftAgentFunction.resources.lambda.functionName,
  description: 'EDIcraft Agent Lambda function name',
  exportName: 'EDIcraftAgentFunctionName'
});

new CfnOutput(backend.stack, 'AgentProgressFunctionName', {
  value: backend.agentProgressFunction.resources.lambda.functionName,
  description: 'Agent Progress Lambda function name',
  exportName: 'AgentProgressFunctionName'
});

new CfnOutput(backend.stack, 'RenewableS3BucketName', {
  value: backend.storage.resources.bucket.bucketName,
  description: 'S3 bucket for renewable energy artifacts',
  exportName: 'RenewableS3BucketName'
});

new CfnOutput(backend.stack, 'SessionContextTableName', {
  value: sessionContextTable.tableName,
  description: 'DynamoDB table for session context',
  exportName: 'SessionContextTableName'
});

new CfnOutput(backend.stack, 'AgentProgressTableName', {
  value: agentProgressTable.tableName,
  description: 'DynamoDB table for agent progress tracking',
  exportName: 'AgentProgressTableName'
});

new CfnOutput(backend.stack, 'CatalogSessionBucketName', {
  value: catalogSessionBucket.bucketName,
  description: 'S3 bucket for catalog session storage',
  exportName: 'CatalogSessionBucketName'
});

console.log('✅ Exported all function names and resource names as CloudFormation outputs');
console.log('✅ Frontend can now access actual deployed function names via amplify_outputs.json');
