import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Python Lambda using CDK since Amplify defineFunction doesn't support Python
export const renewableAgentCoreProxy = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'RenewableAgentCoreProxy', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(900), // 15 minutes for long-running agent calls
    memorySize: 512,
    environment: {
      AGENT_RUNTIME_ARN: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
    },
  });
});
