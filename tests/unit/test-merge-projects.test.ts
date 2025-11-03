/**
 * Unit tests for project merging functionality
 * 
 * Tests Requirements: 4.2, 4.3, 4.4
 */

import { ProjectLifecycleManager, MergeResult } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - Merge Projects', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  beforeEach(() => {
    // Create mocks
    mockProjectStore = new ProjectStore('test-bucket') as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator() as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager(mockProjectStore) as jest.Mocked<SessionContextManager>;

    // Create lifecycle manager
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );

    // Setup default mock implementations
    mockProjectResolver.clearCache = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mergeProjects', () => {
    it('should merge two projects successfully (Requirement 4.2)', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'texas-wind-farm-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        terrain_results: { s3_key: 'terrain-1' },
        layout_results: undefined,
        simulation_results: { s3_key: 'simulation-1' },
        report_results: undefined,
        metadata: { source: 'project1' },
      };

      const targetProject: ProjectData = {
        project_name: 'texas-wind-farm-2',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        terrain_results: undefined,
        layout_results: { s3_key: 'layout-2' },
        simulation_results: undefined,
        report_results: { s3_key: 'report-2' },
        metadata: { target: 'project2' },
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await lifecycleManager.mergeProjects(
        'texas-wind-farm-1',
        'texas-wind-farm-2',
        'texas-wind-farm-2'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.mergedProject).toBe('texas-wind-farm-2');
      expect(result.deletedProject).toBe('texas-wind-farm-1');
      expect(result.message).toContain('merged');
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'texas-wind-farm-2',
        expect.objectContaining({
          project_name: 'texas-wind-farm-2',
          terrain_results: { s3_key: 'terrain-1' }, // From source
          layout_results: { s3_key: 'layout-2' }, // From target
          simulation_results: { s3_key: 'simulation-1' }, // From source
          report_results: { s3_key: 'report-2' }, // From target
        })
      );
      expect(mockProjectStore.delete).toHaveBeenCalledWith('texas-wind-farm-1');
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should keep most complete data when merging (Requirement 4.3)', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        terrain_results: { s3_key: 'terrain-a', data: 'complete' },
        layout_results: undefined,
        simulation_results: undefined,
        report_results: undefined,
        metadata: { quality: 'high' },
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: undefined,
        terrain_results: undefined,
        layout_results: { s3_key: 'layout-b', data: 'complete' },
        simulation_results: { s3_key: 'simulation-b', data: 'complete' },
        report_results: { s3_key: 'report-b', data: 'complete' },
        metadata: { status: 'complete' },
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await lifecycleManager.mergeProjects('project-a', 'project-b', 'project-b');

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'project-b',
        expect.objectContaining({
          // Should have data from both projects
          coordinates: { latitude: 35.0, longitude: -101.0 }, // From source (target was undefined)
          terrain_results: { s3_key: 'terrain-a', data: 'complete' }, // From source
          layout_results: { s3_key: 'layout-b', data: 'complete' }, // From target
          simulation_results: { s3_key: 'simulation-b', data: 'complete' }, // From target
          report_results: { s3_key: 'report-b', data: 'complete' }, // From target
          metadata: expect.objectContaining({
            quality: 'high', // From source
            status: 'complete', // From target
          }),
        })
      );
    });

    it('should validate keepName is one of the project names (Requirement 4.4)', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);

      // Act
      const result = await lifecycleManager.mergeProjects('project-a', 'project-b', 'invalid-name');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('MERGE_CONFLICT');
      expect(result.message).toContain('Keep name must be either');
    });

    it('should return error if source project not found', async () => {
      // Arrange
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(null) // Source not found
        .mockResolvedValueOnce({} as ProjectData);

      // Act
      const result = await lifecycleManager.mergeProjects('missing-project', 'existing-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
      expect(result.message).toContain('not found');
    });

    it('should return error if target project not found', async () => {
      // Arrange
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce({} as ProjectData)
        .mockResolvedValueOnce(null); // Target not found

      // Act
      const result = await lifecycleManager.mergeProjects('existing-project', 'missing-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
      expect(result.message).toContain('not found');
    });

    it('should delete the correct project based on keepName', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      // Act - Keep source name
      const result = await lifecycleManager.mergeProjects('project-a', 'project-b', 'project-a');

      // Assert
      expect(result.success).toBe(true);
      expect(result.mergedProject).toBe('project-a');
      expect(result.deletedProject).toBe('project-b');
      expect(mockProjectStore.delete).toHaveBeenCalledWith('project-b');
    });

    it('should default to target name if keepName not specified', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      // Act - No keepName specified
      const result = await lifecycleManager.mergeProjects('project-a', 'project-b');

      // Assert
      expect(result.success).toBe(true);
      expect(result.mergedProject).toBe('project-b'); // Should default to target
      expect(result.deletedProject).toBe('project-a');
    });

    it('should clear resolver cache after merge', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      // Act
      await lifecycleManager.mergeProjects('project-a', 'project-b');

      // Assert
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should handle merge errors gracefully', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.mergeProjects('project-a', 'project-b');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Failed to merge');
    });

    it('should update timestamp when merging', async () => {
      // Arrange
      const sourceProject: ProjectData = {
        project_name: 'project-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      const targetProject: ProjectData = {
        project_name: 'project-b',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        metadata: {},
      };

      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sourceProject)
        .mockResolvedValueOnce(targetProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      const beforeMerge = new Date().toISOString();

      // Act
      await lifecycleManager.mergeProjects('project-a', 'project-b');

      // Assert
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'project-b',
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );

      const savedProject = (mockProjectStore.save as jest.Mock).mock.calls[0][1];
      expect(new Date(savedProject.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeMerge).getTime()
      );
    });
  });
});
