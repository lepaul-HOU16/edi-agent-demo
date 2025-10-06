import { defineFunction } from '@aws-amplify/backend';

export const renewableTools = defineFunction({
  name: 'renewableTools',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    // Add NREL API key here or use Secrets Manager
    NREL_API_KEY: 'DEMO_KEY', // Replace with actual key
  },
});
