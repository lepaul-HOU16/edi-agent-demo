/**
 * E2E Tests for Terrain Query Routing through RenewableProxyAgent
 * 
 * Tests the complete flow from RenewableProxyAgent to orchestrator to verify
 * that terrain analysis queries are correctly routed and project list queries
 * are handled appropriately.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { RenewableProxyAgent } from '../../amplify/functions/agents/renewableProxyAgent';

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
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Increase timeout for E2E tests
jest.setTimeout(30000);

describe('Terrain Query Routing E2E Tests - RenewableProxyAgent', () => {
  let mockLambdaSend: jest.Mock;
  let mockS3Send: jest.Mock;
  let mockDynamoDBSend: jest.Mock;
  let proxyAgent: RenewableProxyAgent;
  
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
    process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME = 'test-orchestrator-function';
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
    process.env.RENEWABLE_S3_BUCKET = 'test-renewable-bucket';
    process.env.SESSION_CONTEXT_TABLE = 'test-session-context-table';
    process.env.AWS_REGION = 'us-east-1';
    
    // Create proxy agent instance
    proxyAgent = new RenewableProxyAgent();
  });
  
  describe('5.1 Terrain Analysis E2E Flow', () => {
    it('should route terrain analysis query through proxy agent to orchestrator', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator Lambda response with terrain analysis artifacts
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: 'Terrain analysis completed successfully',
          artifacts: [{
            type: 'wind_farm_terrain_analysis',
            data: {
              messageContentType: 'wind_farm_terrain_analysis',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-101.395466, 35.067482]
                  },
                  properties: {
                    name: 'Test Feature',
                    type: 'suitable_area'
                  }
                }
              ],
              analysis: {
                suitable_area_km2: 25.5,
                terrain_complexity: 'moderate',
                elevation_range_m: 150
              },
              coordinates: {
                latitude: 35.067482,
                longitude: -101.395466
              }
            },
            metadata: {
              tool: 'terrain_analysis',
              timestamp: new Date().toISOString()
            }
          }],
          thoughtSteps: [
            {
              action: 'Analyzing terrain',
              reasoning: 'Fetching terrain data for coordinates',
              status: 'in_progress'
            },
            {
              action: 'terrain_analysis',
              result: 'Terrain analysis completed',
              status: 'complete'
            }
          ],
          metadata: {
            toolsUsed: ['terrain_analysis']
          }
        }))
      });
      
      // Submit terrain analysis query through proxy agent
      const query = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Debug output if test fails
      if (!response.success) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
        console.log('Lambda calls:', mockLambdaSend.mock.calls.length);
      }
      
      // CRITICAL: Verify the request succeeded
      expect(response.success).toBe(true);
      
      // CRITICAL: Verify Lambda was invoked (orchestrator was called)
      expect(mockLambdaSend).toHaveBeenCalledTimes(1);
      
      // CRITICAL: Verify response contains terrain artifacts (not project list)
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts!.length).toBeGreaterThan(0);
      expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      expect(response.artifacts![0].data.messageContentType).toBe('wind_farm_terrain_analysis');
      
      // Verify artifact data structure
      expect(response.artifacts![0].data.features).toBeDefined();
      expect(response.artifacts![0].data.features.length).toBeGreaterThan(0);
      expect(response.artifacts![0].data.analysis).toBeDefined();
      expect(response.artifacts![0].data.coordinates).toBeDefined();
      
      // CRITICAL: Verify response is NOT a project list message
      expect(response.message).not.toContain('Your Renewable Energy Projects');
      expect(response.message).not.toContain('don\'t have any renewable energy projects');
      expect(response.message).toContain('Terrain analysis');
      
      // Verify thought steps show terrain analysis
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
      
      // Verify routing thought step exists
      const routingStep = response.thoughtSteps!.find(
        step => step.title?.includes('Renewable Energy Backend')
      );
      expect(routingStep).toBeDefined();
      // Status can be 'thinking' or 'complete' depending on when the step is captured
      expect(['thinking', 'complete']).toContain(routingStep?.status);
      
      // Verify agent used is renewable_energy
      expect(response.agentUsed).toBe('renewable_energy');
    });
    
    it('should handle various terrain analysis query formats through proxy agent', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator response
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: 'Terrain analysis completed',
          artifacts: [{
            type: 'wind_farm_terrain_analysis',
            data: {
              messageContentType: 'wind_farm_terrain_analysis',
              features: [],
              analysis: { suitable_area_km2: 20 }
            }
          }],
          thoughtSteps: [],
          metadata: { toolsUsed: ['terrain_analysis'] }
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
        
        // Reset mock for each query
        mockLambdaSend.mockResolvedValue({
          Payload: Buffer.from(JSON.stringify({
            success: true,
            message: 'Terrain analysis completed',
            artifacts: [{
              type: 'wind_farm_terrain_analysis',
              data: {
                messageContentType: 'wind_farm_terrain_analysis',
                features: [],
                analysis: {}
              }
            }],
            thoughtSteps: [],
            metadata: { toolsUsed: ['terrain_analysis'] }
          }))
        });
        
        const response = await proxyAgent.processQuery(
          query,
          [],
          { chatSessionId: `${sessionId}-${Math.random()}`, userId }
        );
        
        // Verify each query succeeds and returns terrain artifacts
        expect(response.success).toBe(true);
        expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
        expect(response.message).not.toContain('Your Renewable Energy Projects');
        
        // Verify Lambda was called for each query
        expect(mockLambdaSend).toHaveBeenCalledTimes(1);
      }
    });
    
    it('should NOT return project list for terrain queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator response with terrain artifacts
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: 'Terrain analysis completed for Texas location',
          artifacts: [{
            type: 'wind_farm_terrain_analysis',
            data: {
              messageContentType: 'wind_farm_terrain_analysis',
              features: [
                {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] }
                }
              ],
              analysis: { suitable_area_km2: 25.5 }
            }
          }],
          thoughtSteps: [],
          metadata: { toolsUsed: ['terrain_analysis'] }
        }))
      });
      
      const query = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // CRITICAL: Verify response is terrain analysis, NOT project list
      expect(response.success).toBe(true);
      expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      
      // Verify NO project list indicators in response
      expect(response.message).not.toContain('projects that match');
      expect(response.message).not.toContain('Your Renewable Energy Projects');
      expect(response.message).not.toContain('don\'t have any renewable energy projects');
      expect(response.message).not.toContain('project list');
      
      // Verify artifacts are terrain type
      expect(response.artifacts![0].data.features).toBeDefined();
      expect(response.artifacts![0].data.analysis).toBeDefined();
    });
    
    it('should handle errors gracefully in terrain analysis flow', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator error response
      mockLambdaSend.mockRejectedValue(new Error('Lambda invocation failed'));
      
      const query = 'Analyze terrain at coordinates 35.067482, -101.395466';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Verify error is handled gracefully
      expect(response.success).toBe(false);
      expect(response.message).toContain('error');
      expect(response.artifacts).toEqual([]);
      
      // Verify thought steps show error
      expect(response.thoughtSteps).toBeDefined();
      const errorStep = response.thoughtSteps!.find(
        step => step.status === 'error'
      );
      expect(errorStep).toBeDefined();
    });
  });
  
  describe('5.2 Project Listing E2E Flow', () => {
    it('should route project list query through proxy agent to orchestrator', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator Lambda response with project list
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: `## Your Renewable Energy Projects

I found 2 renewable energy project(s):

### 1. test-project-1
- **Location**: 35.0°N, -101.0°W
- **Status**: In Progress
- **Created**: 2024-01-01
- **Last Updated**: 2024-01-02

### 2. test-project-2
- **Location**: 36.0°N, -102.0°W
- **Status**: Complete
- **Created**: 2024-01-03
- **Last Updated**: 2024-01-04

Would you like to view details for any of these projects?`,
          artifacts: [],
          thoughtSteps: [
            {
              action: 'Listing projects',
              result: 'Found 2 project(s)',
              status: 'complete'
            }
          ],
          metadata: {
            toolsUsed: ['project_list'],
            projectCount: 2
          }
        }))
      });
      
      // Submit project list query through proxy agent
      const query = 'list my renewable projects';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Debug output if test fails
      if (!response.success || !response.message.includes('Your Renewable Energy Projects')) {
        console.log('❌ Test failed. Response:', JSON.stringify(response, null, 2));
        console.log('Lambda calls:', mockLambdaSend.mock.calls.length);
      }
      
      // CRITICAL: Verify the request succeeded
      expect(response.success).toBe(true);
      
      // CRITICAL: Verify Lambda was invoked (orchestrator was called)
      expect(mockLambdaSend).toHaveBeenCalledTimes(1);
      
      // CRITICAL: Verify response contains project list (not terrain artifacts)
      expect(response.message).toContain('Your Renewable Energy Projects');
      expect(response.message).toContain('test-project-1');
      expect(response.message).toContain('test-project-2');
      expect(response.message.toLowerCase()).toContain('found 2');
      
      // CRITICAL: Verify NO terrain artifacts in response
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts!.length).toBe(0);
      
      // Verify thought steps show project listing
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
      
      // Verify routing thought step exists
      const routingStep = response.thoughtSteps!.find(
        step => step.title?.includes('Renewable Energy Backend')
      );
      expect(routingStep).toBeDefined();
      
      // Verify agent used is renewable_energy
      expect(response.agentUsed).toBe('renewable_energy');
    });
    
    it('should handle various project list query formats through proxy agent', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      const projectListQueries = [
        'list my projects',
        'show my renewable projects',
        'what projects do I have',
        'view my projects',
        'see all my projects'
      ];
      
      for (const query of projectListQueries) {
        jest.clearAllMocks();
        
        // Mock orchestrator response for each query
        mockLambdaSend.mockResolvedValue({
          Payload: Buffer.from(JSON.stringify({
            success: true,
            message: `## Your Renewable Energy Projects\n\nYou don't have any renewable energy projects yet.`,
            artifacts: [],
            thoughtSteps: [
              {
                action: 'Listing projects',
                result: 'Found 0 project(s)',
                status: 'complete'
              }
            ],
            metadata: {
              toolsUsed: ['project_list'],
              projectCount: 0
            }
          }))
        });
        
        const response = await proxyAgent.processQuery(
          query,
          [],
          { chatSessionId: `${sessionId}-${Math.random()}`, userId }
        );
        
        // Verify each query succeeds and returns project list
        expect(response.success).toBe(true);
        expect(response.message).toContain('Your Renewable Energy Projects');
        expect(response.artifacts!.length).toBe(0);
        
        // Verify Lambda was called for each query
        expect(mockLambdaSend).toHaveBeenCalledTimes(1);
      }
    });
    
    it('should handle empty project list gracefully', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator response with empty project list
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: `## Your Renewable Energy Projects

You don't have any renewable energy projects yet.

To get started, try:
- "analyze terrain at [latitude], [longitude]"
- "optimize layout for [location]"`,
          artifacts: [],
          thoughtSteps: [
            {
              action: 'Listing projects',
              result: 'Found 0 project(s)',
              status: 'complete'
            }
          ],
          metadata: {
            toolsUsed: ['project_list'],
            projectCount: 0
          }
        }))
      });
      
      const query = 'list my renewable projects';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Verify the request succeeded
      expect(response.success).toBe(true);
      
      // Verify response indicates no projects
      expect(response.message).toContain('Your Renewable Energy Projects');
      expect(response.message).toContain('don\'t have any renewable energy projects yet');
      expect(response.message).toContain('analyze terrain');
      
      // Verify no artifacts
      expect(response.artifacts!.length).toBe(0);
    });
    
    it('should NOT return terrain artifacts for project list queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator response with project list (no terrain artifacts)
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: `## Your Renewable Energy Projects\n\nFound 1 project(s):\n\n### 1. my-wind-farm`,
          artifacts: [],
          thoughtSteps: [],
          metadata: {
            toolsUsed: ['project_list'],
            projectCount: 1
          }
        }))
      });
      
      const query = 'list my renewable projects';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // CRITICAL: Verify response is project list, NOT terrain analysis
      expect(response.success).toBe(true);
      expect(response.message).toContain('Your Renewable Energy Projects');
      
      // Verify NO terrain artifacts in response
      expect(response.artifacts!.length).toBe(0);
      
      // Verify no terrain-related content
      const hasTerrainArtifact = response.artifacts!.some(
        artifact => artifact.type === 'wind_farm_terrain_analysis'
      );
      expect(hasTerrainArtifact).toBe(false);
    });
    
    it('should handle project details query through proxy agent', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      const projectName = 'test-wind-farm-123';
      
      // Mock orchestrator response with project details
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: `## Project: ${projectName}

**Status**: In Progress
**Location**: 35.0°N, -101.0°W
**Created**: 2024-01-01
**Last Updated**: 2024-01-02

### Analysis Results:
- Terrain Analysis: Complete
- Layout Optimization: Complete
- Turbine Count: 10
- Total Capacity: 25 MW`,
          artifacts: [],
          thoughtSteps: [
            {
              action: 'Loading project details',
              result: `Loaded project: ${projectName}`,
              status: 'complete'
            }
          ],
          metadata: {
            toolsUsed: ['project_details'],
            projectName
          }
        }))
      });
      
      const query = `show project ${projectName}`;
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Verify the request succeeded
      expect(response.success).toBe(true);
      
      // Verify response contains project details
      expect(response.message).toContain(`Project: ${projectName}`);
      expect(response.message).toContain('Status');
      expect(response.message).toContain('Location');
      
      // Verify no terrain artifacts
      expect(response.artifacts!.length).toBe(0);
    });
    
    it('should handle errors gracefully in project listing flow', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Mock orchestrator error response
      mockLambdaSend.mockRejectedValue(new Error('Failed to list projects'));
      
      const query = 'list my renewable projects';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Verify error is handled gracefully
      expect(response.success).toBe(false);
      expect(response.message).toContain('error');
      expect(response.artifacts).toEqual([]);
      
      // Verify thought steps show error
      expect(response.thoughtSteps).toBeDefined();
      const errorStep = response.thoughtSteps!.find(
        step => step.status === 'error'
      );
      expect(errorStep).toBeDefined();
    });
  });
  
  describe('Cross-Query Validation', () => {
    it('should correctly distinguish between terrain and project list queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Test 1: Terrain query
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: 'Terrain analysis completed',
          artifacts: [{
            type: 'wind_farm_terrain_analysis',
            data: {
              messageContentType: 'wind_farm_terrain_analysis',
              features: [],
              analysis: {}
            }
          }],
          thoughtSteps: [],
          metadata: { toolsUsed: ['terrain_analysis'] }
        }))
      });
      
      const terrainQuery = 'analyze terrain at 35.0, -101.0';
      const terrainResponse = await proxyAgent.processQuery(
        terrainQuery,
        [],
        { chatSessionId: `${sessionId}-1`, userId }
      );
      
      expect(terrainResponse.success).toBe(true);
      expect(terrainResponse.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      expect(terrainResponse.message).not.toContain('Your Renewable Energy Projects');
      
      // Test 2: Project list query
      jest.clearAllMocks();
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: '## Your Renewable Energy Projects\n\nFound 0 project(s)',
          artifacts: [],
          thoughtSteps: [],
          metadata: { toolsUsed: ['project_list'], projectCount: 0 }
        }))
      });
      
      const listQuery = 'list my projects';
      const listResponse = await proxyAgent.processQuery(
        listQuery,
        [],
        { chatSessionId: `${sessionId}-2`, userId }
      );
      
      expect(listResponse.success).toBe(true);
      expect(listResponse.message).toContain('Your Renewable Energy Projects');
      expect(listResponse.artifacts!.length).toBe(0);
    });
    
    it('should handle queries with ambiguous keywords correctly', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const userId = `test-user-${Date.now()}`;
      
      // Query that mentions "project" but is a terrain analysis
      mockLambdaSend.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          message: 'Terrain analysis completed for your project location',
          artifacts: [{
            type: 'wind_farm_terrain_analysis',
            data: {
              messageContentType: 'wind_farm_terrain_analysis',
              features: [],
              analysis: {}
            }
          }],
          thoughtSteps: [],
          metadata: { toolsUsed: ['terrain_analysis'] }
        }))
      });
      
      const query = 'analyze terrain for my project at 35.0, -101.0';
      const response = await proxyAgent.processQuery(
        query,
        [],
        { chatSessionId: sessionId, userId }
      );
      
      // Should route to terrain analysis, not project list
      expect(response.success).toBe(true);
      expect(response.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      expect(response.message).not.toContain('Your Renewable Energy Projects');
    });
  });
});
