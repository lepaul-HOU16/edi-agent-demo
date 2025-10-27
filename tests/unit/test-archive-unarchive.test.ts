/**
 * Unit Tests for Archive/Unarchive Functionality
 * 
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - Archive/Unarchive', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  const mockProject: ProjectData = {
    project_id: 'proj-123-abc',
    project_name: 'test-wind-farm',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    coordinates: {
      latitude: 35.0,
      longitude: -101.0,
    },
    terrain_results: { data: 'terrain' },
    layout_results: { data: 'layout' },
    metadata: {
      turbine_count: 10,
    },
  };

  beforeEach(() => {
    // Create mock instances
    mockProjectStore = new ProjectStore() as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator(mockProjectStore) as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager() as jest.Mocked<SessionContextManager>;

    // Create lifecycle manager with mocks
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('archiveProject', () => {
    it('should archive a project successfully (Requirement 8.1)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(mockProject);
      mockProjectStore.save.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      const result = await lifecycleManager.archiveProject('test-wind-farm');

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-wind-farm');
      expect(result.message).toContain('archived');

      // Verify project was loaded
      expect(mockProjectStore.load).toHaveBeenCalledWith('test-wind-farm');

      // Verify project was saved with archived flag
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'test-wind-farm',
        expect.objectContaining({
          metadata: expect.objectContaining({
            archived: true,
            archived_at: expect.any(String),
          }),
        })
      );

      // Verify cache was cleared
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should return error if project not found (Requirement 8.1)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(null);

      // Act
      const result = await lifecycleManager.archiveProject('nonexistent-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
      expect(result.message).toContain('not found');

      // Verify save was not called
      expect(mockProjectStore.save).not.toHaveBeenCalled();
    });

    it('should clear active project when archiving (Requirement 8.5)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(mockProject);
      mockProjectStore.save.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();
      mockSessionContextManager.getActiveProject.mockResolvedValue('test-wind-farm');
      mockSessionContextManager.setActiveProject.mockResolvedValue();

      // Act
      const result = await lifecycleManager.archiveProject('test-wind-farm', 'session-123');

      // Assert
      expect(result.success).toBe(true);

      // Verify active project was checked
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith('session-123');

      // Verify active project was cleared
      expect(mockSessionContextManager.setActiveProject).toHaveBeenCalledWith('session-123', '');
    });

    it('should not clear active project if different project is active (Requirement 8.5)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(mockProject);
      mockProjectStore.save.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();
      mockSessionContextManager.getActiveProject.mockResolvedValue('other-project');

      // Act
      const result = await lifecycleManager.archiveProject('test-wind-farm', 'session-123');

      // Assert
      expect(result.success).toBe(true);

      // Verify active project was checked
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith('session-123');

      // Verify active project was NOT cleared
      expect(mockSessionContextManager.setActiveProject).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(mockProject);
      mockProjectStore.save.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.archiveProject('test-wind-farm');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('S3 error');
    });
  });

  describe('unarchiveProject', () => {
    const archivedProject: ProjectData = {
      ...mockProject,
      metadata: {
        ...mockProject.metadata,
        archived: true,
        archived_at: '2024-01-15T00:00:00.000Z',
      },
    };

    it('should unarchive a project successfully (Requirement 8.4)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(archivedProject);
      mockProjectStore.save.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      const result = await lifecycleManager.unarchiveProject('test-wind-farm');

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-wind-farm');
      expect(result.message).toContain('unarchived');

      // Verify project was loaded
      expect(mockProjectStore.load).toHaveBeenCalledWith('test-wind-farm');

      // Verify project was saved with archived flag removed
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'test-wind-farm',
        expect.objectContaining({
          metadata: expect.objectContaining({
            archived: false,
            archived_at: undefined,
          }),
        })
      );

      // Verify cache was cleared
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should return error if project not found (Requirement 8.4)', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(null);

      // Act
      const result = await lifecycleManager.unarchiveProject('nonexistent-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
      expect(result.message).toContain('not found');

      // Verify save was not called
      expect(mockProjectStore.save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(archivedProject);
      mockProjectStore.save.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.unarchiveProject('test-wind-farm');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('S3 error');
    });
  });

  describe('listActiveProjects', () => {
    it('should list only active projects (Requirement 8.2)', async () => {
      // Arrange
      const activeProject1: ProjectData = { ...mockProject, project_name: 'active-1' };
      const activeProject2: ProjectData = { ...mockProject, project_name: 'active-2' };
      const archivedProject: ProjectData = {
        ...mockProject,
        project_name: 'archived-1',
        metadata: { ...mockProject.metadata, archived: true },
      };

      mockProjectStore.list.mockResolvedValue([activeProject1, archivedProject, activeProject2]);

      // Act
      const result = await lifecycleManager.listActiveProjects();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.project_name)).toEqual(['active-1', 'active-2']);
      expect(result.every((p) => p.metadata?.archived !== true)).toBe(true);
    });

    it('should return empty array if no active projects', async () => {
      // Arrange
      const archivedProject: ProjectData = {
        ...mockProject,
        metadata: { ...mockProject.metadata, archived: true },
      };

      mockProjectStore.list.mockResolvedValue([archivedProject]);

      // Act
      const result = await lifecycleManager.listActiveProjects();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockProjectStore.list.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.listActiveProjects();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('listArchivedProjects', () => {
    it('should list only archived projects (Requirement 8.3)', async () => {
      // Arrange
      const activeProject: ProjectData = { ...mockProject, project_name: 'active-1' };
      const archivedProject1: ProjectData = {
        ...mockProject,
        project_name: 'archived-1',
        metadata: { ...mockProject.metadata, archived: true },
      };
      const archivedProject2: ProjectData = {
        ...mockProject,
        project_name: 'archived-2',
        metadata: { ...mockProject.metadata, archived: true },
      };

      mockProjectStore.list.mockResolvedValue([activeProject, archivedProject1, archivedProject2]);

      // Act
      const result = await lifecycleManager.listArchivedProjects();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.project_name)).toEqual(['archived-1', 'archived-2']);
      expect(result.every((p) => p.metadata?.archived === true)).toBe(true);
    });

    it('should return empty array if no archived projects', async () => {
      // Arrange
      mockProjectStore.list.mockResolvedValue([mockProject]);

      // Act
      const result = await lifecycleManager.listArchivedProjects();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockProjectStore.list.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.listArchivedProjects();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('searchProjects with archived filter', () => {
    it('should filter by archived status (Requirement 8.2, 8.3)', async () => {
      // Arrange
      const activeProject: ProjectData = { ...mockProject, project_name: 'active-1' };
      const archivedProject: ProjectData = {
        ...mockProject,
        project_name: 'archived-1',
        metadata: { ...mockProject.metadata, archived: true },
      };

      mockProjectStore.list.mockResolvedValue([activeProject, archivedProject]);

      // Act - Search for active projects only
      const activeResults = await lifecycleManager.searchProjects({ archived: false });

      // Assert
      expect(activeResults).toHaveLength(1);
      expect(activeResults[0].project_name).toBe('active-1');

      // Act - Search for archived projects only
      const archivedResults = await lifecycleManager.searchProjects({ archived: true });

      // Assert
      expect(archivedResults).toHaveLength(1);
      expect(archivedResults[0].project_name).toBe('archived-1');
    });

    it('should return all projects when archived filter not specified', async () => {
      // Arrange
      const activeProject: ProjectData = { ...mockProject, project_name: 'active-1' };
      const archivedProject: ProjectData = {
        ...mockProject,
        project_name: 'archived-1',
        metadata: { ...mockProject.metadata, archived: true },
      };

      mockProjectStore.list.mockResolvedValue([activeProject, archivedProject]);

      // Act
      const results = await lifecycleManager.searchProjects({});

      // Assert
      expect(results).toHaveLength(2);
    });
  });
});
