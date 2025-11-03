/**
 * Integration Tests for Project Dashboard End-to-End Flow
 * 
 * Tests the complete flow from query to artifact rendering:
 * - "show my project dashboard" generates artifact (not text)
 * - Artifact contains all projects
 * - "list my projects" returns text (backward compatibility)
 * 
 * Requirements: 3.1, 4.1, 4.2
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
  UpdateItemCommand: jest.fn(),
  QueryCommand: jest.fn()
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

// Mock ProjectStore
jest.mock('../../amplify/functions/shared/projectStore', () => {
  return {
    ProjectStore: jest.fn().mockImplementation(() => ({
      list: jest.fn(),
      load: jest.fn(),
      save: jest.fn()
    }))
  };
});

// Mock SessionContextManager
jest.mock('../../amplify/functions/shared/sessionContextManager', () => {
  return {
    SessionContextManager: jest.fn().mockImplementation(() => ({
      getActiveProject: jest.fn(),
      setActiveProject: jest.fn(),
      getProjectHistory: jest.fn()
    }))
  };
});

// Import mocked clients
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Increase timeout for integration tests
jest.setTimeout(15000);

describe('Project Dashboard End-to-End Integration Tests', () => {
  let mockS3Send: jest.Mock;
  let mockDynamoDBSend: jest.Mock;
  let mockProjectStoreList: jest.Mock;
  let mockGetActiveProject: jest.Mock;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockS3Send = jest.fn();
    mockDynamoDBSend = jest.fn();
    mockProjectStoreList = jest.fn();
    mockGetActiveProject = jest.fn();
    
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send
    }));
    
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({
      send: mockDynamoDBSend
    }));
    
    (ProjectStore as jest.Mock).mockImplementation(() => ({
      list: mockProjectStoreList,
      load: jest.fn(),
      save: jest.fn()
    }));
    
    (SessionContextManager as jest.Mock).mockImplementation(() => ({
      getActiveProject: mockGetActiveProject,
      setActiveProject: jest.fn(),
      getProjectHistory: jest.fn()
    }));
    
    // Set required environment variables
    process.env.RENEWABLE_S3_BUCKET = 'test-renewable-bucket';
    process.env.SESSION_CONTEXT_TABLE = 'test-session-context-table';
    process.env.PROJECTS_TABLE = 'test-projects-table';
  });
  
  describe('9.1 Dashboard Query Returns Artifact', () => {
    it('should generate artifact for "show my project dashboard" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB to return active project
      mockDynamoDBSend.mockResolvedValueOnce({
        Item: {
          session_id: { S: sessionId },
          active_project: { S: 'wind-farm-texas' },
          project_history: { L: [{ S: 'wind-farm-texas' }] },
          updated_at: { S: new Date().toISOString() }
        }
      });
      
      // Mock ProjectStore to return list of projects
      mockProjectStoreList.mockResolvedValueOnce([
        {
          project_name: 'wind-farm-texas',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          terrain_results: { features: [] },
          layout_results: { turbines: [] },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T12:00:00Z'
        },
        {
          project_name: 'wind-farm-oklahoma',
          coordinates: { latitude: 36.0, longitude: -97.5 },
          terrain_results: { features: [] },
          created_at: '2024-01-14T09:00:00Z',
          updated_at: '2024-01-14T11:00:00Z'
        },
        {
          project_name: 'wind-farm-kansas',
          coordinates: { latitude: 37.5, longitude: -98.0 },
          created_at: '2024-01-13T08:00:00Z',
          updated_at: '2024-01-13T10:00:00Z'
        }
      ]);
      
      // Send dashboard query
      const request: OrchestratorRequest = {
        query: 'show my project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify response is successful
      expect(response.success).toBe(true);
      
      // Verify artifact is generated (not text-only)
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts).toHaveLength(1);
      
      // Verify artifact type is project_dashboard
      expect(response.artifacts![0].type).toBe('project_dashboard');
      expect(response.artifacts![0].title).toBe('Renewable Energy Projects Dashboard');
      
      // Verify artifact contains data
      expect(response.artifacts![0].data).toBeDefined();
      expect(response.artifacts![0].data.projects).toBeDefined();
      expect(response.artifacts![0].data.totalProjects).toBe(3);
      
      // Verify message is brief (not full text list)
      expect(response.message).toContain('Found 3 renewable energy projects');
      expect(response.message.length).toBeLessThan(200);
    });
    
    it('should generate artifact for "project dashboard" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB and ProjectStore responses
      mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      expect(response.success).toBe(true);
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts).toHaveLength(1);
      expect(response.artifacts![0].type).toBe('project_dashboard');
    });
    
    it('should generate artifact for "dashboard" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB and ProjectStore responses
      mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      expect(response.success).toBe(true);
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts![0].type).toBe('project_dashboard');
    });
  });
  
  describe('9.2 Artifact Contains All Projects', () => {
    it('should include all projects in dashboard artifact', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock SessionContextManager to return active project
      mockGetActiveProject.mockResolvedValueOnce('project-2');
      
      // Mock ProjectStore to return 5 projects
      const mockProjects = [
        {
          project_name: 'project-1',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { features: [] },
          layout_results: { turbines: [] },
          simulation_results: { energy: 100 },
          report_results: { pdf_url: 'https://example.com/report.pdf' },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T12:00:00Z'
        },
        {
          project_name: 'project-2',
          coordinates: { latitude: 36.0, longitude: -102.0 },
          terrain_results: { features: [] },
          layout_results: { turbines: [] },
          simulation_results: { energy: 95 },
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T12:00:00Z'
        },
        {
          project_name: 'project-3',
          coordinates: { latitude: 37.0, longitude: -103.0 },
          terrain_results: { features: [] },
          layout_results: { turbines: [] },
          created_at: '2024-01-13T10:00:00Z',
          updated_at: '2024-01-13T12:00:00Z'
        },
        {
          project_name: 'project-4',
          coordinates: { latitude: 38.0, longitude: -104.0 },
          terrain_results: { features: [] },
          created_at: '2024-01-12T10:00:00Z',
          updated_at: '2024-01-12T12:00:00Z'
        },
        {
          project_name: 'project-5',
          coordinates: { latitude: 39.0, longitude: -105.0 },
          created_at: '2024-01-11T10:00:00Z',
          updated_at: '2024-01-11T12:00:00Z'
        }
      ];
      
      mockProjectStoreList.mockResolvedValueOnce(mockProjects);
      
      const request: OrchestratorRequest = {
        query: 'show my project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify all projects are included
      expect(response.artifacts![0].data.projects).toHaveLength(5);
      expect(response.artifacts![0].data.totalProjects).toBe(5);
      
      // Verify project data structure
      const projects = response.artifacts![0].data.projects;
      expect(projects[0]).toHaveProperty('name');
      expect(projects[0]).toHaveProperty('location');
      expect(projects[0]).toHaveProperty('completionPercentage');
      expect(projects[0]).toHaveProperty('lastUpdated');
      expect(projects[0]).toHaveProperty('isActive');
      expect(projects[0]).toHaveProperty('isDuplicate');
      expect(projects[0]).toHaveProperty('status');
      
      // Verify completion percentages are calculated
      expect(projects[0].completionPercentage).toBe(100); // All 4 steps complete
      expect(projects[1].completionPercentage).toBe(75);  // 3 steps complete
      expect(projects[2].completionPercentage).toBe(50);  // 2 steps complete
      expect(projects[3].completionPercentage).toBe(25);  // 1 step complete
      expect(projects[4].completionPercentage).toBe(0);   // 0 steps complete
      
      // Verify active project is marked
      expect(projects[1].isActive).toBe(true);
      expect(projects[0].isActive).toBe(false);
      expect(projects[2].isActive).toBe(false);
    });
    
    it('should include duplicate detection in artifact', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB and ProjectStore responses
      mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
      mockProjectStoreList.mockResolvedValueOnce([
        {
          project_name: 'project-a',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T12:00:00Z'
        },
        {
          project_name: 'project-b',
          coordinates: { latitude: 35.0005, longitude: -101.0005 }, // ~50m away
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T12:00:00Z'
        },
        {
          project_name: 'project-c',
          coordinates: { latitude: 36.0, longitude: -102.0 }, // Far away
          created_at: '2024-01-13T10:00:00Z',
          updated_at: '2024-01-13T12:00:00Z'
        }
      ]);
      
      const request: OrchestratorRequest = {
        query: 'show my project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify duplicate groups are detected
      expect(response.artifacts![0].data.duplicateGroups).toBeDefined();
      expect(response.artifacts![0].data.duplicateGroups.length).toBeGreaterThan(0);
      
      // Verify duplicate projects are marked
      const projects = response.artifacts![0].data.projects;
      const duplicateProjects = projects.filter((p: any) => p.isDuplicate);
      expect(duplicateProjects.length).toBe(2); // project-a and project-b
    });
  });
  
  describe('9.3 Backward Compatibility - List Query Returns Text', () => {
    it('should return text for "list my projects" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock ProjectStore to return projects
      mockProjectStoreList.mockResolvedValueOnce([
        {
          project_name: 'wind-farm-texas',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T12:00:00Z'
        },
        {
          project_name: 'wind-farm-oklahoma',
          coordinates: { latitude: 36.0, longitude: -97.5 },
          created_at: '2024-01-14T09:00:00Z',
          updated_at: '2024-01-14T11:00:00Z'
        }
      ]);
      
      const request: OrchestratorRequest = {
        query: 'list my projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify response is successful
      expect(response.success).toBe(true);
      
      // Verify NO artifact is generated (text-only response)
      expect(response.artifacts).toEqual([]);
      
      // Verify message contains formatted text list
      expect(response.message).toContain('wind-farm-texas');
      expect(response.message).toContain('wind-farm-oklahoma');
      expect(response.message).toContain('35.067482');
      expect(response.message).toContain('36.0');
      expect(response.message.length).toBeGreaterThan(200); // Full text response
    });
    
    it('should return text for "list my renewable projects" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'list my renewable projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      expect(response.success).toBe(true);
      expect(response.artifacts).toEqual([]);
      expect(response.message).toContain("don't have any");
    });
    
    it('should return text for "show my projects" query', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'show my projects',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      expect(response.success).toBe(true);
      expect(response.artifacts).toEqual([]);
    });
  });
  
  describe('9.4 Dashboard vs List Query Differentiation', () => {
    it('should NOT generate artifact for list queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      mockProjectStoreList.mockResolvedValue([]);
      
      const listQueries = [
        'list my projects',
        'list my renewable projects',
        'show my projects',
        'what projects do I have'
      ];
      
      for (const query of listQueries) {
        const request: OrchestratorRequest = {
          query,
          sessionId: `${sessionId}-${query}`,
          context: {}
        };
        
        const response = await handler(request);
        
        expect(response.artifacts).toEqual([]);
        expect(response.message).toBeDefined();
      }
    });
    
    it('should generate artifact for dashboard queries', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      const dashboardQueries = [
        'show my project dashboard',
        'project dashboard',
        'dashboard',
        'view dashboard',
        'open dashboard'
      ];
      
      for (const query of dashboardQueries) {
        jest.clearAllMocks();
        mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
        mockProjectStoreList.mockResolvedValueOnce([]);
        
        const request: OrchestratorRequest = {
          query,
          sessionId: `${sessionId}-${query}`,
          context: {}
        };
        
        const response = await handler(request);
        
        expect(response.artifacts).toBeDefined();
        expect(response.artifacts).toHaveLength(1);
        expect(response.artifacts![0].type).toBe('project_dashboard');
      }
    });
  });
  
  describe('9.5 Empty Projects Handling', () => {
    it('should handle empty project list gracefully', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Mock DynamoDB and ProjectStore to return no projects
      mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'show my project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify response is successful
      expect(response.success).toBe(true);
      
      // Verify artifact is still generated (empty dashboard)
      expect(response.artifacts).toBeDefined();
      expect(response.artifacts).toHaveLength(1);
      expect(response.artifacts![0].data.projects).toHaveLength(0);
      expect(response.artifacts![0].data.totalProjects).toBe(0);
      
      // Verify friendly message
      expect(response.message).toContain("don't have any");
    });
  });
  
  describe('9.6 Thought Steps Validation', () => {
    it('should include thought steps for dashboard generation', async () => {
      const sessionId = `test-session-${Date.now()}`;
      
      mockDynamoDBSend.mockResolvedValueOnce({ Item: undefined });
      mockProjectStoreList.mockResolvedValueOnce([]);
      
      const request: OrchestratorRequest = {
        query: 'show my project dashboard',
        sessionId,
        context: {}
      };
      
      const response = await handler(request);
      
      // Verify thought steps are included
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
      
      // Verify dashboard generation step
      const dashboardStep = response.thoughtSteps!.find(
        step => step.action.includes('dashboard') || step.action.includes('Dashboard')
      );
      expect(dashboardStep).toBeDefined();
      expect(dashboardStep!.status).toBe('complete');
    });
  });
});
