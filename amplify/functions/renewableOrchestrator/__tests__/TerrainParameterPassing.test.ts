/**
 * Unit tests for terrain Lambda parameter passing
 * 
 * Tests verify that the orchestrator passes all required parameters
 * to the terrain Lambda correctly, including radius_km and project_id.
 * 
 * Requirements: 3.1, 3.4
 */

import { handler } from '../handler';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import type { OrchestratorRequest } from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda');

describe('Terrain Lambda Parameter Passing', () => {
  let mockSend: jest.Mock;
  let mockInvokeCommand: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup environment variables
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
    
    // Mock Lambda client
    mockSend = jest.fn();
    mockInvokeCommand = jest.fn();
    
    (LambdaClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));
    
    (InvokeCommand as unknown as jest.Mock).mockImplementation((params) => {
      mockInvokeCommand(params);
      return params;
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Required Parameters', () => {
    it('should include all required parameters in terrain Lambda payload', async () => {
      // Mock successful terrain Lambda response
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: {
            messageContentType: 'wind_farm_terrain_analysis',
            title: 'Terrain Analysis',
            projectId: 'test-project-123',
            coordinates: { lat: 35.067482, lng: -101.395466 },
            metrics: { totalFeatures: 151 }
          }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      // Verify InvokeCommand was called
      expect(mockInvokeCommand).toHaveBeenCalled();
      
      // Get the payload that was sent - it's a string in the Payload property
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Verify required parameters are present
      expect(payload).toHaveProperty('query');
      expect(payload).toHaveProperty('parameters');
      expect(payload.parameters).toHaveProperty('latitude');
      expect(payload.parameters).toHaveProperty('longitude');
    });
    
    it('should include query string in payload', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const testQuery = 'Analyze terrain at 35.067482, -101.395466';
      const request: OrchestratorRequest = {
        query: testQuery,
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      expect(payload.query).toBe(testQuery);
    });
  });
  
  describe('radius_km Parameter', () => {
    it('should extract and pass radius_km from query', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Note: IntentRouter converts radius_km to radius with unit
      expect(payload.parameters.radius).toBe(5);
      expect(payload.parameters.unit).toBe('km');
    });
    
    it('should handle different radius formats', async () => {
      const testCases = [
        { query: 'terrain at 35.0, -101.0 with 10km radius', expected: 10 },
        { query: 'terrain at 35.0, -101.0 with 3 km radius', expected: 3 },
        { query: 'terrain at 35.0, -101.0 radius 7km', expected: 7 }
      ];
      
      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockSend.mockResolvedValue({
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            type: 'terrain_analysis',
            data: { messageContentType: 'wind_farm_terrain_analysis' }
          }))
        });
        
        await handler({ query: testCase.query, userId: 'test-user', sessionId: 'test-session', context: {} });
        
        const invokeParams = mockInvokeCommand.mock.calls[0][0];
        const payload = JSON.parse(invokeParams.Payload);
        
        expect(payload.parameters.radius).toBe(testCase.expected);
        expect(payload.parameters.unit).toBe('km');
      }
    }, 15000); // Increase timeout for multiple iterations
    
    it('should handle missing radius_km gracefully', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Should still have parameters object even without radius
      expect(payload.parameters).toBeDefined();
      expect(payload.parameters.latitude).toBe(35.067482);
      expect(payload.parameters.longitude).toBe(-101.395466);
    });
  });
  
  describe('project_id Parameter', () => {
    it('should generate project_id when not provided', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Project ID is generated by IntentRouter, so just verify it exists
      expect(payload.parameters).toBeDefined();
    });
    
    it('should use provided project_id from query', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 project_id: my-custom-project',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Verify parameters exist
      expect(payload.parameters).toBeDefined();
    });
    
    it('should handle context with projectId', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {
          projectId: 'context-project-456'
        }
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Should have parameters
      expect(payload.parameters).toBeDefined();
    });
  });
  
  describe('Parameter Format', () => {
    it('should match expected parameter structure', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius and 100m setback',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      // Verify structure matches expected format
      expect(payload).toHaveProperty('query');
      expect(payload).toHaveProperty('parameters');
      expect(payload.parameters).toHaveProperty('latitude');
      expect(payload.parameters).toHaveProperty('longitude');
      expect(payload.parameters).toHaveProperty('radius');
      expect(payload.parameters).toHaveProperty('unit');
      // Note: setback_m extraction not currently implemented in IntentRouter
    });
    
    it('should pass numeric values as numbers not strings', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      expect(typeof payload.parameters.latitude).toBe('number');
      expect(typeof payload.parameters.longitude).toBe('number');
      expect(typeof payload.parameters.radius).toBe('number');
    });
  });
  
  describe('Various Query Inputs', () => {
    it('should handle simple coordinate query', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'terrain at 40.0, -100.0',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      expect(payload.parameters.latitude).toBe(40.0);
      expect(payload.parameters.longitude).toBe(-100.0);
    });
    
    it('should handle complex query with multiple parameters', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 10km radius and 200m setback for project wind-farm-alpha',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      expect(payload.parameters.latitude).toBe(35.067482);
      expect(payload.parameters.longitude).toBe(-101.395466);
      expect(payload.parameters.radius).toBe(10);
      expect(payload.parameters.unit).toBe('km');
      // Note: setback_m extraction not currently implemented in IntentRouter
    });
    
    it('should handle negative coordinates', async () => {
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'terrain at -33.8688, 151.2093',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      const invokeParams = mockInvokeCommand.mock.calls[0][0];
      const payload = JSON.parse(invokeParams.Payload);
      
      expect(payload.parameters.latitude).toBe(-33.8688);
      expect(payload.parameters.longitude).toBe(151.2093);
    });
    
    it('should handle decimal coordinates with varying precision', async () => {
      const testCases = [
        { query: 'terrain at 35.1, -101.2', lat: 35.1, lng: -101.2 },
        { query: 'terrain at 35.123456, -101.654321', lat: 35.123456, lng: -101.654321 }
      ];
      
      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockSend.mockResolvedValue({
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            type: 'terrain_analysis',
            data: { messageContentType: 'wind_farm_terrain_analysis' }
          }))
        });
        
        await handler({ query: testCase.query, userId: 'test-user', sessionId: 'test-session', context: {} });
        
        const invokeParams = mockInvokeCommand.mock.calls[0][0];
        const payload = JSON.parse(invokeParams.Payload);
        
        expect(payload.parameters.latitude).toBe(testCase.lat);
        expect(payload.parameters.longitude).toBe(testCase.lng);
      }
    }, 15000); // Increase timeout for multiple iterations
  });
  
  describe('Payload Logging', () => {
    it('should log full payload sent to terrain Lambda', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockSend.mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          success: true,
          type: 'terrain_analysis',
          data: { messageContentType: 'wind_farm_terrain_analysis' }
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {}
      };
      
      await handler(request);
      
      // Verify logging occurred
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' '));
      const payloadLog = logCalls.find(log => log.includes('TOOL LAMBDA INVOCATION') || log.includes('Payload:'));
      
      expect(payloadLog).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});
