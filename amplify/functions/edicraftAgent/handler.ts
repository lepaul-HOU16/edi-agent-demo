/**
 * EDIcraft Agent Handler
 * AWS Lambda handler for the EDIcraft Minecraft-based subsurface data visualization agent
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 13.4, 13.5
 */

import { AppSyncResolverEvent } from 'aws-lambda';
import { EDIcraftMCPClient } from './mcpClient.js';

type EDIcraftAgentResponse = {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
  error?: string;
  connectionStatus?: string;
};

type ValidationResult = {
  isValid: boolean;
  missingVariables: string[];
  invalidVariables: { name: string; reason: string }[];
};

/**
 * Validate all required environment variables
 * Requirements: 4.1, 4.2, 4.3
 */
function validateEnvironmentVariables(): ValidationResult {
  const requiredVariables = [
    'BEDROCK_AGENT_ID',
    'BEDROCK_AGENT_ALIAS_ID',
    'MINECRAFT_HOST',
    'MINECRAFT_PORT',
    'MINECRAFT_RCON_PASSWORD',
    'EDI_USERNAME',
    'EDI_PASSWORD',
    'EDI_CLIENT_ID',
    'EDI_CLIENT_SECRET',
    'EDI_PARTITION',
    'EDI_PLATFORM_URL'
  ];

  const missingVariables: string[] = [];
  const invalidVariables: { name: string; reason: string }[] = [];

  // Check for missing variables
  for (const varName of requiredVariables) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVariables.push(varName);
    }
  }

  // Validate BEDROCK_AGENT_ID format (should match AWS agent ID pattern)
  const agentId = process.env.BEDROCK_AGENT_ID;
  if (agentId && agentId.trim() !== '') {
    // AWS Bedrock Agent IDs follow pattern: [A-Z0-9]{10}
    const agentIdPattern = /^[A-Z0-9]{10}$/;
    if (!agentIdPattern.test(agentId)) {
      invalidVariables.push({
        name: 'BEDROCK_AGENT_ID',
        reason: 'Invalid format. Expected 10 uppercase alphanumeric characters (e.g., ABCD123456)'
      });
    }
  }

  // Validate BEDROCK_AGENT_ALIAS_ID format
  const aliasId = process.env.BEDROCK_AGENT_ALIAS_ID;
  if (aliasId && aliasId.trim() !== '') {
    // AWS Bedrock Agent Alias IDs follow pattern: [A-Z0-9]{10} or TSTALIASID
    const aliasIdPattern = /^([A-Z0-9]{10}|TSTALIASID)$/;
    if (!aliasIdPattern.test(aliasId)) {
      invalidVariables.push({
        name: 'BEDROCK_AGENT_ALIAS_ID',
        reason: 'Invalid format. Expected 10 uppercase alphanumeric characters or "TSTALIASID"'
      });
    }
  }

  // Validate MINECRAFT_PORT is a valid port number
  const port = process.env.MINECRAFT_PORT;
  if (port && port.trim() !== '') {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      invalidVariables.push({
        name: 'MINECRAFT_PORT',
        reason: 'Invalid port number. Must be between 1 and 65535'
      });
    }
  }

  // Validate EDI_PLATFORM_URL is a valid URL
  const platformUrl = process.env.EDI_PLATFORM_URL;
  if (platformUrl && platformUrl.trim() !== '') {
    try {
      new URL(platformUrl);
    } catch (e) {
      invalidVariables.push({
        name: 'EDI_PLATFORM_URL',
        reason: 'Invalid URL format. Must be a valid HTTP/HTTPS URL'
      });
    }
  }

  return {
    isValid: missingVariables.length === 0 && invalidVariables.length === 0,
    missingVariables,
    invalidVariables
  };
}

/**
 * Build user-friendly error message for environment variable issues
 * Requirements: 4.2
 */
