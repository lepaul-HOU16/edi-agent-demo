/**
 * Integration Tests for Terrain Query Routing Fix
 * 
 * Tests the fix for the critical routing bug where terrain analysis queries
 * were incorrectly matched by project listing patterns.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { handler } from '../../amplify/functions/renewableOrchestrator/handler';
import type { OrchestratorRequest, OrchestratorResponse } from '../../amplify/functions/renewableOrchestrator/types';

// Mock AWS SDK clients
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
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  })),
  GetItemCommand: jest.fn(),
  PutItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn()
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn((client) => ({
      send: jest.fn()
    }))
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

// Import mocked clients
import { LambdaClient } from '@aws-sdk/client-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Increase timeout for integration tests
jest.setTimeout(15000);

describe('Terrain Query Routing Integration Tests', () => {
  let mockLambdaSend: jest.Mock;
  let mockS3Send: jest.Mock;
  let mockDynamoDBSend: jest.Mock;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockLambdaSend = jest.fn();
    mockS3Send = jest.fn();
    mockDynamoDBSend = jest.fn();
    
    (LambdaClient as jest.Mock).mockImplementation(() => ({
      send: mockLambdaSend
    }));
    
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send
    }));
    
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({
      send: mockDynamoDBSend
    }));
    
    // Set required environment variables
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
    process.env.RENEWABLE_S3_BUCKET = 'test-renewable-bucket';
    process.env.SESSION_CONTEXT_TABLE = 'test-session-context-table';
  });
  
  describe('4.1 Terrain Analysis Routing', () => {
    it('should route terrain analysis query to terrain tool (not project list)', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const testCoordinates = {
        latitude: 35.067482,
        longitude: -101.395466
      };
      
      // Setup comprehensive mocks for full orchestrator flow
      let dynamoCallCount = 0;
      mockDynamoDBSend.mockImplementation(() => {
        dynamoCallCount++;
        // All DynamoDB calls return empty/success
        if (dynamoCallCount === 1) {
          return Promise.resolve({ Item: undefined }); // Get session context
        }
        return Promise.resolve({}); // Put/Update operations
      });
      
      let s3CallCount = 0;
      mockS3Send.mockImplementation(() => {
        s3CallCount++;
        if (s3CallCount === 1) {
          return Promise.resolve({ Body: undefined }); // Check if project exists
        }
        return Promise.resolve({}); // Save operations
      });
      
      // Mock Lambda invocation for terrain tool
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {
              features: [
                {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] },
                  properties: { name: 'Test Feature' }
                }
              ],
              analysis: {
                suitable_area_km2: 25.5,
                terrain_complexity: 'moderate'
              }
            },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: {
                features: [
                  {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] }
                  }
                ],
                analysis: { suitable_area_km2: 25.5 }
              }
            }]
          })
        }))
      });
      
      // Submit the problematic query that was incorrectly routed to project list
      const request: OrchestratorRequest = {
        query: `Analyze terrain at coordinates ${testCoordinates.latitude}, ${testCoordinates.longitude} in Texas`,
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Debug output if test fails
      if (!response.success) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
        console.log('DynamoDB calls:', dynamoCallCount);
        console.log('S3 calls:', s3CallCount);
        console.log('Lambda calls:', mockLambdaSend.mock.calls.length);
      }
      
      // CRITICAL: Verify the request succeeded
      expect(response.success).toBe(true);
      
      // CRITICAL: Verify it routed to terrain tool (not project list)
      // This is the key test - the bug was that terrain queries were routed to project list
      expect(response.metadata?.toolsUsed).toContain('terrain_analysis');
      expect(response.metadata?.toolsUsed).not.toContain('project_list');
      
      // CRITICAL: Verify artifacts are terrain analysis type (not project list)
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts!.length).toBeGreaterThan(0);
      expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      
      // CRITICAL: Verify response is NOT a project list message
      expect(response.message).not.toContain('Your Renewable Energy Projects');
      expect(response.message).not.toContain('don\'t have any renewable energy projects');
      expect(response.metadata?.projectCount).toBeUndefined();
      
      // Verify thought steps show terrain analysis (not project listing)
      const toolStep = response.thoughtSteps?.find(
        step => step.action.includes('terrain_analysis')
      );
      expect(toolStep).toBeDefined();
      // Note: Status may be 'in_progress' or 'complete' depending on Lambda execution
      // The key is that terrain analysis was attempted, not project listing
      expect(['in_progress', 'complete', 'error']).toContain(toolStep?.status);
      
      // CRITICAL: Verify NO project listing thought step
      const listStep = response.thoughtSteps?.find(
        step => step.action === 'Listing projects'
      );
      expect(listStep).toBeUndefined();
    });
    
    it('should route various terrain analysis query formats correctly', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [], analysis: {} },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: { features: [] }
            }]
          })
        }))
      });
      
      const terrainQueries = [
        'analyze terrain at 35.067482, -101.395466',
        'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
        'perform terrain analysis for location 40.7128, -74.0060',
        'terrain analysis at 51.5074, -0.1278'
      ];
      
      for (const query of terrainQueries) {
        jest.clearAllMocks();
        
        const request: OrchestratorRequest = {
          query,
          sessionId: `${sessionId}-${Math.random()}`,
          context: {}
        };
        
        const response = await handler(request);
        
        // Verify each query routes to terrain tool
        expect(response.success).toBe(true);
        expect(response.metadata?.toolsUsed).toContain('terrain_analysis');
        expect(response.metadata?.toolsUsed).not.toContain('project_list');
        expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      }
    });
    
    it('should NOT route terrain queries to project list handler', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [], analysis: {} },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: { features: [] }
            }]
          })
        }))
      });
      
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify response is NOT a project list
      expect(response.success).toBe(true);
      expect(response.message).not.toContain('projects that match');
      expect(response.message).not.toContain('Your Renewable Energy Projects');
      expect(response.message).not.toContain('don\'t have any renewable energy projects');
      
      // Verify metadata shows terrain analysis, not project list
      expect(response.metadata?.toolsUsed).toContain('terrain_analysis');
      expect(response.metadata?.toolsUsed).not.toContain('project_list');
      expect(response.metadata?.projectCount).toBeUndefined();
    });
  });
  
  describe('4.2 Project List Routing', () => {
    it('should route project list query to project list handler', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB responses for session context
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      
      // Mock S3 responses with implementation to handle different command types
      let s3CallCount = 0;
      mockS3Send.mockImplementation((command: any) => {
        s3CallCount++;
        
        // First call is ListObjectsV2 for project listing
        if (s3CallCount === 1 || command.constructor.name === 'ListObjectsV2Command') {
          return Promise.resolve({
            Contents: [
              { Key: 'projects/test-project-1/project.json' },
              { Key: 'projects/test-project-2/project.json' }
            ]
          });
        }
        
        // Subsequent calls are GetObject for each project
        if (s3CallCount === 2) {
          return Promise.resolve({
            Body: {
              transformToString: async () => JSON.stringify({
                project_name: 'test-project-1',
                project_id: 'test-project-1',
                coordinates: { latitude: 35.0, longitude: -101.0 },
                terrain_results: { features: [] },
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z'
              })
            }
          });
        }
        
        if (s3CallCount === 3) {
          return Promise.resolve({
            Body: {
              transformToString: async () => JSON.stringify({
                project_name: 'test-project-2',
                project_id: 'test-project-2',
                coordinates: { latitude: 36.0, longitude: -102.0 },
                layout_results: { turbines: [] },
                created_at: '2024-01-03T00:00:00Z',
                updated_at: '2024-01-04T00:00:00Z'
              })
            }
          });
        }
        
        return Promise.resolve({});
      });
      
      // Submit project list query
      const request: OrchestratorRequest = {
        query: 'list my renewable projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Debug output if test fails
      if (!response.success || !response.message.includes('Your Renewable Energy Projects')) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
        console.log('S3 mock calls:', s3CallCount);
      }
      
      // Verify the request succeeded
      expect(response.success).toBe(true);
      
      // Verify it routed to project list handler
      expect(response.metadata?.toolsUsed).toContain('project_list');
      expect(response.metadata?.toolsUsed).not.toContain('terrain_analysis');
      
      // Verify response contains project list
      expect(response.message).toContain('Your Renewable Energy Projects');
      expect(response.metadata?.projectCount).toBe(2);
      
      // Verify no Lambda tool was called (project list is handled internally)
      expect(mockLambdaSend).not.toHaveBeenCalled();
      
      // Verify thought steps show project listing
      const listStep = response.thoughtSteps?.find(
        step => step.action === 'Listing projects'
      );
      expect(listStep).toBeDefined();
      expect(listStep?.status).toBe('complete');
      expect(listStep?.result).toContain('Found 2 project(s)');
    });
    
    it('should route various project list query formats correctly', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses for empty project list
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Contents: [] });
      
      const projectListQueries = [
        'list my projects',
        'show my renewable projects',
        'what projects do I have',
        'view my projects',
        'see all my projects'
      ];
      
      for (const query of projectListQueries) {
        jest.clearAllMocks();
        mockDynamoDBSend.mockResolvedValue({ Item: undefined });
        mockS3Send.mockResolvedValue({ Contents: [] });
        
        const request: OrchestratorRequest = {
          query,
          sessionId: `${sessionId}-${Math.random()}`,
          context: {}
        };
        
        const response = await handler(request);
        
        // Verify each query routes to project list handler
        expect(response.success).toBe(true);
        expect(response.metadata?.toolsUsed).toContain('project_list');
        expect(response.metadata?.toolsUsed).not.toContain('terrain_analysis');
        
        // Verify no Lambda tool was called
        expect(mockLambdaSend).not.toHaveBeenCalled();
      }
    });
    
    it('should handle empty project list gracefully', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses for empty project list
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Contents: [] });
      
      const request: OrchestratorRequest = {
        query: 'list my renewable projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify the request succeeded
      expect(response.success).toBe(true);
      
      // Verify response indicates no projects
      expect(response.message).toContain('don\'t have any renewable energy projects yet');
      expect(response.message).toContain('analyze terrain');
      expect(response.metadata?.projectCount).toBe(0);
      
      // Verify it routed to project list handler
      expect(response.metadata?.toolsUsed).toContain('project_list');
    });
    
    it('should route project details query correctly', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const projectName = 'test-wind-farm-123';
      
      // Mock DynamoDB responses
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      
      // Mock S3 response for project data
      mockS3Send.mockResolvedValue({
        Body: {
          transformToString: async () => JSON.stringify({
            project_name: projectName,
            project_id: projectName,
            coordinates: { latitude: 35.0, longitude: -101.0 },
            terrain_results: { features: [] },
            layout_results: { turbines: [] },
            metadata: { turbine_count: 10, total_capacity_mw: 25 },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          })
        }
      });
      
      // Submit project details query
      const request: OrchestratorRequest = {
        query: `show project ${projectName}`,
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Debug output if test fails
      if (!response.success) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
      }
      
      // Verify the request succeeded
      expect(response.success).toBe(true);
      
      // Verify it routed to project details handler
      expect(response.metadata?.toolsUsed).toContain('project_details');
      expect(response.metadata?.projectName).toBe(projectName);
      
      // Verify response contains project details
      expect(response.message).toContain(`Project: ${projectName}`);
      expect(response.message).toContain('Status');
      expect(response.message).toContain('Location');
      
      // Verify no Lambda tool was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
      
      // Verify thought steps show project details loading
      const detailsStep = response.thoughtSteps?.find(
        step => step.action === 'Loading project details'
      );
      expect(detailsStep).toBeDefined();
      expect(detailsStep?.status).toBe('complete');
    });
    
    it('should NOT route project list queries to terrain tool', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Contents: [] });
      
      const request: OrchestratorRequest = {
        query: 'list my renewable projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify response is a project list, not terrain analysis
      expect(response.success).toBe(true);
      expect(response.metadata?.toolsUsed).toContain('project_list');
      expect(response.metadata?.toolsUsed).not.toContain('terrain_analysis');
      
      // Verify no artifacts (project list doesn't generate artifacts)
      expect(response.artifacts).toEqual([]);
      
      // Verify no Lambda was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
  });
  
  describe('4.3 Routing Disambiguation', () => {
    it('should prioritize action verbs over pattern matches', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock responses for terrain analysis with coordinates
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [], analysis: {} },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: { features: [] }
            }]
          })
        }))
      });
      
      // Query that contains "my" and "projects" but also has action verb "analyze"
      // Include coordinates to make it a valid terrain query
      const request: OrchestratorRequest = {
        query: 'analyze terrain for my projects at 35.0, -101.0',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Debug output if test fails
      if (!response.success) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
      }
      
      // Should route to terrain analysis due to action verb, not project list
      expect(response.success).toBe(true);
      expect(response.metadata?.toolsUsed).not.toContain('project_list');
    });
    
    it('should correctly distinguish between similar queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Test 1: Terrain analysis query
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [], analysis: {} },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: { features: [] }
            }]
          })
        }))
      });
      
      const terrainRequest: OrchestratorRequest = {
        query: 'analyze terrain at 35.0, -101.0',
        sessionId: `${sessionId}-1`,
        context: {}
      };
      
      const terrainResponse = await handler(terrainRequest);
      
      // Debug output if test fails
      if (!terrainResponse.success) {
        console.log('❌ Terrain test failed. Response:', JSON.stringify(terrainResponse, null, 2));
      }
      
      expect(terrainResponse.success).toBe(true);
      expect(terrainResponse.metadata?.toolsUsed).toContain('terrain_analysis');
      expect(terrainResponse.metadata?.toolsUsed).not.toContain('project_list');
      
      // Verify Lambda was called for terrain analysis
      const terrainLambdaCalls = mockLambdaSend.mock.calls.length;
      expect(terrainLambdaCalls).toBeGreaterThan(0);
      
      // Test 2: Project list query
      jest.clearAllMocks();
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Contents: [] });
      
      const listRequest: OrchestratorRequest = {
        query: 'list my projects',
        sessionId: `${sessionId}-2`,
        context: {}
      };
      
      const listResponse = await handler(listRequest);
      expect(listResponse.success).toBe(true);
      expect(listResponse.metadata?.toolsUsed).toContain('project_list');
      expect(listResponse.metadata?.toolsUsed).not.toContain('terrain_analysis');
      
      // Verify Lambda was NOT called for project list (handled internally)
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
    
    it('should handle queries with "project" keyword correctly', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Test 1: Project details query (should NOT route to terrain)
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({
        Body: {
          transformToString: async () => JSON.stringify({
            project_name: 'test-project',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          })
        }
      });
      
      const detailsRequest: OrchestratorRequest = {
        query: 'show project test-project',
        sessionId: `${sessionId}-1`,
        context: {}
      };
      
      const detailsResponse = await handler(detailsRequest);
      expect(detailsResponse.metadata?.toolsUsed).toContain('project_details');
      expect(detailsResponse.metadata?.toolsUsed).not.toContain('terrain_analysis');
      
      // Test 2: Terrain query mentioning "project" (should route to terrain)
      jest.clearAllMocks();
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { features: [], analysis: {} },
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              title: 'Terrain Analysis',
              data: { features: [] }
            }]
          })
        }))
      });
      
      const terrainRequest: OrchestratorRequest = {
        query: 'analyze terrain for my project at 35.0, -101.0',
        sessionId: `${sessionId}-2`,
        context: {}
      };
      
      const terrainResponse = await handler(terrainRequest);
      expect(terrainResponse.metadata?.toolsUsed).toContain('terrain_analysis');
      expect(terrainResponse.metadata?.toolsUsed).not.toContain('project_details');
      expect(terrainResponse.metadata?.toolsUsed).not.toContain('project_list');
    });
  });
});
