import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, agentFunction, catalogMapDataFunction, catalogSearchFunction, renewableToolsFunction } from './data/resource';
import { storage } from './storage/resource';
import { renewableAgentCoreProxy } from './functions/renewableAgentCoreProxy/resource';
import { aws_iam as iam, Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { McpServerConstruct } from './custom/mcpServer';
import { LocationServiceConstruct } from './custom/locationService';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

// Import NEW Lambda-based renewable energy functions
import { renewableOrchestrator } from './functions/renewableOrchestrator/resource';
import { renewableTerrainTool } from './functions/renewableTools/terrain/resource';
import { renewableLayoutTool } from './functions/renewableTools/layout/resource';
import { renewableSimulationTool } from './functions/renewableTools/simulation/resource';
import { renewableReportTool } from './functions/renewableTools/report/resource';
import { createRenewableDemoLayer } from './layers/renewableDemo/resource';

// Import Maintenance Agent
import { maintenanceAgentFunction } from './functions/maintenanceAgent/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  agentFunction,
  catalogMapDataFunction,
  catalogSearchFunction,
  renewableToolsFunction,
  renewableAgentCoreProxy,
  // NEW: Lambda-based renewable energy functions
  renewableOrchestrator,
  renewableTerrainTool,
  renewableLayoutTool,
  renewableSimulationTool,
  renewableReportTool,
  // Maintenance Agent
  maintenanceAgentFunction
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
const renewableDemoLayer = createRenewableDemoLayer(backend.stack);

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

console.log('✅ Renewable Energy Lambda functions registered successfully');
