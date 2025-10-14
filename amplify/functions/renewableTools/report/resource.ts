import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableReportTool = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'RenewableReportTool', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(30),
    memorySize: 512,
    environment: {
      // Environment variables will be set in backend.ts to use actual Amplify storage bucket
      LOG_LEVEL: 'INFO'
    },
    description: 'Report generation tool - stdlib only, no dependencies'
  });
});
