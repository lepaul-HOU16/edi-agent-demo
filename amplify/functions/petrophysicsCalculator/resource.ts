import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const petrophysicsCalculator = defineFunction((scope: Construct) => {
  // Use Docker container for Python dependencies (pandas, numpy)
  // Following the same pattern as renewable energy tools
  const func = new lambda.DockerImageFunction(scope, 'PetrophysicsCalculator', {
    code: lambda.DockerImageCode.fromImageAsset(__dirname, {
      file: 'Dockerfile',
      // Cache bust only when code version changes (not on every build)
      buildArgs: {
        CODE_VERSION: '2025-11-05-curves-fix'
      }
    }),
    timeout: Duration.seconds(300),
    memorySize: 1024,
    architecture: lambda.Architecture.X86_64,
    environment: {
      S3_BUCKET: process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
      WELL_DATA_PREFIX: 'global/well-data/',
      LOG_LEVEL: 'INFO',
      // Version to track deployments
      CODE_VERSION: '2025-11-05-curves-fix'
    },
    description: 'Petrophysical calculations with Python dependencies (pandas, numpy) - v2025-11-05'
  });
  
  return func;
});