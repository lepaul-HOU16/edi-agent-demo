/**
 * Tests for writeResultsToChatMessage function
 * Verifies DynamoDB write operations for async job results
 */

// Create mock functions that will be used in the mocks
const mockDynamoSend = jest.fn();
const mockPutCommand = jest.fn();
const mockLambdaSend = jest.fn();

// Mock DynamoDB
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: (...args: any[]) => mockDynamoSend(...args)
    }))
  },
  PutCommand: jest.fn((params) => {
    mockPutCommand(params);
    return params;
  })
}));

// Mock Lambda client
jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: (...args: any[]) => mockLambdaSend(...args)
  })),
  InvokeCommand: jest.fn((params) => params)
}));

import { handler } from '../handler';
import type { OrchestratorRequest, OrchestratorResponse } from '../types';

describe('writeResultsToChatMessage', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME: 'ChatMessage-test',
      RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: 'test-terrain-function',
      RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: 'test-layout-function',
      RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: 'test-simulation-function',
      RENEWABLE_REPORT_TOOL_FUNCTION_NAME: 'test-report-function'
    };
    
    // Default mock implementation for successful DynamoDB write
    mockDynamoSend.mockResolvedValue({});
    mockLambdaSend.mockResolvedValue({
      Payload: JSON.stringify({
        success: true,
        type: 'terrain_analysis',
        data: { message: 'Mock terrain analysis' }
      })
    });
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('Async Mode Detection', () => {
    it('should write to DynamoDB when sessionId and userId are provided', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify DynamoDB PutCommand was called
      expect(mockPutCommand).toHaveBeenCalled();
      expect(mockDynamoSend).toHaveBeenCalled();
      
      // Verify the command structure
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      expect(putCommandCall.TableName).toBe('ChatMessage-test');
      expect(putCommandCall.Item).toMatchObject({
        chatSessionId: 'session-123',
        owner: 'user-456',
        role: 'ai',
        responseComplete: true
      });
    });
    
    it('should NOT write to DynamoDB when sessionId is missing', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify DynamoDB was NOT called
      expect(mockPutCommand).not.toHaveBeenCalled();
      expect(mockDynamoSend).not.toHaveBeenCalled();
    });
    
    it('should NOT write to DynamoDB when userId is missing', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        context: {}
      };
      
      await handler(request);
      
      // Verify DynamoDB was NOT called
      expect(mockPutCommand).not.toHaveBeenCalled();
      expect(mockDynamoSend).not.toHaveBeenCalled();
    });
  });
  
  describe('ChatMessage Structure', () => {
    it('should create valid ChatMessage with all required fields', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      const chatMessage = putCommandCall.Item;
      
      // Verify required fields
      expect(chatMessage).toHaveProperty('id');
      expect(chatMessage).toHaveProperty('chatSessionId', 'session-123');
      expect(chatMessage).toHaveProperty('owner', 'user-456');
      expect(chatMessage).toHaveProperty('role', 'ai');
      expect(chatMessage).toHaveProperty('content');
      expect(chatMessage.content).toHaveProperty('text');
      expect(chatMessage).toHaveProperty('responseComplete', true);
      expect(chatMessage).toHaveProperty('artifacts');
      expect(chatMessage).toHaveProperty('thoughtSteps');
      expect(chatMessage).toHaveProperty('createdAt');
      expect(chatMessage).toHaveProperty('updatedAt');
    });
    
    it('should include artifacts in ChatMessage', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      const chatMessage = putCommandCall.Item;
      
      // Verify artifacts array exists
      expect(Array.isArray(chatMessage.artifacts)).toBe(true);
      
      // For terrain analysis, should have artifacts
      if (chatMessage.artifacts.length > 0) {
        expect(chatMessage.artifacts[0]).toHaveProperty('type');
        expect(chatMessage.artifacts[0]).toHaveProperty('data');
      }
    });
    
    it('should include thoughtSteps in ChatMessage', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      const chatMessage = putCommandCall.Item;
      
      // Verify thoughtSteps array exists
      expect(Array.isArray(chatMessage.thoughtSteps)).toBe(true);
      expect(chatMessage.thoughtSteps.length).toBeGreaterThan(0);
      
      // Verify thoughtStep structure
      const firstStep = chatMessage.thoughtSteps[0];
      expect(firstStep).toHaveProperty('step');
      expect(firstStep).toHaveProperty('action');
      expect(firstStep).toHaveProperty('reasoning');
    });
    
    it('should generate unique message IDs', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      // Call handler twice
      await handler(request);
      const firstId = mockPutCommand.mock.calls[0][0].Item.id;
      
      mockPutCommand.mockClear();
      mockDynamoSend.mockClear();
      mockLambdaSend.mockResolvedValue({
        Payload: JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { message: 'Mock terrain analysis' }
        })
      });
      
      await handler(request);
      const secondId = mockPutCommand.mock.calls[0][0].Item.id;
      
      // IDs should be different
      expect(firstId).not.toBe(secondId);
      expect(firstId).toMatch(/^msg-\d+-[a-z0-9]+$/);
      expect(secondId).toMatch(/^msg-\d+-[a-z0-9]+$/);
    }, 10000); // Increase timeout for this test
  });
  
  describe('Error Handling', () => {
    it('should handle DynamoDB write failures gracefully', async () => {
      // Mock DynamoDB failure
      mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB write failed'));
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      // Should not throw - error should be caught and logged
      const response = await handler(request);
      
      // Response should still be successful (write failure doesn't affect orchestration)
      expect(response.success).toBe(true);
    });
    
    it('should handle missing table name environment variable', async () => {
      delete process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME;
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      // Should not throw
      const response = await handler(request);
      
      // Should still attempt to write with fallback table name
      expect(mockPutCommand).toHaveBeenCalled();
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      expect(putCommandCall.TableName).toBe('ChatMessage'); // Fallback name
    });
    
    it('should handle undefined artifacts gracefully', async () => {
      const request: OrchestratorRequest = {
        query: 'unknown query type',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      const response = await handler(request);
      
      // For unknown queries, DynamoDB write may not be called
      // But if it is called, artifacts should be an array
      if (mockPutCommand.mock.calls.length > 0) {
        const putCommandCall = mockPutCommand.mock.calls[0][0];
        const chatMessage = putCommandCall.Item;
        
        // Should have empty artifacts array, not undefined
        expect(Array.isArray(chatMessage.artifacts)).toBe(true);
      } else {
        // If not called, that's also acceptable for unknown queries
        expect(response.success).toBe(false);
      }
    });
  });
  
  describe('DynamoDB Configuration', () => {
    it('should use correct marshalling options', async () => {
      const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify DynamoDBDocumentClient.from was called with correct options
      expect(DynamoDBDocumentClient.from).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          marshallOptions: expect.objectContaining({
            removeUndefinedValues: true,
            convertEmptyValues: false,
            convertClassInstanceToMap: false
          })
        })
      );
    });
  });
  
  describe('Integration with Orchestrator Response', () => {
    it('should write complete orchestrator response to DynamoDB', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060 with 5km radius',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify orchestrator response structure
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('artifacts');
      expect(response).toHaveProperty('thoughtSteps');
      expect(response).toHaveProperty('metadata');
      
      // Verify DynamoDB write includes all response data
      const putCommandCall = mockPutCommand.mock.calls[0][0];
      const chatMessage = putCommandCall.Item;
      
      expect(chatMessage.content.text).toBe(response.message);
      expect(chatMessage.artifacts).toEqual(response.artifacts);
      expect(chatMessage.thoughtSteps).toEqual(response.thoughtSteps);
    });
  });
  
  describe('Logging', () => {
    it('should log async mode detection', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify async mode logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ASYNC MODE: Writing results to ChatMessage table')
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should log successful write to DynamoDB', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify success logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Results written to ChatMessage table'),
        expect.objectContaining({
          chatSessionId: 'session-123'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should log DynamoDB write failures', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockDynamoSend.mockRejectedValueOnce(new Error('DynamoDB write failed'));
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 40.7128, -74.0060',
        sessionId: 'session-123',
        userId: 'user-456',
        context: {}
      };
      
      await handler(request);
      
      // Verify error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write results to ChatMessage'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});
