import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableSimulationTool = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'RenewableSimulationTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(90),
    memorySize: 2048,
    environment: {
      S3_BUCKET: process.env.RENEWABLE_S3_BUCKET || '',
      LOG_LEVEL: 'INFO'
    },
    description: 'Wake simulation tool - stdlib only, no dependencies'
  });
});