function buildEnvironmentErrorMessage(validation: ValidationResult): string {
  let message = '❌ EDIcraft Agent Configuration Error\n\n';
  message += 'The EDIcraft agent requires proper configuration before it can connect to Minecraft and OSDU platforms.\n\n';

  if (validation.missingVariables.length > 0) {
    message += '🔴 Missing Required Environment Variables:\n';
    validation.missingVariables.forEach(varName => {
      message += `   • ${varName}\n`;
    });
    message += '\n';
  }

  if (validation.invalidVariables.length > 0) {
    message += '⚠️  Invalid Environment Variables:\n';
    validation.invalidVariables.forEach(({ name, reason }) => {
      message += `   • ${name}: ${reason}\n`;
    });
    message += '\n';
  }

  message += '📋 Required Configuration:\n\n';
  message += '**Bedrock AgentCore:**\n';
  message += '   • BEDROCK_AGENT_ID - AWS Bedrock Agent ID (10 alphanumeric characters)\n';
  message += '   • BEDROCK_AGENT_ALIAS_ID - Agent alias ID (10 alphanumeric or "TSTALIASID")\n\n';
  
  message += '**Minecraft Server:**\n';
  message += '   • MINECRAFT_HOST - Server hostname (e.g., edicraft.nigelgardiner.com)\n';
  message += '   • MINECRAFT_PORT - Server port (e.g., 49000)\n';
  message += '   • MINECRAFT_RCON_PASSWORD - RCON authentication password\n\n';
  
  message += '**OSDU Platform:**\n';
  message += '   • EDI_USERNAME - OSDU platform username\n';
  message += '   • EDI_PASSWORD - OSDU platform password\n';
  message += '   • EDI_CLIENT_ID - OAuth client ID\n';
  message += '   • EDI_CLIENT_SECRET - OAuth client secret\n';
  message += '   • EDI_PARTITION - Data partition name\n';
  message += '   • EDI_PLATFORM_URL - Platform API URL\n\n';
  
  message += '🔧 To fix this issue:\n';
  message += '1. Set the missing/invalid environment variables in your Lambda function configuration\n';
  message += '2. Refer to the deployment guide: edicraft-agent/DEPLOYMENT_GUIDE.md\n';
  message += '3. Restart the sandbox after updating configuration: npx ampx sandbox\n';

  return message;
}

export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<EDIcraftAgentResponse> => {
  console.log('=== EDICRAFT AGENT INVOKED ===');
  console.log('Event arguments:', JSON.stringify(event.arguments, null, 2));
  
  try {
    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) {
      throw new Error("userId is required");
    }

    const message = event.arguments.message;
    if (!message || message.trim() === '') {
      throw new Error("Message cannot be empty");
    }

    // Validate environment variables before proceeding
    const validation = validateEnvironmentVariables();
    if (!validation.isValid) {
      const errorMessage = buildEnvironmentErrorMessage(validation);
      console.error('Environment validation failed:', errorMessage);
      return {
        success: false,
        message: errorMessage,
        artifacts: [],
        thoughtSteps: [],
        error: 'INVALID_CONFIG',
        connectionStatus: 'error'
      };
    }

    // Initialize MCP client
    const mcpClient = new EDIcraftMCPClient({
      minecraftHost: process.env.MINECRAFT_HOST || 'edicraft.nigelgardiner.com',
      minecraftPort: parseInt(process.env.MINECRAFT_PORT || '49000'),
      rconPassword: process.env.MINECRAFT_RCON_PASSWORD || '',
      ediUsername: process.env.EDI_USERNAME || '',
      ediPassword: process.env.EDI_PASSWORD || '',
      ediClientId: process.env.EDI_CLIENT_ID || '',
      ediClientSecret: process.env.EDI_CLIENT_SECRET || '',
      ediPartition: process.env.EDI_PARTITION || '',
      ediPlatformUrl: process.env.EDI_PLATFORM_URL || '',
      bedrockAgentId: process.env.BEDROCK_AGENT_ID || '',
      bedrockAgentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || '',
      region: process.env.AWS_REGION || 'us-east-1'
    });

    console.log('Processing EDIcraft message:', message);
    
    // Process message through MCP server
    const response = await mcpClient.processMessage(message);
    
    console.log('EDIcraft agent response:', JSON.stringify(response, null, 2));

    // Return response with no visual artifacts (visualization occurs in Minecraft)
    return {
      success: response.success,
      message: response.message || 'No response generated',
      artifacts: [], // No visual artifacts - visualization is in Minecraft
      thoughtSteps: response.thoughtSteps || [],
      connectionStatus: response.connectionStatus
    };

  } catch (error) {
    console.error('=== EDICRAFT HANDLER ERROR ===', error);
    
    // Categorize error for user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorType = categorizeError(errorMessage);
    
    return {
      success: false,
      message: getUserFriendlyErrorMessage(errorType, errorMessage),
      artifacts: [],
      thoughtSteps: [],
      error: errorMessage,
      connectionStatus: 'error'
    };
  }
};

