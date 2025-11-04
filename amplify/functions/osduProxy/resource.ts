import { defineFunction } from '@aws-amplify/backend';

export const osduProxyFunction = defineFunction({
  name: 'osduProxy',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    OSDU_API_URL: 'https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search',
    // OSDU_API_KEY will be set via backend.ts or deployment configuration
  }
});
