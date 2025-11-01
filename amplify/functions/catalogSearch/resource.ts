import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createCatalogSearchLayer } from '../../layers/catalogSearchLayer/resource';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Catalog Search Lambda Function
 * 
 * Single Python Lambda function for OSDU catalog search functionality.
 * Handles:
 * - S3 session management
 * - Strands Agent integration
 * - OSDU API search
 * - Streaming responses via AppSync GraphQL
 * 
 * NOTE: CATALOG_S3_BUCKET will be set dynamically in backend.ts
 * to use the catalog session bucket created in the deploying account
 */
export const catalogSearchFunction = defineFunction((scope: Construct) => {
  // Create the layer with dependencies
  const catalogSearchLayer = createCatalogSearchLayer(scope);
  
  return new lambda.Function(scope, 'CatalogSearchFunction', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.lambda_handler',
    code: lambda.Code.fromAsset(__dirname),
    layers: [catalogSearchLayer],
    architecture: lambda.Architecture.ARM_64,
    timeout: Duration.seconds(300), // 5 minutes for OSDU queries
    memorySize: 1024,
    environment: {
      // CATALOG_S3_BUCKET will be set in backend.ts to use the dynamically created bucket
      OSDU_BASE_URL: process.env.OSDU_BASE_URL || 'https://osdu.vavourak.people.aws.dev',
      OSDU_PARTITION_ID: process.env.OSDU_PARTITION_ID || 'osdu',
      EDI_USERNAME: process.env.EDI_USERNAME || 'edi-user',
      EDI_PASSWORD: process.env.EDI_PASSWORD || 'Asd!1edi',
      EDI_CLIENT_ID: process.env.EDI_CLIENT_ID || '7se4hblptk74h59ghbb694ovj4',
      EDI_CLIENT_SECRET: process.env.EDI_CLIENT_SECRET || 'k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi',
      COGNITO_REGION: process.env.COGNITO_REGION || 'us-east-1',
      OSDU_QUERY_MODEL: process.env.OSDU_QUERY_MODEL || 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
      STRANDS_AGENT_MODEL: process.env.STRANDS_AGENT_MODEL || 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    },
    description: 'Catalog search Lambda function with S3 session management, Strands Agent, and OSDU integration'
  });
});
