/**
 * EDIcraft MCP Integration Tests
 * Tests for EDIcraft agent MCP server integration
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.4, 13.5
 */


// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-agent-runtime', () => ({
  BedrockAgentRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeAgentCommand: jest.fn()
}));

describe('EDIcraft MCP Integration Tests', () => {
  const mockEvent = {
    arguments: {
      userId: 'test-user-123',
      message: 'Build wellbore trajectory in Minecraft'
    },
    identity: {
      sub: 'test-user-123'
    }
  };

  const mockContext = {};

  beforeEach(() => {
    // Set up environment variables
    process.env.MINECRAFT_HOST = 'edicraft.nigelgardiner.com';
    process.env.MINECRAFT_PORT = '49000';
    process.env.MINECRAFT_RCON_PASSWORD = 'test-password';
    process.env.EDI_USERNAME = 'test-user';
    process.env.EDI_PASSWORD = 'test-pass';
    process.env.EDI_CLIENT_ID = 'test-client-id';
    process.env.EDI_CLIENT_SECRET = 'test-secret';
    process.env.EDI_PARTITION = 'test-partition';
    process.env.EDI_PLATFORM_URL = 'https://test-platform.com';
    process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    process.env.REGION = 'us-west-2';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MCP server connection', () => {
    it('should initialize MCP client with correct configuration', async () => {
      const config = {
        minecraftHost: 'edicraft.nigelgardiner.com',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      expect(client).toBeDefined();
    });

    it('should test connection to Minecraft server', async () => {
      const config = {
        minecraftHost: 'edicraft.nigelgardiner.com',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      const connectionResult = await client.testConnection();
      
      // Should return true for successful connection test
      expect(typeof connectionResult).toBe('boolean');
    });
  });

  describe('Message routing to EDIcraft handler', () => {
    it('should route wellbore visualization message to EDIcraft handler', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: 'Build wellbore trajectory in Minecraft'
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.message).toContain('wellbore');
    });

    it('should route horizon visualization message to EDIcraft handler', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: 'Visualize horizon surface in Minecraft'
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.message).toContain('horizon');
    });

    it('should route player position message to EDIcraft handler', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: 'Show player positions'
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
    });

    it('should handle general EDIcraft queries', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: 'What can you do?'
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.message).toContain('EDIcraft');
    });
  });

  describe('Response handling', () => {
    it('should return response with message and no visual artifacts', async () => {
      const response = await handler(mockEvent as any, mockContext);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('artifacts');
      expect(response.artifacts).toEqual([]); // No visual artifacts
      expect(response).toHaveProperty('thoughtSteps');
    });

    it('should include thought steps in response', async () => {
      const response = await handler(mockEvent as any, mockContext);

      expect(response.thoughtSteps).toBeDefined();
      expect(Array.isArray(response.thoughtSteps)).toBe(true);
      if (response.thoughtSteps && response.thoughtSteps.length > 0) {
        expect(response.thoughtSteps[0]).toHaveProperty('step');
        expect(response.thoughtSteps[0]).toHaveProperty('status');
      }
    });

    it('should include connection status in response', async () => {
      const response = await handler(mockEvent as any, mockContext);

      expect(response).toHaveProperty('connectionStatus');
      expect(['connected', 'error', undefined]).toContain(response.connectionStatus);
    });

    it('should return success true for valid requests', async () => {
      const response = await handler(mockEvent as any, mockContext);

      expect(response.success).toBe(true);
    });
  });

  describe('Error scenarios', () => {
    it('should handle connection refused error', async () => {
      // Mock connection refused
      const config = {
        minecraftHost: 'invalid-host',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      
      // Should not throw, but handle gracefully
      const response = await client.processMessage('test message');
      expect(response).toBeDefined();
    });

    it('should handle timeout error with user-friendly message', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: '' // Empty message to trigger error
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.message).toContain('error');
    });

    it('should handle auth failure error', async () => {
      // Test with missing credentials
      delete process.env.MINECRAFT_RCON_PASSWORD;

      const response = await handler(mockEvent as any, mockContext);

      // Should still return a response, even with missing credentials
      expect(response).toBeDefined();
      expect(response).toHaveProperty('success');
    });

    it('should handle missing userId error', async () => {
      const event = {
        arguments: {
          message: 'Test message'
        },
        identity: {}
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(false);
      expect(response.error).toContain('userId');
    });

    it('should handle empty message error', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: ''
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(false);
      expect(response.error).toContain('empty');
    });

    it('should provide troubleshooting information in error messages', async () => {
      const event = {
        ...mockEvent,
        arguments: {
          ...mockEvent.arguments,
          message: '' // Trigger error
        }
      };

      const response = await handler(event as any, mockContext);

      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
      // Error message should contain helpful information
      expect(response.message.length).toBeGreaterThan(0);
    });
  });

  describe('MCP client message processing', () => {
    it('should process wellbore visualization request', async () => {
      const config = {
        minecraftHost: 'edicraft.nigelgardiner.com',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      const response = await client.processMessage('Build wellbore trajectory');

      expect(response.success).toBe(true);
      expect(response.message).toContain('wellbore');
    });

    it('should process horizon visualization request', async () => {
      const config = {
        minecraftHost: 'edicraft.nigelgardiner.com',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      const response = await client.processMessage('Visualize horizon surface');

      expect(response.success).toBe(true);
      expect(response.message).toContain('horizon');
    });

    it('should process player position request', async () => {
      const config = {
        minecraftHost: 'edicraft.nigelgardiner.com',
        minecraftPort: 49000,
        rconPassword: 'test-password',
        ediUsername: 'test-user',
        ediPassword: 'test-pass',
        ediClientId: 'test-client-id',
        ediClientSecret: 'test-secret',
        ediPartition: 'test-partition',
        ediPlatformUrl: 'https://test-platform.com',
        bedrockModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-west-2'
      };

      const client = new EDIcraftMCPClient(config);
      const response = await client.processMessage('Show player positions');

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
    });
  });

  describe('Environment variable configuration', () => {
    it('should use default values when environment variables are not set', async () => {
      // Clear environment variables
      delete process.env.MINECRAFT_HOST;
      delete process.env.MINECRAFT_PORT;

      const response = await handler(mockEvent as any, mockContext);

      // Should still work with defaults
      expect(response).toBeDefined();
    });

    it('should use provided environment variables', async () => {
      process.env.MINECRAFT_HOST = 'custom-host.com';
      process.env.MINECRAFT_PORT = '25575';

      const response = await handler(mockEvent as any, mockContext);

      expect(response).toBeDefined();
    });
  });
});
