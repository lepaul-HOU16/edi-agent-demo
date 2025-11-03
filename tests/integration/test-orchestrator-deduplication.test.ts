/**
 * Integration Tests for Orchestrator Deduplication Flow
 * 
 * Tests the complete deduplication flow in the renewable orchestrator,
 * including duplicate detection and user choice handling.
 */

import { handler } from '../../amplify/functions/renewableOrchestrator/handler';
import type { OrchestratorRequest, OrchestratorResponse } from '../../amplify/functions/renewableOrchestrator/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-dynamodb');

describe('Orchestrator - Deduplication Integration', () => {
  const testCoordinates = {
    latitude: 35.067482,
    longitude: -101.395466
  };

  beforeEach(() => {
    // Set required environment variables
    process.env.RENEWABLE_S3_BUCKET = 'test-bucket';
    process.env.SESSION_CONTEXT_TABLE = 'test-table';
    process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME = 'test-terrain-function';
    process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME = 'test-layout-function';
    process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME = 'test-simulation-function';
    process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME = 'test-report-function';
  });

  describe('Terrain Analysis with Duplicate Detection', () => {
    it('should detect duplicates and prompt user when existing project found', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-1',
        context: {}
      };

      // Mock ProjectStore to return existing project
      const mockProjectStore = {
        list: jest.fn().mockResolvedValue([
          {
            project_name: 'texas-wind-farm-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            coordinates: testCoordinates,
            terrain_results: { s3_key: 'terrain-1' },
            metadata: {}
          }
        ]),
        load: jest.fn().mockResolvedValue(null)
      };

      // Mock the ProjectStore import
      jest.mock('../../amplify/functions/shared/projectStore', () => ({
        ProjectStore: jest.fn(() => mockProjectStore)
      }));

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Found existing project(s)');
      expect(response.message).toContain('texas-wind-farm-1');
      expect(response.message).toContain('Would you like to:');
      expect(response.metadata?.requiresUserChoice).toBe(true);
      expect(response.metadata?.duplicateProjects).toBeDefined();
    });

    it('should proceed with new project when no duplicates found', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-2',
        context: {}
      };

      // Mock ProjectStore to return empty list
      const mockProjectStore = {
        list: jest.fn().mockResolvedValue([]),
        load: jest.fn().mockResolvedValue(null)
      };

      jest.mock('../../amplify/functions/shared/projectStore', () => ({
        ProjectStore: jest.fn(() => mockProjectStore)
      }));

      const response = await handler(request);

      // Should proceed with terrain analysis (not return duplicate prompt)
      expect(response.metadata?.requiresUserChoice).toBeUndefined();
    });

    it('should not check for duplicates on non-terrain queries', async () => {
      const request: OrchestratorRequest = {
        query: 'Optimize layout for my project',
        sessionId: 'test-session-3',
        context: {}
      };

      const response = await handler(request);

      // Should not trigger duplicate detection
      expect(response.metadata?.requiresUserChoice).toBeUndefined();
      expect(response.metadata?.duplicateProjects).toBeUndefined();
    });
  });

  describe('Duplicate Choice Handling', () => {
    const mockDuplicateCheckResult = {
      hasDuplicates: true,
      duplicates: [
        {
          project: {
            project_name: 'texas-wind-farm-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            coordinates: testCoordinates,
            terrain_results: { s3_key: 'terrain-1' },
            metadata: {}
          },
          distanceKm: 0.1
        }
      ],
      userPrompt: 'Found existing project...',
      message: 'Found 1 existing project'
    };

    it('should handle choice 1 (continue with existing)', async () => {
      const request: OrchestratorRequest = {
        query: '1',
        sessionId: 'test-session-4',
        context: {
          duplicateCheckResult: mockDuplicateCheckResult
        }
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Continuing with existing project');
      expect(response.message).toContain('texas-wind-farm-1');
      expect(response.metadata?.activeProject).toBe('texas-wind-farm-1');
    });

    it('should handle choice 2 (create new)', async () => {
      const request: OrchestratorRequest = {
        query: '2',
        sessionId: 'test-session-5',
        context: {
          duplicateCheckResult: mockDuplicateCheckResult
        }
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Creating new project');
      expect(response.message).toContain('repeat your terrain analysis query');
      expect(response.metadata?.createNew).toBe(true);
    });

    it('should handle choice 3 (view details)', async () => {
      const request: OrchestratorRequest = {
        query: '3',
        sessionId: 'test-session-6',
        context: {
          duplicateCheckResult: mockDuplicateCheckResult
        }
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Project Details');
      expect(response.message).toContain('texas-wind-farm-1');
      expect(response.message).toContain('Completion:');
    });

    it('should only handle choices when duplicateCheckResult is in context', async () => {
      const request: OrchestratorRequest = {
        query: '1',
        sessionId: 'test-session-7',
        context: {} // No duplicateCheckResult
      };

      const response = await handler(request);

      // Should not be treated as duplicate choice
      expect(response.message).not.toContain('Continuing with existing project');
    });

    it('should handle whitespace in choice', async () => {
      const request: OrchestratorRequest = {
        query: '  1  ',
        sessionId: 'test-session-8',
        context: {
          duplicateCheckResult: mockDuplicateCheckResult
        }
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('Continuing with existing project');
    });
  });

  describe('End-to-End Deduplication Flow', () => {
    it('should complete full flow: detect → prompt → choose → continue', async () => {
      // Step 1: Initial terrain query detects duplicate
      const request1: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-e2e',
        context: {}
      };

      const response1 = await handler(request1);

      expect(response1.success).toBe(true);
      expect(response1.metadata?.requiresUserChoice).toBe(true);
      
      const duplicateCheckResult = response1.metadata?.duplicateCheckResult;
      expect(duplicateCheckResult).toBeDefined();

      // Step 2: User chooses to continue with existing project
      const request2: OrchestratorRequest = {
        query: '1',
        sessionId: 'test-session-e2e',
        context: {
          duplicateCheckResult
        }
      };

      const response2 = await handler(request2);

      expect(response2.success).toBe(true);
      expect(response2.metadata?.activeProject).toBeDefined();
      expect(response2.message).toContain('Continuing with existing project');
    });

    it('should complete full flow: detect → prompt → choose → create new', async () => {
      // Step 1: Initial terrain query detects duplicate
      const request1: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-e2e-2',
        context: {}
      };

      const response1 = await handler(request1);

      expect(response1.success).toBe(true);
      expect(response1.metadata?.requiresUserChoice).toBe(true);

      const duplicateCheckResult = response1.metadata?.duplicateCheckResult;

      // Step 2: User chooses to create new project
      const request2: OrchestratorRequest = {
        query: '2',
        sessionId: 'test-session-e2e-2',
        context: {
          duplicateCheckResult
        }
      };

      const response2 = await handler(request2);

      expect(response2.success).toBe(true);
      expect(response2.metadata?.createNew).toBe(true);
      expect(response2.message).toContain('repeat your terrain analysis query');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple duplicates at different distances', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-multi',
        context: {}
      };

      // Mock multiple projects at different distances
      const mockProjectStore = {
        list: jest.fn().mockResolvedValue([
          {
            project_name: 'texas-wind-farm-1',
            coordinates: testCoordinates,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            metadata: {}
          },
          {
            project_name: 'texas-wind-farm-2',
            coordinates: { latitude: 35.068, longitude: -101.396 },
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            metadata: {}
          }
        ])
      };

      const response = await handler(request);

      expect(response.success).toBe(true);
      expect(response.metadata?.duplicateProjects?.length).toBeGreaterThan(1);
    });

    it('should handle projects without coordinates gracefully', async () => {
      const request: OrchestratorRequest = {
        query: 'Analyze terrain at coordinates 35.067482, -101.395466',
        sessionId: 'test-session-no-coords',
        context: {}
      };

      // Mock project without coordinates
      const mockProjectStore = {
        list: jest.fn().mockResolvedValue([
          {
            project_name: 'incomplete-project',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            metadata: {}
            // No coordinates field
          }
        ])
      };

      const response = await handler(request);

      // Should not crash, should proceed without detecting duplicates
      expect(response.success).toBeDefined();
    });
  });
});
