import { defineFunction } from '@aws-amplify/backend';

export const agentProgressFunction = defineFunction({
  name: 'agentProgress',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',
  environment: {
    AGENT_PROGRESS_TABLE: process.env.AGENT_PROGRESS_TABLE || 'AgentProgress'
  }
});
