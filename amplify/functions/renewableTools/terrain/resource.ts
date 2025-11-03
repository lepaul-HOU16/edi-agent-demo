import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableTerrainTool = defineFunction((scope: Construct) => {
  // Use Docker container for 10GB response limit (vs 6MB for ZIP)
  // This allows us to include full mapHtml in response without size issues
  // Build context is parent directory to include shared visualization modules
  const parentDir = dirname(__dirname);
  
  const func = new lambda.DockerImageFunction(scope, 'RenewableTerrainTool', {
    code: lambda.DockerImageCode.fromImageAsset(parentDir, {
      file: 'terrain/Dockerfile',
    }),
    timeout: Duration.seconds(60),
    memorySize: 1024,
    architecture: lambda.Architecture.X86_64,
    environment: {
      LOG_LEVEL: 'INFO'
    },
    description: 'Terrain analysis tool with Docker deployment (10GB response limit)'
  });
  
  return func;
});
