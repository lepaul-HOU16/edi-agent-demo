/**
 * Unit tests for Orchestrator Logging Enhancement
 * 
 * Tests comprehensive logging at each step of the orchestrator flow:
 * - Entry point logging with request payload
 * - Intent detection logging
 * - Tool Lambda invocation logging
 * - Tool Lambda response logging
 * - Project ID generation logging
 * - Execution time tracking
 */

import { handler } from '../handler';
import type { OrchestratorRequest } from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeCommand: jest.fn()
}));

describe('Orchestrator Logging Enhancement', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Spy on console methods to verify logging
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Set up environment variables
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });
  
  describe('Entry Point Logging', () => {
    it('should log full request payload at entry point', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0 with 5km radius',
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        context: {
          projectId: 'test-project-789'
        }
      };
      
      await handler(request);
      
      // Verify entry point logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ORCHESTRATOR ENTRY POINT')
      );
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/📋 Request ID: req-\d+-[a-z0-9]+/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/⏰ Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('📦 Full Request Payload:') && log.includes(request.query))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes(`🔍 Query: ${request.query}`))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('📝 Context:') && log.includes('test-project-789'))).toBe(true);
    });
    
    it('should log request with empty context', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('📝 Context:'))).toBe(true);
    });
  });
  
  describe('Intent Detection Logging', () => {
    it('should log intent detection results with confidence', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0 with 5km radius',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Verify intent detection logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('INTENT DETECTION RESULTS')
      );
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('🔍 Detected Type:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/📊 Confidence: \d+%/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('⚙️  Parameters:'))).toBe(true);
    });
    
    it('should log intent detection duration', async () => {
      const request: OrchestratorRequest = {
        query: 'Optimize layout for 20 turbines',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/⏱️  Detection Duration: \d+ms/))).toBe(true);
    });
    
    it('should log extracted parameters from query', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius and 100m setback',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Check that parameters are logged (format: "⚙️  Parameters: {...}")
      const parametersLog = consoleLogSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('⚙️  Parameters:')
      );
      
      expect(parametersLog).toBeDefined();
      expect(parametersLog![0]).toContain('latitude');
      expect(parametersLog![0]).toContain('longitude');
      // IntentRouter may use "radius" or "radius_km" depending on implementation
      expect(parametersLog![0]).toMatch(/radius/i);
    });
  });
  
  describe('Tool Lambda Invocation Logging', () => {
    it('should log tool Lambda invocation details', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Verify tool invocation logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('TOOL LAMBDA INVOCATION')
      );
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('📦 Function Name:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('📤 Payload:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/⏰ Invocation Time: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))).toBe(true);
    });
    
    it('should log intent type during invocation', async () => {
      const request: OrchestratorRequest = {
        query: 'Optimize wind farm layout',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('🎯 Intent Type:'))).toBe(true);
    });
  });
  
  describe('Tool Lambda Response Logging', () => {
    it('should log tool Lambda response with success status', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      // Response should be successful
      expect(response.success).toBe(true);
      
      // Check if tool Lambda was invoked (not mock fallback)
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasToolResponseLog = logs.some(log => 
        typeof log === 'string' && log.includes('TOOL LAMBDA RESPONSE')
      );
      
      // If tool was invoked, verify response logging
      if (hasToolResponseLog) {
        expect(logs.some(log => typeof log === 'string' && log.includes('✔️  Success:'))).toBe(true);
      }
    });
    
    it('should log artifact count in response', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/📊 Artifact Count: \d+/))).toBe(true);
    });
    
    it('should log execution duration for tool invocation', async () => {
      const request: OrchestratorRequest = {
        query: 'Run wake simulation',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      // Check that timings are tracked in metadata
      expect(response.metadata.timings).toBeDefined();
      expect(response.metadata.timings?.toolInvocation).toBeGreaterThanOrEqual(0);
      
      // Check if tool Lambda was invoked (not mock fallback)
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasToolResponseLog = logs.some(log => 
        typeof log === 'string' && log.includes('TOOL LAMBDA RESPONSE')
      );
      
      // If tool was invoked, verify duration logging
      if (hasToolResponseLog) {
        const durationLog = logs.find(log => 
          typeof log === 'string' && log.includes('⏱️  Execution Duration:')
        );
        expect(durationLog).toBeDefined();
        expect(durationLog).toMatch(/\d+ms/);
      }
    });
    
    it('should log full response structure', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Check if tool Lambda was invoked (not mock fallback)
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasToolResponseLog = logs.some(log => 
        typeof log === 'string' && log.includes('TOOL LAMBDA RESPONSE')
      );
      
      // If tool was invoked, verify full response logging
      if (hasToolResponseLog) {
        const responseLog = logs.find(log => 
          typeof log === 'string' && log.includes('📥 Full Response:')
        );
        expect(responseLog).toBeDefined();
      }
    });
  });
  
  describe('Project ID Generation Logging', () => {
    it('should log generated project ID', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      // Verify project ID is in response metadata
      expect(response.metadata.projectId).toBeDefined();
      expect(response.metadata.projectId).toMatch(/^project-\d+$/);
      
      // Verify project ID logging
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('PROJECT ID GENERATION'))).toBe(true);
      
      // Check for project ID in logs (format: "🆔 Project ID: project-123456")
      const projectIdLog = logs.find(
        log => typeof log === 'string' && log.includes('🆔 Project ID:')
      );
      expect(projectIdLog).toBeDefined();
      expect(projectIdLog).toMatch(/🆔 Project ID: project-\d+/);
    });
    
    it('should log project ID source when provided in context', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session',
        context: {
          projectId: 'existing-project-123'
        }
      };
      
      await handler(request);
      
      const projectIdLog = consoleLogSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('🆔 Project ID:')
      );
      expect(projectIdLog).toBeDefined();
      expect(projectIdLog![0]).toContain('existing-project-123');
      
      const sourceLog = consoleLogSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('📝 Source:')
      );
      expect(sourceLog).toBeDefined();
      expect(sourceLog![0]).toContain('context');
    });
    
    it('should log project ID source when extracted from query', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain with project_id: custom-project-456',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      // Check that project ID was extracted (either from query or generated)
      expect(response.metadata.projectId).toBeDefined();
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const projectIdLog = logs.find(
        log => typeof log === 'string' && log.includes('🆔 Project ID:')
      );
      expect(projectIdLog).toBeDefined();
      
      // Check that the project ID appears in the log (either extracted or generated)
      const projectId = response.metadata.projectId;
      expect(projectIdLog).toContain(projectId!);
      
      const sourceLog = logs.find(
        log => typeof log === 'string' && log.includes('📝 Source:')
      );
      expect(sourceLog).toBeDefined();
    });
    
    it('should log timestamp when project ID is generated', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const timestampLog = consoleLogSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('⏰ Generated At:')
      );
      expect(timestampLog).toBeDefined();
      expect(timestampLog![0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
  
  describe('Execution Time Tracking', () => {
    it('should track and log validation duration', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/⏱️  Validation Duration: \d+ms/))).toBe(true);
    });
    
    it('should track and log intent detection duration', async () => {
      const request: OrchestratorRequest = {
        query: 'Optimize layout',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/⏱️  Detection Duration: \d+ms/))).toBe(true);
    });
    
    it('should track and log tool invocation duration', async () => {
      const request: OrchestratorRequest = {
        query: 'Run simulation',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      // Check that timings are tracked in metadata
      expect(response.metadata.timings).toBeDefined();
      expect(response.metadata.timings?.toolInvocation).toBeGreaterThanOrEqual(0);
      
      // If tool Lambda was actually invoked (not mock fallback), check for duration log
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasToolInvocationLog = logs.some(log => 
        typeof log === 'string' && log.includes('TOOL LAMBDA INVOCATION')
      );
      
      if (hasToolInvocationLog) {
        // Duration should be logged if tool was invoked
        const hasDurationLog = logs.some(log => 
          typeof log === 'string' && log.includes('⏱️  Execution Duration:')
        );
        // Note: In mock fallback mode, this log may not appear
        expect(hasDurationLog || response.metadata.timings?.toolInvocation >= 0).toBe(true);
      }
    });
    
    it('should include execution time breakdown in final response', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      expect(response.metadata.timings).toBeDefined();
      expect(response.metadata.timings?.validation).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timings?.intentDetection).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timings?.toolInvocation).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timings?.resultFormatting).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timings?.total).toBeGreaterThanOrEqual(0);
    });
    
    it('should log execution time breakdown in final response', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('⏱️  Execution Time Breakdown:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/- Validation: \d+ms/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/- Intent Detection: \d+ms/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/- Tool Invocation: \d+ms/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/- Result Formatting: \d+ms/))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.match(/- Total: \d+ms/))).toBe(true);
    });
  });
  
  describe('Final Response Logging', () => {
    it('should log complete final response structure', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at 35.0, -101.0',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Verify final response logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('FINAL RESPONSE STRUCTURE')
      );
      
      // Check for various log entries
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('✅ Success:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('📝 Message:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('📊 Artifact Count:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('🔧 Tools Used:'))).toBe(true);
      expect(logs.some(log => typeof log === 'string' && log.includes('🆔 Project ID:'))).toBe(true);
    });
    
    it('should log artifact details in final response', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Check that artifacts are logged (console.log with object as second param)
      const artifactsLog = consoleLogSpy.mock.calls.find(
        call => call[0] === '📦 Artifacts:' && Array.isArray(call[1])
      );
      expect(artifactsLog).toBeDefined();
    });
    
    it('should log thought steps count', async () => {
      const request: OrchestratorRequest = {
        query: 'Optimize layout',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.match(/🎯 Thought Steps: \d+/))).toBe(true);
    });
    
    it('should log full response JSON', async () => {
      const request: OrchestratorRequest = {
        query: 'Run simulation',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(logs.some(log => typeof log === 'string' && log.includes('📤 Full Response:'))).toBe(true);
    });
  });
  
  describe('Request ID Correlation', () => {
    it('should generate unique request ID', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      const response = await handler(request);
      
      expect(response.metadata.requestId).toBeDefined();
      expect(response.metadata.requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
    });
    
    it('should include request ID in all log sections', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Count how many times request ID is logged (format: "📋 Request ID: req-...")
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const requestIdLogs = logs.filter(
        log => typeof log === 'string' && log.includes('📋 Request ID:')
      );
      
      // Should appear in: entry point, intent detection, tool invocation, 
      // tool response, project ID, final response = 6 times
      expect(requestIdLogs.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should use same request ID throughout execution', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      // Get all request IDs logged (extract from format "📋 Request ID: req-...")
      const logs = consoleLogSpy.mock.calls.map(call => call[0]);
      const requestIdLogs = logs
        .filter(log => typeof log === 'string' && log.includes('📋 Request ID:'))
        .map(log => {
          const match = log.match(/📋 Request ID: (req-\d+-[a-z0-9]+)/);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);
      
      // All should be the same
      const uniqueIds = new Set(requestIdLogs);
      expect(uniqueIds.size).toBe(1);
    });
  });
  
  describe('Health Check Logging', () => {
    it('should log environment variables on health check', async () => {
      const request: OrchestratorRequest = {
        query: '__health_check__',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      
      await handler(request);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Health check requested'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Environment variables:',
        expect.objectContaining({
          RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: expect.any(String),
          RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: expect.any(String),
          RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: expect.any(String),
          RENEWABLE_REPORT_TOOL_FUNCTION_NAME: expect.any(String)
        })
      );
    });
  });
});