/**
 * Categorize error types for better user feedback
 */
function categorizeError(errorMessage: string): string {
  if (errorMessage.includes('INVALID_CONFIG') || errorMessage.includes('Configuration Error')) {
    return 'INVALID_CONFIG';
  }
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
    return 'CONNECTION_REFUSED';
  }
  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
    return 'TIMEOUT';
  }
  if (errorMessage.includes('EAUTH') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return 'AUTH_FAILED';
  }
  if (errorMessage.includes('OSDU') || errorMessage.includes('platform')) {
    return 'OSDU_ERROR';
  }
  if (errorMessage.includes('agent') && errorMessage.includes('not') && (errorMessage.includes('deployed') || errorMessage.includes('found'))) {
    return 'AGENT_NOT_DEPLOYED';
  }
  return 'UNKNOWN';
}

/**
 * Get user-friendly error messages with troubleshooting information
 * Requirements: 13.4, 13.5, 4.4, 4.5
 */
function getUserFriendlyErrorMessage(errorType: string, originalError: string): string {
  switch (errorType) {
    case 'INVALID_CONFIG':
      return originalError; // Already formatted by buildEnvironmentErrorMessage
    
    case 'AGENT_NOT_DEPLOYED':
      return `❌ Bedrock AgentCore Not Deployed\n\n` +
             `The EDIcraft agent requires a deployed Bedrock AgentCore instance.\n\n` +
             `📋 Deployment Steps:\n` +
             `1. Navigate to the edicraft-agent directory\n` +
             `2. Follow the deployment guide: BEDROCK_AGENTCORE_DEPLOYMENT.md\n` +
             `3. Deploy the agent using: make deploy\n` +
             `4. Update BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID environment variables\n` +
             `5. Restart the sandbox: npx ampx sandbox\n\n` +
             `Error details: ${originalError}`;
    
    case 'CONNECTION_REFUSED':
      return `❌ Unable to Connect to Minecraft Server\n\n` +
             `Cannot connect to Minecraft server at ${process.env.MINECRAFT_HOST}:${process.env.MINECRAFT_PORT}\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify the Minecraft server is running\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm the server is accessible from this network\n` +
             `4. Verify firewall rules allow connections on port ${process.env.MINECRAFT_PORT}\n` +
             `5. Test connection: telnet ${process.env.MINECRAFT_HOST} ${process.env.MINECRAFT_PORT}`;
    
    case 'TIMEOUT':
      return `⏱️ Connection Timeout\n\n` +
             `Connection to Minecraft server timed out.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Check network connectivity to ${process.env.MINECRAFT_HOST}\n` +
             `2. Verify server is not under heavy load\n` +
             `3. Check firewall or security group settings\n` +
             `4. Increase timeout if server is slow to respond`;
    
    case 'AUTH_FAILED':
      return `🔐 Authentication Failed\n\n` +
             `Unable to authenticate with Minecraft server or OSDU platform.\n\n` +
             `🔧 Troubleshooting Steps:\n\n` +
             `**For Minecraft RCON:**\n` +
             `1. Verify RCON password is correct (MINECRAFT_RCON_PASSWORD)\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm RCON port matches server configuration\n\n` +
             `**For OSDU Platform:**\n` +
             `1. Verify EDI_USERNAME and EDI_PASSWORD are correct\n` +
             `2. Check EDI_CLIENT_ID and EDI_CLIENT_SECRET are valid\n` +
             `3. Confirm user has necessary permissions`;
    
    case 'OSDU_ERROR':
      return `🌐 OSDU Platform Error\n\n` +
             `Error accessing OSDU platform.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify OSDU platform credentials are correct\n` +
             `2. Check platform URL is accessible: ${process.env.EDI_PLATFORM_URL}\n` +
             `3. Confirm user has necessary permissions\n` +
             `4. Verify partition name is correct: ${process.env.EDI_PARTITION}\n` +
             `5. Check platform status and availability\n\n` +
             `Error details: ${originalError}`;
    
    default:
      return `❌ An Error Occurred\n\n` +
             `${originalError}\n\n` +
             `🔧 General Troubleshooting:\n` +
             `1. Check Minecraft server status\n` +
             `2. Verify OSDU platform connectivity\n` +
             `3. Review environment variable configuration\n` +
             `4. Check CloudWatch logs for detailed error information`;
  }
}
