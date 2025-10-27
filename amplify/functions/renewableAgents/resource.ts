import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration, DockerImage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Renewable Energy Strands Agent Function
 * 
 * This function wraps the complete Strands Agent system including:
 * - Terrain analysis agent
 * - Layout optimization agent
 * - Wake simulation agent
 * - Report generation agent
 * - Multi-agent orchestration
 * 
 * USES DOCKER DEPLOYMENT due to heavy dependencies (geopandas, matplotlib, py-wake)
 */
export const renewableAgentsFunction = defineFunction((scope: Construct) => {
  return new lambda.DockerImageFunction(scope, 'RenewableAgentsFunction', {
    code: lambda.DockerImageCode.fromImageAsset(__dirname, {
      platform: Platform.LINUX_AMD64,
      buildArgs: {
        '--platform': 'linux/amd64',
      },
    }),
    timeout: Duration.minutes(15), // Agents can take time
    memorySize: 3008, // Need memory for PyWake simulations
    environment: {
      // Bedrock configuration (AWS_REGION is automatically set by Lambda runtime)
      BEDROCK_MODEL_ID: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      
      // Agent configuration
      GET_INFO_LOGS: 'true',
      DISABLE_CALLBACK_HANDLER: 'false',
      
      // MCP configuration (optional)
      USE_LOCAL_MCP: 'false',
      
      // S3 bucket for artifacts (will be set by backend.ts)
      RENEWABLE_S3_BUCKET: process.env.RENEWABLE_S3_BUCKET || '',
    },
    description: 'Strands Agent system for renewable energy wind farm development (Docker)',
  });
});
