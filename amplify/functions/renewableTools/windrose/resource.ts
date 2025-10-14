import { defineFunction } from '@aws-amplify/backend';

export const renewableWindRoseTool = defineFunction({
  name: 'renewableWindRoseTool',
  entry: './simple_handler.py',
  runtime: 'python3.12' as any,
  timeoutSeconds: 300,
  memoryMB: 1024,
});
