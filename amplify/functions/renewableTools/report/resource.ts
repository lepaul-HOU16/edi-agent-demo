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
      S3_BUCKET: process.env.RENEWABLE_S3_BUCKET || '',
      LOG_LEVEL: 'INFO'
    },
    description: 'Report generation tool - stdlib only, no dependencies'
  });
});
