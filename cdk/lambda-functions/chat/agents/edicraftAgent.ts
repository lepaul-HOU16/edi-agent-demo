/**
 * EDIcraft Agent Wrapper
 * Invokes the Python Bedrock AgentCore runtime for EDIcraft
 * Requirements: 2.1, 2.3, 5.1, 5.2
 */

export interface EDIcraftResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
  connectionStatus?: string;
  error?: string;
}

import { BaseEnhancedAgent } from './BaseEnhancedAgent';
import { 
  addStreamingThoughtStep, 
  updateStreamingThoughtStep 
} from '../shared/thoughtStepStreaming';
import { EDIcraftMCPClient } from './edicraftAgent/mcpClient.js';

export class EDIcraftAgent extends BaseEnhancedAgent {
  private mcpClient: EDIcraftMCPClient | null = null;
  private agentId: string;
  private agentAliasId: string;
  
  constructor() {
    super();
    
    // Get agent configuration from environment
    this.agentId = process.env.BEDROCK_AGENT_ID || '';
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';
    const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
    
    // Initialize MCP client with full configuration
    try {
      this.mcpClient = new EDIcraftMCPClient({
        bedrockAgentId: this.agentId,
        bedrockAgentAliasId: this.agentAliasId,
        region,
        minecraftHost: process.env.MINECRAFT_HOST || '',
        minecraftPort: parseInt(process.env.MINECRAFT_PORT || '25575'),
        minecraftRconPassword: process.env.MINECRAFT_RCON_PASSWORD || '',
        ediPlatformUrl: process.env.EDI_PLATFORM_URL || '',
        ediPartition: process.env.EDI_PARTITION || ''
      });
      
      console.log('✅ EDIcraftAgent initialized with MCP client', {
        region,
        agentId: this.agentId ? '***configured***' : 'NOT SET',
        agentAliasId: this.agentAliasId,
        minecraftHost: process.env.MINECRAFT_HOST || 'NOT SET',
        minecraftPort: process.env.MINECRAFT_PORT || 'NOT SET'
      });
    } catch (error) {
      console.error('❌ Failed to initialize MCP client:', error);
      this.mcpClient = null;
    }
  }

  /**
   * Process a message through the EDIcraft MCP Client
   * Requirements: 2.1, 2.3, 5.1, 5.2
   */
  async processMessage(
    message: string, 
    sessionContext?: { chatSessionId?: string; userId?: string }
  ): Promise<EDIcraftResponse> {
    console.log('🎮 EDIcraftAgent: Processing message:', message);
    
    // Validate MCP client is initialized
    if (!this.mcpClient) {
      console.error('❌ EDIcraftAgent: MCP client not initialized');
      return {
        success: false,
        message: 'EDIcraft agent is not properly configured. Please check environment variables.',
        artifacts: [],
        thoughtSteps: [],
        connectionStatus: 'not_configured',
        error: 'MCP client not initialized'
      };
    }
    
    // Validate configuration
    if (!this.agentId || this.agentId === 'your_agent_id_here') {
      console.error('❌ EDIcraftAgent: BEDROCK_AGENT_ID not configured');
      return {
        success: false,
        message: 'EDIcraft agent is not configured. Please set BEDROCK_AGENT_ID environment variable.',
        artifacts: [],
        thoughtSteps: [],
        connectionStatus: 'not_configured',
        error: 'BEDROCK_AGENT_ID not set'
      };
    }
    
    try {
      // Use MCP client to process the message
      console.log('🎮 EDIcraftAgent: Delegating to MCP client');
      const response = await this.mcpClient.processMessage(message);
      
      console.log('✅ EDIcraftAgent: MCP client response received', {
        success: response.success,
        messageLength: response.message?.length || 0,
        thoughtStepsCount: response.thoughtSteps?.length || 0
      });
      
      return {
        success: response.success,
        message: response.message,
        artifacts: [],
        thoughtSteps: response.thoughtSteps || [],
        connectionStatus: response.connectionStatus || 'connected'
      };

    } catch (error: any) {
      console.error('❌ EDIcraftAgent error:', error);
      
      // Categorize error
      let errorMessage = 'Error processing EDIcraft request';
      let connectionStatus = 'error';
      
      if (error.message?.includes('not found')) {
        errorMessage = 'EDIcraft agent not found. Please verify BEDROCK_AGENT_ID is correct.';
        connectionStatus = 'not_found';
      } else if (error.message?.includes('Access denied') || error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Lambda needs bedrock-agent-runtime:InvokeAgent permission.';
        connectionStatus = 'permission_denied';
      } else if (error.message) {
        errorMessage = `EDIcraft agent error: ${error.message}`;
      }
      
      return {
        success: false,
        message: errorMessage,
        artifacts: [],
        thoughtSteps: [],
        connectionStatus,
        error: error.message || 'Unknown error'
      };
    }
  }
}
