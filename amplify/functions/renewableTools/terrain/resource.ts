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
  return new lambda.Function(scope, 'RenewableTerrainTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(60),
    memorySize: 1024,
    environment: {
      S3_BUCKET: process.env.RENEWABLE_S3_BUCKET || '',
      LOG_LEVEL: 'INFO'
    },
    description: 'Terrain analysis tool for renewable energy projects - Dependencies must be pre-installed or use Lambda Layer'
  });
});
