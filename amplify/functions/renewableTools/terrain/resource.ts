import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableTerrainTool = defineFunction((scope: Construct) => {
  // Use simple ZIP deployment with boto3 only (no external dependencies)
  // This avoids Docker build issues and deploys instantly
  
  const func = new lambda.Function(scope, 'RenewableTerrainTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'simple_handler.handler',
    code: lambda.Code.fromAsset(join(__dirname)),
    timeout: Duration.seconds(60),
    memorySize: 1024,
    environment: {
      LOG_LEVEL: 'INFO'
    },
    description: 'Terrain analysis tool (simple ZIP deployment)'
  });
  
  return func;
});
