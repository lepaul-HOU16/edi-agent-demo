/**
 * Maintenance Agent Lambda Function Resource Definition
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { defineFunction } from '@aws-amplify/backend';

export const maintenanceAgentFunction = defineFunction({
  name: 'maintenanceAgent',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    S3_BUCKET: process.env.S3_BUCKET || ''
  }
});
