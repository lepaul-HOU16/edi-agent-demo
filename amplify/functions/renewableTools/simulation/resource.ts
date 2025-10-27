import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const renewableSimulationTool = defineFunction((scope: Construct) => {
  // Use Docker deployment with full visualization libraries (numpy, matplotlib, plotly)
  // Build context is parent directory to include shared modules
  const parentDir = dirname(__dirname);
  
  const func = new lambda.DockerImageFunction(scope, 'RenewableSimulationTool', {
    code: lambda.DockerImageCode.fromImageAsset(parentDir, {
      file: 'simulation/Dockerfile',
    }),
    timeout: Duration.seconds(300),
    memorySize: 3008,
    architecture: lambda.Architecture.X86_64,
    environment: {
      LOG_LEVEL: 'INFO'
    },
    description: 'Wake simulation and wind rose tool with Plotly visualization generation'
  });
  
  return func;
});
