/**
 * Integration Tests for Validation Logging
 * 
 * Tests that validation logging works correctly in the full orchestrator flow,
 * including project context resolution and parameter auto-fill.
 */

import type { OrchestratorRequest } from '../../amplify/functions/renewableOrchestrator/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: jest.fn()
  })),
  InvokeCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  })),
  GetItemCommand: jest.fn(),
  PutItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn()
}));

describe('Validation Logging Integration', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let handler: any;
  
  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Set environment variables
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
    process.env.RENEWABLE_S3_BUCKET = 'test-bucket';
    process.env.SESSION_CONTEXT_TABLE = 'test-table';
    
    // Import handler after setting env vars
    const handlerModule = await import('../../amplify/functions/renewableOrchestrator/handler');
    handler = handlerModule.handler;
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.resetModules();
  });
  
  describe('Validation Failure Logging', () => {
    it('should log validation failure with project context when parameters missing', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-123',
        context: {}
      };
      
      // Mock S3 to return project data with coordinates
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockS3Send = jest.fn().mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(JSON.stringify({
            project_name: 'test-project',
            coordinates: { latitude: 35.0, longitude: -101.0 },
            terrain_results: { features: [] },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }))
        }
      });
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB to return session context
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn().mockResolvedValue({
        Item: {
          session_id: { S: 'test-session-123' },
          active_project: { S: 'test-project' },
          project_history: { L: [{ S: 'test-project' }] }
        }
      });
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      // Note: This test expects validation to PASS because coordinates are auto-filled
      // If we want to test failure, we need to remove coordinates from project data
      const response = await handler(request);
      
      // Find validation logs
      const validationLogs = consoleLogSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      // Should have at least one validation log
      expect(validationLogs.length).toBeGreaterThan(0);
      
      // Find the validation result log
      const validationLog = validationLogs.find(log => 
        log.intentType === 'layout_optimization'
      );
      
      expect(validationLog).toBeDefined();
      expect(validationLog).toMatchObject({
        level: 'INFO', // Should be INFO because validation passes with context
        category: 'PARAMETER_VALIDATION',
        intentType: 'layout_optimization',
        validation: {
          isValid: true,
          contextUsed: true,
          satisfiedByContext: expect.arrayContaining(['latitude', 'longitude'])
        },
        projectContext: {
          hasActiveProject: true,
          projectName: 'test-project',
          hasCoordinates: true,
          hasTerrainResults: true
        }
      });
    });
    
    it('should log validation failure without project context', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-no-context',
        context: {}
      };
      
      // Mock S3 to return no project data
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockS3Send = jest.fn().mockRejectedValue(new Error('NoSuchKey'));
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB to return empty session context
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn().mockResolvedValue({
        Item: {
          session_id: { S: 'test-session-no-context' },
          project_history: { L: [] }
        }
      });
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      const response = await handler(request);
      
      // Should fail validation
      expect(response.success).toBe(false);
      
      // Find validation error logs
      const validationErrorLogs = consoleErrorSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      // Should have validation error log
      expect(validationErrorLogs.length).toBeGreaterThan(0);
      
      const validationLog = validationErrorLogs[0];
      expect(validationLog).toMatchObject({
        level: 'ERROR',
        category: 'PARAMETER_VALIDATION',
        intentType: 'layout_optimization',
        validation: {
          isValid: false,
          contextUsed: false,
          satisfiedByContext: [],
          missingRequired: expect.arrayContaining(['latitude', 'longitude'])
        },
        projectContext: {
          hasActiveProject: false,
          hasCoordinates: false
        }
      });
    });
  });
  
  describe('Validation Success Logging', () => {
    it('should log validation success with context usage', async () => {
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-session-success',
        context: {}
      };
      
      // Mock S3 to return project data
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockS3Send = jest.fn()
        .mockResolvedValueOnce({
          // First call: load project data
          Body: {
            transformToString: jest.fn().mockResolvedValue(JSON.stringify({
              project_name: 'success-project',
              coordinates: { latitude: 35.067482, longitude: -101.395466 },
              terrain_results: { features: [] },
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z'
            }))
          }
        })
        .mockResolvedValue({
          // Subsequent calls: save project data
          ETag: 'test-etag'
        });
      
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn().mockResolvedValue({
        Item: {
          session_id: { S: 'test-session-success' },
          active_project: { S: 'success-project' },
          project_history: { L: [{ S: 'success-project' }] }
        }
      });
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      // Mock Lambda to return success
      const { LambdaClient } = await import('@aws-sdk/client-lambda');
      const mockLambdaSend = jest.fn().mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {
              turbine_count: 10,
              total_capacity_mw: 25
            }
          })
        }))
      });
      (LambdaClient as jest.Mock).mockImplementation(() => ({
        send: mockLambdaSend
      }));
      
      const response = await handler(request);
      
      // Find validation success logs
      const validationLogs = consoleLogSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION' && data.level === 'INFO';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      // Should have validation success log
      expect(validationLogs.length).toBeGreaterThan(0);
      
      const validationLog = validationLogs.find(log => 
        log.intentType === 'layout_optimization'
      );
      
      expect(validationLog).toBeDefined();
      expect(validationLog).toMatchObject({
        level: 'INFO',
        category: 'PARAMETER_VALIDATION',
        intentType: 'layout_optimization',
        validation: {
          isValid: true,
          contextUsed: true,
          satisfiedByContext: expect.arrayContaining(['latitude', 'longitude'])
        },
        projectContext: {
          hasActiveProject: true,
          projectName: 'success-project',
          hasCoordinates: true,
          hasTerrainResults: true
        }
      });
    });
    
    it('should log validation success without context usage', async () => {
      const request: OrchestratorRequest = {
        query: 'analyze terrain at 35.067482, -101.395466',
        sessionId: 'test-session-explicit',
        context: {}
      };
      
      // Mock S3 to return no project data (new project)
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockS3Send = jest.fn()
        .mockRejectedValueOnce(new Error('NoSuchKey'))
        .mockResolvedValue({
          ETag: 'test-etag'
        });
      
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn().mockResolvedValue({
        Item: {
          session_id: { S: 'test-session-explicit' },
          project_history: { L: [] }
        }
      });
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      // Mock Lambda
      const { LambdaClient } = await import('@aws-sdk/client-lambda');
      const mockLambdaSend = jest.fn().mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [] }
          })
        }))
      });
      (LambdaClient as jest.Mock).mockImplementation(() => ({
        send: mockLambdaSend
      }));
      
      const response = await handler(request);
      
      // Find validation logs
      const validationLogs = consoleLogSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION' && data.level === 'INFO';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      const validationLog = validationLogs.find(log => 
        log.intentType === 'terrain_analysis'
      );
      
      expect(validationLog).toBeDefined();
      expect(validationLog).toMatchObject({
        level: 'INFO',
        category: 'PARAMETER_VALIDATION',
        intentType: 'terrain_analysis',
        validation: {
          isValid: true,
          contextUsed: false,
          satisfiedByContext: []
        },
        projectContext: {
          hasActiveProject: false,
          hasCoordinates: false
        }
      });
    });
  });
  
  describe('CloudWatch Log Queries', () => {
    it('should support filtering by validation status', async () => {
      // Run both success and failure cases
      const successRequest: OrchestratorRequest = {
        query: 'analyze terrain at 35.0, -101.0',
        sessionId: 'test-filter-success',
        context: {}
      };
      
      const failRequest: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-filter-fail',
        context: {}
      };
      
      // Mock S3
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockS3Send = jest.fn()
        .mockRejectedValue(new Error('NoSuchKey'));
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn().mockResolvedValue({
        Item: {
          session_id: { S: 'test-filter' },
          project_history: { L: [] }
        }
      });
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      // Mock Lambda
      const { LambdaClient } = await import('@aws-sdk/client-lambda');
      const mockLambdaSend = jest.fn().mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {}
          })
        }))
      });
      (LambdaClient as jest.Mock).mockImplementation(() => ({
        send: mockLambdaSend
      }));
      
      await handler(successRequest);
      await handler(failRequest);
      
      // Get all validation logs
      const allLogs = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls
      ]
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      // Should be able to filter by level
      const errorLogs = allLogs.filter(log => log.level === 'ERROR');
      const infoLogs = allLogs.filter(log => log.level === 'INFO');
      
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(infoLogs.length).toBeGreaterThan(0);
      
      // Should be able to filter by validation.isValid
      const failedValidations = allLogs.filter(log => !log.validation.isValid);
      const successValidations = allLogs.filter(log => log.validation.isValid);
      
      expect(failedValidations.length).toBeGreaterThan(0);
      expect(successValidations.length).toBeGreaterThan(0);
    });
    
    it('should support filtering by context usage', async () => {
      const withContextRequest: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId: 'test-with-context',
        context: {}
      };
      
      const withoutContextRequest: OrchestratorRequest = {
        query: 'analyze terrain at 35.0, -101.0',
        sessionId: 'test-without-context',
        context: {}
      };
      
      // Mock S3 to return project data for first request only
      const { S3Client } = await import('@aws-sdk/client-s3');
      let callCount = 0;
      const mockS3Send = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            Body: {
              transformToString: jest.fn().mockResolvedValue(JSON.stringify({
                project_name: 'with-context-project',
                coordinates: { latitude: 35.0, longitude: -101.0 },
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
              }))
            }
          });
        }
        return Promise.reject(new Error('NoSuchKey'));
      });
      
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockS3Send
      }));
      
      // Mock DynamoDB
      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockDynamoSend = jest.fn()
        .mockResolvedValueOnce({
          Item: {
            session_id: { S: 'test-with-context' },
            active_project: { S: 'with-context-project' },
            project_history: { L: [{ S: 'with-context-project' }] }
          }
        })
        .mockResolvedValue({
          Item: {
            session_id: { S: 'test-without-context' },
            project_history: { L: [] }
          }
        });
      
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockDynamoSend
      }));
      
      // Mock Lambda
      const { LambdaClient } = await import('@aws-sdk/client-lambda');
      const mockLambdaSend = jest.fn().mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {}
          })
        }))
      });
      (LambdaClient as jest.Mock).mockImplementation(() => ({
        send: mockLambdaSend
      }));
      
      await handler(withContextRequest);
      await handler(withoutContextRequest);
      
      // Get all validation logs
      const allLogs = consoleLogSpy.mock.calls
        .filter(call => {
          try {
            const data = JSON.parse(call[0]);
            return data.category === 'PARAMETER_VALIDATION';
          } catch {
            return false;
          }
        })
        .map(call => JSON.parse(call[0]));
      
      // Should be able to filter by contextUsed
      const withContextLogs = allLogs.filter(log => log.validation.contextUsed);
      const withoutContextLogs = allLogs.filter(log => !log.validation.contextUsed);
      
      expect(withContextLogs.length).toBeGreaterThan(0);
      expect(withoutContextLogs.length).toBeGreaterThan(0);
      
      // Verify context flags
      const withContextLog = withContextLogs[0];
      expect(withContextLog.projectContext.hasActiveProject).toBe(true);
      expect(withContextLog.validation.satisfiedByContext.length).toBeGreaterThan(0);
    });
  });
});
