import { defineFunction } from '@aws-amplify/backend';

export const lightweightAgent = defineFunction({
  name: 'lightweightAgent',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  environment: {
    AGENT_MODEL_ID: 'us.anthropic.claude-3-haiku-20240307-v1:0'
  }
});
