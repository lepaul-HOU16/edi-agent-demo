import { defineFunction } from '@aws-amplify/backend';

export const renewableOrchestrator = defineFunction({
  name: 'renewableOrchestrator',
  entry: './handler.ts',
  timeoutSeconds: 90,
  memoryMB: 512,
  environment: {
    RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || '',
    RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME || '',
    RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || '',
    RENEWABLE_REPORT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME || ''
  }
});
