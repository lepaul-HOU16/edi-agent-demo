import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableSimulationTool = defineFunction((scope: Construct) => {
  // Use simple ZIP deployment with boto3 only (no external dependencies)
  // This avoids Docker build issues and deploys instantly
  
  const func = new lambda.Function(scope, 'RenewableSimulationTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'simple_handler.handler',
    code: lambda.Code.fromAsset(join(__dirname)),
    timeout: Duration.seconds(90),
    memorySize: 2048,
    environment: {
      LOG_LEVEL: 'INFO'
    },
    description: 'Wake simulation tool (simple ZIP deployment)'
  });
  
  return func;
});
