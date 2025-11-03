/**
 * Integration test for orchestrator context-aware parameter validation flow
 * 
 * Tests that the orchestrator correctly:
 * 1. Loads project context before validation
 * 2. Auto-fills parameters from context
 * 3. Validates with context awareness
 * 4. Logs context usage appropriately
 */

// Mock AWS SDK clients BEFORE importing handler
let mockLambdaSend: jest.Mock;
let mockS3Send: jest.Mock;
let mockDynamoDBSend: jest.Mock;

jest.mock('@aws-sdk/client-lambda', () => {
  mockLambdaSend = jest.fn();
  return {
    LambdaClient: jest.fn(() => ({
      send: mockLambdaSend
    })),
    InvokeCommand: jest.fn((params) => params)
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  mockS3Send = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockS3Send
    })),
    GetObjectCommand: jest.fn((params) => params),
    PutObjectCommand: jest.fn((params) => params)
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => {
  mockDynamoDBSend = jest.fn();
  return {
    DynamoDBClient: jest.fn(() => ({
      send: mockDynamoDBSend
    })),
    GetItemCommand: jest.fn((params) => params),
    PutItemCommand: jest.fn((params) => params),
    UpdateItemCommand: jest.fn((params) => params)
  };
});

import { handler } from '../../amplify/functions/renewableOrchestrator/handler';
import type { OrchestratorRequest } from '../../amplify/functions/renewableOrchestrator/types';

// Mock environment variables
process.env.RENEWABLE_S3_BUCKET = 'test-bucket';
process.env.SESSION_CONTEXT_TABLE = 'test-table';
process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';

describe('Orchestrator Context-Aware Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLambdaSend.mockReset();
    mockS3Send.mockReset();
    mockDynamoDBSend.mockReset();
  });

  describe('Flow Order Verification', () => {
    it('should load project context before parameter validation', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-123',
        context: {}
      };

      // Mock DynamoDB for session context
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: 'test-session-123' },
          active_project: { S: 'test-project' },
          project_history: { L: [{ S: 'test-project' }] }
        }
      });

      // Mock S3 for project data
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            project_name: 'test-project',
            coordinates: {
              latitude: 35.067482,
              longitude: -101.395466
            },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }))
        }
      });

      // Mock Lambda invocation
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {
              turbine_count: 10,
              total_capacity_mw: 30
            },
            artifacts: [{
              type: 'wind_farm_layout',
              title: 'Wind Farm Layout',
              data: {}
            }]
          })
        }))
      });

      const response = await handler(request);

      // Verify thought steps show correct order
      expect(response.thoughtSteps).toBeDefined();
      
      const stepActions = response.thoughtSteps.map(step => step.action);
      
      // Step 1: Deployment validation
      expect(stepActions[0]).toBe('Validating deployment');
      
      // Step 2: Intent detection
      expect(stepActions[1]).toBe('Analyzing query');
      
      // Step 3: Project context resolution (BEFORE validation)
      expect(stepActions[2]).toBe('Resolving project context');
      
      // Step 4: Parameter validation (AFTER context loading)
      expect(stepActions[3]).toBe('Validating parameters');
      
      // Verify validation step shows context was used
      const validationStep = response.thoughtSteps.find(
        step => step.action === 'Validating parameters'
      );
      expect(validationStep?.result).toContain('from context');
    });

    it('should auto-fill coordinates from project context', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-456',
        context: {}
      };

      // Mock DynamoDB for session context
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: 'test-session-456' },
          active_project: { S: 'west-texas-site' },
          project_history: { L: [{ S: 'west-texas-site' }] }
        }
      });

      // Mock S3 for project data with coordinates
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            project_name: 'west-texas-site',
            coordinates: {
              latitude: 32.5,
              longitude: -102.0
            },
            terrain_results: {
              features: []
            },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }))
        }
      });

      // Mock Lambda invocation
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {},
            artifacts: []
          })
        }))
      });

      const response = await handler(request);

      // Verify validation passed (coordinates were auto-filled)
      const validationStep = response.thoughtSteps.find(
        step => step.action === 'Validating parameters'
      );
      expect(validationStep?.status).toBe('complete');
      expect(validationStep?.result).toMatch(/from context/i);
    });

    it('should fail validation when no context and no explicit params', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-789',
        context: {}
      };

      // Mock DynamoDB to return no active project
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: 'test-session-789' },
          project_history: { L: [] }
        }
      });

      // Mock S3 to return no project data
      mockS3Send.mockRejectedValueOnce(new Error('NoSuchKey'));

      const response = await handler(request);

      // Verify validation failed
      expect(response.success).toBe(false);
      expect(response.message).toContain('latitude');
      expect(response.message).toContain('longitude');
      
      const validationStep = response.thoughtSteps.find(
        step => step.action === 'Validating parameters'
      );
      expect(validationStep?.status).toBe('error');
    });
  });

  describe('Logging Verification', () => {
    it('should log auto-filled parameters', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-log',
        context: {}
      };

      // Mock DynamoDB for session context
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: 'test-session-log' },
          active_project: { S: 'test-project' },
          project_history: { L: [{ S: 'test-project' }] }
        }
      });

      // Mock S3 for project data
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            project_name: 'test-project',
            coordinates: {
              latitude: 35.0,
              longitude: -101.0
            },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }))
        }
      });

      // Mock Lambda
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {},
            artifacts: []
          })
        }))
      });

      await handler(request);

      // Verify auto-fill logging
      const logs = consoleSpy.mock.calls.map(call => call.join(' '));
      const autoFillLog = logs.find(log => 
        log.includes('Auto-filled coordinates from project')
      );
      expect(autoFillLog).toBeDefined();
      expect(autoFillLog).toContain('35.0');
      expect(autoFillLog).toContain('-101.0');

      consoleSpy.mockRestore();
    });

    it('should log validation results with context information', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-validation-log',
        context: {}
      };

      // Mock DynamoDB for session context
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: 'test-session-validation-log' },
          active_project: { S: 'test-project' },
          project_history: { L: [{ S: 'test-project' }] }
        }
      });

      // Mock S3 for project data
      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            project_name: 'test-project',
            coordinates: {
              latitude: 35.0,
              longitude: -101.0
            },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }))
        }
      });

      // Mock Lambda
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {},
            artifacts: []
          })
        }))
      });

      await handler(request);

      // Verify validation logging includes context information
      const logs = consoleSpy.mock.calls.map(call => call.join(' '));
      const validationLog = logs.find(log => 
        log.includes('PARAMETER VALIDATION RESULTS')
      );
      expect(validationLog).toBeDefined();
      
      const contextUsedLog = logs.find(log => 
        log.includes('Context Used:')
      );
      expect(contextUsedLog).toBeDefined();
      
      const satisfiedLog = logs.find(log => 
        log.includes('Satisfied by Context:')
      );
      expect(satisfiedLog).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
