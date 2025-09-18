import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, lightweightAgentFunction, catalogMapDataFunction, catalogSearchFunction } from './data/resource';
import { storage } from './storage/resource';
import { aws_iam as iam } from 'aws-cdk-lib';
import { McpServerConstruct } from './custom/mcpServer';

const backend = defineBackend({
  auth,
  data,
  storage,
  lightweightAgentFunction,
  catalogMapDataFunction,
  catalogSearchFunction
});

backend.stack.tags.setTag('Project', 'workshop-a4e');

// Add MCP Server with petrophysical capabilities
const mcpServer = new McpServerConstruct(backend.stack, 'McpServer', {});

<<<<<<< Updated upstream
// Add IAM permissions to the Lambda function
backend.lightweightAgentFunction.resources.lambda.addToRolePolicy(
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
=======
// Add IAM permissions to the Lambda functions
const s3PolicyStatement = new iam.PolicyStatement({
  actions: [
    "s3:ListBucket",
    "s3:GetObject"
  ],
  resources: [
    "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m",
    "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/*",
  ],
});

backend.lightweightAgentFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
backend.catalogMapDataFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
backend.catalogSearchFunction.resources.lambda.addToRolePolicy(s3PolicyStatement);
>>>>>>> Stashed changes

backend.lightweightAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel*"],
    resources: [
      `arn:aws:bedrock:us-*::foundation-model/*`,
      `arn:aws:bedrock:us-*:${backend.stack.account}:inference-profile/*`,
    ],
  })
);

// Add S3 permissions to MCP Server for petrophysical analysis
mcpServer.lambdaFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "s3:ListBucket",
      "s3:GetObject"
    ],
    resources: [
      "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m",
      "arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/*",
    ],
  })
);

// Add environment variables for S3 bucket access
mcpServer.lambdaFunction.addEnvironment('S3_BUCKET', 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m');
