/**
 * EDIcraft Agent Lambda Function Resource Definition
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { defineFunction } from '@aws-amplify/backend';

export const edicraftAgentFunction = defineFunction({
  name: 'edicraftAgent',
  entry: './handler.ts',
  timeoutSeconds: 600, // 10 minutes - Required for complex Bedrock AgentCore operations (Requirement 3.2)
  memoryMB: 1024,
  environment: {
    MINECRAFT_HOST: 'edicraft.nigelgardiner.com',
    MINECRAFT_PORT: '49001',
    MINECRAFT_RCON_PASSWORD: 'ediagents@OSDU2025demo',
    EDI_USERNAME: 'edi-user',
    EDI_PASSWORD: 'Asd!1edi',
    EDI_CLIENT_ID: '7se4hblptk74h59ghbb694ovj4',
    EDI_CLIENT_SECRET: 'k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi',
    EDI_PARTITION: 'osdu',
    EDI_PLATFORM_URL: 'https://osdu.vavourak.people.aws.dev',
    BEDROCK_MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    REGION: 'us-east-1',
    AGENT_NAME: 'edicraft',
    BEDROCK_AGENT_ID: 'edicraft-kl1b6iGNug',
    BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',
    BEDROCK_AGENTCORE_ARN: 'arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/edicraft-kl1b6iGNug'
  }
});
