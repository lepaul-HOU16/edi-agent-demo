/**
 * Enhanced Strands Agent Resource Configuration
 * AWS Lambda function resource for enhanced petrophysical analysis
 */

import { defineFunction } from '@aws-amplify/backend';

export const enhancedStrandsAgent = defineFunction({
  name: 'enhancedStrandsAgent',
  entry: './handler.ts',
  environment: {
    S3_BUCKET: process.env.S3_BUCKET || '',
  },
  timeoutSeconds: 300, // 5 minutes for complex workflows
  memoryMB: 1024, // Increased memory for calculation engines
});