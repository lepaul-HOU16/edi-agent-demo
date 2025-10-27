/**
 * Integration Tests for Orchestrator Flow with Context-Aware Validation
 * 
 * Tests the complete orchestrator flow including:
 * - Terrain analysis followed by layout optimization (auto-fill coordinates)
 * - Layout optimization followed by wake simulation (auto-fill layout data)
 * - Error handling for missing context
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

describe('Orchestrator Flow Integration Tests', () => {
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
  
  describe('6.1 Terrain Analysis followed by Layout Optimization', () => {
    it('should auto-fill coordinates from terrain analysis project', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const testCoordinates = {
        latitude: 35.067482,
        longitude: -101.395466
      };
      
      // Track the project name that gets created
      let createdProjectName: string | undefined;
      
      // Mock DynamoDB responses for session context
      let dynamoCallCount = 0;
      mockDynamoDBSend.mockImplementation(() => {
        dynamoCallCount++;
        
        // First call: Get session context (empty initially)
        if (dynamoCallCount === 1) {
          return Promise.resolve({ Item: undefined });
        }
        // Second call: Put session context (after terrain analysis) - capture project name
        if (dynamoCallCount === 2) {
          return Promise.resolve({});
        }
        // Third call: Get session context (with active project)
        if (dynamoCallCount === 3) {
          return Promise.resolve({
            Item: {
              session_id: { S: sessionId },
              active_project: { S: createdProjectName || 'test-project' },
              project_history: { L: [{ S: createdProjectName || 'test-project' }] },
              updated_at: { S: new Date().toISOString() }
            }
          });
        }
        // Fourth call: Update session context (after layout optimization)
        return Promise.resolve({});
      });
      
      // Mock S3 responses for project data
      let s3CallCount = 0;
      mockS3Send.mockImplementation((command: any) => {
        s3CallCount++;
        
        console.log(`S3 Call ${s3CallCount}:`, command.constructor.name, command.input?.Key);
        
        // First call: Check if project exists (terrain analysis)
        if (s3CallCount === 1) {
          return Promise.resolve({ Body: undefined });
        }
        // Second call: Save terrain analysis results - capture project name from the key
        if (s3CallCount === 2) {
          // Extract project name from S3 key if available
          if (command.input?.Key) {
            const match = command.input.Key.match(/projects\/([^\/]+)\//);
            if (match) {
              createdProjectName = match[1];
              console.log(`✅ Captured project name: ${createdProjectName}`);
            }
          }
          return Promise.resolve({});
        }
        // Third call: Load project data (for layout optimization)
        if (s3CallCount === 3) {
          const projectData = JSON.stringify({
            project_name: createdProjectName || 'test-project',
            coordinates: testCoordinates,
            terrain_results: {
              features: [
                { type: 'Feature', geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] } }
              ],
              analysis: { suitable_area_km2: 25.5 }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          console.log(`✅ Returning project data for: ${createdProjectName}`);
          
          return Promise.resolve({
            Body: {
              transformToString: jest.fn().mockResolvedValue(projectData)
            }
          });
        }
        // Fourth call: Save layout optimization results
        return Promise.resolve({});
      });
      
      // Mock Lambda invocations
      mockLambdaSend
        // First call: Terrain analysis tool
        .mockResolvedValueOnce({
          Payload: Buffer.from(JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              data: {
                features: [
                  { type: 'Feature', geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] } }
                ],
                analysis: { suitable_area_km2: 25.5 }
              },
              artifacts: [{
                type: 'wind_farm_terrain_analysis',
                title: 'Terrain Analysis',
                data: {
                  features: [
                    { type: 'Feature', geometry: { type: 'Point', coordinates: [-101.395466, 35.067482] } }
                  ]
                }
              }]
            })
          }))
        })
        // Second call: Layout optimization tool
        .mockResolvedValueOnce({
          Payload: Buffer.from(JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              data: {
                turbines: [
                  { id: 1, latitude: 35.067482, longitude: -101.395466, capacity_mw: 2.5 }
                ],
                turbine_count: 12,
                total_capacity_mw: 30
              },
              artifacts: [{
                type: 'wind_farm_layout',
                title: 'Wind Farm Layout',
                data: {
                  turbines: [
                    { id: 1, latitude: 35.067482, longitude: -101.395466, capacity_mw: 2.5 }
                  ]
                }
              }]
            })
          }))
        });
      
      // Step 1: Run terrain analysis with coordinates
      const terrainRequest: OrchestratorRequest = {
        query: `analyze terrain at ${testCoordinates.latitude}, ${testCoordinates.longitude}`,
        sessionId,
        context: {}
      };
      
      const terrainResponse = await handler(terrainRequest);
      
      // Verify terrain analysis succeeded
      expect(terrainResponse.success).toBe(true);
      expect(terrainResponse.artifacts).toHaveLength(1);
      expect(terrainResponse.artifacts![0].type).toBe('wind_farm_terrain_analysis');
      expect(terrainResponse.metadata?.projectName).toBeDefined();
      
      // Get the generated project name for use in subsequent steps
      const projectName = terrainResponse.metadata?.projectName!;
      
      // Verify thought steps include project data saving
      const saveProjectStep = terrainResponse.thoughtSteps?.find(
        step => step.action === 'Saving project data'
      );
      expect(saveProjectStep).toBeDefined();
      expect(saveProjectStep?.status).toBe('complete');
      
      // Step 2: Run layout optimization WITHOUT coordinates
      const layoutRequest: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId,
        context: {}
      };
      
      const layoutResponse = await handler(layoutRequest);
      
      // Debug: Log the response if it failed
      if (!layoutResponse.success) {
        console.log('❌ Layout optimization failed:');
        console.log('Message:', layoutResponse.message);
        console.log('Metadata:', JSON.stringify(layoutResponse.metadata, null, 2));
      }
      
      // Verify layout optimization succeeded
      expect(layoutResponse.success).toBe(true);
      expect(layoutResponse.artifacts).toHaveLength(1);
      expect(layoutResponse.artifacts![0].type).toBe('wind_farm_layout');
      
      // Verify thought steps show project data was loaded
      const loadProjectStep = layoutResponse.thoughtSteps?.find(
        step => step.action === 'Resolving project context'
      );
      expect(loadProjectStep).toBeDefined();
      expect(loadProjectStep?.status).toBe('complete');
      expect(loadProjectStep?.result).toContain('Loaded project');
      
      // Verify thought steps show parameters were validated successfully
      const validateStep = layoutResponse.thoughtSteps?.find(
        step => step.action === 'Validating parameters'
      );
      expect(validateStep).toBeDefined();
      expect(validateStep?.status).toBe('complete');
      expect(validateStep?.result).toMatch(/Parameters valid|from context/);
      
      // Verify metadata shows context was used
      expect(layoutResponse.metadata?.parameterValidation).toBeDefined();
      if (layoutResponse.metadata?.parameterValidation) {
        expect(layoutResponse.metadata.parameterValidation.contextUsed).toBe(true);
        expect(layoutResponse.metadata.parameterValidation.satisfiedByContext).toContain('latitude');
        expect(layoutResponse.metadata.parameterValidation.satisfiedByContext).toContain('longitude');
      }
    });
    
    it('should use explicit coordinates even when project context exists', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const projectCoordinates = {
        latitude: 35.067482,
        longitude: -101.395466
      };
      const explicitCoordinates = {
        latitude: 40.0,
        longitude: -100.0
      };
      
      // Mock DynamoDB responses
      mockDynamoDBSend
        .mockResolvedValueOnce({
          Item: {
            session_id: { S: sessionId },
            active_project: { S: 'existing-project' },
            project_history: { L: [{ S: 'existing-project' }] },
            updated_at: { S: new Date().toISOString() }
          }
        })
        .mockResolvedValue({});
      
      // Mock S3 responses
      mockS3Send
        .mockResolvedValueOnce({
          Body: {
            transformToString: async () => JSON.stringify({
              project_name: 'existing-project',
              coordinates: projectCoordinates,
              terrain_results: { features: [] },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        })
        .mockResolvedValue({});
      
      // Mock Lambda invocation
      mockLambdaSend.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { turbines: [], turbine_count: 0 },
            artifacts: [{
              type: 'wind_farm_layout',
              title: 'Wind Farm Layout',
              data: { turbines: [] }
            }]
          })
        }))
      });
      
      // Request layout optimization with explicit coordinates
      const request: OrchestratorRequest = {
        query: `optimize layout at ${explicitCoordinates.latitude}, ${explicitCoordinates.longitude}`,
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify explicit coordinates were used
      expect(response.success).toBe(true);
      
      // Verify metadata shows context was NOT used for coordinates
      if (response.metadata?.parameterValidation) {
        expect(response.metadata.parameterValidation.satisfiedByContext).not.toContain('latitude');
        expect(response.metadata.parameterValidation.satisfiedByContext).not.toContain('longitude');
      }
      
      // Verify Lambda was called with explicit coordinates
      expect(mockLambdaSend).toHaveBeenCalled();
      const lambdaCall = mockLambdaSend.mock.calls[0][0];
      const payload = JSON.parse(Buffer.from(lambdaCall.input.Payload).toString());
      expect(payload.latitude).toBe(explicitCoordinates.latitude);
      expect(payload.longitude).toBe(explicitCoordinates.longitude);
    });
  });
  
  describe('6.2 Layout Optimization followed by Wake Simulation', () => {
    it('should auto-fill layout data from project context', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const testCoordinates = {
        latitude: 35.067482,
        longitude: -101.395466
      };
      const layoutData = {
        turbines: [
          { id: 1, latitude: 35.067482, longitude: -101.395466, capacity_mw: 2.5 },
          { id: 2, latitude: 35.068, longitude: -101.396, capacity_mw: 2.5 }
        ],
        turbine_count: 2,
        total_capacity_mw: 5
      };
      
      // Mock DynamoDB responses
      mockDynamoDBSend
        // Get session context (empty initially)
        .mockResolvedValueOnce({
          Item: undefined
        })
        // Put session context (after layout optimization)
        .mockResolvedValueOnce({})
        // Get session context (with active project)
        .mockResolvedValueOnce({
          Item: {
            session_id: { S: sessionId },
            active_project: { S: 'test-wind-farm' },
            project_history: { L: [{ S: 'test-wind-farm' }] },
            updated_at: { S: new Date().toISOString() }
          }
        })
        // Update session context (after wake simulation)
        .mockResolvedValueOnce({});
      
      // Mock S3 responses
      mockS3Send
        // Check if project exists (layout optimization)
        .mockResolvedValueOnce({
          Body: undefined
        })
        // Save layout optimization results
        .mockResolvedValueOnce({})
        // Load project data (for wake simulation)
        .mockResolvedValueOnce({
          Body: {
            transformToString: async () => JSON.stringify({
              project_name: 'test-wind-farm',
              coordinates: testCoordinates,
              layout_results: layoutData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        })
        // Save wake simulation results
        .mockResolvedValueOnce({});
      
      // Mock Lambda invocations
      mockLambdaSend
        // Layout optimization tool
        .mockResolvedValueOnce({
          Payload: Buffer.from(JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              data: layoutData,
              artifacts: [{
                type: 'wind_farm_layout',
                title: 'Wind Farm Layout',
                data: layoutData
              }]
            })
          }))
        })
        // Wake simulation tool
        .mockResolvedValueOnce({
          Payload: Buffer.from(JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              data: {
                annual_energy_gwh: 15.5,
                capacity_factor: 0.35,
                wake_losses_percent: 8.2
              },
              artifacts: [{
                type: 'wake_simulation',
                title: 'Wake Analysis',
                data: {
                  annual_energy_gwh: 15.5,
                  capacity_factor: 0.35
                }
              }]
            })
          }))
        });
      
      // Step 1: Run layout optimization
      const layoutRequest: OrchestratorRequest = {
        query: `optimize layout at ${testCoordinates.latitude}, ${testCoordinates.longitude}`,
        sessionId,
        context: {}
      };
      
      const layoutResponse = await handler(layoutRequest);
      
      // Verify layout optimization succeeded
      expect(layoutResponse.success).toBe(true);
      expect(layoutResponse.artifacts).toHaveLength(1);
      expect(layoutResponse.artifacts![0].type).toBe('wind_farm_layout');
      expect(layoutResponse.metadata?.projectName).toBe('test-wind-farm');
      
      // Step 2: Run wake simulation WITHOUT project ID
      const simulationRequest: OrchestratorRequest = {
        query: 'run wake simulation',
        sessionId,
        context: {}
      };
      
      const simulationResponse = await handler(simulationRequest);
      
      // Verify wake simulation succeeded
      expect(simulationResponse.success).toBe(true);
      expect(simulationResponse.artifacts).toHaveLength(1);
      expect(simulationResponse.artifacts![0].type).toBe('wake_simulation');
      
      // Verify thought steps show project data was loaded
      const loadProjectStep = simulationResponse.thoughtSteps?.find(
        step => step.action === 'Resolving project context'
      );
      expect(loadProjectStep).toBeDefined();
      expect(loadProjectStep?.status).toBe('complete');
      expect(loadProjectStep?.result).toContain('Loaded project');
      
      // Verify thought steps show parameters were validated successfully
      const validateStep = simulationResponse.thoughtSteps?.find(
        step => step.action === 'Validating parameters'
      );
      expect(validateStep).toBeDefined();
      expect(validateStep?.status).toBe('complete');
      
      // Verify metadata shows context was used
      expect(simulationResponse.metadata?.parameterValidation).toBeDefined();
      if (simulationResponse.metadata?.parameterValidation) {
        expect(simulationResponse.metadata.parameterValidation.contextUsed).toBe(true);
      }
      
      // Verify Lambda was called with layout data from context
      expect(mockLambdaSend).toHaveBeenCalledTimes(2);
      const simulationCall = mockLambdaSend.mock.calls[1][0];
      const payload = JSON.parse(Buffer.from(simulationCall.input.Payload).toString());
      expect(payload.project_id).toBe('test-wind-farm');
    });
    
    it('should fail wake simulation without layout context', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB responses (no active project)
      mockDynamoDBSend.mockResolvedValue({
        Item: undefined
      });
      
      // Mock S3 responses (no project data)
      mockS3Send.mockResolvedValue({
        Body: undefined
      });
      
      // Request wake simulation without prior layout
      const request: OrchestratorRequest = {
        query: 'run wake simulation',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify request failed with helpful error
      expect(response.success).toBe(false);
      expect(response.message).toContain('Missing required information');
      expect(response.message).toContain('wake simulation');
      expect(response.message).toMatch(/create a layout|provide a project/i);
      
      // Verify no Lambda was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
  });
  
  describe('6.3 Error Handling for Missing Context', () => {
    it('should return helpful error for layout optimization without context', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB responses (no active project)
      mockDynamoDBSend.mockResolvedValue({
        Item: undefined
      });
      
      // Mock S3 responses (no project data)
      mockS3Send.mockResolvedValue({
        Body: undefined
      });
      
      // Request layout optimization without coordinates or prior terrain analysis
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify request failed
      expect(response.success).toBe(false);
      
      // Verify error message is helpful and includes suggestions
      expect(response.message).toContain('Missing required information');
      expect(response.message).toContain('latitude');
      expect(response.message).toContain('longitude');
      
      // Verify suggestions are included
      expect(response.message).toMatch(/provide coordinates|run terrain analysis/i);
      expect(response.message).toContain('optimize layout at');
      expect(response.message).toContain('analyze terrain');
      
      // Verify thought steps show validation failure
      const validateStep = response.thoughtSteps?.find(
        step => step.action === 'Validating parameters'
      );
      expect(validateStep).toBeDefined();
      expect(validateStep?.status).toBe('error');
      expect(validateStep?.error).toBeDefined();
      expect(validateStep?.error?.message).toContain('Missing');
      
      // Verify metadata includes validation errors
      expect(response.metadata?.validationErrors).toBeDefined();
      expect(response.metadata?.validationErrors?.length).toBeGreaterThan(0);
      if (response.metadata?.parameterValidation) {
        expect(response.metadata.parameterValidation.missingRequired).toContain('latitude');
        expect(response.metadata.parameterValidation.missingRequired).toContain('longitude');
      }
      
      // Verify no Lambda was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
    
    it('should return helpful error for report generation without context', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB responses (no active project)
      mockDynamoDBSend.mockResolvedValue({
        Item: undefined
      });
      
      // Mock S3 responses (no project data)
      mockS3Send.mockResolvedValue({
        Body: undefined
      });
      
      // Request report generation without prior analysis
      const request: OrchestratorRequest = {
        query: 'generate report',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify request failed
      expect(response.success).toBe(false);
      
      // Verify error message is helpful
      expect(response.message).toContain('Missing required information');
      expect(response.message).toContain('project_id');
      
      // Verify suggestions are included
      expect(response.message).toMatch(/complete terrain analysis|layout optimization|provide a project/i);
      
      // Verify no Lambda was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
    
    it('should include active project name in error message when available', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const activeProject = 'incomplete-project';
      
      // Mock DynamoDB responses (has active project but no coordinates)
      mockDynamoDBSend.mockResolvedValue({
        Item: {
          session_id: { S: sessionId },
          active_project: { S: activeProject },
          project_history: { L: [{ S: activeProject }] },
          updated_at: { S: new Date().toISOString() }
        }
      });
      
      // Mock S3 responses (project exists but has no coordinates)
      mockS3Send.mockResolvedValue({
        Body: {
          transformToString: async () => JSON.stringify({
            project_name: activeProject,
            // No coordinates
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      });
      
      // Request layout optimization
      const request: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify request failed
      expect(response.success).toBe(false);
      
      // Verify error message includes active project name
      expect(response.message).toContain('Missing required information');
      expect(response.message).toContain(activeProject);
      
      // Verify no Lambda was called
      expect(mockLambdaSend).not.toHaveBeenCalled();
    });
    
    it('should provide context-specific guidance for each intent type', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB and S3 to return no context
      mockDynamoDBSend.mockResolvedValue({ Item: undefined });
      mockS3Send.mockResolvedValue({ Body: undefined });
      
      // Test layout optimization error message
      const layoutRequest: OrchestratorRequest = {
        query: 'optimize layout',
        sessionId,
        context: {}
      };
      const layoutResponse = await handler(layoutRequest);
      expect(layoutResponse.message).toMatch(/provide coordinates|run terrain analysis/i);
      
      // Test wake simulation error message
      const simulationRequest: OrchestratorRequest = {
        query: 'run wake simulation',
        sessionId: `${sessionId}-2`,
        context: {}
      };
      const simulationResponse = await handler(simulationRequest);
      expect(simulationResponse.message).toMatch(/create a layout|provide a project/i);
      
      // Test report generation error message
      const reportRequest: OrchestratorRequest = {
        query: 'generate report',
        sessionId: `${sessionId}-3`,
        context: {}
      };
      const reportResponse = await handler(reportRequest);
      expect(reportResponse.message).toMatch(/complete terrain analysis|layout optimization/i);
    });
  });
});
